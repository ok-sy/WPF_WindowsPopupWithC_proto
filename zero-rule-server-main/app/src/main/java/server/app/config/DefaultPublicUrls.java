package server.app.config;

import java.util.Arrays;
import java.util.List;

public class DefaultPublicUrls {
    private static final List<String> urlPatterns = Arrays.asList(
        "/p/**",
        "/",
        "/favicon.ico",
        "/static/**",
        "/assets/**",
        "/auth/**",
        "/login/**",
        "/logout/**",
        "/admin/p/**",
        "/webjars/**",
        "/swagger-ui/**", // for swagger
        "/api/swagger-ui/**", // for swagger
        "/api/v2/api-docs/**", // for swagger
        "/swagger-ui.html", // for swagger
        "/webjars/**", // for swagger
        "/swagger-resources/**",// for swagger
        "/csrf",// for swagger
        "/html/**"
    );

    public static List<String> getUrlPatterns() {
        return urlPatterns;
    }

    public static String[] getUrlPatternsArray() {
        return urlPatterns.toArray(new String[0]);
    }
}
