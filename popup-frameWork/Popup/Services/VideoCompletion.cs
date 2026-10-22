using System;

namespace Popup.Services
{
    /*
     * POL-05-02 : 완료·화면 이탈
     * ■ 영상 시청 완료 판정
     * - in : watchedSeconds·durationSeconds(decimal) 누적 시청·영상 길이 · completionRatio(double) 완료 기준
     * - out: WatchedRatio 시청 비율 · RequiredRatio 보정된 기준 · IsReached 완료 여부(bool)
     * - 영상 시청 완료 판정식 하나로 통일한다. 서버 PopupService.saveVideoProgress와 같은 식이다.
     *   시청 비율 = min(watched, duration) / duration 을 소수 4자리에서 내림, 1 상한
     *   완료 = 시청 비율 ≥ completionRatio(0~1 보정, 비정상 값은 1.0)
     * double 나눗셈으로 비교하면 decimal 비율이 기준 바로 아래(예: 0.79999999999999999999)여도
     * double 변환에서 0.8로 올라가 WPF는 닫기를 허용하고 서버는 미완료로 저장할 수 있으므로 decimal로 비교한다.
     * 서버의 COMPLETION_RATIO는 NUMBER(5,4)라 4자리 내림 비교와 정확한 비교가 같은 결과지만, Demo·수동 입력의 5자리 이상 기준도 같은 식을 따른다.
     */
    public static class VideoCompletion
    {
        /// <summary>시청 비율(0~1, 소수 4자리 내림). 길이가 0 이하면 0.</summary>
        public static decimal WatchedRatio(decimal watchedSeconds, decimal durationSeconds)
        {
            if (durationSeconds <= 0) return 0m;
            decimal watched = Math.Clamp(watchedSeconds, 0m, durationSeconds);
            return Math.Min(1m, decimal.Floor(watched / durationSeconds * 10000m) / 10000m);
        }

        /// <summary>completionRatio를 판정 기준으로 보정한다. NaN·무한대는 1.0, 범위 밖은 0~1로 자른다.</summary>
        public static decimal RequiredRatio(double completionRatio)
            => double.IsFinite(completionRatio) ? (decimal)Math.Clamp(completionRatio, 0.0, 1.0) : 1m;

        public static bool IsReached(decimal watchedSeconds, decimal durationSeconds, double completionRatio)
            => durationSeconds > 0 && WatchedRatio(watchedSeconds, durationSeconds) >= RequiredRatio(completionRatio);
    }
}
