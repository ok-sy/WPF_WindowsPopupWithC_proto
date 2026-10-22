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

/**
 * POL-13-01 : 콘텐츠와 관리 상태
 * POL-16-02 : 재현 가능한 검증
 * ■ 문항·서식·노출 일정 Oracle 실DB 저장·재조회 테스트(롤백 전용)
 * - POPUP_TEST_DB_PASSWORD가 없으면 건너뛴다. 관리자 저장·채점·후보 SQL을 실DB에서 확인한다.
 */
class PopupQuestionDatabaseTest {
    private static final com.fasterxml.jackson.core.type.TypeReference<List<Object>> RICH_TEXT = new com.fasterxml.jackson.core.type.TypeReference<>() { };

    /** 관리자 편집 저장·재조회·채점과 과거 답안 보존을 실DB로 확인한다. */
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
                // POL-09-01 : 3 API 순서 — 구 WPF-01 getPopups 삭제. 노출 대상 포함은 매퍼로, 정답 제거는 비QUIZ WPF 경로의 withoutAnswerKey로 확인한다.
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
     * POL-06-01 : 문항·서식 — 문항·선택지 서식(TITLE_BLOCKS·TEXT_BLOCKS CLOB)과 콘텐츠 제목 서식(CONTENT_OPTIONS)을 실DB에 저장·재조회한다.
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

    /**
     * POL-03-02 : 문단·글자 서식
     * POL-06-02 : 선택·제출
     * 6단계 이상 들여쓰기(TEXT 본문·문항 서식)와 QUIZ 복수 선택 정답 2개를 실DB에 저장·재조회한다.
     * WPF는 정답 수(isCorrect=true)로 선택 한도를 계산하므로 QUIZ 정답 키가 재조회 후에도 그대로인지 확인한다. 롤백 전용.
     */
    @Test void deepIndentAndMultipleChoiceAnswerCountRoundTrip() throws Exception {
        try (var session = openSession()) {
            try {
                var mapper = session.getMapper(PopupMapper.class);
                var json = new ObjectMapper().findAndRegisterModules();
                var service = new PopupService(mapper, json);
                var targets = List.of(new AdminPopupTargetGroup("테스트", "롤백", List.of(
                        new AdminPopupTargetCondition("EMPLOYEE", "=", "E1001", false))));
                ObjectNode base = json.valueToTree(service.getAdminPopup("SAMPLE-SURVEY-004"));
                base.put("displayMode", "SEQUENTIAL")
                        .put("displayStartAt", OffsetDateTime.now().minusDays(1).toString())
                        .put("displayEndAt", OffsetDateTime.now().plusDays(1).toString());

                // TEXT 본문 11단계(440px) 들여쓰기
                ObjectNode text = base.deepCopy();
                text.put("popupId", "TEST-" + UUID.randomUUID()).put("popupType", "TEXT").put("title", "들여쓰기 검증")
                        .putNull("passingScore").set("questions", json.createArrayNode());
                List<Object> textBlocks = json.readValue("""
                        [{"alignment":"LEFT","indent":6,"runs":[{"text":"여섯"}]},{"alignment":"LEFT","indent":11,"runs":[{"text":"열하나"}]}]""", RICH_TEXT);
                ObjectNode textContent = json.createObjectNode();
                textContent.put("plainText", "client").put("showPlainText", true).set("textBlocks", json.valueToTree(textBlocks));
                text.set("content", textContent);
                var savedText = service.saveAdminPopup(json.treeToValue(text, PopupResponseDto.class), true, targets, "SYSTEM");
                var reloadedText = service.getAdminPopup(savedText.popupId());
                assertEquals(json.valueToTree(textBlocks), json.valueToTree(reloadedText.content().get("textBlocks")));
                assertEquals("여섯\n열하나", reloadedText.content().get("plainText"));

                // QUIZ 복수 선택 정답 2개 + 문항 제목 7단계 들여쓰기
                ObjectNode quiz = base.deepCopy();
                quiz.put("popupId", "TEST-" + UUID.randomUUID()).put("popupType", "QUIZ").put("title", "정답 수 검증").put("passingScore", 10);
                List<Object> titleBlocks = json.readValue("""
                        [{"alignment":"LEFT","indent":7,"runs":[{"text":"모두 고르세요"}]}]""", RICH_TEXT);
                var multiple = new PopupQuestionDto(-1L, "client", null, "MULTIPLE_CHOICE", true, true, BigDecimal.TEN, 1,
                        List.of(new PopupOptionDto(-1L, "1", "가", 1, true), new PopupOptionDto(-2L, "2", "나", 2, false),
                                new PopupOptionDto(-3L, "3", "다", 3, true), new PopupOptionDto(-4L, "4", "라", 4, false)),
                        null, null, "VERTICAL", titleBlocks, null);
                quiz.set("questions", json.valueToTree(List.of(multiple)));
                var savedQuiz = service.saveAdminPopup(json.treeToValue(quiz, PopupResponseDto.class), true, targets, "SYSTEM");
                var question = service.getAdminPopup(savedQuiz.popupId()).questions().get(0);
                assertEquals(json.valueToTree(titleBlocks), json.valueToTree(question.titleBlocks()));
                assertEquals(2, question.options().stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count());
                // WPF QUIZ 응답(정답 키 포함 문항)에도 정답 2개가 그대로 실린다.
                var answerKeyed = service.loadQuestionsWithAnswerKey(List.of(savedQuiz.questionTemplateId())).get(savedQuiz.questionTemplateId());
                assertEquals(2, answerKeyed.get(0).options().stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count());
            } finally {
                session.rollback(true);
            }
        }
    }

    /**
     * POL-11-03 : 시간 경계 — 노출 일정(요일·시간대, 자정 초과 포함)을 실DB에 저장·재조회하고, WPF 후보 SQL이 KST 현재 시각 기준으로
     * 같은 규칙(Java 기준 판단과 비교)으로 거르는지 확인한다. 시간대 경계는 현재 시각에서 30분 이상 떨어지게 잡는다.
     * 18_popup_display_time_oracle.sql 적용이 필요하다. 롤백 전용.
     */
    @Test void displayScheduleRoundTripAndCandidateFilter() throws Exception {
        try (var session = openSession()) {
            try {
                var mapper = session.getMapper(PopupMapper.class);
                var json = new ObjectMapper().findAndRegisterModules();
                var service = new PopupService(mapper, json);
                var targets = List.of(new AdminPopupTargetGroup("테스트", "롤백", List.of(
                        new AdminPopupTargetCondition("EMPLOYEE", "=", "E1001", false))));
                ObjectNode base = json.valueToTree(service.getAdminPopup("SAMPLE-SURVEY-004"));
                base.put("popupType", "TEXT").put("title", "일정 검증").put("displayMode", "SEQUENTIAL").putNull("passingScore")
                        .put("displayStartAt", OffsetDateTime.now().minusDays(2).toString())
                        .put("displayEndAt", OffsetDateTime.now().plusDays(2).toString())
                        .set("questions", json.createArrayNode());
                ObjectNode content = json.createObjectNode();
                content.put("plainText", "일정").put("showPlainText", true);
                base.set("content", content);

                var now = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Seoul"));
                int minute = now.getHour() * 60 + now.getMinute();
                int today = now.getDayOfWeek().getValue();
                int yesterday = (today + 5) % 7 + 1;
                int other = today % 7 + 1 == yesterday ? (today + 2) % 7 + 1 : today % 7 + 1;
                java.util.function.IntFunction<String> at = offset -> PopupDisplaySchedule.toTime(Math.floorMod(minute + offset, 1440));
                List<List<String>> windows = List.of(
                        List.of(), List.of(at.apply(-60), at.apply(60)), List.of(at.apply(60), at.apply(120)),
                        List.of(at.apply(-30), at.apply(-60)), List.of(at.apply(60), at.apply(30)));
                java.util.List<String> days = new java.util.ArrayList<>(java.util.Arrays.asList(null, String.valueOf(today),
                        String.valueOf(yesterday), String.valueOf(other)));
                int checked = 0;
                for (List<String> window : windows) {
                    for (String day : days) {
                        ObjectNode draft = base.deepCopy();
                        String popupId = "TEST-" + UUID.randomUUID();
                        draft.put("popupId", popupId).put("periodMode", "SCHEDULE");
                        if (day == null) draft.putNull("repeatDayOfWeek"); else draft.put("repeatDayOfWeek", day);
                        var times = json.createArrayNode();
                        if (!window.isEmpty()) times.addObject().put("startTime", window.get(0)).put("endTime", window.get(1));
                        draft.set("displayTimes", times);
                        var saved = service.saveAdminPopup(json.treeToValue(draft, PopupResponseDto.class), true, targets, "SYSTEM");
                        assertEquals("SCHEDULE", saved.periodMode());
                        assertEquals(day, saved.repeatDayOfWeek());
                        assertEquals(window.isEmpty() ? List.of() : List.of(new PopupDisplayTimeDto(window.get(0), window.get(1))), saved.displayTimes());
                        boolean expected = expectedVisible(minute, today, yesterday, day, window);
                        boolean actual = mapper.selectAvailablePopups("E1001", true).stream().anyMatch(p -> popupId.equals(p.popupId()));
                        assertEquals(expected, actual, "window=" + window + " day=" + day + " now=" + now);
                        // 답안 제출 재검증(excludeCompleted=false)은 일정과 무관하다.
                        assertTrue(mapper.selectAvailablePopups("E1001", false).stream().anyMatch(p -> popupId.equals(p.popupId())));
                        checked++;
                    }
                }
                assertEquals(20, checked);

                // FIXED로 바꾸면 요일·시간대를 비우고 게시 기간 내 상시 노출한다.
                ObjectNode fixed = base.deepCopy();
                String fixedId = "TEST-" + UUID.randomUUID();
                fixed.put("popupId", fixedId).put("periodMode", "SCHEDULE").put("repeatDayOfWeek", String.valueOf(other));
                fixed.set("displayTimes", json.createArrayNode().add(json.createObjectNode().put("startTime", at.apply(60)).put("endTime", at.apply(120))));
                var scheduled = service.saveAdminPopup(json.treeToValue(fixed, PopupResponseDto.class), true, targets, "SYSTEM");
                assertFalse(mapper.selectAvailablePopups("E1001", true).stream().anyMatch(p -> fixedId.equals(p.popupId())));
                var listed = mapper.selectAdminPopups().stream().filter(p -> fixedId.equals(p.popupId())).findFirst().orElseThrow();
                assertEquals(at.apply(60) + "~" + at.apply(120), listed.displayTimesText());
                assertEquals(String.valueOf(other), listed.repeatDayOfWeek());
                ObjectNode toFixed = json.valueToTree(scheduled);
                toFixed.put("periodMode", "FIXED");
                var savedFixed = service.saveAdminPopup(json.treeToValue(toFixed, PopupResponseDto.class), true, targets, "SYSTEM");
                assertEquals("FIXED", savedFixed.periodMode());
                assertNull(savedFixed.repeatDayOfWeek());
                assertTrue(savedFixed.displayTimes().isEmpty());
                assertTrue(mapper.selectDisplayTimes(fixedId).isEmpty());
                assertTrue(mapper.selectAvailablePopups("E1001", true).stream().anyMatch(p -> fixedId.equals(p.popupId())));
            } finally {
                session.rollback(true);
            }
        }
    }

    /** POL-11-03 : 시간 경계 — 서버 SQL과 같은 규칙의 Java 기준 판단. 자정 초과 시간대의 자정 이후 부분은 어제 요일로 본다. */
    private static boolean expectedVisible(int minute, int today, int yesterday, String days, List<String> window) {
        java.util.function.IntPredicate dayOk = d -> days == null || java.util.Arrays.asList(days.split(",")).contains(String.valueOf(d));
        if (window.isEmpty()) return dayOk.test(today);
        int start = PopupDisplaySchedule.toMinute(window.get(0));
        int end = PopupDisplaySchedule.toMinute(window.get(1));
        if (start < end) return minute >= start && minute < end && dayOk.test(today);
        return (minute >= start && dayOk.test(today)) || (minute < end && dayOk.test(yesterday));
    }

    /** 롤백 전용 Oracle 테스트 세션을 연다(환경변수로 접속 정보 지정). */
    private org.apache.ibatis.session.SqlSession openSession() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the rollback-only database test.");
        // POL-13-01 : 콘텐츠와 관리 상태 — 롤백 전용 실DB 테스트. 대상 DB를 PostgreSQL popup_db에서 Oracle POPUP 스키마로 바꾼다.
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
