using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
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
     *     - SUBMITTED : QUIZ는 WPF가 로컬 채점해 보낸 score/passed를 그대로 저장(설계 12 — 서버 재채점 없음, 실제 서버는 참고·로그).
     *                   score/passed가 빠진 항목은 불합격으로 기록한다(설계 18 L-0 — C-18, 구 클라이언트용 Grade() 삭제).
     *                   SURVEY는 제출 즉시 완료 → 완료 팝업은 다음 목록에서 제외
     *     - VIDEO_WATCHED : watched/duration ≥ completionRatio(기본 1.0)면 완료
     *     - 같은 resultId 재수신은 DUPLICATE
     *   처리한 항목은 ResultProcessed 이벤트로 DemoWindow의 결과 로그에 보여 준다.
     *
     * [주의] 데모 샘플 JSON은 계약서 v3 형태(최상위 questions·passingScore, options[].isCorrect, questionScore)다
     *        (설계 18 L-2). 이 게이트웨이는 채점하지 않고 WPF 화면 쪽 QuizGrader가 채점한다.
     *        운영 코드(PopupApiService)와 혼동하지 않도록 이 클래스는 Demo Mode에서만 생성된다.
     */
    public sealed class DemoPopupGateway : IPopupGateway
    {
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

        /// <summary>Demo 화면에서 편집한 샘플을 표시와 결과 검증에 함께 사용한다. 숨김·완료 상태는 유지한다.</summary>
        public void ConfigurePopup(PopupResponseDto popup)
        {
            if (!_popups.ContainsKey(popup.PopupId)) throw new ArgumentException("데모 목록에 없는 팝업입니다.", nameof(popup));
            _popups[popup.PopupId] = popup;
        }

        /// <summary>서버와 같은 규칙으로 숨김·완료 팝업을 제외한 목록. popupType을 주면 그 유형만.</summary>
        public Task<WpfPopupListResponseDto> GetWpfPopupsAsync(string? popupType)
        {
            List<PopupResponseDto> visible = _popups.Values
                .Where(popup => popupType == null || (popupType == "VIDEO_QUIZ" ? popup.PopupId == "DEMO-VIDEO-QUIZ"
                    : popupType == "FOOTER_LINK" ? popup.PopupId == "DEMO-FOOTER-LINK"
                    : popup.PopupType.Equals(popupType, StringComparison.OrdinalIgnoreCase)
                        && popup.PopupId is not ("DEMO-VIDEO-QUIZ" or "DEMO-FOOTER-LINK")))
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
                    if (popup.Content.TryGetProperty("videoEnabled", out var enabled) && enabled.ValueKind == System.Text.Json.JsonValueKind.True)
                    {
                        if (item.Video == null || item.Video.DurationSeconds <= 0
                            || (double)(decimal.Floor(item.Video.WatchedSeconds / item.Video.DurationSeconds * 10000) / 10000) < (popup.CompletionRatio ?? 1))
                            return Reject(response, "WPF_VIDEO_INCOMPLETE", "영상 시청 완료 비율을 충족해야 합니다.");
                    }
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
                        /*
                         * [설계 12] WPF가 로컬 채점한 score/passed를 그대로 저장한다.
                         * [설계 18 L-0 — C-18] score/passed 없이 오는 "구 클라이언트" 제출을 위한 데모 채점기 Grade()는 삭제했다.
                         * 현행 WPF는 QUIZ 제출 때 항상 점수를 보내고 데모 결과 큐도 별도 파일이라 구 항목이 들어올 수 없다.
                         * 그래도 값이 빠진 항목이 오면 불합격(Passed=false)으로 기록하고 처리를 계속한다.
                         */
                        bool passed = item.Score.HasValue && item.Passed == true;
                        response.TotalScore = item.Score;
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
                    if (ratio >= required && popup.PopupType.Equals("VIDEO", StringComparison.OrdinalIgnoreCase))
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
    }
}
