using Popup.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Popup.Services
{
    /*
     * [역할 — 설계 12 §4] QUIZ 로컬 채점기. 사용자가 "채점" 버튼을 누르면 서버 응답을 기다리지 않고 즉시 점수·통과 여부를 계산한다.
     *
     * [추가 이유] 기준 3 구현에서는 채점을 서버 결과 API가 하고 WPF는 응답을 기다렸다(로컬 채점 코드 삭제).
     * 설계 12는 현재 용도(신규 입사자 안내·간단 퀴즈)에서 사용자 화면 판정을 WPF가 즉시 하고 서버는 결과 저장에 집중하도록
     * 바꿨다. 서버(PopupService.gradeAnswer)와 같은 규칙으로 계산해 두 값이 어긋나지 않게 한다.
     *
     * [채점 규칙 — 서버 gradeAnswer / PopupQuestionRules.matchesText 와 동일]
     *   - 채점 문항(IsScored)만 계산한다. 비채점 문항은 점수 없음.
     *   - 선택형(SINGLE/MULTIPLE/RATING5): 선택한 선택지 집합 == 정답(IsCorrect=true) 선택지 집합 이면 문항 배점 전부, 아니면 0. 부분 점수 없음.
     *   - 서술형(TEXT): 정답 문자열과 일치 모드 EXACT(trim 후 완전 일치) / CONTAINS(trim 후 포함) 로 비교. 모드가 없으면 오답.
     *   - 총점 = 정답 문항 배점 합. 통과 = 총점 >= 통과 점수(없으면 0 → 항상 통과).
     *
     * [구 데모 JSON 호환] 선택지에 isCorrect가 하나도 없고 question.CorrectAnswers(값 목록)가 있으면 그 값 집합으로 비교하고,
     *   배점(QuestionScore)이 없으면 100 / 채점 문항 수 로 나눈다(DemoPopupGateway의 예전 규칙).
     */
    public static class QuizGrader
    {
        public sealed record Result(double Score, bool Passed, double PassingScore);

        public static Result Grade(IReadOnlyList<SurveyQuestion> questions, IReadOnlyList<SurveyAnswer> answers, double? passingScore)
        {
            ArgumentNullException.ThrowIfNull(questions);
            ArgumentNullException.ThrowIfNull(answers);

            List<SurveyQuestion> scored = questions.Where(question => question.IsScored).ToList();
            double passing = passingScore is double value && double.IsFinite(value) && value > 0 ? value : 0;
            if (scored.Count == 0)
            {
                return new Result(0, true, passing);
            }

            double fallbackPerQuestion = 100.0 / scored.Count;
            double total = 0;
            foreach (SurveyQuestion question in scored)
            {
                SurveyAnswer? answer = answers.FirstOrDefault(item => item.QuestionId == question.QuestionId);
                if (answer == null || !IsCorrect(question, answer))
                {
                    continue;
                }
                total += question.QuestionScore is double score && double.IsFinite(score) ? score : fallbackPerQuestion;
            }

            total = Math.Round(total, 2);
            return new Result(total, total >= passing, passing);
        }

        /// <summary>문항 하나의 정오답. 선택형은 선택지 집합 비교, 서술형은 문자열 일치 모드 비교.</summary>
        public static bool IsCorrect(SurveyQuestion question, SurveyAnswer answer)
        {
            if (question.QuestionType == SurveyQuestionType.Text)
            {
                return MatchesText(answer.TextAnswer, question.CorrectAnswer, question.AnswerMatchMode);
            }

            bool hasServerAnswerKey = question.Options.Any(option => option.IsCorrect.HasValue);
            if (hasServerAnswerKey)
            {
                HashSet<long> correctIds = question.Options
                    .Where(option => option.IsCorrect == true)
                    .Select(option => option.OptionId)
                    .ToHashSet();
                HashSet<long> selectedIds = answer.SelectedOptionIds.ToHashSet();
                return correctIds.Count > 0 && selectedIds.SetEquals(correctIds);
            }

            /* 구 데모 JSON: 정답이 선택지 value 목록으로만 있다. */
            if (question.CorrectAnswers.Count == 0)
            {
                return false;
            }
            HashSet<string> correctValues = question.CorrectAnswers
                .Select(value => value.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            HashSet<string> selectedValues = answer.SelectedValues
                .Select(value => value.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            return selectedValues.SetEquals(correctValues);
        }

        /// <summary>서버 PopupQuestionRules.matchesText 와 같은 규칙. 모드가 EXACT/CONTAINS가 아니면 오답.</summary>
        public static bool MatchesText(string? answer, string? expected, string? mode)
        {
            if (string.IsNullOrWhiteSpace(answer) || string.IsNullOrWhiteSpace(expected))
            {
                return false;
            }
            string actual = answer.Trim();
            string correct = expected.Trim();
            return (mode ?? string.Empty).Trim().ToUpperInvariant() switch
            {
                "EXACT" => actual.Equals(correct, StringComparison.Ordinal),
                "CONTAINS" => actual.Contains(correct, StringComparison.Ordinal),
                _ => false
            };
        }
    }
}
