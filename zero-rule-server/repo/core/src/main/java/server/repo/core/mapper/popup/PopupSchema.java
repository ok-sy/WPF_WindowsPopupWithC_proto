package server.repo.core.mapper.popup;

import java.util.Properties;

/**
 * 팝업 테이블·시퀀스의 스키마 한정자 계산 — [추가, 2026-09-20 스키마 분리 설정화, 기준 5]
 *
 * <p>[역할] 팝업 매퍼 XML(PopupMapper.xml·WpfPopupMapper.xml)은 테이블·시퀀스 앞에 MyBatis 구성 변수
 * {@code ${popupSchemaPrefix}}를 붙인다. 이 클래스는 설정값(스키마 이름)을 그 변수 값("POPUP." 또는 "")으로 바꾼다.
 *
 * <p>[추가 이유] 설계(docs/design/05)는 팝업 테이블을 별도 POPUP 스키마(=계정)에 두지만, 원격 개발 DB(Oracle 11g XE)의
 * 앱 계정 zero-rule에는 CREATE USER 권한이 없어 POPUP 계정을 만들 수 없다. 그래서 스키마 한정자를 설정으로 빼서
 * <ul>
 *   <li>POPUP 계정이 있는 환경(로컬 XE 21c): {@code custom.popup.schema=POPUP} → "POPUP."(설계 그대로)</li>
 *   <li>없는 환경(원격 개발 DB): {@code custom.popup.schema=""} → "" (접속 계정 자신의 스키마에 만든 팝업 테이블 사용)</li>
 * </ul>
 * 로 코드 변경 없이 전환한다. 값은 설정 파일에서만 오고 MyBatis 상수 치환(${})으로만 쓰이므로 인젝션과 무관하다.
 *
 * <p>[기존 구조와의 관계] 공통 MyBatisConfig는 이 클래스를 호출해 {@link #PROPERTY}만 SqlSessionFactoryBean에
 * 추가한다(공통 파일 수정은 그 3줄뿐). 테스트는 {@link #variables(String)}로 같은 변수를 Configuration에 넣는다.
 */
public final class PopupSchema {

    /** 매퍼 XML에서 참조하는 MyBatis 구성 변수 이름. */
    public static final String PROPERTY = "popupSchemaPrefix";

    /** 설정 키 (Spring Environment). 비우면 접속 계정 스키마. */
    public static final String CONFIG_KEY = "custom.popup.schema";

    /** 설계 기본값 — 별도 POPUP 스키마. */
    public static final String DEFAULT_SCHEMA = "POPUP";

    private PopupSchema() {
    }

    /**
     * 스키마 이름 → SQL 접두어. null/공백이면 ""(한정자 없음), 아니면 {@code "<schema>."}.
     * 하이픈 등이 포함된 계정명(예: ZERO-RULE)을 명시하려면 설정에 큰따옴표까지 적는다: {@code "\"ZERO-RULE\""}.
     */
    public static String prefix(String schema) {
        if (schema == null || schema.trim().isEmpty()) {
            return "";
        }
        return schema.trim() + ".";
    }

    /** 테스트·독립 실행용: {@link #PROPERTY}만 담은 Properties. */
    public static Properties variables(String schema) {
        Properties props = new Properties();
        props.setProperty(PROPERTY, prefix(schema));
        return props;
    }
}
