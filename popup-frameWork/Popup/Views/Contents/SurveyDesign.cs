using System;
using System.Linq;
using System.Windows;

namespace Popup.Views.Contents
{
    /*
     * SURVEY·QUIZ(VIDEO+QUIZ 포함) 문항 디자인 버전.
     * 디자인이 바뀌거나 원복될 수 있어 버전마다 SurveyDesigns/SurveyStyles.Vn.xaml을 완결된 사본으로 둔다.
     * 지난 버전 파일은 고치지 않고, 바꿀 때는 최신 버전을 고치거나 새 버전을 추가한다.
     *   V1: 무채색(흰 콘텐츠, #F8F8F8 문항 카드, 회색 선택 배경, 가로형 체크 없음)
     *   V2: 색 규칙(콘텐츠 #F5F6F8, 문항 흰색, 선택 = 공통 강조 #171717 테두리 + 체크, 글자 #222222)
     * 고르는 곳은 appsettings.json PopupApi.SurveyDesignVersion(앱 전체, 없거나 모르는 값이면 Latest)이다.
     * API 계약 필드가 아니며 관리자 웹 미리보기는 SurveyPreview.tsx의 SURVEY_DESIGN_VERSION으로 맞춘다.
     * 버전마다 반드시 정의할 키: SurveyContentBackground(본문·푸터 배경, PopupWindow도 읽음), SurveyChipCheckWidth.
     */
    public static class SurveyDesign
    {
        public static readonly string[] Versions = { "V1", "V2" };
        public static string Latest => Versions[^1];

        /// <summary>현재 적용 버전. MainWindow가 설정을 읽은 직후 정하고, 이후 만드는 설문 화면부터 적용된다.</summary>
        public static string Current { get; set; } = Latest;

        /// <summary>설정 값을 아는 버전으로 바꾼다(대소문자 무시). 비었거나 모르는 값이면 null.</summary>
        public static string? Normalize(string? value) =>
            Versions.FirstOrDefault(v => string.Equals(v, value?.Trim(), StringComparison.OrdinalIgnoreCase));

        internal static ResourceDictionary CreateResources()
        {
            var resources = new ResourceDictionary();
            resources.MergedDictionaries.Add(new ResourceDictionary
            {
                Source = new Uri("/popupSample;component/Views/Windows/PopupStyles.xaml", UriKind.Relative)
            });
            resources.MergedDictionaries.Add(new ResourceDictionary
            {
                Source = new Uri($"/popupSample;component/Views/Contents/SurveyDesigns/SurveyStyles.{Normalize(Current) ?? Latest}.xaml", UriKind.Relative)
            });
            return resources;
        }
    }
}
