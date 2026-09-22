using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
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
     *   - EnqueueAsync : 파일에 저장만 하고 즉시 반환. 이 메서드가 끝나면 결과는 로컬에 안전하게 보존된 것이므로
     *                    호출자(PopupManager)는 서버 응답을 기다리지 않고 바로 창을 닫아도 된다.
     *   - FlushAsync   : 보관된 항목 전부를 최대 50개씩 전송. 성공 항목 제거, 실패 항목 유지.
     *                    WPF 시작 직후·목록 조회 직전·종료 직전·EnqueueAsync 직후(백그라운드)에 호출한다.
     *   - FlushInBackground : FlushAsync를 기다리지 않고 실행하며 예외를 안에서 삼킨다(UI에 영향 없음).
     *   예전 EnqueueAndSendAsync(저장 후 전송 완료까지 대기)·SendImmediateAsync(제출 응답 대기)는 제거했다.
     *   설문·퀴즈 제출도 이제 로컬 판정 후 같은 경로로 간다.
     *
     * [설계 13 §11 — 426] 서버가 클라이언트 버전 미지원(426)으로 거절하면 전송을 중단하고 항목을 그대로 보관한다.
     *   업데이트된 버전에서 다시 Flush 되며, 예외는 호출자에게 전파해 업데이트 안내에 쓰게 한다.
     *
     * [응답 처리] REJECTED는 재전송해도 같은 결과이므로 로그만 남기고 제거한다.
     *   항목의 resultId는 생성 시 확정되어 재전송 시 서버가 DUPLICATE로 걸러낸다.
     *
     * [파일] %LOCALAPPDATA%\Popup\pending-results.json — 사용자 프로필 단위. 토큰·사번은 저장하지 않는다.
     * [동시성] 파일 접근과 전송은 SemaphoreSlim으로 직렬화한다.
     */
    public sealed class PopupResultQueue
    {
        private static readonly JsonSerializerOptions FileJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        private const int MaxBatchSize = 50;

        private readonly IPopupGateway _apiService;
        private readonly string _queueFilePath;
        private readonly SemaphoreSlim _gate = new(1, 1);

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

        /// <summary>보관 중인 항목 수. 화면 표시·진단용.</summary>
        public int PendingCount
        {
            get
            {
                _gate.Wait();
                try { return LoadPending().Count; }
                finally { _gate.Release(); }
            }
        }

        /// <summary>
        /// [설계 12 §8.1] 항목을 pending-results.json에 저장하고 즉시 반환한다. 서버 전송은 하지 않는다.
        /// 반환 이후에는 프로세스가 종료돼도 다음 실행의 FlushAsync에서 같은 resultId로 전송된다.
        /// </summary>
        public async Task EnqueueAsync(WpfResultItemDto item)
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
            await _gate.WaitAsync();
            try
            {
                List<WpfResultItemDto> pending = LoadPending();
                pending.RemoveAll(p => p.ResultId == item.ResultId);
                pending.Add(item);
                SavePending(pending);
            }
            finally
            {
                _gate.Release();
            }
        }

        /// <summary>
        /// [설계 12 §8] FlushAsync를 기다리지 않고 실행한다. 모든 예외를 안에서 처리하므로 UI 흐름에 영향이 없다.
        /// 실패한 항목은 파일에 그대로 남아 다음 Flush에서 재전송된다.
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
        /// 보관된 모든 항목을 전송한다. 네트워크·서버 오류는 조용히 넘기고 다음 기회에 다시 시도한다.
        /// 426(<see cref="WpfClientVersionException"/>)만 호출자에게 전파한다(항목은 보관 유지).
        /// </summary>
        public async Task FlushAsync()
        {
            await _gate.WaitAsync();
            try
            {
                List<WpfResultItemDto> pending = LoadPending();
                if (pending.Count == 0)
                {
                    return;
                }

                foreach (WpfResultItemDto[] batch in pending.Chunk(MaxBatchSize))
                {
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
                        // [설계 13 §11] 버전 차단 — 항목을 지우지 않고 전송을 멈춘다. 업데이트 후 재전송.
                        throw;
                    }
                    catch (Exception exception)
                    {
                        Debug.WriteLine($"결과 전송 실패, 보관 유지 ({pending.Count}건): {exception.Message}");
                        return;
                    }

                    HashSet<string> settled = response.Results
                        .Select(r => r.ResultId)
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);
                    foreach (WpfResultItemResponseDto itemResponse in response.Results)
                    {
                        LogRejected(itemResponse);
                    }
                    pending.RemoveAll(p => settled.Contains(p.ResultId));
                    SavePending(pending);
                }
            }
            finally
            {
                _gate.Release();
            }
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

        private List<WpfResultItemDto> LoadPending()
        {
            try
            {
                if (!File.Exists(_queueFilePath))
                {
                    return new List<WpfResultItemDto>();
                }
                string json = File.ReadAllText(_queueFilePath);
                return JsonSerializer.Deserialize<List<WpfResultItemDto>>(json, FileJsonOptions)
                    ?? new List<WpfResultItemDto>();
            }
            catch (Exception exception)
            {
                // 손상된 큐 파일은 버린다. 서버에 이미 반영된 항목은 DUPLICATE로 걸러지므로 데이터 위험은 없다.
                Debug.WriteLine($"결과 큐 파일을 읽을 수 없어 초기화합니다: {exception.Message}");
                return new List<WpfResultItemDto>();
            }
        }

        private void SavePending(List<WpfResultItemDto> pending)
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
                return;
            }
            File.WriteAllText(_queueFilePath, JsonSerializer.Serialize(pending, FileJsonOptions));
        }
    }
}
