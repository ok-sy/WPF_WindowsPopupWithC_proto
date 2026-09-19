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
     * [동작]
     *   - EnqueueAndSendAsync : 파일에 저장 → 즉시 1회 전송 시도. 실패하면 보관.
     *   - FlushAsync          : 보관된 항목 전부를 최대 50개씩 나눠 전송. WPF 시작 직후·목록 조회 직전·종료 직전에 호출.
     *   - 응답 REJECTED는 재전송해도 같은 결과이므로 로그만 남기고 제거한다. 단 호출자가 사용자에게 알려야 하는 경우
     *     (제출 직후)는 SendImmediateAsync가 항목 응답을 그대로 돌려준다.
     *   - 항목의 resultId는 생성 시 확정되어 재전송 시 서버가 DUPLICATE로 걸러낸다.
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

        private readonly PopupApiService _apiService;
        private readonly string _queueFilePath;
        private readonly SemaphoreSlim _gate = new(1, 1);

        public PopupResultQueue(PopupApiService apiService, string? queueFilePath = null)
        {
            _apiService = apiService ?? throw new ArgumentNullException(nameof(apiService));
            _queueFilePath = queueFilePath ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Popup", "pending-results.json");
        }

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
        /// 항목을 큐에 넣고 바로 전송을 시도한다. 전송 실패(네트워크·5xx)여도 예외를 던지지 않고 보관한다.
        /// 닫기·숨김·영상 결과처럼 사용자가 결과를 기다리지 않는 항목에 쓴다.
        /// </summary>
        public async Task EnqueueAndSendAsync(WpfResultItemDto item)
        {
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

            await FlushAsync();
        }

        /// <summary>
        /// 항목을 즉시 전송하고 서버의 항목 응답을 돌려준다. 제출처럼 사용자가 결과(통과 여부·거절 사유)를
        /// 바로 알아야 할 때 쓴다. 전송 자체가 실패하면 큐에 보관한 뒤 예외를 던진다(호출자가 안내).
        /// </summary>
        public async Task<WpfResultItemResponseDto> SendImmediateAsync(WpfResultItemDto item)
        {
            ArgumentNullException.ThrowIfNull(item);
            await _gate.WaitAsync();
            try
            {
                WpfResultResponseDto response;
                try
                {
                    response = await _apiService.PostResultsAsync(new WpfResultRequestDto
                    {
                        Results = new List<WpfResultItemDto> { item }
                    });
                }
                catch
                {
                    List<WpfResultItemDto> pending = LoadPending();
                    pending.RemoveAll(p => p.ResultId == item.ResultId);
                    pending.Add(item);
                    SavePending(pending);
                    throw;
                }

                WpfResultItemResponseDto itemResponse = response.Results
                    .FirstOrDefault(r => r.ResultId == item.ResultId)
                    ?? throw new InvalidOperationException("서버 응답에 해당 결과 항목이 없습니다.");
                LogRejected(itemResponse);
                return itemResponse;
            }
            finally
            {
                _gate.Release();
            }
        }

        /// <summary>보관된 모든 항목을 전송한다. 실패는 조용히 넘기고 다음 기회에 다시 시도한다.</summary>
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
