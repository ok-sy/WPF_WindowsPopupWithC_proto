using Microsoft.Web.WebView2.Core;
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Web;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Threading;
using Popup.Models;
using Popup.Services;
using System.Runtime.InteropServices;
using Forms = System.Windows.Forms;

namespace Popup.Views.Contents
{
    public partial class VideoPopupView : UserControl, IBodyFontSizeAware
    {
        /*
         * [설계 14 §5.6] 관리자 본문 폰트 크기 적용.
         * VIDEO 팝업의 본문 = 영상 설명(DescriptionTextBlock, 기본 14). 제목(22)·재생 컨트롤 글자는 그대로 둔다.
         */
        public void ApplyBodyFontSize(double fontSize)
        {
            DescriptionTextBlock.FontSize = fontSize;
        }

        /*
         * 전달받은 원본 영상 경로다.
         */
        private readonly string _videoPath;

        /*
         * 현재 영상이 YouTube 영상인지 나타낸다.
         */
        private readonly bool _useWebPlayer;

        private readonly bool _isYouTubeVideo;

        private bool _syncingWebState;
        private bool _webSeekPending;
        private bool _webIsBuffering;
        private bool _webIsLoading = true;
        private bool _webPlaybackBlocked;
        private double _webDurationSeconds;
        private double _webPositionSeconds;
        private readonly DispatcherTimer _controlsHideTimer = new() { Interval = TimeSpan.FromSeconds(3) };
        private readonly DispatcherTimer _feedbackTimer = new() { Interval = TimeSpan.FromMilliseconds(700) };
        private bool _controlsPointerDown;
        private bool _controlsKeyboardActive;
        private readonly System.Collections.Generic.List<(double Start, double End)> _bufferedRanges = new();
        private readonly System.Collections.Generic.List<(double Start, double End)> _incomingBufferedRanges = new();
        private double _drawnBufferedDurationSeconds = double.NaN;

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
        public event EventHandler<VideoProgressSnapshot>? ProgressUpdated;
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
        private IMasterVolume? _masterVolume;
        private bool _syncingMasterVolume;
        private bool HasMasterVolume => _masterVolume?.State != null;

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

        /*
         * [관리자 웹 옵션 정합성 — 2026-09-20] 관리자 웹(PopupEditorDialog "영상 재생" 섹션)이 저장하는
         * 재생 옵션 6개. 서버는 content_options_json 으로 그대로 내려주고 VideoPopupContentDto 가 파싱하지만
         * 이전에는 PopupFactory 가 View 에 넘기지 않아 전부 무시됐다. 이제 생성자로 받아 실제 재생 동작에 적용한다.
         *
         *   _showControls              : 컨트롤바 표시 (false 면 컨트롤바를 절대 띄우지 않고 영상 클릭으로 재생/일시정지)
         *   _allowFullScreen           : 전체화면 버튼 표시 / 웹 플레이어 전체화면 허용
         *   _allowPlaybackRateChange   : 배속 버튼 표시 / HTML5 플레이어 배속 메뉴 허용
         *   _autoPlay                  : 영상이 열리면 바로 재생할지 (false 면 첫 프레임에서 일시정지)
         *   _isLoop                    : 끝나면 처음부터 다시 재생
         *   _defaultVolume             : 시작 음량 (0~1). 웹 플레이어(HTML5 video)에도 적용, YouTube 는 URL 로 못 정함
         */
        private readonly bool _showControls;
        private readonly bool _allowFullScreen;
        private readonly bool _allowPlaybackRateChange;
        private readonly bool _autoPlay;
        private readonly bool _isLoop;
        private readonly double _defaultVolume;

        /* 배속 버튼이 순환하는 값. MediaElement.SpeedRatio 에 그대로 적용한다. */
        private static readonly double[] PlaybackRates = { 0.5, 0.75, 1.0, 1.25, 1.5, 2.0 };
        private int _playbackRateIndex = 2; // 1.0x

        public VideoPopupView(
            string videoTitle,
            string videoPath,
            string videoDescription,
            bool showDescription = true,
            bool showControls = true,
            bool allowFullScreen = true,
            bool allowPlaybackRateChange = true,
            bool autoPlay = true,
            bool isLoop = false,
            double defaultVolume = 0.7)
        {
            InitializeComponent();

            _showControls = showControls;
            _allowFullScreen = allowFullScreen;
            _allowPlaybackRateChange = allowPlaybackRateChange;
            _autoPlay = autoPlay;
            _controlsHideTimer.Tick += ControlsHideTimer_Tick;
            _feedbackTimer.Tick += (_, _) => { _feedbackTimer.Stop(); PlaybackFeedback.Visibility = Visibility.Collapsed; };
            LocalVideoControlArea.PreviewKeyDown += (_, _) => { _controlsKeyboardActive = true; ShowVideoControls(); };
            _isLoop = isLoop;
            _defaultVolume = double.IsFinite(defaultVolume)
                ? Math.Clamp(defaultVolume, 0.0, 1.0)
                : 0.7;

            /*
             * 장치 연결 전/실패 시 defaultVolume을 내부 플레이어에 적용한다.
             * Loaded에서 시스템 볼륨 연결에 성공하면 현재 Windows 값으로 대체한다.
             */
            VolumeSlider.Value = _defaultVolume;
            _volumeBeforeMute = _defaultVolume > 0 ? _defaultVolume : 0.7;

            /* 허용되지 않은 기능의 버튼은 열 자체를 접어 컨트롤바 폭을 낭비하지 않는다. */
            if (!_allowFullScreen)
            {
                FullScreenButton.Visibility = Visibility.Collapsed;
                FullScreenColumn.Width = new GridLength(0);
            }
            if (!_allowPlaybackRateChange)
            {
                PlaybackRateButton.Visibility = Visibility.Collapsed;
                PlaybackRateColumn.Width = new GridLength(0);
            }

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

            _videoPath = videoPath.Trim();

            /*
             * 생성 시점에 YouTube 주소 여부를 판별한다.
             */
            _isYouTubeVideo =
                TryGetYouTubeVideoId(_videoPath, out _);

            _useWebPlayer =
                _isYouTubeVideo || IsHttpVideoUrl(_videoPath);
            VideoInteractionLayer.Visibility = _isYouTubeVideo ? Visibility.Collapsed : Visibility.Visible;

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

            if (!_isYouTubeVideo)
                AttachMasterVolume(new WindowsMasterVolume(Dispatcher));

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
                LocalVideoControlArea.Visibility = ControlBarVisibility(true);

                
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
                // 영상 전용 프로필로 다른 WebView의 기본 브라우저 옵션과 충돌하지 않는다.
                // 프로토타입에서 소리 있는 자동 재생도 클릭 없이 시작하도록 정책을 지정한다.
                var environment = await CoreWebView2Environment.CreateAsync(
                    userDataFolder: Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "Popup", "VideoWebView2"),
                    options: new CoreWebView2EnvironmentOptions("--autoplay-policy=no-user-gesture-required"));
                await VideoWebView.EnsureCoreWebView2Async(environment);

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

                    /*
                     * [관리자 웹 옵션] YouTube IFrame 파라미터로 옮길 수 있는 옵션만 반영한다.
                     *   autoPlay → autoplay, showControls → controls, allowFullScreen → fs,
                     *   isLoop → loop=1&playlist=<id> (YouTube 는 playlist 지정이 있어야 단일 영상 반복이 된다)
                     * 기본 음량·배속 허용은 YouTube URL 로 제어할 수 없어 적용하지 않는다.
                     */
                    string embedUrl =
                        $"https://www.youtube.com/embed/{videoId}" +
                        $"?autoplay={(_autoPlay ? 1 : 0)}" +
                        $"&controls={(_showControls ? 1 : 0)}" +
                        $"&fs={(_allowFullScreen ? 1 : 0)}" +
                        (_isLoop ? $"&loop=1&playlist={videoId}" : string.Empty) +
                        "&rel=0" +
                        "&playsinline=1";

                    VideoWebView.Source = new Uri(embedUrl);
                    return;
                }

                VideoWebView.NavigateToString(BuildWebVideoHtml());
            }
            catch (Exception exception)
            {
                ShowVideoError($"웹 영상을 불러올 수 없습니다.\n{exception.Message}");
            }
        }

        private string BuildWebVideoHtml()
        {
            string videoUrlAttribute = System.Net.WebUtility.HtmlEncode(_videoPath);

            /*
             * HTML5 엔진은 자동/반복 재생·초기 음량·배속 제한을 적용한다.
             * 컨트롤 표시와 전체화면은 WPF 공통 UI에서 처리한다.
             */
            string videoAttributes =
                (_autoPlay ? " autoplay" : string.Empty) +
                (_isLoop ? " loop" : string.Empty) +
                " playsinline";
            string defaultVolumeJs =
                (HasMasterVolume ? 1.0 : VolumeSlider.Value).ToString(System.Globalization.CultureInfo.InvariantCulture);

            return $$"""
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
                  <video id="video" src="{{videoUrlAttribute}}" preload="auto"{{videoAttributes}}></video>
                  <script>
                    const video = document.getElementById('video');
                    video.volume = {{defaultVolumeJs}};
                    // 영상 클릭은 CompositionControl 위의 공통 WPF 입력 레이어에서 처리한다.
                    const send = (type) => chrome.webview.postMessage({
                      type,
                      duration: Number.isFinite(video.duration) ? video.duration : 0,
                      position: Number.isFinite(video.currentTime) ? video.currentTime : 0,
                      paused: video.paused, seeking: video.seeking,
                      volume: video.volume, rate: video.playbackRate,
                      buffered: Array.from({length: video.buffered?.length || 0}, (_, i) =>
                        [video.buffered.start(i), video.buffered.end(i)])
                    });
                    const startPlayback = () => video.play().catch(error => {
                      if (error.name === 'AbortError') return; // 재생 직후 수동 pause는 오류가 아니다.
                      send(error.name === 'NotAllowedError' ? 'playblocked' : 'error');
                    });
                    let autoplayPending = {{(_autoPlay ? "true" : "false")}};
                    video.addEventListener('loadstart', () => send('loading'));
                    video.addEventListener('loadedmetadata', () => send('opened'));
                    video.addEventListener('canplay', () => {
                      send('ready');
                      if (autoplayPending) { autoplayPending = false; startPlayback(); }
                    });
                    video.addEventListener('timeupdate', () => send('progress'));
                    video.addEventListener('progress', () => send('buffered'));
                    video.addEventListener('play', () => send('play'));
                    video.addEventListener('pause', () => send('pause'));
                    video.addEventListener('ended', () => send('ended'));
                    video.addEventListener('error', () => send('error'));
                    for (const type of ['seeking', 'seeked', 'waiting', 'stalled', 'playing', 'ratechange', 'volumechange'])
                      video.addEventListener(type, () => send(type));
                    const allowRate = {{(_allowPlaybackRateChange ? "true" : "false")}};
                    video.addEventListener('ratechange', () => {
                      if (!allowRate && video.playbackRate !== 1) video.playbackRate = 1;
                    });
                    // 네이티브 전체화면 대신 옵션을 검사하는 WPF 전체화면만 사용한다.
                    video.requestFullscreen = () => Promise.reject(new Error('Use WPF fullscreen'));
                    chrome.webview.addEventListener('message', ({data}) => {
                      switch (data.command) {
                        case 'play':
                          if (video.ended) video.currentTime = 0;
                          autoplayPending = false;
                          startPlayback(); break;
                        case 'pause': autoplayPending = false; video.pause(); break;
                        case 'seek':
                          if (video.currentTime === data.value) send('seeked');
                          else { video.currentTime = data.value; send('seeking'); }
                          break;
                        case 'volume': video.volume = data.value; break;
                        case 'rate': video.playbackRate = allowRate ? data.value : 1; break;
                      }
                    });
                  </script>
                </body>
                </html>
                """;
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
                ApplyWebPlaybackState(root);
            }
            catch (Exception exception)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[VIDEO] WebView 메시지 처리 실패: {exception}");
            }
        }

        private void ApplyWebPlaybackState(JsonElement root)
        {
            string type = root.GetProperty("type").GetString() ?? string.Empty;
            _webDurationSeconds = root.GetProperty("duration").GetDouble();
            _webPositionSeconds = root.GetProperty("position").GetDouble();
            if (root.TryGetProperty("buffered", out JsonElement buffered) && buffered.ValueKind == JsonValueKind.Array)
            {
                // 버퍼 정보는 모든 메시지에 실려 오므로 구간이 실제로 바뀐 경우에만 막대를 다시 그린다.
                _incomingBufferedRanges.Clear();
                foreach (JsonElement range in buffered.EnumerateArray())
                    if (range.ValueKind == JsonValueKind.Array && range.GetArrayLength() == 2)
                        _incomingBufferedRanges.Add((range[0].GetDouble(), range[1].GetDouble()));
                bool durationChanged = _drawnBufferedDurationSeconds != _webDurationSeconds;
                if (durationChanged || !_incomingBufferedRanges.SequenceEqual(_bufferedRanges))
                {
                    _bufferedRanges.Clear();
                    _bufferedRanges.AddRange(_incomingBufferedRanges);
                    DrawBufferedTrack();
                }
            }

            if (type == "error")
            {
                ShowVideoError("영상 스트리밍에 실패했습니다.");
                return;
            }

            _isMediaOpened = _webDurationSeconds > 0;
            bool wasPlaying = _isPlaying;
            bool seeking = root.GetProperty("seeking").GetBoolean();
            if (type == "playblocked") _webPlaybackBlocked = true;
            else if (type is "loading" or "play" or "playing" or "ended") _webPlaybackBlocked = false;
            if (type == "loading") _webIsLoading = true;
            else if (type is "ready" or "playing" or "playblocked" or "ended") _webIsLoading = false;
            if (type is "waiting" or "stalled") _webIsBuffering = true;
            else if (type is "ready" or "playing" or "pause" or "playblocked" or "ended") _webIsBuffering = false;
            if (seeking || _isSeeking || _webSeekPending || type is "seeking" or "seeked" or "waiting" or "stalled")
                _lastObservedPositionSeconds = _webPositionSeconds;
            else
                UpdatePlaybackMeasurements(_webPositionSeconds);
            if (type == "seeked") _webSeekPending = false;
            _isPlaying = !root.GetProperty("paused").GetBoolean() && !seeking && !_webIsBuffering
                && type is not ("ended" or "waiting" or "stalled");
            if (_webPlaybackBlocked)
            {
                SetLoadingAnimation(false);
                VideoLoadingProgress.Visibility = Visibility.Collapsed;
                VideoMessageText.Text = _showControls
                    ? "재생 버튼을 눌러 영상을 시작해 주세요."
                    : "영상 영역을 클릭해 재생을 시작해 주세요.";
                VideoMessageArea.Visibility = Visibility.Visible;
            }
            else if (_webIsLoading) ShowLoadingMessage("영상을 불러오는 중입니다.");
            else if (_webIsBuffering) ShowLoadingMessage("영상을 버퍼링하는 중입니다.");
            else if (!HasPlaybackFailed) HideVideoMessage();
            if (!_isSeeking)
            {
                ProgressSlider.Maximum = Math.Max(1, _webDurationSeconds);
                ProgressSlider.Value = _webPositionSeconds;
                CurrentTimeText.Text = FormatTime(TimeSpan.FromSeconds(_webPositionSeconds));
            }
            DurationTimeText.Text = FormatTime(TimeSpan.FromSeconds(_webDurationSeconds));
            _syncingWebState = true;
            try
            {
                if (_masterVolume == null) VolumeSlider.Value = root.GetProperty("volume").GetDouble();
                else
                {
                    // Late HTML5 messages from before an endpoint loss must not replace fallback UI gain.
                    double playerVolume = HasMasterVolume ? 1 : VolumeSlider.Value;
                    if (root.GetProperty("volume").GetDouble() != playerVolume) SetVideoVolume(playerVolume);
                }
            }
            finally { _syncingWebState = false; }
            PlaybackRateText.Text = root.GetProperty("rate").GetDouble().ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) + "x";
            PlayPauseIcon.Text = _isPlaying ? "\uE769" : "\uE768";
            PlayPauseButton.ToolTip = _isPlaying ? "일시정지" : "재생";
            if (type == "opened" || wasPlaying != _isPlaying) ShowVideoControls();

            if (type is "progress" or "pause" or "seeked" or "opened")
            {
                UpdateProgressSnapshot();
            }
            else if (type == "ended")
            {
                _isPlaying = false;
                UpdateProgressSnapshot();
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
                /* [설계 18 L-0 — C-11] 주석 처리돼 있던 HttpUtility.ParseQueryString 구현은 삭제했다(GetQueryParameter 사용). */
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
            HideVideoMessage();

            LocalVideoControlArea.Visibility =
                ControlBarVisibility(true);

            PopupVideo.Volume =
                HasMasterVolume ? 1 : VolumeSlider.Value;

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

            /* 배속은 MediaOpened 이후에 적용해야 반영된다. 기본 1.0x. */
            PopupVideo.SpeedRatio =
                PlaybackRates[_playbackRateIndex];

            if (_autoPlay)
            {
                PlayVideo();
                return;
            }

            /*
             * [관리자 웹 옵션] 자동 재생 꺼짐: LoadMediaElementVideoAsync 가 미디어를 열기 위해 Play() 를 호출했으므로
             * 여기서 바로 일시정지해 첫 프레임에서 멈춘 상태로 둔다. 컨트롤바(또는 영상 클릭)로 사용자가 시작한다.
             */
            PopupVideo.Pause();
            PopupVideo.Position = TimeSpan.Zero;
            _isPlaying = false;
            PlayPauseIcon.Text = "";
            PlayPauseButton.ToolTip = "재생";
            LocalVideoControlArea.Visibility =
                ControlBarVisibility(true);
        }

        /*
         * 컨트롤과 별도 형제 레이어에서 영상 클릭을 처리해 버튼/Slider 입력과 분리한다.
         */
        private void VideoContainer_MouseLeftButtonUp(
            object sender,
            MouseButtonEventArgs e)
        {
            if (!_isMediaOpened || _isYouTubeVideo)
            {
                return;
            }

            bool requestedPlaying = !_isPlaying;
            if (_isPlaying)
            {
                PauseVideo();
            }
            else
            {
                PlayVideo();
            }
            ShowPlaybackFeedback(requestedPlaying);
            ShowVideoControls();
            e.Handled = true;
        }

        /*
         * [관리자 웹 옵션] 배속 버튼: 목록을 순환하며 MediaElement.SpeedRatio 를 바꾼다.
         * 재생 중이든 일시정지든 즉시 적용되고 다음 재생에도 유지된다.
         */
        private void PlaybackRateButton_Click(
            object sender,
            RoutedEventArgs e)
        {
            if (!_allowPlaybackRateChange || _isYouTubeVideo)
            {
                return;
            }

            _playbackRateIndex = (_playbackRateIndex + 1) % PlaybackRates.Length;
            double rate = PlaybackRates[_playbackRateIndex];
            SetPlaybackRate(rate);
            PlaybackRateText.Text =
                rate.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) + "x";
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
            if (_isPlaying && PopupVideo.BufferingProgress > 0 && PopupVideo.BufferingProgress < 1)
                ShowLoadingMessage("영상을 버퍼링하는 중입니다.");
            else if (!HasPlaybackFailed) HideVideoMessage();

            TimeSpan currentPosition =
                PopupVideo.Position;

            UpdatePlaybackMeasurements(
                currentPosition.TotalSeconds);

            CurrentTimeText.Text =
                FormatTime(currentPosition);

            ProgressSlider.Value =
                currentPosition.TotalSeconds;
            UpdateProgressSnapshot();
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
         * [설계 18 L-0 — C-21] 구 RequestProgressSave(bool force)의 force 인자는 구 /video-progress 즉시 저장용으로
         * 이미 동작 차이가 없는 인자였으므로 제거하고, 실제 역할에 맞게 UpdateProgressSnapshot으로 이름을 바꿨다.
         */
        private void UpdateProgressSnapshot()
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
            ProgressUpdated?.Invoke(this, progress);
        }

        /// <summary>
        /// [기준 4] 창이 닫힐 때 PopupManager가 호출한다. 현재 재생 상태로 스냅샷을 갱신한 뒤 돌려준다.
        /// 영상이 한 번도 열리지 않았으면(재생 실패 등) null이며, 이 경우 VIDEO_WATCHED 대신 CLOSED로 보고한다.
        /// </summary>
        public VideoProgressSnapshot? GetFinalProgress()
        {
            UpdateProgressSnapshot();
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

            /*
             * 드래그 중에는 영상이 계속 흘러가지 않도록
             * 일시정지한다.
             */
            if (_useWebPlayer) SendWebCommand("pause");
            else PopupVideo.Pause();

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
                SetVideoPosition(targetPosition);

                _isPlaying = false;

                UpdateProgressSnapshot();

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
                ShowVideoControls();
                HideVideoControlsIfIdle();
            }

        }
        private void ShowVideoControls()
        {
            /* [관리자 웹 옵션] 컨트롤 표시 꺼짐이면 어떤 경우에도 컨트롤바를 띄우지 않는다. */
            if (!_isMediaOpened
                || _isYouTubeVideo
                || !_showControls)
            {
                return;
            }

            LocalVideoControlArea.Visibility =
                ControlBarVisibility(true);

            _controlsHideTimer.Stop();
            _controlsHideTimer.Interval = TimeSpan.FromSeconds(_fullScreenWindow == null ? 3 : 2);
            if (_isPlaying) _controlsHideTimer.Start();
        }

        private void ControlsHideTimer_Tick(object? sender, EventArgs e)
        {
            _controlsHideTimer.Stop();
            if (!_isPlaying || _isSeeking || _controlsPointerDown || _controlsKeyboardActive)
            {
                ShowVideoControls();
                return;
            }
            HideVideoControlsIfIdle();
        }

        private void HideVideoControlsIfIdle()
        {
            if (!_isPlaying || _isSeeking || _controlsPointerDown || _controlsKeyboardActive) return;
            _controlsHideTimer.Stop();
            LocalVideoControlArea.Visibility = Visibility.Collapsed;
        }

        private void VideoContainer_MouseEnter(object sender, MouseEventArgs e) => ShowVideoControls();

        private void VideoContainer_MouseLeave(object sender, MouseEventArgs e)
        {
            HideVideoControlsIfIdle();
        }

        private void VideoContainer_PreviewMouseMove(object sender, MouseEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Released) _controlsPointerDown = false;
            _controlsKeyboardActive = false;
            ShowVideoControls();
        }

        private void VideoControls_PreviewMouseDown(object sender, MouseButtonEventArgs e)
        {
            _controlsPointerDown = true;
            _controlsKeyboardActive = false;
            ShowVideoControls();
        }

        private void VideoControls_PreviewMouseUp(object sender, MouseButtonEventArgs e)
        {
            _controlsPointerDown = false;
            ShowVideoControls();
            if (!VideoContainer.IsMouseOver) HideVideoControlsIfIdle();
        }

        private void VideoControls_GotKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e) => ShowVideoControls();
        private void VideoControls_LostKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e)
        {
            if (!LocalVideoControlArea.IsKeyboardFocusWithin) _controlsKeyboardActive = false;
            ShowVideoControls();
            if (!VideoContainer.IsMouseOver) HideVideoControlsIfIdle();
        }

        private void ShowPlaybackFeedback(bool playing)
        {
            PlaybackFeedbackIcon.Text = playing ? "\uE768" : "\uE769";
            PlaybackFeedback.Visibility = Visibility.Visible;
            _feedbackTimer.Stop();
            _feedbackTimer.Start();
        }

        private void BufferedTrack_SizeChanged(object sender, SizeChangedEventArgs e) => DrawBufferedTrack();
        private void DrawBufferedTrack()
        {
            if (BufferedTrack == null) return;
            _drawnBufferedDurationSeconds = _webDurationSeconds;
            int used = 0;
            if (_webDurationSeconds > 0 && double.IsFinite(_webDurationSeconds))
            {
                foreach (var (start, end) in _bufferedRanges)
                {
                    if (!double.IsFinite(start) || !double.IsFinite(end) || end <= start) continue;
                    double left = Math.Clamp(start / _webDurationSeconds, 0, 1) * BufferedTrack.ActualWidth;
                    double right = Math.Clamp(end / _webDurationSeconds, 0, 1) * BufferedTrack.ActualWidth;
                    // 기존 막대를 재사용해 요소 생성·트리 변경을 줄인다.
                    System.Windows.Shapes.Rectangle segment;
                    if (used < BufferedTrack.Children.Count)
                    {
                        segment = (System.Windows.Shapes.Rectangle)BufferedTrack.Children[used];
                    }
                    else
                    {
                        segment = new System.Windows.Shapes.Rectangle
                        {
                            Height = 4, Fill = System.Windows.Media.Brushes.Gray, RadiusX = 2, RadiusY = 2
                        };
                        BufferedTrack.Children.Add(segment);
                    }
                    segment.Width = Math.Max(0, right - left);
                    Canvas.SetLeft(segment, left);
                    used++;
                }
            }
            if (used < BufferedTrack.Children.Count)
                BufferedTrack.Children.RemoveRange(used, BufferedTrack.Children.Count - used);
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

            if (_syncingMasterVolume) return;
            if (HasMasterVolume)
            {
                _masterVolume!.SetVolume(e.NewValue);
                ApplyMasterVolume(_masterVolume.State);
                return;
            }

            if (_useWebPlayer)
            {
                if (!_syncingWebState) SetVideoVolume(e.NewValue);
            }
            else SetVideoVolume(e.NewValue);

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

            if (HasMasterVolume)
            {
                _masterVolume!.SetMute(!_masterVolume.State!.Value.Muted);
                ApplyMasterVolume(_masterVolume.State);
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
            if (!_allowFullScreen) return;
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

            /*
             * [시연 피드백] 전체화면은 "팝업 창이 떠 있는 모니터"에 띄운다.
             * 예전에는 WindowState.Maximized만 지정해 새 창이 기본 위치(주 모니터 또는 마지막 활성 모니터)에서
             * 최대화되어, 팝업이 보조 모니터에 있어도 전체화면이 다른 모니터에 나타났다.
             * 팝업 창의 HWND로 현재 모니터를 구해 그 모니터의 물리 픽셀 영역에 창을 정확히 맞춘다
             * (WindowState는 Normal 유지, SourceInitialized에서 SetWindowPos). 팝업·Overlay와 같이 Topmost다.
             */
            Forms.Screen targetScreen =
                ownerWindow != null
                    ? Forms.Screen.FromHandle(new System.Windows.Interop.WindowInteropHelper(ownerWindow).Handle)
                    : Forms.Screen.PrimaryScreen ?? Forms.Screen.AllScreens[0];
            System.Drawing.Rectangle targetBounds = targetScreen.Bounds;

            _fullScreenWindow =
                new Window
                {
                    Owner =
                        ownerWindow,

                    WindowStyle =
                        WindowStyle.None,

                    WindowStartupLocation =
                        WindowStartupLocation.Manual,

                    WindowState =
                        WindowState.Normal,

                    Topmost =
                        true,

                    // DIP 초기값(고DPI 모니터에서는 SetWindowPos가 물리 픽셀로 다시 맞춘다)
                    Left = targetBounds.Left,
                    Top = targetBounds.Top,
                    Width = targetBounds.Width,
                    Height = targetBounds.Height,

                    ResizeMode =
                        ResizeMode.NoResize,

                    Background =
                        System.Windows.Media.Brushes.Black,

                    ShowInTaskbar =
                        false,

                    Content =
                        VideoContainer
                };

            _fullScreenWindow.SourceInitialized +=
                (sender, eventArgs) =>
                {
                    IntPtr handle =
                        new System.Windows.Interop.WindowInteropHelper(_fullScreenWindow).Handle;
                    SetWindowPos(
                        handle,
                        HWND_TOPMOST,
                        targetBounds.Left,
                        targetBounds.Top,
                        targetBounds.Width,
                        targetBounds.Height,
                        SWP_SHOWWINDOW);
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
            ShowVideoControls();
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

            LocalVideoControlArea.Visibility = ControlBarVisibility(true);
            ShowVideoControls();
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

        /*
         * [관리자 웹 옵션] 컨트롤바를 보이려는 모든 경로가 거치는 헬퍼.
         * "컨트롤 표시" 옵션이 꺼져 있으면 요청과 무관하게 항상 Collapsed 를 돌려준다.
         */
        private Visibility ControlBarVisibility(bool wanted)
        {
            return wanted && _showControls
                ? Visibility.Visible
                : Visibility.Collapsed;
        }

        private void PopupVideo_MediaEnded(
        object sender,
        RoutedEventArgs e)
        {

            UpdateProgressSnapshot();

            /*
             * [관리자 웹 옵션] 반복 재생: 진행 스냅샷을 남긴 뒤 처음부터 다시 재생한다.
             * 누적 시청시간(_watchedSeconds)은 계속 더해지므로 완료 판정(서버)에는 영향이 없다.
             */
            if (_isLoop)
            {
                PopupVideo.Position = TimeSpan.Zero;
                _lastObservedPositionSeconds = 0;
                PlayVideo(TimeSpan.Zero);
                return;
            }

            _isPlaying = false;

            _progressTimer.Stop();


            LocalVideoControlArea.Visibility =
                ControlBarVisibility(true);

            PlayPauseIcon.Text =
                "\uE768";

            PlayPauseButton.ToolTip =
                "다시 재생";

            HideVideoMessage();

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
            if (e.IsSuccess && _isYouTubeVideo)
            {
                HideVideoMessage();
            }
            else if (!e.IsSuccess)
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
                || _isYouTubeVideo)
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

        private void SendWebCommand(string command, double value = 0)
        {
            if (command == "seek") _webSeekPending = true;
            VideoWebView.CoreWebView2?.PostWebMessageAsJson(JsonSerializer.Serialize(new { command, value }));
        }

        private void SetVideoPosition(TimeSpan position)
        {
            if (_useWebPlayer) SendWebCommand("seek", position.TotalSeconds);
            else { PopupVideo.Pause(); PopupVideo.Position = position; }
        }

        private void SetVideoVolume(double volume)
        {
            if (_useWebPlayer) SendWebCommand("volume", volume);
            else PopupVideo.Volume = volume;
        }

        internal void AttachMasterVolume(IMasterVolume masterVolume)
        {
            if (_masterVolume != null)
            {
                _masterVolume.Changed -= ApplyMasterVolume;
                _masterVolume.Dispose();
            }
            _masterVolume = masterVolume;
            _masterVolume.Changed += ApplyMasterVolume;
            ApplyMasterVolume(masterVolume.State);
        }

        private void ApplyMasterVolume(MasterVolumeState? state)
        {
            _syncingMasterVolume = true;
            try
            {
                if (state is { } current)
                {
                    VolumeSlider.Value = current.Volume;
                    _isMuted = current.Muted;
                    SetVideoVolume(1);
                }
                else
                {
                    // No endpoint: retain the displayed level and use the internal player.
                    _isMuted = VolumeSlider.Value <= 0;
                    SetVideoVolume(VolumeSlider.Value);
                }
                UpdateVolumeIcon();
            }
            finally { _syncingMasterVolume = false; }
        }

        private void SetPlaybackRate(double rate)
        {
            rate = _allowPlaybackRateChange ? rate : 1;
            if (_useWebPlayer) SendWebCommand("rate", rate);
            else PopupVideo.SpeedRatio = rate;
        }

        private void PlayVideo(TimeSpan? targetPosition = null)
        {
            if (_useWebPlayer)
            {
                if (targetPosition.HasValue) SetVideoPosition(targetPosition.Value);
                SendWebCommand("play");
                return;
            }
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
            ShowVideoControls();
        }

        private void PauseVideo()
        {
            if (_useWebPlayer) { SendWebCommand("pause"); return; }
            if (!_isMediaOpened)
            {
                return;
            }

            PopupVideo.Pause();


            UpdateProgressSnapshot();

            _isPlaying = false;

            /*
             * 재생 아이콘
             */
            PlayPauseIcon.Text =
                "\uE768";

            PlayPauseButton.ToolTip =
                "재생";


            _progressTimer.Stop();

            /*
             * [설계 24 §2] 진행 타이머가 멈추면 버퍼링 안내를 닫을 경로가 없으므로
             * 일시정지 시점에 함께 닫아 숨겨진/남은 로딩 애니메이션이 없게 한다.
             */
            if (!HasPlaybackFailed)
            {
                HideVideoMessage();
            }

            LocalVideoControlArea.Visibility =
                ControlBarVisibility(true);
            ShowVideoControls();
        }

        private void ShowLoadingMessage(
            string message)
        {
            VideoLoadingProgress.Visibility = Visibility.Visible;
            VideoMessageText.Text =
                message;

            VideoMessageArea.Visibility =
                Visibility.Visible;
            SetLoadingAnimation(true);
        }

        /*
         * 로딩/버퍼링 안내를 닫는다. 오류 안내는 HasPlaybackFailed로 유지되므로 호출 측에서 구분한다.
         */
        private void HideVideoMessage()
        {
            SetLoadingAnimation(false);
            VideoMessageArea.Visibility =
                Visibility.Collapsed;
        }

        /*
         * [설계 24 §2] 로딩 회전 애니메이션의 유일한 시작/중지 지점.
         *
         * 예전에는 Path의 Loaded 트리거로 RepeatBehavior=Forever 애니메이션을 무조건 시작해,
         * 안내가 Collapsed여도 animation clock이 계속 돌며 WPF 렌더 루프를 깨웠다.
         * 저사양 PC에서 영상 일시정지 중에도 CPU 약 80%가 유지된 원인 중 하나였다.
         * 이제 실제 로딩·버퍼링 표시 동안에만 실행하고, 그 밖의 모든 경로에서 clock을 제거한다.
         * 이미 실행 중이면 다시 시작하지 않아 250ms 진행 타이머의 반복 호출에도 clock이 늘지 않는다.
         */
        private bool _loadingAnimationRunning;

        private void SetLoadingAnimation(bool running)
        {
            if (running == _loadingAnimationRunning)
            {
                return;
            }

            _loadingAnimationRunning = running;
            LoadingSpinnerRotate.BeginAnimation(
                System.Windows.Media.RotateTransform.AngleProperty,
                running
                    ? new System.Windows.Media.Animation.DoubleAnimation(0, 360, TimeSpan.FromSeconds(1))
                    {
                        RepeatBehavior = System.Windows.Media.Animation.RepeatBehavior.Forever
                    }
                    : null);
        }

        private void ShowVideoError(
            string message)
        {
            SetLoadingAnimation(false);
            VideoLoadingProgress.Visibility = Visibility.Collapsed;
            _isMediaOpened = false;
            _progressTimer.Stop();

            /*
             * 로드 실패 후에도 완료 전 닫기 제한을 그대로 적용하면
             * 사용자가 재생할 수 없는 팝업에 갇히게 된다.
             * 실패 상태만 기록하며 시청 완료 상태나 진행률은 변경하지 않는다.
             */
            HasPlaybackFailed = true;
            _controlsHideTimer.Stop();
            _feedbackTimer.Stop();
            PlaybackFeedback.Visibility = Visibility.Collapsed;

            VideoMessageText.Text =
                message;

            VideoMessageArea.Visibility =
                Visibility.Visible;
        }

        private void VideoPopupView_Unloaded(
            object sender,
            RoutedEventArgs e)
        {
            if (_masterVolume != null)
            {
                _masterVolume.Changed -= ApplyMasterVolume;
                _masterVolume.Dispose();
                _masterVolume = null;
            }
            _controlsHideTimer.Stop();
            _feedbackTimer.Stop();
            SetLoadingAnimation(false);
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
                UpdateProgressSnapshot();

                
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
            _controlsHideTimer.Stop();
            _feedbackTimer.Stop();
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

        /* 전체화면 창을 대상 모니터의 물리 픽셀 영역에 맞추기 위한 Win32 호출 (BackgroundOverlayManager와 동일 방식) */
        private static readonly IntPtr HWND_TOPMOST = new(-1);
        private const uint SWP_SHOWWINDOW = 0x0040;

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetWindowPos(
            IntPtr hWnd, IntPtr hWndInsertAfter, int x, int y, int width, int height, uint flags);
    }
}
