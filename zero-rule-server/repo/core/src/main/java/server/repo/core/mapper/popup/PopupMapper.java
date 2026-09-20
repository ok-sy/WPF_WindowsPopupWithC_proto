package server.repo.core.mapper.popup;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import server.domain.popup.PopupEntity;
import server.domain.popup.AdminPopupListItemDto;
import server.domain.popup.AdminPopupSaveCommand;
import server.domain.popup.AdminPopupTargetCondition;
import server.domain.popup.AdminPopupTargetRow;
import server.domain.popup.PopupOptionEntity;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.VideoPopupContext;
import server.domain.popup.UserPopupStatusDto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * POPUP 스키마의 팝업 표시 데이터를 조회·저장한다. SQL은 mappers/popup/PopupMapper.xml(Oracle)에 있다.
 *
 * <p>[Oracle 전환 — 기준 5] PostgreSQL 매퍼는 {@code INSERT ... RETURNING id}를 {@code <select>}로 실행해
 * 생성된 대리키를 바로 반환했다. Oracle에는 그런 구문이 없으므로 시퀀스 {@code SEQ_<TABLE>.NEXTVAL}을
 * {@code <selectKey order="BEFORE">}로 먼저 뽑아 파라미터 Map에 채우는 방식을 쓴다. MyBatis는 여러 @Param
 * 인자로는 selectKey 결과를 호출자에게 돌려줄 수 없어, 키가 필요한 5개 구문은 Map 파라미터를 받는
 * 추상 메서드(XML과 바인딩)와 기존 시그니처를 유지하는 default 메서드(PopupService가 호출)로 나눈다.
 * 같은 이름의 오버로드지만 MyBatis는 default 메서드를 구문 바인딩 대상에서 제외하므로 충돌하지 않는다.</p>
 */
@Mapper
public interface PopupMapper {
    List<server.domain.popup.AdminQuestionTemplate> selectAdminQuestionTemplates();

    /** XML 바인딩용. selectKey가 {@code templateId}를 Map에 채운다. */
    void insertQuestionTemplate(Map<String, Object> params);

    /** PopupService 호출용. 시퀀스로 발급한 QUESTION_TEMPLATE_ID를 반환한다. */
    default Long insertQuestionTemplate(String name, String type, String auditUser) {
        Map<String, Object> params = new HashMap<>();
        params.put("name", name);
        params.put("type", type);
        params.put("auditUser", auditUser);
        insertQuestionTemplate(params);
        return (Long) params.get("templateId");
    }

    /** XML 바인딩용. selectKey가 {@code questionId}를 Map에 채운다. */
    void insertAdminQuestion(Map<String, Object> params);

    /** PopupService 호출용. 시퀀스로 발급한 QUESTION_ID를 반환한다. */
    default Long insertAdminQuestion(Long templateId,
            server.domain.popup.PopupQuestionDto question,
            boolean quiz, int sortOrder, String auditUser) {
        Map<String, Object> params = new HashMap<>();
        params.put("templateId", templateId);
        params.put("question", question);
        params.put("quiz", quiz);
        params.put("sortOrder", sortOrder);
        params.put("auditUser", auditUser);
        insertAdminQuestion(params);
        return (Long) params.get("questionId");
    }

    int insertAdminOption(@Param("questionId") Long questionId,
            @Param("option") server.domain.popup.PopupOptionDto option,
            @Param("quiz") boolean quiz, @Param("sortOrder") int sortOrder,
            @Param("auditUser") String auditUser);

    /** 대상자·기간 필터를 적용하지 않은 관리자용 전체 목록이다. */
    List<AdminPopupListItemDto> selectAdminPopups();

    /** 관리자 편집·미리보기에서 사용할 팝업 한 건의 전체 표시 정보다. */
    PopupEntity selectAdminPopupById(@Param("popupId") String popupId);

    /** 팝업의 공통 표시·기간·크기 설정을 등록하거나 수정한다 (MERGE). */
    int upsertAdminPopupNotice(AdminPopupSaveCommand command);

    /** 팝업 유형별 제목·본문·미디어·추가 옵션을 등록하거나 수정한다 (MERGE). */
    int upsertAdminPopupContent(AdminPopupSaveCommand command);

    List<AdminPopupTargetRow> selectAdminPopupTargets(@Param("popupId") String popupId);

    int deleteAdminPopupTargets(@Param("popupId") String popupId);

    int countAdminPopupTargetGroups(@Param("popupId") String popupId);

    /** XML 바인딩용. selectKey가 {@code targetGroupId}를 Map에 채운다. */
    void insertAdminTargetGroup(Map<String, Object> params);

    /** PopupService 호출용. 시퀀스로 발급한 TARGET_GROUP_ID를 반환한다. */
    default Long insertAdminTargetGroup(
            String popupId, String targetName, String targetDescription,
            int groupOrder, String auditUser) {
        Map<String, Object> params = new HashMap<>();
        params.put("popupId", popupId);
        params.put("targetName", targetName);
        params.put("targetDescription", targetDescription);
        params.put("groupOrder", groupOrder);
        params.put("auditUser", auditUser);
        insertAdminTargetGroup(params);
        return (Long) params.get("targetGroupId");
    }

    int insertAdminTargetCondition(
            @Param("targetGroupId") Long targetGroupId,
            @Param("condition") AdminPopupTargetCondition condition,
            @Param("conditionOrder") int conditionOrder,
            @Param("auditUser") String auditUser);

    /** 목록에서 팝업의 사용 여부만 빠르게 변경한다. */
    int updateAdminPopupActive(
            @Param("popupId") String popupId,
            @Param("activeYn") String activeYn,
            @Param("auditUser") String auditUser);

    /**
     * 사용자에게 노출 가능한 팝업. 활성·기간·대상 조건·숨김을 SQL에서 판정한다.
     *
     * @param excludeCompleted true면 USER_POPUP_STATUS.COMPLETED_YN='Y'인 팝업도 제외한다.
     *                         [기준 2] 신규 WPF API는 완료 판단까지 서버가 끝내므로 true,
     *                         기존 WPF-01 API는 클라이언트가 /statuses로 제외하던 계약을 유지하므로 false.
     */
    List<PopupEntity> selectAvailablePopups(@Param("userId") String userId,
            @Param("excludeCompleted") boolean excludeCompleted);

    /** 기존 호출부 호환(완료 제외 없음). */
    default List<PopupEntity> selectAvailablePopups(String userId) {
        return selectAvailablePopups(userId, false);
    }

    List<PopupQuestionEntity> selectQuestionsByTemplateIds(
            @Param("templateIds") List<Long> templateIds);

    List<PopupOptionEntity> selectOptionsByQuestionIds(
            @Param("questionIds") List<Long> questionIds);

    int upsertPopupHide(
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("hideDays") int hideDays);

    OffsetDateTime selectHiddenUntil(
            @Param("userId") String userId,
            @Param("popupId") String popupId);

    PopupSubmissionContext selectSubmissionContext(
            @Param("userId") String userId,
            @Param("popupId") String popupId);

    /**
     * XML 바인딩용. MERGE 후 {@code <selectKey order="AFTER">}가 사용자·팝업의 RESPONSE_ID를
     * {@code responseId}로 Map에 채운다 (신규 삽입·기존 갱신 모두 같은 키를 돌려준다).
     */
    void upsertPopupResponse(Map<String, Object> params);

    /** PopupService 호출용. 저장된 응답의 RESPONSE_ID를 반환한다. */
    default Long upsertPopupResponse(
            String clientRequestId, String userId, String popupId,
            Long questionTemplateId, OffsetDateTime responseStartedAt,
            BigDecimal totalScore, String passedYn) {
        Map<String, Object> params = new HashMap<>();
        params.put("clientRequestId", clientRequestId);
        params.put("userId", userId);
        params.put("popupId", popupId);
        params.put("questionTemplateId", questionTemplateId);
        params.put("responseStartedAt", responseStartedAt);
        params.put("totalScore", totalScore);
        params.put("passedYn", passedYn);
        upsertPopupResponse(params);
        return (Long) params.get("responseId");
    }

    int deleteResponseAnswers(@Param("responseId") Long responseId);

    /** XML 바인딩용. selectKey가 {@code responseAnswerId}를 Map에 채운다. */
    void insertResponseAnswer(Map<String, Object> params);

    /** PopupService 호출용. 시퀀스로 발급한 RESPONSE_ANSWER_ID를 반환한다. */
    default Long insertResponseAnswer(
            Long responseId, Long questionId, String textAnswer,
            BigDecimal earnedScore, String correctYn, String userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("responseId", responseId);
        params.put("questionId", questionId);
        params.put("textAnswer", textAnswer);
        params.put("earnedScore", earnedScore);
        params.put("correctYn", correctYn);
        params.put("userId", userId);
        insertResponseAnswer(params);
        return (Long) params.get("responseAnswerId");
    }

    int insertResponseValue(
            @Param("responseAnswerId") Long responseAnswerId,
            @Param("optionId") Long optionId,
            @Param("selectedValue") String selectedValue,
            @Param("userId") String userId);

    int markPopupCompleted(
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("passedYn") String passedYn);

    VideoPopupContext selectVideoPopupContext(
            @Param("userId") String userId,
            @Param("popupId") String popupId);

    int upsertVideoProgress(
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("durationSeconds") BigDecimal durationSeconds,
            @Param("positionSeconds") BigDecimal positionSeconds,
            @Param("maximumPositionSeconds") BigDecimal maximumPositionSeconds,
            @Param("watchedSeconds") BigDecimal watchedSeconds,
            @Param("watchedRatio") BigDecimal watchedRatio,
            @Param("completedYn") String completedYn);

    OffsetDateTime selectVideoCompletedAt(
            @Param("userId") String userId,
            @Param("popupId") String popupId);

    int countActiveUserAndPopup(
            @Param("userId") String userId,
            @Param("popupId") String popupId);

    int upsertPopupEvent(
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("eventType") String eventType);

    List<UserPopupStatusDto> selectPopupStatuses(
            @Param("userId") String userId);
}
