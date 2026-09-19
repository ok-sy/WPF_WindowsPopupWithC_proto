package server.app.config;

import com.google.common.collect.Lists;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.RememberMeAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import server.base.props.AuthHeaderProps;
import server.base.props.ServerSecurityProps;
import server.security.CustomAuthenticationFilter;

import java.util.ArrayList;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private AuthHeaderProps authHeaderProps;

    @Autowired
    private ServerSecurityProps serverSecurityProps;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public CustomAuthenticationFilter customAuthenticationFilter() {
        return new CustomAuthenticationFilter();
    }

    private CorsConfigurationSource corsConfiguration() {
        return request -> {
            CorsConfiguration a = new CorsConfiguration();
            a.setAllowCredentials(true);
            serverSecurityProps.getAllowedOrigins().forEach(a::addAllowedOrigin);
            a.addAllowedMethod(HttpMethod.POST);
            a.addAllowedMethod(HttpMethod.GET);
            a.addAllowedMethod(HttpMethod.OPTIONS);
            ArrayList<String> headers = Lists.newArrayList(
                "Content-Type",
                "Origin",
                "Accept",
                "Authorization",
                "Access-Control-Allow-Headers",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Methods",
                "Access-Control-Allow-Credentials",
                "Access-Control-Max-Age",
                "X-Requested-With"
            );
            headers.addAll(authHeaderProps.allHeaders());
            headers.forEach(a::addAllowedHeader);
            a.addExposedHeader("*");
            return a;
        };
    }


//    @Bean
//    public WebSecurityCustomizer configureWebSecurity() {
//        return (web) -> web.ignoring()
//            .antMatchers("/resources/**")
//            .antMatchers("/h2/**");
//    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()));

        http.headers(headers -> headers.httpStrictTransportSecurity(hsts -> hsts.disable()));
        http.cors(cors -> cors.configurationSource(corsConfiguration()));

        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.NEVER))
                .csrf(csrf -> csrf.disable())
                .formLogin(formLogin -> formLogin.disable())
                .httpBasic(httpBasic -> httpBasic.disable());

        http.authorizeHttpRequests(authorize -> authorize
                .requestMatchers(DefaultPublicUrls.getUrlPatternsArray()).permitAll()
                .requestMatchers("/resources/**").permitAll()
                .anyRequest().permitAll()

        );

        http.addFilterBefore(customAuthenticationFilter(), RememberMeAuthenticationFilter.class);
        return http.build();
    }
}
