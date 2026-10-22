namespace Popup.Models
{
    /*
     * POL-04-02 : 모드별 기준
     * ■ 일반 IMAGE 크기 방식(ImagePopupView 내부 모델)
     * - ORIGINAL은 이 열거형에 두지 않고 PopupFactory가 문자열로 분기해 ImageFillPopupView로 표시한다.
     */
    public enum ImagePopupSizeMode
    {
        /*
         * ADAPTIVE: popup.width/height가 창 크기다(구 서버의 content.width/height는 PopupFactory 호환 읽기).
         * 이미지는 팝업이 배정한 영역 안에 비율을 유지해 맞춰지며,
         * 이미지 때문에 팝업 크기가 바뀌지 않는다. imageSizeMode 값이 없을 때의 기본 모드다.
         */
        Adaptive,

        /*
         * FIT_TO_IMAGE: 불러온 이미지의 실제 표시 크기를 기준으로
         * 팝업 창의 너비와 높이를 계산한다.
         *
         * popup.width/height는 이미지 콘텐츠 영역 크기다(비우면 원본 크기). 비율 고정이면 영역 안에 원본 비율로 맞추고(Uniform),
         * 해제면 영역을 채운다(Fill). 헤더·푸터·제목·설명을 더한 창이 작업 영역 90%를 넘으면 창을 줄이고,
         * 영역 크기는 유지한 채 가운데 정렬되어 넘는 부분만 잘린다(ClipToBounds).
         */
        FitToImage
    }
}
