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
 * [기준 2·3·4·5] 신규 WPF API를 Oracle 실DB(db/oracle/01·02 적용 상태)로 검증하는 롤백 전용 테스트.
 * POPUP_TEST_DB_PASSWORD가 있을 때만 실행된다. 샘플 기대값(02_popup_sample_oracle.sql 주석):
 *   E1001(개발팀·사원·2024 입사): TEXT, VIDEO, QUIZ, SURVEY
 *   E1002(개발팀·팀장·2018 입사): TEXT, VIDEO, SURVEY
 *   E1003(본사·사원·2026 입사)  : TEXT, SURVEY
 * 스프링 컨테이너 없이 한 SqlSession(autoCommit=false)에서 실행하므로 REQUIRES_NEW 격리는 검증 대상이 아니다
 * (그 부분은 WpfPopupServiceTest가 mock으로 확인). 마지막에 전부 롤백한다.
 */
class WpfPopupDatabaseTest {

    private static int countOf(SqlSession session, String prefix, String sqlFormat, String parameter) throws Exception {
        try (var statement = session.getConnection().prepareStatement(sqlFormat.formatted(prefix == null ? "" : prefix))) {
            if (parameter != null) statement.setString(1, parameter);
            try (var rs = statement.executeQuery()) {
                assertTrue(rs.next());
                return rs.getInt(1);
            }
        }
    }

    @Test void nextPopupAndResultRoundTripOnOracle() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the rollback-only database test.");
        var dataSource = new UnpooledDataSource("oracle.jdbc.OracleDriver",
                System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"),
                System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"), password);
        var config = new Configuration(new Environment("test", new JdbcTransactionFactory(), dataSource));
        // [스키마 분리 설정화] 매퍼의 ${popupSchemaPrefix} 변수. 환경변수 POPUP_TEST_DB_SCHEMA(기본 POPUP, 빈 값 = 접속 계정 스키마)
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
                WpfPopupProps props = new WpfPopupProps();
                WpfResultProcessor processor = new WpfResultProcessor(popupService, popupMapper, wpfMapper, props);
                WpfPopupService service = new WpfPopupService(popupService, popupMapper, wpfMapper, processor, props);
                String prefix = PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA))
                        .getProperty("popupSchemaPrefix");
                OffsetDateTime displayedAt = OffsetDateTime.parse("2026-09-19T09:00:05+09:00");
                OffsetDateTime closedAt = OffsetDateTime.parse("2026-09-19T09:03:10+09:00");

                // ---- [설계 35] 단건 조회: 대상 조건(부서 하위 포함·직급·사번·입사일)을 SQL에서 판정하고 서버 정렬 첫 팝업 1건 ----
                assertThrows(WpfUserInactiveException.class, () -> service.getNextPopup("E9999"));
                assertEquals("SAMPLE-TEXT-001", service.getNextPopup("E1002").popup().popupId());
                WpfPopupItem text = service.getNextPopup("E1001").popup();
                assertEquals("SAMPLE-TEXT-001", text.popupId());
                assertNotNull(text.deliveryId());
                assertEquals(text.deliveryId(), service.getNextPopup("E1001").popup().deliveryId(), "OPEN 전달 건 재사용");
                // [설계 37] 통합 전 제목·설명은 본문 앞 줄로 합쳐 내려간다
                assertEquals("서비스 점검 안내\n점검 시간 동안 접속이 제한됩니다.\n9월 21일(일) 02:00~06:00 점검 예정입니다.",
                        text.content().get("plainText"));
                assertEquals(true, text.content().get("showHighlight"), "CONTENT_OPTIONS JSON 병합");
                assertEquals(7, text.hideDays());

                // ---- 일반 안내 닫기: 완료 처리, 후속 후보 AVAILABLE, 중복 재전송·같은 전달 건 재제출 ----
                int displayBefore = countOf(session, prefix, "SELECT NVL(MAX(DISPLAY_COUNT), 0) FROM %sUSER_POPUP_STATUS "
                        + "WHERE EMPLOYEE_NO = 'E1001' AND POPUP_ID = 'SAMPLE-TEXT-001'", null);
                String closeId = UUID.randomUUID().toString();
                WpfResultCommand closeText = new WpfResultCommand(closeId, text.deliveryId(), "SAMPLE-TEXT-001", WpfResultType.CLOSED,
                        displayedAt, closedAt, null, null, null, null, null);
                WpfResultResponse closed = service.processResult("E1001", closeText);
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, closed.status(), closed.message());
                assertEquals(WpfResultResponse.NextStatus.AVAILABLE, closed.nextStatus());
                assertTrue(wpfMapper.selectStatus("E1001", "SAMPLE-TEXT-001").completed(), "TEXT 닫기는 완료");
                assertEquals(WpfResultItemResponse.Status.DUPLICATE, service.processResult("E1001", closeText).status(), "같은 resultId 재전송");
                assertEquals(displayBefore + 1, countOf(session, prefix, "SELECT DISPLAY_COUNT FROM %sUSER_POPUP_STATUS "
                        + "WHERE EMPLOYEE_NO = 'E1001' AND POPUP_ID = 'SAMPLE-TEXT-001'", null), "DUPLICATE 재전송은 표시 횟수를 늘리지 않는다");
                assertEquals(1, countOf(session, prefix, "SELECT COUNT(*) FROM %sWPF_RESULT_RECEIPT WHERE RESULT_ID = ?", closeId), "영수증은 1건");
                WpfResultResponse again = service.processResult("E1001", new WpfResultCommand(UUID.randomUUID().toString(),
                        text.deliveryId(), "SAMPLE-TEXT-001", WpfResultType.CLOSED, null, null, null, null, null, null, null));
                assertEquals("WPF_DELIVERY_COMPLETED", again.code());

                // ---- 영상 미완료 닫기: 완료 아님, 폴링 간격 동안 재노출 유예 → 다음 후보로 진행 ----
                WpfPopupItem video = service.getNextPopup("E1001").popup();
                assertEquals("SAMPLE-VIDEO-002", video.popupId());
                assertNotEquals(text.deliveryId(), video.deliveryId());
                WpfResultResponse videoClosed = service.processResult("E1001", new WpfResultCommand(UUID.randomUUID().toString(),
                        video.deliveryId(), "SAMPLE-VIDEO-002", WpfResultType.CLOSED, displayedAt, closedAt, null, null, null, null, null));
                assertEquals(WpfResultResponse.NextStatus.AVAILABLE, videoClosed.nextStatus());
                assertFalse(wpfMapper.selectStatus("E1001", "SAMPLE-VIDEO-002").completed(), "미완료 닫기는 완료가 아님");
                assertEquals(1, countOf(session, prefix, "SELECT COUNT(*) FROM %sWPF_POPUP_DELIVERY WHERE DELIVERY_ID = ? "
                        + "AND DELIVERY_STATUS = 'DONE' AND DEFER_UNTIL_AT BETWEEN CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP) "
                        + "+ NUMTODSINTERVAL(1700, 'SECOND') AND CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP) "
                        + "+ NUMTODSINTERVAL(1900, 'SECOND')", video.deliveryId()), "유예 = 저장 시각 + 1800초");

                // ---- QUIZ: 정답 키·통과 점수 포함, 통과 제출 → 완료 ----
                WpfPopupItem quiz = service.getNextPopup("E1001").popup();
                assertEquals("SAMPLE-QUIZ-003", quiz.popupId(), "유예 중인 영상은 건너뛴다");
                assertEquals(1, quiz.questions().size(), "문항은 최상위 questions");
                assertFalse(quiz.content().containsKey("questions"));
                assertNotNull(quiz.passingScore(), "QUIZ 통과 점수 최상위 노출");
                assertTrue(quiz.questions().get(0).options().stream().anyMatch(o -> Boolean.TRUE.equals(o.isCorrect())), "QUIZ 정답 키");
                assertEquals("보안 교육 확인", quiz.content().get("surveyTitle"));
                long quizQuestionId = quiz.questions().get(0).questionId();
                long yesOptionId = quiz.questions().get(0).options().stream()
                        .filter(o -> o.value().equals("YES")).findFirst().orElseThrow().optionId();
                WpfResultResponse quizDone = service.processResult("E1001", new WpfResultCommand(UUID.randomUUID().toString(),
                        quiz.deliveryId(), "SAMPLE-QUIZ-003", WpfResultType.SUBMITTED, displayedAt, closedAt, null,
                        List.of(new PopupSubmitAnswer(quizQuestionId, null, List.of(yesOptionId))), null, 10.0, true));
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, quizDone.status(), quizDone.message());
                assertTrue(wpfMapper.selectStatus("E1001", "SAMPLE-QUIZ-003").completed(), "QUIZ 통과 완료 저장");

                // ---- SURVEY: 정답 비노출, 제출 즉시 완료 → 남은 후보 없음(EMPTY) → popup=null ----
                WpfPopupItem survey = service.getNextPopup("E1001").popup();
                assertEquals("SAMPLE-SURVEY-004", survey.popupId());
                assertNull(survey.passingScore(), "SURVEY는 통과 점수 없음");
                assertNull(survey.questions().get(0).options().get(0).isCorrect(), "SURVEY 정답 비노출");
                assertNull(survey.questions().get(1).correctAnswer(), "SURVEY 서술형 정답 비노출");
                WpfResultResponse surveyDone = service.processResult("E1001", new WpfResultCommand(UUID.randomUUID().toString(),
                        survey.deliveryId(), "SAMPLE-SURVEY-004", WpfResultType.SUBMITTED, displayedAt, closedAt, null,
                        List.of(new PopupSubmitAnswer(survey.questions().get(0).questionId(), null,
                                        survey.questions().get(0).options().stream().map(o -> o.optionId()).toList()),
                                new PopupSubmitAnswer(survey.questions().get(1).questionId(), "회의실 예약 개선", List.of())),
                        null, null, null));
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, surveyDone.status(), surveyDone.message());
                assertEquals(WpfResultResponse.NextStatus.EMPTY, surveyDone.nextStatus(), "완료·유예 제외 후 후보 없음");
                assertNull(service.getNextPopup("E1001").popup());
                // 완료·유예 제외는 WPF 조회 전용. 기존 호출(답안 제출 재검증)은 숨김만 제외한다
                assertTrue(popupMapper.selectAvailablePopups("E1001").stream().anyMatch(p -> p.popupId().equals("SAMPLE-VIDEO-002")));

                // ---- 전달 건 검증: 다른 사용자의 전달 건·팝업 불일치는 거절, 숨김은 정상 처리 ----
                WpfPopupItem otherText = service.getNextPopup("E1003").popup();
                assertEquals("SAMPLE-TEXT-001", otherText.popupId());
                assertEquals("WPF_INVALID_DELIVERY", service.processResult("E1001", new WpfResultCommand(UUID.randomUUID().toString(),
                        otherText.deliveryId(), "SAMPLE-TEXT-001", WpfResultType.CLOSED, null, null, null, null, null, null, null)).code());
                assertEquals("WPF_INVALID_DELIVERY", service.processResult("E1003", new WpfResultCommand(UUID.randomUUID().toString(),
                        otherText.deliveryId(), "SAMPLE-SURVEY-004", WpfResultType.CLOSED, null, null, null, null, null, null, null)).code());
                WpfResultResponse hidden = service.processResult("E1003", new WpfResultCommand(UUID.randomUUID().toString(),
                        otherText.deliveryId(), "SAMPLE-TEXT-001", WpfResultType.HIDDEN, displayedAt, closedAt, 7, null, null, null, null));
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, hidden.status(), hidden.message());
                assertEquals("HIDDEN", wpfMapper.selectStatus("E1003", "SAMPLE-TEXT-001").popupStatus());
                assertEquals("SAMPLE-SURVEY-004", service.getNextPopup("E1003").popup().popupId());

                // ---- [TODO52-2] 나중에 보기(LATER): TEXT도 완료·숨김 아님, 유예 중 같은 팝업 제외, 유예가 끝나면 다시 표시 ----
                WpfPopupItem laterText = service.getNextPopup("E1002").popup();
                assertEquals("SAMPLE-TEXT-001", laterText.popupId());
                assertFalse(laterText.showLater(), "SHOW_LATER_YN 기본 N");
                String laterId = UUID.randomUUID().toString();
                WpfResultResponse later = service.processResult("E1002", new WpfResultCommand(laterId, laterText.deliveryId(),
                        "SAMPLE-TEXT-001", WpfResultType.LATER, displayedAt, closedAt, 7, null, null, null, null));
                assertEquals(WpfResultItemResponse.Status.ACCEPTED, later.status(), later.message());
                assertFalse(wpfMapper.selectStatus("E1002", "SAMPLE-TEXT-001").completed(), "LATER는 TEXT도 완료가 아님");
                assertNotEquals("HIDDEN", wpfMapper.selectStatus("E1002", "SAMPLE-TEXT-001").popupStatus(), "hideDays를 보내도 숨김 아님");
                assertEquals(1, countOf(session, prefix, "SELECT COUNT(*) FROM %sWPF_RESULT_RECEIPT WHERE RESULT_ID = ? "
                        + "AND RESULT_TYPE = 'LATER'", laterId), "CK_WPF_RESULT_TYPE이 LATER 영수증을 허용");
                assertEquals(1, countOf(session, prefix, "SELECT COUNT(*) FROM %sWPF_POPUP_DELIVERY WHERE DELIVERY_ID = ? "
                        + "AND DELIVERY_STATUS = 'DONE' AND RESULT_TYPE = 'LATER' AND DEFER_UNTIL_AT > CAST(SYSTIMESTAMP AT TIME ZONE "
                        + "'Asia/Seoul' AS TIMESTAMP) + NUMTODSINTERVAL(1700, 'SECOND')", laterText.deliveryId()), "LATER 유예 = 저장 시각 + 1800초");
                WpfPopupItem duringDefer = service.getNextPopup("E1002").popup();
                assertTrue(duringDefer == null || !"SAMPLE-TEXT-001".equals(duringDefer.popupId()), "유예 중 같은 팝업 즉시 재표시 없음");
                if (duringDefer != null) {   // 다른 후보의 OPEN 전달 건도 LATER로 닫아 TEXT 재선정만 본다
                    service.processResult("E1002", new WpfResultCommand(UUID.randomUUID().toString(), duringDefer.deliveryId(),
                            duringDefer.popupId(), WpfResultType.LATER, null, null, null, null, null, null, null));
                }
                try (var expire = session.getConnection().prepareStatement(("UPDATE %sWPF_POPUP_DELIVERY SET DEFER_UNTIL_AT = "
                        + "CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP) - NUMTODSINTERVAL(1, 'SECOND') "
                        + "WHERE DELIVERY_ID = ?").formatted(prefix == null ? "" : prefix))) {
                    expire.setString(1, laterText.deliveryId());
                    assertEquals(1, expire.executeUpdate());   // 다음 조회 주기 도래(롤백되는 세션 안에서만)
                }
                WpfPopupItem again2 = service.getNextPopup("E1002").popup();
                assertEquals("SAMPLE-TEXT-001", again2.popupId(), "유예가 끝나면 나중에 보기한 팝업을 다시 표시");
                assertNotEquals(laterText.deliveryId(), again2.deliveryId(), "새 전달 건 발급");

                // 요청 로그
                service.logRequest(closeId, "E1001", "/p/api/wpf/popups/results", "POST", "127.0.0.1",
                        OffsetDateTime.now(), 200, true, "popupId=SAMPLE-TEXT-001,type=CLOSED", "status=ACCEPTED,next=AVAILABLE");            } finally {
                session.rollback(true);
            }
        }
    }
    /*
     * [설계 39-4·39-5] 실제 Oracle 커밋 경계에서 사용자 행 잠금으로 조회·결과 처리가 직렬화되는지 확인한다.
     * 두 세션(연결)을 쓰고 앞 세션의 결과 처리를 커밋하기 전에 뒤 세션을 시작해, 뒤 세션이 잠금을 기다렸다가
     * 커밋 후 상태로 처리하는지 본다. 이 테스트만 실제 커밋하므로 E1003·E1002의 WPF 상태를 앞뒤로 지운다.
     */
    @Test void queryAndResultAreSerializedPerUserOnOracle() throws Exception {
        String password = System.getenv("POPUP_TEST_DB_PASSWORD");
        assumeTrue(password != null, "Set POPUP_TEST_DB_PASSWORD to run the database concurrency test.");
        var dataSource = new UnpooledDataSource("oracle.jdbc.OracleDriver",
                System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"),
                System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"), password);
        var config = new Configuration(new Environment("test", new JdbcTransactionFactory(), dataSource));
        config.setVariables(PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA)));
        config.setMapUnderscoreToCamelCase(true);
        config.setJdbcTypeForNull(JdbcType.NULL);
        for (String resource : List.of("mappers/popup/PopupMapper.xml", "mappers/popup/WpfPopupMapper.xml")) {
            try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
                new XMLMapperBuilder(stream, config, resource, config.getSqlFragments()).parse();
            }
        }
        var factory = new SqlSessionFactoryBuilder().build(config);
        String prefix = PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA))
                .getProperty("popupSchemaPrefix");
        Runnable cleanup = () -> {
            try (SqlSession s = factory.openSession(false); var st = s.getConnection().createStatement()) {
                for (String table : List.of("WPF_RESULT_RECEIPT", "WPF_POPUP_DELIVERY", "USER_POPUP_STATUS")) {
                    st.executeUpdate("DELETE FROM " + prefix + table + " WHERE EMPLOYEE_NO IN ('E1003', 'E1002')");
                }
                s.commit(true);
            } catch (Exception ex) {
                throw new IllegalStateException(ex);
            }
        };
        // MyBatis commit()은 쓰기가 없으면 커밋을 건너뛰어 SELECT … FOR UPDATE 잠금이 남는다. 테스트는 commit(true)로 강제한다
        // (운영은 Spring 트랜잭션 관리자가 커밋).
        record Stack(SqlSession session, WpfPopupService service, WpfResultProcessor processor) { }
        java.util.function.Supplier<Stack> open = () -> {
            SqlSession s = factory.openSession(false);
            PopupMapper pm = s.getMapper(PopupMapper.class);
            WpfPopupMapper wm = s.getMapper(WpfPopupMapper.class);
            PopupService ps = new PopupService(pm, new ObjectMapper().findAndRegisterModules());
            WpfPopupProps props = new WpfPopupProps();
            WpfResultProcessor processor = new WpfResultProcessor(ps, pm, wm, props);
            return new Stack(s, new WpfPopupService(ps, pm, wm, processor, props), processor);
        };
        var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        cleanup.run();
        Stack a = open.get();
        Stack b = open.get();
        try {
            java.util.function.BiFunction<String, WpfPopupItem, WpfResultCommand> close = (resultId, popup) ->
                    new WpfResultCommand(resultId, popup.deliveryId(), popup.popupId(), WpfResultType.CLOSED,
                            OffsetDateTime.parse("2026-09-19T09:00:05+09:00"), null, null, null, null, null, null);
            java.util.function.BiFunction<String, String, Integer> count = (sql, param) -> {
                try (SqlSession s = factory.openSession(false)) {
                    return countOf(s, prefix, sql, param);
                } catch (Exception ex) {
                    throw new IllegalStateException(ex);
                }
            };

            // 작업 진입을 latch로 확인하고, 앞 세션이 사용자 행 잠금을 쥐고 있음을 제3 연결의 NOWAIT(ORA-00054)로 확인한 뒤
            // 진입한 작업이 잠금 해제 전에는 끝나지 않음을 본다(시간만으로 대기를 추정하지 않음).
            java.util.function.BiFunction<String, java.util.concurrent.Callable<Object>, java.util.concurrent.Future<Object>> startWaiting = (user, call) -> {
                var entered = new java.util.concurrent.CountDownLatch(1);
                var future = executor.submit(() -> { entered.countDown(); return call.call(); });
                try {
                    assertTrue(entered.await(5, java.util.concurrent.TimeUnit.SECONDS), "작업 진입");
                    try (SqlSession probe = factory.openSession(false);
                         var st = probe.getConnection().prepareStatement(
                                 "SELECT EMPLOYEE_NO FROM " + prefix + "APP_USER WHERE EMPLOYEE_NO = ? FOR UPDATE NOWAIT")) {
                        st.setString(1, user);
                        var locked = assertThrows(java.sql.SQLException.class, st::executeQuery, "앞 세션이 사용자 행 잠금을 쥐고 있다");
                        assertEquals(54, locked.getErrorCode(), "ORA-00054 resource busy");
                    }
                    assertThrows(java.util.concurrent.TimeoutException.class, () -> future.get(500, java.util.concurrent.TimeUnit.MILLISECONDS),
                            "진입한 작업은 잠금 해제 전까지 끝나지 않는다");
                } catch (InterruptedException ex) {
                    throw new IllegalStateException(ex);
                } catch (Exception ex) {
                    if (ex instanceof RuntimeException rt) throw rt;
                    throw new IllegalStateException(ex);
                }
                return future;
            };
            // ---- 39-5: 같은 결과 동시 제출 → 앞 ACCEPTED, 뒤는 잠금 대기 후 DUPLICATE ----
            WpfPopupItem text = a.service().getNextPopup("E1003").popup();
            assertEquals("SAMPLE-TEXT-001", text.popupId());
            a.session().commit(true);
            String r1 = UUID.randomUUID().toString();
            assertEquals(WpfResultItemResponse.Status.ACCEPTED, a.processor().processOne("E1003", close.apply(r1, text)).status());
            var duplicate = startWaiting.apply("E1003", () -> b.processor().processOne("E1003", close.apply(r1, text)));
            a.session().commit(true);
            assertEquals(WpfResultItemResponse.Status.DUPLICATE, ((WpfResultItemResponse) duplicate.get(10, java.util.concurrent.TimeUnit.SECONDS)).status(),
                    "잠금 후 영수증을 보고 DUPLICATE(WPF_DELIVERY_COMPLETED 아님)");
            b.session().commit(true);
            assertEquals(1, count.apply("SELECT COUNT(*) FROM %sWPF_RESULT_RECEIPT WHERE RESULT_ID = ?", r1));
            assertEquals(1, count.apply("SELECT DISPLAY_COUNT FROM %sUSER_POPUP_STATUS WHERE EMPLOYEE_NO = 'E1003' AND POPUP_ID = ?", "SAMPLE-TEXT-001"),
                    "표시 횟수 1회만 반영");

            // ---- 39-4(미완료 유예): SURVEY 닫기 커밋 전 조회 → 잠금 대기 후 유예 반영(새 OPEN 없음) ----
            WpfPopupItem survey = a.service().getNextPopup("E1003").popup();
            assertEquals("SAMPLE-SURVEY-004", survey.popupId());
            a.session().commit(true);
            a.processor().processOne("E1003", close.apply(UUID.randomUUID().toString(), survey));
            var afterDefer = startWaiting.apply("E1003", () -> b.service().getNextPopup("E1003"));
            a.session().commit(true);
            assertNull(((server.domain.popup.wpf.WpfNextPopupResponse) afterDefer.get(10, java.util.concurrent.TimeUnit.SECONDS)).popup(), "유예된 SURVEY를 오래된 후보로 다시 발급하지 않는다");
            b.session().commit(true);
            assertEquals(0, count.apply("SELECT COUNT(*) FROM %sWPF_POPUP_DELIVERY WHERE EMPLOYEE_NO = 'E1003' AND DELIVERY_STATUS = 'OPEN' AND POPUP_ID = ?", "SAMPLE-SURVEY-004"));

            // ---- 39-4(완료): TEXT 닫기 커밋 전 조회 → 커밋 후 TEXT가 아닌 다음 후보 ----
            cleanup.run();
            WpfPopupItem text2 = a.service().getNextPopup("E1003").popup();
            a.session().commit(true);
            a.processor().processOne("E1003", close.apply(UUID.randomUUID().toString(), text2));
            var afterComplete = startWaiting.apply("E1003", () -> b.service().getNextPopup("E1003"));
            // 다른 사용자는 E1003 잠금과 무관하게 바로 처리된다
            Stack c = open.get();
            try {
                assertNotNull(java.util.concurrent.CompletableFuture.supplyAsync(() -> c.service().getNextPopup("E1002"))
                        .get(5, java.util.concurrent.TimeUnit.SECONDS).popup(), "다른 사용자는 독립 처리");
                c.session().commit(true);
            } finally {
                c.session().close();
            }
            a.session().commit(true);
            WpfPopupItem next = ((server.domain.popup.wpf.WpfNextPopupResponse) afterComplete.get(10, java.util.concurrent.TimeUnit.SECONDS)).popup();
            assertEquals("SAMPLE-SURVEY-004", next.popupId(), "완료된 TEXT 대신 다음 후보");
            b.session().commit(true);
            assertEquals(0, count.apply("SELECT COUNT(*) FROM %sWPF_POPUP_DELIVERY WHERE EMPLOYEE_NO = 'E1003' AND DELIVERY_STATUS = 'OPEN' AND POPUP_ID = ?", "SAMPLE-TEXT-001"));
            // 순차 재조회는 같은 OPEN 전달 건을 재사용한다(응답 유실 복구)
            assertEquals(next.deliveryId(), a.service().getNextPopup("E1003").popup().deliveryId());
            a.session().commit(true);

            // ---- 동시 조회: OPEN 건이 없을 때 두 조회를 같은 시점에 시작 → OPEN 1건만 생기고 두 응답이 같은 deliveryId ----
            for (int round = 0; round < 5; round++) {
                cleanup.run();
                var ready = new java.util.concurrent.CountDownLatch(2);
                var start = new java.util.concurrent.CountDownLatch(1);
                java.util.function.Function<Stack, java.util.concurrent.Future<WpfPopupItem>> query = stack -> executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    WpfPopupItem item = stack.service().getNextPopup("E1003").popup();
                    stack.session().commit(true);   // 커밋해야 다른 조회가 사용자 잠금을 얻는다
                    return item;
                });
                var first = query.apply(a);
                var second = query.apply(b);
                assertTrue(ready.await(5, java.util.concurrent.TimeUnit.SECONDS), "두 조회 모두 시작 대기");
                start.countDown();
                WpfPopupItem p1 = first.get(10, java.util.concurrent.TimeUnit.SECONDS);
                WpfPopupItem p2 = second.get(10, java.util.concurrent.TimeUnit.SECONDS);
                assertEquals(p1.deliveryId(), p2.deliveryId(), "동시 조회도 같은 전달 건(round " + round + ")");
                assertEquals(p1.popupId(), p2.popupId());
                assertEquals(1, count.apply("SELECT COUNT(*) FROM %sWPF_POPUP_DELIVERY WHERE EMPLOYEE_NO = ?", "E1003"),
                        "전달 건은 1건만 생성(round " + round + ")");
            }        } finally {
            a.session().rollback(true);
            b.session().rollback(true);
            a.session().close();
            b.session().close();
            executor.shutdownNow();
            cleanup.run();
        }
    }}
