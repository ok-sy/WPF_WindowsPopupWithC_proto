using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;
using Popup.Views.Windows;

// OpaqueWindowCorners의 Win32 레이어드 모서리 창을 실제 HWND로 검증한다.
// 배율이 다른 모니터가 연결되어 있으면 실제 모니터 왕복 후 화면 픽셀까지 비교한다.
internal static class Program
{
    private static int _checks;
    [STAThread]
    private static void Main()
    {
        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        SyntheticChecks();
        RealMonitorRoundTrip();
        app.Shutdown();
        Console.WriteLine($"PASS: {_checks} corner HWND checks (Horizon/video playback not tested)");
    }

    private static void SyntheticChecks()
    {
        var owner = new Window
        {
            WindowStyle = WindowStyle.None, ResizeMode = ResizeMode.NoResize,
            AllowsTransparency = false, Background = Brushes.White, Width = 500, Height = 350,
            Left = -9000, Top = -9000, ShowActivated = false, ShowInTaskbar = false
        };
        var helper = new OpaqueWindowCorners(owner, 6, 0, null, Brushes.Black, Brushes.White);
        owner.SourceInitialized += (_, _) => helper.Attach();
        owner.Show(); Pump();
        IntPtr ownerHandle = new WindowInteropHelper(owner).Handle;
        IntPtr[] corners = Corners(helper);
        IntPtr[] handles = corners.ToArray();
        foreach (IntPtr corner in corners)
        {
            Check(corner != IntPtr.Zero && IsWindowVisible(corner), "Corner HWND visible");
            Check((GetWindowLong(corner, -20) & 0x00080000) != 0, "Corner is a layered window");
            Check(GetWindow(corner, 4) == ownerHandle, "Corner is owned by popup");
        }
        VerifyAll(corners, ownerHandle, 6);

        // 모서리 창 자체 DPI 변경: DefWindowProc만 처리하므로 크기·위치가 바뀌지 않아야 한다.
        foreach (IntPtr corner in corners)
        {
            foreach (int dpi in new[] { 120, 144, 96 })
            {
                Check(GetWindowRect(corner, out NativeRect rect), "Native corner bounds");
                var suggested = rect;
                suggested.Left += 80; suggested.Top += 55; suggested.Right += 95; suggested.Bottom += 70;
                SendDpiChanged(corner, dpi, suggested); Pump();
                VerifyAll(corners, ownerHandle, 6);
            }
        }

        // 본 창 DPI 변경: 같은 HWND를 숨기지 않고 새 물리 크기로 다시 맞춘다.
        foreach (int dpi in new[] { 120, 144, 96, 144, 96 })
        {
            Check(GetWindowRect(ownerHandle, out NativeRect rect), "Owner rectangle before DPI transition");
            double scale = dpi / 96.0 / VisualTreeHelper.GetDpi(owner).DpiScaleX;
            var suggested = new NativeRect
            {
                Left = rect.Left + 80, Top = rect.Top + 55,
                Right = rect.Left + 80 + (int)Math.Round((rect.Right - rect.Left) * scale),
                Bottom = rect.Top + 55 + (int)Math.Round((rect.Bottom - rect.Top) * scale)
            };
            SendDpiChanged(owner, dpi, suggested);
            foreach (IntPtr corner in corners) Check(IsWindowVisible(corner), "Owner DPI must not hide corners");
            Pump();
            Check(Corners(helper).SequenceEqual(handles), "Owner DPI must reuse corner HWNDs");
            VerifyAll(corners, ownerHandle, (int)Math.Ceiling(6 * dpi / 96.0));
        }
        owner.Left += 65; owner.Top += 42; Pump();
        VerifyAll(corners, ownerHandle, 6);

        // 드래그 이동 루프: 본 창 WM_WINDOWPOSCHANGED 시점에 모서리가 이미 같은 묶음으로 옮겨져 있어야 한다.
        int ownerMoves = 0, detachedAtOwnerMove = 0;
        HwndSourceHook probe = (IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled) =>
        {
            if (msg == 0x0047 && GetWindowRect(hwnd, out NativeRect o))
            {
                ownerMoves++;
                foreach (IntPtr corner in corners)
                {
                    GetWindowRect(corner, out NativeRect c);
                    if (!((c.Left == o.Left || c.Right == o.Right) && (c.Top == o.Top || c.Bottom == o.Bottom))) detachedAtOwnerMove++;
                }
            }
            return IntPtr.Zero;
        };
        HwndSource.FromHwnd(ownerHandle)!.AddHook(probe);
        SendMessage(ownerHandle, 0x0231, IntPtr.Zero, IntPtr.Zero);
        for (int step = 0; step < 12; step++)
        {
            Check(GetWindowRect(ownerHandle, out NativeRect before), "Owner rect during drag");
            int targetX = before.Left + 17, targetY = before.Top - 9;
            bool resize = step % 4 == 3;
            int targetWidth = before.Right - before.Left + (resize ? 30 : 0);
            int targetHeight = before.Bottom - before.Top + (resize ? 20 : 0);
            SetWindowPos(ownerHandle, IntPtr.Zero, targetX, targetY, targetWidth, targetHeight, resize ? 0x0014u : 0x0015u);
            Check(GetWindowRect(ownerHandle, out NativeRect after), "Owner rect after drag step");
            Check(after.Left == targetX && after.Top == targetY, "Batched drag keeps the proposed owner position");
            if (resize) Check(after.Right - after.Left == targetWidth && after.Bottom - after.Top == targetHeight, "Batched drag keeps the proposed owner size");
            VerifyAll(corners, ownerHandle, 6);
        }
        SendMessage(ownerHandle, 0x0232, IntPtr.Zero, IntPtr.Zero); Pump();
        HwndSource.FromHwnd(ownerHandle)!.RemoveHook(probe);
        Check(ownerMoves >= 12, "Owner received move notifications");
        Check(detachedAtOwnerMove == 0, "Corners must already be attached when the owner move is reported");
        VerifyAll(corners, ownerHandle, 6);

        owner.Hide(); Pump();
        foreach (IntPtr corner in corners) Check(!IsWindowVisible(corner), "Hidden owner hides corners");
        owner.Show(); Pump();
        foreach (IntPtr corner in corners) Check(IsWindowVisible(corner), "Shown owner shows corners");
        owner.Close(); Pump();
        foreach (IntPtr corner in handles) Check(!IsWindow(corner), "Corner HWNDs destroyed with owner");
    }

    // 배율이 다른 실제 모니터로 드래그했다가 돌아온 뒤 네 모서리 화면 픽셀이 처음과 같아야 한다.
    private static void RealMonitorRoundTrip()
    {
        var monitors = new List<(NativeRect Work, uint Dpi)>();
        EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr monitor, IntPtr dc, ref NativeRect rect, IntPtr data) =>
        {
            var info = new MonitorInfo { Size = Marshal.SizeOf<MonitorInfo>() };
            GetMonitorInfo(monitor, ref info);
            GetDpiForMonitor(monitor, 0, out uint dpi, out _);
            monitors.Add((info.Work, dpi));
            return true;
        }, IntPtr.Zero);
        var home = monitors.FirstOrDefault(m => m.Dpi == 96);
        var other = monitors.FirstOrDefault(m => m.Dpi != home.Dpi);
        if (home.Dpi == 0 || other.Dpi == 0)
        {
            Console.WriteLine("SKIP: real monitor round trip (needs a 100% monitor and a monitor with another scale)");
            return;
        }

        var owner = new Window
        {
            WindowStyle = WindowStyle.None, ResizeMode = ResizeMode.NoResize, AllowsTransparency = false, Topmost = true,
            Background = Brushes.Red, Width = 400, Height = 300, ShowActivated = false, ShowInTaskbar = false,
            WindowStartupLocation = WindowStartupLocation.Manual, Left = home.Work.Left + 200, Top = home.Work.Top + 200
        };
        var helper = new OpaqueWindowCorners(owner, 6, 0, null, Brushes.Red, Brushes.Red);
        owner.SourceInitialized += (_, _) => helper.Attach();
        owner.Show(); Pump(); Thread.Sleep(200); Pump();
        IntPtr ownerHandle = new WindowInteropHelper(owner).Handle;
        Check(GetWindowRect(ownerHandle, out NativeRect start), "Owner rect on home monitor");
        string before = CaptureCorners(ownerHandle);
        Check(before.Contains('#') && before.Contains('.'), "Corner capture shows popup and background");

        for (int trip = 0; trip < 3; trip++)
        {
            Drag(ownerHandle, other.Work.Left + 150 + trip * 23, other.Work.Top + 150);
            Check(GetWindowRect(ownerHandle, out NativeRect away), "Owner rect on other monitor");
            int s = (int)Math.Ceiling(6 * other.Dpi / 96.0);
            VerifyAll(Corners(helper), ownerHandle, s);
            Drag(ownerHandle, start.Left, start.Top);
            VerifyAll(Corners(helper), ownerHandle, 6);
            Check(CaptureCorners(ownerHandle) == before, "Corner pixels after a real monitor round trip must match the original");
        }
        owner.Close(); Pump();
        Console.WriteLine($"Real monitor round trip: 100% <-> {other.Dpi * 100 / 96}% x3 verified by screen capture");
    }

    private static void Drag(IntPtr owner, int targetX, int targetY)
    {
        SendMessage(owner, 0x0231, IntPtr.Zero, IntPtr.Zero);
        GetWindowRect(owner, out NativeRect from);
        for (int i = 1; i <= 25; i++)
        {
            SetWindowPos(owner, IntPtr.Zero, from.Left + (targetX - from.Left) * i / 25, from.Top + (targetY - from.Top) * i / 25, 0, 0, 0x0015);
            Pump();
        }
        SendMessage(owner, 0x0232, IntPtr.Zero, IntPtr.Zero);
        Pump(); Thread.Sleep(200); Pump();
    }

    // 네 모서리 주변 12×12 화면 픽셀을 '#'(팝업 빨강)·'+'(반투명 가장자리)·'.'(배경)로 기록한다.
    private static string CaptureCorners(IntPtr owner)
    {
        GetWindowRect(owner, out NativeRect o);
        const int size = 12;
        var text = new System.Text.StringBuilder();
        foreach ((int x, int y) in new[] { (o.Left - 2, o.Top - 2), (o.Right - size + 2, o.Top - 2), (o.Left - 2, o.Bottom - size + 2), (o.Right - size + 2, o.Bottom - size + 2) })
        {
            uint[] pixels = CaptureScreen(x, y, size, size);
            foreach (uint pixel in pixels)
            {
                int r = (int)(pixel >> 16 & 0xFF), g = (int)(pixel >> 8 & 0xFF);
                text.Append(r > 200 && g < 60 ? '#' : r - g > 60 ? '+' : '.');
            }
            text.Append('|');
        }
        return text.ToString();
    }

    private static uint[] CaptureScreen(int x, int y, int width, int height)
    {
        var header = new BitmapInfoHeader { Size = Marshal.SizeOf<BitmapInfoHeader>(), Width = width, Height = -height, Planes = 1, BitCount = 32 };
        IntPtr screen = GetDC(IntPtr.Zero);
        IntPtr memory = CreateCompatibleDC(screen);
        IntPtr bitmap = CreateDIBSection(screen, ref header, 0, out IntPtr bits, IntPtr.Zero, 0);
        IntPtr previous = SelectObject(memory, bitmap);
        BitBlt(memory, 0, 0, width, height, screen, x, y, 0x00CC0020 | 0x40000000); // SRCCOPY | CAPTUREBLT(레이어드 창 포함)
        var pixels = new int[width * height];
        Marshal.Copy(bits, pixels, 0, pixels.Length);
        SelectObject(memory, previous);
        DeleteObject(bitmap);
        DeleteDC(memory);
        ReleaseDC(IntPtr.Zero, screen);
        return pixels.Select(p => (uint)p).ToArray();
    }

    private static IntPtr[] Corners(OpaqueWindowCorners helper) =>
        (IntPtr[])typeof(OpaqueWindowCorners).GetField("_corners", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(helper)!;

    private static void VerifyAll(IntPtr[] corners, IntPtr owner, int expectedPixels)
    {
        Check(GetWindowRect(owner, out NativeRect o), "Owner bounds available");
        for (int i = 0; i < corners.Length; i++)
        {
            Check(GetWindowRect(corners[i], out NativeRect c), "Corner bounds available");
            int x = i % 2 == 1 ? o.Right - expectedPixels : o.Left;
            int y = i >= 2 ? o.Bottom - expectedPixels : o.Top;
            Check(c.Left == x && c.Top == y, "Corner must stay attached to its owner corner");
            Check(c.Right - c.Left == expectedPixels && c.Bottom - c.Top == expectedPixels, "Corner must match the owner-DPI physical radius");
            Check(IsWindowVisible(corners[i]), "Corner must stay visible");
        }
    }

    private static void SendDpiChanged(IntPtr hwnd, int dpi, NativeRect suggested)
    {
        IntPtr buffer = Marshal.AllocHGlobal(Marshal.SizeOf<NativeRect>());
        try
        {
            Marshal.StructureToPtr(suggested, buffer, false);
            SendMessage(hwnd, 0x02E0, new IntPtr(dpi | (dpi << 16)), buffer);
        }
        finally { Marshal.FreeHGlobal(buffer); }
    }

    private static void SendDpiChanged(Window window, int dpi, NativeRect suggested) =>
        SendDpiChanged(new WindowInteropHelper(window).Handle, dpi, suggested);

    private static void Pump()
    {
        var frame = new DispatcherFrame();
        Dispatcher.CurrentDispatcher.BeginInvoke(DispatcherPriority.ApplicationIdle, new Action(() => frame.Continue = false));
        Dispatcher.PushFrame(frame);
    }

    private static void Check(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
        _checks++;
    }

    private delegate bool MonitorEnumProc(IntPtr monitor, IntPtr dc, ref NativeRect rect, IntPtr data);
    [StructLayout(LayoutKind.Sequential)] private struct NativeRect { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] private struct MonitorInfo { public int Size; public NativeRect Monitor, Work; public uint Flags; }
    [StructLayout(LayoutKind.Sequential)]
    private struct BitmapInfoHeader
    {
        public int Size, Width, Height; public short Planes, BitCount;
        public int Compression, SizeImage, XPelsPerMeter, YPelsPerMeter, ClrUsed, ClrImportant;
    }
    [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr hwnd, out NativeRect rect);
    [DllImport("user32.dll")] private static extern IntPtr GetWindow(IntPtr hwnd, uint command);
    [DllImport("user32.dll")] private static extern int GetWindowLong(IntPtr hwnd, int index);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern bool IsWindow(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr hwnd, uint message, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] private static extern bool EnumDisplayMonitors(IntPtr dc, IntPtr clip, MonitorEnumProc callback, IntPtr data);
    [DllImport("user32.dll")] private static extern bool GetMonitorInfo(IntPtr monitor, ref MonitorInfo info);
    [DllImport("shcore.dll")] private static extern int GetDpiForMonitor(IntPtr monitor, int type, out uint dpiX, out uint dpiY);
    [DllImport("user32.dll")] private static extern IntPtr GetDC(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern int ReleaseDC(IntPtr hwnd, IntPtr dc);
    [DllImport("gdi32.dll")] private static extern IntPtr CreateCompatibleDC(IntPtr dc);
    [DllImport("gdi32.dll")] private static extern bool DeleteDC(IntPtr dc);
    [DllImport("gdi32.dll")] private static extern IntPtr SelectObject(IntPtr dc, IntPtr obj);
    [DllImport("gdi32.dll")] private static extern bool DeleteObject(IntPtr obj);
    [DllImport("gdi32.dll")] private static extern bool BitBlt(IntPtr dest, int x, int y, int width, int height, IntPtr source, int sx, int sy, uint op);
    [DllImport("gdi32.dll")] private static extern IntPtr CreateDIBSection(IntPtr dc, ref BitmapInfoHeader header, uint usage, out IntPtr bits, IntPtr section, uint offset);
}
