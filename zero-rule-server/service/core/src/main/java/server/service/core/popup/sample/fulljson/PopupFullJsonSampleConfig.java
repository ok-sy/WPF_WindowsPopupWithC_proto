package server.service.core.popup.sample.fulljson;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import com.fasterxml.jackson.databind.ObjectMapper;

import server.repo.core.mapper.popup.sample.fulljson.PopupFullJsonSampleMapper;

/**
 * POL-14-03 : 서버 인계 예제
 * POL-13-03 : 적용·샘플 구분
 * ■ DTIY3117 전체 JSON 조회 샘플 Bean 구성
 * - in : popup.sample.full-json.* 설정(enabled·defaults-location)
 * - out: 기본값(PopupFullJsonDefaults)·샘플 서비스 Bean · 예외: IllegalStateException(기본값 파일 없음·검증 실패 → 기동 실패)
 * - 기본 비활성이며 {@code popup.sample.full-json.enabled=true}일 때만 등록한다. 기존 3111 샘플({@code popup.sample.single-query})과
 *   설정·Bean 이름이 겹치지 않아 둘을 동시에 켤 수 있다.
 *
 * <p>인수인계 문서: docs/interfaces/SERVER_SAMPLE_FULL_JSON_API.md</p>
 *
 * <pre>
 * popup:
 *   sample:
 *     full-json:
 *       enabled: true
 *       defaults-location: classpath:popup/sample/popup-full-json-defaults.yml   # [교체 지점] 기본값 파일 위치(file:... 가능)
 * </pre>
 */
@Configuration
@ConditionalOnProperty(prefix = "popup.sample.full-json", name = "enabled", havingValue = "true")
public class PopupFullJsonSampleConfig {

    static final String DEFAULT_LOCATION = "classpath:popup/sample/popup-full-json-defaults.yml";

    @Bean
    PopupFullJsonDefaults popupFullJsonDefaults(ResourceLoader resourceLoader, ObjectMapper objectMapper,
            @Value("${popup.sample.full-json.defaults-location:" + DEFAULT_LOCATION + "}") String location) throws IOException {
        Resource resource = resourceLoader.getResource(location);
        if (!resource.exists()) throw new IllegalStateException("3117 기본값 설정 파일이 없습니다: " + location);
        return PopupFullJsonDefaults.load(resource.getInputStream(), objectMapper, location);
    }

    @Bean
    PopupFullJsonSampleService popupFullJsonSampleService(PopupFullJsonSampleMapper mapper, ObjectMapper objectMapper,
                                                         PopupFullJsonDefaults popupFullJsonDefaults) {
        return new PopupFullJsonSampleService(mapper, objectMapper, popupFullJsonDefaults);
    }
}
