using Popup.Models;
using System;

namespace Popup.Managers
{
    /*
     * POL-06-02 : 선택·제출
     * ■ QUIZ 결과 안내(커트라인형·만점형·참여형, PU001 Q3 / 기획서 106·109)
     * - in : submission(SurveySubmission) 로컬 채점 결과 · quizName(string) 안내에 넣을 퀴즈 이름(팝업 제목) · auxCloseVisible(bool) 보조 닫기 표시 여부
     * - out: Notice(Title 창 이름 — 화면에는 그리지 않음(PopupAlert showHeading=false), 스크린리더·자동화 식별용 · Message 본문 · ButtonText 버튼 문구)
     * - 새 JSON 필드 없이 기존 passingScore로 유형을 나눈다.
     *     참여형   : passingScore 0(이하·미설정 포함) — 정답 개수와 무관하게 완료. "퀴즈를 완료하여 {이름}을 종료합니다." + N/M개 + 확인
     *     만점형   : passingScore ≥ 만점(채점 문항 배점 합) — 성공 "퀴즈를 모두 맞추셨습니다. {이름}을 종료합니다." + 확인,
     *                실패 "문제를 모두 맞춰야 퀴즈를 종료할 수 있습니다. 다시 풀어주세요." + 다시 풀기
     *     커트라인형: 그 밖 — 성공 "퀴즈를 통과하여 {이름}을 종료합니다." + N/M개 + 확인,
     *                실패 "퀴즈를 통과하지 못하였습니다. 문제를 다시 풀어주세요. (통과 기준: N개 이상)" + N/M개 + 다시 풀기
     *   N/M개는 점수가 아니라 정답 채점 문항 수/채점 문항 수다. 통과 기준은 모든 채점 문항이 1점이면 개수, 아니면 점수로 적는다.
     * - 실패 안내에는 틀린 문항 번호(설계 43)와, 보조 닫기가 보이면 닫기 안내를 덧붙인다.
     *   틀린 문항 번호는 기획서 화면에 없는 추가 정보다. 빼려면 Build의 "[옵션] 틀린 문항 번호" 아래 두 줄만 주석 처리한다.
     * - 결과 계약(score·passed)과 결과 큐 적재 시점(안내 전 적재)은 바꾸지 않는다. 참여형도 실제 score와 passed=true를 보낸다.
     */
    internal static class QuizResultNotice
    {
        internal enum Kind { Cutoff, FullScore, Participation }

        internal sealed record Notice(string Title, string Message, string ButtonText);

        /// <summary>passingScore·만점으로 유형을 정한다. 0 이하(미설정 포함)·채점 문항 없음은 참여형, 만점 이상은 만점형.</summary>
        internal static Kind Classify(double? passingScore, double maxScore)
        {
            double passing = passingScore is double value && double.IsFinite(value) ? value : 0;
            if (passing <= 0 || maxScore <= 0) return Kind.Participation;
            return passing >= maxScore ? Kind.FullScore : Kind.Cutoff;
        }

        internal static Notice Build(SurveySubmission submission, string? quizName, bool auxCloseVisible)
        {
            ArgumentNullException.ThrowIfNull(submission);
            Kind kind = Classify(submission.PassingScore, submission.MaxScore);
            string name = string.IsNullOrWhiteSpace(quizName) ? "퀴즈" : quizName.Trim();
            string ending = $"{name}{ObjectParticle(name)} 종료합니다.";
            string count = $"{submission.CorrectCount}/{submission.ScoredCount}개";

            if (submission.Passed != false)
            {
                return kind switch
                {
                    Kind.Participation => new Notice("퀴즈를 완료했어요", $"퀴즈를 완료하여 {ending}\n\n{count}", "확인"),
                    Kind.FullScore => new Notice("퀴즈를 통과했어요", $"퀴즈를 모두 맞추셨습니다.\n{ending}", "확인"),
                    _ => new Notice("퀴즈를 통과했어요", $"퀴즈를 통과하여 {ending}\n\n{count}", "확인"),
                };
            }

            string incorrect = string.Empty;
            // [옵션] 틀린 문항 번호(설계 43, 기획서 화면에는 없는 추가 정보). 빼려면 아래 두 줄만 주석 처리한다.
            if (submission.IncorrectQuestionNumbers.Count > 0)
                incorrect = $"\n틀린 문항: {string.Join(", ", submission.IncorrectQuestionNumbers)}번";
            string close = auxCloseVisible ? "\n다시 제출하지 않으려면 하단 '닫기'로 닫을 수 있습니다." : string.Empty;
            string message = kind == Kind.FullScore
                ? $"문제를 모두 맞춰야 퀴즈를 종료할 수 있습니다.\n다시 풀어주세요.{(incorrect + close).Length switch { 0 => string.Empty, _ => "\n" + incorrect + close }}"
                : $"퀴즈를 통과하지 못하였습니다.\n문제를 다시 풀어주세요.\n(통과 기준: {Criterion(submission)})\n\n{count}{incorrect}{close}";
            return new Notice("다시 풀어 주세요", message, "다시 풀기");
        }

        /// <summary>통과 기준 문구. 모든 채점 문항이 1점이면 "N개 이상", 아니면 "N점 이상".</summary>
        private static string Criterion(SurveySubmission submission)
        {
            double passing = submission.PassingScore ?? 0;
            return submission.UnitScored
                ? $"{Math.Ceiling(passing):0}개 이상"
                : $"{passing:0.##}점 이상";
        }

        /// <summary>목적격 조사. 마지막 글자가 한글이면 받침으로 을/를, 그 밖(영문·숫자 등)은 "을(를)".</summary>
        internal static string ObjectParticle(string word)
        {
            char last = word[^1];
            if (last < '가' || last > '힣') return "을(를)";
            return (last - '가') % 28 == 0 ? "를" : "을";
        }
    }
}
