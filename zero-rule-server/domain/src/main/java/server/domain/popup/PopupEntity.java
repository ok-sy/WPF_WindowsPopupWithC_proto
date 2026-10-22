package server.domain.popup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * POL-13-01 : 콘텐츠와 관리 상태
 * ■ 팝업 내부 조회 모델
 * - in : POPUP_NOTICE·POPUP_CONTENT 조회 컬럼
 * - out: 팝업 1건(record). 콘텐츠는 정규 컬럼 4개 + 확장 옵션 JSON 문자열
 * - POPUP.POPUP_NOTICE와 POPUP.POPUP_CONTENT를 조합한 내부 조회 모델이다.
 *
 * <p>Oracle 전환: PostgreSQL 매퍼는 {@code JSONB_BUILD_OBJECT(...) || content_options}로
 * 콘텐츠 JSON 문자열({@code contentJson})을 SQL에서 조립해 내려주었다. Oracle에서는 JSON 함수가
 * 버전(12.2/18c/19c)에 따라 지원 범위가 달라 SQL 조립을 버리고, 콘텐츠 정규 컬럼 4개와
 * 확장 옵션 JSON(CLOB)을 그대로 읽어 Java {@link server.service.core.popup.PopupContentAssembler}가
 * 조립한다. 그래서 {@code contentJson} 대신 아래 5개 필드를 둔다.</p>
 *
 * <ul>
 *   <li>contentTitle / description / contentBody / mediaUrl : POPUP_CONTENT 정규 컬럼</li>
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
        String showLaterYn,
        String contentTitle,
        String description,
        String contentBody,
        String mediaUrl,
        String contentOptionsJson,
        int displayOrder,
        Long questionTemplateId,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        Integer hideDays,
        BigDecimal completionRatio,
        BigDecimal passingScore
) {
}
