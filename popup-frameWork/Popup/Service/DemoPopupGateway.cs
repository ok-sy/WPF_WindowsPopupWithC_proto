using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * [역할] Demo Mode의 인메모리 "서버". IPopupGateway를 구현해 Java 서버·DB 없이도
     *        목록 조회(GET /p/api/wpf/popups)와 결과 전송(POST /p/api/wpf/popups/results)의 동작을 흉내 낸다.
     *
     * [추가 이유 — Demo Mode]
     *   예전 Demo Mode는 샘플 팝업을 띄우기만 하고 결과(닫기·숨김·제출·영상)는 버렸다.
     *   새 구조(기준 3·4)에서는 "창이 닫힐 때 결과 항목 1개 전송"이 핵심이므로, 데모에서도 그 흐름
     *   (PopupResultBuilder → PopupResultQueue → 게이트웨이 → 항목 응답 → 안내)을 실제 코드로 통과시킨다.
     *   서버 규칙을 최대한 그대로 재현한다:
     *     - HIDDEN : hideDays 동안 숨김 → 다음 목록에서 제외
     *     - SUBMITTED : QUIZ는 샘플 JSON의 correctAnswers로 채점(문항당 100/채점문항수 점, passingScore 이상이면 통과·완료),
     *                   SURVEY는 제출 즉시 완료 → 완료 팝업은 다음 목록에서 제외
     *     - VIDEO_WATCHED : watched/duration ≥ completionRatio(기본 1.0)면 완료
     *     - 같은 resultId 재수신은 DUPLICATE
     *   처리한 항목은 ResultProcessed 이벤트로 DemoWindow의 결과 로그에 보여 준다.
     *
     * [주의] 실제 서버는 정답을 내려주지 않지만 데모 샘플 JSON에는 correctAnswers가 있어 로컬 채점이 가능하다.
     *        운영 코드(PopupApiService)와 혼동하지 않도록 이 클래스는 Demo Mode에서만 생성된다.
     */
    public sealed class DemoPopupGateway : IPopupGateway
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

        private readonly Dictionary<string, PopupResponseDto> _popups = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, DateTimeOffset> _hiddenUntil = new(StringComparer.OrdinalIgnoreCase);
        private readonly HashSet<string> _completed = new(StringComparer.OrdinalIgnoreCase);
        private readonly HashSet<string> _receipts = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>결과 항목 1건이 처리될 때마다 (요청 항목, 응답) 쌍으로 알린다. DemoWindow가 로그로 표시한다.</summary>
        public event EventHandler<(WpfResultItemDto Item, WpfResultItemResponseDto Response)>? ResultProcessed;

        public DemoPopupGateway()
        {
            Reload();
        }

        /// <summary>샘플 JSON을 다시 읽고 숨김·완료·영수증 상태를 모두 지운다("서버 초기화").</summary>
        public void Reload()
        {
            _popups.Clear();
            _hiddenUntil.Clear();
            _completed.Clear();
            _receipts.Clear();
            foreach (PopupResponseDto popup in DemoPopupDataService.CreatePopups())
            {
                _popups[popup.PopupId] = popup;
            }
        }

        public int HiddenCount => _hiddenUntil.Count(pair => pair.Value > DateTimeOffset.Now);
        public int CompletedCount => _completed.Count;

        /// <summary>서버와 같은 규칙으로 숨김·완료 팝업을 제외한 목록. popupType을 주면 그 유형만.</summary>
        public Task<WpfPopupListResponseDto> GetWpfPopupsAsync(string? popupType)
        {
            List<PopupResponseDto> visible = _popups.Values
                .Where(popup => popupType == null || popup.PopupType.Equals(popupType, StringComparison.OrdinalIgnoreCase))
                .Where(popup => !_completed.Contains(popup.PopupId))
                .Where(popup => !_hiddenUntil.TryGetValue(popup.PopupId, out DateTimeOffset until) || until <= DateTimeOffset.Now)
                .OrderBy(popup => popup.DisplayOrder)
                .ToList();
            return Task.FromResult(new WpfPopupListResponseDto
            {
                ServerTime = DateTimeOffset.Now,
                UserId = "DEMO_USER",
                PollingIntervalSeconds = 0,
                Popups = visible
            });
        }

        public Task<WpfPopupListResponseDto> GetWpfPopupsAsync() => GetWpfPopupsAsync(null);

        public Task<WpfResultResponseDto> PostResultsAsync(WpfResultRequestDto request)
        {
            ArgumentNullException.ThrowIfNull(request);
            List<WpfResultItemResponseDto> results = new();
            foreach (WpfResultItemDto item in request.Results)
            {
                WpfResultItemResponseDto response = ProcessOne(item);
                results.Add(response);
                ResultProcessed?.Invoke(this, (item, response));
            }
            return Task.FromResult(new WpfResultResponseDto { ReceivedAt = DateTimeOffset.Now, Results = results });
        }

        private WpfResultItemResponseDto ProcessOne(WpfResultItemDto item)
        {
            WpfResultItemResponseDto response = new()
            {
                ResultId = item.ResultId,
                PopupId = item.PopupId,
                ResultType = item.ResultType
            };

            if (!_receipts.Add(item.ResultId))
            {
                response.Status = "DUPLICATE";
                return response;
            }
            if (!_popups.TryGetValue(item.PopupId, out PopupResponseDto? popup))
            {
                return Reject(response, "WPF_NOT_ELIGIBLE", "데모 목록에 없는 팝업입니다.");
            }

            response.Status = "ACCEPTED";
            response.PopupStatus = "CLOSED";
            response.Completed = _completed.Contains(item.PopupId);

            switch (item.ResultType)
            {
                case WpfResultType.Closed:
                    break;

                case WpfResultType.Hidden:
                    if (item.HideDays is null or < 1)
                    {
                        return Reject(response, "WPF_INVALID_HIDE_DAYS", "숨김 일수는 1 이상이어야 합니다.");
                    }
                    _hiddenUntil[item.PopupId] = DateTimeOffset.Now.AddDays(item.HideDays.Value);
                    response.PopupStatus = "HIDDEN";
                    response.HiddenUntil = _hiddenUntil[item.PopupId];
                    break;

                case WpfResultType.Submitted:
                    if (item.Answers == null || item.Answers.Count == 0)
                    {
                        return Reject(response, "WPF_INVALID_ANSWER", "답안이 없습니다.");
                    }
                    if (!popup.PopupType.Equals("SURVEY", StringComparison.OrdinalIgnoreCase)
                        && !popup.PopupType.Equals("QUIZ", StringComparison.OrdinalIgnoreCase))
                    {
                        return Reject(response, "WPF_TYPE_MISMATCH", "설문형 팝업만 답안을 제출할 수 있습니다.");
                    }
                    response.ResponseId = Math.Abs(item.ResultId.GetHashCode());
                    if (popup.PopupType.Equals("QUIZ", StringComparison.OrdinalIgnoreCase))
                    {
                        (double score, bool passed) = Grade(popup, item.Answers);
                        response.TotalScore = score;
                        response.Passed = passed;
                        if (passed) _completed.Add(item.PopupId);
                        response.PopupStatus = passed ? "COMPLETED" : "SUBMITTED";
                    }
                    else
                    {
                        _completed.Add(item.PopupId);          // SURVEY는 제출 즉시 완료 (채점 없음)
                        response.PopupStatus = "COMPLETED";
                    }
                    break;

                case WpfResultType.VideoWatched:
                    if (item.Video == null || item.Video.DurationSeconds <= 0)
                    {
                        return Reject(response, "WPF_INVALID_VIDEO", "영상 시청 정보가 없습니다.");
                    }
                    double ratio = Math.Min(1.0, Math.Floor((double)(item.Video.WatchedSeconds / item.Video.DurationSeconds) * 10000) / 10000);
                    double required = popup.CompletionRatio ?? 1.0;
                    response.WatchedRatio = ratio;
                    response.RequiredRatio = required;
                    if (ratio >= required)
                    {
                        _completed.Add(item.PopupId);
                        response.PopupStatus = "COMPLETED";
                    }
                    break;

                default:
                    return Reject(response, "WPF_INVALID_RESULT", $"알 수 없는 결과 유형: {item.ResultType}");
            }

            response.Completed = _completed.Contains(item.PopupId);
            if (response.Completed == true) response.CompletedAt = DateTimeOffset.Now;
            return response;
        }

        private static WpfResultItemResponseDto Reject(WpfResultItemResponseDto response, string code, string message)
        {
            response.Status = "REJECTED";
            response.Code = code;
            response.Message = message;
            response.PopupStatus = null;
            response.Completed = null;
            return response;
        }

        /*
         * QUIZ 채점(데모 전용). 채점 문항마다 선택한 선택지 value 집합이 correctAnswers와 같으면 정답.
         * 배점은 100/채점 문항 수. 통과 점수는 content.passingScore(없으면 100).
         */
        private static (double Score, bool Passed) Grade(PopupResponseDto popup, List<PopupSubmitAnswerRequestDto> answers)
        {
            SurveyPopupContentDto content = popup.Content.Deserialize<SurveyPopupContentDto>(JsonOptions) ?? new SurveyPopupContentDto();
            List<SurveyQuestionDto> questions = popup.Questions.Count > 0 ? popup.Questions : content.Questions;
            List<SurveyQuestionDto> scored = questions.Where(q => q.IsScored).ToList();
            if (scored.Count == 0) return (100, true);

            double perQuestion = 100.0 / scored.Count;
            double score = 0;
            foreach (SurveyQuestionDto question in scored)
            {
                PopupSubmitAnswerRequestDto? answer = answers.FirstOrDefault(a => a.QuestionId == question.QuestionId);
                if (answer == null) continue;
                HashSet<string> selected = question.Options
                    .Where(o => answer.OptionIds.Contains(o.OptionId))
                    .Select(o => o.Value)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                if (!string.IsNullOrWhiteSpace(answer.TextAnswer)) selected.Add(answer.TextAnswer.Trim());
                if (selected.SetEquals(question.CorrectAnswers)) score += perQuestion;
            }
            score = Math.Round(score, 2);
            double passing = content.PassingScore > 0 ? content.PassingScore : 100;
            return (score, score >= passing);
        }
    }
}
