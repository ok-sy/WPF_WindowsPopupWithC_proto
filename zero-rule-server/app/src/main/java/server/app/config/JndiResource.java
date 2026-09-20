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

        // datasource 정보 (업스트림 기본값: 공통 개발 DB. 공통 ZERO_RULE 테이블과 팝업 POPUP 스키마가 같은 인스턴스에 있어야 한다)
        //
        // [WPF 팝업 — 추가 분기, 기준 5] 환경변수 ZERO_RULE_DB_URL / ZERO_RULE_DB_USER / ZERO_RULE_DB_PASSWORD 가
        // 설정돼 있으면 그 값을 우선 사용한다. 개발 DB(192.168.114.71)에 접속할 수 없는 로컬 환경에서
        // 로컬 Oracle XE(예: jdbc:log4jdbc:oracle:thin:@//localhost:1521/XEPDB1)로 띄우기 위한 것으로,
        // 환경변수가 없으면 업스트림 값 그대로 동작하므로 기존 배포 환경에는 영향이 없다.
        // 드라이버는 업스트림과 같은 log4jdbc DriverSpy를 유지한다(URL 접두어 jdbc:log4jdbc: 필요).
        resource.setProperty("driverClassName", "net.sf.log4jdbc.sql.jdbcapi.DriverSpy");
        resource.setProperty("url", envOrDefault("ZERO_RULE_DB_URL", "jdbc:log4jdbc:oracle:thin:@//192.168.114.71:4004/XE"));
        resource.setProperty("username", envOrDefault("ZERO_RULE_DB_USER", "zero-rule"));
        resource.setProperty("password", envOrDefault("ZERO_RULE_DB_PASSWORD", "Zerorule4321!"));

        return resource;
    }

    /** [WPF 팝업 — 추가] 환경변수가 비어 있지 않으면 그 값을, 아니면 업스트림 기본값을 돌려준다. */
    private static String envOrDefault(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}