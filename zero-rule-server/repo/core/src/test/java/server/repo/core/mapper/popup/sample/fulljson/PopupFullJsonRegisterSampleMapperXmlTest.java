package server.repo.core.mapper.popup.sample.fulljson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.type.JdbcType;
import org.junit.jupiter.api.Test;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-16-02 : 재현 가능한 검증
 * ■ DTIY3117 등록·수정 샘플 매퍼 XML 파싱 테스트
 * - 매퍼 XML을 DB 없이 파싱해 INSERT/UPDATE 문·#{} 바인딩·CLOB jdbcType·조회 매퍼와의 공존을 확인한다. 실제 Oracle 실행은 아니다.
 */
class PopupFullJsonRegisterSampleMapperXmlTest {

    private static final String RESOURCE = "mappers/popup/sample/fulljson/PopupFullJsonRegisterSampleMapper.xml";
    private static final String QUERY = "mappers/popup/sample/fulljson/PopupFullJsonSampleMapper.xml";
    private static final Map<String, Object> PARAMS = Map.of("popupId", "S17-TXT-01", "popupJson", "{}", "userId", "E10001");

    private static Configuration parse(String... resources) throws Exception {
        Configuration configuration = new Configuration();
        for (String resource : resources) {
            try (InputStream in = PopupFullJsonRegisterSampleMapperXmlTest.class.getClassLoader().getResourceAsStream(resource)) {
                new XMLMapperBuilder(in, configuration, resource, configuration.getSqlFragments()).parse();
            }
        }
        return configuration;
    }

    private static String sql(BoundSql bound) {
        return bound.getSql().replaceAll("\\s+", " ").trim();
    }

    @Test
    void insertBindsAllValuesWithClob() throws Exception {
        var statement = parse(RESOURCE).getMappedStatement(PopupFullJsonRegisterSampleMapper.class.getName() + ".insertBulletin");
        assertEquals(SqlCommandType.INSERT, statement.getSqlCommandType());
        BoundSql bound = statement.getBoundSql(PARAMS);
        assertEquals("INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM) VALUES (?, ?, ?, SYSDATE)", sql(bound));
        List<ParameterMapping> params = bound.getParameterMappings();
        assertEquals(List.of("popupId", "popupJson", "userId"), params.stream().map(ParameterMapping::getProperty).toList());
        assertEquals(JdbcType.CLOB, params.get(1).getJdbcType());
    }

    @Test
    void updateReplacesJsonByPopupId() throws Exception {
        var statement = parse(RESOURCE).getMappedStatement(PopupFullJsonRegisterSampleMapper.class.getName() + ".updateBulletin");
        assertEquals(SqlCommandType.UPDATE, statement.getSqlCommandType());
        BoundSql bound = statement.getBoundSql(PARAMS);
        assertEquals("UPDATE DTIY3117 SET POPU_BLTN_CN = ? , CHNG_USER_ID = ? , CHNG_DTTM = SYSDATE WHERE POPU_ID = ?", sql(bound));
        List<ParameterMapping> params = bound.getParameterMappings();
        assertEquals(List.of("popupJson", "userId", "popupId"), params.stream().map(ParameterMapping::getProperty).toList());
        assertEquals(JdbcType.CLOB, params.get(0).getJdbcType());
    }

    /** 조회 매퍼 XML과 함께 로드해도 namespace·statement가 충돌하지 않는다. */
    @Test
    void coexistsWithQueryMapper() throws Exception {
        Configuration both = parse(QUERY, RESOURCE);
        assertTrue(both.hasStatement(PopupFullJsonSampleMapper.class.getName() + ".selectByPopupId"));
        assertTrue(both.hasStatement(PopupFullJsonRegisterSampleMapper.class.getName() + ".insertBulletin"));
    }
}
