package server.app.config;

import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.ContextResource;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.embedded.tomcat.TomcatWebServer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JndiResource {

    @Bean
    public TomcatServletWebServerFactory tomcatFactory() {
        return new TomcatServletWebServerFactory() {
            @Override
            protected TomcatWebServer getTomcatWebServer(Tomcat tomcat) {
                tomcat.enableNaming();
                return super.getTomcatWebServer(tomcat);
            }

            @Override
            protected void postProcessContext(Context context) {
                context.getNamingResources().addResource(getResource());
            }
        };
    }

    public ContextResource getResource() {
        ContextResource resource = new ContextResource();
        resource.setName("jndi/dev_db"); // 사용될 jndi 이름
        resource.setType("javax.sql.DataSource");
        resource.setAuth("Container");
        resource.setProperty("factory", "org.apache.commons.dbcp2.BasicDataSourceFactory");

        // [Oracle 전환 — 기준 5] 로컬 개발 DB를 PostgreSQL에서 Oracle로 바꾼다.
        // 공통 테이블(zero_rule)은 접속 계정의 기본 스키마에, 팝업 테이블은 POPUP 스키마에 두며
        // 팝업 매퍼는 POPUP. 한정자를 명시하므로 계정 기본 스키마와 무관하게 동작한다.
        // 환경변수(POPUP_DB_URL/POPUP_DB_USER/POPUP_DB_PASSWORD)가 있으면 우선 적용해 소스에 접속 정보를 고정하지 않는다.
        // 이전 PostgreSQL 값: org.postgresql.Driver / jdbc:postgresql://localhost:5432/postgres?currentSchema=zero_rule / postgres
        resource.setProperty("driverClassName", "oracle.jdbc.OracleDriver");
        resource.setProperty("url", envOrDefault("POPUP_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"));
        resource.setProperty("username", envOrDefault("POPUP_DB_USER", "ZERO_RULE"));
        resource.setProperty("password", envOrDefault("POPUP_DB_PASSWORD", "zero_rule"));
        // Oracle TIMESTAMP 컬럼은 KST 로컬 시각으로 저장·비교하므로 커넥션 세션 시간대를 서울로 고정한다.
        resource.setProperty("connectionProperties", "oracle.jdbc.timezoneAsRegion=false");
        resource.setProperty("connectionInitSqls", "ALTER SESSION SET TIME_ZONE = 'Asia/Seoul'");

        return resource;
    }

    /** [Oracle 전환] 환경변수가 비어 있지 않으면 그 값을, 아니면 로컬 개발 기본값을 돌려준다. */
    private static String envOrDefault(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}