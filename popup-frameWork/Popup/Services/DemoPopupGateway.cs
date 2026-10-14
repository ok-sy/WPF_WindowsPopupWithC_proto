using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * [역할] Demo Mode의 인메모리 "서버". IPopupGateway를 구현해 Java 서버·DB 없이도
     *        단건 조회(POST /p/api/wpf/popups)와 결과 1건 전송(POST /p/api/wpf/popups/results)의 동작을 흉내 낸다.
     *
     * [추가 이유 — Demo Mode]
     *   예전 Demo Mode는 샘플 팝업을 띄우기만 하고 결과(닫기·숨김·제출·영상)는 버렸다.
     *   새 구조(기준 3·4)에서는 "창이 닫힐 때 결과 항목 1개 전송"이 핵심이므로, 데모에서도 그 흐름
     *   (PopupResultBuilder → PopupResultQueue → 게이트웨이 → 항목 응답 → 안내)을 실제 코드로 통과시킨다.
     *   서버 규칙을 최대한 그대로 재현한다:
     *     - HIDDEN : hideDays(1~3650) 동안 숨김 → 다음 조회에서 제외
     *     - SUBMITTED : QUIZ는 WPF가 로컬 채점해 보낸 score/passed를 그대로 저장(설계 12 — 서버 재채점 없음, 실제 서버는 참고·로그).
     *                   score/passed가 빠진 항목은 불합격으로 기록한다(설계 18 L-0 — C-18, 구 클라이언트용 Grade() 삭제).
     *                   SURVEY는 제출 즉시 완료 → 완료 팝업은 다음 조회에서 제외
     *     - 거절(REJECTED)은 서버 트랜잭션 롤백과 같이 영수증을 남기지 않는다(같은 resultId 재전송은 다시 검사).
     *     - VIDEO_WATCHED : watched/duration ≥ completionRatio(기본 1.0)면 완료
     *     - 같은 resultId 재수신은 DUPLICATE
     *     - [설계 35] 조회마다 전달 건(deliveryId)을 발급하고 결과에서 일치·미종료를 검사한다. 일반 안내(TEXT·IMAGE) 닫기는 완료,
     *       설문·퀴즈·영상의 미완료 결과는 조회 간격(DeferSeconds) 동안 재노출 유예. 저장 후 남은 후보로 nextStatus를 돌려준다.
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
        private readonly Dictionary<string, DateTimeOffset> _deferredUntil = new(StringComparer.OrdinalIgnoreCase);
        /* [설계 35] 전달 건: deliveryId → (popupId, 결과 저장 여부) */
        private readonly Dictionary<string, (string PopupId, bool Done)> _deliveries = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>[설계 35] 미완료 결과의 재노출 유예(서버 pollingIntervalSeconds 최솟값과 같은 30분).</summary>
        public const int DeferSeconds = 1800;

        /// <summary>결과 1건이 처리될 때마다 (요청, 응답) 쌍으로 알린다. DemoWindow가 로그로 표시한다.</summary>
        public event EventHandler<(WpfResultItemDto Item, WpfResultResponseDto Response)>? ResultProcessed;

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
            _deferredUntil.Clear();
            _deliveries.Clear();
            foreach (PopupResponseDto popup in DemoPopupDataService.CreatePopups())
            {
                _popups[popup.PopupId] = popup;
            }
        }

        public int HiddenCount => _hiddenUntil.Count(pair => pair.Value > DateTimeOffset.Now);
        public int CompletedCount => _completed.Count;
        public int DeferredCount => _deferredUntil.Count(pair => pair.Value > DateTimeOffset.Now);

        /// <summary>Demo 화면에서 편집한 샘플을 표시와 결과 검증에 함께 사용한다. 숨김·완료 상태는 유지한다.</summary>
        public void ConfigurePopup(PopupResponseDto popup)
        {
            if (!_popups.ContainsKey(popup.PopupId)) throw new ArgumentException("데모 목록에 없는 팝업입니다.", nameof(popup));
            _popups[popup.PopupId] = popup;
        }

        /// <summary>서버와 같은 규칙으로 숨김·완료·재노출 유예 팝업을 제외한 후보(표시 순서). popupType을 주면 그 유형만.</summary>
        private List<PopupResponseDto> Candidates(string? popupType) => _popups.Values
            .Where(popup => popupType == null || (popupType == "VIDEO_QUIZ" ? popup.PopupId == "DEMO-VIDEO-QUIZ"
                : popupType == "FOOTER_LINK" ? popup.PopupId == "DEMO-FOOTER-LINK"
                : popup.PopupType.Equals(popupType, StringComparison.OrdinalIgnoreCase)
                    && popup.PopupId is not ("DEMO-VIDEO-QUIZ" or "DEMO-FOOTER-LINK")))
            .Where(popup => !_completed.Contains(popup.PopupId))
            .Where(popup => !_hiddenUntil.TryGetValue(popup.PopupId, out DateTimeOffset until) || until <= DateTimeOffset.Now)
            .Where(popup => !_deferredUntil.TryGetValue(popup.PopupId, out DateTimeOffset until) || until <= DateTimeOffset.Now)
            .OrderBy(popup => popup.DisplayOrder)
            .ToList();

        /// <summary>
        /// [설계 35] 후보 첫 팝업 1건에 새 전달 건을 붙여 돌려준다(없으면 Popup=null). popupType을 주면 그 유형만(Demo 화면 필터).
        /// 원본 샘플은 바꾸지 않고 사본에 deliveryId를 넣는다.
        /// </summary>
        public Task<WpfNextPopupResponseDto> GetNextPopupAsync(string? popupType)
        {
            PopupResponseDto? first = Candidates(popupType).FirstOrDefault();
            PopupResponseDto? delivered = null;
            if (first != null)
            {
                delivered = System.Text.Json.JsonSerializer.Deserialize<PopupResponseDto>(System.Text.Json.JsonSerializer.Serialize(first))!;
                delivered.DeliveryId = "DEMO-DLV-" + Guid.NewGuid().ToString("N");
                _deliveries[delivered.DeliveryId] = (first.PopupId, false);
            }
            return Task.FromResult(new WpfNextPopupResponseDto { PollingIntervalSeconds = 0, Popup = delivered });
        }

        public Task<WpfNextPopupResponseDto> GetNextPopupAsync() => GetNextPopupAsync(null);

        /// <summary>서버처럼 결과 1건을 처리하고, 저장 성공이면 남은 후보 유무를 nextStatus로 알린다.</summary>
        public Task<WpfResultResponseDto> PostResultAsync(WpfResultItemDto item)
        {
            ArgumentNullException.ThrowIfNull(item);
            WpfResultResponseDto response = ProcessOne(item);
            // 서버는 거절 시 REQUIRES_NEW 트랜잭션이 롤백되어 영수증이 남지 않는다. Demo도 같게 영수증을 지운다.
            if (response.IsRejected) _receipts.Remove(item.ResultId);
            if (response.IsSaved) response.NextStatus = Candidates(null).Count > 0 ? "AVAILABLE" : "EMPTY";
            ResultProcessed?.Invoke(this, (item, response));
            return Task.FromResult(response);
        }
        private WpfResultResponseDto ProcessOne(WpfResultItemDto item)
        {
            WpfResultResponseDto response = new() { ResultId = item.ResultId };

            if (!_receipts.Add(item.ResultId))
            {
                response.Status = "DUPLICATE";
                return response;
            }
            if (!_popups.TryGetValue(item.PopupId, out PopupResponseDto? popup))
            {
                return Reject(response, "WPF_NOT_ELIGIBLE", "데모 목록에 없는 팝업입니다.");
            }
            if (!_deliveries.TryGetValue(item.DeliveryId ?? string.Empty, out var delivery) || delivery.PopupId != item.PopupId)
            {
                return Reject(response, "WPF_INVALID_DELIVERY", "유효한 전달 건이 아닙니다.");
            }
            if (delivery.Done)
            {
                return Reject(response, "WPF_DELIVERY_COMPLETED", "이미 결과가 저장된 전달 건입니다.");
            }

            response.Status = "ACCEPTED";

            switch (item.ResultType)
            {
                case WpfResultType.Closed:
                    // [설계 35] 일반 안내(TEXT·IMAGE)의 닫기는 확인 완료. 그 밖의 유형은 완료 전 닫기라 유예만 적용한다.
                    if (popup.PopupType.Equals("TEXT", StringComparison.OrdinalIgnoreCase)
                        || popup.PopupType.Equals("IMAGE", StringComparison.OrdinalIgnoreCase)) _completed.Add(item.PopupId);
                    break;

                case WpfResultType.Hidden:
                    if (item.HideDays is null or < 1 or > 3650)
                    {
                        return Reject(response, "WPF_INVALID_RESULT", "숨김 일수는 1~3650일이어야 합니다."); // 서버와 같이 요청 검증 오류(설계 50)
                    }
                    _hiddenUntil[item.PopupId] = DateTimeOffset.Now.AddDays(item.HideDays.Value);
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
                    if (popup.PopupType.Equals("QUIZ", StringComparison.OrdinalIgnoreCase))
                    {
                        /*
                         * [설계 12·33] WPF가 로컬 채점한 score/passed를 그대로 저장한다(서버와 같이 QUIZ 필수, 없으면 REJECTED).
                         * [설계 18 L-0 — C-18] score/passed 없이 오는 "구 클라이언트" 제출을 위한 데모 채점기 Grade()는 삭제했다.
                         * [설계 33] 응답에는 totalScore/passed를 다시 내려주지 않는다.
                         */
                        if (!item.Score.HasValue || item.Passed == null)
                        {
                            return Reject(response, "WPF_INVALID_RESULT", "QUIZ 제출에는 WPF 채점 결과(score·passed)가 필요합니다.");
                        }
                        bool passed = item.Passed.Value;
                        if (passed) _completed.Add(item.PopupId);
                    }
                    else
                    {
                        _completed.Add(item.PopupId);          // SURVEY는 제출 즉시 완료 (채점 없음)
                    }
                    break;

                case WpfResultType.VideoWatched:
                    if (item.Video == null || item.Video.DurationSeconds <= 0)
                    {
                        return Reject(response, "WPF_INVALID_VIDEO", "영상 시청 정보가 없습니다.");
                    }
                    double ratio = Math.Min(1.0, Math.Floor((double)(item.Video.WatchedSeconds / item.Video.DurationSeconds) * 10000) / 10000);
                    double required = popup.CompletionRatio ?? 1.0;
                    if (ratio >= required && popup.PopupType.Equals("VIDEO", StringComparison.OrdinalIgnoreCase))
                    {
                        _completed.Add(item.PopupId);
                    }
                    break;

                default:
                    return Reject(response, "WPF_INVALID_RESULT", $"알 수 없는 결과 유형: {item.ResultType}");
            }

            _deliveries[item.DeliveryId!] = (item.PopupId, true);
            if (!_completed.Contains(item.PopupId)) _deferredUntil[item.PopupId] = DateTimeOffset.Now.AddSeconds(DeferSeconds);
            return response;
        }

        private static WpfResultResponseDto Reject(WpfResultResponseDto response, string code, string message)
        {
            response.Status = "REJECTED";
            response.Code = code;
            response.Message = message;
            return response;
        }
    }
}
