package server.domain.popup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * POPUP.POPUP_NOTICE와 POPUP.POPUP_CONTENT를 조합한 내부 조회 모델이다.
 *
 * <p>[Oracle 전환 — 기준 5] PostgreSQL 매퍼는 {@code JSONB_BUILD_OBJECT(...) || content_options}로
 * 콘텐츠 JSON 문자열({@code contentJson})을 SQL에서 조립해 내려주었다. Oracle에서는 JSON 함수가
 * 버전(12.2/18c/19c)에 따라 지원 범위가 달라 SQL 조립을 버리고, 콘텐츠 정규 컬럼 5개와
 * 확장 옵션 JSON(CLOB)을 그대로 읽어 Java {@link server.service.core.popup.PopupContentAssembler}가
 * 조립한다. 그래서 {@code contentJson} 대신 아래 6개 필드를 둔다.</p>
 *
 * <ul>
 *   <li>contentTitle / description / contentBody / mediaUrl / linkUrl : POPUP_CONTENT 정규 컬럼</li>
 *   <li>contentOptionsJson : POPUP_CONTENT.CONTENT_OPTIONS (JSON 문자열, 없으면 null)</li>
 * </ul>
 */
public record PopupEntity(
        String popupId,
        String popupType,
        String title,
        OffsetDateTime displayStartAt,
        OffsetDateTime displayEndAt,
        String displayMode,
        String sizeMode,
        BigDecimal popupWidth,
        BigDecimal popupHeight,
        BigDecimal widthRatio,
        BigDecimal heightRatio,
        BigDecimal minimumWidth,
        BigDecimal minimumHeight,
        BigDecimal maximumWidth,
        BigDecimal maximumHeight,
        String showHeaderYn,
        String showCloseButtonYn,
        String showFooterYn,
        String showDontShowYn,
        String contentTitle,
        String description,
        String contentBody,
        String mediaUrl,
        String linkUrl,
        String contentOptionsJson,
        int displayOrder,
        String useYn,
        Long questionTemplateId,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        Integer hideDays,
        BigDecimal completionRatio,
        BigDecimal passingScore,
        String allowCloseBeforeCompleteYn
) {
}
