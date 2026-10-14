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
import server.domain.popup.AdminPopupTargetCondition;
import server.domain.popup.PopupOptionEntity;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.wpf.WpfPopupItem;
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
import java.sql.Savepoint;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * [설계 47-3·47-4] 게시중단 전에 전달한 팝업의 결과 수용을 Oracle 실DB(db/oracle/01·02 샘플 적용)로 검증하는 롤백 전용 테스트.
 * POPUP_TEST_DB_PASSWORD가 있을 때만 실행된다.
 *
 * <p>게시중단 방식(활성 해제·기간 종료·대상 변경) × 결과 유형(CLOSED·HIDDEN·SUBMITTED(SURVEY·QUIZ)·VIDEO_WATCHED)마다
 * (1) 게시 중 OPEN 전달 건 발급 → (2) 게시중단 → (3) 재조회로 그 전달 건이 EXPIRED가 되고 다른 후보가 발급되는지 →
 * (4) EXPIRED 전달 건의 결과가 ACCEPTED로 저장되는지 확인한다. 경우마다 세이브포인트로 되돌리고 마지막에 전부 롤백한다.</p>
 */
class WpfDeliveredResultDatabaseTest {

    private static final String USER = "E1001";   // 샘플: TEXT, VIDEO, QUIZ, SURVEY 대상

    @FunctionalInterface
    private interface Unpublish {
        void apply(SqlSession session, PopupMapper mapper, String prefix, String popupId) throws Exception;
    }

    private static void execute(SqlSession session, String sql, String popupId) throws Exception {
        try (var statement = session.getConnection().prepareStatement(sql)) {
            statement.setString(1, popupId);
            assertEquals(1, statement.executeUpdate(), sql);
        }
    }

    private static String deliveryStatus(SqlSession session, String prefix, String deliveryId) throws Exception {
        try (var statement = session.getConnection().prepareStatement(
                "SELECT DELIVERY_STATUS FROM " + prefix + "WPF_POPUP_DELIVERY WHERE DELIVERY_ID = ?")) {
            statement.setString(1, deliveryId);
            try (var rs = statement.executeQuery()) {
                assertTrue(rs.next(), deliveryId);
                return rs.getString(1);
            }
        }
    }

    /** 설문·퀴즈 답안: 서술형은 텍스트, 선택형은 정답 선택지(없으면 첫 선택지) 1개. */
    private static List<PopupSubmitAnswer> answersFor(PopupMapper mapper, String popupId) {
        Long templateId = mapper.selectAdminPopupById(popupId).questionTemplateId();
        List<PopupQuestionEntity> questions = mapper.selectQuestionsByTemplateIds(List.of(templateId));
        List<PopupOptionEntity> options = mapper.selectOptionsByQuestionIds(
                questions.stream().map(PopupQuestionEntity::questionId).toList());
        return questions.stream().map(q -> {
            if ("TEXT".equalsIgnoreCase(q.questionType())) {
                return new PopupSubmitAnswer(q.questionId(), "게시중단 후 제출", List.of());
            }
            List<PopupOptionEntity> own = options.stream().filter(o -> o.questionId().equals(q.questionId())).toList();
            PopupOptionEntity chosen = own.stream().filter(o -> "Y".equals(o.correctYn())).findFirst().orElse(own.get(0));
            return new PopupSubmitAnswer(q.questionId(), null, List.of(chosen.optionId()));
        }).toList();
    }

    @Test void resultsOfDeliveriesExpiredByUnpublishAreAcceptedOnOracle() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the rollback-only database test.");
        var dataSource = new UnpooledDataSource("oracle.jdbc.OracleDriver",
                System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"),
                System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"), password);
        var config = new Configuration(new Environment("test", new JdbcTransactionFactory(), dataSource));
        String schema = System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA);
        config.setVariables(PopupSchema.variables(schema));
        config.setMapUnderscoreToCamelCase(true);
        config.setJdbcTypeForNull(JdbcType.NULL);
        for (String resource : List.of("mappers/popup/PopupMapper.xml", "mappers/popup/WpfPopupMapper.xml")) {
            try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
                assertNotNull(stream, resource);
                new XMLMapperBuilder(stream, config, resource, config.getSqlFragments()).parse();
            }
        }
        String prefix = PopupSchema.variables(schema).getProperty("popupSchemaPrefix");
        String nowKst = "CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)";

        Map<String, Unpublish> unpublishes = new LinkedHashMap<>();
        unpublishes.put("활성 해제", (s, m, p, id) ->
                execute(s, "UPDATE " + p + "POPUP_NOTICE SET ACTIVE_YN = 'N' WHERE POPUP_ID = ?", id));
        unpublishes.put("기간 종료", (s, m, p, id) ->
                execute(s, "UPDATE " + p + "POPUP_NOTICE SET DISPLAY_START_AT = " + nowKst + " - NUMTODSINTERVAL(2, 'DAY'), "
                        + "DISPLAY_END_AT = " + nowKst + " - NUMTODSINTERVAL(60, 'SECOND') WHERE POPUP_ID = ?", id));
        unpublishes.put("대상 변경", (s, m, p, id) -> {
            // 대상을 다른 사번(E1003) 1명으로 바꿔 USER는 더 이상 대상이 아니다
            m.deleteAdminPopupTargets(id);
            Long groupId = m.insertAdminTargetGroup(id, "대상 변경", "E1003 지정", 1, "TEST");
            m.insertAdminTargetCondition(groupId, new AdminPopupTargetCondition("EMPLOYEE", "=", "E1003", false), 1, "TEST");
        });

        try (SqlSession session = new SqlSessionFactoryBuilder().build(config).openSession(false)) {
            try {
                PopupMapper popupMapper = session.getMapper(PopupMapper.class);
                WpfPopupMapper wpfMapper = session.getMapper(WpfPopupMapper.class);
                PopupService popupService = new PopupService(popupMapper, new ObjectMapper().findAndRegisterModules());
                WpfPopupProps props = new WpfPopupProps();
                WpfResultProcessor processor = new WpfResultProcessor(popupService, popupMapper, wpfMapper, props);
                WpfPopupService service = new WpfPopupService(popupService, popupMapper, wpfMapper, processor, props);
                OffsetDateTime displayedAt = OffsetDateTime.parse("2026-09-19T09:00:05+09:00");
                OffsetDateTime closedAt = OffsetDateTime.parse("2026-09-19T09:03:10+09:00");

                List<PopupSubmitAnswer> surveyAnswers = answersFor(popupMapper, "SAMPLE-SURVEY-004");
                List<PopupSubmitAnswer> quizAnswers = answersFor(popupMapper, "SAMPLE-QUIZ-003");
                var fullWatch = new WpfVideoProgress(new BigDecimal("100"), new BigDecimal("100"),
                        new BigDecimal("100"), new BigDecimal("100"));
                record Case(String popupId, WpfResultType type, Integer hideDays, List<PopupSubmitAnswer> answers,
                            WpfVideoProgress video, Double score, Boolean passed) { }
                List<Case> cases = List.of(
                        new Case("SAMPLE-TEXT-001", WpfResultType.CLOSED, null, null, null, null, null),
                        new Case("SAMPLE-TEXT-001", WpfResultType.HIDDEN, 7, null, null, null, null),
                        new Case("SAMPLE-VIDEO-002", WpfResultType.CLOSED, null, null, null, null, null),
                        new Case("SAMPLE-VIDEO-002", WpfResultType.VIDEO_WATCHED, null, null, fullWatch, null, null),
                        new Case("SAMPLE-SURVEY-004", WpfResultType.SUBMITTED, null, surveyAnswers, null, null, null),
                        new Case("SAMPLE-QUIZ-003", WpfResultType.SUBMITTED, null, quizAnswers, null, 10.0, true));

                for (var unpublish : unpublishes.entrySet()) {
                    for (Case c : cases) {
                        String label = unpublish.getKey() + " / " + c.popupId() + " / " + c.type();
                        Savepoint savepoint = session.getConnection().setSavepoint();
                        try {
                            // (1) 게시 중 발급된 OPEN 전달 건 (기존 OPEN 건은 먼저 종료 — 사용자당 1건)
                            var existing = wpfMapper.selectOpenDelivery(USER);
                            if (existing != null) wpfMapper.expireDelivery(existing.deliveryId());
                            String deliveryId = UUID.randomUUID().toString();
                            wpfMapper.insertDelivery(deliveryId, USER, c.popupId());

                            // (2) 게시중단 (원시 JDBC 변경은 MyBatis 로컬 캐시를 비우지 않으므로 직접 비운다)
                            unpublish.getValue().apply(session, popupMapper, prefix, c.popupId());
                            session.clearCache();

                            // (3) [47-3] 재조회: 그 전달 건은 EXPIRED, 같은 팝업은 다시 발급되지 않는다
                            WpfPopupItem next = service.getNextPopup(USER).popup();
                            assertTrue(next == null || !next.popupId().equals(c.popupId()), label + " 재조회 제외");
                            assertEquals("EXPIRED", deliveryStatus(session, prefix, deliveryId), label);

                            // (4) [47-4] EXPIRED 전달 건의 결과 수용
                            WpfResultResponse res = service.processResult(USER, new WpfResultCommand(
                                    UUID.randomUUID().toString(), deliveryId, c.popupId(), c.type(), displayedAt, closedAt,
                                    c.hideDays(), c.answers(), c.video(), c.score(), c.passed()));
                            assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status(), label + " " + res.code() + " " + res.message());
                            assertNotNull(res.nextStatus(), label + " nextStatus는 신규 조회 조건으로 계산");
                            assertEquals("DONE", deliveryStatus(session, prefix, deliveryId), label);
                            var status = wpfMapper.selectStatus(USER, c.popupId());
                            switch (c.type()) {
                                case HIDDEN -> assertEquals("HIDDEN", status.popupStatus(), label);
                                case CLOSED -> {
                                    // 일반 안내 닫기는 완료. 영상 미완료 닫기는 완료로 바꾸지 않는다(기존 완료 이력은 로컬 DB 상태에 따름)
                                    if (c.popupId().startsWith("SAMPLE-TEXT")) assertTrue(status.completed(), label + " 일반 안내 닫기 완료");
                                    else assertEquals("CLOSED".equals(status.popupStatus()), !status.completed(), label);
                                }
                                default -> assertTrue(status.completed(), label + " 완료 저장");
                            }
                        } finally {
                            session.getConnection().rollback(savepoint);
                            session.clearCache();
                        }
                    }
                }
            } finally {
                session.rollback(true);
            }
        }
    }
}
