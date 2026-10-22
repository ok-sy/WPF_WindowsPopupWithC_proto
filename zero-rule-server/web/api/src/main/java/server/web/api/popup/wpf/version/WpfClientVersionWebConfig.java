package server.web.api.popup.wpf.version;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * POL-15-02 : 인증·버전
 * ■ 클라이언트 버전 인터셉터 등록 설정
 * - in : WpfClientVersionInterceptor
 * - out: {@code /p/api/wpf/**} 경로에만 인터셉터 등록
 *
 * <p>공통 프레임워크 변경을 최소화한다. 공통 {@code server.app.config.WebMvcConfig}
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
