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
import server.repo.core.mapper.popup.PopupMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class PopupQuestionDatabaseTest {
    @Test void editorRoundTripGradingAndHistoricalAnswers() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the rollback-only database test.");
        var dataSource = new UnpooledDataSource("org.postgresql.Driver",
                System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:postgresql://localhost:5432/popup_db"),
                System.getenv().getOrDefault("POPUP_TEST_DB_USER", "postgres"), password);
        var config = new Configuration(new Environment("test", new JdbcTransactionFactory(), dataSource));
        config.setMapUnderscoreToCamelCase(true);
        String resource = "mappers/popup/PopupMapper.xml";
        try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
            assertNotNull(stream);
            new XMLMapperBuilder(stream, config, resource, config.getSqlFragments()).parse();
        }
        try (var session = new SqlSessionFactoryBuilder().build(config).openSession(false)) {
            try {
                var mapper = session.getMapper(PopupMapper.class);
                var json = new ObjectMapper().findAndRegisterModules();
                var service = new PopupService(mapper, json);
                var source = service.getAdminPopup("SAMPLE-SURVEY-001");
                ObjectNode draft = json.valueToTree(source);
                String popupId = "TEST-" + UUID.randomUUID();
                draft.put("popupId", popupId).put("popupType", "QUIZ").put("title", "문항 편집 검증")
                        .put("displayMode", "SEQUENTIAL").put("passingScore", 30)
                        .put("displayStartAt", OffsetDateTime.now().minusDays(1).toString())
                        .put("displayEndAt", OffsetDateTime.now().plusDays(1).toString());
                var exact = new PopupQuestionDto(-1L, "정확히 일치", null, "TEXT", true, true,
                        BigDecimal.TEN, 1, List.of(), "Windows + L", "EXACT");
                var contains = new PopupQuestionDto(-2L, "포함", null, "TEXT", true, true,
                        BigDecimal.TEN, 2, List.of(), "보안", "CONTAINS");
                var choice = new PopupQuestionDto(-3L, "객관식", null, "SINGLE_CHOICE", true, true,
                        BigDecimal.TEN, 3, List.of(new PopupOptionDto(-1L, "1", "정답", 1, true),
                        new PopupOptionDto(-2L, "2", "오답", 2, false)), null, null);
                draft.set("questions", json.valueToTree(List.of(exact, contains, choice)));
                var targets = List.of(new AdminPopupTargetGroup("테스트", "롤백", List.of(
                        new AdminPopupTargetCondition("EMPLOYEE", "=", "E1001", false))));
                var saved = service.saveAdminPopup(json.treeToValue(draft, PopupResponseDto.class), true, targets, "SYSTEM");
                assertEquals(3, saved.questions().size());
                assertNotEquals(source.questionTemplateId(), saved.questionTemplateId());
                assertEquals("Windows + L", saved.questions().get(0).correctAnswer());
                assertEquals("CONTAINS", saved.questions().get(1).answerMatchMode());
                assertTrue(saved.questions().get(2).options().get(0).isCorrect());
                assertEquals(saved.questionTemplateId(), service.saveAdminPopup(saved, true, targets, "SYSTEM").questionTemplateId());
                var publicPopup = service.getPopups("E1001").stream().filter(p -> popupId.equals(p.popupId())).findFirst().orElseThrow();
                String publicJson = json.writeValueAsString(publicPopup);
                assertFalse(publicJson.contains("correctAnswer"));
                assertFalse(publicJson.contains("answerMatchMode"));
                assertFalse(publicJson.contains("isCorrect"));
                var questions = saved.questions();
                var second = new PopupSubmitAnswer(questions.get(1).questionId(), "정보보안을 지킵니다", List.of());
                var third = new PopupSubmitAnswer(questions.get(2).questionId(), null, List.of(questions.get(2).options().get(0).optionId()));
                assertThrows(IllegalArgumentException.class, () -> service.submitResponse(popupId, UUID.randomUUID().toString(), "E1001", null, List.of(second, third)));
                var failed = service.submitResponse(popupId, UUID.randomUUID().toString(), "E1001", null,
                        List.of(new PopupSubmitAnswer(questions.get(0).questionId(), "Windows + L 누르기", List.of()), second, third));
                assertEquals(20.0, failed.totalScore());
                assertFalse(failed.passed());
                var passed = service.submitResponse(popupId, UUID.randomUUID().toString(), "E1001", null,
                        List.of(new PopupSubmitAnswer(questions.get(0).questionId(), " Windows + L ", List.of()), second, third));
                assertEquals(30.0, passed.totalScore());
                assertTrue(passed.passed());
                ObjectNode edited = json.valueToTree(saved);
                ((ObjectNode) edited.get("questions").get(0)).put("correctAnswer", "새 정답");
                var updated = service.saveAdminPopup(json.treeToValue(edited, PopupResponseDto.class), true, targets, "SYSTEM");
                assertNotEquals(saved.questionTemplateId(), updated.questionTemplateId());
                assertEquals(3, mapper.selectQuestionsByTemplateIds(List.of(saved.questionTemplateId())).size());
                assertEquals(source.questions(), service.getAdminPopup("SAMPLE-SURVEY-001").questions());
            } finally {
                session.rollback(true);
            }
        }
    }
}
