using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * [역할] 팝업 결과 항목을 로컬 파일 큐에 보관하고 서버(POST /p/api/wpf/popups/results)로 전송한다.
     *
     * [추가 이유 — 기준 4]
     *   실시간 이벤트·진행률 전송을 없애고 "팝업 종료 시점 1회 전송"으로 바꿨으므로, 그 1회가 유실되면
     *   완료·숨김 상태가 서버에 남지 않는다. 네트워크 오류·서버 점검 중에도 결과를 잃지 않도록 전송 전에
     *   파일에 기록하고, 서버가 처리를 종결한 항목(ACCEPTED/DUPLICATE/REJECTED)만 제거한다.
     *
     * [설계 12 §7·§8 — 역할 분리] 사용자 화면(창 닫기)과 서버 전송을 분리한다.
     *   - Enqueue        : 파일에 저장만 하고 즉시 반환. 이 메서드가 끝나면 결과는 로컬에 안전하게 보존된 것이므로
     *                      호출자(PopupManager)는 서버 응답을 기다리지 않고 바로 창을 닫아도 된다.
     *   - FlushAsync     : [설계 35] 보관된 결과를 순서대로 1건씩 전송. 종결 결과 제거, 미종결에서 멈추고 Blocked로 알림.
     *                      조회 직전(MainWindow.LoadAndShowAvailablePopupsAsync)과 팝업 닫힘 직후(MainWindow.OnPopupFinished,
     *                      Demo는 DemoWindow.ContinueAfterResult)에 호출한다. 앱 종료 시에는 호출하지 않는다 —
     *                      종료 경로(MainWindow.StopServerRequests)는 StopTransmission으로 전송을 멈추고 파일 보관분은 다음 실행에서 보낸다.
     *   예전 EnqueueAndSendAsync(저장 후 전송 완료까지 대기)·SendImmediateAsync(제출 응답 대기)는 제거했다.
     *   설문·퀴즈 제출도 이제 로컬 판정 후 같은 경로로 간다.
     *   [설계 50 A4] 호출부가 없던 EnqueueAsync(Task 형태)·FlushInBackground(백그라운드 Flush)와 그 426 알림 이벤트
     *   ClientVersionRejected도 삭제했다. 426은 FlushAsync가 예외로 전파하고 호출자(MainWindow)가 직접 처리한다.
     *
     * [설계 13 §11 — 426] 서버가 클라이언트 버전 미지원(426)으로 거절하면 전송을 중단하고 항목을 그대로 보관한다.
     *   업데이트된 버전에서 다시 Flush 되며, 예외는 호출자에게 전파해 업데이트 안내에 쓰게 한다.
     *
     * [응답 처리 — 설계 34-19~24] "서버가 응답했다"가 아니라 "그 항목의 처리가 종결됐다"가 삭제 기준이다.
     *   - ACCEPTED / DUPLICATE / REJECTED(영구 업무 오류)만 큐에서 제거한다. REJECTED는 사유를 로그로 남긴다.
     *   - RETRYABLE_ERROR(확인된 일시 장애)는 보관하고 다음 Flush에서 같은 resultId로 재전송한다.
     *   - INTERNAL_ERROR(원인 미확정)는 보관하고 이번 실행에서 MaxInternalErrorAttemptsPerSession회까지만 재시도한다.
     *     횟수를 소진해도 삭제하지 않으며 다음 실행에서 다시 시도한다. 재시도 간격·최대 횟수 정책은 별도 확정 대상이다.
     *   - 알 수 없는 상태, 응답 누락, 이번에 보낸 항목과 resultId가 다른 응답은 종결로 보지 않는다(보관).
     *   - 요청 실패(5xx·4xx·타임아웃·연결 끊김)는 그 결과를 보관한다. 단 400(요청 형식 오류)인 결과는 이번 실행에서만
     *     제외(파일 보관)해 나머지 전송을 막지 않는다.
     *   항목의 resultId는 생성 시 확정되어 재전송 시 서버가 DUPLICATE로 걸러낸다.
     *
     * [파일 — 설계 34-24] %LOCALAPPDATA%\Popup\pending-results.json — 사용자 프로필 단위. 토큰·사번은 저장하지 않는다.
     *   임시 파일에 쓴 뒤 교체해 쓰기 도중 종료돼도 기존 파일이 깨지지 않게 한다. 읽을 수 없는 파일은 버리지 않고
     *   pending-results.corrupt-시각.json으로 옮겨 보존한다. 새 결과의 디스크 저장 실패는 호출자에게 알리고 큐에 남기지 않는다
     *   (창이 열린 채 상태를 유지). 이미 확정되어 파일에 있던 항목의 재기록 실패와 앱 종료 중 결과(RetainForExit)만
     *   이번 실행 동안 메모리에 보관해 다음 저장·FlushAsync 때 다시 기록·전송한다(프로세스가 종료되면 메모리 보관분은 남지 않는다).
     *   앱 종료 중 결과는 종료 경로가 이미 전송을 멈춘 뒤라 보통 그대로 사라진다(다음 실행에 전달되지 않음).
     * [동시성] 파일 접근(_fileLock)과 전송(_flushGate)을 분리한다. 전송 중에도 Enqueue는 짧게 끝난다.
     */
    /// <summary>
    /// [설계 35] <see cref="PopupResultQueue.FlushAsync"/> 결과. Blocked=true면 미종결 결과가 남아 다음 조회를 미룬다.
    /// LastSaved는 이번에 저장된(ACCEPTED·DUPLICATE) 마지막 결과 응답이며 NextStatus로 다음 조회 시점을 정한다.
    /// </summary>
    public sealed record ResultFlushOutcome(bool Blocked, WpfResultResponseDto? LastSaved);

    public sealed class PopupResultQueue
    {
        private static readonly JsonSerializerOptions FileJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        /* [설계 34-19] INTERNAL_ERROR 항목의 실행당 재시도 상한(임시값). 재시도 정책 확정 시 조정한다. */
        public const int MaxInternalErrorAttemptsPerSession = 3;

        private static readonly HashSet<string> SettledStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "ACCEPTED", "DUPLICATE", "REJECTED"
        };

        private readonly IPopupGateway _apiService;
        private readonly string _queueFilePath;
        private readonly object _fileLock = new();
        private readonly SemaphoreSlim _flushGate = new(1, 1);
        private readonly List<WpfResultItemDto> _unsaved = new();
        private readonly Dictionary<string, int> _internalErrorAttempts = new(StringComparer.OrdinalIgnoreCase);
        /* [설계 34 — 검토 보완] 단독으로 보내도 400인 항목. 이번 실행에서만 전송에서 빼고 파일에는 남긴다. */
        private readonly HashSet<string> _quarantined = new(StringComparer.OrdinalIgnoreCase);
        private volatile bool _transmissionStopped;

        // HTTP만 중단한다. 아직 열린 팝업의 결과를 파일에 저장하는 Enqueue는 유지한다.
        public void StopTransmission() => _transmissionStopped = true;

        public PopupResultQueue(IPopupGateway apiService, string? queueFilePath = null)
        {
            _apiService = apiService ?? throw new ArgumentNullException(nameof(apiService));
            _queueFilePath = queueFilePath ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Popup", "pending-results.json");
        }

        /// <summary>
        /// [설계 51-7] 보관 중인 미종결 결과 건수(파일 + 메모리 보관분). API Demo가 화면 표시와 연결 변경 확인에 쓴다.
        /// 파일을 읽을 수 없으면 예외를 그대로 던진다(건수를 0으로 오인하지 않게).
        /// (설계 18 L-0에서 호출부가 없어 삭제했던 PendingCount를 API Demo 호출부와 함께 메서드로 다시 둔다.)
        /// </summary>
        public int CountPending()
        {
            lock (_fileLock)
            {
                return LoadPendingUnlocked().Count;
            }
        }

        /// <summary>
        /// [설계 12 §8.1·설계 34-23] 확정된 결과 항목을 pending-results.json에 저장하고 반환한다(동기). 서버 전송은 하지 않는다.
        /// 전송 중에도 파일 잠금만 짧게 잡으므로 창 닫기(Closing) 경로에서 호출해도 된다.
        /// [검토 보완] 디스크 저장에 실패하면 항목을 큐(메모리 포함)에 남기지 않고 예외를 던진다. 호출자는 창을 유지한 채
        /// 상태를 들고 있다가 다음 닫기·제출 때 결과를 다시 만들어 저장한다. 미확정 결과가 먼저 전송되어 최종 결과가
        /// 같은 resultId의 DUPLICATE로 무시되는 일을 막기 위해서다. 앱 종료 중에는 <see cref="RetainForExit"/>를 쓴다.
        /// </summary>
        public void Enqueue(WpfResultItemDto item)
        {
            /*
             * [결과 전송 흐름]
             * PopupManager에서 닫기/숨김/영상/제출 결과가 만들어지면 여기로 들어온다.
             *
             * 반드시 "파일에 먼저 저장"한다. 창을 먼저 닫고 메모리에서만 전송하면
             * 프로세스 종료·네트워크 오류 때 결과가 사라진다(설계 12 §7).
             *
             * 이 파일 큐는 로그가 아니라 업무 결과 유실 방지 장치다.
             */
            ArgumentNullException.ThrowIfNull(item);
            lock (_fileLock)
            {
                List<WpfResultItemDto> pending = LoadPendingUnlocked();
                pending.RemoveAll(p => p.ResultId == item.ResultId);
                pending.Add(item);
                SavePendingUnlocked(pending);   // 실패하면 예외 — item은 어디에도 남지 않는다
            }
        }

        /// <summary>
        /// [설계 34-23] 앱 종료 중이라 닫기를 막을 수 없을 때만 쓴다. 디스크 저장을 한 번 더 시도하고, 실패하면 이번 실행 동안
        /// 메모리에만 보관한다. 종료 경로는 이미 전송을 멈췄고(StopTransmission) 종료 직전 Flush도 하지 않으므로, 메모리 보관분은
        /// 프로세스가 끝나면 서버에 보내지 못한 채 사라진다. 예외를 던지지 않는다.
        /// </summary>
        public void RetainForExit(WpfResultItemDto item)
        {
            ArgumentNullException.ThrowIfNull(item);
            lock (_fileLock)
            {
                _unsaved.RemoveAll(p => p.ResultId == item.ResultId);
                _unsaved.Add(item);
                try
                {
                    TrySavePendingUnlocked(LoadPendingUnlocked());
                }
                catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
                {
                    Debug.WriteLine($"종료 중 결과 파일 저장 실패, 메모리 보관 resultId={item.ResultId}: {exception.Message}");
                }
            }
        }

        /// <summary>
        /// [설계 35] 보관된 결과를 저장된 순서대로 1건씩 전송하고 종결된 결과만 제거한다.
        /// 네트워크·서버 오류는 조용히 넘기고 보관한다. 426(<see cref="WpfClientVersionException"/>)만 호출자에게 전파한다(보관 유지).
        /// 미종결 결과(전송 실패·RETRYABLE_ERROR·재시도 남은 INTERNAL_ERROR)를 만나면 순서를 지키기 위해 거기서 멈추고
        /// <see cref="ResultFlushOutcome.Blocked"/>로 알린다. 호출자(MainWindow)는 이 경우 다음 팝업을 조회하지 않는다
        /// (미전송 결과 우선 — 장애 복구 정책 확정 전 임시 기준, 설계 35 §4).
        /// [설계 39-1] 큐 파일을 읽거나 보존할 수 없으면 디스크에 미전송 결과가 남았는지 확인할 수 없으므로, 메모리 보관분을
        /// 보낸 뒤에도 Blocked로 알린다(정상 빈 큐와 구분). 파일 원본은 건드리지 않는다.
        /// </summary>
        public async Task<ResultFlushOutcome> FlushAsync()
        {
            await _flushGate.WaitAsync();
            try
            {
                if (_transmissionStopped) return new ResultFlushOutcome(true, null);
                List<WpfResultItemDto> pending;
                bool fileAvailable = true;
                lock (_fileLock)
                {
                    try
                    {
                        pending = LoadPendingUnlocked();
                    }
                    catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
                    {
                        // 파일을 읽거나 보존할 수 없으면 파일은 건드리지 않고 메모리 보관분만 전송한다.
                        fileAvailable = false;
                        pending = _unsaved.ToList();
                        Debug.WriteLine($"결과 큐 파일 사용 불가 — 파일은 그대로 두고 메모리 보관 {pending.Count}건만 전송: {exception.Message}");
                    }
                    if (fileAvailable) TrySavePendingUnlocked(pending);   // 메모리 보관분을 다시 디스크에 기록해 본다
                }
                List<WpfResultItemDto> sendable = pending
                    .Where(p => !_quarantined.Contains(p.ResultId))
                    .Where(p => !_internalErrorAttempts.TryGetValue(p.ResultId, out int attempts)
                        || attempts < MaxInternalErrorAttemptsPerSession)
                    .ToList();

                WpfResultResponseDto? lastSaved = null;
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
                        // [설계 13 §11] 버전 차단 — 항목을 지우지 않고 전송을 멈춘다. 업데이트 후 재전송.
                        throw;
                    }
                    catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.BadRequest)
                    {
                        // [설계 34 — 검토 보완] 요청 본문 자체가 400인 결과는 이번 실행에서만 제외(파일 보관)해 뒤 결과 전송을 막지 않는다.
                        _quarantined.Add(item.ResultId);
                        Debug.WriteLine($"결과 전송 400 — 이번 실행에서 제외(파일 보관) popupId={item.PopupId} " +
                            $"type={item.ResultType}: {exception.Message}");
                        continue;
                    }
                    catch (Exception exception)
                    {
                        // 5xx·그 밖의 4xx·타임아웃·연결 끊김: 보관하고 다음 기회에 같은 resultId로 재전송한다.
                        Debug.WriteLine($"결과 전송 실패, 보관 유지 resultId={item.ResultId}: {exception.Message}");
                        return new ResultFlushOutcome(true, lastSaved);
                    }

                    if (!Settle(item, response)) return new ResultFlushOutcome(true, lastSaved);
                    if (response.IsSaved) lastSaved = response;
                    lock (_fileLock)
                    {
                        _unsaved.RemoveAll(p => p.ResultId == item.ResultId);
                        if (!fileAvailable) continue;
                        // 전송 중 새로 저장된 항목을 지우지 않도록 최신 파일을 다시 읽어 종결 항목만 뺀다.
                        try
                        {
                            List<WpfResultItemDto> current = LoadPendingUnlocked();
                            current.RemoveAll(p => p.ResultId == item.ResultId);
                            TrySavePendingUnlocked(current);
                        }
                        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
                        {
                            // 지우지 못한 종결 항목은 다음 전송에서 DUPLICATE로 다시 종결된다.
                            Debug.WriteLine($"종결 항목 제거 실패(다음 전송에서 DUPLICATE 처리): {exception.Message}");
                        }
                    }
                }
                return new ResultFlushOutcome(!fileAvailable, lastSaved);
            }
            finally
            {
                _flushGate.Release();
            }
        }

        /// <summary>
        /// [설계 34-19~21·35] 이번에 보낸 결과의 종결 여부. ACCEPTED/DUPLICATE/REJECTED면 true(제거).
        /// INTERNAL_ERROR는 재시도 횟수를 세고, 그 밖의 상태·다른 resultId 응답은 보관(false)한다.
        /// </summary>
        private bool Settle(WpfResultItemDto item, WpfResultResponseDto? response)
        {
            if (response == null || !string.Equals(response.ResultId, item.ResultId, StringComparison.OrdinalIgnoreCase))
            {
                Debug.WriteLine($"결과 응답 무시(이번 전송 항목 아님) resultId={response?.ResultId}");
                return false;
            }
            if (SettledStatuses.Contains(response.Status ?? string.Empty))
            {
                if (response.IsRejected)
                {
                    Debug.WriteLine($"결과 거절 popupId={item.PopupId} type={item.ResultType} " +
                        $"code={response.Code} message={response.Message}");
                }
                _internalErrorAttempts.Remove(item.ResultId);
                return true;
            }
            if (string.Equals(response.Status, "INTERNAL_ERROR", StringComparison.OrdinalIgnoreCase))
            {
                int attempts = _internalErrorAttempts.TryGetValue(item.ResultId, out int count) ? count + 1 : 1;
                _internalErrorAttempts[item.ResultId] = attempts;
                Debug.WriteLine($"결과 내부 오류(보관, 이번 실행 {attempts}/{MaxInternalErrorAttemptsPerSession}회) " +
                    $"popupId={item.PopupId} code={response.Code}");
            }
            else
            {
                Debug.WriteLine($"결과 미종결(보관) status={response.Status} popupId={item.PopupId} code={response.Code}");
            }
            return false;
        }
        /// <summary>파일 항목과 메모리 보관 항목(디스크 저장 실패분)을 resultId 기준으로 합친다. _fileLock 안에서 호출한다.</summary>
        private List<WpfResultItemDto> LoadPendingUnlocked()
        {
            List<WpfResultItemDto> pending = ReadFileUnlocked();
            foreach (WpfResultItemDto item in _unsaved)
            {
                pending.RemoveAll(p => p.ResultId == item.ResultId);
                pending.Add(item);
            }
            return pending;
        }

        private List<WpfResultItemDto> ReadFileUnlocked()
        {
            if (!File.Exists(_queueFilePath))
            {
                return new List<WpfResultItemDto>();
            }
            try
            {
                string json = File.ReadAllText(_queueFilePath);
                return JsonSerializer.Deserialize<List<WpfResultItemDto>>(json, FileJsonOptions)
                    ?? new List<WpfResultItemDto>();
            }
            catch (JsonException exception)
            {
                // [설계 34-24] 손상된 큐 파일은 버리지 않고 옆으로 옮겨 보존한다(수동 복구용).
                string corrupt = Path.Combine(Path.GetDirectoryName(_queueFilePath) ?? ".",
                    $"{Path.GetFileNameWithoutExtension(_queueFilePath)}.corrupt-{DateTime.Now:yyyyMMddHHmmssfff}.json");
                // [검토 보완] 보존(이동)에 실패하면 원본을 덮어쓰거나 지우지 않도록 예외를 던진다.
                //   Enqueue는 저장 실패를 호출자에게 알리고(새 항목은 큐에 남기지 않음), Flush는 파일을 건드리지 않고 메모리분만 전송한다.
                try
                {
                    File.Move(_queueFilePath, corrupt);
                }
                catch (Exception moveException)
                {
                    throw new IOException($"손상된 결과 큐 파일을 보존하지 못해 덮어쓰지 않습니다: {moveException.Message}", exception);
                }
                Debug.WriteLine($"결과 큐 파일을 읽을 수 없어 {corrupt}로 보존하고 새로 시작합니다: {exception.Message}");
                return new List<WpfResultItemDto>();
            }
        }

        /// <summary>임시 파일에 쓴 뒤 교체한다. 성공하면 메모리 보관분을 비우고, 실패하면 예외를 그대로 던진다.</summary>
        private void SavePendingUnlocked(List<WpfResultItemDto> pending)
        {
            string? directory = Path.GetDirectoryName(_queueFilePath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }
            if (pending.Count == 0)
            {
                if (File.Exists(_queueFilePath))
                {
                    File.Delete(_queueFilePath);
                }
            }
            else
            {
                string temp = _queueFilePath + ".tmp";
                File.WriteAllText(temp, JsonSerializer.Serialize(pending, FileJsonOptions));
                File.Move(temp, _queueFilePath, overwrite: true);
            }
            _unsaved.Clear();
        }

        private void TrySavePendingUnlocked(List<WpfResultItemDto> pending)
        {
            try
            {
                SavePendingUnlocked(pending);
            }
            catch (Exception exception)
            {
                // 디스크에 쓰지 못한 항목은 메모리에 남겨 다음 저장·전송 때 다시 시도한다.
                foreach (WpfResultItemDto item in pending)
                {
                    if (!_unsaved.Any(p => p.ResultId == item.ResultId)) _unsaved.Add(item);
                }
                Debug.WriteLine($"결과 큐 파일 저장 실패(메모리 보관 {_unsaved.Count}건): {exception.Message}");
            }
        }
    }
}
