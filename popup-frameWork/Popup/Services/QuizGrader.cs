using Popup.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Popup.Services
{
    /*
     * POL-06-02 : 선택·제출
     * ■ QUIZ 로컬 채점기
     * - in : questions(IReadOnlyList<SurveyQuestion>) 문항·정답 · answers(IReadOnlyList<SurveyAnswer>) 답안 · passingScore(double?) 통과 점수
     * - out: Result(Score, Passed, PassingScore, IncorrectQuestionNumbers)
     * - [역할] QUIZ 로컬 채점기. 사용자가 "채점" 버튼을 누르면 서버 응답을 기다리지 않고 즉시 점수·통과 여부를 계산한다.
     *
     * [추가 이유] 현재 용도(신규 입사자 안내·간단 퀴즈)에서는 사용자 화면 판정을 WPF가 즉시 하고 서버는 결과 저장에 집중한다.
     * 서버(PopupService.gradeAnswer)와 같은 규칙으로 계산해 두 값이 어긋나지 않게 한다.
     *
     * [채점 규칙 — 서버 gradeAnswer / PopupQuestionRules.matchesText 와 동일]
     *   - 채점 문항(IsScored)만 계산한다. 비채점 문항은 점수 없음.
     *   - 선택형(SINGLE/MULTIPLE): 선택한 선택지 집합 == 정답(IsCorrect=true) 선택지 집합 이면 문항 배점 전부, 아니면 0. 부분 점수 없음.
     *   - 서술형(TEXT): 정답 문자열과 일치 모드 EXACT(trim 후 완전 일치) / CONTAINS(trim 후 포함) 로 비교. 모드가 없으면 오답.
     *   - 총점 = 정답 문항 배점 합. 통과 = 총점 >= 통과 점수(없으면 0 → 항상 통과).
     *   - 배점(QuestionScore)이 없으면 기본 1점이다(서버가 배점 미입력 문항을 1점으로 저장하는 기본값과 같음). 모두 1점이면 총점 = 문항 수.
     *
     * 보기 value 목록(CorrectAnswers) 비교와 "배점 없을 때 100/문항 수" 환산은 하지 않는다.
     */
    public static class QuizGrader
    {
        /// <summary>배점이 없을 때의 기본 배점(서버 PopupQuestionRules.DEFAULT_QUESTION_SCORE와 같음).</summary>
        public const double DefaultQuestionScore = 1;
        /// <summary>
        /// IncorrectQuestionNumbers: 틀린 채점 문항의 화면 번호(문항 목록 순서 1부터). 미달 안내에만 쓰며 결과 계약(score·passed)에는 담지 않는다.
        /// </summary>
        public sealed record Result(double Score, bool Passed, double PassingScore)
        {
            public IReadOnlyList<int> IncorrectQuestionNumbers { get; init; } = Array.Empty<int>();
        }

        /* ■ 채점: 채점 문항만 계산해 총점(소수 2자리 반올림)·통과 여부·틀린 문항 번호를 돌려준다. 채점 문항이 없으면 0점 통과. */
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

            double total = 0;
            List<int> incorrect = new();
            for (int index = 0; index < questions.Count; index++)
            {
                SurveyQuestion question = questions[index];
                if (!question.IsScored) continue;
                SurveyAnswer? answer = answers.FirstOrDefault(item => item.QuestionId == question.QuestionId);
                if (answer == null || !IsCorrect(question, answer))
                {
                    incorrect.Add(index + 1);   // SurveyPopupView 문항 카드 번호(index + 1)와 같다
                    continue;
                }
                total += question.QuestionScore is double score && double.IsFinite(score) ? score : DefaultQuestionScore;
            }

            total = Math.Round(total, 2);
            return new Result(total, total >= passing, passing) { IncorrectQuestionNumbers = incorrect };
        }

        /// <summary>문항 하나의 정오답. 선택형은 선택지 집합 비교, 서술형은 문자열 일치 모드 비교.</summary>
        public static bool IsCorrect(SurveyQuestion question, SurveyAnswer answer)
        {
            if (question.QuestionType == SurveyQuestionType.Text)
            {
                return MatchesText(answer.TextAnswer, question.CorrectAnswer, question.AnswerMatchMode);
            }

            HashSet<long> correctIds = question.Options
                .Where(option => option.IsCorrect == true)
                .Select(option => option.OptionId)
                .ToHashSet();
            HashSet<long> selectedIds = answer.SelectedOptionIds.ToHashSet();
            return correctIds.Count > 0 && selectedIds.SetEquals(correctIds);
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
