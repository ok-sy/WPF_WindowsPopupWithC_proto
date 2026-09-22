package server.web.api.popup.wpf.version;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * {@link WpfClientVersionInterceptor}를 WPF 전용 경로({@code /p/api/wpf/**})에만 등록한다.
 *
 * <p>[추가 이유 — 설계 13 §5, 공통 프레임워크 변경 최소화] 공통 {@code server.app.config.WebMvcConfig}
 * (ApiLogInterceptor를 {@code /**}에 등록)는 손대지 않고, 같은 web 패키지 스캔 범위에 WebMvcConfigurer를
 * 하나 더 두는 추가형 방식이다. Spring MVC는 모든 WebMvcConfigurer 빈의 addInterceptors를 합쳐 적용한다.
 * 관리자 웹 API({@code /apis/**})나 다른 업무 API에는 영향이 없다.</p>
 */
@Configuration
public class WpfClientVersionWebConfig implements WebMvcConfigurer {

    private final WpfClientVersionInterceptor interceptor;

    public WpfClientVersionWebConfig(WpfClientVersionInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(interceptor)
                .addPathPatterns("/p/api/wpf/**");
    }
}
