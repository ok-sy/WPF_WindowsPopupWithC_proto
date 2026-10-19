package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.mapping.Environment;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.apache.ibatis.datasource.unpooled.UnpooledDataSource;
import org.apache.ibatis.transaction.jdbc.JdbcTransactionFactory;
import org.junit.jupiter.api.Test;
import server.domain.popup.*;
import server.domain.popup.wpf.WpfPopupItem;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.PopupSchema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class PopupQuestionDatabaseTest {
    private static final com.fasterxml.jackson.core.type.TypeReference<List<Object>> RICH_TEXT = new com.fasterxml.jackson.core.type.TypeReference<>() { };

    @Test void editorRoundTripGradingAndHistoricalAnswers() throws Exception {
        try (var session = openSession()) {
            try {
                var mapper = session.getMapper(PopupMapper.class);
                var json = new ObjectMapper().findAndRegisterModules();
                var service = new PopupService(mapper, json);
                var source = service.getAdminPopup("SAMPLE-SURVEY-004");
                ObjectNode draft = json.valueToTree(source);
                String popupId = "TEST-" + UUID.randomUUID();
                draft.put("popupId", popupId).put("popupType", "QUIZ").put("title", "문항 편집 검증")
                        .put("displayMode", "SEQUENTIAL").put("passingScore", 30)
                        .put("displayStartAt", OffsetDateTime.now().minusDays(1).toString())
                        .put("displayEndAt", OffsetDateTime.now().plusDays(1).toString());
                var exact = new PopupQuestionDto(-1L, "정확히 일치", null, "TEXT", true, true,
                        BigDecimal.TEN, 1, List.of(), "Windows + L", "EXACT", "VERTICAL");
                var contains = new PopupQuestionDto(-2L, "포함", null, "TEXT", true, true,
                        BigDecimal.TEN, 2, List.of(), "보안", "CONTAINS", "VERTICAL");
                var choice = new PopupQuestionDto(-3L, "객관식", null, "SINGLE_CHOICE", true, true,
                        BigDecimal.TEN, 3, List.of(new PopupOptionDto(-1L, "1", "정답", 1, true),
                        new PopupOptionDto(-2L, "2", "오답", 2, false)), null, null, "HORIZONTAL");
                draft.set("questions", json.valueToTree(List.of(exact, contains, choice)));
                var targets = List.of(new AdminPopupTargetGroup("테스트", "롤백", List.of(
                        new AdminPopupTargetCondition("EMPLOYEE", "=", "E1001", false))));
                var saved = service.saveAdminPopup(json.treeToValue(draft, PopupResponseDto.class), true, targets, "SYSTEM");
                assertEquals(3, saved.questions().size());
                assertEquals("VERTICAL", saved.questions().get(0).optionLayout());
                assertEquals("HORIZONTAL", saved.questions().get(2).optionLayout());
                assertNotEquals(source.questionTemplateId(), saved.questionTemplateId());
                assertEquals("Windows + L", saved.questions().get(0).correctAnswer());
                assertEquals("CONTAINS", saved.questions().get(1).answerMatchMode());
                assertTrue(saved.questions().get(2).options().get(0).isCorrect());
                assertEquals(saved.questionTemplateId(), service.saveAdminPopup(saved, true, targets, "SYSTEM").questionTemplateId());
                // [설계 18 L-0] 구 WPF-01 getPopups 삭제. 노출 대상 포함은 매퍼로, 정답 제거는 비QUIZ WPF 경로의 withoutAnswerKey로 확인한다.
                assertTrue(mapper.selectAvailablePopups("E1001", false).stream().anyMatch(p -> popupId.equals(p.popupId())));
                String publicJson = json.writeValueAsString(WpfPopupItem.withoutAnswerKey(saved.questions()));
                assertFalse(publicJson.contains("correctAnswer"));
                assertFalse(publicJson.contains("answerMatchMode"));
                assertFalse(publicJson.contains("isCorrect"));
                var questions = saved.questions();
                var second = new PopupSubmitAnswer(questions.get(1).questionId(), "정보보안을 지킵니다", List.of());
                var third = new PopupSubmitAnswer(questions.get(2).questionId(), null, List.of(questions.get(2).options().get(0).optionId()));
                assertThrows(IllegalArgumentException.class, () -> service.submitResponse(popupId, UUID.randomUUID().toString(), "E1001", List.of(second, third), 20.0, false));
                var failed = service.submitResponse(popupId, UUID.randomUUID().toString(), "E1001",
                        List.of(new PopupSubmitAnswer(questions.get(0).questionId(), "Windows + L 누르기", List.of()), second, third), 20.0, false);
                assertEquals(20.0, failed.totalScore());
                assertFalse(failed.passed());
                var passed = service.submitResponse(popupId, UUID.randomUUID().toString(), "E1001",
                        List.of(new PopupSubmitAnswer(questions.get(0).questionId(), " Windows + L ", List.of()), second, third), 30.0, true);
                assertEquals(30.0, passed.totalScore());
                assertTrue(passed.passed());
                ObjectNode edited = json.valueToTree(saved);
                ((ObjectNode) edited.get("questions").get(0)).put("correctAnswer", "새 정답");
                var updated = service.saveAdminPopup(json.treeToValue(edited, PopupResponseDto.class), true, targets, "SYSTEM");
                assertNotEquals(saved.questionTemplateId(), updated.questionTemplateId());
                assertEquals(3, mapper.selectQuestionsByTemplateIds(List.of(saved.questionTemplateId())).size());
                assertEquals(source.questions(), service.getAdminPopup("SAMPLE-SURVEY-004").questions());
            } finally {
                session.rollback(true);
            }
        }
    }

    /**
     * [TODO55-4] 문항·선택지 서식(TITLE_BLOCKS·TEXT_BLOCKS CLOB)과 콘텐츠 제목 서식(CONTENT_OPTIONS)을 실DB에 저장·재조회한다.
     * 17_question_rich_text_oracle.sql 적용이 필요하다. 롤백 전용.
     */
    @Test void surveyRichTextRoundTrip() throws Exception {
        try (var session = openSession()) {
            try {
                var mapper = session.getMapper(PopupMapper.class);
                var json = new ObjectMapper().findAndRegisterModules();
                var service = new PopupService(mapper, json);
                ObjectNode draft = json.valueToTree(service.getAdminPopup("SAMPLE-SURVEY-004"));
                String popupId = "TEST-" + UUID.randomUUID();
                draft.put("popupId", popupId).put("popupType", "SURVEY").put("title", "서식 저장 검증")
                        .put("displayMode", "SEQUENTIAL")
                        .put("displayStartAt", OffsetDateTime.now().minusDays(1).toString())
                        .put("displayEndAt", OffsetDateTime.now().plusDays(1).toString());
                List<Object> titleBlocks = json.readValue("""
                        [{"alignment":"LEFT","runs":[{"text":"교육 ","size":16},{"text":"만족도","bold":true,"color":"#C00000"}]},
                         {"alignment":"CENTER","indent":1,"runs":[{"text":"둘째 줄","italic":true}]}]""", RICH_TEXT);
                List<Object> optionBlocks = json.readValue("""
                        [{"alignment":"LEFT","runs":[{"text":"매우 ","font":"GULIM"},{"text":"그렇다","underline":true}]}]""", RICH_TEXT);
                var formatted = new PopupQuestionDto(-1L, "client", null, "SINGLE_CHOICE", true, false, null, 1,
                        List.of(new PopupOptionDto(-1L, "1", "stale", 1, false, optionBlocks),
                                new PopupOptionDto(-2L, "2", "아니다", 2, false, null)),
                        null, null, "VERTICAL", titleBlocks, null);
                draft.set("questions", json.valueToTree(List.of(formatted)));
                ((ObjectNode) draft.get("content")).set("surveyTitleBlocks", json.valueToTree(optionBlocks));
                var targets = List.of(new AdminPopupTargetGroup("테스트", "롤백", List.of(
                        new AdminPopupTargetCondition("EMPLOYEE", "=", "E1001", false))));
                var saved = service.saveAdminPopup(json.treeToValue(draft, PopupResponseDto.class), true, targets, "SYSTEM");
                var question = saved.questions().get(0);
                assertEquals("교육 만족도\n둘째 줄", question.title());
                assertEquals(json.valueToTree(titleBlocks), json.valueToTree(question.titleBlocks()));
                assertNull(question.descriptionBlocks());
                assertEquals("매우 그렇다", question.options().get(0).text());
                assertEquals(json.valueToTree(optionBlocks), json.valueToTree(question.options().get(0).textBlocks()));
                assertNull(question.options().get(1).textBlocks());
                assertEquals("매우 그렇다", saved.content().get("surveyTitle"));
                assertEquals(json.valueToTree(optionBlocks), json.valueToTree(saved.content().get("surveyTitleBlocks")));
                // 재조회 값 그대로 다시 저장하면 템플릿을 재사용한다.
                assertEquals(saved.questionTemplateId(), service.saveAdminPopup(saved, true, targets, "SYSTEM").questionTemplateId());
                // WPF 응답에도 서식이 실린다(정답 키 제거 사본).
                String publicJson = json.writeValueAsString(WpfPopupItem.withoutAnswerKey(saved.questions()));
                assertTrue(publicJson.contains("\"titleBlocks\"") && publicJson.contains("\"textBlocks\""), publicJson);
            } finally {
                session.rollback(true);
            }
        }
    }

    private org.apache.ibatis.session.SqlSession openSession() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the rollback-only database test.");
        // [Oracle 전환 — 기준 5] 롤백 전용 실DB 테스트. 대상 DB를 PostgreSQL popup_db에서 Oracle POPUP 스키마로 바꾼다.
        // 샘플(db/oracle/02_popup_sample_oracle.sql)의 SAMPLE-SURVEY-004 / E1001을 사용한다.
        var dataSource = new UnpooledDataSource("oracle.jdbc.OracleDriver",
                System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"),
                System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"), password);
        var config = new Configuration(new Environment("test", new JdbcTransactionFactory(), dataSource));
        // [스키마 분리 설정화] 매퍼의 ${popupSchemaPrefix} 변수. 환경변수 POPUP_TEST_DB_SCHEMA(기본 POPUP, 빈 값 = 접속 계정 스키마)
        config.setVariables(PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA)));
        config.setMapUnderscoreToCamelCase(true);
        // 운영 mybatis-config.xml과 동일: Oracle은 NULL 바인드에 JdbcType.OTHER(1111)를 거부(ORA-17004)하므로 NULL로 지정한다.
        config.setJdbcTypeForNull(org.apache.ibatis.type.JdbcType.NULL);
        String resource = "mappers/popup/PopupMapper.xml";
        try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
            assertNotNull(stream);
            new XMLMapperBuilder(stream, config, resource, config.getSqlFragments()).parse();
        }
        return new SqlSessionFactoryBuilder().build(config).openSession(false);
    }
}
