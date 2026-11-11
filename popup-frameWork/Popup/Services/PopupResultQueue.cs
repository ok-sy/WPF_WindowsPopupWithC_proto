using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * POL-12-01 : 종결과 보관
     * POL-12-02 : 현행 임시 복구
     * POL-10-01 : 전달과 제출 식별
     * ■ 결과 메모리 큐
     * - in : apiService(IPopupGateway) 결과 전송 대상
     * - out: Enqueue 메모리 적재 · FlushAsync → ResultFlushOutcome(Blocked, LastSaved) · 예외: WpfClientVersionException(426)만 전파
     * - [역할] 팝업 결과 항목을 이 인스턴스의 메모리 목록에 보관하고 서버(POST /p/api/wpf/popups/results)로 전송한다.
     *
     * [메모리 전용 — 2026-10-28 결정] VMware 환경의 로컬 드라이브 쓰기 제약 때문에 미전송 결과를 파일에 쓰지 않는다.
     *   이 클래스는 파일·폴더를 읽거나 쓰지 않는다(경로 계산도 없음). 예전 버전이 남긴 pending-results.json도 읽거나 지우지 않는다.
     *   정상 종료·강제 종료·장애로 프로세스가 끝나면 아직 서버가 종결하지 않은 결과는 사라진다(수용한 유실).
     *   실행 중에는 전송 실패 결과를 보관해 같은 resultId로 다시 보낸다.
     *
     * [역할 분리] 사용자 화면(창 닫기)과 서버 전송을 분리한다.
     *   - Enqueue        : 메모리 목록에 넣고 즉시 반환. 호출자(PopupManager)는 서버 응답을 기다리지 않고 바로 창을 닫는다.
     *                      적재 성공은 서버 수신(HTTP 성공)을 뜻하지 않는다.
     *   - FlushAsync     : 보관된 결과를 순서대로 1건씩 전송. 종결 결과 제거, 미종결에서 멈추고 Blocked로 알림.
     *                      조회 직전(MainWindow.LoadAndShowAvailablePopupsAsync)과 팝업 닫힘 직후(MainWindow.OnPopupFinished,
     *                      Demo는 DemoWindow.ContinueAfterResult)에 호출한다. 앱 종료 시에는 호출하지 않는다 —
     *                      종료 경로(MainWindow.StopServerRequests)는 StopTransmission으로 전송을 멈추고 남은 결과는 프로세스와 함께 사라진다.
     *   저장 후 전송 완료나 제출 응답을 기다리는 경로는 두지 않는다. 설문·퀴즈 제출도 로컬 판정 후 같은 경로로 간다.
     *   백그라운드 Flush·426 알림 이벤트는 두지 않는다. 426은 FlushAsync가 예외로 전파하고 호출자(MainWindow)가 직접 처리한다.
     *
     * POL-15-02 : 인증·버전 — 서버가 클라이언트 버전 미지원(426)으로 거절하면 전송을 중단하고 항목을 그대로 보관한다
     *   (이번 실행 동안만. 업데이트로 다시 시작하면 남지 않는다). 예외는 호출자에게 전파해 업데이트 안내에 쓰게 한다.
     *
     * [응답 처리] "서버가 응답했다"가 아니라 "그 항목의 처리가 종결됐다"가 삭제 기준이다.
     *   - ACCEPTED / DUPLICATE / REJECTED(영구 업무 오류)만 큐에서 제거한다. REJECTED는 사유를 로그로 남긴다.
     *   - RETRYABLE_ERROR(확인된 일시 장애)는 보관하고 다음 Flush에서 같은 resultId로 재전송한다.
     *   - INTERNAL_ERROR(원인 미확정)는 보관하고 이번 실행에서 MaxInternalErrorAttemptsPerSession회까지만 재시도한다.
     *     횟수를 소진해도 삭제하지 않는다(이번 실행 동안 보관). 재시도 간격·최대 횟수 정책은 별도 확정 대상이다.
     *   - 알 수 없는 상태, 응답 누락, 이번에 보낸 항목과 resultId가 다른 응답은 종결로 보지 않는다(보관).
     *     HTTP 2xx인데 응답 내용이 잘못된 경우(빈 본문·JSON 오류·resultId 불일치·status 누락/모르는 값)는 재전송으로
     *     풀리지 않을 수 있어 이번 실행에서 MaxInvalidResponseAttemptsPerSession회까지만 재전송하고, 넘으면 전송 대상에서 빼
     *     (보관은 유지) 다음 조회를 막지 않는다(TODO45, 2026-11-11 결정 — 복구 무한 루프 방지).
     *     응답 자체가 없는 타임아웃·연결 끊김·5xx·401은 이 상한에 넣지 않는다(통합 복구 주기로 계속 재전송).
     *   - 요청 실패(5xx·4xx·타임아웃·연결 끊김)는 그 결과를 보관한다. 단 400(요청 JSON 문법·역직렬화 오류 — 같은 본문은
     *     다시 보내도 같다)인 결과는 종결로 보고 큐에서 지운 뒤 나머지 전송을 막지 않는다(TODO45 45-3, 2026-11-11 확정).
     *   항목의 resultId·deliveryId는 생성 시 확정되어 재전송 때 다시 만들지 않는다. 서버가 DUPLICATE로 걸러낸다.
     *
     * [동시성] 목록 접근(_stateLock)과 전송(_flushGate)을 분리한다. 네트워크 전송은 잠금 밖에서 기다리므로 전송 중에도 Enqueue는 짧게 끝난다.
     *   전송 중 같은 resultId 항목이 새로 들어오면(갱신) 과거 응답으로 지우지 않도록, 보낸 그 객체(참조)일 때만 제거한다.
     */
    /// <summary>
    /// POL-12-02 : 현행 임시 복구 — <see cref="PopupResultQueue.FlushAsync"/> 결과. Blocked=true면 미종결 결과가 남아 다음 조회를 미룬다.
    /// LastSaved는 이번에 저장된(ACCEPTED·DUPLICATE) 마지막 결과 응답이며 NextStatus로 다음 조회 시점을 정한다.
    /// HoldNextQuery=true면 이번 전송에서 장애 결과(TODO45)가 deliveryId 없이 저장됐거나 저장되지 못하고 종결·제외되어,
    /// 같은 깨진 조회 응답을 바로 다시 받지 않도록 nextStatus와 관계없이 최신 조회 간격을 기다린다.
    /// </summary>
    public sealed record ResultFlushOutcome(bool Blocked, WpfResultResponseDto? LastSaved, bool HoldNextQuery = false);

    public sealed class PopupResultQueue
    {
        /* POL-12-02 : 현행 임시 복구 — INTERNAL_ERROR 항목의 실행당 재시도 상한(임시값). 재시도 정책 확정 시 조정한다. */
        public const int MaxInternalErrorAttemptsPerSession = 3;

        /* POL-12-04 : 통합 복구 주기 — HTTP 2xx인데 응답 내용이 잘못된 결과의 실행당 재전송 상한(TODO45, 2026-11-11 결정). */
        public const int MaxInvalidResponseAttemptsPerSession = 3;

        private static readonly HashSet<string> SettledStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "ACCEPTED", "DUPLICATE", "REJECTED"
        };

        private readonly IPopupGateway _apiService;
        private readonly object _stateLock = new();
        private readonly SemaphoreSlim _flushGate = new(1, 1);
        /* 미전송 결과(적재 순서). _stateLock 안에서만 읽고 쓴다. */
        private readonly List<WpfResultItemDto> _pending = new();
        private readonly Dictionary<string, int> _internalErrorAttempts = new(StringComparer.OrdinalIgnoreCase);
        /* POL-12-04 : 통합 복구 주기 — resultId별 잘못된 2xx 응답 횟수. 상한에 이르면 이번 실행에서 전송 대상에서 뺀다. */
        private readonly Dictionary<string, int> _invalidResponseAttempts = new(StringComparer.OrdinalIgnoreCase);
        private volatile bool _transmissionStopped;

        // HTTP만 중단한다. 아직 열린 팝업의 결과를 받는 Enqueue는 유지한다.
        public void StopTransmission() => _transmissionStopped = true;

        public PopupResultQueue(IPopupGateway apiService)
        {
            _apiService = apiService ?? throw new ArgumentNullException(nameof(apiService));
        }

        /// <summary>
        /// POL-14-02 : Demo 모드 — 보관 중인 미종결 결과 건수(메모리 목록). API Demo가 화면 표시와 연결 변경 확인에 쓴다.
        /// </summary>
        public int CountPending()
        {
            lock (_stateLock)
            {
                return _pending.Count;
            }
        }

        /// <summary>
        /// POL-12-01 : 종결과 보관
        /// ■ 결과 적재 — 확정된 결과 항목을 메모리 목록에 넣고 반환한다(동기). 서버 전송은 하지 않는다.
        /// 같은 resultId가 이미 있으면 새 항목으로 바꿔 끝에 둔다. 잠금을 짧게 잡으므로 창 닫기(Closing) 경로에서 호출해도 된다.
        /// </summary>
        public void Enqueue(WpfResultItemDto item)
        {
            /*
             * [결과 전송 흐름]
             * PopupManager에서 닫기/숨김/영상/제출 결과가 만들어지면 여기로 들어온다.
             * 메모리에만 보관하므로 프로세스가 끝나기 전에 서버가 종결하지 못한 결과는 사라진다(2026-10-28 결정).
             */
            ArgumentNullException.ThrowIfNull(item);
            lock (_stateLock)
            {
                _pending.RemoveAll(p => p.ResultId == item.ResultId);
                _pending.Add(item);
            }
        }

        /// <summary>
        /// POL-12-01 : 종결과 보관 — 앱 종료 중 닫힘 결과 보관. 메모리 전용이라 <see cref="Enqueue"/>와 같고 예외를 던지지 않는다.
        /// 종료 경로는 이미 전송을 멈췄고(StopTransmission) 종료 직전 Flush도 하지 않으므로 프로세스가 끝나면 사라진다.
        /// </summary>
        public void RetainForExit(WpfResultItemDto item)
        {
            if (item == null) return;
            Enqueue(item);
        }

        /// <summary>
        /// POL-12-02 : 현행 임시 복구
        /// ■ 결과 전송 — 보관된 결과를 적재 순서대로 1건씩 전송하고 종결된 결과만 제거한다.
        /// 네트워크·서버 오류는 조용히 넘기고 보관한다. 426(<see cref="WpfClientVersionException"/>)만 호출자에게 전파한다(보관 유지).
        /// 미종결 결과(전송 실패·RETRYABLE_ERROR·재시도 남은 INTERNAL_ERROR)를 만나면 순서를 지키기 위해 거기서 멈추고
        /// <see cref="ResultFlushOutcome.Blocked"/>로 알린다. 호출자(MainWindow)는 이 경우 다음 팝업을 조회하지 않는다
        /// (미전송 결과 우선 — 장애 복구 정책 확정 전 임시 기준).
        /// </summary>
        public async Task<ResultFlushOutcome> FlushAsync()
        {
            await _flushGate.WaitAsync();
            try
            {
                if (_transmissionStopped) return new ResultFlushOutcome(true, null);
                List<WpfResultItemDto> sendable;
                lock (_stateLock)
                {
                    sendable = _pending
                        .Where(p => !_internalErrorAttempts.TryGetValue(p.ResultId, out int attempts)
                            || attempts < MaxInternalErrorAttemptsPerSession)
                        .Where(p => !_invalidResponseAttempts.TryGetValue(p.ResultId, out int invalid)
                            || invalid < MaxInvalidResponseAttemptsPerSession)
                        .ToList();
                }

                WpfResultResponseDto? lastSaved = null;
                // POL-12-04 : 통합 복구 주기 — 장애 결과(TODO45)가 deliveryId 없이 저장되거나 저장되지 못하고 끝나면,
                // 서버가 그 전달 건을 닫지 못해 바로 다시 조회하면 같은 깨진 응답을 받을 수 있으므로 다음 조회를 조회 간격만큼 미룬다.
                bool holdNextQuery = false;
                foreach (WpfResultItemDto item in sendable)
                {
                    if (_transmissionStopped) return new ResultFlushOutcome(true, lastSaved);
                    WpfResultResponseDto response;
                    try
                    {
                        response = await _apiService.PostResultAsync(item);
                    }
                    catch (WpfClientVersionException)
                    {
                        StopTransmission();
                        // POL-15-02 : 인증·버전 — 버전 차단 — 항목을 지우지 않고 전송을 멈춘다.
                        throw;
                    }
                    catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.BadRequest)
                    {
                        // POL-12-02 : 종결과 보관 (TODO45 45-3, 2026-11-11 확정) — 요청 본문 자체가 400인 결과는 재전송해도 같으므로
                        // 종결로 보고 큐에서 지운다(로그만 남김). 뒤 결과 전송·조회를 막지 않는다.
                        lock (_stateLock)
                        {
                            _pending.RemoveAll(p => ReferenceEquals(p, item));
                            _internalErrorAttempts.Remove(item.ResultId);
                            _invalidResponseAttempts.Remove(item.ResultId);
                        }
                        Debug.WriteLine($"결과 전송 400 — 종결·삭제 resultId={item.ResultId} deliveryId={item.DeliveryId} " +
                            $"popupId={item.PopupId} type={item.ResultType}: {exception.Message}");
                        holdNextQuery |= item.IsErrorResult;
                        continue;
                    }
                    catch (Exception exception) when (exception is JsonException or InvalidOperationException)
                    {
                        // POL-12-04 : 통합 복구 주기 — HTTP 2xx인데 본문이 비었거나 JSON이 아니다. 실행당 상한까지만 재전송한다.
                        if (CountInvalidResponse(item, "본문 없음·JSON 오류: " + exception.Message))
                        {
                            holdNextQuery |= item.IsErrorResult;
                            continue;
                        }
                        return new ResultFlushOutcome(true, lastSaved);
                    }
                    catch (Exception exception)
                    {
                        // 5xx·그 밖의 4xx·타임아웃·연결 끊김: 보관하고 다음 기회에 같은 resultId로 재전송한다.
                        Debug.WriteLine($"결과 전송 실패, 보관 유지 resultId={item.ResultId}: {exception.Message}");
                        return new ResultFlushOutcome(true, lastSaved);
                    }

                    if (!Settle(item, response))
                    {
                        // 상한에 이른 잘못된 응답은 이번 실행에서 빼고 다음 결과·조회로 넘어간다.
                        if (ReachedInvalidResponseLimit(item))
                        {
                            holdNextQuery |= item.IsErrorResult;
                            continue;
                        }
                        return new ResultFlushOutcome(true, lastSaved);
                    }
                    if (response.IsSaved) lastSaved = response;
                    // deliveryId를 확보한 장애 결과가 저장됐으면 서버가 그 전달 건을 닫았으므로 nextStatus를 따른다.
                    if (item.IsErrorResult && (!response.IsSaved || string.IsNullOrEmpty(item.DeliveryId))) holdNextQuery = true;
                    lock (_stateLock)
                    {
                        // 전송 중 같은 resultId로 다시 들어온(갱신된) 항목은 지우지 않는다 — 보낸 그 객체만 제거.
                        _pending.RemoveAll(p => ReferenceEquals(p, item));
                    }
                }
                return new ResultFlushOutcome(false, lastSaved, holdNextQuery);
            }
            finally
            {
                _flushGate.Release();
            }
        }

        /// <summary>
        /// POL-12-01 : 종결과 보관 — 이번에 보낸 결과의 종결 여부. ACCEPTED/DUPLICATE/REJECTED면 true(제거).
        /// INTERNAL_ERROR는 재시도 횟수를 세고, 그 밖의 상태·다른 resultId 응답은 보관(false)한다.
        /// </summary>
        private bool Settle(WpfResultItemDto item, WpfResultResponseDto? response)
        {
            if (response == null || !string.Equals(response.ResultId, item.ResultId, StringComparison.OrdinalIgnoreCase))
            {
                CountInvalidResponse(item, $"resultId 불일치(응답 resultId={response?.ResultId}, status={response?.Status})");
                return false;
            }
            if (SettledStatuses.Contains(response.Status ?? string.Empty))
            {
                if (response.IsRejected)
                {
                    Debug.WriteLine($"결과 거절 popupId={item.PopupId} type={item.ResultType} " +
                        $"code={response.Code} message={response.Message}");
                }
                lock (_stateLock)
                {
                    _internalErrorAttempts.Remove(item.ResultId);
                    _invalidResponseAttempts.Remove(item.ResultId);
                }
                return true;
            }
            if (string.Equals(response.Status, "INTERNAL_ERROR", StringComparison.OrdinalIgnoreCase))
            {
                int attempts;
                lock (_stateLock)
                {
                    attempts = _internalErrorAttempts.TryGetValue(item.ResultId, out int count) ? count + 1 : 1;
                    _internalErrorAttempts[item.ResultId] = attempts;
                }
                Debug.WriteLine($"결과 내부 오류(보관, 이번 실행 {attempts}/{MaxInternalErrorAttemptsPerSession}회) " +
                    $"popupId={item.PopupId} code={response.Code}");
            }
            else if (string.Equals(response.Status, "RETRYABLE_ERROR", StringComparison.OrdinalIgnoreCase))
            {
                // 서버가 일시 장애로 확인한 상태라 상한 없이 통합 복구 주기로 재전송한다.
                Debug.WriteLine($"결과 미종결(보관) status={response.Status} popupId={item.PopupId} code={response.Code}");
            }
            else
            {
                CountInvalidResponse(item, $"status 누락·모르는 값(status={response.Status}, code={response.Code})");
            }
            return false;
        }

        /// <summary>
        /// POL-12-04 : 통합 복구 주기 — HTTP 2xx인데 응답 내용이 잘못된 횟수를 resultId별로 세고 로그를 남긴다.
        /// 상한(<see cref="MaxInvalidResponseAttemptsPerSession"/>)에 이르면 true: 이번 실행에서 전송 대상에서 빼고(보관 유지) 조회를 막지 않는다.
        /// </summary>
        private bool CountInvalidResponse(WpfResultItemDto item, string reason)
        {
            int attempts;
            lock (_stateLock)
            {
                attempts = _invalidResponseAttempts.TryGetValue(item.ResultId, out int count) ? count + 1 : 1;
                _invalidResponseAttempts[item.ResultId] = attempts;
            }
            bool reachedLimit = attempts >= MaxInvalidResponseAttemptsPerSession;
            Debug.WriteLine($"결과 응답 이상(보관, 이번 실행 {attempts}/{MaxInvalidResponseAttemptsPerSession}회" +
                $"{(reachedLimit ? " — 상한 도달, 이번 실행에서 전송 제외·조회 허용" : "")}) " +
                $"resultId={item.ResultId} deliveryId={item.DeliveryId} popupId={item.PopupId}: {reason}");
            return reachedLimit;
        }

        private bool ReachedInvalidResponseLimit(WpfResultItemDto item)
        {
            lock (_stateLock)
            {
                return _invalidResponseAttempts.TryGetValue(item.ResultId, out int count)
                    && count >= MaxInvalidResponseAttemptsPerSession;
            }
        }
    }
}
