using Popup.Dtos;
using Popup.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Popup.Services
{
    /*
     * [역할] 팝업 창 하나의 생명주기 동안 일어난 사실(표시 시각, 닫힘 시각, 다시 보지 않기, 제출 답안, 영상 시청량)을
     *        모아 결과 API 항목(WpfResultItemDto) 하나로 만든다.
     *
     * [추가 이유 — 기준 3·4]
     *   기존에는 표시(DISPLAYED)·닫기(CLOSED)·숨김·제출·영상 진행률을 각각 별도 API로 즉시 호출했다.
     *   이제 창이 닫힐 때 항목 1개만 보내므로, 창이 열려 있는 동안의 사실을 여기 기록해 두었다가 닫힘 시점에 조립한다.
     *   resultId는 빌더가 만들어질 때(=창이 열릴 때) 확정되어, 전송 실패 후 재전송해도 서버가 같은 항목으로 인식한다.
     *
     * [유형 결정 규칙]
     *   - 제출 항목을 이미 만들어 큐에 넣었으면(IsFinalized) 닫힘 시 다시 만들지 않는다.
     *   - "다시 보지 않기" 체크 → HIDDEN (hideDays: 팝업 설정값, 없으면 30)
     *   - 영상 팝업이고 스냅샷이 있으면 → VIDEO_WATCHED
     *   - 그 외 → CLOSED
     */
    public sealed class PopupResultBuilder
    {
        private const int DefaultHideDays = 30;

        private readonly string _popupId;
        private readonly int? _configuredHideDays;
        private DateTimeOffset? _displayedAt;
        private VideoProgressSnapshot? _videoProgress;

        public PopupResultBuilder(string popupId, int? configuredHideDays)
        {
            if (string.IsNullOrWhiteSpace(popupId))
            {
                throw new ArgumentException("팝업 ID가 필요합니다.", nameof(popupId));
            }
            _popupId = popupId.Trim();
            _configuredHideDays = configuredHideDays;
        }

        /// <summary>창이 열릴 때 확정되는 멱등 키. 제출·닫힘 항목이 같은 키를 쓴다(창 하나 = 항목 하나).</summary>
        public string ResultId { get; } = Guid.NewGuid().ToString();

        /// <summary>제출 항목을 이미 큐에 넣었으면 true. 닫힘 시 중복 항목을 만들지 않는다.</summary>
        public bool IsFinalized { get; private set; }

        /// <summary>팝업 내용이 처음 화면에 그려진 시각을 기록한다(최초 1회만).</summary>
        public void MarkDisplayed(DateTimeOffset displayedAt)
        {
            _displayedAt ??= displayedAt;
        }

        /// <summary>영상 창이 닫히기 직전 VideoPopupView.GetFinalProgress() 결과를 넘긴다. null이면 CLOSED로 처리된다.</summary>
        public void SetVideoProgress(VideoProgressSnapshot? progress)
        {
            _videoProgress = progress;
        }

        public void MarkFinalized()
        {
            IsFinalized = true;
        }

        /// <summary>
        /// 설문·퀴즈 제출 항목. [설계 12] 로컬 큐에 저장된 뒤 창이 닫히고 백그라운드로 전송된다. 이후 닫힘 항목은 만들지 않는다.
        /// QUIZ는 WPF가 채점한 score/passed를 함께 담는다(SURVEY는 null).
        /// </summary>
        public WpfResultItemDto BuildSubmitted(SurveySubmission submission, DateTimeOffset submittedAt)
        {
            ArgumentNullException.ThrowIfNull(submission);
            List<PopupSubmitAnswerRequestDto> requestAnswers = submission.Answers
                .Select(answer => new PopupSubmitAnswerRequestDto
                {
                    QuestionId = answer.QuestionId,
                    TextAnswer = string.IsNullOrWhiteSpace(answer.TextAnswer) ? null : answer.TextAnswer,
                    OptionIds = new List<long>(answer.SelectedOptionIds)
                })
                .ToList();

            return new WpfResultItemDto
            {
                ResultId = ResultId,
                PopupId = _popupId,
                ResultType = WpfResultType.Submitted,
                DisplayedAt = _displayedAt,
                ClosedAt = submittedAt,
                ResponseStartedAt = _displayedAt,
                Answers = requestAnswers,
                Score = submission.Score,
                Passed = submission.Passed
            };
        }

        /// <summary>닫힘 항목. doNotShowAgain이면 HIDDEN, 영상 스냅샷이 있으면 VIDEO_WATCHED, 아니면 CLOSED.</summary>
        public WpfResultItemDto BuildClosed(DateTimeOffset closedAt, bool doNotShowAgain)
        {
            WpfResultItemDto item = new()
            {
                ResultId = ResultId,
                PopupId = _popupId,
                DisplayedAt = _displayedAt,
                ClosedAt = closedAt
            };

            if (doNotShowAgain)
            {
                item.ResultType = WpfResultType.Hidden;
                item.HideDays = _configuredHideDays is > 0 ? _configuredHideDays : DefaultHideDays;
                return item;
            }

            if (_videoProgress != null && _videoProgress.DurationSeconds > 0)
            {
                item.ResultType = WpfResultType.VideoWatched;
                item.Video = new WpfVideoProgressDto
                {
                    DurationSeconds = _videoProgress.DurationSeconds,
                    PositionSeconds = _videoProgress.PositionSeconds,
                    MaximumPositionSeconds = _videoProgress.MaximumPositionSeconds,
                    WatchedSeconds = _videoProgress.WatchedSeconds
                };
                return item;
            }

            item.ResultType = WpfResultType.Closed;
            return item;
        }
    }
}
