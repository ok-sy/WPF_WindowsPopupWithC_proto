package server.app.wpf;

import org.springframework.boot.SpringApplication;

import java.util.HashMap;
import java.util.Map;

/**
 * WPF 연동 개발 서버 — 팝업·WPF API 빈만 올려 8080에서 실제 HTTP로 서비스한다.
 *
 * <p>[추가 이유] 이 저장소의 zero 프레임워크(clover-* POSTGRE 빌드)와 공통 매퍼는 PostgreSQL 전용이라
 * Oracle에서는 전체 zeroserver가 기동되지 않는다(공통 프레임워크의 Oracle 빌드는 타 팀/운영 소관).
 * WPF 클라이언트를 실제 HTTP로 붙여 보기 위해 {@link WpfApiOracleHttpTest.TestApp}(팝업 슬라이스)을
 * 운영과 같은 경로(/zero-rule-server/p/api/wpf/**)·포트(8080)로 실행한다. 테스트 소스에만 두며 배포하지 않는다.</p>
 *
 * <p>실행: {@code ./gradlew :app:wpfDevServer} (환경변수 POPUP_TEST_DB_URL/USER/PASSWORD, 기본 XEPDB1/POPUP/popup).
 * 사용자 지정은 개발 프로파일과 같은 {@code X-Dev-User-Id} 헤더(WPF appsettings의 DevUserId)다.</p>
 */
public final class WpfApiDevServer {

    private WpfApiDevServer() {
    }

    public static void main(String[] args) {
        Map<String, Object> props = new HashMap<>();
        props.put("server.port", System.getenv().getOrDefault("WPF_DEV_SERVER_PORT", "8080"));
        props.put("server.servlet.context-path", "/zero-rule-server");
        props.put("spring.datasource.url", System.getenv().getOrDefault("POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"));
        props.put("spring.datasource.username", System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"));
        props.put("spring.datasource.password", System.getenv().getOrDefault("POPUP_TEST_DB_PASSWORD", "popup"));
        props.put("spring.datasource.driver-class-name", "oracle.jdbc.OracleDriver");
        props.put("mybatis.config-location", "classpath:mybatis-config.xml");
        props.put("mybatis.mapper-locations", "classpath:mappers/popup/*.xml");
        props.put("custom.wpf-popup.dev-user-header", "true");
        props.put("custom.wpf-popup.polling-interval-seconds", "1800");
        props.put("spring.jackson.serialization.write-dates-as-timestamps", "true");
        props.put("logging.level.server", "INFO");

        SpringApplication application = new SpringApplication(WpfApiOracleHttpTest.TestApp.class);
        application.setDefaultProperties(props);
        application.run(args);
    }
}
