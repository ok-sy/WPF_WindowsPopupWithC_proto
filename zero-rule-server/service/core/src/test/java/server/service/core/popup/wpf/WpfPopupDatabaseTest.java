package server.service.core.popup.wpf;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.datasource.unpooled.UnpooledDataSource;
import org.apache.ibatis.mapping.Environment;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.apache.ibatis.transaction.jdbc.JdbcTransactionFactory;
import org.apache.ibatis.type.JdbcType;
import org.junit.jupiter.api.Test;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.wpf.WpfPopupItem;
import server.domain.popup.wpf.WpfPopupListResponse;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.domain.popup.wpf.WpfResultType;
import server.domain.popup.wpf.WpfVideoProgress;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.PopupSchema;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * [기준 2·3·4·5] 신규 WPF API를 Oracle 실DB(db/oracle/01·02 적용 상태)로 검증하는 롤백 전용 테스트.
 * POPUP_TEST_DB_PASSWORD가 있을 때만 실행된다. 샘플 기대값(02_popup_sample_oracle.sql 주석):
 *   E1001(개발팀·사원·2024 입사): TEXT, VIDEO, QUIZ, SURVEY
 *   E1002(개발팀·팀장·2018 입사): TEXT, VIDEO, SURVEY
 *   E1003(본사·사원·2026 입사)  : TEXT, SURVEY
 * 스프링 컨테이너 없이 한 SqlSession(autoCommit=false)에서 실행하므로 REQUIRES_NEW 격리는 검증 대상이 아니다
 * (그 부분은 WpfPopupServiceTest가 mock으로 확인). 마지막에 전부 롤백한다.
 */
class WpfPopupDatabaseTest {

    @Test void listAndResultsRoundTripOnOracle() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the rollback-only database test.");
        var dataSource = new UnpooledDataSource("oracle.jdbc.OracleDriver",
                System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"),
                System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"), password);
        var config = new Configuration(new Environment("test", new JdbcTransactionFactory(), dataSource));
        // [ì¤í¤ë§ ë¶ë¦¬ ì¤ì í] ë§¤í¼ì ${popupSchemaPrefix} ë³ì. íê²½ë³ì POPUP_TEST_DB_SCHEMA(ê¸°ë³¸ POPUP, ë¹ ê° = ì ì ê³ì  ì¤í¤ë§)
        config.setVariables(PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA)));
        config.setMapUnderscoreToCamelCase(true);
        config.setJdbcTypeForNull(JdbcType.NULL);
        for (String resource : List.of("mappers/popup/PopupMapper.xml", "mappers/popup/WpfPopupMapper.xml")) {
            try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
                assertNotNull(stream, resource);
                new XMLMapperBuilder(stream, config, resource, config.getSqlFragments()).parse();
            }
        }

        try (SqlSession session = new SqlSessionFactoryBuilder().build(config).openSession(false)) {
            try {
                PopupMapper popupMapper = session.getMapper(PopupMapper.class);
                WpfPopupMapper wpfMapper = session.getMapper(WpfPopupMapper.class);
                PopupService popupService = new PopupService(popupMapper, new ObjectMapper().findAndRegisterModules());
                WpfResultProcessor processor = new WpfResultProcessor(popupService, popupMapper, wpfMapper);
                WpfPopupService service = new WpfPopupService(popupService, popupMapper, wpfMapper, processor, new WpfPopupProps());

                // ---- 목록: 대상 조건(부서 하위 포함·직급·사번·입사일)이 SQL에서 판정된다 ----
                assertEquals(List.of("SAMPLE-TEXT-001", "SAMPLE-VIDEO-002", "SAMPLE-QUIZ-003", "SAMPLE-SURVEY-004"),
                        ids(service.getPopupsForUser("E1001")));
                assertEquals(List.of("SAMPLE-TEXT-001", "SAMPLE-VIDEO-002", "SAMPLE-SURVEY-004"),
                        ids(service.getPopupsForUser("E1002")));
                assertEquals(List.of("SAMPLE-TEXT-001", "SAMPLE-SURVEY-004"),
                        ids(service.getPopupsForUser("E1003")));
                assertThrows(WpfUserInactiveException.class, () -> service.getPopupsForUser("E9999"));

                WpfPopupListResponse list = service.getPopupsForUser("E1001");
                WpfPopupItem quiz = list.popups().stream().filter(p -> p.popupId().equals("SAMPLE-QUIZ-003")).findFirst().orElseThrow();
                assertEquals(1, quiz.questions().size(), "문항은 최상위 questions");
                assertFalse(quiz.content().containsKey("questions"));
                assertFalse(quiz.content().containsKey("passingScore"));
                assertNull(quiz.questions().get(0).correctAnswer());
                assertNull(quiz.questions().get(0).options().get(0).isCorrect(), "정답 비노출");
                assertEquals("보안 교육 확인", quiz.content().get("surveyTitle"));
                WpfPopupItem text = list.popups().get(0);
                assertEquals("9월 21일(일) 02:00~06:00 점검 예정입니다.", text.content().get("plainText"));
                assertEquals(true, text.content().get("showHighlight"), "CONTENT_OPTIONS JSON 병합");
                assertEquals(7, text.hideDays());
                assertNotNull(text.displayStartAt());
                assertEquals(9 * 3600, text.displayStartAt().getOffset().getTotalSeconds(), "FROM_TZ → +09:00");

                long quizQuestionId = quiz.questions().get(0).questionId();
                long yesOptionId = quiz.questions().get(0).options().stream()
                        .filter(o -> o.value().equals("YES")).findFirst().orElseThrow().optionId();
                WpfPopupItem survey = list.popups().stream().filter(p -> p.popupId().equals("SAMPLE-SURVEY-004")).findFirst().orElseThrow();
                long surveyChoiceQ = survey.questions().get(0).questionId();
                long surveyTextQ = survey.questions().get(1).questionId();
                List<Long> surveyOptionIds = survey.questions().get(0).options().stream().map(o -> o.optionId()).toList();

                OffsetDateTime displayedAt = OffsetDateTime.parse("2026-09-19T09:00:05+09:00");
                OffsetDateTime closedAt = OffsetDateTime.parse("2026-09-19T09:03:10+09:00");

                // ---- 결과: HIDDEN / SUBMITTED(QUIZ 정답·SURVEY) / VIDEO_WATCHED / CLOSED + 중복 ----
                String hiddenId = UUID.randomUUID().toString();
                WpfResultCommand hidden = new WpfResultCommand(hiddenId, "SAMPLE-TEXT-001", WpfResultType.HIDDEN,
                        displayedAt, closedAt, 7, null, null, null);
                WpfResultCommand quizSubmit = new WpfResultCommand(UUID.randomUUID().toString(), "SAMPLE-QUIZ-003",
                        WpfResultType.SUBMITTED, displayedAt, closedAt, null, displayedAt,
                        List.of(new PopupSubmitAnswer(quizQuestionId, null, List.of(yesOptionId))), null);
                WpfResultCommand surveySubmit = new WpfResultCommand(UUID.randomUUID().toString(), "SAMPLE-SURVEY-004",
                        WpfResultType.SUBMITTED, displayedAt, closedAt, null, null,
                        List.of(new PopupSubmitAnswer(surveyChoiceQ, null, surveyOptionIds),
                                new PopupSubmitAnswer(surveyTextQ, "회의실 예약 개선", List.of())), null);
                WpfResultCommand video = new WpfResultCommand(UUID.randomUUID().toString(), "SAMPLE-VIDEO-002",
                        WpfResultType.VIDEO_WATCHED, displayedAt, closedAt, null, null, null,
                        new WpfVideoProgress(new BigDecimal("540"), new BigDecimal("540"), new BigDecimal("540"), new BigDecimal("531.5")));
                WpfResultCommand notEligible = new WpfResultCommand(UUID.randomUUID().toString(), "SAMPLE-QUIZ-003",
                        WpfResultType.CLOSED, null, null, null, null, null, null);

                WpfResultResponse response = service.processResults("E1001", List.of(hidden, quizSubmit, surveySubmit, video, hidden));
                assertEquals(5, response.results().size());

                WpfResultItemResponse r0 = response.results().get(0);
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, r0.status());
                assertEquals("HIDDEN", r0.popupStatus());
                assertNotNull(r0.hiddenUntil());
                assertTrue(r0.hiddenUntil().isAfter(OffsetDateTime.now().plusDays(6)));

                WpfResultItemResponse r1 = response.results().get(1);
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, r1.status(), r1.message());
                assertEquals(10.0, r1.totalScore());
                assertEquals(Boolean.TRUE, r1.passed());
                assertEquals(Boolean.TRUE, r1.completed());
                assertNotNull(r1.responseId());

                WpfResultItemResponse r2 = response.results().get(2);
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, r2.status(), r2.message());
                assertNull(r2.totalScore(), "SURVEY는 채점 결과 없음");
                assertEquals(Boolean.TRUE, r2.completed(), "SURVEY는 제출 즉시 완료");

                WpfResultItemResponse r3 = response.results().get(3);
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, r3.status(), r3.message());
                assertEquals(0.9842, r3.watchedRatio());
                assertEquals(0.9, r3.requiredRatio());
                assertEquals(Boolean.TRUE, r3.completed());

                assertEquals(WpfResultItemResponse.Status.DUPLICATE, response.results().get(4).status(), "같은 resultId 재전송");

                // 표시·닫기 정보가 반영됐다 (mergeDisplayAndClose)
                var status = wpfMapper.selectStatus("E1001", "SAMPLE-TEXT-001");
                assertEquals("HIDDEN", status.popupStatus());

                // ---- 완료·숨김 팝업은 다음 목록에서 제외된다 (기준 2) ----
                assertEquals(List.of(), ids(service.getPopupsForUser("E1001")));
                // 기존 WPF-01 계약(완료 제외 없음)은 숨김만 제외한다
                assertEquals(List.of("SAMPLE-VIDEO-002", "SAMPLE-QUIZ-003", "SAMPLE-SURVEY-004"),
                        popupMapper.selectAvailablePopups("E1001").stream().map(p -> p.popupId()).toList());

                // 대상 아님(E1003은 QUIZ 대상이 아님): CLOSED는 활성 사용자·팝업만 확인하므로 ACCEPTED,
                // SUBMITTED는 노출 자격 재검사로 REJECTED
                WpfResultResponse other = service.processResults("E1003", List.of(notEligible,
                        new WpfResultCommand(UUID.randomUUID().toString(), "SAMPLE-QUIZ-003", WpfResultType.SUBMITTED,
                                null, null, null, null, List.of(new PopupSubmitAnswer(quizQuestionId, null, List.of(yesOptionId))), null)));
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, other.results().get(0).status());
                assertEquals(WpfResultItemResponse.Status.REJECTED, other.results().get(1).status());
                assertEquals("WPF_NOT_ELIGIBLE", other.results().get(1).code());

                // 요청 로그
                service.logRequest("test-req", "E1001", "/p/api/wpf/popups/results", "POST", "127.0.0.1",
                        OffsetDateTime.now(), 200, true, "items=5", "accepted=4");
            } finally {
                session.rollback(true);
            }
        }
    }

    private static List<String> ids(WpfPopupListResponse response) {
        return response.popups().stream().map(WpfPopupItem::popupId).toList();
    }
}
