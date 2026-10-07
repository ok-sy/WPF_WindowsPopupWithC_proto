using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;

namespace Popup.Views.Windows
{
    /*
     * [설계 25] 불투명 창(VIDEO / VIDEO+QUIZ)의 둥근 모서리.
     *
     * DWM rounded corner는 Horizon(VMware) 환경에서 동작하지 않고,
     * CreateRoundRectRgn + SetWindowRgn은 Region이 픽셀 단위 on/off라 곡선에 계단이 생긴다.
     *
     * 그래서 역할을 둘로 나눈다.
     * 1. 본 창: SetWindowRgn으로 네 모서리의 정사각형(Radius 크기)만 직사각형으로 잘라낸다.
     *    직사각형 Region은 경계가 정확히 픽셀에 맞으므로 계단이 생기지 않는다.
     * 2. 모서리 창 4개: 잘라낸 자리에 per-pixel alpha 레이어드 창을 띄워
     *    안티앨리어싱된 quarter-circle을 그린다.
     *
     * [설계 26] 모서리 창은 WPF HwndSource가 아니라 순수 Win32 레이어드 창이다.
     * HwndSource 모서리는 다른 배율 모니터를 오가면 WPF의 레이어드 렌더 상태가 창 DPI와 어긋나
     * 6px 칸에 4px 모서리가 그려지는 등 깨졌다(150%→100% 실모니터 재현, 이전 숨김·재생성 방식도 동일).
     * 지금은 본 창 DPI로 정한 물리 픽셀 비트맵을 직접 만들어 UpdateLayeredWindow로 위치·크기·내용을
     * 한 번에 적용한다. 모서리 창은 WM_DPICHANGED를 DefWindowProc에 맡기므로 OS·WPF가 크기를 바꾸지 않는다.
     *
     * 모서리 비트맵은 Radius 크기(100% DPI 기준 6px)의 정적 이미지라 물리 크기가 바뀔 때만 다시 만든다.
     * 영상 프레임은 여전히 불투명 본 창에서만 갱신되므로 AllowsTransparency=false의 성능 이점은 유지된다.
     * 팝업 콘텐츠는 바깥 여백(28/24) 안쪽에 있어 모서리 아래는 항상 Header/본문 단색이므로,
     * 모서리 창이 그 색을 그대로 그려도 본 창과 이음새가 생기지 않는다.
     */
    internal sealed class OpaqueWindowCorners : IDisposable
    {
        private static ushort s_windowClass;

        private readonly Window _window;
        private readonly double _radius;
        private readonly Brush? _topFill;
        private readonly Brush? _bottomFill;
        private readonly IntPtr[] _corners = new IntPtr[4];
        private readonly IntPtr[] _bitmaps = new IntPtr[4];
        // 각 모서리 창에 마지막으로 UpdateLayeredWindow로 적용한 비트맵 크기(물리 px)
        private readonly int[] _appliedPixels = new int[4];
        private HwndSource? _source;
        private int _cornerPixels;
        private int _bitmapPixels;
        private double _ownerScale = 1;
        private int _regionWidth;
        private int _regionHeight;
        private bool _disposed;
        private bool _inMoveLoop;
        private bool _batchMoving;

        public OpaqueWindowCorners(
            Window window,
            double radius,
            double borderThickness,
            Brush? borderBrush,
            Brush? topFill,
            Brush? bottomFill)
        {
            // 외곽 테두리 두께는 현재 0이며 모서리 창은 채우기만 그린다(borderThickness/borderBrush 미사용).
            _window = window;
            _radius = radius;
            _topFill = topFill;
            _bottomFill = bottomFill;
        }

        // SourceInitialized 이후(본 창 HWND 생성 후)에 호출한다.
        public void Attach()
        {
            _source = PresentationSource.FromVisual(_window) as HwndSource;
            if (_source?.CompositionTarget == null)
            {
                return;
            }

            _source.AddHook(WndProc);
            _window.IsVisibleChanged += Window_IsVisibleChanged;
            _window.Closed += (_, _) => Dispose();
            ApplyOwnerScale(_source.CompositionTarget.TransformToDevice.M11);
            for (int i = 0; i < _corners.Length; i++)
            {
                _corners[i] = CreateCornerWindow(_source.Handle);
            }

            UpdateBounds();
            if (_window.IsVisible)
            {
                Window_IsVisibleChanged(_window, default);
            }
        }

        private void Window_IsVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            int command = _window.IsVisible ? SwShowNoActivate : SwHide;
            foreach (IntPtr corner in _corners)
            {
                if (corner != IntPtr.Zero)
                {
                    ShowWindow(corner, command);
                }
            }
        }

        private void ApplyOwnerScale(double scale)
        {
            _ownerScale = scale;
            _cornerPixels = Math.Max(1, (int)Math.Ceiling(_radius * scale));
            _regionWidth = 0;
            _regionHeight = 0;
        }

        private static IntPtr CreateCornerWindow(IntPtr owner)
        {
            if (s_windowClass == 0)
            {
                // 메시지 처리는 DefWindowProc만 사용한다. WM_DPICHANGED에도 크기를 바꾸지 않는다.
                var windowClass = new WndClassEx
                {
                    Size = Marshal.SizeOf<WndClassEx>(),
                    WndProc = GetProcAddress(GetModuleHandle("user32.dll"), "DefWindowProcW"),
                    Instance = GetModuleHandle(null),
                    ClassName = "PopupWindowCornerLayered",
                };
                s_windowClass = RegisterClassEx(ref windowClass);
            }
            return CreateWindowEx(
                WsExLayered | WsExToolWindow | WsExNoActivate | WsExTransparent | WsExTopmost,
                new IntPtr(s_windowClass), null, WsPopup, 0, 0, 0, 0,
                owner, IntPtr.Zero, GetModuleHandle(null), IntPtr.Zero);
        }

        // 본 창 DPI 기준 물리 픽셀 크기로 모서리 4개의 premultiplied BGRA 비트맵을 만든다.
        private void EnsureBitmaps()
        {
            int s = _cornerPixels;
            if (_bitmapPixels == s)
            {
                return;
            }

            double radius = _radius * _ownerScale;
            for (int i = 0; i < _bitmaps.Length; i++)
            {
                bool isRight = i % 2 == 1;
                bool isBottom = i >= 2;
                var geometry = new StreamGeometry();
                using (var context = geometry.Open())
                {
                    context.BeginFigure(new Point(s, 0), true, true);
                    context.LineTo(new Point(s, s), true, false);
                    context.LineTo(new Point(0, s), true, false);
                    context.LineTo(new Point(0, radius), true, false);
                    context.ArcTo(new Point(radius, 0), new Size(radius, radius),
                        0, false, SweepDirection.Clockwise, true, false);
                }
                geometry.Freeze();

                var visual = new DrawingVisual();
                using (DrawingContext drawing = visual.RenderOpen())
                {
                    drawing.PushTransform(new MatrixTransform(
                        isRight ? -1 : 1, 0, 0, isBottom ? -1 : 1,
                        isRight ? s : 0, isBottom ? s : 0));
                    drawing.DrawGeometry(isBottom ? _bottomFill : _topFill, null, geometry);
                }
                // 96 DPI 렌더 = 1 DIP당 1 물리 픽셀. 화면 배율과 무관하게 s×s 픽셀을 그대로 만든다.
                var target = new System.Windows.Media.Imaging.RenderTargetBitmap(s, s, 96, 96, PixelFormats.Pbgra32);
                target.Render(visual);
                var pixels = new byte[s * s * 4];
                target.CopyPixels(pixels, s * 4, 0);

                var header = new BitmapInfoHeader
                {
                    Size = Marshal.SizeOf<BitmapInfoHeader>(),
                    Width = s,
                    Height = -s, // top-down
                    Planes = 1,
                    BitCount = 32,
                };
                IntPtr bitmap = CreateDIBSection(IntPtr.Zero, ref header, 0, out IntPtr bits, IntPtr.Zero, 0);
                if (bitmap == IntPtr.Zero)
                {
                    continue;
                }
                Marshal.Copy(pixels, 0, bits, pixels.Length);
                if (_bitmaps[i] != IntPtr.Zero)
                {
                    DeleteObject(_bitmaps[i]);
                }
                _bitmaps[i] = bitmap;
                _appliedPixels[i] = 0;
            }
            _bitmapPixels = s;
        }

        // 위치·크기·내용을 한 번에 적용한다(크기가 바뀐 모서리에만 사용).
        private void ApplyLayered(int index, NativeRect rect)
        {
            IntPtr corner = _corners[index];
            IntPtr bitmap = _bitmaps[index];
            if (corner == IntPtr.Zero || bitmap == IntPtr.Zero)
            {
                return;
            }

            IntPtr screen = GetDC(IntPtr.Zero);
            IntPtr memory = CreateCompatibleDC(screen);
            IntPtr previous = SelectObject(memory, bitmap);
            var destination = new NativePoint { X = rect.Left, Y = rect.Top };
            var size = new NativeSize { Width = _bitmapPixels, Height = _bitmapPixels };
            var source = new NativePoint();
            var blend = new BlendFunction { Op = 0, Flags = 0, SourceConstantAlpha = 255, AlphaFormat = 1 };
            if (UpdateLayeredWindow(corner, screen, ref destination, ref size, memory, ref source, 0, ref blend, UlwAlpha))
            {
                _appliedPixels[index] = _bitmapPixels;
            }
            SelectObject(memory, previous);
            DeleteDC(memory);
            ReleaseDC(IntPtr.Zero, screen);
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WmDpiChanged && !_disposed)
            {
                // WPF가 권장 rect를 적용하기 전에 새 물리 크기의 비트맵을 준비한다. 모서리를 숨기지 않으며
                // Region·모서리 크기는 아래 UpdateBounds와 뒤따르는 WM_WINDOWPOSCHANGED에서 함께 맞춘다.
                ApplyOwnerScale((wParam.ToInt64() & 0xFFFF) / 96.0);
                UpdateBounds();
            }
            else if (msg == WmWindowPosChanging && _inMoveLoop && !_batchMoving && lParam != IntPtr.Zero)
            {
                MoveTogether(lParam);
            }
            else if (msg == WmWindowPosChanged)
            {
                UpdateBounds();
            }
            else if (msg == WmEnterSizeMove)
            {
                _inMoveLoop = true;
            }
            else if (msg == WmExitSizeMove)
            {
                _inMoveLoop = false;
                UpdateBounds();
            }
            return IntPtr.Zero;
        }

        /*
         * 드래그 중 본 창이 먼저 움직이고 모서리 4개가 WM_WINDOWPOSCHANGED에서 각각 따라가면
         * 그 사이에 DWM 합성이 끼어 모서리가 본체에서 떨어져 보인다(영상 재생 중 두드러짐).
         * 이동 루프가 제안한 본 창 위치로 본 창과 모서리 4개를 DeferWindowPos 한 묶음으로 옮기고,
         * 원래 제안은 NOMOVE/NOSIZE로 바꿔 중복 이동을 막는다. 이동 루프·DPI 권장 rect 계산은 OS가 그대로 한다.
         * 비트맵 크기가 아직 적용되지 않은 모서리는 묶음에서 빼고 WM_WINDOWPOSCHANGED에서 내용과 함께 맞춘다.
         */
        private void MoveTogether(IntPtr lParam)
        {
            var proposal = Marshal.PtrToStructure<NativeWindowPos>(lParam);
            if ((proposal.Flags & (SwpNoMove | SwpNoSize)) == (SwpNoMove | SwpNoSize)
                || _source == null || !GetWindowRect(_source.Handle, out NativeRect current))
            {
                return;
            }

            int x = (proposal.Flags & SwpNoMove) != 0 ? current.Left : proposal.X;
            int y = (proposal.Flags & SwpNoMove) != 0 ? current.Top : proposal.Y;
            int width = (proposal.Flags & SwpNoSize) != 0 ? current.Right - current.Left : proposal.Width;
            int height = (proposal.Flags & SwpNoSize) != 0 ? current.Bottom - current.Top : proposal.Height;
            var target = new NativeRect { Left = x, Top = y, Right = x + width, Bottom = y + height };
            int s = _cornerPixels;

            IntPtr batch = BeginDeferWindowPos(1 + _corners.Length);
            if (batch == IntPtr.Zero)
            {
                return;
            }
            batch = DeferWindowPos(batch, _source.Handle, IntPtr.Zero, x, y, width, height,
                (proposal.Flags & (SwpNoSize | SwpNoRedraw)) | SwpNoZOrder | SwpNoActivate);
            for (int i = 0; i < _corners.Length && batch != IntPtr.Zero; i++)
            {
                if (_corners[i] == IntPtr.Zero || _appliedPixels[i] != s)
                {
                    continue;
                }
                NativeRect rect = CornerRect(target, i, s);
                batch = DeferWindowPos(batch, _corners[i], IntPtr.Zero, rect.Left, rect.Top, 0, 0,
                    SwpNoSize | SwpNoZOrder | SwpNoOwnerZOrder | SwpNoActivate);
            }
            if (batch == IntPtr.Zero)
            {
                // 묶음 생성 실패 시 원래 제안대로 이동하고 WM_WINDOWPOSCHANGED에서 모서리를 따라가게 둔다.
                return;
            }

            _batchMoving = true;
            try
            {
                if (!EndDeferWindowPos(batch))
                {
                    return;
                }
            }
            finally
            {
                _batchMoving = false;
            }
            proposal.Flags |= SwpNoMove | SwpNoSize;
            Marshal.StructureToPtr(proposal, lParam, false);
        }

        // 본 창 크기가 바뀌면 Region을 다시 만들고, 이동하면 모서리 창을 따라 옮긴다.
        private void UpdateBounds()
        {
            if (_source == null || _disposed || !GetWindowRect(_source.Handle, out NativeRect rect))
            {
                return;
            }

            int width = rect.Right - rect.Left;
            int height = rect.Bottom - rect.Top;
            int s = _cornerPixels;
            if (width < s * 2 || height < s * 2)
            {
                return;
            }

            if (width != _regionWidth || height != _regionHeight)
            {
                ApplyRegion(width, height, s);
            }

            EnsureBitmaps();
            for (int i = 0; i < _corners.Length; i++)
            {
                if (_corners[i] == IntPtr.Zero)
                {
                    continue;
                }
                NativeRect target = CornerRect(rect, i, s);
                if (_appliedPixels[i] != s)
                {
                    ApplyLayered(i, target);
                }
                else
                {
                    SetWindowPos(_corners[i], IntPtr.Zero, target.Left, target.Top, 0, 0,
                        SwpNoSize | SwpNoZOrder | SwpNoOwnerZOrder | SwpNoActivate);
                }
            }
        }

        private static NativeRect CornerRect(NativeRect owner, int index, int s)
        {
            int x = index % 2 == 1 ? owner.Right - s : owner.Left;
            int y = index >= 2 ? owner.Bottom - s : owner.Top;
            return new NativeRect { Left = x, Top = y, Right = x + s, Bottom = y + s };
        }

        private void ApplyRegion(int width, int height, int s)
        {
            IntPtr region = CreateRectRgn(0, 0, width, height);
            foreach ((int x, int y) in new[] { (0, 0), (width - s, 0), (0, height - s), (width - s, height - s) })
            {
                IntPtr cut = CreateRectRgn(x, y, x + s, y + s);
                CombineRgn(region, region, cut, RgnDiff);
                DeleteObject(cut);
            }

            // 성공하면 HRGN 소유권이 Windows로 넘어가므로 실패한 경우에만 해제한다.
            if (SetWindowRgn(_source!.Handle, region, true) == 0)
            {
                DeleteObject(region);
                return;
            }
            _regionWidth = width;
            _regionHeight = height;
        }

        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }
            _disposed = true;
            _source?.RemoveHook(WndProc);
            _window.IsVisibleChanged -= Window_IsVisibleChanged;
            for (int i = 0; i < _corners.Length; i++)
            {
                if (_corners[i] != IntPtr.Zero)
                {
                    DestroyWindow(_corners[i]);
                    _corners[i] = IntPtr.Zero;
                }
                if (_bitmaps[i] != IntPtr.Zero)
                {
                    DeleteObject(_bitmaps[i]);
                    _bitmaps[i] = IntPtr.Zero;
                }
            }
        }

        private const int WsPopup = unchecked((int)0x80000000);
        private const int WsExTopmost = 0x00000008;
        private const int WsExTransparent = 0x00000020;
        private const int WsExToolWindow = 0x00000080;
        private const int WsExLayered = 0x00080000;
        private const int WsExNoActivate = 0x08000000;
        private const int WmWindowPosChanging = 0x0046;
        private const int WmWindowPosChanged = 0x0047;
        private const int WmEnterSizeMove = 0x0231;
        private const int WmExitSizeMove = 0x0232;
        private const int WmDpiChanged = 0x02E0;
        private const int SwHide = 0;
        private const int SwShowNoActivate = 4;
        private const uint SwpNoSize = 0x0001;
        private const uint SwpNoMove = 0x0002;
        private const uint SwpNoZOrder = 0x0004;
        private const uint SwpNoRedraw = 0x0008;
        private const uint SwpNoActivate = 0x0010;
        private const uint SwpNoOwnerZOrder = 0x0200;
        private const uint UlwAlpha = 0x00000002;
        private const int RgnDiff = 4;

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeRect
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct NativePoint
        {
            public int X;
            public int Y;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeSize
        {
            public int Width;
            public int Height;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BlendFunction
        {
            public byte Op;
            public byte Flags;
            public byte SourceConstantAlpha;
            public byte AlphaFormat;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeWindowPos
        {
            public IntPtr Hwnd;
            public IntPtr InsertAfter;
            public int X;
            public int Y;
            public int Width;
            public int Height;
            public uint Flags;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BitmapInfoHeader
        {
            public int Size;
            public int Width;
            public int Height;
            public short Planes;
            public short BitCount;
            public int Compression;
            public int SizeImage;
            public int XPelsPerMeter;
            public int YPelsPerMeter;
            public int ClrUsed;
            public int ClrImportant;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct WndClassEx
        {
            public int Size;
            public int Style;
            public IntPtr WndProc;
            public int ClassExtra;
            public int WindowExtra;
            public IntPtr Instance;
            public IntPtr Icon;
            public IntPtr Cursor;
            public IntPtr Background;
            public string? MenuName;
            public string ClassName;
            public IntPtr SmallIcon;
        }

        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern ushort RegisterClassEx(ref WndClassEx windowClass);

        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr CreateWindowEx(int exStyle, IntPtr className, string? windowName, int style,
            int x, int y, int width, int height, IntPtr parent, IntPtr menu, IntPtr instance, IntPtr param);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool DestroyWindow(IntPtr hwnd);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr GetModuleHandle(string? moduleName);

        [DllImport("kernel32.dll", CharSet = CharSet.Ansi)]
        private static extern IntPtr GetProcAddress(IntPtr module, string procName);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UpdateLayeredWindow(IntPtr hwnd, IntPtr destinationDc, ref NativePoint destination,
            ref NativeSize size, IntPtr sourceDc, ref NativePoint source, int colorKey, ref BlendFunction blend, uint flags);

        [DllImport("user32.dll")]
        private static extern IntPtr GetDC(IntPtr hwnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hwnd, IntPtr dc);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateCompatibleDC(IntPtr dc);

        [DllImport("gdi32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool DeleteDC(IntPtr dc);

        [DllImport("gdi32.dll")]
        private static extern IntPtr SelectObject(IntPtr dc, IntPtr gdiObject);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateDIBSection(IntPtr dc, ref BitmapInfoHeader header, uint usage,
            out IntPtr bits, IntPtr section, uint offset);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetWindowRect(IntPtr hwnd, out NativeRect rect);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetWindowPos(IntPtr hwnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);

        [DllImport("user32.dll")]
        private static extern IntPtr BeginDeferWindowPos(int count);

        [DllImport("user32.dll")]
        private static extern IntPtr DeferWindowPos(IntPtr batch, IntPtr hwnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool EndDeferWindowPos(IntPtr batch);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool ShowWindow(IntPtr hwnd, int command);

        [DllImport("user32.dll")]
        private static extern int SetWindowRgn(IntPtr hwnd, IntPtr region, [MarshalAs(UnmanagedType.Bool)] bool redraw);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateRectRgn(int left, int top, int right, int bottom);

        [DllImport("gdi32.dll")]
        private static extern int CombineRgn(IntPtr destination, IntPtr source1, IntPtr source2, int mode);

        [DllImport("gdi32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool DeleteObject(IntPtr handle);
    }
}
