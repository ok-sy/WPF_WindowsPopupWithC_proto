package server.service.core.popup;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupQuestionDto;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.PopupSchema;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * [Oracle 전환 — 기준 5] DB 없이 검증할 수 있는 매퍼 XML 정적 검사.
 *
 * <p>Oracle 판 PopupMapper.xml은 RETURNING을 Map 파라미터 + selectKey로 바꾸고 인터페이스에 같은 이름의
 * default 오버로드를 두었다. 실DB가 없는 환경에서도 다음을 보장한다.</p>
 * <ul>
 *   <li>인터페이스의 모든 추상 메서드가 XML 구문과 1:1로 바인딩된다 (ID 누락·오타 방지)</li>
 *   <li>키를 돌려줘야 하는 5개 구문은 selectKey를 갖고 keyProperty가 default 메서드가 읽는 키와 같다</li>
 *   <li>레코드 타입(PopupQuestionDto) 속성 경로 {@code question.isRequired} 등을 MyBatis가 읽을 수 있다</li>
 *   <li>PostgreSQL 전용 문법이 남아 있지 않다</li>
 * </ul>
 */
class PopupMapperOracleStatementTest {

    private static final String RESOURCE = "mappers/popup/PopupMapper.xml";
    private static final String NS = PopupMapper.class.getName() + ".";

    private Configuration parse() throws Exception {
        var configuration = new Configuration();
        // [ì¤í¤ë§ ë¶ë¦¬ ì¤ì í] ë§¤í¼ì ${popupSchemaPrefix} ë³ì. íê²½ë³ì POPUP_TEST_DB_SCHEMA(ê¸°ë³¸ POPUP, ë¹ ê° = ì ì ê³ì  ì¤í¤ë§)
        configuration.setVariables(PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA)));
        try (var stream = getClass().getClassLoader().getResourceAsStream(RESOURCE)) {
            assertNotNull(stream, RESOURCE + " 리소스가 없습니다.");
            new XMLMapperBuilder(stream, configuration, RESOURCE, configuration.getSqlFragments()).parse();
        }
        return configuration;
    }

    @Test void everyAbstractMapperMethodHasStatement() throws Exception {
        var configuration = parse();
        List<String> missing = Arrays.stream(PopupMapper.class.getMethods())
                .filter(m -> !m.isDefault() && m.getDeclaringClass() == PopupMapper.class)
                .map(Method::getName)
                .distinct()
                .filter(name -> !configuration.hasStatement(NS + name))
                .toList();
        assertTrue(missing.isEmpty(), "XML 구문이 없는 매퍼 메서드: " + missing);
    }

    @Test void keyReturningStatementsUseSelectKeyWithExpectedProperty() throws Exception {
        var configuration = parse();
        Map<String, String> expected = Map.of(
                "insertQuestionTemplate", "templateId",
                "insertAdminQuestion", "questionId",
                "insertAdminTargetGroup", "targetGroupId",
                "upsertPopupResponse", "responseId",
                "insertResponseAnswer", "responseAnswerId");
        expected.forEach((id, keyProperty) -> {
            MappedStatement statement = configuration.getMappedStatement(NS + id);
            assertEquals(SqlCommandType.INSERT, statement.getSqlCommandType(), id + "는 insert여야 selectKey가 동작한다");
            MappedStatement selectKey = configuration.getMappedStatement(NS + id + "!selectKey");
            assertNotNull(selectKey, id + "에 selectKey가 없습니다");
            assertArrayEquals(new String[]{keyProperty}, selectKey.getKeyProperties(),
                    id + "의 selectKey keyProperty가 default 메서드가 읽는 키와 다릅니다");
        });
    }

    @Test void recordPropertyPathsAreReadableByMyBatis() throws Exception {
        var configuration = parse();
        Map<String, Object> params = new HashMap<>();
        params.put("templateId", 20L);
        params.put("question", new PopupQuestionDto(1L, "제목", "설명", "SINGLE_CHOICE", true, true,
                new BigDecimal("2.00"), 1, List.of(new PopupOptionDto(2L, "1", "A", 1, true)), "정답", "EXACT"));
        params.put("quiz", true);
        MetaObject meta = configuration.newMetaObject(params);
        assertEquals(true, meta.getValue("question.isRequired"));
        assertEquals("SINGLE_CHOICE", meta.getValue("question.questionType"));
        assertEquals("정답", meta.getValue("question.correctAnswer"));
        assertEquals("EXACT", meta.getValue("question.answerMatchMode"));
        assertEquals(new BigDecimal("2.00"), meta.getValue("question.questionScore"));
        // selectKey가 Map에 키를 채우는 경로
        meta.setValue("questionId", 30L);
        assertEquals(30L, params.get("questionId"));
    }

    /**
     * [WPF API — 기준 3·4] WpfPopupMapper.xml은 PopupMapper.xml의 nowKst 조각을 네임스페이스 한정자로 include 한다.
     * 두 XML을 함께 파싱해 모든 WpfPopupMapper 메서드가 구문과 바인딩되고 include가 해석되는지 확인한다.
     */
    @Test void wpfMapperBindsAllMethodsAndResolvesCrossNamespaceInclude() throws Exception {
        var configuration = parse();
        String wpfResource = "mappers/popup/WpfPopupMapper.xml";
        try (var stream = getClass().getClassLoader().getResourceAsStream(wpfResource)) {
            assertNotNull(stream, wpfResource + " 리소스가 없습니다.");
            new XMLMapperBuilder(stream, configuration, wpfResource, configuration.getSqlFragments()).parse();
        }
        String wpfNs = server.repo.core.mapper.popup.WpfPopupMapper.class.getName() + ".";
        List<String> missing = Arrays.stream(server.repo.core.mapper.popup.WpfPopupMapper.class.getMethods())
                .filter(m -> !m.isDefault())
                .map(Method::getName)
                .distinct()
                .filter(name -> !configuration.hasStatement(wpfNs + name))
                .toList();
        assertTrue(missing.isEmpty(), "XML 구문이 없는 WpfPopupMapper 메서드: " + missing);

        // include가 실제 SQL 조각으로 치환되었는지 (미해결이면 파싱 단계에서 IncompleteElementException)
        Map<String, Object> params = new HashMap<>();
        params.put("userId", "E1001");
        params.put("popupId", "P1");
        params.put("displayedAt", null);
        params.put("closedAt", null);
        String sql = configuration.getMappedStatement(wpfNs + "mergeDisplayAndClose").getBoundSql(params).getSql();
        assertTrue(sql.contains("SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul'"), "nowKst include 미해석");
        assertFalse(sql.contains("<include"), "include 태그가 남아 있음");

        // excludeCompleted 동적 조건: true일 때만 COMPLETED_YN 조건이 들어간다 (기준 2)
        Map<String, Object> listParams = new HashMap<>();
        listParams.put("userId", "E1001");
        listParams.put("excludeCompleted", true);
        String withCompleted = configuration.getMappedStatement(NS + "selectAvailablePopups").getBoundSql(listParams).getSql();
        assertTrue(withCompleted.contains("COMPLETED_YN = 'Y'"));
        listParams.put("excludeCompleted", false);
        String withoutCompleted = configuration.getMappedStatement(NS + "selectAvailablePopups").getBoundSql(listParams).getSql();
        assertFalse(withoutCompleted.contains("COMPLETED_YN = 'Y'"), "기존 WPF-01 계약: 완료 제외 없음");
    }

    @Test void noPostgresOnlySyntaxRemains() throws Exception {
        String xml;
        try (var stream = getClass().getClassLoader().getResourceAsStream(RESOURCE)) {
            xml = new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        }
        // 주석 블록은 변환 규칙 설명에 PostgreSQL 키워드를 포함하므로 제외한다.
        String sqlOnly = xml.replaceAll("(?s)<!--.*?-->", "");
        for (String forbidden : List.of("RETURNING", "ON CONFLICT", "EXCLUDED.", "::", "JSONB", "BOOL_AND(",
                "WITH RECURSIVE", "AT TIME ZONE 'Asia/Seoul' AS display", "gen_random_uuid", "INTERVAL '1 day'",
                "CURRENT_TIMESTAMP", "popup.popup_notice", "num_nonnulls")) {
            assertFalse(sqlOnly.contains(forbidden), "PostgreSQL 전용 문법이 남아 있습니다: " + forbidden);
        }
    }
}
