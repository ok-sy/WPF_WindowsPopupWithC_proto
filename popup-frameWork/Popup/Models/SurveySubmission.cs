using System.Collections.Generic;

namespace Popup.Models
{
    /*
     * [설계 12 §2·§4] 설문·퀴즈 제출 결과. SurveyPopupView가 필수 응답 검증과 로컬 채점을 끝낸 뒤 PopupManager로 넘긴다.
     *
     * [추가 이유] 예전 SurveySubmitted 이벤트는 답안 목록(List<SurveyAnswer>)만 넘기고 점수·통과 여부는
     * 서버 결과 API 응답을 기다려 받았다. 이제 WPF가 즉시 판정하므로 답안과 판정 결과를 한 객체로 묶어 전달하고,
     * PopupManager는 이 값을 결과 항목(score/passed)에 담아 로컬 큐에 저장한 뒤 창을 닫는다.
     */
    public sealed class SurveySubmission
    {
        public List<SurveyAnswer> Answers { get; init; } = new();

        /// <summary>QUIZ면 로컬 채점 점수, SURVEY면 null(채점 없음).</summary>
        public double? Score { get; init; }

        /// <summary>QUIZ면 통과 여부(점수 ≥ 통과 점수), SURVEY면 null.</summary>
        public bool? Passed { get; init; }

        /// <summary>QUIZ 통과 점수(안내 문구용). SURVEY면 null.</summary>
        public double? PassingScore { get; init; }
    }
}
