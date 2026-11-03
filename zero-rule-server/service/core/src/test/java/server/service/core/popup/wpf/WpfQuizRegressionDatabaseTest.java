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
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.domain.popup.wpf.WpfResultType;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.PopupSchema;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * POL-10-03 : 완료·숨김·연기
 * ■ PU001 B-3 회귀(롤백 전용 실DB): QUIZ 불합격 뒤 '다시 보지 않기'로 나간 HIDDEN은 기간 숨김일 뿐 완료가 아니다.
 * - 같은 QUIZ 전달 건에 HIDDEN 결과를 보내면 ACCEPTED·POPUP_STATUS=HIDDEN·COMPLETED 아님, 노출 후보에서 빠진다.
 * - 숨김 기간이 지나면(HIDDEN_UNTIL_AT을 과거로) 기존 노출 정책에 따라 다시 후보가 된다.
 * - 시작 상태를 맞추려고 해당 사용자·팝업의 상태 행을 미완료·숨김 없음으로 바꾸며, 테스트가 끝나면 모두 롤백한다.
 * - POPUP_TEST_DB_PASSWORD가 없으면 건너뛴다(POPUP_TEST_DB_URL·USER·SCHEMA는 PopupQuestionDatabaseTest와 같음).
 */
class WpfQuizRegressionDatabaseTest {

    private static final String USER = "E1001";            // 샘플: QUIZ 대상
    private static final String QUIZ = "SAMPLE-QUIZ-003";

    private static int update(SqlSession session, String sql) throws Exception {
        try (var statement = session.getConnection().prepareStatement(sql)) {
            statement.setString(1, USER);
            statement.setString(2, QUIZ);
            return statement.executeUpdate();
        }
    }

    private static boolean available(PopupMapper mapper) {
        // 완료·전달 건 제외 없이(false) 숨김 조건만 본다. 같은 사용자에게 다른 OPEN 전달 건이 있어도 영향받지 않는다.
        return mapper.selectAvailablePopups(USER, false).stream().anyMatch(p -> QUIZ.equals(p.popupId()));
    }

    @Test void failedQuizHiddenIsNotCompletionAndReappearsAfterExpiry() throws Exception {
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

        try (SqlSession session = new SqlSessionFactoryBuilder().build(config).openSession(false)) {
            try {
                PopupMapper popupMapper = session.getMapper(PopupMapper.class);
                WpfPopupMapper wpfMapper = session.getMapper(WpfPopupMapper.class);
                PopupService popupService = new PopupService(popupMapper, new ObjectMapper().findAndRegisterModules());
                WpfPopupProps props = new WpfPopupProps();
                WpfResultProcessor processor = new WpfResultProcessor(popupService, popupMapper, wpfMapper, props);
                WpfPopupService service = new WpfPopupService(popupService, popupMapper, wpfMapper, processor, props);

                // 시작 상태: 게시 중(샘플 게시 기간이 지났을 수 있어 현재 시각을 포함하도록 늘림) · 미완료·숨김 없음(불합격 후 아직 결과가 없는 상태와 같음)
                try (var statement = session.getConnection().prepareStatement("UPDATE " + prefix + "POPUP_NOTICE SET ACTIVE_YN = 'Y', DISPLAY_START_AT = "
                        + nowKst + " - NUMTODSINTERVAL(1, 'DAY'), DISPLAY_END_AT = " + nowKst + " + NUMTODSINTERVAL(30, 'DAY') WHERE POPUP_ID = ?")) {
                    statement.setString(1, QUIZ);
                    assertEquals(1, statement.executeUpdate(), "샘플 QUIZ 행");
                }
                update(session, "UPDATE " + prefix + "USER_POPUP_STATUS SET COMPLETED_YN = 'N', HIDDEN_UNTIL_AT = NULL"
                        + " WHERE EMPLOYEE_NO = ? AND POPUP_ID = ?");
                session.clearCache();
                assertTrue(available(popupMapper), "시작 상태에서 QUIZ가 노출 후보여야 함(로컬 샘플 게시·대상 확인)");

                // QUIZ 전달 건 발급 후 HIDDEN(불합격 뒤 다시 보지 않기 + 보조 닫기/Alt+F4와 같은 결과)
                var existing = wpfMapper.selectOpenDelivery(USER);
                if (existing != null) wpfMapper.expireDelivery(existing.deliveryId());
                String deliveryId = UUID.randomUUID().toString();
                wpfMapper.insertDelivery(deliveryId, USER, QUIZ);
                WpfResultResponse hidden = service.processResult(USER, new WpfResultCommand(UUID.randomUUID().toString(), deliveryId, QUIZ,
                        WpfResultType.HIDDEN, OffsetDateTime.parse("2026-11-03T09:00:05+09:00"), OffsetDateTime.parse("2026-11-03T09:02:00+09:00"),
                        7, null, null, null, null));
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, hidden.status(), hidden.code() + " " + hidden.message());
                session.clearCache();
                var status = wpfMapper.selectStatus(USER, QUIZ);
                assertEquals("HIDDEN", status.popupStatus());
                assertFalse(status.completed(), "HIDDEN은 합격·COMPLETED가 아니다(B-3)");
                assertFalse(available(popupMapper), "숨김 기간에는 노출 후보에서 빠진다");

                // 숨김 기간 만료 → 다시 노출 후보(완료 이력 없음). 7일 숨김이 끝난 것처럼 시작·종료를 함께 과거로 옮긴다(CK_STATUS_HIDDEN_PERIOD).
                assertEquals(1, update(session, "UPDATE " + prefix + "USER_POPUP_STATUS SET HIDDEN_FROM_AT = "
                        + nowKst + " - NUMTODSINTERVAL(8, 'DAY'), HIDDEN_UNTIL_AT = " + nowKst + " - NUMTODSINTERVAL(1, 'DAY')"
                        + " WHERE EMPLOYEE_NO = ? AND POPUP_ID = ?"));
                session.clearCache();
                assertTrue(available(popupMapper), "숨김 기간이 지나면 다시 노출 후보가 된다(B-3)");
                assertFalse(wpfMapper.selectStatus(USER, QUIZ).completed(), "만료 후에도 완료로 바뀌지 않는다");
            } finally {
                session.rollback(true);
            }
        }
    }
}
