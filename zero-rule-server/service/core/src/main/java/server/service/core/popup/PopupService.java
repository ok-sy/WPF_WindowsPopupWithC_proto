package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupFooterAction;
import server.domain.popup.PopupWindowOptions;
import server.domain.popup.AdminPopupListItemDto;
import server.domain.popup.AdminPopupSaveCommand;
import server.domain.popup.AdminPopupTargetCondition;
import server.domain.popup.AdminPopupTargetGroup;
import server.domain.popup.AdminPopupTargetRow;
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
import server.repo.core.mapper.popup.PopupMapper;

import java.math.BigDecimal;
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
 *
 * <p>[설계 18 L-0 — 구 WPF API 정리] WPF 인터페이스가 계약서 v3.0의 3개 API(로그인·목록·결과 일괄 전송)로
 * 통합되어, 구 WPF-01~06 전용이던 {@code getPopups(userId)}, {@code recordPopupEvent}, {@code getPopupStatuses},
 * 정답 제외 문항 조회 {@code loadPublicQuestions}와 그 보조 오버로드를 삭제했다. 목록은 WpfPopupService,
 * 결과는 WpfResultProcessor가 담당하며, 이 클래스의 {@code hidePopup}·{@code submitResponse}·
 * {@code saveVideoProgress}는 WpfResultProcessor가 위임 호출하므로 유지한다.
 * [설계 47-4] WPF 결과는 전달 건 기준으로 받으므로 WpfResultProcessor는 게시 조건을 다시 따지지 않는
 * {@code submitDeliveredResponse}·{@code saveDeliveredVideoProgress}를 호출한다.</p>
 */
@Service
public class PopupService {

    private static final Logger log = LoggerFactory.getLogger(PopupService.class);

    private static final Set<String> POPUP_TYPES =
            Set.of("TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ");
    private static final Set<String> DISPLAY_MODES =
            Set.of("SEQUENTIAL", "SIMULTANEOUS");
    private static final Set<String> SIZE_MODES =
            Set.of("FIXED", "RATIO", "FULLSCREEN");
    /** [설계 18 L-1] IMAGE content.imageSizeMode 허용값. 과거 값 FIXED는 더 이상 저장하지 않는다. */
    private static final Set<String> IMAGE_SIZE_MODES =
            Set.of("ADAPTIVE", "FIT_TO_IMAGE", "ORIGINAL");

    private final PopupMapper popupMapper;
    private final ObjectMapper objectMapper;
    /**
     * [Oracle 전환 — 기준 5] content JSON을 SQL(JSONB) 대신 Java에서 조립한다.
     * 스프링 빈으로 두지 않고 같은 ObjectMapper로 직접 생성해 기존 생성자 시그니처와 테스트를 유지한다.
     */
    private final PopupContentAssembler contentAssembler;

    public PopupService(PopupMapper popupMapper, ObjectMapper objectMapper) {
        this.popupMapper = popupMapper;
        this.objectMapper = objectMapper;
        this.contentAssembler = new PopupContentAssembler(objectMapper);
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
                : loadQuestions(List.of(popup.questionTemplateId()))
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
        // [TODO55-4] SURVEY·QUIZ 서식을 검증하고 일반 문자열을 서식에서 파생한 값으로 이후 검증·저장한다.
        popup = PopupSurveyRichText.normalize(popup);
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
                && popup.questions().equals(loadQuestions(List.of(existing.questionTemplateId()))
                        .getOrDefault(existing.questionTemplateId(), List.of()))) {
            return existing.questionTemplateId();
        }
        // 기존 문항을 덮어쓰지 않아 과거 답안이 참조하는 문항과 정답이 유지된다.
        Long templateId = popupMapper.insertQuestionTemplate(popup.title().trim(), type, auditUser);
        if (templateId == null) throw new IllegalStateException("문항 템플릿 저장에 실패했습니다.");
        for (int i = 0; i < popup.questions().size(); i++) {
            PopupQuestionDto question = popup.questions().get(i);
            Long questionId = popupMapper.insertAdminQuestion(templateId, question,
                    richTextJson(question.titleBlocks()), richTextJson(question.descriptionBlocks()), quiz, i + 1, auditUser);
            if (questionId == null) throw new IllegalStateException("문항 저장에 실패했습니다.");
            if (!"TEXT".equals(question.questionType())) {
                for (int j = 0; j < question.options().size(); j++) {
                    PopupOptionDto option = question.options().get(j);
                    if (popupMapper.insertAdminOption(questionId, option, richTextJson(option.textBlocks()), quiz,
                            j + 1, auditUser) != 1) throw new IllegalStateException("선택지 저장에 실패했습니다.");
                }
            }
        }
        return templateId;
    }

    /** [TODO55] 문항·선택지 서식을 CLOB에 넣을 JSON 배열 문자열로 바꾼다. 서식 없음은 NULL로 저장한다. */
    private String richTextJson(List<Object> blocks) {
        if (blocks == null) return null;
        try {
            return objectMapper.writeValueAsString(blocks);
        } catch (Exception exception) {
            throw new IllegalArgumentException("문항 서식을 JSON으로 변환할 수 없습니다.", exception);
        }
    }

    /**
     * [TODO55] 저장된 문항·선택지 서식 JSON을 배열로 읽는다. 손상된 값은 빈 값으로 숨기지 않고 ID와 함께 실패시킨다
     * (CONTENT_OPTIONS 해석 실패와 같은 정책).
     */
    private List<Object> parseRichText(String json, String owner) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<Object>>() { });
        } catch (Exception exception) {
            throw new IllegalStateException("저장된 서식 JSON을 읽을 수 없습니다. " + owner, exception);
        }
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
     * 사용자가 선택한 기간 동안 팝업을 숨긴다. 만료 시각은 DB가 서버(KST) 시각 기준으로 계산해 저장한다.
     * 호출자(WpfResultProcessor)는 만료 시각을 응답에 싣지 않으므로 저장 후 재조회하지 않는다.
     */
    @Transactional
    public void hidePopup(
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
    }

    /**
     * 설문·퀴즈 답안을 검증해 응답 테이블에 저장한다.
     * 제출 시점의 노출 자격, 문항 소속, 중복 제출, 필수 답안을 검사한 후 문항별 정오답·점수를 계산한다.
     * 요청 ID를 응답 upsert에 전달하고 반환된 응답 ID의 하위 답안을 교체한다.
     * 모든 저장은 한 트랜잭션이므로 중간 실패 시 일부 답안만 남지 않는다.
     *
     * <p>[설계 33] QUIZ의 최종 점수·통과 여부는 WPF가 로컬 채점으로 결정한 {@code clientScore}/{@code clientPassed}를
     * 그대로 저장하고 완료 판정에도 사용한다(둘 다 필수). 서버 계산값은 문항별 상세 저장과 불일치 경고 로그에만 쓴다.
     * SURVEY는 채점 대상이 아니므로 WPF 값을 받지 않고 기존처럼 0점·통과로 저장해 제출 즉시 완료한다.</p>
     */
    @Transactional
    public PopupSubmitResponseDto submitResponse(
            String popupId,
            String clientRequestId,
            String userId,
            List<PopupSubmitAnswer> answers,
            Double clientScore,
            Boolean clientPassed) {
        return submitResponse(popupId, clientRequestId, userId, answers, clientScore, clientPassed, true);
    }

    /**
     * [설계 47-4] 이미 전달한 건(OPEN·EXPIRED)의 제출 결과를 저장한다. 호출자(WpfResultProcessor)가 전달 건의 소유 사번·
     * 팝업 일치·미종료를 먼저 확인한 경우에만 쓴다.
     *
     * <p>게시중단 전에 표시된 팝업의 결과는 수용하므로 신규 조회의 게시 조건(팝업 활성·게시 기간·대상)을 다시 따지지 않고,
     * 활성 사용자와 popupId의 채점 설정만 확인한다. 팝업 행이 없으면(삭제) 거절한다. 문항·선택지 검증과 저장 규칙은
     * {@link #submitResponse(String, String, String, List, Double, Boolean)}과 같다.</p>
     */
    @Transactional
    public PopupSubmitResponseDto submitDeliveredResponse(
            String popupId,
            String clientRequestId,
            String userId,
            List<PopupSubmitAnswer> answers,
            Double clientScore,
            Boolean clientPassed) {
        return submitResponse(popupId, clientRequestId, userId, answers, clientScore, clientPassed, false);
    }

    /** @param requirePublished true면 신규 조회와 같은 노출 자격(활성·기간·대상·숨김)을 제출 시점에 다시 검사한다. */
    private PopupSubmitResponseDto submitResponse(
            String popupId,
            String clientRequestId,
            String userId,
            List<PopupSubmitAnswer> answers,
            Double clientScore,
            Boolean clientPassed,
            boolean requirePublished) {
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

        if (requirePublished) {
            // 화면을 연 뒤 기간이나 대상 설정이 바뀔 수 있으므로 제출 시점에 다시 검사한다.
            boolean eligible = popupMapper.selectAvailablePopups(normalizedUserId).stream()
                    .anyMatch(popup -> normalizedPopupId.equals(popup.popupId()));
            if (!eligible) {
                throw new IllegalArgumentException(
                        "현재 사용자에게 제출 가능한 팝업이 아닙니다.");
            }
        }

        PopupSubmissionContext context = popupMapper.selectSubmissionContext(
                normalizedUserId, normalizedPopupId, requirePublished);
        if (context == null && !requirePublished) {
            // 전달 건 결과 수용: 비활성 사용자 또는 삭제된 팝업
            throw new IllegalArgumentException(
                    "현재 사용자에게 제출 가능한 팝업이 아닙니다.");
        }
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

        // 답안 형식을 DB의 문항·선택지로 검증하고 문항별 정오답·점수를 계산한다(상세 저장·불일치 확인용).
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
        if ("QUIZ".equalsIgnoreCase(context.popupType())) {
            if (clientScore == null || clientPassed == null
                    || !Double.isFinite(clientScore) || clientScore < 0) {
                throw new IllegalArgumentException("QUIZ 제출에는 WPF 채점 결과(score·passed)가 필요합니다.");
            }
            logClientScoreMismatch(normalizedUserId, normalizedPopupId, normalizedRequestId,
                    clientScore, clientPassed, totalScore, "Y".equals(passedYn));
            totalScore = BigDecimal.valueOf(clientScore).setScale(2, RoundingMode.HALF_UP);
            passedYn = clientPassed ? "Y" : "N";
        }

        Long responseId = popupMapper.upsertPopupResponse(
                normalizedRequestId, normalizedUserId, normalizedPopupId,
                context.questionTemplateId(), totalScore, passedYn);
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
        return new PopupSubmitResponseDto(totalScore.doubleValue(), "Y".equals(passedYn));
    }

    /**
     * [설계 12·33] WPF 로컬 채점값과 서버 계산값이 다르면 경고 로그만 남긴다(저장 값은 WPF 값).
     * 정답 데이터가 어긋났는지 추적하기 위한 것이다. 점수는 소수 둘째 자리(WPF 반올림 기준)로 비교한다.
     */
    private static void logClientScoreMismatch(String userId, String popupId, String resultId,
                                               double clientScore, boolean clientPassed,
                                               BigDecimal serverScore, boolean serverPassed) {
        if (Math.abs(clientScore - serverScore.doubleValue()) >= 0.01 || clientPassed != serverPassed) {
            log.warn("[WPF] QUIZ 로컬 채점값 불일치 userId={} popupId={} resultId={} wpf(score={}, passed={}) server(score={}, passed={})",
                    userId, popupId, resultId, clientScore, clientPassed, serverScore, serverPassed);
        }
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
        return saveVideoProgress(popupId, userId, durationSeconds, positionSeconds,
                maximumPositionSeconds, watchedSeconds, true);
    }

    /**
     * [설계 47-4] 이미 전달한 건(OPEN·EXPIRED)의 영상 시청 결과를 저장한다. 호출자(WpfResultProcessor)가 전달 건을
     * 먼저 확인한 경우에만 쓴다. 팝업 활성·게시 기간을 다시 따지지 않고 활성 사용자와 popupId의 완료 기준만 확인한다
     * (팝업 행이 없으면 거절). 비율·완료 판정 규칙은 {@link #saveVideoProgress(String, String, BigDecimal, BigDecimal,
     * BigDecimal, BigDecimal)}과 같다.
     */
    @Transactional
    public VideoProgressResponseDto saveDeliveredVideoProgress(
            String popupId,
            String userId,
            BigDecimal durationSeconds,
            BigDecimal positionSeconds,
            BigDecimal maximumPositionSeconds,
            BigDecimal watchedSeconds) {
        return saveVideoProgress(popupId, userId, durationSeconds, positionSeconds,
                maximumPositionSeconds, watchedSeconds, false);
    }

    /** @param requirePublished true면 팝업 활성·게시 기간도 확인한다. */
    private VideoProgressResponseDto saveVideoProgress(
            String popupId,
            String userId,
            BigDecimal durationSeconds,
            BigDecimal positionSeconds,
            BigDecimal maximumPositionSeconds,
            BigDecimal watchedSeconds,
            boolean requirePublished) {
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
                normalizedUserId, normalizedPopupId, requirePublished);
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
        // 동영상+퀴즈는 영상만 봐서는 완료되지 않는다. 퀴즈 통과 시 submitResponse에서 완료한다.
        if ("VIDEO".equals(context.popupType())) {
            popupMapper.markPopupCompleted(normalizedUserId, normalizedPopupId, completedYn);
        }
        return new VideoProgressResponseDto(completed);
    }

    @Transactional(readOnly = true)
    public List<server.domain.popup.AdminQuestionTemplate> getAdminQuestionTemplates() {
        return popupMapper.selectAdminQuestionTemplates();
    }

    @Transactional(readOnly = true)
    public List<server.domain.popup.AdminPopupQuestion> getAdminQuestions(Long templateId) {
        if (templateId == null) return List.of();
        return loadQuestions(List.of(templateId)).getOrDefault(templateId, List.of()).stream()
                .map(server.domain.popup.AdminPopupQuestion::new)
                .toList();
    }

    /**
     * [설계 12 §4 — WPF 로컬 채점] 정답 정보(선택지 isCorrect·서술형 correctAnswer·answerMatchMode)를 포함한 문항.
     * WPF가 QUIZ 제출 시 서버 응답을 기다리지 않고 즉시 점수·통과 여부를 계산하려면 정답 키가 필요하다.
     * WpfPopupService가 모든 유형의 문항을 이 메서드로 읽은 뒤 QUIZ가 아니면 {@code WpfPopupItem.withoutAnswerKey}로 정답 키를 뺀다.
     * 관리자 상세와 같은 loadQuestions를 재사용한다.
     */
    @Transactional(readOnly = true)
    public Map<Long, List<PopupQuestionDto>> loadQuestionsWithAnswerKey(List<Long> templateIds) {
        return loadQuestions(templateIds);
    }

    /**
     * [WPF API 추가 — 기준 2·3] 노출 판정이 끝난 엔티티와 호출자가 고른 문항을 공용 응답 DTO로 변환하는 공개 진입점.
     * 문항의 정답 키는 그대로 옮긴다. WpfPopupService는 QUIZ면 정답 키를 포함한 문항(WPF 로컬 채점용)을,
     * 그 밖의 유형이면 {@code WpfPopupItem.withoutAnswerKey}로 정답 키를 뺀 문항을 넘긴다.
     * 관리자 상세와 같은 toResponseDto를 사용해 content 조립 규칙이 한 곳에만 있게 한다.
     */
    public PopupResponseDto toPublicResponseDto(PopupEntity popup, List<PopupQuestionDto> questions) {
        return toResponseDto(popup, questions);
    }

    /**
     * 템플릿들의 문항과 선택지를 각각 일괄 조회한 뒤 템플릿 ID별로 묶는다.
     * 빈 ID 목록에는 쿼리를 실행하지 않는다. 정답 정보(선택지 isCorrect·서술형 correctAnswer·answerMatchMode)를
     * 항상 포함하며, WPF에 정답 키를 빼고 내릴 때는 호출자가 {@code WpfPopupItem.withoutAnswerKey}로 제거한다.
     */
    private Map<Long, List<PopupQuestionDto>> loadQuestions(List<Long> templateIds) {
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
                                        question.questionId(), List.of())),
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
        if (!isOrdinaryImage(popup)) {
            if (popup.width() == null || popup.height() == null) throw new IllegalArgumentException("팝업 너비와 높이는 필수입니다.");
            validatePositiveNumber(popup.width(), "팝업 너비");
            validatePositiveNumber(popup.height(), "팝업 높이");
        } else {
            // [TODO58] 일반 IMAGE도 공통 popup.width/height 한 쌍을 쓴다(ADAPTIVE 창 전체, FIT_TO_IMAGE 이미지 콘텐츠 영역).
            // 생략 축은 기존 규칙대로 원본 기준이라 선택 값이다. content.width/height는 validateImageLayoutOptions가 거절한다.
            if (popup.width() != null) validatePositiveNumber(popup.width(), "팝업 너비");
            if (popup.height() != null) validatePositiveNumber(popup.height(), "팝업 높이");
        }
        validatePositiveNumber(popup.widthRatio(), "너비 비율");
        validatePositiveNumber(popup.heightRatio(), "높이 비율");
        validatePositiveNumber(popup.minimumWidth(), "최소 너비");
        validatePositiveNumber(popup.minimumHeight(), "최소 높이");
        validatePositiveNumber(popup.maximumWidth(), "최대 너비");
        validatePositiveNumber(popup.maximumHeight(), "최대 높이");
        if (!"IMAGE".equals(normalizeUpper(popup.popupType())) && (popup.maximumWidth() < popup.minimumWidth()
                || popup.maximumHeight() < popup.minimumHeight())) {
            throw new IllegalArgumentException("최대 크기는 최소 크기보다 작을 수 없습니다.");
        }
        // [설계 46] WPF 결과 HIDDEN의 hideDays 허용 범위(1~3650)와 같게 저장 단계에서 막는다. 초과 값이 저장되면
        // "다시 보지 않기" 결과가 REJECTED로 종결되어 숨김이 적용되지 않는다.
        if (popup.hideDays() != null && (popup.hideDays() < 1 || popup.hideDays() > 3650)) {
            throw new IllegalArgumentException("숨김 일수는 1~3650일이어야 합니다.");
        }
        if (popup.completionRatio() != null
                && (!Double.isFinite(popup.completionRatio()) || popup.completionRatio() < 0 || popup.completionRatio() > 1)) {
            throw new IllegalArgumentException("완료 비율은 0~1 사이여야 합니다.");
        }
        if (popup.passingScore() != null && popup.passingScore() < 0) {
            throw new IllegalArgumentException("통과 점수는 0 이상이어야 합니다.");
        }
        validateFontSizeOptions(popup.content());
        validateWindowOptions(popup.content());
        validateActionOptions(popup);
        validateRichText(popup);
        if ("IMAGE".equals(normalizeUpper(popup.popupType()))) {
            validateImageSizeMode(popup.content());
            validateImageLayoutOptions(popup);
        }
        if (active == null) {
            throw new IllegalArgumentException("활성 여부는 필수입니다.");
        }
        if (auditUser == null || auditUser.isBlank()
                || auditUser.trim().length() > 30) {
            throw new IllegalArgumentException("등록·수정자 정보는 1~30자여야 합니다.");
        }
    }

    /**
     * 선택적인 푸터 동작 및 영상 결합 모드 설정을 저장 전에 검증한다.
     * [설계 30·34-35] footerAction은 CLOSE / LINK_AND_CLOSE / SUBMIT. 유형별 허용 값만 받는다.
     * TEXT/IMAGE/VIDEO는 CLOSE·LINK_AND_CLOSE, SURVEY/QUIZ(동영상+퀴즈 포함)는 SUBMIT만 허용하며 잘못된 명시값은 거부한다.
     * 생략은 유형별 기본값(CLOSE 또는 SUBMIT)으로 본다. LINK_AND_CLOSE는 절대 http/https URL이 필수다.
     */
    static void validateActionOptions(PopupResponseDto popup) {
        Map<String, Object> content = popup.content();
        if (content == null) return;
        Object action = PopupFooterAction.explicitValue(content.get(PopupFooterAction.ACTION_KEY));
        if (!PopupFooterAction.isKnown(action))
            throw new IllegalArgumentException("푸터 동작은 CLOSE, LINK_AND_CLOSE, SUBMIT 중 하나여야 합니다.");
        boolean submitType = PopupFooterAction.isSubmitType(popup.popupType());
        if (PopupFooterAction.SUBMIT.equals(action) && !submitType)
            throw new IllegalArgumentException("제출(SUBMIT) 푸터 동작은 설문·퀴즈에서만 사용할 수 있습니다.");
        if (action != null && !PopupFooterAction.SUBMIT.equals(action) && submitType)
            throw new IllegalArgumentException("설문·퀴즈의 푸터 동작은 제출(SUBMIT)만 사용할 수 있습니다.");
        if (PopupFooterAction.LINK_AND_CLOSE.equals(action) && !submitType) {
            try {
                java.net.URI uri = java.net.URI.create(contentText(content, "footerLinkUrl"));
                if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                        || uri.getHost() == null) throw new IllegalArgumentException();
            } catch (Exception e) {
                throw new IllegalArgumentException("바로가기 URL은 유효한 http/https 주소여야 합니다.");
            }
        }
        // [설계 27] 영상 진행바 탐색 허용. 생략 시 클라이언트 기본값 true, 값이 있으면 boolean만 저장한다.
        Object seek = content.get("allowSeek");
        if (seek != null && !(seek instanceof Boolean))
            throw new IllegalArgumentException("allowSeek는 boolean이어야 합니다.");
        Object video = content.get("videoEnabled");
        if (video != null && !(video instanceof Boolean))
            throw new IllegalArgumentException("videoEnabled는 boolean이어야 합니다.");
        if (Boolean.TRUE.equals(video)) {
            if (!"QUIZ".equals(normalizeUpper(popup.popupType()))
                    || contentText(content, "videoUrl") == null || contentText(content, "videoUrl").isBlank())
                throw new IllegalArgumentException("동영상+퀴즈는 QUIZ 유형과 영상 URL이 필요합니다.");
        }
    }

    /** [설계 28] TEXT 본문 서식(textBlocks)은 TEXT에서만 허용하며 구조·허용 값을 검증한다. */
    static void validateRichText(PopupResponseDto popup) {
        Object textBlocks = popup.content() == null ? null : popup.content().get(PopupRichText.KEY);
        if (textBlocks != null && !"TEXT".equals(normalizeUpper(popup.popupType()))) {
            throw new IllegalArgumentException("본문 서식(textBlocks)은 TEXT 팝업에서만 사용할 수 있습니다.");
        }
        PopupRichText.validateAndDerivePlainText(textBlocks);
    }

    /**
     * [설계 28] 서식 본문이 있으면 CONTENT_BODY(plainText)는 클라이언트 값이 아니라 textBlocks에서 파생한다.
     * 두 값을 따로 수정해 어긋나는 것을 막고, 결과·통계·구버전 클라이언트는 기존 plainText를 그대로 쓴다.
     */
    static String bodyText(Map<String, Object> content) {
        String derived = PopupRichText.validateAndDerivePlainText(content.get(PopupRichText.KEY));
        return derived != null ? derived : contentText(content, "plainText");
    }

    /** IMAGE 크기 모드는 ADAPTIVE / FIT_TO_IMAGE / ORIGINAL만 저장한다. */
    private static void validateImageSizeMode(Map<String, Object> content) {
        Object value = content == null ? null : content.get("imageSizeMode");
        if (value == null || String.valueOf(value).isBlank()) {
            return;
        }
        if (!IMAGE_SIZE_MODES.contains(normalizeUpper(String.valueOf(value)))) {
            throw new IllegalArgumentException(
                    "이미지 크기 모드는 ADAPTIVE, FIT_TO_IMAGE, ORIGINAL 중 하나여야 합니다.");
        }
    }

    /** IMAGE ordinary dimensions are optional positive numbers; retired fields and mode-incompatible options are rejected. */
    private static boolean isOrdinaryImage(PopupResponseDto popup) {
        return "IMAGE".equals(normalizeUpper(popup.popupType()))
            && !"ORIGINAL".equals(normalizeUpper(contentText(popup.content(), "imageSizeMode")));
    }

    private static void validateImageLayoutOptions(PopupResponseDto popup) {
        Map<String, Object> content = popup.content();
        for (String key : List.of("imageWidth", "imageHeight", "descriptionPosition", "imageAreaRatio")) {
            if (content.containsKey(key)) throw new IllegalArgumentException("폐기된 IMAGE 필드: " + key);
        }
        // [TODO58] 크기는 popup.width/height로 옮겼다. content 쪽 크기는 이중 지시가 되므로 받지 않는다.
        for (String key : List.of("width", "height")) {
            if (content.containsKey(key))
                throw new IllegalArgumentException("폐기된 IMAGE 필드: content." + key + " (popup.width/height를 사용하세요)");
        }
        boolean fit = "FIT_TO_IMAGE".equals(normalizeUpper(contentText(content, "imageSizeMode")));
        if (content.containsKey("keepAspectRatio") && (!fit || !(content.get("keepAspectRatio") instanceof Boolean)))
            throw new IllegalArgumentException("keepAspectRatio는 FIT_TO_IMAGE 전용 boolean입니다.");
    }

    /*
     * [TODO58] 일반 IMAGE의 popup.width/height는 저장 구조를 바꾸지 않고 기존처럼 CONTENT_OPTIONS의 width/height(축별 생략 가능)에 둔다.
     * 조회 시 toResponseDto가 다시 최상위 popup.width/height로 꺼낸다. ORIGINAL과 다른 유형은 POPUP_WIDTH/HEIGHT 컬럼을 쓴다.
     */
    private static Map<String, Object> withImageSize(PopupResponseDto popup, Map<String, Object> content) {
        if (!isOrdinaryImage(popup)) return content;
        Map<String, Object> options = new LinkedHashMap<>(content);
        options.remove("width");
        options.remove("height");
        if (popup.width() != null) options.put("width", popup.width());
        if (popup.height() != null) options.put("height", popup.height());
        return options;
    }

    private static Double positiveDimension(Object value) {
        return value instanceof Number number && Double.isFinite(number.doubleValue()) && number.doubleValue() > 0
                ? number.doubleValue() : null;
    }

    private static void validatePositiveNumber(double value, String fieldName) {
        if (!Double.isFinite(value) || value <= 0) {
            throw new IllegalArgumentException(fieldName + "는 0보다 커야 합니다.");
        }
    }

    /**
     * [설계 31] PopupWindow 공통 UI 옵션(Overlay·위치) 입력 방어. 값이 없으면 통과(WPF 응답 시 기본값).
     * opacity 범위(0~1)는 저장 시 서버가 검증하고, WPF는 받은 값을 한 번 더 0~1로 보정한다.
     */
    static void validateWindowOptions(Map<String, Object> content) {
        if (content == null) return;
        // [설계 34-32] null·빈 문자열은 생략(기본값)으로 본다. false·0은 정상 명시값이다.
        java.util.function.Function<String, Object> value = key -> content.get(key) instanceof String text && text.isBlank()
                ? null : content.get(key);
        Object overlay = value.apply(PopupWindowOptions.USE_OVERLAY_KEY);
        if (overlay != null && !(overlay instanceof Boolean))
            throw new IllegalArgumentException("배경 Overlay 사용(useBackgroundOverlay)은 boolean이어야 합니다.");
        Object opacity = value.apply(PopupWindowOptions.OVERLAY_OPACITY_KEY);
        if (opacity != null && !(opacity instanceof Number number
                && Double.isFinite(number.doubleValue()) && number.doubleValue() >= 0 && number.doubleValue() <= 1))
            throw new IllegalArgumentException("배경 불투명도(backgroundOverlayOpacity)는 0~1 사이 숫자여야 합니다.");
        Object position = value.apply(PopupWindowOptions.POSITION_KEY);
        if (position != null && !(position instanceof String text && PopupWindowOptions.POSITIONS.contains(text)))
            throw new IllegalArgumentException("팝업 위치(popupPosition)는 CENTER, TOP_LEFT 등 9개 값 중 하나여야 합니다.");
    }

    /** [설계 14 §5.7] 관리자 폰트 크기 입력 범위. WPF PopupOptions.FontSizeMin/Max·웹 입력 범위와 같다. */
    static final double FONT_SIZE_MIN = 10;
    static final double FONT_SIZE_MAX = 40;
    private static final List<String> FONT_SIZE_KEYS = List.of("headerFontSize", "bodyFontSize", "footerFontSize");

    /**
     * [설계 14 §5.7 — 입력 방어] content(CONTENT_OPTIONS)에 담겨 오는 Header/본문/Footer 폰트 크기를 검사한다.
     * 값이 없거나 null이면 통과(기존 데이터·미설정 = 기본 크기, §5.8). 값이 있으면 숫자이고 10~40 범위여야 한다.
     * 별도 DB 컬럼을 두지 않고 Overlay 옵션처럼 content JSON으로 저장·전달하므로 검증도 여기서 content 키 단위로 한다.
     */
    static void validateFontSizeOptions(Map<String, Object> content) {
        if (content == null) {
            return;
        }
        for (String key : FONT_SIZE_KEYS) {
            Object value = content.get(key);
            if (value == null || (value instanceof String text && text.isBlank())) {
                continue;   // [설계 34-32] 생략·빈 문자열 = 화면 기본 크기
            }
            double size;
            if (value instanceof Number number) {
                size = number.doubleValue();
            } else {
                try {
                    size = Double.parseDouble(String.valueOf(value).trim());
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("폰트 크기(" + key + ")는 숫자여야 합니다.");
                }
            }
            if (!Double.isFinite(size) || size < FONT_SIZE_MIN || size > FONT_SIZE_MAX) {
                throw new IllegalArgumentException(
                        "폰트 크기(" + key + ")는 " + (int) FONT_SIZE_MIN + "~" + (int) FONT_SIZE_MAX + " 사이여야 합니다.");
            }
        }
    }

    /**
     * API 값을 DB 저장 형식(대문자 코드, Y/N, BigDecimal)으로 변환한다.
     * 유형별 제목·설명·본문·미디어 URL은 개별 컬럼으로 추출한다(TEXT는 [설계 37] 제목·설명 컬럼을 비운다).
     * [설계 18 L-3] CONTENT_OPTIONS에는 컬럼 사본과 서버 파생 키(문항·완료 비율·통과 점수 등)를 빼고
     * 나머지 확장 옵션만 보관한다. 사본을 저장하면 조회 시 컬럼 값과 어긋날 수 있다.
     */
    private AdminPopupSaveCommand toAdminSaveCommand(
            PopupResponseDto popup,
            boolean active,
            String auditUser,
            Long questionTemplateId) {
        Map<String, Object> content = popup.content() == null ? Map.of() : popup.content();
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
                BigDecimal.valueOf(popup.width() == null ? 560 : popup.width()),
                BigDecimal.valueOf(popup.height() == null ? 420 : popup.height()),
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
                toYn(popup.showLater()),
                popup.hideDays(),
                toBigDecimal(popup.completionRatio()),
                "QUIZ".equals(popupType) ? toBigDecimal(popup.passingScore()) : null,
                // [설계 37] TEXT의 제목·설명은 본문(textBlocks)으로 통합해 정규 컬럼을 비운다.
                "TEXT".equals(popupType) ? null : contentText(content, contentTitleKey(popupType)),
                "TEXT".equals(popupType) ? null : contentText(content, "description"),
                bodyText(content),
                contentText(content, "QUIZ".equals(popupType) && Boolean.TRUE.equals(content.get("videoEnabled"))
                        ? "videoUrl" : mediaUrlKey(popupType)),
                writeContentJson(popup.popupId(), storedOptions(popupType, withImageSize(popup, content))),
                auditUser);
    }

    /** CONTENT_OPTIONS 저장 형태. 정규 컬럼 사본을 빼고 [설계 30] Footer 동작을 저장 정규형으로 맞춘다. */
    static Map<String, Object> storedOptions(String popupType, Map<String, Object> content) {
        Map<String, Object> options = PopupContentAssembler.withoutStoredCopies(content);
        // [설계 37] TEXT는 콘텐츠 제목·설명 영역이 없어 표시 여부도 저장하지 않는다.
        if ("TEXT".equals(popupType)) options.remove("showContentHeader");
        PopupFooterAction.normalizeStored(popupType, options);
        return options;
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

    /** TEXT는 호출 전에 제외되고 유형은 validateAdminPopup에서 검증되므로 나머지(SURVEY·QUIZ)는 surveyTitle이다. */
    private static String contentTitleKey(String popupType) {
        return switch (popupType) {
            case "IMAGE" -> "imageTitle";
            case "VIDEO" -> "videoTitle";
            default -> "surveyTitle";
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
     * 문항과 선택지를 API 구조로 조립한다. 선택지 정답 여부, 서술형 정답 및 일치 모드를 포함한다.
     */
    private PopupQuestionDto toQuestionDto(
            PopupQuestionEntity question,
            List<PopupOptionEntity> options) {
        List<PopupOptionDto> optionDtos = options.stream()
                .map(option -> new PopupOptionDto(
                        option.optionId(),
                        option.optionValue(),
                        option.optionText(),
                        option.sortOrder(),
                        isYes(option.correctYn()),
                        parseRichText(option.textBlocksJson(), "optionId=" + option.optionId())))
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
                question.correctAnswer(),
                question.answerMatchMode(),
                question.optionLayout(),
                parseRichText(question.titleBlocksJson(), "questionId=" + question.questionId()),
                parseRichText(question.descriptionBlocksJson(), "questionId=" + question.questionId()));
    }

    /**
     * DB의 숫자·Y/N 값과 콘텐츠 컬럼을 웹 및 WPF 공용 응답으로 변환한다.
     * 크기 설정 8개는 NOT NULL 컬럼이다(설계 18 L-4 — 08 스크립트 이후 기본값 보정 없음). 선택 설정인
     * 완료율·통과 점수는 null을 유지한다. 설문·퀴즈 문항은 최상위 questions로만 제공한다(설계 18 L-3 — content.questions 중복 제거).
     * [Oracle 전환 — 기준 5] content는 매퍼가 내려준 JSON 문자열이 아니라
     * PopupContentAssembler가 정규 컬럼 + CONTENT_OPTIONS로 조립한다.
     */
    private PopupResponseDto toResponseDto(
            PopupEntity popup,
            List<PopupQuestionDto> questions) {
        Map<String, Object> content = contentAssembler.assemble(popup);
        // [TODO58] 일반 IMAGE 크기는 content.width/height가 아니라 최상위 popup.width/height로 내려준다(생략 축은 null → JSON에서 빠짐).
        boolean ordinaryImage = "IMAGE".equals(popup.popupType()) && !"ORIGINAL".equals(content.get("imageSizeMode"));
        Double width = ordinaryImage ? positiveDimension(content.remove("width")) : Double.valueOf(popup.popupWidth().doubleValue());
        Double height = ordinaryImage ? positiveDimension(content.remove("height")) : Double.valueOf(popup.popupHeight().doubleValue());

        return new PopupResponseDto(
                popup.popupId(), popup.popupType(), popup.title(),
                popup.displayStartAt(), popup.displayEndAt(),
                popup.displayMode(), popup.displayOrder(), popup.sizeMode(),
                width,
                height,
                popup.widthRatio().doubleValue(),
                popup.heightRatio().doubleValue(),
                popup.minimumWidth().doubleValue(),
                popup.minimumHeight().doubleValue(),
                popup.maximumWidth().doubleValue(),
                popup.maximumHeight().doubleValue(),
                isYes(popup.showHeaderYn()),
                isYes(popup.showCloseButtonYn()),
                isYes(popup.showFooterYn()),
                isYes(popup.showDontShowYn()),
                isYes(popup.showLaterYn()),
                popup.questionTemplateId(), popup.periodMode(),
                popup.repeatInterval(), popup.repeatDayOfWeek(),
                popup.repeatDayOfMonth(), popup.hideDays(),
                toNullableDouble(popup.completionRatio()),
                toNullableDouble(popup.passingScore()),
                questions, content);
    }

    private boolean isYes(String value) {
        return "Y".equalsIgnoreCase(value);
    }

    private Double toNullableDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }
}
