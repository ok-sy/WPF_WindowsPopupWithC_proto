package server.web.api.payload.popup.wpf;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultType;
import server.domain.popup.wpf.WpfVideoProgress;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * POST /p/api/wpf/popups/results 요청 본문.
 *
 * <p>[추가 이유 — 기준 3·4·6] 구 WPF 개별 API의 숨김·제출·영상 진행률·이벤트 4개 요청을 결과 항목 배열 하나로 합쳤다.
 * 구 요청 클래스(PopupHideRequest 등)는 설계 18 L-0에서 삭제했다. 사용자 ID 필드는 없다(인증 정보에서 얻음).
 * 요청 전체(envelope: clientRequestId·results 1~50개)만 @Valid로 검사해 400으로 거절한다.
 * [설계 34 — 검토 보완] 항목 형식(resultId·popupId·resultType·hideDays·score·answers·video)은 {@link Item#validationError()}로
 * 항목마다 검사하고 실패한 항목만 REJECTED(WPF_INVALID_RESULT)로 돌려준다. 한 항목의 형식 오류가 같은 요청의 정상 결과까지
 * 400으로 막아 WPF가 같은 요청을 반복 재전송하는 상황을 막기 위해서다. 유형별 필수 블록(hideDays/answers/video)은 서비스가 검사한다.</p>
 *
 * @param clientRequestId 요청 단위 식별(로그용)
 * @param sentAt          WPF 전송 시각(선택, 재전송 시 원래 값)
 * @param results         결과 항목 1~50개
 */
// 알 수 없는 필드(예: 구 클라이언트가 보내는 userId)는 무시한다. 사용자 식별은 인증 정보만 사용한다(기준 6).
@JsonIgnoreProperties(ignoreUnknown = true)
public record WpfResultRequest(
        @NotBlank @Size(max = 100) String clientRequestId,
        OffsetDateTime sentAt,
        @NotNull @Size(min = 1, max = 50) List<Item> results
) {
    private static final jakarta.validation.Validator VALIDATOR =
            jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();

    /** 항목을 서비스 계층 커맨드로 변환한다. 형식 오류 항목이 없을 때만 쓴다(테스트·단순 경로). */
    public List<WpfResultCommand> toCommands() {
        return results.stream().map(Item::toCommand).toList();
    }

    /**
     * 결과 항목 1건. resultType에 따라 hideDays / answers / video를 사용한다.
     * 동영상+퀴즈 SUBMITTED는 answers와 video를 함께 사용한다.
     * displayedAt·closedAt은 모든 유형이 함께 보낼 수 있다(기존 DISPLAYED/CLOSED 이벤트 대체).
     * [설계 32] responseStartedAt은 displayedAt과 같은 값이라 제거했다. 구 클라이언트가 보내도 ignoreUnknown으로 무시한다.
     * [설계 12 §4·§6 / 설계 33] score/passed: QUIZ SUBMITTED에서 WPF가 로컬 채점한 점수·통과 여부(QUIZ 필수, 없으면 REJECTED).
     * 서버는 이 값을 그대로 저장·완료 판정에 쓰고, 자기 계산값과 다르면 로그만 남긴다. SURVEY는 보내지 않는다.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            @NotBlank @Size(max = 64) String resultId,
            @NotBlank @Size(max = 50) String popupId,
            @NotBlank String resultType,
            OffsetDateTime displayedAt,
            OffsetDateTime closedAt,
            @Min(1) @Max(3650) Integer hideDays,
            List<@Valid Answer> answers,
            @Valid Video video,
            @DecimalMin("0.0") Double score,
            Boolean passed
    ) {
        /** 항목 형식 오류 메시지. 정상이면 null. Bean Validation 제약과 resultType ENUM을 함께 검사한다. */
        public String validationError() {
            var violations = VALIDATOR.validate(this);
            if (!violations.isEmpty()) {
                return violations.stream()
                        .map(v -> v.getPropertyPath() + " " + v.getMessage())
                        .sorted()
                        .collect(java.util.stream.Collectors.joining(", "));
            }
            if (type() == null) {
                return "resultType은 CLOSED, HIDDEN, SUBMITTED, VIDEO_WATCHED 중 하나여야 합니다: " + resultType;
            }
            if (score != null && !Double.isFinite(score)) {
                return "score는 유한한 숫자여야 합니다.";
            }
            return null;
        }

        /** resultType 문자열을 ENUM으로 바꾼다. 알 수 없는 값이면 null. */
        public WpfResultType type() {
            if (resultType == null) return null;
            try {
                return WpfResultType.valueOf(resultType.trim().toUpperCase(java.util.Locale.ROOT));
            } catch (IllegalArgumentException e) {
                return null;
            }
        }

        public WpfResultCommand toCommand() {
            return new WpfResultCommand(
                    resultId.trim(), popupId.trim(), type(), displayedAt, closedAt, hideDays,
                    answers == null ? List.of() : answers.stream().map(Answer::toAnswer).toList(),
                    video == null ? null : video.toProgress(),
                    score, passed);
        }
    }

    /** 문항 답안. 선택형은 optionIds, 서술형은 textAnswer (기존 PopupSubmitAnswerRequest와 동일). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Answer(
            @NotNull Long questionId,
            String textAnswer,
            List<Long> optionIds
    ) {
        public PopupSubmitAnswer toAnswer() {
            return new PopupSubmitAnswer(questionId, textAnswer, optionIds);
        }
    }

    /** 영상 시청 누적값(초). 구 영상 진행률 요청과 동일 제약. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Video(
            @NotNull @DecimalMin("0.001") BigDecimal durationSeconds,
            @NotNull @DecimalMin("0.0") BigDecimal positionSeconds,
            @NotNull @DecimalMin("0.0") BigDecimal maximumPositionSeconds,
            @NotNull @DecimalMin("0.0") BigDecimal watchedSeconds
    ) {
        public WpfVideoProgress toProgress() {
            return new WpfVideoProgress(durationSeconds, positionSeconds, maximumPositionSeconds, watchedSeconds);
        }
    }
}
