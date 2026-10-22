package server.service.core.popup.sample;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

import server.repo.core.mapper.popup.sample.PopupSingleQuerySampleMapper;

/**
 * [TODO65] 단건 조회 샘플 Bean 구성. 기본 비활성이며 {@code popup.sample.single-query.enabled=true}일 때만 등록한다.
 *
 * <p>전달 건·문항 포트는 {@link ConditionalOnMissingBean}이라 실제 구현 Bean을 등록하면 샘플 구현 대신 사용된다.</p>
 *
 * <pre>
 * popup:
 *   sample:
 *     single-query:
 *       enabled: true
 *       file-base-url: http://localhost:8080/zero-rule-server/p/api/popups/files   # [교체 지점] 파일 URL 규칙
 *       polling-interval-seconds: 1800                                              # [교체 지점] 기존 폴링 설정
 * </pre>
 */
@Configuration
@ConditionalOnProperty(prefix = "popup.sample.single-query", name = "enabled", havingValue = "true")
public class PopupSingleQuerySampleConfig {

    @Bean
    PopupContentJsonParser popupSampleContentJsonParser(ObjectMapper objectMapper) {
        return new PopupContentJsonParser(objectMapper);
    }

    @Bean
    PopupPorts.FileUrlResolver popupSampleFileUrlResolver(
            @Value("${popup.sample.single-query.file-base-url:http://localhost:8080/zero-rule-server/p/api/popups/files}") String baseUrl) {
        return new PopupPorts.FileUrlResolver(baseUrl);
    }

    @Bean
    PopupSingleResponseAssembler popupSampleResponseAssembler(ObjectMapper objectMapper, PopupPorts.FileUrlResolver fileUrlResolver) {
        return new PopupSingleResponseAssembler(objectMapper, fileUrlResolver);
    }

    @Bean
    @ConditionalOnMissingBean(PopupPorts.DeliveryPort.class)
    PopupPorts.DeliveryPort popupSampleDeliveryPort(
            @Value("${popup.sample.single-query.polling-interval-seconds:1800}") int pollingIntervalSeconds) {
        return new PopupPorts.SampleDeliveryPort(pollingIntervalSeconds);
    }

    @Bean
    @ConditionalOnMissingBean(PopupPorts.QuestionPort.class)
    PopupPorts.QuestionPort popupSampleQuestionPort() {
        return new PopupPorts.UnconnectedQuestionPort();
    }

    @Bean
    PopupSingleQuerySampleService popupSingleQuerySampleService(PopupSingleQuerySampleMapper mapper, PopupContentJsonParser parser,
                                                               PopupSingleResponseAssembler assembler, PopupPorts.DeliveryPort deliveryPort,
                                                               PopupPorts.QuestionPort questionPort) {
        return new PopupSingleQuerySampleService(mapper, parser, assembler, deliveryPort, questionPort);
    }
}
