using System.Text;

namespace Popup.Services
{
    /*
     * POL-06-02 : 선택·제출
     * ■ UTF-8 바이트 길이 제한(TODO73-37)
     * - in : text(string?) 검사할 문자열 · maxBytes(int) 허용 바이트 수
     * - out: int UTF-8 인코딩 바이트 수 · bool 초과 여부
     * - 주관식 응답은 DB 컬럼이 VARCHAR2(1000 BYTE)라 글자 수·UTF-16 길이가 아니라 UTF-8 바이트로 센다.
     *   영문·숫자 1, 한글 3, 이모지(서로게이트 쌍) 4바이트. TextBox 줄바꿈(\r\n)은 보내는 그대로 2바이트다.
     *   결과 API는 이 문자열을 그대로 JSON으로 보내므로 서버·DB가 받는 바이트 수와 같다.
     */
    public static class Utf8ByteLimit
    {
        /// <summary>SURVEY/QUIZ 주관식 응답(textAnswer) 최대 바이트. 폐쇄망 DB 응답 컬럼 VARCHAR2(1000 BYTE) 기준.</summary>
        public const int TextAnswerMaxBytes = 1000;

        public static int Count(string? text) =>
            string.IsNullOrEmpty(text) ? 0 : Encoding.UTF8.GetByteCount(text);

        public static bool Exceeds(string? text, int maxBytes) => Count(text) > maxBytes;
    }
}
