package server.web.api.popup.sample.relay;

import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.http.HttpMessageConvertersAutoConfiguration;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.autoconfigure.web.client.RestClientAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.context.annotation.Import;

/**
 * POL-14-03 : 서버 인계 예제
 * ■ 중계 샘플 최소 부트 구성
 * - DB 없이 중계 샘플만 띄우는 최소 부트 구성(테스트·로컬 확인 전용).
 *
 * <p>전체 서버(app)는 cloverframework·인증·MyBatis 때문에 DB 접속이 필요하다. 이 구성은 웹 MVC·Jackson·RestClient 자동 구성과
 * {@code server.web.api.popup.sample.relay} 클래스만 올리므로 DataSource·MyBatis·보안 설정이 따라오지 않는다.</p>
 */
@SpringBootConfiguration
@ImportAutoConfiguration({
        ServletWebServerFactoryAutoConfiguration.class,
        DispatcherServletAutoConfiguration.class,
        WebMvcAutoConfiguration.class,
        HttpMessageConvertersAutoConfiguration.class,
        JacksonAutoConfiguration.class,
        RestClientAutoConfiguration.class})
@Import({RelaySampleConfig.class, BackendPopupClient.class, BackendResponseMapper.class, PopupRelayService.class,
        PopupRelayController.class, RelayExceptionHandler.class})
public class RelaySampleBootConfig {
}
