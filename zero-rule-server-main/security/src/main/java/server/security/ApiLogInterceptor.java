package server.security;

import cl.cloverframework.ICLUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import server.service.core.CmmnService;

public class ApiLogInterceptor implements HandlerInterceptor {

    @Autowired
    private CmmnService cmmnService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        //시간을 가져온다
        long currentTime = System.currentTimeMillis();
        //현재시간을 모델에 넣는다.
        request.setAttribute("startTime", currentTime);

        return HandlerInterceptor.super.preHandle(request, response, handler);
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        HandlerInterceptor.super.postHandle(request, response, handler, modelAndView);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {

        // 현재 시간을 구한다
        long currentTime = System.currentTimeMillis();

        // 요청이 시작된 시간을 가져온다
        long beginTime = (long )request.getAttribute("startTime");

        // 현재 시간 - 요청이 시작된 시간 = 총 처리시간을 구한다
        long processedTime = currentTime - beginTime;


        // 사용자 인증정보 조회
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();

        ICLUserDetails userDetails = principal instanceof ICLUserDetails ? (ICLUserDetails)principal : null;

        long userId = 0;
        if(userDetails != null ) {
            userId= userDetails.getUserId();
        }

        cmmnService.createApiLog(request.getRequestURI(), String.valueOf(beginTime), String.valueOf(currentTime), String.valueOf(processedTime), userId);


        HandlerInterceptor.super.afterCompletion(request, response, handler, ex);
    }
}
