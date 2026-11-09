using System.Collections.Generic;

namespace Popup.Models
{
    /*
     * POL-06-02 : 선택·제출
     * ■ 설문·퀴즈 제출 결과. SurveyPopupView가 필수 응답 검증과 로컬 채점을 끝낸 뒤 PopupManager로 넘긴다.
     * - WPF가 즉시 판정하므로 답안과 판정 결과를 한 객체로 묶어 전달한다(서버 응답을 기다리지 않음).
     * - PopupManager는 이 값을 결과 항목(score/passed)에 담아 로컬 큐에 저장한 뒤 창을 닫는다.
     */
    public sealed class SurveySubmission
    {
        /// <summary>문항별 답안.</summary>
        public List<SurveyAnswer> Answers { get; init; } = new();

        /// <summary>QUIZ면 로컬 채점 점수, SURVEY면 null(채점 없음).</summary>
        public double? Score { get; init; }

        /// <summary>QUIZ면 채점 합불(점수 ≥ 통과 점수, 참여형도 실제 값), SURVEY면 null.</summary>
        public bool? Passed { get; init; }

        /// <summary>QUIZ 통과 점수(안내 문구용). SURVEY면 null.</summary>
        public double? PassingScore { get; init; }

        /// <summary>
        /// POL-06-02 : 선택·제출 — 조회 응답 requiresPassing(PU001 §7). false 참여형, true 커트라인형·만점형, null 기존 passingScore 판정.
        /// 제출 차단·안내 유형 판정용이며 결과 항목(WpfResultItemDto)에는 담지 않는다.
        /// </summary>
        public bool? RequiresPassing { get; init; }

        /// <summary>POL-06-03 : 표현·수명 — QUIZ 미달 안내용 틀린 문항 번호(화면 번호). 결과 항목(WpfResultItemDto)에는 담지 않는다.</summary>
        public IReadOnlyList<int> IncorrectQuestionNumbers { get; init; } = new List<int>();

        /* POL-06-02 : 선택·제출 — QUIZ 결과 안내(PU001 Q3: 정답 N/M개·커트라인/만점/참여형 판별)용. 결과 항목에는 담지 않는다. */
        /// <summary>정답 채점 문항 수.</summary>
        public int CorrectCount { get; init; }
        /// <summary>채점 문항 수.</summary>
        public int ScoredCount { get; init; }
        /// <summary>채점 문항 배점 합(만점).</summary>
        public double MaxScore { get; init; }
        /// <summary>모든 채점 문항이 1점인지(통과 기준을 개수로 안내).</summary>
        public bool UnitScored { get; init; }
    }
}
