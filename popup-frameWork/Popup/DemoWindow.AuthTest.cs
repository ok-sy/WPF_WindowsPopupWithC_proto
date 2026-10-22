using Popup.Models;
using Popup.Services.Auth;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace Popup
{
    /*
     * POL-14-02 : Demo 모드
     * POL-15-02 : 인증·버전
     * ■ Demo SSO·로그인 테스트
     * appsettings PopupApi.DemoSsoLoginTest=true일 때 Demo 화면에서
     * SSO 호출과 서버 로그인 API 호출을 각각 따로 확인한다.
     *   - SSO 테스트  : Auth.SsoUrl GET(Windows 통합 인증) → MAIN_USER_ID·MAIN_USER_CLASSI_CODE를 입력칸에 채운다.
     *   - 로그인 테스트: 입력칸의 사번·구분 코드로 BaseUrl+Auth.LoginPath에 POST → 토큰 발급 결과만 보여 준다.
     * 받은 토큰은 길이만 표시하고 보관하지 않는다(Demo는 팝업 조회·결과 전송을 서버로 하지 않는다).
     */
    public partial class DemoWindow
    {
        private PopupClientSettings? _authTestSettings;

        /*
         * ■ 인증 테스트 패널 활성화
         * - in : settings(PopupClientSettings) SsoUrl·BaseUrl·LoginPath를 담은 설정
         * - out: 없음 · 예외: ArgumentNullException(settings가 null)
         */
        public void EnableAuthTest(PopupClientSettings settings)
        {
            _authTestSettings = settings ?? throw new ArgumentNullException(nameof(settings));
            AuthTestPanel.Visibility = Visibility.Visible;
            AuthTestResultText.Text = $"SSO: {ValueOrUnset(settings.AuthSsoUrl)}\n"
                + $"로그인: {ValueOrUnset(settings.BaseUrl)} + {settings.AuthLoginPath}";
        }

        private async void SsoTestButton_Click(object sender, RoutedEventArgs e)
        {
            if (_authTestSettings is not { } settings) return;
            await RunAuthTestAsync(SsoTestButton, async () =>
            {
                Stopwatch stopwatch = Stopwatch.StartNew();
                SsoClient client = new(settings.AuthSsoUrl);   // 주소 오류(ArgumentException)도 결과칸에 표시
                SsoUserInfo user = await client.GetUserAsync();
                AuthLogonIdText.Text = user.LogonId;
                AuthClassCodeText.Text = user.ClassCode;
                return "SSO 테스트 — 성공\n"
                    + $"GET {client.SsoUrl}\n"
                    + $"MAIN_USER_ID = {user.LogonId}\n"
                    + $"MAIN_USER_CLASSI_CODE = {user.ClassCode}\n"
                    + $"{stopwatch.ElapsedMilliseconds} ms";
            });
        }

        private async void LoginTestButton_Click(object sender, RoutedEventArgs e)
        {
            if (_authTestSettings is not { } settings) return;
            string logonId = AuthLogonIdText.Text.Trim();
            string classCode = AuthClassCodeText.Text.Trim();
            if (logonId.Length == 0 || classCode.Length == 0)
            {
                AuthTestResultText.Text = "로그인 테스트 — 사번과 사용자 구분 코드를 입력하거나 SSO 테스트를 먼저 실행하세요.";
                return;
            }

            await RunAuthTestAsync(LoginTestButton, async () =>
            {
                Stopwatch stopwatch = Stopwatch.StartNew();
                WpfLoginClient client = new(settings.BaseUrl, settings.AuthLoginPath);
                WpfLoginResponseDto response = await client.LoginAsync(new SsoUserInfo(logonId, classCode));
                return "로그인 테스트 — 성공\n"
                    + $"POST {client.LoginUrl}\n"
                    + $"{{ logonId: {logonId}, classCode: {classCode}, linkYn: N }}\n"
                    + $"tokenType = {response.TokenType}, 토큰 {response.AccessToken.Length}자 (보관하지 않음)\n"
                    + $"expiresAt = {response.ExpiresAt.ToLocalTime():yyyy-MM-dd HH:mm:ss zzz}\n"
                    + $"{stopwatch.ElapsedMilliseconds} ms";
            });
        }

        /* 버튼을 잠근 채 실행하고 성공·실패 내용을 결과칸에 남긴다. 실패는 예외 종류와 메시지로 단계를 구분한다. */
        private async Task RunAuthTestAsync(Button button, Func<Task<string>> action)
        {
            button.IsEnabled = false;
            AuthTestResultText.Text = button.Content + " 실행 중...";
            try
            {
                AuthTestResultText.Text = await action();
            }
            catch (Exception exception)
            {
                AuthTestResultText.Text = $"{button.Content} — 실패\n{exception.GetType().Name}\n{exception.Message}";
            }
            finally
            {
                button.IsEnabled = true;
            }
        }

        private static string ValueOrUnset(string value) => string.IsNullOrWhiteSpace(value) ? "(미설정)" : value;
    }
}
