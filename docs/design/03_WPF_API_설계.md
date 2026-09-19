# 03. WPF API 설계 — 조회 1개 + 결과 1개

기준 항목 3(단일 조회·단일 결과 API), 4(통신 시점), 6(헤더 기반 사용자 식별)을 다룬다. JSON 예제 파일은 [api/examples](../api/examples)에 있다. 인증 토큰 자체는 타 팀이 개발하는 통합 토큰을 사용한다 (04 문서).

## 1. 공통 규약

| 항목 | 규약 | 현행과의 차이 |
|---|---|---|
| 기본 경로 | `/p/api/wpf/**` (신규). 기존 `/p/api/popups/**`는 유지 | 신규 경로로 분리해 기존 API·클라이언트에 영향 없음 |
| 인증 헤더 | `Authorization: Bearer {통합 토큰}` — 토큰 형식·검증은 타 팀 통합 토큰 필터가 담당. WPF는 `IAuthHeaderProvider`가 준 값을 그대로 헤더에 붙임. 필터 적용 전에는 헤더 없이 개발 모드(`X-Dev-User-Id`)로 동작 | 현행은 무인증 + userId 파라미터 |
| 사용자 식별 | 서버 `WpfUserResolver`가 인증 정보에서 얻는 사번. 요청 본문·쿼리에 `userId` 없음 | 기준 6 |
| 본문 | UTF-8 JSON, camelCase, 응답은 래퍼 없이 객체 직접 반환 | 현행 WPF API와 동일 |
| 날짜 | **ISO 8601 + 오프셋 문자열** (`2026-09-19T09:00:00+09:00`). 신규 WPF DTO 필드에만 `@JsonFormat` 적용 | zeroserver 전역 `WRITE_DATES_AS_TIMESTAMPS` 설정은 건드리지 않음. WPF `FlexibleDateTimeOffsetJsonConverter`가 ISO도 처리하므로 호환 |
| null | 값 없는 필드는 생략될 수 있음 (`NON_NULL`) | 동일 |
| 오류 | HTTP 상태 + `{ "code", "message", "timestamp" }` (신규 `WpfApiExceptionHandler`, WPF 컨트롤러 한정) | 현행은 미정의 |
| 멱등성 | 결과 API는 항목별 `resultId`(UUID)로 중복 무시 | 현행은 `clientRequestId`(제출만) |

### 오류 코드

| HTTP | code | 상황 |
|---|---|---|
| 400 | `WPF_BAD_REQUEST` | Bean Validation 실패, 지원하지 않는 enum |
| 401 | (타 팀 통합 토큰 필터의 응답) | 토큰 없음·검증 실패·만료. WPF는 `IAuthHeaderProvider.OnUnauthorizedAsync` 후 1회 재시도 |
| 401 | `WPF_UNAUTHORIZED` | 필터는 통과했으나 `WpfUserResolver`가 사번을 얻지 못함 (연동 불일치) |
| 403 | `WPF_USER_INACTIVE` | `APP_USER` 없음 또는 `ACTIVE_YN='N'` |
| 500 | `WPF_INTERNAL` | 그 외 |

결과 API는 항목 단위 실패를 HTTP 오류로 올리지 않고 응답 `results[].status = REJECTED`로 알린다. 요청 전체가 잘못된 경우(토큰, JSON 구문)만 HTTP 오류다.

## 2. 인터페이스 목록

| ID | HTTP | 경로 | 인증 | 용도 |
|---|---|---|---|---|
| WPF2-01 | GET | `/p/api/wpf/popups` | 통합 토큰 (타 팀 필터) | 표시할 최종 팝업 목록 (공통 옵션 + content + 문항·선택지) |
| WPF2-02 | POST | `/p/api/wpf/popups/results` | 통합 토큰 (타 팀 필터) | 팝업 처리 결과 일괄 전송 (닫기·숨김·제출·영상) |

토큰 발급·폐기 API는 타 팀 통합 토큰 설계에 따르며 이 문서 범위 외다. 기존 WPF-01~06은 유지된다. 전환 완료 후 제거 여부는 09 문서에서 결정한다.

## 3. WPF2-01 팝업 목록 조회

**GET /p/api/wpf/popups**

요청 본문·쿼리 없음. 헤더 `Authorization: Bearer ...` (IAuthHeaderProvider가 값을 줄 때만 부착).

응답:

```json
{
  "serverTime": "2026-09-19T09:00:00+09:00",
  "userId": "E1002",
  "pollingIntervalSeconds": 1800,
  "popups": [
    {
      "popupId": "NOTICE-2026-09-001",
      "popupType": "TEXT",
      "title": "9월 시스템 점검 안내",
      "displayStartAt": "2026-09-19T00:00:00+09:00",
      "displayEndAt": "2026-09-30T23:59:59+09:00",
      "displayMode": "SEQUENTIAL",
      "displayOrder": 10,
      "sizeMode": "FIXED",
      "width": 560, "height": 420,
      "widthRatio": 0.7, "heightRatio": 0.75,
      "minimumWidth": 480, "minimumHeight": 320,
      "maximumWidth": 1200, "maximumHeight": 900,
      "showHeader": true, "showCloseButton": true, "showFooter": true,
      "showDoNotShowAgain": true, "hideDays": 7,
      "allowCloseBeforeComplete": true,
      "completionRatio": null,
      "periodMode": "FIXED",
      "questions": [],
      "content": {
        "contentTitle": "서비스 점검 안내",
        "description": "점검 시간 동안 접속이 제한됩니다.",
        "showContentHeader": true,
        "plainText": "9월 21일(일) 02:00~06:00 점검 예정입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://intranet.example.com/notice/1",
        "showBottomDescription": true,
        "markdownMode": false,
        "markdownContent": "",
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    }
  ]
}
```

### 팝업 항목 필드

현행 WPF `PopupResponseDto`와 **동일한 평면 구조**를 유지해 WPF DTO 변경을 최소화한다. 차이점만 표시한다.

| 필드 | 형식 | 변경 | 설명 |
|---|---|---|---|
| popupId, popupType, title | string | 유지 | popupType: TEXT / IMAGE / VIDEO / SURVEY / QUIZ |
| displayStartAt, displayEndAt | ISO string | 형식 변경 | WPF는 표시 참고용. 노출 판단은 서버가 이미 완료 |
| displayMode, displayOrder | string, int | 유지 | |
| sizeMode, width, height, widthRatio, heightRatio, minimumWidth, minimumHeight, maximumWidth, maximumHeight | string, number | 유지 | 크기 규격 |
| showHeader, showCloseButton, showFooter, showDoNotShowAgain | boolean | 유지 | |
| hideDays | int | 유지 | "다시 보지 않기" 선택 시 WPF가 결과에 그대로 보냄. null이면 WPF 기본 30 |
| allowCloseBeforeComplete | boolean | 유지 | VIDEO/SURVEY/QUIZ 완료 전 닫기 허용 |
| completionRatio | number | 유지 | VIDEO 완료 기준. WPF는 표시(진행 안내)용, 판정은 서버 |
| periodMode, repeatInterval, repeatDayOfWeek, repeatDayOfMonth | | 유지 | 반복 정책 미확정. 값만 전달 |
| questions | array | **단일 위치** | SURVEY/QUIZ 문항. `content.questions` 중복 제거 |
| content | object | 유지 | 유형별 콘텐츠 + `useBackgroundOverlay`, `backgroundOverlayOpacity`. `questions` 키 없음 |
| ~~questionTemplateId~~ | | **제거** | WPF에 불필요 (서버 내부 키) |
| ~~passingScore~~ | | **제거** | 채점은 서버. 노출 시 통과 기준 유추 가능 |

문항·선택지 구조는 현행과 같다 (`questionId, title, description, questionType, isRequired, isScored, questionScore, sortOrder, options[{optionId, value, text, sortOrder}]`). 정답 관련 필드(`isCorrect`, `correctAnswer`, `answerMatchMode`)는 절대 포함하지 않는다.

content 유형별 필드는 참조 저장소 `docs/interfaces/POPUP_INTERFACE_SPEC.md` §5와 동일하다 (TEXT / IMAGE / VIDEO / SURVEY·QUIZ). SURVEY·QUIZ의 `content`에서 `questions`, `passingScore`, `validateRequiredQuestions`는 제외한다.

## 4. WPF2-02 팝업 결과 전송

**POST /p/api/wpf/popups/results**

팝업 하나를 닫는 시점에 항목 1개로 보내거나, WPF 종료 시 미전송 항목을 모아 여러 개를 보낸다. 서버는 항목별로 독립 트랜잭션 처리하고 항목별 결과를 돌려준다.

요청:

```json
{
  "clientRequestId": "3f9c1c6e2d0a4c5f9a1b2c3d4e5f6a7b",
  "sentAt": "2026-09-19T09:12:30+09:00",
  "results": [
    {
      "resultId": "8d2f5b1a-0c3e-4f6a-9b7c-1d2e3f4a5b6c",
      "popupId": "NOTICE-2026-09-001",
      "resultType": "HIDDEN",
      "displayedAt": "2026-09-19T09:00:05+09:00",
      "closedAt": "2026-09-19T09:00:40+09:00",
      "hideDays": 7
    },
    {
      "resultId": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "popupId": "QUIZ-2026-09-003",
      "resultType": "SUBMITTED",
      "displayedAt": "2026-09-19T09:00:41+09:00",
      "closedAt": "2026-09-19T09:03:10+09:00",
      "responseStartedAt": "2026-09-19T09:00:41+09:00",
      "answers": [
        { "questionId": 101, "optionIds": [1001] },
        { "questionId": 102, "textAnswer": "확인했습니다." }
      ]
    },
    {
      "resultId": "9e8d7c6b-5a4f-4e3d-2c1b-0a9f8e7d6c5b",
      "popupId": "VIDEO-2026-09-002",
      "resultType": "VIDEO_WATCHED",
      "displayedAt": "2026-09-19T09:03:11+09:00",
      "closedAt": "2026-09-19T09:12:29+09:00",
      "video": {
        "durationSeconds": 540.0,
        "positionSeconds": 540.0,
        "maximumPositionSeconds": 540.0,
        "watchedSeconds": 531.5
      }
    }
  ]
}
```

### 요청 항목 필드

| 필드 | 형식 | 필수 | 설명 |
|---|---|---|---|
| clientRequestId | string ≤100 | O | 요청 단위 식별. 로그용 |
| sentAt | ISO | – | WPF 전송 시각. 재전송 시 원래 값 유지 |
| results[] | array 1~50 | O | 항목 목록 |
| results[].resultId | UUID string | O | **항목 멱등 키**. 같은 값 재수신 시 `DUPLICATE` 반환, 재처리 없음 |
| results[].popupId | string | O | |
| results[].resultType | enum | O | `CLOSED` · `HIDDEN` · `SUBMITTED` · `VIDEO_WATCHED` |
| results[].displayedAt | ISO | – | 팝업이 화면에 처음 표시된 시각. 있으면 `DISPLAY_COUNT` +1, `FIRST/LAST_DISPLAYED_AT` 갱신 |
| results[].closedAt | ISO | – | 닫힌 시각. 없으면 서버 수신 시각 |
| results[].hideDays | int 1~3650 | HIDDEN 필수 | 숨김 일수. 만료 시각은 **서버 시각** 기준으로 계산 |
| results[].responseStartedAt | ISO | – | SUBMITTED 선택 |
| results[].answers[] | array ≥1 | SUBMITTED 필수 | `questionId` 필수, 선택형 `optionIds`, 서술형 `textAnswer` |
| results[].video | object | VIDEO_WATCHED 필수 | `durationSeconds > 0`, 나머지 ≥ 0, 단위 초 |

### 유형별 서버 처리

| resultType | 허용 popupType | 처리 | 완료 판정 |
|---|---|---|---|
| CLOSED | 전체 | `USER_POPUP_STATUS` 표시·닫기 정보 갱신 | 변화 없음 |
| HIDDEN | 전체 (`showDoNotShowAgain=true`인 팝업) | 표시·닫기 갱신 + `HIDDEN_FROM_AT/HIDDEN_UNTIL_AT` 설정, 상태 `HIDDEN` | 변화 없음 |
| SUBMITTED | SURVEY, QUIZ | 노출 자격 재검사 → 문항 소속·필수·유형 검증 → QUIZ 채점 → `POPUP_RESPONSE` upsert(사용자+팝업 최신 1건) + 답안 교체 | SURVEY: 제출 즉시 `COMPLETED`. QUIZ: `totalScore >= passingScore`면 `COMPLETED`, 미통과면 `SUBMITTED`(재노출) |
| VIDEO_WATCHED | VIDEO | `watchedRatio = min(watched, duration)/duration` (4자리 내림) → `VIDEO_VIEW_STATUS` upsert(최대값 유지) | `watchedRatio >= completionRatio(기본 1.0)`면 `COMPLETED` |

노출 자격 재검사: SUBMITTED·VIDEO_WATCHED는 항목 처리 시점에 해당 팝업이 여전히 사용자에게 노출 가능한지(활성·기간·대상) 확인한다. 불가하면 `REJECTED`/`WPF_NOT_ELIGIBLE`. CLOSED·HIDDEN은 활성 사용자·팝업 존재만 확인한다 (현행 이벤트 API와 동일).

응답:

```json
{
  "receivedAt": "2026-09-19T09:12:31+09:00",
  "results": [
    {
      "resultId": "8d2f5b1a-0c3e-4f6a-9b7c-1d2e3f4a5b6c",
      "popupId": "NOTICE-2026-09-001",
      "resultType": "HIDDEN",
      "status": "ACCEPTED",
      "popupStatus": "HIDDEN",
      "hiddenUntil": "2026-09-26T09:12:31+09:00",
      "completed": false
    },
    {
      "resultId": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "popupId": "QUIZ-2026-09-003",
      "resultType": "SUBMITTED",
      "status": "ACCEPTED",
      "popupStatus": "COMPLETED",
      "responseId": 5001,
      "totalScore": 10,
      "passed": true,
      "completed": true,
      "completedAt": "2026-09-19T09:12:31+09:00"
    },
    {
      "resultId": "9e8d7c6b-5a4f-4e3d-2c1b-0a9f8e7d6c5b",
      "popupId": "VIDEO-2026-09-002",
      "resultType": "VIDEO_WATCHED",
      "status": "ACCEPTED",
      "popupStatus": "COMPLETED",
      "watchedRatio": 0.9842,
      "requiredRatio": 0.9,
      "completed": true,
      "completedAt": "2026-09-19T09:12:31+09:00"
    }
  ]
}
```

### 응답 항목 필드

| 필드 | 형식 | 제공 조건 |
|---|---|---|
| resultId, popupId, resultType | string | 항상 (요청 echo) |
| status | `ACCEPTED` / `DUPLICATE` / `REJECTED` | 항상 |
| code, message | string | REJECTED일 때. `WPF_NOT_ELIGIBLE`(대상·기간 아님), `WPF_TYPE_MISMATCH`(설문형 아님), `WPF_INVALID_ANSWER`(문항·선택지·답안), `WPF_INVALID_HIDE_DAYS`, `WPF_INVALID_VIDEO`, `WPF_INVALID_RESULT`(그 외 검증), `WPF_INTERNAL`(서버 오류) |
| popupStatus | `DISPLAYED` / `CLOSED` / `HIDDEN` / `SUBMITTED` / `COMPLETED` | ACCEPTED일 때 |
| completed, completedAt | boolean, ISO | ACCEPTED일 때 (`completedAt`은 완료 시) |
| hiddenUntil | ISO | HIDDEN |
| responseId, totalScore, passed | long, number, boolean | SUBMITTED. **SURVEY는 totalScore/passed 생략** (채점 없음) |
| watchedRatio, requiredRatio | number | VIDEO_WATCHED |

WPF는 `DUPLICATE`도 성공으로 간주해 로컬 큐에서 제거한다. `REJECTED`는 큐에서 제거하고 로그만 남긴다 (재전송해도 같은 결과).

## 5. 인증 헤더 전달 형태

WPF는 요청마다 `IAuthHeaderProvider.GetAuthorizationHeaderAsync()`가 돌려준 문자열을 `Authorization` 헤더에 그대로 넣는다. 토큰 발급·검증·만료 정책은 타 팀 통합 토큰 설계를 따르며, 개발 단계에서는 서버 개발 프로파일의 `X-Dev-User-Id` 헤더로 사용자를 지정한다 (04 문서 §3).

```http
GET /zero-rule-server/p/api/wpf/popups HTTP/1.1
Authorization: Bearer <통합 토큰 — 형식은 타 팀 설계>
X-Dev-User-Id: E1001            ← 개발 프로파일에서만 사용. 운영에서는 무시/제거
```

## 6. 현행 API 대비 요약

| 현행 | 신규 | 비고 |
|---|---|---|
| WPF-01 목록 + WPF-06 상태 | WPF2-01 | 완료 제외를 서버 SQL로 이동. 문항 중복·정답 관련 필드 제거 |
| WPF-02 숨김 | WPF2-02 `HIDDEN` | |
| WPF-03 제출 | WPF2-02 `SUBMITTED` | SURVEY는 채점 응답 없음 |
| WPF-04 진행률 (주기) | WPF2-02 `VIDEO_WATCHED` (종료 시 1회) | 완료 판정 규칙 동일 |
| WPF-05 이벤트 DISPLAYED/CLOSED | 모든 결과 항목의 `displayedAt/closedAt` | 별도 호출 제거 |
| (무인증) | `Authorization` 헤더 부착 형태만 준비 | 토큰 발급·검증은 타 팀 통합 토큰 |
