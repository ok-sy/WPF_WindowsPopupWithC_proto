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
     *   - Enqueue(Async) : 파일에 저장만 하고 즉시 반환. 이 메서드가 끝나면 결과는 로컬에 안전하게 보존된 것이므로
     *                      호출자(PopupManager)는 서버 응답을 기다리지 않고 바로 창을 닫아도 된다.
     *   - FlushAsync     : 보관된 항목을 최대 50개씩 전송. 종결 항목 제거, 그 밖의 항목 유지.
     *                      WPF 시작 직후·목록 조회 직전·종료 직전·Enqueue 직후(백그라운드)에 호출한다.
     *   - FlushInBackground : FlushAsync를 기다리지 않고 실행하며 예외를 안에서 삼킨다(UI에 영향 없음).
     *   예전 EnqueueAndSendAsync(저장 후 전송 완료까지 대기)·SendImmediateAsync(제출 응답 대기)는 제거했다.
     *   설문·퀴즈 제출도 이제 로컬 판정 후 같은 경로로 간다.
     *
     * [설계 13 §11 — 426] 서버가 클라이언트 버전 미지원(426)으로 거절하면 전송을 중단하고 항목을 그대로 보관한다.
     *   업데이트된 버전에서 다시 Flush 되며, 예외는 호출자에게 전파해 업데이트 안내에 쓰게 한다.
     *
     * [응답 처리 — 설계 34-19~24] "서버가 응답했다"가 아니라 "그 항목의 처리가 종결됐다"가 삭제 기준이다.
     *   - ACCEPTED / DUPLICATE / REJECTED(영구 업무 오류)만 큐에서 제거한다. REJECTED는 사유를 로그로 남긴다.
     *   - RETRYABLE_ERROR(확인된 일시 장애)는 보관하고 다음 Flush에서 같은 resultId로 재전송한다.
     *   - INTERNAL_ERROR(원인 미확정)는 보관하고 이번 실행에서 MaxInternalErrorAttemptsPerSession회까지만 재시도한다.
     *     횟수를 소진해도 삭제하지 않으며 다음 실행에서 다시 시도한다. 재시도 간격·최대 횟수 정책은 별도 확정 대상이다.
     *   - 알 수 없는 상태, 응답 누락 항목, 이번 batch에 없는 resultId 응답은 종결로 보지 않는다(보관).
     *   - 요청 전체 실패(5xx·4xx·타임아웃·연결 끊김)는 전송한 항목을 모두 보관한다. 단 400(요청 형식 오류)은 batch를 나눠
     *     원인 항목을 좁히고, 단독으로도 400인 항목만 이번 실행에서 제외(파일 보관)해 나머지 전송을 막지 않는다.
     *   항목의 resultId는 생성 시 확정되어 재전송 시 서버가 DUPLICATE로 걸러낸다.
     *
     * [파일 — 설계 34-24] %LOCALAPPDATA%\Popup\pending-results.json — 사용자 프로필 단위. 토큰·사번은 저장하지 않는다.
     *   임시 파일에 쓴 뒤 교체해 쓰기 도중 종료돼도 기존 파일이 깨지지 않게 한다. 읽을 수 없는 파일은 버리지 않고
     *   pending-results.corrupt-시각.json으로 옮겨 보존한다. 디스크 저장에 실패한 항목은 이번 실행 동안 메모리에 보관하고
     *   다음 저장·전송 때 다시 기록·전송한다(프로세스가 종료되면 메모리 보관분은 남지 않는다).
     * [동시성] 파일 접근(_fileLock)과 전송(_flushGate)을 분리한다. 전송 중에도 Enqueue는 짧게 끝난다.
     */
    public sealed class PopupResultQueue
    {
        private static readonly JsonSerializerOptions FileJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        private const int MaxBatchSize = 50;

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
        /// [설계 13 §8] 백그라운드 Flush가 426(클라이언트 버전 미지원)을 받았을 때 알린다.
        /// MainWindow가 구독해 주기 조회를 멈추고 업데이트 안내를 띄운다. UI 스레드가 아닐 수 있다.
        /// </summary>
        public event EventHandler<WpfClientVersionException>? ClientVersionRejected;

        /*
         * [설계 18 L-0 — C-10 삭제] 화면 표시·진단용으로 두었던 PendingCount 속성은 호출부가 없어 삭제했다.
         * 보관 건수 확인이 다시 필요하면 pending-results.json을 직접 보거나 그때 진단 경로를 추가한다.
         */

        /// <summary>
        /// [설계 12 §8.1·설계 34-23] 항목을 pending-results.json에 저장하고 반환한다(동기). 서버 전송은 하지 않는다.
        /// 전송 중에도 파일 잠금만 짧게 잡으므로 창 닫기(Closing) 경로에서 호출해도 된다.
        /// 디스크 저장에 실패하면 항목을 메모리에 보관한 뒤 예외를 다시 던진다(호출자가 안내·로그를 결정).
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
                _unsaved.RemoveAll(p => p.ResultId == item.ResultId);
                _unsaved.Add(item);
                List<WpfResultItemDto> pending = LoadPendingUnlocked();
                SavePendingUnlocked(pending);   // 실패하면 item은 _unsaved에 남는다
            }
        }

        /// <summary><see cref="Enqueue"/>의 Task 형태(기존 훅 시그니처 유지).</summary>
        public Task EnqueueAsync(WpfResultItemDto item)
        {
            Enqueue(item);
            return Task.CompletedTask;
        }

        /// <summary>
        /// [설계 12 §8] FlushAsync를 기다리지 않고 실행한다. 모든 예외를 안에서 처리하므로 UI 흐름에 영향이 없다.
        /// 종결되지 않은 항목은 파일에 그대로 남아 다음 Flush에서 재전송된다.
        /// </summary>
        public void FlushInBackground()
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await FlushAsync();
                }
                catch (WpfClientVersionException exception)
                {
                    Debug.WriteLine($"결과 전송 중단(426, 보관 유지): {exception.Message}");
                    ClientVersionRejected?.Invoke(this, exception);
                }
                catch (Exception exception)
                {
                    Debug.WriteLine($"백그라운드 결과 전송 실패(보관 유지): {exception.Message}");
                }
            });
        }

        /// <summary>
        /// 보관된 항목을 최대 50개씩 전송하고 종결된 항목만 제거한다. 네트워크·서버 오류는 조용히 넘기고 다음 기회에 다시 시도한다.
        /// 426(<see cref="WpfClientVersionException"/>)만 호출자에게 전파한다(항목은 보관 유지).
        /// </summary>
        public async Task FlushAsync()
        {
            await _flushGate.WaitAsync();
            try
            {
                if (_transmissionStopped) return;
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

                // [설계 34 — 검토 보완] 400(요청 형식 오류)이면 batch를 반으로 나눠 다시 보내 원인 항목을 좁힌다.
                // 혼자 보내도 400인 항목은 이번 실행에서만 제외(파일에는 보관)해 뒤의 정상 결과 전송을 막지 않는다.
                var work = new Stack<WpfResultItemDto[]>(sendable.Chunk(MaxBatchSize).Reverse());
                while (work.Count > 0)
                {
                    WpfResultItemDto[] batch = work.Pop();
                    if (_transmissionStopped) return;
                    WpfResultResponseDto response;
                    try
                    {
                        response = await _apiService.PostResultsAsync(new WpfResultRequestDto
                        {
                            Results = batch.ToList()
                        });
                    }
                    catch (WpfClientVersionException)
                    {
                        StopTransmission();
                        // [설계 13 §11] 버전 차단 — 항목을 지우지 않고 전송을 멈춘다. 업데이트 후 재전송.
                        throw;
                    }
                    catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.BadRequest)
                    {
                        if (batch.Length > 1)
                        {
                            int half = batch.Length / 2;
                            work.Push(batch[half..]);
                            work.Push(batch[..half]);
                            Debug.WriteLine($"결과 전송 400 — {batch.Length}건을 나눠 다시 전송합니다: {exception.Message}");
                        }
                        else
                        {
                            _quarantined.Add(batch[0].ResultId);
                            Debug.WriteLine($"결과 항목 단독 전송도 400 — 이번 실행에서 제외(파일 보관) popupId={batch[0].PopupId} " +
                                $"type={batch[0].ResultType}: {exception.Message}");
                        }
                        continue;
                    }
                    catch (Exception exception)
                    {
                        // 5xx·그 밖의 4xx·타임아웃·연결 끊김: 전송한 항목을 모두 보관하고 다음 기회에 재전송한다.
                        Debug.WriteLine($"결과 전송 실패, 보관 유지 ({batch.Length}건): {exception.Message}");
                        return;
                    }

                    HashSet<string> settled = Settle(batch, response);
                    if (settled.Count == 0) continue;
                    lock (_fileLock)
                    {
                        _unsaved.RemoveAll(p => settled.Contains(p.ResultId));
                        if (!fileAvailable) continue;
                        // 전송 중 새로 저장된 항목을 지우지 않도록 최신 파일을 다시 읽어 종결 항목만 뺀다.
                        try
                        {
                            List<WpfResultItemDto> current = LoadPendingUnlocked();
                            current.RemoveAll(p => settled.Contains(p.ResultId));
                            TrySavePendingUnlocked(current);
                        }
                        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
                        {
                            // 지우지 못한 종결 항목은 다음 전송에서 DUPLICATE로 다시 종결된다.
                            Debug.WriteLine($"종결 항목 제거 실패(다음 전송에서 DUPLICATE 처리): {exception.Message}");
                        }
                    }
                }
            }
            finally
            {
                _flushGate.Release();
            }
        }

        /// <summary>
        /// [설계 34-20·21] 이번 batch에 속한 resultId의 종결 상태(ACCEPTED/DUPLICATE/REJECTED)만 제거 대상으로 돌려준다.
        /// INTERNAL_ERROR는 재시도 횟수를 세고, 그 밖의 상태·누락 항목은 보관한다.
        /// </summary>
        private HashSet<string> Settle(WpfResultItemDto[] batch, WpfResultResponseDto response)
        {
            HashSet<string> sent = batch.Select(p => p.ResultId).ToHashSet(StringComparer.OrdinalIgnoreCase);
            HashSet<string> settled = new(StringComparer.OrdinalIgnoreCase);
            foreach (WpfResultItemResponseDto? itemResponse in response?.Results ?? new List<WpfResultItemResponseDto>())
            {
                if (itemResponse == null || string.IsNullOrEmpty(itemResponse.ResultId) || !sent.Contains(itemResponse.ResultId))
                {
                    Debug.WriteLine($"결과 응답 무시(이번 전송 항목 아님) resultId={itemResponse?.ResultId}");
                    continue;
                }
                if (SettledStatuses.Contains(itemResponse.Status ?? string.Empty))
                {
                    LogRejected(itemResponse);
                    settled.Add(itemResponse.ResultId);
                    _internalErrorAttempts.Remove(itemResponse.ResultId);
                }
                else if (string.Equals(itemResponse.Status, "INTERNAL_ERROR", StringComparison.OrdinalIgnoreCase))
                {
                    int attempts = _internalErrorAttempts.TryGetValue(itemResponse.ResultId, out int count) ? count + 1 : 1;
                    _internalErrorAttempts[itemResponse.ResultId] = attempts;
                    Debug.WriteLine($"결과 항목 내부 오류(보관, 이번 실행 {attempts}/{MaxInternalErrorAttemptsPerSession}회) " +
                        $"popupId={itemResponse.PopupId} code={itemResponse.Code}");
                }
                else
                {
                    Debug.WriteLine($"결과 항목 미종결(보관) status={itemResponse.Status} popupId={itemResponse.PopupId} code={itemResponse.Code}");
                }
            }
            return settled;
        }

        private static void LogRejected(WpfResultItemResponseDto itemResponse)
        {
            if (itemResponse.IsRejected)
            {
                Debug.WriteLine(
                    $"결과 항목 거절 popupId={itemResponse.PopupId} type={itemResponse.ResultType} " +
                    $"code={itemResponse.Code} message={itemResponse.Message}");
            }
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
                //   Enqueue는 저장 실패를 호출자에게 알리고(항목은 메모리 보관), Flush는 파일을 건드리지 않고 메모리분만 전송한다.
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
