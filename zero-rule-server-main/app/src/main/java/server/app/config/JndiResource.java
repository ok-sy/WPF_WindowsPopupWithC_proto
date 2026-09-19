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

        // 로컬 개발 DB 연결: 스키마를 생략한 쿼리도 zero_rule 테이블을 조회하도록 지정한다.
        resource.setProperty("driverClassName", "org.postgresql.Driver");
        resource.setProperty("url", "jdbc:postgresql://localhost:5432/postgres?currentSchema=zero_rule");
        resource.setProperty("username", "postgres");
        resource.setProperty("password", "admin");

        return resource;
    }
}