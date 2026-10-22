# TODO70 — 테이블 없이 백엔드와 통신하는 Java 조회 샘플 API

- 작성일: 2026-10-22 (KST)
- 상태: 서버 모듈 편입 샘플 구현 완료(mock 검증) / 실제 개발·검증계 백엔드 연계 대기
- 관련: TODO65 실테이블 조회 샘플, TODO69 프론트 샘플 페이지

## 확정 목적과 범위

Java 샘플 API가 테이블을 직접 조회하지 않고 담당 백엔드 API를 HTTP로 호출해 결과를 받아 전달하는 예제를 제공한다. '결과 조회'는 여기서 백엔드 호출의 조회 응답을 확인·전달하는 의미로 정리하며, 팝업 응답 제출·결과 저장 API를 새로 구현하는 범위로 확대하지 않는다.

호출 흐름: 클라이언트의 조회 요청 → Java 샘플 Controller/Service → 백엔드 HTTP API → 응답 파싱/필요한 매핑 → 클라이언트 반환.

TODO65의 SQL·ROWNUM·MyBatis·CLOB 직접 조회 예제와 별도 경로로 관리한다. 백엔드가 내부에서 DB를 쓰는지는 해당 담당자의 책임이며 이 Java 샘플은 DB 연결을 요구하지 않는다.

## 구현 TODO

- [x] 70-1. 실제 연계 대상 백엔드 URL·Method·요청 파라미터/본문·인증/필수 헤더·응답 envelope 및 JSON 예제를 확인하고 입출력 매핑표를 작성한다. 실제 경로·필드가 확정되기 전에는 예시값과 교체 위치를 표시한다.
- [x] 70-2. DB 없는 샘플 실행 구성을 제공한다. 기존 Spring/Java 버전과 HTTP 클라이언트를 우선 재사용하고 Controller→Service→HTTP client 경계를 나눈다. DataSource/JPA/MyBatis/DB 기반 인증 초기화가 따라와 접속을 요구하지 않도록 별도 프로파일 또는 최소 실행 모듈을 구성한다.
- [x] 70-3. 백엔드 base URL·경로·연결/응답 timeout을 설정으로 분리한다. 비밀값은 소스에 고정하지 않고 설정 주입 예제를 제공한다. 필요한 인증/헤더만 명시적으로 전달하고 응답 로그에서 토큰 등 민감값은 제외한다.
- [x] 70-4. 요청을 백엔드 계약에 맞게 전송하고 정상 응답 JSON을 ObjectMapper로 객체/기존 DTO에 파싱한다. 불필요한 JSON 문자열 이중 직렬화를 하지 않는다. 계약이 같으면 불필요한 구조 변환을 피하고, 다르면 별도 매핑 함수에 차이를 모은다.
- [x] 70-5. WPF 조회 용도로 연결하는 경우 기존 단건 popup·pollingIntervalSeconds 등 응답 계약에 맞게 조립한다. 프론트 샘플에서 쓰는 관리자 데이터 모델과 WPF 응답 모델을 혼동하지 않는다. 어떤 호출자와 연결할지는 실제 백엔드 계약 확인 단계에 문서화한다.
- [x] 70-6. 정상 데이터·조회 결과 없음·백엔드 4xx/5xx·연결 실패·timeout·잘못된 JSON을 구분해 반환하는 예제를 작성한다. 오류를 빈 정상 응답으로 덮지 않고 HTTP 상태/업무 코드 매핑은 기존 계약을 따른다. 자동 재시도를 임의 추가하지 않으며 전달 건 생성 등 부작용이 있는 조회의 중복 호출을 유발하지 않는다.
- [x] 70-7. 테이블 없이 테스트할 수 있는 고정 응답 mock HTTP 서버/스텁과 호출 예제를 제공한다. 실제 백엔드 URL로 교체하는 설정 및 실행 방법, curl 또는 PowerShell 요청 예제, 정상/없음/오류 응답을 인계 문서에 정리한다.
- [x] 70-8. 기존 서버의 전달 건 생성·대상/일정/완료/숨김·결과 중복 처리 정책을 이 샘플에 복제하지 않는다. 백엔드가 반환한 ID를 보존하고 담당 개발자가 교체·연결할 책임 경계를 명시한다.

## 검증 기준

- [x] DB 드라이버/접속 정보 없이 샘플을 기동하고 mock 백엔드에서 실제 HTTP 응답을 받아 조회 API로 반환한다.
- [x] 요청 Method·URL·필수 헤더·본문이 계약에 맞게 전달되는지 확인한다.
- [x] 중첩 content/questions·boolean false·숫자 0·null/누락이 의도한 계약대로 유지되고 객체가 문자열로 이중 인코딩되지 않는다.
- [x] 데이터 없음과 통신 실패가 구분되며 backend 4xx/5xx·timeout·JSON 오류에서 상태/본문이 일관되는지 확인한다.
- [ ] 실제 개발/검증계 백엔드 연결 여부와 클라이언트 역직렬화 확인 여부를 기록한다. mock 검증만으로 실연계 완료를 표시하지 않는다.

## 구현 결과 (2026-10-22)

인계 문서: `docs/interfaces/SERVER_SAMPLE_BACKEND_RELAY_API.md`(흐름·설정·실행·오류표·책임 범위·검증 상태).

- 위치(70-2): web-server 담당자 전달을 위해 기존 zero-rule-server `web/api` 모듈 `server.web.api.popup.sample.relay`에 편입(기존 Spring Boot 3.4.1·RestClient 재사용, 추가 의존성 없음). `popup.sample.relay.enabled=true`일 때만 등록, 오류 처리는 이 컨트롤러 한정. DB 없는 실행은 테스트 소스의 최소 부트 구성(`RelaySampleBootConfig`, 웹 MVC·Jackson·RestClient 자동 구성만)과 `PopupRelaySampleDevServer`(mock 동시 기동)로 제공.
- 70-1: 요청 `POST {path}` 본문 `{}` + Authorization·X-Client-Version(+선택 서비스 인증 헤더) → 응답 `{pollingIntervalSeconds, popup}` 매핑표. 실제 URL·envelope 미확정이라 예시값·교체 위치 표시.
- 70-3: base-url·path·connect/read timeout·인증 헤더 설정 분리, 비밀값 환경 변수 주입, 전달 헤더 화이트리스트, 로그에 토큰·키·본문 미기록.
- 70-4·5: readTree 1회, WPF 구조면 변환 없음, ENVELOPE 차이는 `unwrapEnvelope` 한 곳. WPF 조회 모델과 관리자 편집 모델 구분.
- 70-6: 없음(200 popup:null)과 실패 구분. 400/401/403·426 전달, 그 밖의 4xx·5xx·연결 실패·timeout·JSON 오류·계약 불일치는 500 WPF_INTERNAL + 진단 헤더. 자동 재시도 없음.
- 70-7·8: JDK HttpServer mock(시나리오 14종, 응답 파일 공유), 백엔드 ID 보존, 전달 건·정책 미복제.
- 작성 초기에는 독립 Gradle 빌드(`zero-rule-server/samples/`)로 만들었다가 담당자 패키지 전달 요건에 따라 기존 모듈로 옮기고 독립 빌드는 삭제(커밋 전).

## 검증 결과

- web/api `PopupRelayIntegrationTest` 9건·`BackendUnitTest` 3건 통과(DataSource·MyBatis Bean 없이 기동, mock 실제 HTTP). 서버 전체 `gradlew test --offline` 실패 0.
- WPF `PopupWindowTests` 399건 통과(신규: mock ok/survey 응답의 WPF 조회 DTO 역직렬화·PopupFactory 생성·false/0 보존).
- 이전 단계(독립 빌드)에서 bootJar + mock 백엔드 실기동 후 PowerShell 호출 200 응답 확인. 서버 모듈 이전 후 `PopupRelaySampleDevServer` IDE 실행은 미확인.
- 미실행(검증대기): 실제 개발/검증계 백엔드 연결, 실제 WPF 클라이언트를 중계 API에 연결한 실화면.
