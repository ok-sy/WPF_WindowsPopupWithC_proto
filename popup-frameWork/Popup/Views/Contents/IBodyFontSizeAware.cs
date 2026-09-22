namespace Popup.Views.Contents
{
    /*
     * [설계 14 §5.6] 관리자 설정 "본문 폰트 크기(bodyFontSize)"를 콘텐츠 View에 전달하는 계약.
     *
     * [추가 이유] 본문은 팝업 유형(TEXT/IMAGE/VIDEO/SURVEY/QUIZ)마다 View가 다르고 "본문 텍스트"에 해당하는
     * 요소도 다르다. PopupWindow가 각 View의 내부 요소를 직접 알면 결합이 커지므로, PopupWindow는
     * Clamp(10~40)까지만 하고 실제 적용 대상은 View가 결정한다.
     *
     * [1차 정책]
     *   TEXT   : 설명·일반 텍스트·강조 문구·하단 설명 (BodyTextStyle 15 기준). 제목(26)은 그대로 둔다.
     *   IMAGE  : 이미지 설명 (14). 제목(22)은 그대로 둔다. FILL 모드는 텍스트가 없어 미구현.
     *   VIDEO  : 영상 설명 (14). 제목(22)·재생 컨트롤은 그대로 둔다.
     *   SURVEY/QUIZ : 선택지·주관식 입력(UserControl 상속 크기)을 본문 크기로 하고,
     *                 문항 제목(+4)·문항 설명(+1)은 기존 상대 계층(16/13 vs 12)을 유지한다.
     * 설정값이 없으면(PopupOptions.BodyFontSize == null) 이 메서드는 호출되지 않아 XAML 기본값이 유지된다(§5.8).
     */
    public interface IBodyFontSizeAware
    {
        /// <param name="fontSize">PopupWindow가 10~40으로 보정한 본문 폰트 크기(DIP).</param>
        void ApplyBodyFontSize(double fontSize);
    }
}
