package server.service.core.popup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.popup.PopupEntity;
import server.domain.popup.AdminPopupListItemDto;
import server.domain.popup.AdminPopupSaveCommand;
import server.domain.popup.AdminPopupTargetCondition;
import server.domain.popup.AdminPopupTargetGroup;
import server.domain.popup.AdminPopupTargetRow;
import server.domain.popup.PopupEventResponseDto;
import server.domain.popup.PopupHideResponseDto;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupOptionEntity;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.PopupSubmitResponseDto;
import server.domain.popup.VideoPopupContext;
import server.domain.popup.VideoProgressResponseDto;
import server.domain.popup.UserPopupStatusDto;
import server.repo.core.mapper.popup.PopupMapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 관리자 팝업 편집과 WPF 클라이언트의 조회·응답 처리를 담당한다.
 *
 * <p>DB 조회와 갱신은 PopupMapper에 위임하고, 이 클래스는 입력 검증,
 * 문항·선택지 조립, 서버 기준 채점, 콘텐츠 JSON 변환을 담당한다.
 * 관리자 조회는 편집을 위해 비활성 팝업과 정답도 반환하지만,
 * 사용자 조회는 노출 대상 필터를 적용하고 정답을 제외한다.</p>
 *
 * <p>여러 테이블을 변경하는 공개 메서드는 하나의 트랜잭션으로 실행한다.
 * 저장 도중 예외가 발생하면 문항, 콘텐츠, 대상 조건 또는 응답 중
 * 일부만 저장되지 않도록 함께 롤백한다.</p>
 */
@Service
public class PopupService {

    private static final Set<String> POPUP_TYPES =
            Set.of("TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ");
    private static final Set<String> DISPLAY_MODES =
            Set.of("SEQUENTIAL", "SIMULTANEOUS");
    private static final Set<String> SIZE_MODES =
            Set.of("FIXED", "RATIO", "FULLSCREEN");

    private final PopupMapper popupMapper;
    private final ObjectMapper objectMapper;

    public PopupService(PopupMapper popupMapper, ObjectMapper objectMapper) {
        this.popupMapper = popupMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 관리자 화면에서 사용할 전체 팝업 목록을 조회한다.
     * 사용자 대상, 게시 기간, 숨김 여부를 적용하지 않는 것이 WPF 조회와의 차이다.
     */
    @Transactional(readOnly = true)
    public List<AdminPopupListItemDto> getAdminPopups() {
        return popupMapper.selectAdminPopups();
    }

    /**
     * 관리자 편집 화면과 CSS 미리보기에 필요한 팝업 한 건을 조회한다.
     * 사용자 대상이나 노출 기간을 검사하지 않으므로 비활성 팝업도 미리볼 수 있다.
     */
    @Transactional(readOnly = true)
    public PopupResponseDto getAdminPopup(String popupId) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }

        String normalizedPopupId = popupId.trim();
        PopupEntity popup = popupMapper.selectAdminPopupById(normalizedPopupId);
        if (popup == null) {
            throw new IllegalArgumentException(
                    "등록된 팝업을 찾을 수 없습니다. popupId=" + normalizedPopupId);
        }

        List<PopupQuestionDto> questions = popup.questionTemplateId() == null
                ? List.of()
                : loadQuestions(List.of(popup.questionTemplateId()), true)
                        .getOrDefault(popup.questionTemplateId(), List.of());

        return toResponseDto(popup, questions);
    }

    /**
     * DB의 그룹·조건 조인 행을 편집 화면의 그룹별 조건 목록으로 복원한다.
     * LinkedHashMap으로 조회된 그룹 순서를 유지하며, 각 그룹의 이름과 설명은
     * 해당 그룹 첫 행에서 가져온다.
     */
    public List<AdminPopupTargetGroup> getAdminTargetGroups(String popupId) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }
        Map<Long, List<AdminPopupTargetRow>> rowsByGroup =
                popupMapper.selectAdminPopupTargets(popupId.trim()).stream()
                        .collect(Collectors.groupingBy(
                                AdminPopupTargetRow::targetGroupId,
                                LinkedHashMap::new,
                                Collectors.toList()));
        return rowsByGroup.values().stream()
                .map(rows -> new AdminPopupTargetGroup(
                        rows.get(0).targetName(),
                        rows.get(0).targetDescription(),
                        rows.stream().map(this::toTargetCondition).toList()))
                .toList();
    }

    /**
     * 팝업 공통 설정과 유형별 콘텐츠를 하나의 트랜잭션으로 저장한다.
     * popupId는 필수이며, 해당 ID의 DB 행이 없으면 등록하고 있으면 수정한다.
     * 문항 템플릿을 먼저 확정한 뒤 공통 설정·콘텐츠·대상 조건을 저장하고,
     * DB에 반영된 값을 관리자 응답 형식으로 다시 조회해 반환한다.
     */
    @Transactional
    public PopupResponseDto saveAdminPopup(
            PopupResponseDto popup,
            Boolean active,
            List<AdminPopupTargetGroup> targetGroups,
            String auditUser) {
        validateAdminPopup(popup, active, auditUser);
        List<AdminPopupTargetGroup> normalizedGroups = normalizeTargetGroups(targetGroups);
        if (Boolean.TRUE.equals(active) && normalizedGroups.isEmpty()) {
            throw new IllegalArgumentException(
                    "활성 팝업은 대상 조건 그룹을 한 개 이상 지정해야 합니다.");
        }

        AdminPopupSaveCommand command = toAdminSaveCommand(
                popup, active, auditUser.trim(), saveAdminQuestions(popup, auditUser.trim()));
        int noticeRows = popupMapper.upsertAdminPopupNotice(command);
        int contentRows = popupMapper.upsertAdminPopupContent(command);
        if (noticeRows <= 0 || contentRows <= 0) {
            throw new IllegalStateException("팝업 저장에 실패했습니다.");
        }

        // 대상 조건은 부분 수정하지 않고 요청 목록 전체로 교체한다.
        // 화면의 배열 순서를 1부터 시작하는 저장 순서로 변환한다.
        popupMapper.deleteAdminPopupTargets(command.popupId());
        for (int groupIndex = 0; groupIndex < normalizedGroups.size(); groupIndex++) {
            AdminPopupTargetGroup group = normalizedGroups.get(groupIndex);
            Long targetGroupId = popupMapper.insertAdminTargetGroup(
                    command.popupId(), group.targetName(), group.targetDescription(),
                    groupIndex + 1, command.auditUser());
            if (targetGroupId == null) {
                throw new IllegalStateException("팝업 대상 그룹 저장에 실패했습니다.");
            }
            for (int conditionIndex = 0;
                    conditionIndex < group.conditions().size(); conditionIndex++) {
                if (popupMapper.insertAdminTargetCondition(
                        targetGroupId, group.conditions().get(conditionIndex),
                        conditionIndex + 1, command.auditUser()) <= 0) {
                    throw new IllegalStateException("팝업 대상 조건 저장에 실패했습니다.");
                }
            }
        }

        return getAdminPopup(command.popupId());
    }

    /**
     * 설문·퀴즈의 문항 구성을 검증하고 저장할 템플릿 ID를 결정한다.
     * 기존 유형과 문항 목록이 같으면 템플릿을 재사용한다. 변경되면 새 템플릿과
     * 문항·선택지를 생성하여 기존 제출 답안 및 다른 팝업의 참조를 보존한다.
     * 설문·퀴즈 이외의 유형은 문항 템플릿을 연결하지 않는다.
     */
    private Long saveAdminQuestions(PopupResponseDto popup, String auditUser) {
        String type = normalizeUpper(popup.popupType());
        if (!Set.of("SURVEY", "QUIZ").contains(type)) return null;
        boolean quiz = "QUIZ".equals(type);
        PopupQuestionRules.validate(popup.questions(), quiz, popup.passingScore());
        PopupEntity existing = popupMapper.selectAdminPopupById(popup.popupId().trim());
        if (existing != null && type.equals(existing.popupType())
                && existing.questionTemplateId() != null
                && popup.questions().equals(loadQuestions(List.of(existing.questionTemplateId()), true)
                        .getOrDefault(existing.questionTemplateId(), List.of()))) {
            return existing.questionTemplateId();
        }
        // 기존 문항을 덮어쓰지 않아 과거 답안이 참조하는 문항과 정답이 유지된다.
        Long templateId = popupMapper.insertQuestionTemplate(popup.title().trim(), type, auditUser);
        if (templateId == null) throw new IllegalStateException("문항 템플릿 저장에 실패했습니다.");
        for (int i = 0; i < popup.questions().size(); i++) {
            PopupQuestionDto question = popup.questions().get(i);
            Long questionId = popupMapper.insertAdminQuestion(templateId, question, quiz, i + 1, auditUser);
            if (questionId == null) throw new IllegalStateException("문항 저장에 실패했습니다.");
            if (!"TEXT".equals(question.questionType())) {
                for (int j = 0; j < question.options().size(); j++) {
                    if (popupMapper.insertAdminOption(questionId, question.options().get(j), quiz,
                            j + 1, auditUser) != 1) throw new IllegalStateException("선택지 저장에 실패했습니다.");
                }
            }
        }
        return templateId;
    }

    /**
     * 그룹 누락과 빈 조건 목록은 거절하고 이름·설명 누락은 기본 문구로 채운다.
     * 빈 그룹 배열의 허용 여부는 호출부에서 활성 상태와 함께 판단한다.
     */
    private List<AdminPopupTargetGroup> normalizeTargetGroups(
            List<AdminPopupTargetGroup> groups) {
        if (groups == null) {
            throw new IllegalArgumentException("대상 조건 그룹은 필수입니다.");
        }
        List<AdminPopupTargetGroup> normalized = new java.util.ArrayList<>();
        for (int groupIndex = 0; groupIndex < groups.size(); groupIndex++) {
            AdminPopupTargetGroup group = groups.get(groupIndex);
            if (group == null || group.conditions() == null
                    || group.conditions().isEmpty()) {
                throw new IllegalArgumentException("각 대상 그룹에는 조건이 한 개 이상 필요합니다.");
            }
            List<AdminPopupTargetCondition> conditions = group.conditions().stream()
                    .map(this::normalizeTargetCondition)
                    .toList();
            String name = normalizeText(group.targetName());
            String description = normalizeText(group.targetDescription());
            normalized.add(new AdminPopupTargetGroup(
                    name == null ? "대상 그룹 " + (groupIndex + 1) : name,
                    description == null ? "관리자 화면에서 등록한 대상 조건" : description,
                    conditions));
        }
        return normalized;
    }

    /**
     * 대상 유형별 허용 연산자와 값 형식을 검사한다.
     * 입사일은 날짜 비교를 허용하고, 부서·직급·사번은 일치/불일치만 허용한다.
     * 하위 부서 포함 옵션은 부서 조건에서만 유효하다.
     */
    private AdminPopupTargetCondition normalizeTargetCondition(
            AdminPopupTargetCondition condition) {
        if (condition == null) {
            throw new IllegalArgumentException("대상 조건은 비어 있을 수 없습니다.");
        }
        String type = normalizeUpper(condition.conditionType());
        String operator = normalizeText(condition.conditionOperator());
        String value = normalizeText(condition.value());
        if (!Set.of("DEPARTMENT", "POSITION", "EMPLOYEE", "HIRE_DATE").contains(type)) {
            throw new IllegalArgumentException("지원하지 않는 대상 조건 유형입니다: " + type);
        }
        Set<String> operators = "HIRE_DATE".equals(type)
                ? Set.of("=", "!=", "<", "<=", ">", ">=")
                : Set.of("=", "!=");
        if (!operators.contains(operator) || value == null) {
            throw new IllegalArgumentException("대상 조건의 연산자와 값이 올바르지 않습니다.");
        }
        if ("HIRE_DATE".equals(type)) {
            LocalDate.parse(value);
        } else if (value.length() > 30) {
            throw new IllegalArgumentException("부서·직급·사번 값은 30자 이하여야 합니다.");
        }
        boolean includeChild = "DEPARTMENT".equals(type) && condition.includeChild();
        return new AdminPopupTargetCondition(type, operator, value, includeChild);
    }

    private AdminPopupTargetCondition toTargetCondition(AdminPopupTargetRow row) {
        String value = switch (row.conditionType()) {
            case "DEPARTMENT" -> row.departmentId();
            case "POSITION" -> row.positionId();
            case "EMPLOYEE" -> row.employeeNo();
            case "HIRE_DATE" -> row.conditionDateValue() == null
                    ? null : row.conditionDateValue().toString();
            default -> null;
        };
        return new AdminPopupTargetCondition(
                row.conditionType(), row.conditionOperator(), value,
                "Y".equalsIgnoreCase(row.includeChildYn()));
    }

    /** 팝업의 나머지 설정은 유지하고 활성 여부만 변경한다. */
    @Transactional
    public PopupResponseDto updateAdminPopupActive(
            String popupId,
            Boolean active,
            String auditUser) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }
        if (active == null) {
            throw new IllegalArgumentException("활성 여부는 필수입니다.");
        }
        if (auditUser == null || auditUser.isBlank()) {
            throw new IllegalArgumentException("수정자 정보는 필수입니다.");
        }
        if (Boolean.TRUE.equals(active)
                && popupMapper.countAdminPopupTargetGroups(popupId.trim()) == 0) {
            throw new IllegalArgumentException(
                    "대상 조건이 없는 팝업은 활성화할 수 없습니다.");
        }

        String normalizedPopupId = popupId.trim();
        int affectedRows = popupMapper.updateAdminPopupActive(
                normalizedPopupId, toYn(active), auditUser.trim());
        if (affectedRows <= 0) {
            throw new IllegalArgumentException(
                    "활성 여부를 변경할 팝업을 찾을 수 없습니다. popupId="
                            + normalizedPopupId);
        }
        return getAdminPopup(normalizedPopupId);
    }

    /**
     * 사용자별 기간·대상·숨김 조건을 통과한 팝업을 조회한다.
     * 노출 판정은 Mapper 쿼리에 맡기고, 중복 제거한 템플릿 ID로 문항과 선택지를
     * 일괄 조회한다. 팝업마다 문항 조회 쿼리를 반복하지 않고 결과를 재사용한다.
     */
    @Transactional(readOnly = true)
    public List<PopupResponseDto> getPopups(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }

        List<PopupEntity> popups = popupMapper.selectAvailablePopups(userId.trim());
        List<Long> templateIds = popups.stream()
                .map(PopupEntity::questionTemplateId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, List<PopupQuestionDto>> questionsByTemplate = loadQuestions(templateIds);

        return popups.stream()
                .map(popup -> {
                    Long templateId = popup.questionTemplateId();
                    List<PopupQuestionDto> questions = templateId == null
                            ? List.of()
                            : questionsByTemplate.getOrDefault(templateId, List.of());
                    return toResponseDto(popup, questions);
                })
                .toList();
    }

    /**
     * 사용자가 선택한 기간 동안 팝업을 숨긴다.
     * 상태 저장과 저장 결과 재조회를 하나의 트랜잭션으로 묶는다.
     */
    @Transactional
    public PopupHideResponseDto hidePopup(
            String popupId,
            String userId,
            Integer hideDays) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }
        if (hideDays == null || hideDays < 1 || hideDays > 3650) {
            throw new IllegalArgumentException(
                    "숨김 일수는 1일 이상 3650일 이하여야 합니다.");
        }

        String normalizedPopupId = popupId.trim();
        String normalizedUserId = userId.trim();
        int affectedRows = popupMapper.upsertPopupHide(
                normalizedUserId, normalizedPopupId, hideDays);
        if (affectedRows <= 0) {
            throw new IllegalStateException(
                    "팝업 숨김 상태 저장에 실패했습니다. userId="
                            + normalizedUserId + ", popupId=" + normalizedPopupId);
        }

        // DB가 계산한 실제 만료 일시를 반환하여 클라이언트와 서버의 시간 차이를 피한다.
        OffsetDateTime hiddenUntil = popupMapper.selectHiddenUntil(
                normalizedUserId, normalizedPopupId);
        if (hiddenUntil == null) {
            throw new IllegalStateException(
                    "팝업 숨김 만료 일시를 조회할 수 없습니다. userId="
                            + normalizedUserId + ", popupId=" + normalizedPopupId);
        }

        return new PopupHideResponseDto(
                normalizedUserId, normalizedPopupId, "UNTIL", hiddenUntil);
    }

    /**
     * 설문·퀴즈 답안을 서버의 문항·정답과 대조해 채점하고 응답 테이블에 저장한다.
     * 제출 시점의 노출 자격, 문항 소속, 중복 제출, 필수 답안을 검사한 후 채점한다.
     * 요청 ID를 응답 upsert에 전달하고 반환된 응답 ID의 하위 답안을 교체한다.
     * 모든 저장은 한 트랜잭션이므로 중간 실패 시 일부 답안만 남지 않는다.
     */
    @Transactional
    public PopupSubmitResponseDto submitResponse(
            String popupId,
            String clientRequestId,
            String userId,
            OffsetDateTime responseStartedAt,
            List<PopupSubmitAnswer> answers) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }
        if (clientRequestId == null || clientRequestId.isBlank()) {
            throw new IllegalArgumentException("요청 ID는 필수입니다.");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }
        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("하나 이상의 답안이 필요합니다.");
        }

        String normalizedPopupId = popupId.trim();
        String normalizedRequestId = clientRequestId.trim();
        String normalizedUserId = userId.trim();

        // 화면을 연 뒤 기간이나 대상 설정이 바뀔 수 있으므로 제출 시점에 다시 검사한다.
        boolean eligible = popupMapper.selectAvailablePopups(normalizedUserId).stream()
                .anyMatch(popup -> normalizedPopupId.equals(popup.popupId()));
        if (!eligible) {
            throw new IllegalArgumentException(
                    "현재 사용자에게 제출 가능한 팝업이 아닙니다.");
        }

        PopupSubmissionContext context = popupMapper.selectSubmissionContext(
                normalizedUserId, normalizedPopupId);
        if (context == null
                || !("SURVEY".equalsIgnoreCase(context.popupType())
                || "QUIZ".equalsIgnoreCase(context.popupType()))
                || context.questionTemplateId() == null) {
            throw new IllegalArgumentException("설문형 팝업만 답안을 제출할 수 있습니다.");
        }

        List<PopupQuestionEntity> questions =
                popupMapper.selectQuestionsByTemplateIds(
                        List.of(context.questionTemplateId()));
        Map<Long, PopupQuestionEntity> questionById = questions.stream()
                .collect(Collectors.toMap(
                        PopupQuestionEntity::questionId, Function.identity()));

        Set<Long> submittedQuestionIds = new HashSet<>();
        for (PopupSubmitAnswer answer : answers) {
            if (answer == null || answer.questionId() == null) {
                throw new IllegalArgumentException("문항 ID는 필수입니다.");
            }
            if (!submittedQuestionIds.add(answer.questionId())) {
                throw new IllegalArgumentException(
                        "같은 문항을 중복 제출할 수 없습니다. questionId="
                                + answer.questionId());
            }
            if (!questionById.containsKey(answer.questionId())) {
                throw new IllegalArgumentException(
                        "현재 설문에 포함되지 않은 문항입니다. questionId="
                                + answer.questionId());
            }
        }

        for (PopupQuestionEntity question : questions) {
            if (isYes(question.requiredYn())
                    && !hasRequiredAnswer(question, answers)) {
                throw new IllegalArgumentException(
                        "필수 문항에 답해야 합니다. questionId="
                                + question.questionId());
            }
        }

        List<Long> questionIds = questions.stream()
                .map(PopupQuestionEntity::questionId)
                .toList();
        Map<Long, List<PopupOptionEntity>> optionsByQuestion = questionIds.isEmpty()
                ? Map.of()
                : popupMapper.selectOptionsByQuestionIds(questionIds).stream()
                .collect(Collectors.groupingBy(PopupOptionEntity::questionId));

        // 클라이언트가 보낸 점수가 아니라 DB의 배점과 정답으로 모든 답안을 먼저 검증·채점한다.
        List<GradedAnswer> gradedAnswers = answers.stream()
                .map(answer -> gradeAnswer(
                        questionById.get(answer.questionId()),
                        answer,
                        optionsByQuestion.getOrDefault(
                                answer.questionId(), List.of())))
                .toList();
        BigDecimal totalScore = gradedAnswers.stream()
                .map(GradedAnswer::earnedScore)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // 비채점 문항의 null 점수는 합산에서 제외하며, 통과 점수 미설정은 0점으로 본다.
        BigDecimal passingScore = context.passingScore() == null
                ? BigDecimal.ZERO : context.passingScore();
        String passedYn = totalScore.compareTo(passingScore) >= 0 ? "Y" : "N";

        Long responseId = popupMapper.upsertPopupResponse(
                normalizedRequestId, normalizedUserId, normalizedPopupId,
                context.questionTemplateId(), responseStartedAt,
                totalScore, passedYn);
        if (responseId == null) {
            throw new IllegalStateException("설문 응답 저장에 실패했습니다.");
        }
        // 같은 응답을 갱신할 때 이전 선택지가 남지 않도록 상세 답안을 다시 구성한다.
        popupMapper.deleteResponseAnswers(responseId);

        for (GradedAnswer graded : gradedAnswers) {
            Long responseAnswerId = popupMapper.insertResponseAnswer(
                    responseId,
                    graded.question().questionId(),
                    normalizeText(graded.answer().textAnswer()),
                    graded.earnedScore(),
                    graded.correctYn(),
                    normalizedUserId);
            for (PopupOptionEntity selectedOption : graded.selectedOptions()) {
                popupMapper.insertResponseValue(
                        responseAnswerId,
                        selectedOption.optionId(),
                        selectedOption.optionValue(),
                        normalizedUserId);
            }
        }

        popupMapper.markPopupCompleted(
                normalizedUserId, normalizedPopupId, passedYn);
        return new PopupSubmitResponseDto(
                responseId, normalizedRequestId, normalizedUserId,
                normalizedPopupId, "SUBMITTED", totalScore.doubleValue(),
                "Y".equals(passedYn), OffsetDateTime.now());
    }

    /** 서술형은 공백이 아닌 텍스트, 선택형은 하나 이상의 선택지 제출을 필수 답안으로 본다. */
    private boolean hasRequiredAnswer(
            PopupQuestionEntity question,
            List<PopupSubmitAnswer> answers) {
        return answers.stream()
                .filter(answer -> question.questionId().equals(answer.questionId()))
                .anyMatch(answer -> "TEXT".equalsIgnoreCase(question.questionType())
                        ? normalizeText(answer.textAnswer()) != null
                        : !answer.optionIds().isEmpty());
    }

    /**
     * 문항 유형에 맞는 답안인지 검사하고 저장에 필요한 채점 결과를 만든다.
     * 서술형 정답 비교는 PopupQuestionRules의 일치 모드에 위임한다.
     * 선택형은 해당 문항의 선택지만 허용하며 정답 집합과 완전히 같을 때만
     * 전체 배점을 부여한다. 부분 점수는 없고 비채점 문항은 점수·정오답을 null로 둔다.
     */
    private GradedAnswer gradeAnswer(
            PopupQuestionEntity question,
            PopupSubmitAnswer answer,
            List<PopupOptionEntity> availableOptions) {
        if ("TEXT".equalsIgnoreCase(question.questionType())) {
            if (!answer.optionIds().isEmpty()) {
                throw new IllegalArgumentException(
                        "서술형 문항에는 선택지를 제출할 수 없습니다. questionId="
                                + question.questionId());
            }
            if (!isYes(question.scoredYn())) {
                return new GradedAnswer(question, answer, List.of(), null, null);
            }
            boolean correct = PopupQuestionRules.matchesText(
                    answer.textAnswer(), question.correctAnswer(), question.answerMatchMode());
            return new GradedAnswer(question, answer, List.of(),
                    correct ? question.questionScore() : BigDecimal.ZERO, correct ? "Y" : "N");
        }

        if (normalizeText(answer.textAnswer()) != null) {
            throw new IllegalArgumentException(
                    "선택형 문항에는 textAnswer를 제출할 수 없습니다. questionId="
                            + question.questionId());
        }
        if ("SINGLE_CHOICE".equalsIgnoreCase(question.questionType())
                && answer.optionIds().size() > 1) {
            throw new IllegalArgumentException(
                    "단일 선택 문항은 하나만 선택할 수 있습니다. questionId="
                            + question.questionId());
        }

        Set<Long> uniqueOptionIds = new HashSet<>(answer.optionIds());
        if (uniqueOptionIds.size() != answer.optionIds().size()) {
            throw new IllegalArgumentException(
                    "같은 선택지를 중복 제출할 수 없습니다. questionId="
                            + question.questionId());
        }
        Map<Long, PopupOptionEntity> optionById = availableOptions.stream()
                .collect(Collectors.toMap(
                        PopupOptionEntity::optionId, Function.identity()));
        List<PopupOptionEntity> selectedOptions = answer.optionIds().stream()
                .map(optionId -> {
                    PopupOptionEntity option = optionById.get(optionId);
                    if (option == null) {
                        throw new IllegalArgumentException(
                                "현재 문항에 포함되지 않은 선택지입니다. optionId="
                                        + optionId);
                    }
                    return option;
                })
                .toList();

        if (!isYes(question.scoredYn())) {
            return new GradedAnswer(
                    question, answer, selectedOptions, null, null);
        }
        Set<Long> correctOptionIds = availableOptions.stream()
                .filter(option -> isYes(option.correctYn()))
                .map(PopupOptionEntity::optionId)
                .collect(Collectors.toSet());
        boolean correct = uniqueOptionIds.equals(correctOptionIds);
        BigDecimal earnedScore = correct
                ? question.questionScore() : BigDecimal.ZERO;
        return new GradedAnswer(
                question, answer, selectedOptions,
                earnedScore, correct ? "Y" : "N");
    }

    private String normalizeText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record GradedAnswer(
            PopupQuestionEntity question,
            PopupSubmitAnswer answer,
            List<PopupOptionEntity> selectedOptions,
            BigDecimal earnedScore,
            String correctYn
    ) {
    }

    /**
     * 전달받은 누적 시청시간을 기준으로 진행률과 완료 여부를 계산해 저장한다.
     * 현재 위치나 최대 도달 위치는 저장용이며 완료율의 분자로 사용하지 않는다.
     * 누적 시청시간은 영상 길이로 제한하고 비율은 소수점 4자리에서 내림한다.
     * 완료 기준 미설정 시 100%를 적용하고 진행률과 팝업 완료 상태를 함께 갱신한다.
     */
    @Transactional
    public VideoProgressResponseDto saveVideoProgress(
            String popupId,
            String userId,
            BigDecimal durationSeconds,
            BigDecimal positionSeconds,
            BigDecimal maximumPositionSeconds,
            BigDecimal watchedSeconds) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }
        if (durationSeconds == null || durationSeconds.signum() <= 0
                || positionSeconds == null || positionSeconds.signum() < 0
                || maximumPositionSeconds == null
                || maximumPositionSeconds.signum() < 0
                || watchedSeconds == null || watchedSeconds.signum() < 0) {
            throw new IllegalArgumentException("영상 재생시간 값이 올바르지 않습니다.");
        }
        if (positionSeconds.compareTo(durationSeconds) > 0
                || maximumPositionSeconds.compareTo(durationSeconds) > 0) {
            throw new IllegalArgumentException(
                    "영상 재생 위치는 전체 재생시간을 초과할 수 없습니다.");
        }

        String normalizedPopupId = popupId.trim();
        String normalizedUserId = userId.trim();
        VideoPopupContext context = popupMapper.selectVideoPopupContext(
                normalizedUserId, normalizedPopupId);
        if (context == null) {
            throw new IllegalArgumentException(
                    "현재 사용자에게 유효한 영상 팝업이 아닙니다.");
        }

        BigDecimal normalizedWatchedSeconds = watchedSeconds.min(durationSeconds);
        BigDecimal watchedRatio = normalizedWatchedSeconds.divide(
                durationSeconds, 4, RoundingMode.DOWN).min(BigDecimal.ONE);
        BigDecimal requiredRatio = context.completionRatio() == null
                ? BigDecimal.ONE : context.completionRatio();
        boolean completed = watchedRatio.compareTo(requiredRatio) >= 0;
        String completedYn = completed ? "Y" : "N";

        int affectedRows = popupMapper.upsertVideoProgress(
                normalizedUserId, normalizedPopupId,
                durationSeconds, positionSeconds, maximumPositionSeconds,
                normalizedWatchedSeconds, watchedRatio, completedYn);
        if (affectedRows <= 0) {
            throw new IllegalStateException("영상 진행률 저장에 실패했습니다.");
        }
        popupMapper.markPopupCompleted(
                normalizedUserId, normalizedPopupId, completedYn);
        OffsetDateTime completedAt = completed
                ? popupMapper.selectVideoCompletedAt(
                        normalizedUserId, normalizedPopupId)
                : null;

        return new VideoProgressResponseDto(
                normalizedUserId, normalizedPopupId,
                watchedRatio.doubleValue(), requiredRatio.doubleValue(),
                completed, completedAt);
    }

    /**
     * DISPLAYED(표시) 또는 CLOSED(닫기) 이벤트를 사용자 상태에 반영한다.
     * 활성 사용자·팝업의 존재를 확인하며, 답안 제출과 달리 노출 목록을 재조회하지 않는다.
     * 응답 시각은 이 메서드에서 생성한 서버 현재 시각이다.
     */
    @Transactional
    public PopupEventResponseDto recordPopupEvent(
            String popupId,
            String userId,
            String eventType) {
        if (popupId == null || popupId.isBlank()) {
            throw new IllegalArgumentException("팝업 ID는 필수입니다.");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }
        if (eventType == null || eventType.isBlank()) {
            throw new IllegalArgumentException("이벤트 유형은 필수입니다.");
        }

        String normalizedPopupId = popupId.trim();
        String normalizedUserId = userId.trim();
        String normalizedEventType = eventType.trim().toUpperCase();
        if (!("DISPLAYED".equals(normalizedEventType)
                || "CLOSED".equals(normalizedEventType))) {
            throw new IllegalArgumentException(
                    "이벤트 유형은 DISPLAYED 또는 CLOSED여야 합니다.");
        }
        if (popupMapper.countActiveUserAndPopup(
                normalizedUserId, normalizedPopupId) == 0) {
            throw new IllegalArgumentException("유효한 사용자 또는 팝업이 아닙니다.");
        }
        if (popupMapper.upsertPopupEvent(
                normalizedUserId, normalizedPopupId, normalizedEventType) <= 0) {
            throw new IllegalStateException("팝업 이벤트 저장에 실패했습니다.");
        }
        return new PopupEventResponseDto(
                normalizedUserId, normalizedPopupId,
                normalizedEventType, OffsetDateTime.now());
    }

    /** 사용자의 팝업별 표시·숨김·완료 상태를 조회한다. */
    @Transactional(readOnly = true)
    public List<UserPopupStatusDto> getPopupStatuses(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }
        return popupMapper.selectPopupStatuses(userId.trim());
    }

    @Transactional(readOnly = true)
    public List<server.domain.popup.AdminQuestionTemplate> getAdminQuestionTemplates() {
        return popupMapper.selectAdminQuestionTemplates();
    }

    @Transactional(readOnly = true)
    public List<server.domain.popup.AdminPopupQuestion> getAdminQuestions(Long templateId) {
        if (templateId == null) return List.of();
        return loadQuestions(List.of(templateId), true).getOrDefault(templateId, List.of()).stream()
                .map(question -> new server.domain.popup.AdminPopupQuestion(question,
                        question.options().stream().filter(option -> Boolean.TRUE.equals(option.isCorrect()))
                                .map(PopupOptionDto::value).toList()))
                .toList();
    }

    private Map<Long, List<PopupQuestionDto>> loadQuestions(List<Long> templateIds) {
        return loadQuestions(templateIds, false);
    }

    /**
     * 템플릿들의 문항과 선택지를 각각 일괄 조회한 뒤 템플릿 ID별로 묶는다.
     * 빈 ID 목록에는 쿼리를 실행하지 않는다. admin 플래그는 응답에 정답 정보를
     * 포함할지 결정하며 사용자 조회의 기본값은 false다.
     */
    private Map<Long, List<PopupQuestionDto>> loadQuestions(List<Long> templateIds, boolean admin) {
        if (templateIds.isEmpty()) {
            return Map.of();
        }

        List<PopupQuestionEntity> questions =
                popupMapper.selectQuestionsByTemplateIds(templateIds);
        List<Long> questionIds = questions.stream()
                .map(PopupQuestionEntity::questionId)
                .toList();
        Map<Long, List<PopupOptionEntity>> optionsByQuestion = questionIds.isEmpty()
                ? Map.of()
                : popupMapper.selectOptionsByQuestionIds(questionIds).stream()
                .collect(Collectors.groupingBy(
                        PopupOptionEntity::questionId,
                        LinkedHashMap::new,
                        Collectors.toList()));

        return questions.stream().collect(Collectors.groupingBy(
                PopupQuestionEntity::questionTemplateId,
                LinkedHashMap::new,
                Collectors.mapping(
                        question -> toQuestionDto(
                                question,
                                optionsByQuestion.getOrDefault(
                                        question.questionId(), List.of()), admin),
                        Collectors.toList())));
    }

    /**
     * 공통 설정의 필수값, 지원 유형, 날짜 순서, 크기 및 점수 범위를 검사한다.
     * 문항 규칙은 saveAdminQuestions, 대상 조건 규칙은 normalizeTargetGroups에서
     * 별도로 검사한다. 크기는 유한한 양수인지와 최소·최대의 순서를 검사한다.
     */
    private void validateAdminPopup(
            PopupResponseDto popup,
            Boolean active,
            String auditUser) {
        if (popup == null) {
            throw new IllegalArgumentException("팝업 정보는 필수입니다.");
        }
        if (popup.popupId() == null || popup.popupId().isBlank()
                || popup.popupId().trim().length() > 50) {
            throw new IllegalArgumentException("팝업 ID는 1~50자여야 합니다.");
        }
        if (popup.title() == null || popup.title().isBlank()
                || popup.title().trim().length() > 200) {
            throw new IllegalArgumentException("팝업 제목은 1~200자여야 합니다.");
        }
        if (!POPUP_TYPES.contains(normalizeUpper(popup.popupType()))) {
            throw new IllegalArgumentException("지원하지 않는 팝업 유형입니다.");
        }
        if (!DISPLAY_MODES.contains(normalizeUpper(popup.displayMode()))) {
            throw new IllegalArgumentException("지원하지 않는 표시 모드입니다.");
        }
        if (popup.displayOrder() != null && popup.displayOrder() < 1) {
            throw new IllegalArgumentException("표시 우선순위는 1 이상이어야 합니다.");
        }
        if (!SIZE_MODES.contains(normalizeUpper(popup.sizeMode()))) {
            throw new IllegalArgumentException("지원하지 않는 크기 모드입니다.");
        }
        if (popup.periodMode() == null || popup.periodMode().isBlank()) {
            throw new IllegalArgumentException("기간 모드는 필수입니다.");
        }
        if (popup.displayStartAt() == null || popup.displayEndAt() == null
                || popup.displayEndAt().isBefore(popup.displayStartAt())) {
            throw new IllegalArgumentException("팝업 노출 종료일은 시작일 이후여야 합니다.");
        }
        validatePositiveNumber(popup.width(), "팝업 너비");
        validatePositiveNumber(popup.height(), "팝업 높이");
        validatePositiveNumber(popup.widthRatio(), "너비 비율");
        validatePositiveNumber(popup.heightRatio(), "높이 비율");
        validatePositiveNumber(popup.minimumWidth(), "최소 너비");
        validatePositiveNumber(popup.minimumHeight(), "최소 높이");
        validatePositiveNumber(popup.maximumWidth(), "최대 너비");
        validatePositiveNumber(popup.maximumHeight(), "최대 높이");
        if (popup.maximumWidth() < popup.minimumWidth()
                || popup.maximumHeight() < popup.minimumHeight()) {
            throw new IllegalArgumentException("최대 크기는 최소 크기보다 작을 수 없습니다.");
        }
        if (popup.hideDays() != null && popup.hideDays() < 1) {
            throw new IllegalArgumentException("숨김 일수는 1일 이상이어야 합니다.");
        }
        if (popup.completionRatio() != null
                && (popup.completionRatio() < 0 || popup.completionRatio() > 1)) {
            throw new IllegalArgumentException("완료 비율은 0~1 사이여야 합니다.");
        }
        if (popup.passingScore() != null && popup.passingScore() < 0) {
            throw new IllegalArgumentException("통과 점수는 0 이상이어야 합니다.");
        }
        if (active == null) {
            throw new IllegalArgumentException("활성 여부는 필수입니다.");
        }
        if (auditUser == null || auditUser.isBlank()
                || auditUser.trim().length() > 30) {
            throw new IllegalArgumentException("등록·수정자 정보는 1~30자여야 합니다.");
        }
    }

    private static void validatePositiveNumber(double value, String fieldName) {
        if (!Double.isFinite(value) || value <= 0) {
            throw new IllegalArgumentException(fieldName + "는 0보다 커야 합니다.");
        }
    }

    /**
     * API 값을 DB 저장 형식(대문자 코드, Y/N, BigDecimal)으로 변환한다.
     * 문항은 별도 테이블로 관리하므로 콘텐츠 JSON의 questions는 제거한다.
     * 유형별 제목·미디어 URL은 개별 컬럼으로 추출하고 나머지 콘텐츠 설정도 JSON에 보관한다.
     */
    private AdminPopupSaveCommand toAdminSaveCommand(
            PopupResponseDto popup,
            boolean active,
            String auditUser,
            Long questionTemplateId) {
        Map<String, Object> content = new LinkedHashMap<>(popup.content());
        content.remove("questions");
        String popupType = normalizeUpper(popup.popupType());

        return new AdminPopupSaveCommand(
                popup.popupId().trim(),
                questionTemplateId,
                popupType,
                popup.title().trim(),
                popup.displayStartAt(),
                popup.displayEndAt(),
                normalizeUpper(popup.displayMode()),
                popup.displayOrder() == null ? 100 : popup.displayOrder(),
                normalizeUpper(popup.periodMode()),
                popup.repeatInterval(),
                normalizeUpper(popup.repeatDayOfWeek()),
                popup.repeatDayOfMonth(),
                toYn(active),
                normalizeUpper(popup.sizeMode()),
                BigDecimal.valueOf(popup.width()),
                BigDecimal.valueOf(popup.height()),
                BigDecimal.valueOf(popup.widthRatio()),
                BigDecimal.valueOf(popup.heightRatio()),
                BigDecimal.valueOf(popup.minimumWidth()),
                BigDecimal.valueOf(popup.minimumHeight()),
                BigDecimal.valueOf(popup.maximumWidth()),
                BigDecimal.valueOf(popup.maximumHeight()),
                toYn(popup.showHeader()),
                toYn(popup.showCloseButton()),
                toYn(popup.showFooter()),
                toYn(popup.showDoNotShowAgain()),
                popup.hideDays(),
                toBigDecimal(popup.completionRatio()),
                "QUIZ".equals(popupType) ? toBigDecimal(popup.passingScore()) : null,
                toYn(popup.allowCloseBeforeComplete()),
                contentText(content, contentTitleKey(popupType)),
                contentText(content, "description"),
                contentText(content, "plainText"),
                contentText(content, mediaUrlKey(popupType)),
                contentText(content, "linkUrl"),
                writeContentJson(popup.popupId(), content),
                auditUser);
    }

    private String writeContentJson(String popupId, Map<String, Object> content) {
        try {
            return objectMapper.writeValueAsString(content == null ? Map.of() : content);
        } catch (Exception exception) {
            throw new IllegalArgumentException(
                    "팝업 콘텐츠를 JSON으로 변환할 수 없습니다. popupId=" + popupId,
                    exception);
        }
    }

    private static String contentTitleKey(String popupType) {
        return switch (popupType) {
            case "IMAGE" -> "imageTitle";
            case "VIDEO" -> "videoTitle";
            case "SURVEY", "QUIZ" -> "surveyTitle";
            default -> "contentTitle";
        };
    }

    private static String mediaUrlKey(String popupType) {
        return switch (popupType) {
            case "IMAGE" -> "imageUrl";
            case "VIDEO" -> "videoUrl";
            default -> "";
        };
    }

    private static String contentText(Map<String, Object> content, String key) {
        if (content == null || key == null || key.isBlank()) {
            return null;
        }
        Object value = content.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private static String normalizeUpper(String value) {
        return value == null || value.isBlank()
                ? null : value.trim().toUpperCase();
    }

    private static String toYn(boolean value) {
        return value ? "Y" : "N";
    }

    private static BigDecimal toBigDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }

    /**
     * 문항과 선택지를 API 구조로 조립한다. 관리자에게만 선택지 정답 여부,
     * 서술형 정답 및 일치 모드를 제공하고 사용자 응답에는 해당 값을 null로 내려준다.
     */
    private PopupQuestionDto toQuestionDto(
            PopupQuestionEntity question,
            List<PopupOptionEntity> options,
            boolean admin) {
        List<PopupOptionDto> optionDtos = options.stream()
                .map(option -> new PopupOptionDto(
                        option.optionId(),
                        option.optionValue(),
                        option.optionText(),
                        option.sortOrder(),
                        admin ? isYes(option.correctYn()) : null))
                .toList();

        return new PopupQuestionDto(
                question.questionId(),
                question.questionTitle(),
                question.questionDescription(),
                question.questionType(),
                isYes(question.requiredYn()),
                isYes(question.scoredYn()),
                question.questionScore(),
                question.sortOrder(),
                optionDtos,
                admin ? question.correctAnswer() : null,
                admin ? question.answerMatchMode() : null);
    }

    /**
     * DB의 숫자·Y/N 값과 콘텐츠 JSON을 웹 및 WPF 공용 응답으로 변환한다.
     * 크기 설정의 DB null 값에는 기본값을 적용하고, 선택 설정인 완료율·통과 점수는
     * null을 유지한다. 설문·퀴즈 문항은 최상위와 content.questions에 함께 제공한다.
     */
    private PopupResponseDto toResponseDto(
            PopupEntity popup,
            List<PopupQuestionDto> questions) {
        Map<String, Object> content = new LinkedHashMap<>(
                parseContentJson(popup.popupId(), popup.contentJson()));
        if ("SURVEY".equalsIgnoreCase(popup.popupType())
                || "QUIZ".equalsIgnoreCase(popup.popupType())) {
            content.put("questions", questions);
        }

        return new PopupResponseDto(
                popup.popupId(), popup.popupType(), popup.title(),
                popup.displayStartAt(), popup.displayEndAt(),
                popup.displayMode(), popup.displayOrder(), popup.sizeMode(),
                toDouble(popup.popupWidth(), 900),
                toDouble(popup.popupHeight(), 620),
                toDouble(popup.widthRatio(), 0.7),
                toDouble(popup.heightRatio(), 0.75),
                toDouble(popup.minimumWidth(), 480),
                toDouble(popup.minimumHeight(), 320),
                toDouble(popup.maximumWidth(), 1200),
                toDouble(popup.maximumHeight(), 900),
                isYes(popup.showHeaderYn()),
                isYes(popup.showCloseButtonYn()),
                isYes(popup.showFooterYn()),
                isYes(popup.showDontShowYn()),
                popup.questionTemplateId(), popup.periodMode(),
                popup.repeatInterval(), popup.repeatDayOfWeek(),
                popup.repeatDayOfMonth(), popup.hideDays(),
                toNullableDouble(popup.completionRatio()),
                toNullableDouble(popup.passingScore()),
                isYes(popup.allowCloseBeforeCompleteYn()),
                questions, content);
    }

    /**
     * 미설정 콘텐츠는 빈 맵으로 취급한다. JSON이 손상된 경우에는 빈 내용으로 숨기지 않고
     * 팝업 ID와 원인 예외를 포함해 실패시켜 어떤 데이터가 잘못됐는지 추적할 수 있게 한다.
     */
    private Map<String, Object> parseContentJson(String popupId, String contentJson) {
        if (contentJson == null || contentJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(
                    contentJson,
                    new TypeReference<Map<String, Object>>() { });
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "팝업 content JSON 변환에 실패했습니다. popupId=" + popupId,
                    exception);
        }
    }

    private boolean isYes(String value) {
        return "Y".equalsIgnoreCase(value);
    }

    private double toDouble(BigDecimal value, double defaultValue) {
        return value == null ? defaultValue : value.doubleValue();
    }

    private Double toNullableDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }
}
