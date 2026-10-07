using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
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
     * 2. 모서리 창 4개: 잘라낸 자리에 per-pixel alpha 레이어드 창(HwndSource)을 띄워
     *    일반 팝업과 같은 WPF Border(CornerRadius)로 안티앨리어싱된 모서리를 그린다.
     *
     * 모서리 창은 Radius 크기(100% DPI 기준 6px)의 정적 화면이라 생성·DPI 변경 때만 다시 그린다.
     * 영상 프레임은 여전히 불투명 본 창에서만 갱신되므로 AllowsTransparency=false의 성능 이점은 유지된다.
     * 팝업 콘텐츠는 바깥 여백(28/24) 안쪽에 있어 모서리 아래는 항상 Header/본문 단색이므로,
     * 모서리 창이 그 색을 그대로 그려도 본 창과 이음새가 생기지 않는다.
     */
    internal sealed class OpaqueWindowCorners : IDisposable
    {
        private readonly Window _window;
        private readonly double _radius;
        private readonly double _borderThickness;
        private readonly Brush? _borderBrush;
        private readonly Brush? _topFill;
        private readonly Brush? _bottomFill;
        private readonly HwndSource?[] _corners = new HwndSource?[4];
        private HwndSource? _source;
        private int _cornerPixels;
        private int _regionWidth;
        private int _regionHeight;
        private bool _disposed;

        public OpaqueWindowCorners(
            Window window,
            double radius,
            double borderThickness,
            Brush? borderBrush,
            Brush? topFill,
            Brush? bottomFill)
        {
            _window = window;
            _radius = radius;
            _borderThickness = borderThickness;
            _borderBrush = borderBrush;
            _topFill = topFill;
            _bottomFill = bottomFill;
        }

        // SourceInitialized 이후(본 창 HWND 생성 후)에 호출한다.
        public void Attach()
        {
            _source = PresentationSource.FromVisual(_window) as HwndSource;
            if (_source == null)
            {
                return;
            }

            _source.AddHook(WndProc);
            _window.IsVisibleChanged += Window_IsVisibleChanged;
            _window.DpiChanged += Window_DpiChanged;
            _window.Closed += (_, _) => Dispose();
            Rebuild();
        }

        private void Window_DpiChanged(object sender, DpiChangedEventArgs e)
        {
            HideCorners();
            // WPF가 새 DPI와 제안된 창 위치를 적용한 뒤 같은 좌표로 재생성한다.
            _window.Dispatcher.BeginInvoke(System.Windows.Threading.DispatcherPriority.Loaded,
                new Action(() => { if (!_disposed) Rebuild(); }));
        }

        private void HideCorners()
        {
            foreach (var corner in _corners)
                if (corner != null) ShowWindow(corner.Handle, SwHide);
        }

        private void Window_IsVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            int command = _window.IsVisible ? SwShowNoActivate : SwHide;
            foreach (HwndSource? corner in _corners)
            {
                if (corner != null)
                {
                    ShowWindow(corner.Handle, command);
                }
            }
        }

        private void Rebuild()
        {
            if (_source?.CompositionTarget == null || _disposed)
            {
                return;
            }

            DisposeCorners();

            double scale = _source.CompositionTarget.TransformToDevice.M11;
            _cornerPixels = Math.Max(1, (int)Math.Ceiling(_radius * scale));
            _regionWidth = 0;
            _regionHeight = 0;

            for (int i = 0; i < _corners.Length; i++)
            {
                _corners[i] = CreateCorner(isRight: i % 2 == 1, isBottom: i >= 2, scale);
            }

            UpdateBounds();
            if (_window.IsVisible)
            {
                Window_IsVisibleChanged(_window, default);
            }
        }

        private HwndSource CreateCorner(bool isRight, bool isBottom, double ownerScale)
        {
            var parameters = new HwndSourceParameters("PopupWindowCorner", _cornerPixels, _cornerPixels)
            {
                WindowStyle = WsPopup,
                ExtendedWindowStyle = WsExToolWindow | WsExNoActivate | WsExTransparent | WsExTopmost,
                UsesPerPixelTransparency = true,
                ParentWindow = _source!.Handle,
            };
            var corner = new HwndSource(parameters);

            // 모서리 창이 다른 DPI로 잡히더라도 본 창에서 계산한 물리 픽셀 크기를 그대로 맞춘다.
            double cornerScale = corner.CompositionTarget?.TransformToDevice.M11 ?? ownerScale;
            double size = _cornerPixels / cornerScale;
            double radius = _radius * ownerScale / cornerScale;
            double thickness = _borderThickness * ownerScale / cornerScale;

            // HWND의 s×s 물리 픽셀에 정확히 대응하는 quarter-circle을 직접 그린다.
            // Border의 정렬/레이아웃 반올림이 작은 창의 경계를 넘지 않도록 한다.
            var geometry = new StreamGeometry();
            using (var context = geometry.Open())
            {
                context.BeginFigure(new Point(size, 0), true, true);
                context.LineTo(new Point(size, size), true, false);
                context.LineTo(new Point(0, size), true, false);
                context.LineTo(new Point(0, radius), true, false);
                context.ArcTo(new Point(radius, 0), new Size(radius, radius),
                    0, false, SweepDirection.Clockwise, true, false);
            }
            geometry.Freeze();
            var path = new System.Windows.Shapes.Path
            {
                Data = geometry, Fill = isBottom ? _bottomFill : _topFill,
                Width = size, Height = size,
                RenderTransform = new MatrixTransform(
                    isRight ? -1 : 1, 0, 0, isBottom ? -1 : 1,
                    isRight ? size : 0, isBottom ? size : 0)
            };
            var root = new Canvas { Width = size, Height = size, ClipToBounds = true };
            root.Children.Add(path);
            corner.RootVisual = root;
            if (corner.CompositionTarget != null)
            {
                corner.CompositionTarget.BackgroundColor = Colors.Transparent;
            }
            return corner;
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WmWindowPosChanged)
            {
                UpdateBounds();
            }
            else if (msg == 0x0232) // WM_EXITSIZEMOVE
            {
                // 같은 DPI의 이동은 위치만 갱신해 불필요한 HWND 재생성·깜빡임을 피한다.
                UpdateBounds();
            }
            return IntPtr.Zero;
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

            for (int i = 0; i < _corners.Length; i++)
            {
                HwndSource? corner = _corners[i];
                if (corner == null)
                {
                    continue;
                }
                int x = i % 2 == 1 ? rect.Right - s : rect.Left;
                int y = i >= 2 ? rect.Bottom - s : rect.Top;
                SetWindowPos(corner.Handle, IntPtr.Zero, x, y, s, s,
                    SwpNoZOrder | SwpNoOwnerZOrder | SwpNoActivate);
            }
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

        private void DisposeCorners()
        {
            for (int i = 0; i < _corners.Length; i++)
            {
                _corners[i]?.Dispose();
                _corners[i] = null;
            }
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
            _window.DpiChanged -= Window_DpiChanged;
            DisposeCorners();
        }

        private const int WsPopup = unchecked((int)0x80000000);
        private const int WsExTopmost = 0x00000008;
        private const int WsExTransparent = 0x00000020;
        private const int WsExToolWindow = 0x00000080;
        private const int WsExNoActivate = 0x08000000;
        private const int WmWindowPosChanged = 0x0047;
        private const int SwHide = 0;
        private const int SwShowNoActivate = 4;
        private const uint SwpNoZOrder = 0x0004;
        private const uint SwpNoActivate = 0x0010;
        private const uint SwpNoOwnerZOrder = 0x0200;
        private const int RgnDiff = 4;

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeRect
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetWindowRect(IntPtr hwnd, out NativeRect rect);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetWindowPos(IntPtr hwnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);

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
