# zero-rule-server

## 20241210 스프링부트3 적용

### 변경사항

#### 스프링 시큐리티 6.x 버전 적용
- 대상 파일: `server.app.config.SecurityConfig.java`
  - `securityFilterChain()` 메서드 수정  
  - authorizeRequests 대신 authorizeHttpRequests를 사용해야 합니다.
  - 6.x에서는 빌더 패턴 대신 람다 스타일 설정을 권장합니다.
  - antMatchers가 requestMatchers로 대체되었습니다.
  - http.addFilterBefore 방식은 동일하게 유지됩니다.