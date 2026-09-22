# 팝업 시스템 인터페이스 설계서 — JSON 송수신 기준

- 문서 버전: 2.0 / 작성일: 2026-09-16, 최신화 2026-09-22 (KST)
- 대상: 관리자 웹 ↔ zero-rule-server ↔ WPF 팝업 클라이언트
- 기준: 현재 저장소 구현(커밋 기준 `main`). 설계서 예시는 가상 데이터이며 실운영 캡처가 아니다.
- 범위: **현행 WPF 전용 API 3개(WPF2-00~02)**, 관리자 API 6개, 공통 데이터 및 유형별 content. 로그인 화면·타 업무 API와 화면 배치 설계는 제외한다.
  구형 WPF API 6개(WPF-01~06)는 서버에 남아 있으나 현재 WPF가 호출하지 않으므로 **부록(§3-B)** 으로 옮겨 참고용으로만 둔다.
- 예제 모음: [popup-interface-examples.json](popup-interface-examples.json)(관리자·구형), [../../api/examples/](../../api/examples/)(현행 WPF: `wpf-popups-response.json`, `wpf-results-request.json`, `wpf-results-response.json`)
- 2.0 변경 요약(설계 문서 10·12·13·14 반영):
  - WPF 인증 흐름(SSO → 로그인 API → 메모리 토큰 → `Authorization: Bearer`)과 공통 헤더 `X-Client-Version`(426 Upgrade Required) 추가
  - 결과 API `/p/api/wpf/popups/results` 로 숨김·제출·영상·닫기 통합(CLOSED / HIDDEN / SUBMITTED / VIDEO_WATCHED)
  - 설문 필수 응답 검증·퀴즈 채점·영상 시청 완료 판정은 WPF 로컬 처리, 서버는 결과 저장 중심. QUIZ 목록 응답에 정답 키·passingScore 포함, 결과 항목에 score/passed 추가
  - content 공통 필드 headerFontSize / bodyFontSize / footerFontSize(관리자 폰트 크기) 추가

## 1. 공통 규약

| 항목 | 규약 |
|---|---|
| 기본 주소 예시 | http://localhost:8080/zero-rule-server |
| 본문 | UTF-8 JSON, Content-Type: application/json |
| 필드명 | camelCase, 이름과 대소문자 유지 |
| 현행 WPF API | `/p/api/wpf` 아래. 객체 직접 반환, body 래퍼 없음. 응답 날짜는 **ISO 8601 문자열**(`@JsonFormat`, 전역 epoch 설정 무시), 값 없는 필드 생략(NON_NULL) |
| 구형 WPF API | `/p/api/popups` 아래(부록 §3-B). 배열 또는 객체 직접 반환, 날짜는 epoch 초 |
| 관리자 API | /apis/popup 아래. 응답의 body에 업무 데이터 포함. 관리자 로그인/기존 권한 체계 사용 |
| 식별자 | popupId·userId는 문자열. questionId·optionId·templateId·responseId는 JSON 정수. resultId·clientRequestId는 WPF가 만드는 GUID 문자열 |
| 날짜 요청 | 시간대 포함 ISO 8601 문자열 권장. 예: 2026-09-16T09:00:00+09:00 |
| 날짜 응답(관리자·구형) | BasicConfig에서 WRITE_DATES_AS_TIMESTAMPS 사용. OffsetDateTime은 epoch 초 숫자(소수 가능). 예제는 정수 초. 웹/WPF는 ISO/epoch 호환 처리 |
| null | NON_NULL 설정으로 값 없는 응답 필드는 생략될 수 있음. 미제공을 오류나 0으로 단정하지 않음 |
| boolean | true/false. 관리자 목록 activeYn만 Y/N 문자열 |
| GET | 요청 JSON 본문 없음. 현행 WPF API는 userId를 보내지 않는다(인증 정보로 식별). 구형 API만 URL 쿼리 userId |

WPF 설정의 BaseUrl 예시는 http://localhost:8080/zero-rule-server/p 이며 클라이언트가 `/api/wpf/...`를 붙인다. /p를 중복해서 붙이지 않는다. 별도 popup-api 프로젝트의 /api/popups와 주 서버 경로를 혼용하지 않는다.

### 1.1 현행 WPF API 공통 헤더 (설계 04·10·13)

| 헤더 | 값 | 설명 |
|---|---|---|
| `Authorization` | `Bearer <token>` | 로그인 API(WPF2-00)가 발급한 토큰. 프로토타입에서는 서버 메모리 토큰(10분). 운영은 타 팀 통합 토큰으로 교체 예정이며 WPF 쪽 형태(`IAuthHeaderProvider`)는 동일 |
| `X-Client-Version` | `1.0.0` | WPF 실행 버전(csproj `<Version>`). 서버 `custom.wpf-client.minimum-supported-version` 미만이면 **426**. 헤더 없음도 426(`require-header=true`) |
| `X-Dev-User-Id` | 사번 | **개발 전용**. `custom.wpf-popup.dev-user-header=true` 프로파일에서만 사번 지정. 운영 없음 |

인증 흐름:

```text
WPF 시작
→ 사내 SSO GET(Windows 통합 인증, 프로세스당 최초 1회) → MAIN_USER_ID / MAIN_USER_CLASSI_CODE
→ POST /p/api/wpf/auth/login { logonId, classCode, linkYn }  (+ X-Client-Version)
→ { accessToken, tokenType, expiresAt }  → 메모리 보관
→ 이후 요청: Authorization: Bearer <token> + X-Client-Version
→ 401 이면 메모리 사용자 정보로 로그인 API만 재호출 후 원 요청(같은 body/resultId) 1회 재전송, 1시간마다 정기 재로그인
→ 426 이면 재로그인·재시도 없이 업데이트 안내(주기 조회 중단, pending 결과 보존)
```

### 1.2 현행 WPF API 오류 응답

| HTTP | code | 상황 |
|---|---|---|
| 400 | WPF_BAD_REQUEST | Bean Validation 실패, JSON 구문 오류, 서비스 검증(IllegalArgumentException) |
| 401 | WPF_UNAUTHORIZED | 토큰 없음·만료·사번 미확인 |
| 403 | WPF_USER_INACTIVE | APP_USER 없음 또는 ACTIVE_YN='N' |
| 426 | CLIENT_VERSION_NOT_SUPPORTED | 클라이언트 버전 미지원. 본문에 clientVersion / minimumSupportedVersion / latestVersion 포함 |
| 500 | WPF_INTERNAL | 서버 오류(메시지 비노출) |

```json
{ "code": "WPF_UNAUTHORIZED", "message": "인증 토큰이 없습니다.", "timestamp": "2026-09-22T09:00:00+09:00" }
```
```json
{ "code": "CLIENT_VERSION_NOT_SUPPORTED", "message": "WPF 클라이언트 업데이트가 필요합니다.",
  "clientVersion": "0.9.0", "minimumSupportedVersion": "1.0.0", "latestVersion": "1.0.0", "timestamp": "2026-09-22T09:00:00+09:00" }
```

관리자 정상 응답은 CLNewApiResponse를 사용한다. 아래 예시는 msgId와 body만 표시한 축약형이다. msgCn, msgClsf, msgPrntCd, msgKn, occrPrgNm, occrMethodNm, url 등의 부가 필드는 프레임워크/메시지 설정에 따라 달라진다. 정상 메시지 ID는 BE00000001을 요청하며 실제 메시지 레코드가 없으면 오류 응답이 될 수 있다. msgClsf가 ER이면 오류로 처리한다.

## 2. 인터페이스 목록

| ID | 기능 | HTTP | 경로 | 응답 업무 데이터 | 상태 |
|---|---|---|---|---|---|
| WPF2-00 | WPF 로그인(프로토타입 토큰 발급) | POST | /p/api/wpf/auth/login | 직접 객체 | **현행** (`custom.wpf-auth-prototype.enabled=true`일 때만 등록) |
| WPF2-01 | 표시 대상 팝업 목록(서버 판정 완료) | GET | /p/api/wpf/popups | 직접 객체 | **현행** |
| WPF2-02 | 결과 일괄 전송(닫기·숨김·제출·영상) | POST | /p/api/wpf/popups/results | 직접 객체 | **현행** |
| WPF-01 | 사용자 팝업 목록 | GET | /p/api/popups | 직접 배열/객체 | 구형·참고(현재 WPF 미사용) |
| WPF-02 | 팝업 숨김 | POST | /p/api/popups/{popupId}/hide | 직접 배열/객체 | 구형 → WPF2-02 HIDDEN |
| WPF-03 | 답안 제출 | POST | /p/api/popups/{popupId}/responses | 직접 배열/객체 | 구형 → WPF2-02 SUBMITTED |
| WPF-04 | 영상 진행률 | POST | /p/api/popups/{popupId}/video-progress | 직접 배열/객체 | 구형 → WPF2-02 VIDEO_WATCHED |
| WPF-05 | 표시·닫기 이벤트 | POST | /p/api/popups/{popupId}/events | 직접 배열/객체 | 구형 → WPF2-02 displayedAt/closedAt |
| WPF-06 | 사용자 상태 목록 | GET | /p/api/popups/statuses | 직접 배열/객체 | 구형·참고 |
| ADM-01 | 관리자 목록 | POST | /apis/popup/list | body 내부 객체 | 현행 |
| ADM-02 | 관리자 상세 | POST | /apis/popup/info | body 내부 객체 | 현행 |
| ADM-03 | 관리자 등록·수정 | POST | /apis/popup/save | body 내부 객체 | 현행 |
| ADM-04 | 활성 변경 | POST | /apis/popup/active | body 내부 객체 | 현행 |
| ADM-05 | 문항 템플릿 목록 | POST | /apis/popup/question-templates | body 내부 객체 | 현행 |
| ADM-06 | 문항 템플릿 상세 | POST | /apis/popup/question-template | body 내부 객체 | 현행 |

## 3. API별 요청·응답 JSON

POST 경로의 {popupId}는 실제 대상 팝업 ID로 치환한다. 예시의 ID는 실제 DB 등록값이 아니므로 그대로 실행하면 업무 검증에 실패할 수 있다.

## 3-A. 현행 WPF 전용 인터페이스 (WPF2-00 ~ WPF2-02)

설계 기준: 03_WPF_API_설계 · 10_SSO_토큰_프로토타입 · 12_결과제출_UX_및_로컬판정 · 13_클라이언트_버전_서버검증. 공통 헤더·오류는 §1.1·§1.2.
서버 구현: `web/api/.../popup/wpf/WpfPopupController.java`, `.../wpf/auth/WpfAuthController.java`, `.../wpf/version/WpfClientVersionInterceptor.java`.
WPF 구현: `popup-frameWork/Popup/Services/PopupApiService.cs`, `Services/Auth/WpfLoginClient.cs`, `Services/PopupResultQueue.cs`.

### WPF2-00 WPF 로그인 (프로토타입 토큰 발급)

**POST /p/api/wpf/auth/login** — 헤더 `X-Client-Version` 만(Authorization 이전 단계). `custom.wpf-auth-prototype.enabled=true`(로컬 프로파일)일 때만 존재하며 운영 인증(타 팀 통합 토큰)이 확정되면 대체된다.

| IN 필드 | 형식 | 필수 | 설명 |
|---|---|---|---|
| logonId | string | 필수 | SSO `MAIN_USER_ID`(사번) |
| classCode | string | 필수 | SSO `MAIN_USER_CLASSI_CODE` |
| linkYn | string | 선택 | 현재 "N" 고정 |

| OUT 필드 | 형식 | 설명 |
|---|---|---|
| accessToken | string | opaque 토큰. WPF는 메모리에만 보관(파일·레지스트리 저장 없음) |
| tokenType | string | "Bearer" |
| expiresAt | string(ISO 8601) | 만료 시각(기본 10분). 만료 후 401 → 재로그인 |

```json
{ "logonId": "E1001", "classCode": "10", "linkYn": "N" }
```
```json
{ "accessToken": "b7f3…", "tokenType": "Bearer", "expiresAt": "2026-09-22T09:10:00+09:00" }
```

### WPF2-01 표시 대상 팝업 목록

**GET /p/api/wpf/popups** — 헤더 `Authorization`, `X-Client-Version`. 요청 본문·쿼리 없음.

서버가 활성·기간·대상·숨김·**완료** 판정을 끝낸 최종 목록을 준다(WPF는 렌더링만). 공통 옵션·content·문항이 한 응답에 있어 추가 호출이 없다. 전체 예시: [api/examples/wpf-popups-response.json](../../api/examples/wpf-popups-response.json).

| OUT 필드 | 형식 | 설명 |
|---|---|---|
| serverTime | string(ISO) | 서버 시각(KST) |
| userId | string | 인증 정보로 식별한 사번 |
| pollingIntervalSeconds | integer | 다음 주기 조회 간격(서버 `custom.wpf-popup.polling-interval-seconds`, 기본 1800). appsettings 값보다 우선 |
| popups[] | array | 아래 항목. 없으면 [] |

popups[] 항목 — §4 공통 팝업 객체와 같은 평면 구조에서 `questionTemplateId`를 제외하고 다음이 다르다.

| 필드 | 형식 | 설명 |
|---|---|---|
| displayStartAt / displayEndAt | string(ISO 8601) | epoch가 아닌 문자열 |
| hideDays | integer(선택) | HIDDEN 결과의 기본 숨김 일수(없으면 WPF 30일) |
| completionRatio / allowCloseBeforeComplete | number / boolean | VIDEO 완료 판정(WPF 로컬) 기준 |
| passingScore | number(선택) | **QUIZ에만** 제공(설계 12). SURVEY·기타는 생략 |
| questions[] | array | 최상위에만 제공(content.questions 없음). **QUIZ에만** `options[].isCorrect`, `correctAnswer`, `answerMatchMode` 정답 키 포함 — WPF 로컬 채점용. SURVEY는 정답 키 없음 |
| content | object | §5 유형별 content + 공통 옵션(useBackgroundOverlay, backgroundOverlayOpacity, headerFontSize, bodyFontSize, footerFontSize). `passingScore`·`validateRequiredQuestions`·`questions` 키는 제거됨 |

WPF 처리 규칙(설계 11·12·14):
- FIXED 크기는 서버 값을 그대로 쓰지 않고 작업 영역 95% 이내로 최종 보정한다(Header/Footer가 화면 밖으로 밀리지 않도록).
- 폰트 크기(content.*FontSize)는 10~40으로 보정하고, 없으면 XAML 기본 크기.
- 필수 응답 검증·QUIZ 채점(정답 키·questionScore·passingScore)·영상 시청 완료(completionRatio) 판정은 WPF가 즉시 수행한다.

### WPF2-02 결과 일괄 전송

**POST /p/api/wpf/popups/results** — 헤더 `Authorization`, `X-Client-Version`. 요청 예시: [wpf-results-request.json](../../api/examples/wpf-results-request.json), 응답 예시: [wpf-results-response.json](../../api/examples/wpf-results-response.json).

WPF는 창이 닫힐 때 결과 항목 1개를 만들어 **먼저 로컬 파일 큐(`%LOCALAPPDATA%\Popup\pending-results.json`)에 저장하고 창을 닫은 뒤** 백그라운드로 전송한다(사용자 화면은 서버 응답을 기다리지 않음). 실패 항목은 파일에 남아 다음 조회 직전·다음 실행 시 같은 `resultId`로 재전송되며 서버는 `WPF_RESULT_RECEIPT.RESULT_ID`로 중복(DUPLICATE) 처리한다. 426이면 전송을 멈추고 항목을 보존한다.

| IN 필드 (요청) | 형식 | 필수 | 설명 |
|---|---|---|---|
| clientRequestId | string(≤100) | 필수 | 요청 단위 식별(로그). 전송마다 새로 생성 |
| sentAt | string(ISO) | 선택 | 전송 시각 |
| results[] | array(1~50) | 필수 | 결과 항목 |

| IN 필드 (results[]) | 형식 | 적용 유형 | 설명 |
|---|---|---|---|
| resultId | string(≤64, GUID) | 공통 | 멱등 키. 창이 열릴 때 확정, 재전송에도 동일 |
| popupId | string | 공통 | 대상 팝업 |
| resultType | string | 공통 | CLOSED / HIDDEN / SUBMITTED / VIDEO_WATCHED |
| displayedAt | string(ISO) | 공통(선택) | 최초 표시 시각. 있으면 표시 횟수 +1 |
| closedAt | string(ISO) | 공통(선택) | 닫힌 시각(제출은 제출 시각). 없으면 서버 수신 시각 |
| hideDays | integer(1~3650) | HIDDEN 필수 | 숨김 일수 |
| responseStartedAt | string(ISO) | SUBMITTED 선택 | 응답 시작 시각 |
| answers[] | array | SUBMITTED 필수 | `{ questionId, optionIds[] }` 또는 `{ questionId, textAnswer }` (기존 제출 API와 같은 구조) |
| score | number | SUBMITTED(QUIZ) 선택 | WPF 로컬 채점 점수(설계 12). 서버는 저장 시 자기 계산값과 다르면 경고 로그만 남김 |
| passed | boolean | SUBMITTED(QUIZ) 선택 | WPF 로컬 통과 여부 |
| video | object | VIDEO_WATCHED 필수 | `{ durationSeconds, positionSeconds, maximumPositionSeconds, watchedSeconds }` (초, 소수 가능) |

| OUT 필드 (응답) | 형식 | 설명 |
|---|---|---|
| receivedAt | string(ISO) | 서버 수신 시각 |
| results[] | array | 항목별 처리 결과(요청 순서) |

| OUT 필드 (results[]) | 형식 | 설명 |
|---|---|---|
| resultId / popupId / resultType | string | 요청 항목 식별 |
| status | string | ACCEPTED / DUPLICATE / REJECTED — 세 값 모두 "처리 종결"이므로 WPF는 큐에서 제거 |
| code / message | string(선택) | REJECTED 사유: WPF_NOT_ELIGIBLE, WPF_TYPE_MISMATCH, WPF_INVALID_ANSWER, WPF_INVALID_HIDE_DAYS, WPF_INVALID_VIDEO, WPF_INVALID_RESULT, WPF_INTERNAL |
| popupStatus / completed / completedAt / hiddenUntil | string / boolean / ISO / ISO(선택) | USER_POPUP_STATUS 반영 결과 |
| responseId | integer(선택) | SUBMITTED 저장 응답 ID |
| totalScore / passed | number / boolean(선택) | QUIZ SUBMITTED에서 서버 저장 계산값(참고). WPF는 이미 로컬 판정을 사용자에게 보여 준 뒤라 이 값을 기다리지 않는다 |
| watchedRatio / requiredRatio | number(선택) | VIDEO_WATCHED 저장 결과(참고) |

유형별 최소 항목 예:

```json
{ "resultId": "…", "popupId": "SAMPLE-TEXT-001", "resultType": "CLOSED",
  "displayedAt": "2026-09-19T09:00:05+09:00", "closedAt": "2026-09-19T09:00:40+09:00" }
```
```json
{ "resultId": "…", "popupId": "SAMPLE-TEXT-001", "resultType": "HIDDEN", "hideDays": 7 }
```
```json
{ "resultId": "…", "popupId": "SAMPLE-QUIZ-003", "resultType": "SUBMITTED",
  "answers": [ { "questionId": 1, "optionIds": [1] } ], "score": 10, "passed": true }
```
```json
{ "resultId": "…", "popupId": "SAMPLE-VIDEO-002", "resultType": "VIDEO_WATCHED",
  "video": { "durationSeconds": 540.0, "positionSeconds": 540.0, "maximumPositionSeconds": 540.0, "watchedSeconds": 531.5 } }
```

## 3-B. 부록 — 구형 WPF 인터페이스 (WPF-01 ~ WPF-06, 현재 WPF 미사용)

서버 `PopupController`(/p/api/popups/**)에 남아 있으며 WPF `PopupApiService`에도 호출 메서드가 남아 있으나 현재 실행 흐름(MainWindow → GetWpfPopupsAsync / PostResultsAsync)에서는 호출하지 않는다. 계약 참고용으로만 유지한다.

### (구형) WPF-01 사용자 팝업 목록

**GET /p/api/popups**

요청 본문 없음. 응답은 배열이며 body 래퍼 없음. 노출 가능한 팝업이 없으면 [].

요청 URL 예: /p/api/popups?userId=SAMPLE-USER-001 (본문 없음)

응답 예시:

```json
[
  {
    "popupId": "SAMPLE-TEXT-001",
    "popupType": "TEXT",
    "title": "공지사항",
    "displayStartAt": 1789516800,
    "displayEndAt": 1792108800,
    "displayMode": "SEQUENTIAL",
    "displayOrder": 100,
    "sizeMode": "FIXED",
    "width": 560,
    "height": 420,
    "widthRatio": 0.7,
    "heightRatio": 0.75,
    "minimumWidth": 480,
    "minimumHeight": 320,
    "maximumWidth": 1200,
    "maximumHeight": 900,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "periodMode": "FIXED",
    "allowCloseBeforeComplete": true,
    "questions": [],
    "content": {
      "contentTitle": "서비스 안내",
      "description": "공지 내용을 확인해 주세요.",
      "showContentHeader": true,
      "plainText": "서비스 점검 안내입니다.",
      "showPlainText": true,
      "highlightText": "작업 중인 내용을 저장해 주세요.",
      "showHighlight": true,
      "bottomDescription": "자세히 보기",
      "bottomDescriptionUrl": "https://example.com/notice",
      "showBottomDescription": true,
      "useBackgroundOverlay": true,
      "backgroundOverlayOpacity": 0.45
    }
  },
  {
    "popupId": "SAMPLE-QUIZ-001",
    "popupType": "QUIZ",
    "title": "확인 퀴즈",
    "displayStartAt": 1789516800,
    "displayEndAt": 1792108800,
    "displayMode": "SEQUENTIAL",
    "displayOrder": 100,
    "sizeMode": "FIXED",
    "width": 560,
    "height": 420,
    "widthRatio": 0.7,
    "heightRatio": 0.75,
    "minimumWidth": 480,
    "minimumHeight": 320,
    "maximumWidth": 1200,
    "maximumHeight": 900,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "periodMode": "FIXED",
    "allowCloseBeforeComplete": true,
    "questions": [
      {
        "questionId": 101,
        "title": "안내를 확인했습니까?",
        "description": "한 개를 선택하세요.",
        "questionType": "SINGLE_CHOICE",
        "isRequired": true,
        "isScored": true,
        "questionScore": 10,
        "sortOrder": 1,
        "options": [
          {
            "optionId": 1001,
            "value": "YES",
            "text": "예",
            "sortOrder": 1
          },
          {
            "optionId": 1002,
            "value": "NO",
            "text": "아니요",
            "sortOrder": 2
          }
        ]
      }
    ],
    "content": {
      "surveyTitle": "안내 확인",
      "description": "문항에 응답해 주세요.",
      "questions": [
        {
          "questionId": 101,
          "title": "안내를 확인했습니까?",
          "description": "한 개를 선택하세요.",
          "questionType": "SINGLE_CHOICE",
          "isRequired": true,
          "isScored": true,
          "questionScore": 10,
          "sortOrder": 1,
          "options": [
            {
              "optionId": 1001,
              "value": "YES",
              "text": "예",
              "sortOrder": 1
            },
            {
              "optionId": 1002,
              "value": "NO",
              "text": "아니요",
              "sortOrder": 2
            }
          ]
        }
      ],
      "useBackgroundOverlay": true,
      "backgroundOverlayOpacity": 0.45
    },
    "questionTemplateId": 10,
    "passingScore": 10
  }
]
```

### (구형) WPF-02 팝업 숨김

**POST /p/api/popups/{popupId}/hide**

userId 필수, hideDays 필수 정수 1~3650. hiddenUntil은 서버/DB 계산 결과.

요청 본문:

```json
{
  "userId": "SAMPLE-USER-001",
  "hideDays": 1
}
```

응답 예시:

```json
{
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-TEXT-001",
  "hideType": "UNTIL",
  "hiddenUntil": 1789603200
}
```

### (구형) WPF-03 답안 제출

**POST /p/api/popups/{popupId}/responses**

clientRequestId·userId·answers 필수. answers는 1개 이상, questionId 필수. responseStartedAt 선택. 선택형은 optionIds, 주관식은 textAnswer 사용. 실제 조회된 문항/선택지 ID를 사용. 점수는 보내지 않음.

요청 본문:

```json
{
  "clientRequestId": "example-request-001",
  "userId": "SAMPLE-USER-001",
  "responseStartedAt": "2026-09-16T09:00:00+09:00",
  "answers": [
    {
      "questionId": 101,
      "optionIds": [
        1001
      ]
    }
  ]
}
```

응답 예시:

```json
{
  "responseId": 5001,
  "clientRequestId": "example-request-001",
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-QUIZ-001",
  "responseStatus": "SUBMITTED",
  "totalScore": 10,
  "passed": true,
  "submittedAt": 1789516860
}
```

### (구형) WPF-04 영상 진행률

**POST /p/api/popups/{popupId}/video-progress**

모든 요청 항목 필수. durationSeconds >= 0.001, 나머지 시간 >= 0. 단위 초. 서버의 completed를 완료 판단 기준으로 사용.

요청 본문:

```json
{
  "userId": "SAMPLE-USER-001",
  "durationSeconds": 100,
  "positionSeconds": 95,
  "maximumPositionSeconds": 95,
  "watchedSeconds": 95
}
```

응답 예시:

```json
{
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-VIDEO-001",
  "watchedRatio": 0.95,
  "requiredRatio": 0.9,
  "completed": true,
  "completedAt": 1789516895
}
```

### (구형) WPF-05 표시·닫기 이벤트

**POST /p/api/popups/{popupId}/events**

userId·eventType 필수. eventType은 DISPLAYED 또는 CLOSED.

요청 본문:

```json
{
  "userId": "SAMPLE-USER-001",
  "eventType": "DISPLAYED"
}
```

응답 예시:

```json
{
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-TEXT-001",
  "eventType": "DISPLAYED",
  "recordedAt": 1789516800
}
```

### (구형) WPF-06 사용자 상태 목록

**GET /p/api/popups/statuses**

요청 본문 없음. closedAt·hiddenUntilAt·completedAt은 해당 값이 있을 때 제공.

요청 URL 예: /p/api/popups/statuses?userId=SAMPLE-USER-001 (본문 없음)

응답 예시:

```json
[
  {
    "userId": "SAMPLE-USER-001",
    "popupId": "SAMPLE-TEXT-001",
    "popupStatus": "DISPLAYED",
    "firstDisplayedAt": 1789516800,
    "lastDisplayedAt": 1789516800,
    "displayCount": 1,
    "completed": false
  }
]
```

## 3-C. 관리자 인터페이스 (ADM-01 ~ ADM-06)

### ADM-01 관리자 목록

**POST /apis/popup/list**

별도 필터·페이지 요청 필드 없음. 비활성·기간 만료 포함. activeYn은 Y/N 문자열. questionTemplateId는 설정된 경우 제공.

요청 본문:

```json
{}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popups": [
      {
        "popupId": "SAMPLE-TEXT-001",
        "popupType": "TEXT",
        "title": "공지사항",
        "displayStartAt": 1789516800,
        "displayEndAt": 1792108800,
        "displayMode": "SEQUENTIAL",
        "displayOrder": 100,
        "sizeMode": "FIXED",
        "activeYn": "Y",
        "periodMode": "FIXED",
        "createdBy": "SAMPLE-ADMIN",
        "createdAt": 1789516800,
        "updatedBy": "SAMPLE-ADMIN",
        "updatedAt": 1789516800
      }
    ]
  }
}
```

### ADM-02 관리자 상세

**POST /apis/popup/info**

popupId 필수 1~50자. 정답 포함 문항은 popup.questions 및 adminQuestions에서 확인. 예시는 TEXT라 빈 배열.

요청 본문:

```json
{
  "popupId": "SAMPLE-TEXT-001"
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popup": {
      "popupId": "SAMPLE-TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
      "displayStartAt": 1789516800,
      "displayEndAt": 1792108800,
      "displayMode": "SEQUENTIAL",
      "displayOrder": 100,
      "sizeMode": "FIXED",
      "width": 560,
      "height": 420,
      "widthRatio": 0.7,
      "heightRatio": 0.75,
      "minimumWidth": 480,
      "minimumHeight": 320,
      "maximumWidth": 1200,
      "maximumHeight": 900,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "periodMode": "FIXED",
      "allowCloseBeforeComplete": true,
      "questions": [],
      "content": {
        "contentTitle": "서비스 안내",
        "description": "공지 내용을 확인해 주세요.",
        "showContentHeader": true,
        "plainText": "서비스 점검 안내입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://example.com/notice",
        "showBottomDescription": true,
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    },
    "adminQuestions": [],
    "targetGroups": [
      {
        "targetName": "예시 사용자",
        "targetDescription": "설계서 예시",
        "conditions": [
          {
            "conditionType": "EMPLOYEE",
            "conditionOperator": "=",
            "value": "SAMPLE-USER-001",
            "includeChild": false
          }
        ]
      }
    ]
  }
}
```

### ADM-03 관리자 등록·수정

**POST /apis/popup/save**

popup·active·targetGroups 필수. 같은 popupId는 수정. 활성 저장 시 대상 그룹 1개 이상. 저장 응답은 body.popup이며 대상 그룹/active를 별도 반환하지 않음.

요청 본문:

```json
{
  "popup": {
    "popupId": "SAMPLE-TEXT-001",
    "popupType": "TEXT",
    "title": "공지사항",
    "displayStartAt": "2026-09-16T09:00:00+09:00",
    "displayEndAt": "2026-10-16T09:00:00+09:00",
    "displayMode": "SEQUENTIAL",
    "displayOrder": 100,
    "sizeMode": "FIXED",
    "width": 560,
    "height": 420,
    "widthRatio": 0.7,
    "heightRatio": 0.75,
    "minimumWidth": 480,
    "minimumHeight": 320,
    "maximumWidth": 1200,
    "maximumHeight": 900,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "periodMode": "FIXED",
    "allowCloseBeforeComplete": true,
    "questions": [],
    "content": {
      "contentTitle": "서비스 안내",
      "description": "공지 내용을 확인해 주세요.",
      "showContentHeader": true,
      "plainText": "서비스 점검 안내입니다.",
      "showPlainText": true,
      "highlightText": "작업 중인 내용을 저장해 주세요.",
      "showHighlight": true,
      "bottomDescription": "자세히 보기",
      "bottomDescriptionUrl": "https://example.com/notice",
      "showBottomDescription": true,
      "useBackgroundOverlay": true,
      "backgroundOverlayOpacity": 0.45
    }
  },
  "active": true,
  "targetGroups": [
    {
      "targetName": "예시 사용자",
      "targetDescription": "설계서 예시",
      "conditions": [
        {
          "conditionType": "EMPLOYEE",
          "conditionOperator": "=",
          "value": "SAMPLE-USER-001",
          "includeChild": false
        }
      ]
    }
  ]
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popup": {
      "popupId": "SAMPLE-TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
      "displayStartAt": 1789516800,
      "displayEndAt": 1792108800,
      "displayMode": "SEQUENTIAL",
      "displayOrder": 100,
      "sizeMode": "FIXED",
      "width": 560,
      "height": 420,
      "widthRatio": 0.7,
      "heightRatio": 0.75,
      "minimumWidth": 480,
      "minimumHeight": 320,
      "maximumWidth": 1200,
      "maximumHeight": 900,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "periodMode": "FIXED",
      "allowCloseBeforeComplete": true,
      "questions": [],
      "content": {
        "contentTitle": "서비스 안내",
        "description": "공지 내용을 확인해 주세요.",
        "showContentHeader": true,
        "plainText": "서비스 점검 안내입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://example.com/notice",
        "showBottomDescription": true,
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    }
  }
}
```

### ADM-04 활성 변경

**POST /apis/popup/active**

popupId 필수 1~50자, active 필수 boolean. 목록 조회의 activeYn과 형식이 다름.

요청 본문:

```json
{
  "popupId": "SAMPLE-TEXT-001",
  "active": false
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popup": {
      "popupId": "SAMPLE-TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
      "displayStartAt": 1789516800,
      "displayEndAt": 1792108800,
      "displayMode": "SEQUENTIAL",
      "displayOrder": 100,
      "sizeMode": "FIXED",
      "width": 560,
      "height": 420,
      "widthRatio": 0.7,
      "heightRatio": 0.75,
      "minimumWidth": 480,
      "minimumHeight": 320,
      "maximumWidth": 1200,
      "maximumHeight": 900,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "periodMode": "FIXED",
      "allowCloseBeforeComplete": true,
      "questions": [],
      "content": {
        "contentTitle": "서비스 안내",
        "description": "공지 내용을 확인해 주세요.",
        "showContentHeader": true,
        "plainText": "서비스 점검 안내입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://example.com/notice",
        "showBottomDescription": true,
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    }
  }
}
```

### ADM-05 문항 템플릿 목록

**POST /apis/popup/question-templates**

요청 필드 없음. templateId는 정수.

요청 본문:

```json
{}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "templates": [
      {
        "templateId": 10,
        "templateName": "확인 퀴즈",
        "templateType": "QUIZ"
      }
    ]
  }
}
```

### ADM-06 문항 템플릿 상세

**POST /apis/popup/question-template**

templateId 필수 정수. correctValues는 optionId가 아닌 선택지 value 문자열 목록. 주관식 정답은 question.correctAnswer.

요청 본문:

```json
{
  "templateId": 10
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "adminQuestions": [
      {
        "question": {
          "questionId": 101,
          "title": "안내를 확인했습니까?",
          "description": "한 개를 선택하세요.",
          "questionType": "SINGLE_CHOICE",
          "isRequired": true,
          "isScored": true,
          "questionScore": 10,
          "sortOrder": 1,
          "options": [
            {
              "optionId": 1001,
              "value": "YES",
              "text": "예",
              "sortOrder": 1,
              "isCorrect": true
            },
            {
              "optionId": 1002,
              "value": "NO",
              "text": "아니요",
              "sortOrder": 2,
              "isCorrect": false
            }
          ]
        },
        "correctValues": [
          "YES"
        ]
      }
    ]
  }
}
```

## 4. 공통 팝업 객체 필드 정의

관리자 저장은 popup 객체에 아래 항목을 전송한다. 필수는 서비스 검증 기준이며 표시 여부와 관계없이 크기 수치는 유효한 양수가 필요하다. 응답의 선택 항목은 생략될 수 있다.

| 필드 | JSON 형식 | 저장 시 | 설명 |
|---|---|---|---|
| popupId | string | 필수 | 1~50자, 등록/수정 키 |
| popupType | string | 필수 | TEXT, IMAGE, VIDEO, SURVEY, QUIZ |
| title | string | 필수 | 1~200자 |
| displayStartAt / displayEndAt | string(요청), number(응답) | 필수 | 시작·종료. 구현은 종료 < 시작을 거절하므로 같은 시각은 허용 |
| displayMode | string | 필수 | SEQUENTIAL, SIMULTANEOUS |
| displayOrder | integer | 선택 | 생략/null 시 100으로 처리, 지정 시 1 이상. 작은 값 우선 |
| sizeMode | string | 필수 | FIXED, RATIO, FULLSCREEN |
| width / height | number | 필수 | 창 너비·높이, 0보다 큰 유한값 |
| widthRatio / heightRatio | number | 필수 | 화면 비율, 서버 검증은 0보다 큰 유한값 |
| minimumWidth / minimumHeight | number | 필수 | 최소 크기, 양수 |
| maximumWidth / maximumHeight | number | 필수 | 최대 크기, 각 최소값 이상 |
| showHeader / showCloseButton / showFooter / showDoNotShowAgain | boolean | 명시 권장 | 화면 표시 플래그. Java primitive라 누락 시 false가 될 수 있음 |
| questionTemplateId | integer | 선택 | 설문/퀴즈 템플릿. 저장 과정에서 재사용 또는 새 ID 생성 가능 |
| periodMode | string | 필수 | 현재 웹 신규 기본값 FIXED. 서버는 빈 값 여부 검사 |
| repeatInterval | integer | 선택 | 반복 주기 값 |
| repeatDayOfWeek | string | 선택 | 반복 요일 값 |
| repeatDayOfMonth | integer | 선택 | 반복 일자 값 |
| hideDays | integer | 선택 | 지정 시 1 이상. 숨김 API 별도 제한은 1~3650 |
| completionRatio | number | 선택 | 영상 완료 비율 0~1 |
| passingScore | number | 선택 | 통과 점수 0 이상. 저장 정책상 QUIZ에서 사용 |
| allowCloseBeforeComplete | boolean | 명시 권장 | 완료 전 닫기 허용 |
| questions | array | 유형별 | TEXT/IMAGE/VIDEO는 빈 배열. 설문/퀴즈 문항 저장 원본 |
| content | object | 유형별 | 유형별 콘텐츠 및 배경 옵션. 없으면 빈 객체로 보정 |

반복 필드의 조합별 허용값은 별도 업무 정책 확정이 필요하다. 이 문서는 구현에서 확인되지 않은 요일 코드나 반복 enum을 임의로 정의하지 않는다.

## 5. content 유형별 계약

content는 확장 JSON 객체로 저장된다. 아래 예시는 현재 사용하는 필드 집합이다. 좌우 카드 및 additionalDescription은 현재 화면/DTO에서 제거된 옵션이며 신규 연동에 사용하지 않는다. 기존 DB JSON에 남은 과거 키의 자동 삭제·변환은 수행하지 않는다.

| 공통 필드 | 형식 | 설명 |
|---|---|---|
| useBackgroundOverlay | boolean | 배경 클릭 차단 사용. 웹 신규 기본 true |
| backgroundOverlayOpacity | number | 배경 어둡기 0~1. 웹 신규 기본 0.45 |
| headerFontSize | number(선택) | [설계 14] WPF Header 제목 글자 크기(px/DIP). 10~40. 없으면 XAML 기본 17 |
| bodyFontSize | number(선택) | [설계 14] 본문 글자 크기. 10~40. 없으면 유형별 기본(TEXT 15, IMAGE·VIDEO 설명 14, 설문 선택지 12 — 문항 제목/설명은 +4/+1 상대 유지) |
| footerFontSize | number(선택) | [설계 14] Footer("다시 보지 않기"·닫기 버튼) 글자 크기. 10~40. 없으면 기본 14 |

폰트 크기 3개는 별도 DB 컬럼 없이 CONTENT_OPTIONS JSON으로 저장·전달된다. 서버 저장 검증(`PopupService.validateFontSizeOptions`)과 WPF 최종 Clamp(`PopupWindow.ApplyFontSizes`) 모두 10~40 범위이며, 기존 데이터에 값이 없으면 이전과 동일하게 표시된다.

### TEXT

```json
{
  "contentTitle": "서비스 안내",
  "description": "공지 내용을 확인해 주세요.",
  "showContentHeader": true,
  "plainText": "서비스 점검 안내입니다.",
  "showPlainText": true,
  "highlightText": "작업 중인 내용을 저장해 주세요.",
  "showHighlight": true,
  "bottomDescription": "자세히 보기",
  "bottomDescriptionUrl": "https://example.com/notice",
  "showBottomDescription": true,
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### IMAGE

```json
{
  "imageTitle": "이미지 안내",
  "description": "이미지 설명",
  "imageUrl": "https://example.com/notice.png",
  "showDescription": true,
  "imageSizeMode": "ADAPTIVE",
  "imageWidth": 640,
  "imageHeight": 480,
  "linkUrl": "https://example.com/notice",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### VIDEO

```json
{
  "videoTitle": "교육 영상",
  "description": "영상을 확인하세요.",
  "videoUrl": "http://localhost:8080/zero-rule-server/p/api/popups/video?path=sample.mp4",
  "showDescription": true,
  "showControls": true,
  "allowFullScreen": true,
  "allowPlaybackRateChange": true,
  "autoPlay": false,
  "isLoop": false,
  "defaultVolume": 0.7,
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### SURVEY

```json
{
  "surveyTitle": "설문",
  "description": "의견을 입력해 주세요.",
  "questions": [
    {
      "questionId": 102,
      "title": "의견",
      "description": "자유롭게 입력하세요.",
      "questionType": "TEXT",
      "isRequired": true,
      "isScored": false,
      "sortOrder": 1,
      "options": []
    }
  ],
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### QUIZ

```json
{
  "surveyTitle": "안내 확인",
  "description": "문항에 응답해 주세요.",
  "questions": [
    {
      "questionId": 101,
      "title": "안내를 확인했습니까?",
      "description": "한 개를 선택하세요.",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": true,
      "questionScore": 10,
      "sortOrder": 1,
      "options": [
        {
          "optionId": 1001,
          "value": "YES",
          "text": "예",
          "sortOrder": 1
        },
        {
          "optionId": 1002,
          "value": "NO",
          "text": "아니요",
          "sortOrder": 2
        }
      ]
    }
  ],
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

TEXT: bottomDescription은 표시 문구, bottomDescriptionUrl은 클릭 이동 주소. 웹은 https:// 생략 주소를 보정해 저장하고 미리보기에도 동일하게 적용한다. showBottomDescription=true에서 문구가 비어 있으면 URL을 표시한다. URL을 비우면 일반 설명이며 HTTP/HTTPS만 링크로 사용한다. (Markdown 모드는 2026-09-21 제거 — markdownMode/markdownContent 필드는 무시된다.)

IMAGE: imageSizeMode는 FIXED, FIT_TO_IMAGE, ADAPTIVE, FILL. imageWidth/imageHeight는 숫자. linkUrl은 이미지 클릭 이동 주소이다.

VIDEO: defaultVolume은 0~1 숫자, 나머지 재생/표시 플래그는 boolean. completionRatio 및 allowCloseBeforeComplete는 최상위 popup 필드이다. 재생 옵션의 모든 WPF 실제 강제 동작은 별도 UI 검증 대상이며 JSON 전달과 구분한다.

SURVEY/QUIZ: 관리자 조회 응답과 구형 WPF-01은 최상위 questions와 content.questions에 문항을 함께 제공한다(현행 WPF2-01은 최상위 questions만). 관리자 저장 시 최상위 questions를 기준으로 처리하므로 두 배열을 서로 다르게 편집하지 않는다. content.passingScore는 관리자·구형 응답에만 있고 현행 WPF2-01은 최상위 passingScore(QUIZ만)로 준다.

## 6. 문항·선택지 및 정답

| 필드 | 형식 | 설명 |
|---|---|---|
| questionId | integer | 문항 ID. 응답 제출에서는 서버가 발급한 ID 필수 |
| title / description | string | 문항 제목 / 설명(선택) |
| questionType | string | SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT; WPF/기존 문항은 RATING5도 처리 |
| isRequired / isScored | boolean | 필수 응답 / 채점 여부 |
| questionScore | number | 배점, 해당 시 제공 |
| sortOrder | integer | 표시 순서 |
| options | array | 선택지 목록. TEXT는 [] |
| options[].optionId | integer | 선택지 ID. 제출 optionIds는 이 값을 사용 |
| options[].value / text | string | 저장 값 / 표시 문구 |
| options[].sortOrder | integer | 선택지 순서 |
| options[].isCorrect | boolean | 정답 여부. 관리자 응답과 **현행 WPF 목록(WPF2-01)의 QUIZ 팝업**에 제공. SURVEY·구형 WPF-01에서는 제외 |
| correctAnswer | string | 주관식 정답. 위와 같은 범위 |
| answerMatchMode | string | EXACT 또는 CONTAINS. 위와 같은 범위 |

[설계 12] WPF 로컬 채점 규칙(서버 `PopupService.gradeAnswer`와 동일): 채점 문항(isScored)만 계산. 선택형은 선택 집합 == isCorrect 집합일 때 questionScore 전부(부분 점수 없음). 서술형은 answerMatchMode EXACT(trim 후 완전 일치)/CONTAINS(포함). 통과 = 총점 ≥ passingScore(없으면 0). 결과는 WPF2-02 `score`/`passed`로 전송된다.

관리자 정답 문항 예시:

```json
{
  "question": {
    "questionId": 101,
    "title": "안내를 확인했습니까?",
    "description": "한 개를 선택하세요.",
    "questionType": "SINGLE_CHOICE",
    "isRequired": true,
    "isScored": true,
    "questionScore": 10,
    "sortOrder": 1,
    "options": [
      {
        "optionId": 1001,
        "value": "YES",
        "text": "예",
        "sortOrder": 1,
        "isCorrect": true
      },
      {
        "optionId": 1002,
        "value": "NO",
        "text": "아니요",
        "sortOrder": 2,
        "isCorrect": false
      }
    ]
  },
  "correctValues": [
    "YES"
  ]
}
```

주관식 제출 항목 예시:

```json
{
  "questionId": 102,
  "textAnswer": "확인했습니다.",
  "optionIds": []
}
```

답안 저장은 서버 DB의 정답과 배점을 기준으로 판정한다. 현재 구현은 사용자·팝업 조합으로 upsert하고 기존 답안 상세를 교체한다. clientRequestId만으로 매번 별도 응답 이력이 생성되거나 모든 재전송이 무조건 허용된다고 가정하면 안 된다. 제출 시 노출 자격을 다시 검사한다.

## 7. 노출 대상 JSON

```json
[
  {
    "targetName": "예시 사용자",
    "targetDescription": "설계서 예시",
    "conditions": [
      {
        "conditionType": "EMPLOYEE",
        "conditionOperator": "=",
        "value": "SAMPLE-USER-001",
        "includeChild": false
      }
    ]
  }
]
```

| 필드 | 형식 | 규칙 |
|---|---|---|
| targetName / targetDescription | string | 그룹 이름·설명 |
| conditions | array | 각 그룹에 1개 이상 |
| conditionType | string | DEPARTMENT, POSITION, EMPLOYEE, HIRE_DATE |
| conditionOperator | string | 부서/직급/사번은 = 또는 !=. 입사일은 =, !=, <, <=, >, >= |
| value | string | 부서/직급/사번은 30자 이내. 입사일은 YYYY-MM-DD |
| includeChild | boolean | DEPARTMENT에서만 하위 포함으로 적용 |

같은 그룹의 조건은 AND, 그룹 사이는 OR이다. active=true인 저장은 최소 한 개의 그룹이 필요하다. active=false일 때 targetGroups=[]를 보낼 수 있지만 필드 자체는 필수이다.

## 8. 응답 결과 필드

| 응답 | 필드 및 형식 |
|---|---|
| **결과 일괄(WPF2-02, 현행)** | receivedAt:ISO, results[]: resultId/popupId/resultType/status(ACCEPTED·DUPLICATE·REJECTED), code/message(선택), popupStatus, completed, completedAt, hiddenUntil, responseId, totalScore, passed, watchedRatio, requiredRatio (모두 선택) — §3-A |
| 숨김(구형) | userId:string, popupId:string, hideType:string(UNTIL), hiddenUntil:날짜 |
| 제출 | responseId:integer, clientRequestId:string, userId:string, popupId:string, responseStatus:string(SUBMITTED), totalScore:number, passed:boolean, submittedAt:날짜 |
| 영상 | userId:string, popupId:string, watchedRatio:number, requiredRatio:number, completed:boolean, completedAt:날짜(선택) |
| 이벤트 | userId:string, popupId:string, eventType:string, recordedAt:날짜 |
| 상태 | userId:string, popupId:string, popupStatus:string, firstDisplayedAt/lastDisplayedAt/closedAt/hiddenUntilAt/completedAt:날짜(선택), displayCount:integer, completed:boolean |
| 관리자 목록 | popupId/popupType/title/displayMode/sizeMode/periodMode:string, displayOrder:integer, activeYn:string(Y/N), displayStartAt/displayEndAt/createdAt/updatedAt:날짜, createdBy/updatedBy:string, questionTemplateId:integer(선택) |
| 템플릿 목록 | templateId:integer, templateName:string, templateType:string |

상태 문자열의 구현 예: DISPLAYED, CLOSED, HIDDEN, SUBMITTED, COMPLETED. 완료 여부 판단은 completed를 함께 사용한다. 날짜 형식은 1절 규약을 따른다.

## 9. 오류와 JSON 외 인터페이스

- Bean Validation과 서비스 검증이 별도로 존재한다. 누락 필드·잘못된 enum·기간/크기 오류·대상 불일치·잘못된 문항 ID·폰트 크기 범위(10~40) 등을 거절한다.
- **현행 WPF API(/p/api/wpf/**)** 는 `WpfApiExceptionHandler`가 `{code, message, timestamp}`(426은 버전 3개 추가)로 통일한다(§1.2). 관리자 API와 구형 WPF API는 프레임워크 예외 응답을 따르며 {code,message} 형식으로 확정하지 않는다.
- 관리자 클라이언트는 응답의 msgClsf=ER 등을 검사한다. HTTP 성공만으로 업무 저장 성공을 판단하지 않는다.
- GET /p/api/popups/video?path=sample.mp4 및 /p/api/popups/video/{*path}는 영상 바이너리 응답이므로 본 JSON 계약에서 제외한다. Range 요청은 206/416으로 처리될 수 있고 잘못된 경로/파일은 400/403/404/415가 가능하다.
- 하단 링크와 이미지 링크 클릭은 브라우저 URL 이동이며 별도 팝업 API 요청 JSON을 만들지 않는다.

## 10. 구현 근거와 확인 범위

| 기준 파일 | 확인 내용 |
|---|---|
| zero-rule-server/web/api/src/main/java/server/web/api/popup/wpf/WpfPopupController.java | 현행 WPF2-01·02 경로·헤더·사용자 식별 |
| zero-rule-server/web/api/src/main/java/server/web/api/popup/wpf/auth/WpfAuthController.java | WPF2-00 로그인(프로토타입) |
| zero-rule-server/web/api/src/main/java/server/web/api/popup/wpf/version/WpfClientVersionInterceptor.java | X-Client-Version 검증·426 본문 |
| zero-rule-server/web/api/src/main/java/server/web/api/popup/wpf/WpfApiExceptionHandler.java | 현행 WPF 오류 JSON |
| zero-rule-server/web/api/src/main/java/server/web/api/payload/popup/wpf/WpfResultRequest.java | 결과 항목 IN 필드(score/passed 포함) |
| zero-rule-server/domain/src/main/java/server/domain/popup/wpf/ | WpfPopupItem(passingScore·정답 키 범위), WpfResultItemResponse, 오류 DTO |
| zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/ | 목록 조립(QUIZ 정답 키), 결과 처리·멱등 |
| popup-frameWork/Popup/Services/QuizGrader.cs · PopupResultQueue.cs · ClientVersion.cs | WPF 로컬 채점·로컬 큐·버전 헤더/426 |
| zero-rule-server/web/api/src/main/java/server/web/api/popup/PopupController.java | 구형 WPF API 6개 경로·메서드 |
| zero-rule-server/web/api/src/main/java/server/web/api/popup/PopupAdminController.java | 관리자 API 6개 및 응답 래퍼 |
| zero-rule-server/web/api/src/main/java/server/web/api/payload/popup/ | 요청 DTO·필수/범위 검증 |
| zero-rule-server/domain/src/main/java/server/domain/popup/ | 공통 팝업·문항·응답 DTO |
| zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupService.java | 업무 검증·정답 제외·문항 복제·콘텐츠 조립 |
| zero-rule-server/repo/core/src/main/resources/mappers/popup/PopupMapper.xml | 응답 upsert와 상태 저장 |
| zero-rule-server/app/src/main/java/server/app/config/BasicConfig.java | timestamp 및 null 생략 설정 |
| zero-rule-web/sub/domain/src/base.ts | 관리자 응답 부가 필드 |
| zero-rule-web/sub/domain/src/user-apis/PopupAdminApi.ts | 관리자 클라이언트 요청·응답 사용 |
| popup-frameWork/Popup/Services/PopupApiService.cs | WPF API 조합 경로 |

이 문서는 소스 대조 기반이다. 실제 서버 호출, 운영 DB 반영, 오류 응답 캡처 및 브라우저/WPF 전체 연동 시험은 문서 작성 과정에서 실행하지 않았다. 예시 JSON 구문과 DTO 필드 누락·불일치는 별도 정적 검사한다.
