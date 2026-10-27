package server.repo.core.mapper.popup.sample.fulljson;

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

import server.repo.core.mapper.popup.sample.PopupSingleQuerySampleMapper;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-16-02 : 재현 가능한 검증
 * ■ DTIY3117 전체 JSON 조회 샘플 매퍼 XML 파싱 테스트
 * - 매퍼 XML을 DB 없이 파싱해 POPU_ID 바인딩 조회·CLOB 매핑·기존 3111 매퍼와의 namespace 분리를 확인한다. 실제 Oracle 실행은 아니다.
 */
class PopupFullJsonSampleMapperXmlTest {

    private static final String RESOURCE = "mappers/popup/sample/fulljson/PopupFullJsonSampleMapper.xml";
    private static final String LEGACY = "mappers/popup/sample/PopupSingleQuerySampleMapper.xml";

    private static Configuration parse(String... resources) throws Exception {
        Configuration configuration = new Configuration();
        for (String resource : resources) {
            try (InputStream in = PopupFullJsonSampleMapperXmlTest.class.getClassLoader().getResourceAsStream(resource)) {
                new XMLMapperBuilder(in, configuration, resource, configuration.getSqlFragments()).parse();
            }
        }
        return configuration;
    }

    private static MappedStatement statement() throws Exception {
        return parse(RESOURCE).getMappedStatement(PopupFullJsonSampleMapper.class.getName() + ".selectByPopupId");
    }

    @Test
    void selectsByBoundPopupId() throws Exception {
        BoundSql bound = statement().getBoundSql(Map.of("popupId", "S17-TXT-01"));
        String sql = bound.getSql().replaceAll("/\\*.*?\\*/", " ").replaceAll("\\s+", " ").trim();
        assertEquals("SELECT B.POPU_ID , B.POPU_BLTN_CN FROM DTIY3117 B WHERE B.POPU_ID = ?", sql);
        assertEquals(1, bound.getParameterMappings().size(), "#{} 바인딩만 사용");
        assertFalse(sql.contains("DTIY3111"), "기존 3111 테이블을 조회하지 않는다");
    }

    @Test
    void clobColumnMapsToStringJson() throws Exception {
        Map<String, ResultMapping> mappings = new HashMap<>();
        statement().getResultMaps().get(0).getResultMappings().forEach(m -> mappings.put(m.getProperty(), m));
        assertEquals(2, mappings.size());
        assertEquals("POPU_ID", mappings.get("popupId").getColumn());
        ResultMapping clob = mappings.get("popupJson");
        assertEquals("POPU_BLTN_CN", clob.getColumn());
        assertEquals(JdbcType.CLOB, clob.getJdbcType());
        assertEquals(String.class, clob.getJavaType());
    }

    /** 기존 3111 매퍼 XML과 함께 로드해도 statement·resultMap ID가 충돌하지 않는다. */
    @Test
    void coexistsWithLegacySingleQueryMapper() throws Exception {
        Configuration both = parse(LEGACY, RESOURCE);
        assertTrue(both.hasStatement(PopupSingleQuerySampleMapper.class.getName() + ".selectNextCandidate"));
        assertTrue(both.hasStatement(PopupFullJsonSampleMapper.class.getName() + ".selectByPopupId"));
    }
}
