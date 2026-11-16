using System.IO;
using System.Security.Cryptography;

namespace Popup.Services
{
    /// <summary>
    /// POL-14-02 : Demo 모드
    /// ■ Demo 미디어 주소
    /// - in : ImageUrl/VideoUrl(appsettings PopupApi.DemoMedia, MainWindow가 시작 때 넣음) · 로컬 파일 이름 상수 demo-image.jpg / demo-video.mp4
    /// - out: GetImageSource/GetVideoSource → 외부 URL 또는 로컬 파일 경로(예외 없음)
    /// - 우선순위: ① 설정 URL(외부 URL, 비어 있지 않으면 그대로) ② EXE 옆 Media 파일 ③ 내장 리소스를 사용자 캐시에 추출한 파일
    ///   ④ 모두 없으면 EXE 옆 Media 경로를 그대로 돌려준다 — 파일이 없으므로 IMAGE·VIDEO 화면이 "불러올 수 없음" 오류를 표시한다.
    /// - Media 폴더가 비어 있는 빌드(데모 미디어 미포함)도 빌드·실행 오류가 나지 않게 하기 위해 내장 리소스가 없을 때 예외를 던지지 않는다.
    /// </summary>
    public static class DemoMediaPathService
    {
        public const string ImageFileName =
            "demo-image.jpg";

        public const string VideoFileName =
            "demo-video.mp4";

        /// <summary>appsettings PopupApi.DemoMedia.ImageUrl. 비어 있으면 로컬 데모 이미지를 쓴다.</summary>
        public static string ImageUrl { get; set; } = string.Empty;

        /// <summary>appsettings PopupApi.DemoMedia.VideoUrl. 비어 있으면 로컬 데모 영상을 쓴다.</summary>
        public static string VideoUrl { get; set; } = string.Empty;

        public static string GetImageSource()
        {
            return GetMediaSource(ImageUrl, ImageFileName);
        }

        public static string GetVideoSource()
        {
            return GetMediaSource(VideoUrl, VideoFileName);
        }

        private static string GetMediaSource(
            string configuredUrl,
            string fileName)
        {
            if (!string.IsNullOrWhiteSpace(configuredUrl))
            {
                return configuredUrl.Trim();
            }

            string mediaPath =
                Path.Combine(
                    AppContext.BaseDirectory,
                    "Media",
                    fileName);

            if (File.Exists(mediaPath))
            {
                return mediaPath;
            }

            return TryExtractEmbedded(fileName) ?? mediaPath;
        }

        private static string? TryExtractEmbedded(
            string fileName)
        {
            // 데모 미디어 없이 빌드하면 내장 리소스가 없다. 이때는 null을 돌려 화면 오류로 처리한다.
            using Stream? resource = typeof(DemoMediaPathService).Assembly
                .GetManifestResourceStream("Popup.DemoMedia." + fileName);
            if (resource == null)
            {
                return null;
            }

            // MediaElement는 파일 경로가 필요하므로 내장 영상을 쓰기 가능한 사용자 폴더에 푼다.
            // 콘텐츠 해시별로 분리해 실행 중인 이전 영상과 새 빌드의 파일이 충돌하지 않게 한다.
            string hash = Convert.ToHexString(SHA256.HashData(resource));
            string cacheDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Popup", "DemoMedia", hash);
            Directory.CreateDirectory(cacheDirectory);
            string cachedPath = Path.Combine(cacheDirectory, fileName);

            if (File.Exists(cachedPath))
            {
                using Stream cached = File.OpenRead(cachedPath);
                if (Convert.ToHexString(SHA256.HashData(cached)) == hash)
                {
                    return cachedPath;
                }
            }

            // 추출 중 종료되더라도 불완전한 파일을 다음 실행에서 사용하지 않도록 원자적으로 교체한다.
            string temporaryPath = Path.Combine(cacheDirectory, Guid.NewGuid() + ".tmp");
            try
            {
                resource.Position = 0;
                using (Stream output = File.Create(temporaryPath))
                {
                    resource.CopyTo(output);
                }
                File.Move(temporaryPath, cachedPath, overwrite: true);
            }
            finally
            {
                if (File.Exists(temporaryPath)) File.Delete(temporaryPath);
            }

            return cachedPath;
        }
    }
}
