package server.repo.core.mapper.popup;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import server.domain.popup.wpf.WpfUserPopupStatus;

import java.time.OffsetDateTime;

/**
 * 신규 WPF API(/p/api/wpf/**) 전용 SQL. mappers/popup/WpfPopupMapper.xml(Oracle).
 *
 * <p>[추가 이유 — 기준 3·4] 결과 API는 팝업 종료 시점에 표시·닫기 정보를 한 번에 받고,
 * 항목 멱등 처리(WPF_RESULT_RECEIPT)와 요청 로그(API_REQUEST_LOG)가 필요하다. 기존 PopupMapper에는
 * 이벤트를 1건씩 기록하는 upsertPopupEvent만 있어 별도 구문을 둔다. 숨김·응답·영상·완료 처리는
 * 기존 PopupMapper/PopupService 구문을 재사용하므로 여기 두지 않는다.</p>
 */
@Mapper
public interface WpfPopupMapper {

    /**
     * 표시·닫기 정보를 한 번에 반영한다(원본 upsertPopupEvent의 DISPLAYED+CLOSED 합본).
     * displayedAt이 있으면 FIRST(최초만)/LAST 갱신·DISPLAY_COUNT+1, closedAt이 없으면 서버 시각.
     * 이미 완료(COMPLETED_YN='Y')면 상태를 COMPLETED로 유지한다.
     */
    int mergeDisplayAndClose(
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("displayedAt") OffsetDateTime displayedAt,
            @Param("closedAt") OffsetDateTime closedAt);

    /** 사번이 APP_USER에 활성(ACTIVE_YN=Y) 상태로 존재하면 1. 목록·결과 API 진입 시 403 판정에 쓴다. */
    int countActiveUser(@Param("userId") String userId);

    /** 결과 응답용 상태 1행. 없으면 null. */
    WpfUserPopupStatus selectStatus(
            @Param("userId") String userId,
            @Param("popupId") String popupId);

    /** 같은 resultId를 이미 처리했는지 (1이면 DUPLICATE). */
    int countReceipt(@Param("resultId") String resultId);

    /** 항목 처리 영수증. 성공 항목만 기록하며 트랜잭션 롤백 시 함께 사라진다. */
    int insertReceipt(
            @Param("resultId") String resultId,
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("resultType") String resultType,
            @Param("resultStatus") String resultStatus,
            @Param("resultCode") String resultCode);

    /** WPF 결과 API 요청 단위 로그 (원본에서 미사용이던 API_REQUEST_LOG 활용). */
    int insertApiRequestLog(
            @Param("clientRequestId") String clientRequestId,
            @Param("userId") String userId,
            @Param("apiPath") String apiPath,
            @Param("httpMethod") String httpMethod,
            @Param("clientIp") String clientIp,
            @Param("requestReceivedAt") OffsetDateTime requestReceivedAt,
            @Param("elapsedMilliseconds") long elapsedMilliseconds,
            @Param("httpStatusCode") int httpStatusCode,
            @Param("successYn") String successYn,
            @Param("requestSummary") String requestSummary,
            @Param("responseSummary") String responseSummary);
}
