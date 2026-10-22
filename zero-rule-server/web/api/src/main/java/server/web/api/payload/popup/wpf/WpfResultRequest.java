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
 * POL-09-01 : 3 API 순서
 * POL-10-01 : 전달과 제출 식별
 * POL-10-03 : 완료·숨김·연기
 * ■ WPF 결과 저장 요청 본문 — 결과 1건 (POST /p/api/wpf/popups/results)
 * - in : resultId · deliveryId · popupId · resultType · displayedAt · closedAt · hideDays · answers · video · score · passed
 * - out: toCommand() → WpfResultCommand · validationError() → 형식 오류 설명(정상이면 null)
 * - 숨김·제출·영상 진행률·이벤트를 결과 하나로 받는다. 사용자 ID 필드는 없다(인증 정보에서 얻음).
 * - 결과 객체 1건만 받는다(일괄 envelope 없음). resultType은 CLOSED·HIDDEN·LATER·SUBMITTED·VIDEO_WATCHED,
 *   hideDays는 1~3650이며 조회 응답의 {@code deliveryId}를 함께 보낸다.
 * - 형식 검사는 {@link #validationError()}로 하며 실패하면 400이 아니라 REJECTED(WPF_INVALID_RESULT)로 돌려준다
 *   (WPF가 같은 요청을 반복 재전송하지 않도록 항목 단위로 판정). 유형별 필수 블록(hideDays/answers/video)은 서비스가 검사한다.
 *
 * @param resultId   결과 멱등 키(UUID). 재전송 시 유지
 * @param deliveryId 조회 응답 popup.deliveryId
 * @param popupId    대상 팝업. 전달 건의 팝업과 같아야 한다
 */
// POL-15-02 : 인증·버전 — 알 수 없는 필드(예: 구 클라이언트가 보내는 userId)는 무시한다. 사용자 식별은 인증 정보만 사용한다.
@JsonIgnoreProperties(ignoreUnknown = true)
public record WpfResultRequest(
        @NotBlank @Size(max = 64) String resultId,
        @NotBlank @Size(max = 64) String deliveryId,
        @NotBlank @Size(max = 50) String popupId,
        @NotBlank String resultType,
        OffsetDateTime displayedAt,
        OffsetDateTime closedAt,
        @Min(1) @Max(3650) Integer hideDays,
        List<@NotNull @Valid Answer> answers,
        @Valid Video video,
        @DecimalMin("0.0") Double score,
        Boolean passed
) {
    private static final jakarta.validation.Validator VALIDATOR =
            jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();

    /** 형식 오류 설명. 정상이면 null. */
    public String validationError() {
        var violations = VALIDATOR.validate(this);
        if (!violations.isEmpty()) {
            return violations.stream()
                    .map(v -> v.getPropertyPath() + " " + v.getMessage())
                    .sorted()
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        if (type() == null) {
            return "resultType은 CLOSED, HIDDEN, LATER, SUBMITTED, VIDEO_WATCHED 중 하나여야 합니다: " + resultType;
        }
        if (score != null && !Double.isFinite(score)) {
            return "score는 유한한 숫자여야 합니다.";
        }
        return null;
    }

    /** resultType 문자열을 대소문자·앞뒤 공백 무시로 해석한다. 모르는 값이면 null. */
    public WpfResultType type() {
        if (resultType == null) return null;
        try {
            return WpfResultType.valueOf(resultType.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** 형식 검사를 통과한 요청을 서비스 커맨드로 바꾼다. 문자열 식별자는 trim, answers 누락은 빈 목록. */
    public WpfResultCommand toCommand() {
        return new WpfResultCommand(
                resultId.trim(), deliveryId.trim(), popupId.trim(), type(), displayedAt, closedAt, hideDays,
                answers == null ? List.of() : answers.stream().map(Answer::toAnswer).toList(),
                video == null ? null : video.toProgress(),
                score, passed);
    }
    /** POL-06-02 : 선택·제출 — 문항 답변 1건(주관식 textAnswer 또는 선택지 optionIds). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Answer(
            @NotNull Long questionId,
            String textAnswer,
            List<@NotNull Long> optionIds
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
