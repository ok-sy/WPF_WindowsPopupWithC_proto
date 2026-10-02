using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace Popup.Services
{
    // 설계 19 §7: 타이머는 MainWindow 하나만 사용하고, 이 클래스는 다음 대기 시간만 계산한다.
    public sealed class PopupPollingRecovery
    {
        private const int AttemptsPerCycle = 3;
        private const int MaxCycles = 5;
        private int _scheduledAttempts;

        public bool IsRecovering { get; private set; }

        public static bool IsTransient(Exception exception) => exception switch
        {
            // HTTP 응답이 없는 DNS/연결 오류와 지정된 일시적인 서버 오류만 복구한다.
            HttpRequestException http => http.StatusCode is null
                or HttpStatusCode.InternalServerError or HttpStatusCode.BadGateway
                or HttpStatusCode.ServiceUnavailable or HttpStatusCode.GatewayTimeout,
            TaskCanceledException => true, // 앱 종료에 의한 취소는 호출자가 먼저 제외한다.
            TimeoutException => true,
            _ => false
        };

        public TimeSpan NextDelay()
        {
            IsRecovering = true;
            if (_scheduledAttempts >= AttemptsPerCycle * MaxCycles)
                return TimeSpan.FromHours(1);

            // 정상 조회 실패는 횟수에 포함하지 않는다. 복구 요청 15회만 예약한다.
            bool nextCycle = _scheduledAttempts > 0 && _scheduledAttempts % AttemptsPerCycle == 0;
            _scheduledAttempts++;
            // 30분 휴식이 끝난 뒤 다음 Cycle의 첫 10초를 기다린다.
            return TimeSpan.FromSeconds(nextCycle ? 1800 + 10 : 10);
        }

        public void Reset()
        {
            IsRecovering = false;
            _scheduledAttempts = 0;
        }

        public static TimeSpan NormalDelay(int intervalSeconds, TimeSpan elapsed)
        {
            long ticks = TimeSpan.FromSeconds(Math.Clamp(intervalSeconds, 1800, 3600)).Ticks;
            return TimeSpan.FromTicks(ticks - elapsed.Ticks % ticks);
        }
    }
}
