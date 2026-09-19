using Microsoft.Web.WebView2.Core;
using System;
using System.IO;
using System.Text.Json;
using System.Web;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Threading;
using Popup.Models;

namespace Popup.Views.Contents
{
    public partial class VideoPopupView : UserControl
    {
        /*
         * 전달받은 원본 영상 경로다.
         */
        private readonly string _videoPath;

        /*
         * 현재 영상이 YouTube 영상인지 나타낸다.
         */
        private readonly bool _useWebPlayer;

        private readonly bool _isYouTubeVideo;

        private double _webDurationSeconds;
        private double _webPositionSeconds;

        /*
         * MediaElement가 영상을 정상적으로 열었는지 나타낸다.
         */
        private bool _isMediaOpened;

        /*
         * 영상 파일, URL 또는 WebView 페이지를 불러오지 못해
         * 사용자가 정상적으로 시청할 수 없는 상태인지 나타낸다.
         *
         * 이 값은 영상을 완료 처리하기 위한 값이 아니다.
         * 필수 영상의 재생 자체가 불가능할 때 팝업 창을 닫을 수 있도록
         * PopupWindow가 닫기 제한을 판단하는 데만 사용한다.
         */
        public bool HasPlaybackFailed { get; private set; }

        /*
         * 영상 재생 위치와 UI를 동기화하는 타이머다.
         */
        private readonly DispatcherTimer _progressTimer;

        /*
         * [기준 4] 서버 저장용 10초 주기 타이머(_progressSaveTimer)와 VideoProgressSaveRequested 이벤트를 제거했다.
         * 재생 중에는 누적 시청·최대 도달 위치만 로컬에서 계산하고, 팝업이 닫힐 때 PopupManager가
         * GetFinalProgress()로 한 번 읽어 결과 API에 담는다. 완료 판정은 서버가 한다.
         */

        private double _maximumPositionSeconds;
        private double _watchedSeconds;
        private double _lastObservedPositionSeconds;
        /* 가장 최근에 계산한 진행 스냅샷. 창이 닫힐 때 결과 항목(VIDEO_WATCHED)에 담긴다. */
        private VideoProgressSnapshot? _latestProgress;
        /*
         * 일정 시간 동안 마우스 움직임이 없으면
         * 영상 컨트롤바를 숨기는 타이머다.
         */
        private readonly DispatcherTimer _controlHideTimer;
        /*
         * 현재 영상이 재생 중인지 나타낸다.
         */
        private bool _isPlaying;

        /*
         * 사용자가 진행바를 조작 중인지 나타낸다.
         */
        private bool _isSeeking;

        /*
         * 사용자가 음량 Slider를
         * 드래그 중인지 나타낸다.
         */
        private bool _isChangingVolume;

        /*
         * 진행바를 드래그하기 전
         * 영상이 재생 중이었는지 저장한다.
         *
         * true
         * → 드래그 종료 후 다시 재생
         *
         * false
         * → 드래그 종료 후 일시정지 유지
         */
        private bool _wasPlayingBeforeSeeking;
        /*
         * 현재 음소거 상태인지 나타낸다.
         */
        private bool _isMuted;

        /*
         * 음소거 해제 시 복원할 이전 음량이다.
         */
        private double _volumeBeforeMute = 0.7;

        /*
 * 전체화면 영상을 표시하는 별도 Window다.
 */
        private Window? _fullScreenWindow;

        /*
         * 전체화면 전 VideoContainer가 들어 있던 부모다.
         */
        private Panel? _originalVideoParent;

        /*
         * 부모 컨테이너 내부의 원래 배치 순서다.
         */
        private int _originalVideoIndex;

        /*
         * VideoContainer의 원래 크기와 레이아웃 값이다.
         */
        private double _originalVideoWidth;
        private double _originalVideoHeight;

        private Thickness _originalVideoMargin;

        private HorizontalAlignment
            _originalHorizontalAlignment;

        private VerticalAlignment
            _originalVerticalAlignment;

        private CornerRadius
            _originalCornerRadius;

        private Thickness
            _originalBorderThickness;

        public VideoPopupView(
            string videoTitle,
            string videoPath,
            string videoDescription,
            bool showDescription = true)
        {
            InitializeComponent();

            _progressTimer =
            new DispatcherTimer
            {
                Interval =
                    TimeSpan.FromMilliseconds(250)
            };

            _progressTimer.Tick +=
                ProgressTimer_Tick;

            if (string.IsNullOrWhiteSpace(videoPath))
            {
                throw new ArgumentException(
                    "영상 경로는 필수입니다.",
                    nameof(videoPath));
            }

            _controlHideTimer =
            new DispatcherTimer
            {
                Interval =
                    TimeSpan.FromSeconds(2)
            };

            _controlHideTimer.Tick +=
                ControlHideTimer_Tick;

            _videoPath = videoPath.Trim();

            /*
             * 생성 시점에 YouTube 주소 여부를 판별한다.
             */
            _isYouTubeVideo =
                TryGetYouTubeVideoId(_videoPath, out _);

            _useWebPlayer =
                _isYouTubeVideo || IsHttpVideoUrl(_videoPath);

            TitleTextBlock.Text =
                videoTitle ?? string.Empty;

            DescriptionTextBlock.Text =
                videoDescription ?? string.Empty;

            DescriptionTextBlock.Visibility =
                showDescription
                    ? Visibility.Visible
                    : Visibility.Collapsed;

            /*
             * UserControl이 실제 화면에 로드된 뒤
             * 영상 컨트롤 초기화를 시작한다.
             */
            Loaded += VideoPopupView_Loaded;
        }

        private async void VideoPopupView_Loaded(
            object sender,
            RoutedEventArgs e)
        {
            /*
             * Loaded 이벤트가 중복 실행되지 않도록 제거한다.
             */
            Loaded -= VideoPopupView_Loaded;

            if (_useWebPlayer)
            {
                await LoadWebVideoAsync();
            }
            else
            {
                await LoadMediaElementVideoAsync();
            }
        }

        /*
         * 로컬 파일 또는 직접 영상 URL을
         * MediaElement로 재생한다.
         */
        private System.Threading.Tasks.Task LoadMediaElementVideoAsync()
        {
            try
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[VIDEO] Load 시작: {_videoPath}");

                _isMediaOpened = false;


                PopupVideo.Visibility = Visibility.Visible;
                VideoWebView.Visibility = Visibility.Collapsed;
                LocalVideoControlArea.Visibility = Visibility.Visible;

                
                ShowLoadingMessage("영상을 불러오는 중입니다.");

                string resolvedPath =
                    Path.IsPathRooted(_videoPath)
                        ? _videoPath
                        : Path.GetFullPath(
                            Path.Combine(
                                AppContext.BaseDirectory,
                                _videoPath));

                    System.Diagnostics.Debug.WriteLine(
                        $"[VIDEO] 로컬 경로: {resolvedPath}");

                    if (!File.Exists(resolvedPath))
                    {
                        throw new FileNotFoundException(
                            "영상 파일을 찾을 수 없습니다.",
                            resolvedPath);
                    }

                PopupVideo.Source =
                    new Uri(resolvedPath, UriKind.Absolute);

                _ = Dispatcher.BeginInvoke(new Action(() =>
                {
                    System.Diagnostics.Debug.WriteLine(
                        "[VIDEO] Play 호출");

                    PopupVideo.Play();
                }));
            }
            catch (Exception exception)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[VIDEO] 예외: {exception}");

                ShowVideoError(
                    $"영상을 불러올 수 없습니다.\n{exception.Message}");
            }

            return System.Threading.Tasks.Task.CompletedTask;
        }

        /*
         * YouTube 주소를 WebView2에 임베드한다.
         */
        private async System.Threading.Tasks.Task LoadWebVideoAsync()
        {
            try
            {
                PopupVideo.Visibility =
                    Visibility.Collapsed;

                VideoWebView.Visibility =
                    Visibility.Visible;

                /*
                 * YouTube는 자체 플레이어 UI를 사용하므로
                 * MediaElement 전용 버튼을 숨긴다.
                 */
                LocalVideoControlArea.Visibility =
                    Visibility.Collapsed;


                ShowLoadingMessage(
                    _isYouTubeVideo
                        ? "YouTube 영상을 불러오는 중입니다."
                        : "영상을 스트리밍하는 중입니다.");

                /*
                 * WebView2 초기화를 명시적으로 수행한다.
                 */
                await VideoWebView.EnsureCoreWebView2Async();

                /*
                 * 새 창 열기 동작을 현재 WebView 안에서 처리한다.
                 */
                VideoWebView.CoreWebView2.NewWindowRequested +=
                    CoreWebView2_NewWindowRequested;

                VideoWebView.CoreWebView2.WebMessageReceived +=
                    CoreWebView2_WebMessageReceived;

                VideoWebView.CoreWebView2.ContainsFullScreenElementChanged +=
                    CoreWebView2_ContainsFullScreenElementChanged;

                /*
                 * 기본 컨텍스트 메뉴와 개발자 도구를 제한한다.
                 * 필요하다면 이후 옵션으로 분리할 수 있다.
                 */
                VideoWebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled =
                    false;

                VideoWebView.CoreWebView2.Settings.AreDevToolsEnabled =
                    false;

                if (_isYouTubeVideo)
                {
                    TryGetYouTubeVideoId(_videoPath, out string? videoId);

                    string embedUrl =
                        $"https://www.youtube.com/embed/{videoId}" +
                        "?autoplay=1" +
                        "&controls=1" +
                        "&rel=0" +
                        "&playsinline=1";

                    VideoWebView.Source = new Uri(embedUrl);
                    return;
                }

                string videoUrlJson =
                    JsonSerializer.Serialize(_videoPath);

                VideoWebView.NavigateToString(
                    $$"""
                    <!doctype html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        html, body {
                          width:100%; height:100%; margin:0; background:#000; overflow:hidden;
                        }
                        body {
                          display:flex; align-items:center; justify-content:center;
                        }
                        video {
                          display:block; width:100%; height:100%; max-width:100%; max-height:100%;
                          margin:auto; object-fit:contain; object-position:center center; background:#000;
                        }
                      </style>
                    </head>
                    <body>
                      <video id="video" src={{videoUrlJson}} controls autoplay playsinline></video>
                      <script>
                        const video = document.getElementById('video');
                        const send = (type) => chrome.webview.postMessage({
                          type,
                          duration: Number.isFinite(video.duration) ? video.duration : 0,
                          position: Number.isFinite(video.currentTime) ? video.currentTime : 0,
                          paused: video.paused
                        });
                        video.addEventListener('loadedmetadata', () => send('opened'));
                        video.addEventListener('timeupdate', () => send('progress'));
                        video.addEventListener('play', () => send('play'));
                        video.addEventListener('pause', () => send('pause'));
                        video.addEventListener('ended', () => send('ended'));
                        video.addEventListener('error', () => send('error'));
                      </script>
                    </body>
                    </html>
                    """);
            }
            catch (Exception exception)
            {
                ShowVideoError(
                    $"웹 영상을 불러올 수 없습니다.\n{exception.Message}");
            }
        }

        private static bool IsHttpVideoUrl(string path)
        {
            return Uri.TryCreate(path, UriKind.Absolute, out Uri? uri)
                && (uri.Scheme == Uri.UriSchemeHttp
                    || uri.Scheme == Uri.UriSchemeHttps);
        }

        private void CoreWebView2_WebMessageReceived(
            object? sender,
            CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                using JsonDocument message =
                    JsonDocument.Parse(e.WebMessageAsJson);

                JsonElement root = message.RootElement;
                string type = root.GetProperty("type").GetString() ?? string.Empty;
                _webDurationSeconds = root.GetProperty("duration").GetDouble();
                _webPositionSeconds = root.GetProperty("position").GetDouble();

                if (type == "error")
                {
                    ShowVideoError("영상 스트리밍에 실패했습니다.");
                    return;
                }

                _isMediaOpened = _webDurationSeconds > 0;
                _isPlaying = type == "play" ||
                    (type == "progress" && !root.GetProperty("paused").GetBoolean());

                UpdatePlaybackMeasurements(_webPositionSeconds);

                if (type is "progress" or "pause")
                {
                    RequestProgressSave(force: type == "pause");
                }
                else if (type == "ended")
                {
                    _isPlaying = false;
                    RequestProgressSave(force: true);
                }
            }
            catch (Exception exception)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[VIDEO] WebView 메시지 처리 실패: {exception}");
            }
        }

        private void CoreWebView2_ContainsFullScreenElementChanged(
            object? sender,
            object e)
        {
            _ = Dispatcher.BeginInvoke(new Action(() =>
            {
                if (VideoWebView.CoreWebView2?.ContainsFullScreenElement == true)
                {
                    EnterFullScreen();
                }
                else
                {
                    ExitFullScreen();
                }
            }));
        }

        /*
         * YouTube 공유 주소, 일반 주소, Shorts 주소,
         * embed 주소에서 영상 ID를 추출한다.
         */
        private static bool TryGetYouTubeVideoId(
            string url,
            out string? videoId)
        {
            videoId = null;

            if (!Uri.TryCreate(
                    url,
                    UriKind.Absolute,
                    out Uri? uri))
            {
                return false;
            }

            string host =
                uri.Host.ToLowerInvariant();

            /*
             * youtu.be/VIDEO_ID
             */
            if (host == "youtu.be"
                || host == "www.youtu.be")
            {
                videoId =
                    uri.AbsolutePath.Trim('/');

                return !string.IsNullOrWhiteSpace(videoId);
            }

            if (host != "youtube.com"
                && host != "www.youtube.com"
                && host != "m.youtube.com")
            {
                return false;
            }

            /*
             * youtube.com/watch?v=VIDEO_ID
             */
            if (uri.AbsolutePath.Equals(
                    "/watch",
                    StringComparison.OrdinalIgnoreCase))
            {
                /*var query =
                    HttpUtility.ParseQueryString(
                        uri.Query);
                videoId =
                    videoId =
                    query["v"];
                */
                videoId = GetQueryParameter(
                    uri,
                    "v");

                return !string.IsNullOrWhiteSpace(videoId);
            }

            /*
             * youtube.com/embed/VIDEO_ID
             * youtube.com/shorts/VIDEO_ID
             */
            string[] pathSegments =
                uri.AbsolutePath
                    .Trim('/')
                    .Split(
                        '/',
                        StringSplitOptions.RemoveEmptyEntries);

            if (pathSegments.Length >= 2
                && (pathSegments[0].Equals(
                        "embed",
                        StringComparison.OrdinalIgnoreCase)
                    || pathSegments[0].Equals(
                        "shorts",
                        StringComparison.OrdinalIgnoreCase)))
            {
                videoId =
                    pathSegments[1];

                return !string.IsNullOrWhiteSpace(videoId);
            }

            return false;
        }

        private void PopupVideo_MediaOpened(
         object sender,
         RoutedEventArgs e)
        {
            _isMediaOpened = true;

            VideoMessageArea.Visibility =
                Visibility.Collapsed;

            LocalVideoControlArea.Visibility =
                Visibility.Visible;

            PopupVideo.Volume =
                VolumeSlider.Value;

            if (PopupVideo.NaturalDuration.HasTimeSpan)
            {
                TimeSpan duration =
                    PopupVideo.NaturalDuration.TimeSpan;

                ProgressSlider.Minimum =
                    0;

                ProgressSlider.Maximum =
                    duration.TotalSeconds;

                DurationTimeText.Text =
                    FormatTime(duration);
            }

            CurrentTimeText.Text =
                "00:00";

            ProgressSlider.Value =
                0;

            _maximumPositionSeconds =
                0;

            _watchedSeconds =
                0;

            _lastObservedPositionSeconds =
                0;

            PlayVideo();
        }

        private void ProgressTimer_Tick(
        object? sender,
        EventArgs e)
        {
            if (!_isMediaOpened
                || _isSeeking)
            {
                return;
            }

            TimeSpan currentPosition =
                PopupVideo.Position;

            UpdatePlaybackMeasurements(
                currentPosition.TotalSeconds);

            CurrentTimeText.Text =
                FormatTime(currentPosition);

            ProgressSlider.Value =
                currentPosition.TotalSeconds;
        }

        /*
         * 실제 재생 위치의 작은 증가분만 시청시간에 더한다.
         * 진행바를 앞으로 크게 이동한 값은 시청시간으로 계산하지 않는다.
         */
        private void UpdatePlaybackMeasurements(
            double currentPositionSeconds)
        {
            _maximumPositionSeconds =
                Math.Max(
                    _maximumPositionSeconds,
                    currentPositionSeconds);

            double positionDifference =
                currentPositionSeconds
                - _lastObservedPositionSeconds;

            if (_isPlaying &&
                positionDifference > 0 &&
                positionDifference <= 1.5)
            {
                _watchedSeconds +=
                    positionDifference;
            }

            _lastObservedPositionSeconds =
                currentPositionSeconds;
        }

        /*
         * [기준 4] 현재 재생 상태로 진행 스냅샷을 갱신한다. 예전에는 이 시점마다 서버(/video-progress)를 호출했지만
         * 이제 로컬 _latestProgress만 갱신하고, 서버 전송은 창이 닫힐 때 GetFinalProgress()를 통해 1회만 한다.
         * force 인자는 기존 호출부(일시정지·탐색·종료) 호환을 위해 남겨 두며 동작 차이는 없다.
         */
        private void RequestProgressSave(bool force = false)
        {
            if (!_isMediaOpened)
            {
                return;
            }

            double durationSeconds;
            double positionSeconds;

            if (_useWebPlayer && !_isYouTubeVideo)
            {
                durationSeconds = _webDurationSeconds;
                positionSeconds = Math.Clamp(
                    _webPositionSeconds,
                    0,
                    durationSeconds);
            }
            else
            {
                if (!PopupVideo.NaturalDuration.HasTimeSpan)
                {
                    return;
                }

                durationSeconds =
                    PopupVideo.NaturalDuration.TimeSpan.TotalSeconds;
                positionSeconds = Math.Clamp(
                    PopupVideo.Position.TotalSeconds,
                    0,
                    durationSeconds);
            }

            if (durationSeconds <= 0)
            {
                return;
            }

            UpdatePlaybackMeasurements(
                positionSeconds);

            VideoProgressSnapshot progress =
                new VideoProgressSnapshot
                {
                    DurationSeconds =
                        (decimal)durationSeconds,
                    PositionSeconds =
                        (decimal)positionSeconds,
                    MaximumPositionSeconds =
                        (decimal)Math.Min(
                            _maximumPositionSeconds,
                            durationSeconds),
                    WatchedSeconds =
                        (decimal)Math.Min(
                            _watchedSeconds,
                            durationSeconds)
                };

            _latestProgress = progress;
        }

        /// <summary>
        /// [기준 4] 창이 닫힐 때 PopupManager가 호출한다. 현재 재생 상태로 스냅샷을 갱신한 뒤 돌려준다.
        /// 영상이 한 번도 열리지 않았으면(재생 실패 등) null이며, 이 경우 VIDEO_WATCHED 대신 CLOSED로 보고한다.
        /// </summary>
        public VideoProgressSnapshot? GetFinalProgress()
        {
            RequestProgressSave(force: true);
            return _latestProgress;
        }

        /// <summary>
        /// [기준 4] 로컬 추정 완료 여부. 실시간 서버 판정이 없어졌으므로 "완료 전 닫기 금지" 안내에만 쓴다.
        /// 최종 완료 판정은 결과 API 응답(서버)이 한다.
        /// </summary>
        public bool HasReachedCompletion(double requiredRatio)
        {
            VideoProgressSnapshot? progress = GetFinalProgress();
            if (progress == null || progress.DurationSeconds <= 0) return false;
            double ratio = (double)(progress.WatchedSeconds / progress.DurationSeconds);
            return ratio >= Math.Clamp(requiredRatio, 0.0, 1.0);
        }

        private void ProgressSlider_PreviewMouseLeftButtonDown(
        object sender,
        MouseButtonEventArgs e)
        {
            if (!_isMediaOpened)
            {
                return;
            }

            /*
             * 드래그 시작 전 재생 상태를 저장한다.
             *
             * 영상이 끝난 상태라면
             * _isPlaying은 false이므로
             * 드래그 후에도 일시정지 상태가 유지된다.
             */
            _wasPlayingBeforeSeeking =
                _isPlaying;

            _isSeeking = true;

            _progressTimer.Stop();
            _controlHideTimer.Stop();

            /*
             * 드래그 중에는 영상이 계속 흘러가지 않도록
             * 일시정지한다.
             */
            PopupVideo.Pause();

            ProgressSlider.CaptureMouse();

            MoveProgressSliderByMouse(e);

            e.Handled = true;
        }
        /*
         * 사용자가 진행바를 누른 상태로 마우스를 이동하면
         * 마우스 위치 비율에 맞춰 재생 위치를 계속 변경한다.
         */
        private void ProgressSlider_PreviewMouseMove(
            object sender,
            MouseEventArgs e)
        {
            /*
             * 영상이 아직 열리지 않았거나
             * 드래그 중이 아니라면 아무 작업도 하지 않는다.
             */
            if (!_isMediaOpened ||
                !_isSeeking ||
                e.LeftButton != MouseButtonState.Pressed)
            {
                return;
            }

            MoveProgressSliderByMouse(e);
        }
        /*
  * 진행바 위의 마우스 X좌표를 비율로 계산하여
  * Slider 값과 화면의 시간 표시만 변경한다.
  *
  * 실제 영상 위치는 마우스를 놓았을 때만 변경한다.
  */
        private void MoveProgressSliderByMouse(
            MouseEventArgs e)
        {
            double sliderWidth =
                ProgressSlider.ActualWidth;

            if (sliderWidth <= 0)
            {
                return;
            }

            Point mousePosition =
                e.GetPosition(ProgressSlider);

            double positionRatio =
                mousePosition.X / sliderWidth;

            positionRatio = Math.Clamp(
                positionRatio,
                0,
                1);

            double targetSeconds =
                ProgressSlider.Minimum +
                (
                    ProgressSlider.Maximum -
                    ProgressSlider.Minimum
                ) * positionRatio;

            /*
             * 드래그 중에는 진행바 모양만 이동시킨다.
             */
            ProgressSlider.Value =
                targetSeconds;

            /*
             * 실제 영상 위치는 건드리지 않고
             * 사용자가 이동하려는 예상 시간만 표시한다.
             */
            CurrentTimeText.Text =
                FormatTime(
                    TimeSpan.FromSeconds(
                        targetSeconds));
        }
        private void ProgressSlider_PreviewMouseLeftButtonUp(
        object sender,
        MouseButtonEventArgs e)
        {
            if (!_isSeeking)
            {
                return;
            }

            MoveProgressSliderByMouse(e);
            FinishSeeking();
            e.Handled = true;
        }

        private void ProgressSlider_LostMouseCapture(
            object sender,
            MouseEventArgs e)
        {
            // 창 전환 등으로 MouseUp을 받지 못해도 일시정지 상태에 갇히지 않게 한다.
            if (_isSeeking)
            {
                FinishSeeking();
            }
        }

        private void FinishSeeking()
        {
            TimeSpan targetPosition = TimeSpan.FromSeconds(ProgressSlider.Value);
            _isSeeking = false;
            ProgressSlider.ReleaseMouseCapture();

            if (!_isMediaOpened)
            {
                return;
            }

            // 탐색 직후 Position은 아직 이전 위치일 수 있으므로 선택값으로 표시한다.
            // 짧게 건너뛴 구간도 실제 시청시간에 합산하지 않도록 측정 기준을 옮긴다.
            CurrentTimeText.Text = FormatTime(targetPosition);
            _lastObservedPositionSeconds = targetPosition.TotalSeconds;

            /*
             * 드래그 전 영상이 재생 중이었던 경우에만
             * 다시 재생한다.
             *
             * 영상이 끝난 뒤 드래그했거나
             * 원래 일시정지 상태였다면
             * 그대로 일시정지를 유지한다.
             */
            if (_wasPlayingBeforeSeeking)
            {
                PlayVideo(targetPosition);
            }
            else
            {
                PopupVideo.Pause();
                PopupVideo.Position = targetPosition;

                _isPlaying = false;

                RequestProgressSave(force: true);

                /*
                 * 재생 버튼 아이콘을
                 * 재생 모양으로 되돌린다.
                 */
                PlayPauseIcon.Text =
                    "\uE768";

                PlayPauseButton.ToolTip =
                    "재생";
            }

            if (!VideoContainer.IsMouseOver)
            {
                LocalVideoControlArea.Visibility =
                    Visibility.Collapsed;

                ShowVideoControls();
            }

        }
        /*
         * 영상 영역에 마우스가 들어오면
         * 컨트롤바를 표시하고 숨김 시간을 다시 계산한다.
         */
        private void VideoContainer_MouseEnter(
            object sender,
            MouseEventArgs e)
        {
            ShowVideoControls();
        }

        /*
         * 일반 팝업 화면에서 영상 영역을 완전히 벗어나면
         * 컨트롤바를 즉시 숨긴다.
         *
         * 전체화면에서는 컨테이너 밖으로 나갈 수 없으므로
         * 이 이벤트보다 MouseMove 타이머가 핵심이다.
         */
        private void VideoContainer_MouseLeave(
            object sender,
            MouseEventArgs e)
        {
            if (_fullScreenWindow != null)
            {
                return;
            }

            if (_isSeeking
                || LocalVideoControlArea.IsMouseOver)
            {
                return;
            }

            HideVideoControls();
        }

        /*
         * 영상 위에서 마우스가 움직일 때마다
         * 컨트롤바를 표시하고 자동 숨김 시간을 초기화한다.
         */
        private void VideoContainer_MouseMove(
            object sender,
            MouseEventArgs e)
        {
            ShowVideoControls();
        }

        private void ShowVideoControls()
        {
            if (!_isMediaOpened
                || _useWebPlayer)
            {
                return;
            }

            LocalVideoControlArea.Visibility =
                Visibility.Visible;

            /*
             * 마우스가 움직일 때마다 기존 시간을 취소하고
             * 다시 2초를 센다.
             */
            _controlHideTimer.Stop();

            /*
             * 일시정지 중에는 컨트롤을 계속 표시한다.
             */
            if (!_isPlaying)
            {
                return;
            }

            _controlHideTimer.Start();
        }

        


        private void HideVideoControls()
        {
            /*
             * 사용자가 컨트롤을 조작 중이거나
             * 영상이 일시정지 상태라면 숨기지 않는다.
             */
            if (_isSeeking
                || LocalVideoControlArea.IsMouseOver
                || !_isPlaying)
            {
                return;
            }

            LocalVideoControlArea.Visibility =
                Visibility.Collapsed;

            _controlHideTimer.Stop();
        }

        private void ControlHideTimer_Tick(
        object? sender,
        EventArgs e)
        {
            _controlHideTimer.Stop();

            HideVideoControls();
        }

        private void LocalVideoControlArea_MouseEnter(
        object sender,
        MouseEventArgs e)
        {
            _controlHideTimer.Stop();
        }

        private void LocalVideoControlArea_MouseLeave(
            object sender,
            MouseEventArgs e)
        {
            if (!_isPlaying)
            {
                return;
            }

            _controlHideTimer.Stop();
            _controlHideTimer.Start();
        }

        private void VolumeSlider_ValueChanged(
        object sender,
        RoutedPropertyChangedEventArgs<double> e)
        {
            /*
             * InitializeComponent 실행 중에는
             * PopupVideo가 아직 생성되지 않았을 수 있다.
             */
            if (PopupVideo == null)
            {
                return;
            }

            PopupVideo.Volume =
                e.NewValue;

            _isMuted =
                e.NewValue <= 0;

            UpdateVolumeIcon();
        }
        /*
 * 음량 바를 클릭했을 때
 * 클릭 위치 비율에 맞춰 음량을 변경한다.
 */
        private void VolumeSlider_PreviewMouseLeftButtonDown(
            object sender,
            MouseButtonEventArgs e)
        {
            _isChangingVolume = true;

            VolumeSlider.CaptureMouse();

            MoveVolumeSliderByMouse(e);

            /*
             * 기본 Slider의 +/- 이동 동작을 막는다.
             */
            e.Handled = true;
        }

        /*
         * 음량 바를 누른 상태로 이동하면
         * 마우스 위치에 맞춰 음량을 계속 변경한다.
         */
        private void VolumeSlider_PreviewMouseMove(
            object sender,
            MouseEventArgs e)
        {
            if (!_isChangingVolume ||
                e.LeftButton != MouseButtonState.Pressed)
            {
                return;
            }

            MoveVolumeSliderByMouse(e);

            e.Handled = true;
        }

        /*
         * 음량 드래그가 끝나면
         * 마우스 캡처를 해제한다.
         */
        private void VolumeSlider_PreviewMouseLeftButtonUp(
            object sender,
            MouseButtonEventArgs e)
        {
            _isChangingVolume = false;

            VolumeSlider.ReleaseMouseCapture();

            e.Handled = true;
        }

        /*
         * 마우스 X좌표를 음량 Slider 전체 폭의 비율로 계산한다.
         *
         * 왼쪽 끝
         * → 음량 0
         *
         * 가운데
         * → 음량 0.5
         *
         * 오른쪽 끝
         * → 음량 1
         */
        private void MoveVolumeSliderByMouse(
            MouseEventArgs e)
        {
            double sliderWidth =
                VolumeSlider.ActualWidth;

            if (sliderWidth <= 0)
            {
                return;
            }

            Point mousePosition =
                e.GetPosition(VolumeSlider);

            double volumeRatio =
                mousePosition.X / sliderWidth;

            volumeRatio = Math.Clamp(
                volumeRatio,
                0,
                1);

            VolumeSlider.Value =
                VolumeSlider.Minimum +
                (
                    VolumeSlider.Maximum -
                    VolumeSlider.Minimum
                ) * volumeRatio;
        }

        private void MuteButton_Click(
            object sender,
            RoutedEventArgs e)
        {
            if (!_isMediaOpened)
            {
                return;
            }

            if (_isMuted)
            {
                double restoredVolume =
                    _volumeBeforeMute > 0
                        ? _volumeBeforeMute
                        : 0.7;

                VolumeSlider.Value =
                    restoredVolume;

                PopupVideo.Volume =
                    restoredVolume;

                _isMuted = false;
            }
            else
            {
                if (VolumeSlider.Value > 0)
                {
                    _volumeBeforeMute =
                        VolumeSlider.Value;
                }

                VolumeSlider.Value =
                    0;

                PopupVideo.Volume =
                    0;

                _isMuted = true;
            }

            UpdateVolumeIcon();
        }

        private void FullScreenButton_Click(
        object sender,
        RoutedEventArgs e)
        {
            if (_fullScreenWindow == null)
            {
                EnterFullScreen();
            }
            else
            {
                ExitFullScreen();
            }
        }
        private void EnterFullScreen()
        {
            if (_fullScreenWindow != null)
            {
                return;
            }

            /*
             * 현재 VideoContainer가 들어 있는
             * 원래 부모 Grid를 저장한다.
             */
            _originalVideoParent =
                VideoContainer.Parent as Panel;

            if (_originalVideoParent == null)
            {
                return;
            }

            _originalVideoIndex =
                _originalVideoParent.Children.IndexOf(
                    VideoContainer);

            /*
             * 전체화면 종료 시 복원할
             * 기존 레이아웃 정보를 저장한다.
             */
            _originalVideoWidth =
                VideoContainer.Width;

            _originalVideoHeight =
                VideoContainer.Height;

            _originalVideoMargin =
                VideoContainer.Margin;

            _originalHorizontalAlignment =
                VideoContainer.HorizontalAlignment;

            _originalVerticalAlignment =
                VideoContainer.VerticalAlignment;

            _originalCornerRadius =
                VideoContainer.CornerRadius;

            _originalBorderThickness =
                VideoContainer.BorderThickness;

            /*
             * 기존 부모에서 영상 컨테이너를 분리한다.
             */
            _originalVideoParent.Children.Remove(
                VideoContainer);

            /*
             * 전체화면에 맞게 영상 컨테이너를 확장한다.
             */
            VideoContainer.Width =
                double.NaN;

            VideoContainer.Height =
                double.NaN;

            VideoContainer.Margin =
                new Thickness(0);

            VideoContainer.HorizontalAlignment =
                HorizontalAlignment.Stretch;

            VideoContainer.VerticalAlignment =
                VerticalAlignment.Stretch;

            VideoContainer.CornerRadius =
                new CornerRadius(0);

            VideoContainer.BorderThickness =
                new Thickness(0);

            Window? ownerWindow =
                Window.GetWindow(this);

            _fullScreenWindow =
                new Window
                {
                    Owner =
                        ownerWindow,

                    WindowStyle =
                        WindowStyle.None,

                    WindowState =
                        WindowState.Maximized,

                    ResizeMode =
                        ResizeMode.NoResize,

                    Background =
                        System.Windows.Media.Brushes.Black,

                    ShowInTaskbar =
                        false,

                    Content =
                        VideoContainer
                };

            _fullScreenWindow.KeyDown +=
                FullScreenWindow_KeyDown;

            _fullScreenWindow.Closed +=
                FullScreenWindow_Closed;

            FullScreenIcon.Text =
                "⛶";

            FullScreenButton.ToolTip =
                "전체 화면 종료";

            _fullScreenWindow.Show();
            _fullScreenWindow.Activate();
        }

        private void ExitFullScreen()
        {
            if (_fullScreenWindow == null)
            {
                return;
            }

            Window fullScreenWindow =
                _fullScreenWindow;

            /*
             * Closed 이벤트에서 중복 복원되지 않도록
             * 먼저 이벤트를 제거한다.
             */
            fullScreenWindow.KeyDown -=
                FullScreenWindow_KeyDown;

            fullScreenWindow.Closed -=
                FullScreenWindow_Closed;

            RestoreVideoContainer();

            fullScreenWindow.Close();
        }

        private void RestoreVideoContainer()
        {
            if (_fullScreenWindow == null
                || _originalVideoParent == null)
            {
                return;
            }

            /*
             * 전체화면 Window에서 VideoContainer를 분리한다.
             */
            _fullScreenWindow.Content =
                null;

            /*
             * 기존 레이아웃 값을 복구한다.
             */
            VideoContainer.Width =
                _originalVideoWidth;

            VideoContainer.Height =
                _originalVideoHeight;

            VideoContainer.Margin =
                _originalVideoMargin;

            VideoContainer.HorizontalAlignment =
                _originalHorizontalAlignment;

            VideoContainer.VerticalAlignment =
                _originalVerticalAlignment;

            VideoContainer.CornerRadius =
                _originalCornerRadius;

            VideoContainer.BorderThickness =
                _originalBorderThickness;

            /*
             * 원래 부모의 원래 순서에 다시 삽입한다.
             */
            int insertIndex =
                Math.Min(
                    _originalVideoIndex,
                    _originalVideoParent.Children.Count);

            _originalVideoParent.Children.Insert(
                insertIndex,
                VideoContainer);

            _fullScreenWindow =
                null;

            FullScreenIcon.Text =
                "⛶";

            FullScreenButton.ToolTip =
                "전체 화면";

            /*
             * 전체화면 종료 직후 마우스가 영상 위에 없으면
             * 컨트롤바를 숨긴다.
             */
            LocalVideoControlArea.Visibility =
                VideoContainer.IsMouseOver
                    ? Visibility.Visible
                    : Visibility.Collapsed;
        }

        private void FullScreenWindow_KeyDown(
        object sender,
        KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                ExitFullScreen();

                e.Handled =
                    true;
            }
        }

        private void FullScreenWindow_Closed(
            object? sender,
            EventArgs e)
        {
            /*
             * Alt+F4 등으로 전체화면 Window가 종료된 경우에도
             * 영상 컨테이너를 원래 위치로 돌려놓는다.
             */
            RestoreVideoContainer();
        }


        private void UpdateVolumeIcon()
        {
            if (VolumeIcon == null)
            {
                return;
            }

            if (_isMuted
                || VolumeSlider.Value <= 0)
            {
                /*
                 * 음소거 아이콘
                 */
                VolumeIcon.Text =
                    "\uE74F";

                MuteButton.ToolTip =
                    "음소거 해제";

                return;
            }

            /*
             * 일반 음량 아이콘
             */
            VolumeIcon.Text =
                "\uE767";

            MuteButton.ToolTip =
                "음소거";
        }

        private static string FormatTime(
            TimeSpan time)
        {
            if (time.TotalHours >= 1)
            {
                return time.ToString(
                    @"hh\:mm\:ss");
            }

            return time.ToString(
                @"mm\:ss");
        }

        private void PopupVideo_MediaEnded(
        object sender,
        RoutedEventArgs e)
        {

            RequestProgressSave(force: true);

            _isPlaying = false;

            _progressTimer.Stop();

            _controlHideTimer.Stop();

            LocalVideoControlArea.Visibility =
                Visibility.Visible;

            PlayPauseIcon.Text =
                "\uE768";

            PlayPauseButton.ToolTip =
                "다시 재생";

       

            if (PopupVideo.NaturalDuration.HasTimeSpan)
            {
                TimeSpan duration =
                    PopupVideo.NaturalDuration.TimeSpan;

                ProgressSlider.Value =
                    duration.TotalSeconds;

                CurrentTimeText.Text =
                    FormatTime(duration);
            }

        }

        private void PopupVideo_MediaFailed(
            object sender,
            ExceptionRoutedEventArgs e)
        {

            _progressTimer.Stop();

            _isPlaying = false;


            string errorMessage =
                e.ErrorException?.Message
                ?? "알 수 없는 영상 재생 오류가 발생했습니다.";

          
            ShowVideoError(
                $"영상 재생에 실패했습니다.\n{errorMessage}");
        }

        private void VideoWebView_NavigationCompleted(
            object sender,
            CoreWebView2NavigationCompletedEventArgs e)
        {
            if (e.IsSuccess)
            {
                VideoMessageArea.Visibility =
                    Visibility.Collapsed;

           
            }
            else
            {
                ShowVideoError(
                    $"웹 영상 페이지를 불러오지 못했습니다.\n" +
                    $"오류 코드: {e.WebErrorStatus}");
            }
        }

        private void CoreWebView2_NewWindowRequested(
            object? sender,
            CoreWebView2NewWindowRequestedEventArgs e)
        {
            /*
             * 링크가 새 창을 요청하더라도
             * 별도 브라우저 창을 생성하지 않고
             * 현재 WebView2에서 이동한다.
             */
            e.Handled = true;

            if (Uri.TryCreate(
                    e.Uri,
                    UriKind.Absolute,
                    out Uri? targetUri))
            {
                VideoWebView.Source =
                    targetUri;
            }
        }

        private void PlayPauseButton_Click(
    object sender,
    RoutedEventArgs e)
        {
            if (!_isMediaOpened
                || _useWebPlayer)
            {
                return;
            }

            if (_isPlaying)
            {
                PauseVideo();
            }
            else
            {
                PlayVideo();
            }
        }

        private void PlayVideo(TimeSpan? targetPosition = null)
        {
            if (!_isMediaOpened)
            {
                return;
            }

            /*
             * 영상이 끝난 상태라면 처음부터 다시 재생한다.
             */
            if (!targetPosition.HasValue
                && PopupVideo.NaturalDuration.HasTimeSpan
                && PopupVideo.Position
                    >= PopupVideo.NaturalDuration.TimeSpan)
            {
                PopupVideo.Position =
                    TimeSpan.Zero;
            }

            PopupVideo.Play();

            // 명시적 탐색은 '끝났으면 처음부터' 처리와 분리한다.
            // 재생 상태를 복원한 뒤 선택한 위치를 적용하고 즉시 Position을 재조회하지 않는다.
            if (targetPosition.HasValue)
            {
                PopupVideo.Position = targetPosition.Value;
            }

            _isPlaying = true;

            /*
             * 일시정지 아이콘
             */
            PlayPauseIcon.Text =
                "\uE769";

            PlayPauseButton.ToolTip =
                "일시정지";


            _progressTimer.Start();


        }

        private void PauseVideo()
        {
            if (!_isMediaOpened)
            {
                return;
            }

            PopupVideo.Pause();


            RequestProgressSave(force: true);

            _isPlaying = false;

            /*
             * 재생 아이콘
             */
            PlayPauseIcon.Text =
                "\uE768";

            PlayPauseButton.ToolTip =
                "재생";


            _progressTimer.Stop();

            _controlHideTimer.Stop();

            LocalVideoControlArea.Visibility =
                Visibility.Visible;


        }

        private void ShowLoadingMessage(
            string message)
        {
            VideoMessageText.Text =
                message;

            VideoMessageArea.Visibility =
                Visibility.Visible;
        }

        private void ShowVideoError(
            string message)
        {
            _isMediaOpened = false;
            _progressTimer.Stop();

            /*
             * 로드 실패 후에도 완료 전 닫기 제한을 그대로 적용하면
             * 사용자가 재생할 수 없는 팝업에 갇히게 된다.
             * 실패 상태만 기록하며 시청 완료 상태나 진행률은 변경하지 않는다.
             */
            HasPlaybackFailed = true;

            VideoMessageText.Text =
                message;

            VideoMessageArea.Visibility =
                Visibility.Visible;
        }

        private void VideoPopupView_Unloaded(
            object sender,
            RoutedEventArgs e)
        {
            try
            {
                if (_fullScreenWindow != null)
                {
                    ExitFullScreen();
                }

                _progressTimer.Stop();

                /*
                 * 영상 객체를 정리하기 전에 마지막 위치를 저장 요청한다.
                 */
                RequestProgressSave(force: true);

                
                _controlHideTimer.Stop();
                /*
                 * 로컬 영상 정리
                 */
                PopupVideo.Stop();

                PopupVideo.Source =
                    null;

                /*
                 * YouTube 영상 정리
                 *
                 * 빈 페이지로 이동시켜 영상과 음성을 중단한다.
                 */
                if (VideoWebView.CoreWebView2 != null)
                {
                    VideoWebView.CoreWebView2.NewWindowRequested -=
                        CoreWebView2_NewWindowRequested;

                    VideoWebView.CoreWebView2.WebMessageReceived -=
                        CoreWebView2_WebMessageReceived;

                    VideoWebView.CoreWebView2.ContainsFullScreenElementChanged -=
                        CoreWebView2_ContainsFullScreenElementChanged;

                    VideoWebView.CoreWebView2.Navigate(
                        "about:blank");
                }

                VideoWebView.Dispose();
            }
            catch
            {
                /*
                 * 팝업 종료 중 발생한 정리 오류는 무시한다.
                 */
            }

            _isMediaOpened = false;
            _isPlaying = false;
            _isSeeking = false;
        }

        private static string? GetQueryParameter(
        Uri uri,
        string parameterName)
            {
                string query =
                    uri.Query.TrimStart('?');

                foreach (string pair in query.Split('&'))
                {
                    string[] parts =
                        pair.Split(
                            '=',
                            2);

                    if (parts.Length == 2
                        && parts[0].Equals(
                            parameterName,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return Uri.UnescapeDataString(
                            parts[1]);
                    }
                }

                return null;
            }
    }
}
