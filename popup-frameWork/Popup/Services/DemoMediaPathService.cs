using System.IO;
using System.Security.Cryptography;

namespace Popup.Services
{
    /// <summary>
    /// 폐쇄망 Demo Mode에서 사용하는 로컬 이미지와 동영상 경로를 관리한다.
    /// EXE 옆 Media 파일이 있으면 우선 사용하고, 없으면 내장 리소스를 사용자 캐시에 추출한다.
    /// </summary>
    public static class DemoMediaPathService
    {
        public const string ImageFileName =
            "demo-image.jpg";

        public const string VideoFileName =
            "demo-video.mp4";

        public static string GetImagePath()
        {
            return GetRequiredMediaPath(
                ImageFileName);
        }

        public static string GetVideoPath()
        {
            return GetRequiredMediaPath(
                VideoFileName);
        }

        private static string GetRequiredMediaPath(
            string fileName)
        {
            string mediaPath =
                Path.Combine(
                    AppContext.BaseDirectory,
                    "Media",
                    fileName);

            if (File.Exists(mediaPath))
            {
                return mediaPath;
            }

            // MediaElement는 파일 경로가 필요하므로 내장 영상을 쓰기 가능한 사용자 폴더에 푼다.
            // 콘텐츠 해시별로 분리해 실행 중인 이전 영상과 새 빌드의 파일이 충돌하지 않게 한다.
            using Stream resource = typeof(DemoMediaPathService).Assembly
                .GetManifestResourceStream("Popup.DemoMedia." + fileName)
                ?? throw new FileNotFoundException("내장 데모 미디어를 찾을 수 없습니다.", fileName);
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
