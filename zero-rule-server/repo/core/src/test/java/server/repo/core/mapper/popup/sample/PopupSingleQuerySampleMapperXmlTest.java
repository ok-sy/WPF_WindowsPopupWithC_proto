package server.repo.core.mapper.popup.sample;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.ResultMapping;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.type.JdbcType;
import org.junit.jupiter.api.Test;

/** [TODO65] 매퍼 XML을 DB 없이 파싱해 SQL 구조(정렬 후 ROWNUM 1)·바인딩·CLOB 매핑을 확인한다. 실제 Oracle 실행은 아니다. */
class PopupSingleQuerySampleMapperXmlTest {

    private static final String RESOURCE = "mappers/popup/sample/PopupSingleQuerySampleMapper.xml";

    private static MappedStatement statement() throws Exception {
        Configuration configuration = new Configuration();
        try (InputStream in = PopupSingleQuerySampleMapperXmlTest.class.getClassLoader().getResourceAsStream(RESOURCE)) {
            new XMLMapperBuilder(in, configuration, RESOURCE, configuration.getSqlFragments()).parse();
        }
        return configuration.getMappedStatement(PopupSingleQuerySampleMapper.class.getName() + ".selectNextCandidate");
    }

    private static String sql(String contentId, String typeCode) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", "E1001");
        params.put("contentId", contentId);
        params.put("contentTypeCode", typeCode);
        BoundSql bound = statement().getBoundSql(params);
        assertEquals((contentId == null ? 0 : 1) + (typeCode == null ? 0 : 1), bound.getParameterMappings().size(), "#{} 바인딩만 사용");
        return bound.getSql().replaceAll("/\\*.*?\\*/", " ").replaceAll("\\s+", " ").trim();
    }

    @Test
    void ordersInsideAndLimitsOutsideWithRownum() throws Exception {
        String sql = sql(null, null);
        int orderBy = sql.indexOf("ORDER BY C.POPU_CNTN_ID DESC");
        int rownum = sql.lastIndexOf("WHERE ROWNUM = 1");
        assertTrue(orderBy > 0 && rownum > orderBy, sql);
        assertTrue(sql.endsWith(") WHERE ROWNUM = 1"), "ROWNUM은 정렬된 내부 쿼리 바깥에만: " + sql);
        assertFalse(sql.contains("FETCH FIRST"), "Oracle 11g 호환");
        assertFalse(sql.contains("POPU_CNTN_ID = ?"), "샘플 조건은 값이 있을 때만");
    }

    @Test
    void optionalSampleConditionsBind() throws Exception {
        String sql = sql("C-001", "10");
        assertTrue(sql.contains("AND C.POPU_CNTN_ID = ?") && sql.contains("AND C.POPU_CNTN_TP_CD = ?"), sql);
    }

    @Test
    void clobColumnMapsToStringContent() throws Exception {
        ResultMapping clob = statement().getResultMaps().get(0).getResultMappings().stream()
                .filter(m -> "contentJson".equals(m.getProperty())).findFirst().orElseThrow();
        assertEquals("CNTN_CN", clob.getColumn());
        assertEquals(JdbcType.CLOB, clob.getJdbcType());
        assertEquals(String.class, clob.getJavaType());
    }
}
