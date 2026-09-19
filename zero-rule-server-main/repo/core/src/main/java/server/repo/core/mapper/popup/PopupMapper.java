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
import java.util.List;

/** popup 스키마의 팝업 표시 데이터를 조회한다. */
@Mapper
public interface PopupMapper {
    List<server.domain.popup.AdminQuestionTemplate> selectAdminQuestionTemplates();


    Long insertQuestionTemplate(@Param("name") String name, @Param("type") String type,
            @Param("auditUser") String auditUser);

    Long insertAdminQuestion(@Param("templateId") Long templateId,
            @Param("question") server.domain.popup.PopupQuestionDto question,
            @Param("quiz") boolean quiz, @Param("sortOrder") int sortOrder,
            @Param("auditUser") String auditUser);

    int insertAdminOption(@Param("questionId") Long questionId,
            @Param("option") server.domain.popup.PopupOptionDto option,
            @Param("quiz") boolean quiz, @Param("sortOrder") int sortOrder,
            @Param("auditUser") String auditUser);

    /** 대상자·기간 필터를 적용하지 않은 관리자용 전체 목록이다. */
    List<AdminPopupListItemDto> selectAdminPopups();

    /** 관리자 편집·미리보기에서 사용할 팝업 한 건의 전체 표시 정보다. */
    PopupEntity selectAdminPopupById(@Param("popupId") String popupId);

    /** 팝업의 공통 표시·기간·크기 설정을 등록하거나 수정한다. */
    int upsertAdminPopupNotice(AdminPopupSaveCommand command);

    /** 팝업 유형별 제목·본문·미디어·추가 옵션을 등록하거나 수정한다. */
    int upsertAdminPopupContent(AdminPopupSaveCommand command);

    List<AdminPopupTargetRow> selectAdminPopupTargets(@Param("popupId") String popupId);

    int deleteAdminPopupTargets(@Param("popupId") String popupId);

    int countAdminPopupTargetGroups(@Param("popupId") String popupId);

    Long insertAdminTargetGroup(
            @Param("popupId") String popupId,
            @Param("targetName") String targetName,
            @Param("targetDescription") String targetDescription,
            @Param("groupOrder") int groupOrder,
            @Param("auditUser") String auditUser);

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

    List<PopupEntity> selectAvailablePopups(@Param("userId") String userId);

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

    Long upsertPopupResponse(
            @Param("clientRequestId") String clientRequestId,
            @Param("userId") String userId,
            @Param("popupId") String popupId,
            @Param("questionTemplateId") Long questionTemplateId,
            @Param("responseStartedAt") OffsetDateTime responseStartedAt,
            @Param("totalScore") BigDecimal totalScore,
            @Param("passedYn") String passedYn);

    int deleteResponseAnswers(@Param("responseId") Long responseId);

    Long insertResponseAnswer(
            @Param("responseId") Long responseId,
            @Param("questionId") Long questionId,
            @Param("textAnswer") String textAnswer,
            @Param("earnedScore") BigDecimal earnedScore,
            @Param("correctYn") String correctYn,
            @Param("userId") String userId);

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
