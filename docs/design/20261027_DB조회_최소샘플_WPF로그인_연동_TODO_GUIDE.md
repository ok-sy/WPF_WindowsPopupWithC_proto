# DB 조회 최소 샘플 · WPF 로그인 연동 TODO 가이드

기준일: 2026-10-27(KST). 기존 단건 조회 샘플과 로그인 연동의 실환경 이식 기록이다. 신규 TODO 번호는 부여하지 않는다.

## 범위와 확인 상태

목표는 `userId 입력 → MyBatis 단건 조회 → PopupContentRow → CNTN_CN 파싱 → 응답 조립 → WPF 팝업 표시`이다. 외부 백엔드 HTTP 중계·전달 이력 저장·설문 문항 조회는 이번 최소 테스트 범위에 넣지 않는다.

이 문서는 오늘 수동 적용한 변경과 후속 검증 TODO를 기록한다. 이 저장소의 Java/C# 소스에 해당 변경을 일괄 구현했다는 뜻은 아니다. 체크된 항목도 로컬 화면·적용 보고 기준이며, 실제 API 왕복·팝업 표시 성공을 대신하지 않는다.

## 1. Java 최소 구성

- [x] 중계용 BackendPopupClient·BackendResponseMapper·RelayBackendProperties 의존성을 조회 서비스·Controller에서 제거하는 방향 적용. 불필요한 중계 Bean 등록도 해제 후 기동 성공 확인.
- [x] PU001Service는 PU001Mapper와 ObjectMapper를 생성자로 받도록 정리. 기존 필드 주입과 중복 선언하지 않는다.
- [x] MyBatis 결과는 응답 record WpfPopupItem이 아닌 기존 조회 VO PopupContentRow로 받도록 변경.
- [x] PopupSingleResponseAssembler의 FileUrlResolver 필드·생성자 인자 제거와 내부 resolveFileUrl(path, fileName) 교체 적용 완료 보고.
- [ ] 서비스는 `new PopupSingleResponseAssembler(objectMapper)`로 조립기를 생성하고 단건 조회 메서드를 최종 검증한다. 별도 assembler Bean 등록은 필요 없다.
- [ ] 조회 결과가 없으면 `assembler.empty(1800)`을 반환한다. 조회 결과가 있으면 CNTN_CN을 ObjectNode로 파싱하고 `assemble(row, content, questions, deliveryId, 1800)`을 호출한다.
- [ ] 공백 CNTN_CN은 빈 객체로 처리하되 malformed JSON·객체 아닌 JSON은 명시적으로 실패시킨다. 실패를 정상 빈 팝업으로 숨기지 않는다.
- [ ] 테스트 deliveryId는 UUID로 생성한다. 전달 이력 저장·재사용은 구현하지 않았으며 결과 처리까지 갖춘 전달 식별 계약으로 간주하지 않는다.
- [ ] questions는 현재 빈 배열이므로 TEXT·IMAGE·VIDEO만 먼저 검증한다. SURVEY·QUIZ는 필수 문항 검증에서 거절되며 문항 연결은 별도 작업이다.
- [ ] Controller는 요청 객체의 userId를 받아 서비스로 전달하고 빈 값은 거절한다. 테스트 SQL에서 userId를 사용하지 않는 상태와 실제 대상자별 조회를 구분한다.
- [ ] PopupPorts 및 중계 설정은 전체 참조를 검색한 뒤 미사용 부분만 정리한다. 기존 공통 예외 처리·인증 필터를 제거하지 않는다.

### XML 별칭 확인

| DTIY3111 컬럼 | PopupContentRow 속성 |
|---|---|
| POPU_CNTN_ID | contentId |
| POPU_CNTN_TP_CD | contentTypeCode |
| HDR_TITL | headerTitle |
| POPU_WDTH_SZ / POPU_LNTH_SZ | width / height |
| AFTR_CNFM_OBJ_YN | afterConfirmYn |
| FTR_BTN_TP_CD / FTR_URL | footerButtonTypeCode / footerUrl |
| IMG_FILE_PATH_CN / IMG_FILE_NM | imageFilePath / imageFileName |
| VDO_FILE_PATH_CN / VDO_FILE_NM | videoFilePath / videoFileName |
| APND_FILE_ID | attachFileId |
| CNTN_CN | contentJson |

- [ ] resultType의 실제 패키지와 Java Mapper 반환형을 일치시킨다. XML은 기존 프로젝트의 매퍼 배치·로딩 방식을 유지한다.
- [ ] POPU_CNTN_NM은 관리용 이름이며 popupType으로 매핑하지 않는다. postId는 콘텐츠 ID와 임의로 동일시하지 않는다.
- [ ] 예시 코드 10~50·푸터 01~03은 실제 코드표와 대조한다.

## 2. 샘플 데이터 · 파일 URL

- [ ] 기존 `zero-rule-server/service/core/src/test/resources/sample/single-query/DTIY3111_sample_insert_oracle.sql`의 TEXT `SMP-TXT-01`부터 등록·COMMIT한다. 전체 실행 시 샘플 6건 DELETE 및 COMMIT이 포함되므로 대상 DB·범위를 먼저 확인한다.
- [ ] 임시 조회 조건 `WHERE POPU_CNTN_ID = 'SMP-TXT-01'`로 선택 행을 고정한다. 무정렬 FETCH FIRST는 대상 행이 보장되지 않는다. FETCH FIRST 사용 가능 여부는 현장 Oracle 버전과 대조한다.
- [ ] IMAGE 샘플 width/height NULL은 크기 미지정 테스트이다. ADAPTIVE 창 크기 테스트는 800×600 같은 정수를 명시하고, ORIGINAL 미지정 크기 테스트는 별도로 실제 표시를 확인한다.
- [ ] 내부 URL 함수는 HTTP(S) 디렉터리 URL + 원본 파일명만 지원하는 최소 구현이다. 경로 자체는 URL-safe이며 쿼리·fragment 없는 디렉터리, 파일명은 인코딩 전 단일 이름이라는 입력 조건을 확인한다.
- [ ] 기존 INSERT의 `popup/sample/image`, `popup/sample/video`는 상대경로이므로 최소 함수에 그대로 넣으면 URL이 생성되지 않는다. 실제 접근 가능한 파일 서버 디렉터리 URL로 교체하거나 content.imageUrl/videoUrl을 명시한다.
- [ ] 유효한 파일 URL이 생성되면 content URL보다 우선하고 생성하지 못하면 기존 content URL을 유지한다. 로컬 디스크 경로를 HTTP 주소로 오인하지 않는다.
- [ ] APND_FILE_ID는 현재 URL 생성에 미사용이다. 첨부 ID 방식이 필요하면 내부 URL 생성 지점을 실제 파일 서비스 규칙에 맞춘다.

## 3. WPF 실행 · 요청 확인

- [x] API Demo 실행은 파일명 변경이 아니라 실행 인자 `PopupSample.exe -Demo -Api`임을 확인.
- [ ] 일반 Demo와 API Demo를 구분한다. 일반 Demo의 SSO 테스트 기능은 API Demo에 자동 연결되지 않는다.
- [x] 요청 JSON의 키는 큰따옴표가 필요함을 확인. `{ "userId": "SAMPLE" }`로 테스트한다. JSON 입력 오류 시 서버로 요청하지 않는다.
- [ ] Java 매핑과 C# 실제 조회 경로를 동일하게 맞춘다. 대화의 확정안 `/api/PU001/PU01-01`과 현장 화면 `/api/PU001/P01-01`이 다르므로 일괄 완료로 기록하지 않는다.
- [ ] Base URL·context-path·리버스 프록시 경로를 합친 최종 Request URL을 확인한다. `/p`나 `/zero-rule-server`를 추측으로 삭제하지 않는다. HTTP/HTTPS 및 실제 실행 포트도 대조한다.
- [ ] JSON EOF 오류는 실행 폴더 appsettings.json 또는 버튼에 대응하는 요청·응답 JSON에서 닫는 괄호 누락을 확인한다. 오류만으로 대상 파일을 단정하지 않는다.

## 4. 실제 SSO 로그인 계약 반영

실제 로그인 응답 화면에서 body는 프로필 envelope이며, 토큰은 `x-custom-authorization` 응답 헤더에 담기는 것을 확인했다. 토큰·암호문·복호화 값은 문서에 저장하지 않는다.

- [x] WpfLoginClient.SendLoginAsync에서 2xx 확인 후 응답 헤더 `x-custom-authorization`을 먼저 읽는 코드 적용 화면 확인. 기존 body.accessToken 방식은 헤더 미검출 시 fallback이다.
- [ ] API Demo 로그인 방식도 WpfLoginClient를 사용하므로 재빌드한 EXE에서 헤더 토큰 추출이 적용되는지 검증한다. 직접 토큰 입력·일반 Demo SSO 조회는 별도 경로다.
- [ ] 실제 요청 DTO와 대조해 로그인 키를 `logonId`에서 `lgonId`로 맞춘다. API Demo 입력 JSON 및 DemoWindow.Api.cs의 기본 JSON도 함께 변경한다.
- [ ] 일반 모드 WpfLoginRequestDto의 LogonId에 `[JsonPropertyName("lgonId")]`를 지정한다. 익명 객체·직접 JSON 생성 경로가 있다면 실제 전송 키도 별도로 변경한다. C# 내부 변수 전체 치환은 하지 않는다.
- [ ] 로그인 Request 패널에서 실제 body 키가 lgonId인지 확인하고 서버 요청 DTO 바인딩까지 검증한다.
- [ ] 응답 헤더 이름이 요청 인증 헤더 이름을 의미하지는 않는다. 서버 인증 필터의 getHeader 및 Bearer 접두사 규칙을 확인한 뒤 조회·결과 전송 클라이언트를 맞춘다.
- [ ] 헤더 토큰 반환 코드가 ExpiresAt을 채우지 않는 문제를 해결한다. 기본값으로 인한 즉시 만료·반복 로그인 가능성을 확인하고 실제 만료 계약/JWT exp 및 기존 갱신 동작과 맞춘다. 임의 유효기간을 성공 계약으로 확정하지 않는다.
- [ ] 헤더 우선 반환 시 기존 만료 처리·로그인 성공 로그·응답 오류 처리의 누락 여부를 검토한다.
- [ ] 토큰 표시·마스킹 기능이 커스텀 헤더를 포함하는지 확인한다. 평문은 필요한 화면에서만 확인하고 로그·파일·문서·캡처에는 남기지 않는다.

### 로컬 복호화 진단

- [ ] `EncryptionInitializer.getInstance().Initialize()` 실패와 실제 decrypt 실패를 분리한다.
- [ ] 개발/로컬의 SSO 설정 경로·키 식별 및 버전·ssoZoneId·권한·SDK를 비교한다. 네이티브 오류면 DLL 경로와 JVM 비트수를 확인한다.
- [ ] 개발 환경에서 발급한 암호문이 로컬 환경에서 복호화 가능한지는 별도 확인한다. 키파일을 임의 반출하거나 인증을 해제해 해결하지 않는다.
- [ ] URL 404, 복호화 실패, 토큰 추출 실패, 인증된 조회 실패를 서로 다른 단계로 기록한다.

## 5. 완료 판정 순서

1. Java 기동 및 TEXT 한 건 조회·Row 매핑 확인.
2. 단건 응답 최상위 pollingIntervalSeconds/popup, 옵션 기본값·false/0 보존 확인.
3. WPF 실제 로그인 lgonId 바인딩·헤더 토큰 수신 확인.
4. 서버가 요구하는 인증 헤더로 조회 성공 및 TEXT 표시 확인.
5. HTTP 파일 URL 접근 확인 후 IMAGE·VIDEO 표시 확인.
6. 만료·401·재로그인·마스킹 회귀 확인. 결과 API·문항·전달 이력은 미구현 범위를 유지.

현재 미확인: 통합 왕복 성공, 최종 팝업 표시, 일반/API Demo 동시 회귀, 실제 만료 계약. 이 문서 추가만으로 해당 작업을 완료 처리하지 않는다.
