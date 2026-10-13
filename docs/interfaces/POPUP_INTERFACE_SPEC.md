# WPF Popup Client API Interface — JSON Contract

- 문서 버전: 3.7
- 최신화: 2026-10-13 (KST)
- 3.7 변경(2026-10-13, 설계 39): 통합 전 TEXT 중 제목·설명은 보이고 본문은 숨겼던 행(`showPlainText=false`)은 **헤더만 보이기** — 보이던 제목·설명만 본문 문단으로 만들고 숨긴 본문은 응답에서 빼며 `showPlainText=true`로 보낸다(관리자 재저장 시 숨긴 본문 삭제). 조회·결과 처리는 사용자 단위로 직렬화하여 같은 결과의 동시 제출은 DUPLICATE, 결과 커밋 전 조회는 커밋 후 상태로 후보를 고른다. 클라이언트는 큐 파일을 읽을 수 없으면 조회를 보류하고, 복구 재전송 결과의 nextStatus(EMPTY)도 따른다.
- 3.7 변경(2026-10-13, 설계 35): WPF-01·WPF-02를 목록·일괄 구조에서 **단건 순차 구조**로 교체. 조회는 `POST /api/wpf/popups`(본문 `{}`)이며 응답은 `pollingIntervalSeconds`와 지금 표시할 팝업 1건 `popup`(없으면 키를 유지하고 `null`)뿐이다. ROOT `serverTime`·`userId`·`popups[]` 제거. `popup`에 서버 발급 전달 건 ID `deliveryId`를 추가하고, 표시 순서는 서버가 정하므로 `displayOrder`를 응답에서 제거(관리자 설정·서버 정렬 기준은 유지). 결과 요청은 envelope(`clientRequestId`·`sentAt`·`results[]`) 없이 결과 1건 객체이며 `deliveryId` 필수, 기존 결과 필드는 그대로다. 결과 응답은 `resultId`·`status`·`nextStatus`(AVAILABLE/EMPTY)·`code`·`message` 단건이며 `results[]`·항목 `popupId`·`resultType` 제거. 거절 code `WPF_INVALID_DELIVERY`·`WPF_DELIVERY_COMPLETED`와 후보 확인 실패 code `WPF_NEXT_STATUS_UNKNOWN` 추가. TEXT·IMAGE의 CLOSED는 완료로 처리하고, 미완료로 끝난 SURVEY·QUIZ·VIDEO는 저장 시각부터 `pollingIntervalSeconds` 동안 재노출 유예. 미전송 결과 복구는 주간회의 결정 전 임시 기준(§12.1).
- 3.7 변경(2026-10-13, 설계 37): TEXT content에서 `contentTitle`·`description`·`showContentHeader` 제거. 콘텐츠 제목·설명은 서식 본문 `textBlocks`의 앞 문단으로 작성하며 `plainText`도 같은 순서의 일반 문자열이다. 서버는 TEXT 저장 시 받은 제목·설명을 사용하지 않고, 통합 전 저장 데이터는 조회 시 본문 앞 문단으로 합쳐 보낸다(제목 문단: 굵게·크기 24, `showContentHeader=false`였던 행은 제외). WPF는 TEXT content의 세 키를 읽지 않는다. IMAGE·VIDEO·SURVEY·QUIZ의 제목·설명과 공통 `title`은 변경 없음.
- 3.7 변경(2026-10-12, 설계 29): 목록 `popups[]`에서 서버 내부 판정 값 `displayStartAt`·`displayEndAt`(및 서버가 보내던 `periodMode`·`repeatInterval`·`repeatDayOfWeek`·`repeatDayOfMonth`) 제거. Footer 버튼 표시 이름을 `showFooterButton`으로 통일하고 legacy `showCloseButton` 수신 별칭 삭제. ROOT `serverTime`·`userId`는 진단용으로 유지. (설계 35에서 단건 구조로 대체)
- 3.7 변경(2026-10-12, 설계 34): 결과 응답에서 ROOT `receivedAt`과 `popupStatus`·`completed`·`completedAt`·`responseId` 제거(WPF·로그 미사용). 결과 항목 status에 `RETRYABLE_ERROR`(확인된 일시 장애)·`INTERNAL_ERROR`(원인 미확정) 추가. WPF는 ACCEPTED·DUPLICATE·REJECTED만 큐에서 제거하고 나머지·응답 누락은 같은 resultId로 재전송. 결과 응답에서 `hiddenUntil`·`watchedRatio`·`requiredRatio` 제거. 설문·퀴즈에 CLOSE·LINK_AND_CLOSE 명시값은 백엔드 등록 단계에서 거부.
- 3.7 변경(2026-10-12, 설계 31): PopupWindow 공통 UI 옵션 `useBackgroundOverlay`·`backgroundOverlayOpacity`·`popupPosition`·`headerFontSize`·`bodyFontSize`·`footerFontSize`를 `content`에서 `popups[]` 최상위로 이동. WPF는 content의 같은 키를 읽지 않는다. Overlay 불투명도 범위(0~1)는 서버가 저장 시 검증하고 WPF도 0~1로 보정. (설계 35에서 단건 구조로 대체)
- 3.7 변경(2026-10-12, 설계 30): Footer 동작 `footerAction`·`footerLinkUrl`을 `content`에서 `popups[]` 최상위로 이동하고 `footerAction`을 CLOSE(닫기) / LINK_AND_CLOSE(바로가기) / SUBMIT(제출) 3값으로 정의. SURVEY·QUIZ·VIDEO+QUIZ는 SUBMIT 고정이며 제출 후 링크 열기 동작을 제거. WPF는 content의 두 키를 읽지 않는다. (설계 35에서 단건 구조로 대체)
- 3.7 변경(2026-10-12, 설계 33): 결과 응답 `results[]`에서 `totalScore`·`passed` 제거. QUIZ 판정은 WPF 책임이며 요청의 `score`·`passed`(QUIZ 필수, 없으면 REJECTED)를 서버가 그대로 저장·완료 판정에 사용. (설계 35에서 단건 구조로 대체)
- 3.7 변경(2026-10-12): IMAGE content `linkUrl`(이미지 클릭 시 URL 열기) 삭제. 모든 imageSizeMode에서 이미지 클릭 동작이 없으며 WPF는 이 키를 읽지 않는다.
- 3.7 변경(2026-10-12, 설계 32): 결과 요청 `results[]`에서 중복 시각 필드 `responseStartedAt` 제거. 표시 시각은 `displayedAt`, 종료·제출 시각은 `closedAt`. (설계 35에서 단건 구조로 대체)
- 2026-10-09 보완: TEXT content에 선택 필드 `textBlocks`(문단·Run 서식 본문) 추가. 생략 시 기존 plainText 표시와 같다.
- 2026-10-09 보완: VIDEO·동영상+퀴즈 content에 선택 필드 `allowSeek`(boolean, 기본 `true`) 추가. 생략 시 기존 동작과 같다. 영상 소스는 로컬 경로와 HTTP(S) 직접 재생 URL만 지원하며 YouTube 임베드 재생을 제거.
- 2026-10-07 보완: ShowFooterButton 및 고정 Header 외형 반영. [최소 기능](WPF_POPUP_MINIMAL_SPEC.md)·[전체 기능](WPF_POPUP_ALL_SPEC.md) 정의서를 함께 관리.
- 3.6 변경: IMAGE content.width/height 단일화, FIT_TO_IMAGE keepAspectRatio, 창 최대 초과 Clip, 하단 설명 통일, FILL 제거.
- 2026-10-03 보완: JSON 필드·ENUM 변경 없이 VIDEO Overlay·Windows Master Volume/Mute·defaultVolume 대체 정책, SURVEY/QUIZ 배치별 Row/Chip 및 고정 제출 영역을 명시.
- 2026-09-30 보완: JSON 필드·ENUM 변경 없이 30~60분 조회 정책, 로컬/URL 공통 WPF 컨트롤 및 동영상+퀴즈 단일 스크롤 동작을 명시.
- 3.5 변경: 주요 요청/응답 필드 표에 `필수 여부`와 `Default`를 추가하고, 생략 시 C# 처리 기준을 명확화. 최신 main의 IMAGE ORIGINAL, 푸터 바로가기, 동영상+퀴즈 계약을 정합성 점검.
- 3.4 변경: IMAGE `imageSizeMode=ORIGINAL` 추가. 팝업 크기를 유지하고 원본 이미지를 왼쪽 위에 배치한 뒤 넘치는 영역을 자른다.
- 3.3 변경: 공통 푸터 `footerAction`·`footerLinkUrl`, QUIZ의 `videoEnabled` 영상 결합 모드 추가. 영상 결합 QUIZ 제출은 `answers`와 `video`를 한 결과 항목에 포함한다.
- 3.2 변경: 팝업 `sizeMode`의 `VIEWPORT_RATIO` 삭제(`RATIO`로 단일화), 문항 유형 `RATING5` 삭제, TEXT `showHighlight`·`showBottomDescription` 미지정 시 문구 유무로 추정하던 처리 삭제(없으면 false)
- 3.1 변경: IMAGE `imageSizeMode`의 과거 호환 값 `FIXED` 삭제(ADAPTIVE / FIT_TO_IMAGE / FILL만 허용, 미지정 시 ADAPTIVE)
- 대상: **별도 구축 백엔드 ↔ 제공되는 C# WPF 팝업 클라이언트**
- 기준 구현: `popup-frameWork/Popup`
- 목적: 백엔드 구현 방식, DB 구조, 관리자 화면 구조와 무관하게 **C# 클라이언트가 요구하는 HTTP/JSON 계약**만 정의한다.
- 비범위: 백엔드 DB 테이블, SQL, Java/Spring 구현, 관리자 웹 API, 관리자 화면, 기존 zero-rule-server 내부 클래스·설정.
- 예제 데이터는 형식 설명용이며 실제 사용자·팝업 데이터가 아니다.

> 핵심 원칙: 백엔드는 내부 구조를 자유롭게 설계할 수 있다. 다만 이 문서의 URL, 헤더, JSON 필드, ENUM, 의미와 처리 결과를 C# 클라이언트가 이해할 수 있는 형태로 제공해야 한다.
>
> **표 읽는 기준**: `필수 여부`는 백엔드가 계약상 값을 제공해야 하는지의 기준이고, `Default`는 필드가 생략되거나 null일 때 현재 C# 클라이언트가 사용하는 값/처리다. 필수 필드에 C# fallback이 있더라도 신규 백엔드는 필수 값을 명시해서 보내는 것을 기준으로 한다. 최소·전체 기능 정의서가 같은 필드를 `N`으로 적는 경우의 차이는 6.4 "필수 여부 표기 기준"을 따른다.

---

## 1. 역할 분리

### 1.1 백엔드 책임

백엔드는 다음을 끝낸 표시 대상 중 **순서상 첫 1건**만 WPF에 내려준다(설계 35).

- 사용자 식별
- 팝업 활성 여부
- 노출 시작/종료 기간
- 사용자/부서/직급 등 대상 조건
- 숨김 기간
- 이미 완료된 팝업 제외 정책
- 미완료 결과의 재노출 유예(§10.8)
- 표시 순서 정렬(관리자 표시 순서 `displayOrder` 기준)과 전달 건(`deliveryId`) 관리
- 결과 저장 후 다음 후보 유무(`nextStatus`) 판정
- 기타 서버 측 업무 정책

WPF에 전체 팝업을 내려준 뒤 대상 여부를 다시 판단하게 하지 않는다.

### 1.2 WPF 책임

WPF는 서버가 내려준 팝업 1건을 받아 다음을 수행한다.

- 팝업 화면 렌더링
- 한 번에 1건 표시, 결과 처리 후 `nextStatus`에 따른 다음 조회
- 창 위치·크기 최종 보정
- SURVEY 필수 응답 확인
- QUIZ 로컬 채점
- VIDEO 완료 비율 로컬 판정
- 닫기/숨김/제출/영상 결과 생성
- 결과를 로컬 파일에 먼저 저장
- 결과 API 단건 순차 전송 및 재전송

### 1.3 서버 구현 자유 영역

아래 항목은 이 계약에 포함하지 않는다.

- DB 종류와 테이블 구조
- ORM/MyBatis/JPA 사용 여부
- 관리자 웹의 저장 API
- 팝업 데이터 생성·관리 방식
- 서버 내부 클래스·패키지 구조

---

## 2. 공통 HTTP/JSON 규약

| 항목 | 규약 |
|---|---|
| 문자 인코딩 | UTF-8 |
| Content-Type | `application/json` |
| JSON 필드명 | camelCase |
| 날짜/시간 | ISO 8601 문자열 권장. 예: `2026-09-28T15:30:00+09:00` |
| Boolean | `true` / `false` |
| null/생략 | 선택 필드는 생략 가능. null은 nullable로 명시한 필드만 허용. 필수 필드는 반드시 제공(6.4 참고) |
| 사용자 ID | 조회/결과 API 요청 JSON에는 userId를 넣지 않음. 인증 정보로 서버가 식별 |
| HTTP timeout | WPF HTTP 호출은 현재 10초 |
| 표시 대상 없음 | 오류가 아니라 `popup: null` 반환 |

C# 역직렬화는 대소문자를 구분하지 않지만, 신규 백엔드는 문서의 camelCase 이름을 그대로 사용하는 것을 기준으로 한다.

---

## 3. 현재 C#이 사용하는 API

| ID | 기능 | Method | 기본 경로 |
|---|---|---|---|
| WPF-00 | 로그인/토큰 발급 | POST | `/api/wpf/auth/login` |
| WPF-01 | 표시 대상 팝업 1건 조회 | POST | `/api/wpf/popups` |
| WPF-02 | 팝업 처리 결과 1건 전송 | POST | `/api/wpf/popups/results` |

실제 전체 URL은 WPF의 `PopupApi.BaseUrl` 뒤에 위 경로를 붙여 사용한다.

예:

```text
BaseUrl = https://example.company/popup-api
POST https://example.company/popup-api/api/wpf/popups
```

로그인 경로는 현재 C# 설정의 `Auth.LoginPath`로 교체 가능하며, 미설정 시 `/api/wpf/auth/login`을 사용한다.

정상 호출 순서는 로그인 → 조회 → 팝업 1건 표시·사용자 처리 → 결과 1건 전송 → (nextStatus에 따라) 조회다(§6.2). 결과 수신 API가 결과 저장을 맡으며 별도 저장 API는 없다. 이전 목록 조회(`GET`, `popups[]`)와 결과 일괄 전송(`results[]` 1~50건)은 설계 35에서 삭제했으며 구버전 클라이언트와 호환하지 않는다.

---

## 4. 공통 헤더

### 4.1 X-Client-Version

현재 C#은 로그인, 조회, 결과 전송에 다음 헤더를 보낸다.

```http
X-Client-Version: 1.0.0
```

값은 WPF 실행 파일의 버전에서 생성된다.

백엔드가 최소 지원 버전을 검사하지 않는 경우 이 헤더를 무시할 수 있다. 버전 강제 업데이트 기능을 구현한다면 §13.1의 426 계약을 따른다.

### 4.2 Authorization

로그인 성공 후:

```http
Authorization: Bearer <accessToken>
```

형태로 조회/결과 API에 전달한다.

현재 C#의 SSO 프로토타입 인증 흐름은 다음과 같다.

```text
프로세스 최초 인증
→ 사내 SSO에서 logonId / classCode 확보
→ 로그인 API 호출
→ accessToken 메모리 저장
→ 조회/결과 API에 Bearer 토큰 전달

401 발생
→ 기존 SSO 사용자 정보로 로그인 API 재호출
→ 원 요청 1회 재전송
```

토큰 값은 파일이나 레지스트리에 저장하지 않는다.

---

# 5. WPF-00 로그인

## 5.1 Request

```http
POST /api/wpf/auth/login
Content-Type: application/json
X-Client-Version: 1.0.0
```

```json
{
  "logonId": "E1001",
  "classCode": "10",
  "linkYn": "N"
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| logonId | string | O | 없음 | SSO에서 얻은 사용자 식별값 |
| classCode | string | O | 없음 | SSO에서 얻은 사용자 분류 코드 |
| linkYn | string | O | `"N"` | 현재 C#은 항상 `N` 전송 |

## 5.2 Response

```json
{
  "accessToken": "opaque-token-value",
  "tokenType": "Bearer",
  "expiresAt": "2026-09-28T15:40:00+09:00"
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| accessToken | string | O | 없음 | 비어 있으면 C# 로그인 실패 처리 |
| tokenType | string | 선택 | `"Bearer"` | 현재 C# DTO 기본값. 인증 헤더는 Bearer 방식 사용 |
| expiresAt | string(ISO 8601) | 선택 | .NET DateTimeOffset 기본값 | 현재 C#은 진단 로그에 사용하며 별도 필수 검증은 하지 않음 |

---

# 6. WPF-01 표시 대상 팝업 조회

## 6.1 Request

```http
POST /api/wpf/popups
Content-Type: application/json
Authorization: Bearer <token>
X-Client-Version: 1.0.0
```

```json
{}
```

- Query String 없음
- Request Body는 빈 객체 `{}`(본문 생략도 허용). 서버는 본문 내용을 사용하지 않는다
- userId 없음. 사용자는 인증 정보로 식별한다
- 조회가 전달 건(`deliveryId`)을 만들거나 재사용하므로 POST를 사용한다

## 6.2 Response Envelope

```json
{
  "pollingIntervalSeconds": 1800,
  "popup": null
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| pollingIntervalSeconds | integer | O | `0` | 서버 설정이 소유하는 1800~3600초(30~60분) 조회 간격. 매 응답에 포함하며 WPF는 가장 최근 값을 반영. 0 이하면 범위 제한된 WPF 로컬 설정 유지 |
| popup | object \| null | O | `null` | 지금 표시할 팝업 1건(§6.3). 표시 대상이 없으면 키를 유지하고 `null` |

응답에는 팝업 목록·`serverTime`·`userId`·`nextStatus`가 없다(설계 35에서 ROOT `serverTime`·`userId`·`popups[]` 제거). 다음 후보 유무는 결과 응답의 `nextStatus`(§11)로만 알린다. 서버가 위 필드를 보내더라도 WPF는 읽지 않는다.

### 서버 선택 기준

서버는 게시 중이며 노출 기간·대상 조건을 만족하는 팝업 중 숨김·완료·재노출 유예(§10.8) 대상을 제외하고, 관리자 표시 순서(`DISPLAY_ORDER`) → 생성 시각 → `POPUP_ID` 순으로 첫 1건을 고른다. 표시 순서 값은 서버 정렬에만 쓰며 응답에 싣지 않는다.

- 고른 팝업마다 전달 건을 만들고 서버 발급 UUID 문자열 `deliveryId`를 `popup`에 넣는다. 사용자당 열린(OPEN) 전달 건은 최대 1건이다.
- 열린 전달 건의 팝업이 아직 표시 조건을 만족하면 다시 조회해도 같은 `deliveryId`로 같은 팝업을 돌려준다(조회 응답 유실 복구). 조건을 벗어났으면(게시 중단·기간 만료·대상 변경 등) 그 전달 건을 만료하고 다음 후보를 고른다.
- 전달 자체는 읽음·완료 처리가 아니다. 완료·숨김·재노출 유예는 결과 수신(WPF-02)으로만 반영된다.

### 조회 시점과 정상 흐름

```text
로그인
→ 미전송 결과 전송(§12.1)
→ POST /api/wpf/popups
→ popup=null      : 가장 최근 pollingIntervalSeconds 대기 후 다시 조회
→ popup 있음      : 1건 표시 → 닫기·숨김·제출·시청 종료 → 결과 1건 전송(WPF-02)
→ 결과 status가 저장(ACCEPTED·DUPLICATE)이면 nextStatus 확인
     AVAILABLE    : 즉시 다시 조회
     EMPTY        : 가장 최근 pollingIntervalSeconds 대기 후 조회
     nextStatus 없음(후보 확인 실패) : 즉시 다시 조회(popup=null이면 정상 처리)
→ REJECTED       : 종결로 보고 다음 조회를 막지 않음
```

기본 `AutoLoadOnStartup=true`에서 로그인 직후 최초 조회한다. 팝업을 표시하는 동안에는 주기·수동 조회를 하지 않으며, 창이 닫혀 결과를 처리한 뒤 위 규칙으로 다음 조회를 정한다. 대기 시간은 기동 시점 기준 반복 경계에 맞추지 않고, 빈 조회·EMPTY 응답 시점부터 가장 최근 간격만큼 센다. 노출 기간·반복 판정은 서버가 끝내며 `popup`에는 노출 시작·종료 시각을 싣지 않는다. WPF는 PC 시각으로 노출 여부를 판단하거나 팝업별 예약 타이머를 만들지 않는다. 조회 요청이 진행 중이면 중복 요청은 생략하고, 401 재인증은 재로그인 후 실패한 요청 1회 재시도로 처리해 조회 타이머를 추가하지 않는다.

서버/로컬 설정의 양수 값은 1800~3600초로 보정하며 로컬 설정이 0 이하이면 1800초를 사용한다. 표시 대상이 없을 때 최대 60분의 신규 노출 지연을 허용한다. 조회 오류는 정상 응답 `popup: null`과 구분해 HTTP 오류로 처리한다(§13). AVAILABLE 응답 뒤 조회 사이에 게시 중단·기간 만료가 생길 수 있으므로 조회 결과 `popup: null`은 정상 처리한다.

---

## 6.3 popup 공통 필드

| 필드 | 형식 | 필수 여부 | Default | C# 처리 |
|---|---|---|---|---|
| deliveryId | string | O | 계약 기본값 없음(C# 초기값 `""`) | 서버 발급 전달 건 ID(UUID 문자열, 64자 이하). WPF는 만들거나 바꾸지 않고 결과 요청에 그대로 넣는다(§10.2) |
| popupId | string | O | 계약 기본값 없음(C# 초기값 `""`) | 결과 전송 식별자. 빈 값이면 결과 수집 연결을 건너뜀 |
| popupType | string | O | 계약 기본값 없음(C# 초기값 `""`) | TEXT / IMAGE / VIDEO / SURVEY / QUIZ. 빈 값·미지원 값은 Factory 오류 |
| title | string | O | `""` | 공통 Header 제목 |
| displayMode | string | O | `SEQUENTIAL` | SEQUENTIAL / SIMULTANEOUS. 조회 응답이 1건이라 동시에 열리는 다른 서버 팝업은 없다 |
| sizeMode | string | O | `FIXED` | FIXED / RATIO / FULLSCREEN / AUTO |
| width | number | IMAGE 일반 모드 외 | `900` | 일반 IMAGE는 생략하고 content.width 사용, ORIGINAL 및 다른 유형은 창 크기 |
| height | number | IMAGE 일반 모드 외 | `620` | 일반 IMAGE는 생략하고 content.height 사용 |
| widthRatio | number | RATIO | `0.7` | RATIO 너비 비율 |
| heightRatio | number | RATIO | `0.75` | RATIO 높이 비율 |
| minimumWidth | number | 선택 | `480` | 최소 창 너비 |
| minimumHeight | number | 선택 | `320` | 최소 창 높이 |
| maximumWidth | number | 선택 | `1200` | 최대 창 너비. IMAGE는 이 고정 상한 대신 작업 영역 90% 적용 |
| maximumHeight | number | 선택 | `900` | 최대 창 높이. IMAGE는 이 고정 상한 대신 작업 영역 90% 적용 |
| showHeader | boolean | O | `true` | 공통 Header 표시 |
| showFooterButton | boolean | O | `true` | Footer 버튼 표시. 상단 X는 없음. SURVEY/QUIZ 제출은 유지 |
| showFooter | boolean | O | `true` | Footer 표시 |
| footerAction | string | 선택 | `CLOSE`(SURVEY/QUIZ는 `SUBMIT`) | Footer 버튼 동작. CLOSE(닫기) / LINK_AND_CLOSE(바로가기) / SUBMIT(제출). TEXT·IMAGE·VIDEO는 CLOSE·LINK_AND_CLOSE, SURVEY·QUIZ는 SUBMIT만 허용. 백엔드는 유형에 맞지 않는 명시값을 등록 단계에서 거부하며, WPF는 방어적으로 SURVEY·QUIZ를 항상 SUBMIT, 일반 유형의 생략·미지원 값·SUBMIT을 CLOSE로 처리 |
| footerLinkUrl | string | footerAction=LINK_AND_CLOSE | `""` | 바로가기 URL. 절대 http/https. 다른 동작에서는 보내지 않음 |
| useBackgroundOverlay | boolean | 선택 | `true` | 배경 Overlay 사용(설계 31) |
| backgroundOverlayOpacity | number | 선택 | `0.45` | Overlay 불투명도 0~1. 서버 저장 검증, WPF도 0~1로 보정 |
| popupPosition | string | 선택 | `CENTER` | §7 popupPosition ENUM. 없거나 잘못되면 CENTER |
| headerFontSize | number | 선택 | XAML 기본값(현재 Header 17) | 값이 있으면 10~40으로 보정 |
| bodyFontSize | number | 선택 | 유형별 XAML 기본값 | 값이 있으면 10~40으로 보정 |
| footerFontSize | number | 선택 | XAML 기본값(현재 Footer 14) | 값이 있으면 10~40으로 보정 |
| showDoNotShowAgain | boolean | O | `false` | 다시 보지 않기 체크박스 표시 |
| hideDays | integer | 선택 | `null` → HIDDEN 생성 시 30일 | 다시 보지 않기(HIDDEN) 결과의 숨김 일수. 1~3650(관리자 저장 시 서버 검증, 결과 요청도 같은 범위 §10.4) |
| completionRatio | number | VIDEO / 동영상+퀴즈 | `1.0` | 완료 인정 비율 0~1 |
| allowCloseBeforeComplete | boolean | VIDEO / 동영상+퀴즈 | `true` | 완료 전 닫기 허용 여부 |
| passingScore | number | QUIZ | `null` | 로컬 통과 점수. 채점 QUIZ는 반드시 명시(6.4 참고) |
| questions | array | SURVEY / QUIZ | `[]` | 문항 목록 |
| content | object | O | 유형별 필수값 포함 | 유형별 화면 데이터 및 공통 옵션 |

> `displayOrder`는 서버 정렬 기준이며 응답에 넣지 않는다(설계 35). 보내더라도 WPF는 표시 순서에 사용하지 않는다. Footer 버튼 표시는 `showFooterButton`만 사용한다. legacy 이름 `showCloseButton`은 수신하지 않는다(설계 29-11). 서버 내부 판정 값(`displayStartAt`·`displayEndAt`·`periodMode`·`repeat*`)은 응답에 넣지 않으며 보내더라도 WPF는 무시한다. Header는 검은 배경·흰 제목·고정 로고·높이 40, 일반 외곽은 테두리 0·Radius 6이며 FULLSCREEN은 Radius 0이다.

### 크기 처리 참고

WPF는 최종 렌더링 단계에서 화면 밖으로 나가지 않도록 값을 보정한다.

- FIXED: 작업 영역 95% 이내로 최종 제한. IMAGE는 고정 최대값을 사용하지 않고 작업 영역 90% 적용
- RATIO: 작업 영역 비율 사용
- FULLSCREEN: 주 모니터 전체
- AUTO: 콘텐츠 기준 자동 크기
- 잘못된 값은 일부 모드에서 기본값/보정값으로 처리되지만, 백엔드는 정상 범위 값을 제공해야 한다.

---

## 6.4 최신 코드 기준 필수값·누락 처리 점검 (2026-10-03, 2026-10-12, 2026-10-13 갱신)

기준: 최초 점검은 2026-10-03 `main` 코드이며, 이후 설계 29~34 변경(목록 필드 정리·결과 status 확장 등)을 2026-10-12 `main` 기준으로, 설계 35 단건 조회·결과 구조를 2026-10-13 기준으로 같은 절에 반영했다. 아래는 WPF 수신 코드와 같은 저장소의 Java 서버 저장 검증을 함께 대조한 결과다. 표의 필수 여부는 백엔드가 보장할 계약이며, C#이 JSON 누락을 모두 거부한다는 의미는 아니다. 현재 응답 DTO에는 required/JsonRequired 선언이 없고 별도의 전체 응답 검증 단계도 없다. 관리자 저장 API와 WPF 조회 응답은 서로 다른 계약이므로 이 예시를 관리자 저장 요청으로 사용하지 않는다.

### 반드시 제공할 값

| 필드 / 조건 | 백엔드 제공 기준 | 현재 WPF 누락·오류 처리 |
|---|---|---|
| 로그인 accessToken | 공백 아닌 토큰 | 로그인 단계에서 명시적으로 거부 |
| popup | 팝업 1건 객체. 대상 없음은 키를 유지하고 null | 생략·null 모두 표시 대상 없음으로 처리하고 조회 간격 뒤 다시 조회 |
| deliveryId | popup이 있으면 공백 아닌 서버 발급 ID | 빈 값이어도 화면은 표시되지만 결과 요청의 deliveryId가 비어 서버가 `REJECTED`(`WPF_INVALID_RESULT`)로 거절 |
| popupId | 공백 아닌 고유 ID. 서버 저장 기준 1~50자 | 빈 값도 생성 가능하지만 결과 수집 연결을 건너뛰므로 CLOSED/HIDDEN/SUBMITTED 등이 전송되지 않음 |
| popupType | TEXT / IMAGE / VIDEO / SURVEY / QUIZ | 누락·미지원 값은 Factory 오류. null도 처리 실패 |
| content | 유형별 object. null 금지 | 생략·null·잘못된 형식이면 화면 생성 실패. {}는 필수 내용까지 보장하지 않음 |
| IMAGE content.imageUrl | 공백 아닌 접근 가능한 이미지 경로/URL | 누락·빈 값은 View 생성자 오류 |
| VIDEO content.videoUrl | 공백 아닌 접근 가능한 영상 경로/URL | 누락·빈 값은 View 생성자 오류 |
| VIDEO+QUIZ content.videoEnabled / videoUrl | popupType=QUIZ, videoEnabled=true, 재생 가능한 영상 파일 URL | 플래그 생략은 일반 QUIZ. 활성화 후 URL 누락은 생성 실패 |
| SURVEY/QUIZ questions | 문항 1개 이상. null 항목 금지 | 생략은 빈 화면으로 진행할 수 있음. null은 변환 실패 |
| questionId / optionId | 양수이며 참조 대상과 일치. 문항 ID는 팝업 내 고유, 선택지 ID는 해당 문항 내 고유 | ID 기본값 0. 문항 중복은 응답 컨트롤 매핑·Radio 그룹 충돌, optionId 0 이하는 선택 답안 수집에서 제외 |
| questionType | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT | 누락·미지원 값은 문항 변환 실패 |
| question.title / options[].text | 공백 아닌 표시 문구 | 누락은 빈 문구로 표시될 수 있음. 서버 저장은 제목/선택지 1~1000자 검증 |
| options | 선택형은 2개 이상, TEXT는 [] | 생략은 빈 목록, null은 변환 실패. 기본 선택지를 자동 생성하지 않음 |
| 필수 문항 isRequired | 반드시 true를 명시 | 누락은 false이므로 필수 응답 검증이 적용되지 않음 |
| 채점 QUIZ isScored | 채점할 문항에 true, 최소 1개 이상 | 누락은 false. 채점 문항이 하나도 없으면 passingScore와 무관하게 score=0, passed=true |
| 채점 QUIZ questionScore | 유한 양수 배점. 서버 저장은 소수점 2자리, 최대 99999999.99 검증 | 누락/null은 0점으로 계산 |
| 채점 QUIZ passingScore | 최상위에 명시, 0~총점. 0점 통과가 의도되지 않았다면 양수 | 누락/null/0 이하는 통과 기준 0으로 계산되어 0점도 통과 가능 |
| 채점 선택형 options[].isCorrect | 정답은 true, 오답은 false 권장. 단일 정답 1개, 복수 정답 1개 이상 | 누락/null은 정답 아님. 정답 키가 없으면 해당 문항은 정답 처리되지 않음 |
| 채점 TEXT correctAnswer / answerMatchMode | 비어 있지 않은 정답, EXACT 또는 CONTAINS | 누락 시 해당 문항 오답. 구현은 지원하나 최소 외부 오픈 범위에서는 TEXT 자동 채점 제외 |
| 결과 응답 resultId | 요청한 resultId 그대로 반환 | 누락/불일치는 대기 결과를 해제하지 못해 재전송 지속 |
| 결과 응답 status | ACCEPTED / DUPLICATE / REJECTED / RETRYABLE_ERROR / INTERNAL_ERROR | 보낸 결과의 resultId이면서 종결 상태(ACCEPTED·DUPLICATE·REJECTED)일 때만 제거. 그 밖의 상태·미지원 값·누락은 보관 후 재전송(설계 34)하며 다음 조회를 미룸(§12.1) |

조회 응답 팝업의 Factory 변환이 실패하면 그 팝업을 표시할 수 없으며, 열린 전달 건이 표시 조건을 만족하는 동안 다시 조회해도 같은 팝업이 내려온다. 서버는 잘못된 팝업을 WPF 응답에 포함하지 않도록 응답 직전 검증을 수행해야 한다. 결과 응답은 결과 1건 객체로 반환하며 빈 본문·null은 처리 실패를 유발할 수 있다.

### 기본값 사용이 가능한 항목과 null 주의

- displayMode 생략은 SEQUENTIAL, sizeMode 생략은 FIXED. 명시한 값은 지원 ENUM이어야 하며 null은 허용하지 않는다.
- width/height 생략은 900/620, 표시 플래그는 6.3 표의 기본값 사용. 명시하는 수치에는 정상 범위 값을 전달한다.
- **필수 여부 표기 기준**: 6.3 표의 `O`는 "서버가 항상 출력하는 것을 권장하는 전체 계약 필드"다. 이 중 `displayMode`·`sizeMode`·`showHeader`·`showFooterButton`·`showFooter`·`showDoNotShowAgain`처럼 Default 열에 C# 값이 있는 필드는 생략해도 WPF가 그 기본값으로 동작한다. 그래서 [최소 기능](WPF_POPUP_MINIMAL_SPEC.md)·[전체 기능](WPF_POPUP_ALL_SPEC.md) 정의서는 이런 필드의 필수값 여부를 `N`(생략 가능, 기본값 적용)으로 적는다. 표기만 다르고 의미는 같다. 반면 `popupId`·`popupType`·`content` 및 위 "반드시 제공할 값"은 Default가 있어도 생략하면 결과 연결 실패나 화면 생성 실패가 생기므로 세 문서 모두 필수(`O`/`Y`)다. 최소 제공 범위의 선택 항목은 최소 기능 정의서를 따른다.
- optionLayout 생략·미지원 값은 VERTICAL. 현재 WPF는 정확히 대문자 HORIZONTAL일 때만 가로 배치하므로 서버는 정규 ENUM을 출력한다.
- completionRatio 생략/null은 1.0(100% 시청). 80% 완료가 필요하면 0.8을 명시한다. showHighlight/showBottomDescription은 문구가 있어도 플래그 생략 시 false다.
- pollingIntervalSeconds 생략/0은 로컬 기본 주기 사용. option.value는 선택 응답 식별자가 아니며 응답은 optionIds를 사용한다.
- [설계 34-31·32] `footerAction`·`popupPosition`의 빈 문자열·null은 생략과 같이 유형별 기본값(CLOSE 또는 SUBMIT, CENTER)으로 처리하며 미지원 값도 기본값이다. 백엔드 등록 단계는 빈 문자열을 생략으로 받고 미지원 값·유형에 맞지 않는 Action은 거부한다. `useBackgroundOverlay=false`·`backgroundOverlayOpacity=0`은 누락이 아닌 정상 명시값이다. 두 값은 non-nullable이므로 null 대신 생략한다. 글자 크기는 null·생략이면 화면 기본 크기다.
- **생략과 명시적 null은 다르다.** non-nullable bool/int/double의 null은 역직렬화 오류가 될 수 있다. string/list에 null이 들어가면 초기값을 덮어써 후속 처리 실패가 가능하다. nullable로 문서화된 값 외에는 null을 보내지 않는다. 날짜는 ISO 8601 문자열 또는 허용된 null만 전달한다.

### 저장소 서버 검증과 남은 보완 사항

PopupService.validateAdminPopup은 ID·제목·ENUM·크기·기간 등을 검사한다. PopupQuestionRules.validate는 SURVEY/QUIZ 문항, 선택형 보기 2개 이상, QUIZ 배점·정답·통과 점수를 검사한다. QUIZ의 videoEnabled=true에는 validateActionOptions가 videoUrl을 요구한다. 따라서 모든 필수값 처리가 없는 것은 아니다.

다만 현재 규칙에는 QUIZ의 isScored=true 문항 존재 보장이 없다. 일반 IMAGE/VIDEO의 공백 아닌 미디어 URL 검증도 위 저장 검증에서 보장하지 않는다. WPF 수신 측에는 ID 양수/중복·필수 데이터·채점 구성·결과 status의 전체 검증이 없다. 서버 저장 검증을 통과해도 isScored=false인 QUIZ가 0점 통과할 수 있으므로 다음을 보완 대상으로 관리한다.

- [ ] 서버 조회 응답: 공백 ID, 중복 문항/선택지 ID, 빈 질문/선택지, null 배열/항목, 유형별 미디어 필수값 검증.
- [ ] 서버 QUIZ 저장/조회: 최소 1개 isScored=true, 채점 배점·정답·passingScore 일관성 보장. 의도적인 0점 통과와 누락을 구분.
- [ ] WPF 수신: 필수값 검증 및 잘못된 팝업의 개별 격리 검토.
- [ ] WPF 결과 처리: status 필수·허용값 검증 후 대기열 종료 여부 결정 검토.

이 절은 현재 동작과 보완 대상을 명시한 것이며, 이번 문서 수정에서 클라이언트/서버 검증 코드는 변경하지 않았다. 기준 소스: PopupResponseDto, SurveyQuestionDto, PopupFactory, PopupManager.AttachResultCollection, SurveyPopupView.AddSelectedOption, QuizGrader, PopupResultQueue, 서버 PopupService 및 PopupQuestionRules.

---

# 7. PopupWindow 공통 옵션 (최상위)

3.7부터 `content`에는 popupType별 콘텐츠·전용 옵션만 둔다. PopupWindow 전체에 적용되는 공통 옵션은 §6.3의 `popup` 최상위 필드다(설계 30·31).

| 구분 | 최상위 필드 |
|---|---|
| Footer 동작 | `footerAction`, `footerLinkUrl` |
| 배경 Overlay | `useBackgroundOverlay`, `backgroundOverlayOpacity` |
| 위치 | `popupPosition` |
| 글자 크기 | `headerFontSize`, `bodyFontSize`, `footerFontSize` |

`content` 안에 같은 이름의 키가 있어도 WPF는 읽지 않는다. 관리자 저장 위치(CONTENT_OPTIONS)와 WPF 응답 위치는 달라도 된다. 서버가 응답 조립 시 최상위로 옮긴다.

Footer 동작(`footerAction`·`footerLinkUrl`)은 §6.3 최상위 필드다(설계 30). content 안의 같은 키는 읽지 않는다. `CLOSE`는 하단 버튼을 **닫기**로 표시하고 종료 처리 후 창을 닫는다. `LINK_AND_CLOSE`는 일반 콘텐츠의 하단 버튼을 **바로가기**로 표시하며, 기본 브라우저로 URL을 연 뒤 창을 닫는다. URL이 잘못되었거나 브라우저 실행이 실패하면 창을 유지하고 오류를 안내한다. `SUBMIT`은 SURVEY·QUIZ·VIDEO+QUIZ의 **제출**이며 링크를 열지 않는다. Header에는 닫기 버튼이 없으며 Alt+F4 등 종료 경로에는 기존 종료 정책을 적용한다. 버튼 표시는 `showFooter`·`showFooterButton`을 따른다.

SURVEY·QUIZ·VIDEO+QUIZ는 제출 버튼을 하나만 표시한다. 공통 푸터가 있으면 내부 제출 버튼을 숨기고 하단 제출에서 응답 수집·검증·채점을 실행한다. 푸터가 없으면 내부 제출 버튼을 사용한다. `showFooterButton=false`여도 제출 버튼은 유지한다. 미응답·QUIZ 불합격은 안내 후 창을 유지하며, 통과한 QUIZ는 `SUBMITTED`에 답안·score·passed를 포함한다. 영상 시청 후 Alt+F4로 종료한 결과는 제출과 구분한다. 제출·채점 안내는 흰색 바탕·검은 테두리·둥근 버튼의 공통 모달을 사용한다.

### popupPosition ENUM

```text
CENTER
TOP_LEFT
TOP_CENTER
TOP_RIGHT
CENTER_LEFT
CENTER_RIGHT
BOTTOM_LEFT
BOTTOM_CENTER
BOTTOM_RIGHT
```

위치는 현재 **주 모니터 작업 영역** 기준이다. FULLSCREEN은 위치 값과 무관하게 주 모니터 전체 화면을 사용한다.

---

# 8. 유형별 content 계약

## 8.1 TEXT

```json
{
  "plainText": "서비스 안내\n공지 내용을 확인해 주세요.\n서비스 점검 안내입니다.",
  "textBlocks": [
    { "alignment": "LEFT", "runs": [ { "text": "서비스 안내", "bold": true, "size": 24 } ] },
    { "alignment": "LEFT", "runs": [ { "text": "공지 내용을 확인해 주세요." } ] },
    { "alignment": "LEFT", "runs": [ { "text": "서비스 " }, { "text": "점검", "bold": true, "color": "#DC2626" }, { "text": " 안내입니다." } ] }
  ],
  "showPlainText": true,
  "highlightText": "작업 중인 내용을 저장해 주세요.",
  "showHighlight": true,
  "bottomDescription": "자세히 보기",
  "bottomDescriptionUrl": "https://example.com/notice",
  "showBottomDescription": true
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| plainText | string | 조건부 | `""` | textBlocks가 없을 때 표시하는 일반 문자열 본문. textBlocks가 있으면 서버가 textBlocks에서 만든 일반 문자열(Run 글자 연결, 문단 사이 `\n`)이며 표시는 textBlocks가 우선한다. 이 저장소 서버는 TEXT 응답에 저장 본문(CONTENT_BODY)으로 항상 키를 채우며 저장 본문이 없으면 `null`일 수 있다 |
| textBlocks | array | 선택 | 없음 | 서식 본문. 콘텐츠 제목·설명도 앞 문단으로 포함한다. 있으면 plainText 대신 표시(아래 표) |
| showPlainText | boolean | 선택 | `true` | 본문 표시 여부 |
| highlightText | string | 선택 | `""` | 강조 문구 |
| showHighlight | boolean | 선택 | `false` | 강조 영역 표시 여부 |
| bottomDescription | string | 선택 | `""` | 하단 설명 |
| bottomDescriptionUrl | string | 선택 | `""` | 클릭 시 이동 URL |
| showBottomDescription | boolean | 선택 | `false` | 하단 설명 영역 표시 |

Markdown 필드는 현재 C# 화면에서 사용하지 않는다.

TEXT에는 별도 콘텐츠 제목·설명 필드가 없다(설계 37에서 `contentTitle`·`description`·`showContentHeader` 제거). 제목·설명은 본문 앞 문단으로 작성하며, 통합 전 데이터는 서버가 조회 시 제목 문단(`LEFT`, 굵게, 크기 24) → 설명 문단(`LEFT`) → 기존 본문 순으로 합쳐 보낸다. textBlocks가 없던 행은 기존 plainText 줄을 문단으로 바꿔 뒤에 붙인다. [설계 39-3] 제목·설명은 보이고 본문은 숨겼던 행(`showPlainText=false`)은 헤더만 보이기 — 제목·설명 문단만 보내고 숨긴 본문은 빼며 `showPlainText=true`로 바꾼다(관리자 재저장 시 숨긴 본문 삭제). 제목·설명을 숨겼던 행(`showContentHeader=false`)은 합치지 않는다. 창 Header의 공통 `title`은 별도다.

### textBlocks (서식 본문, 설계 28)

`textBlocks`가 있으면 WPF는 `plainText` 대신 문단·Run 서식 본문을 표시한다. 없으면 기존처럼 `plainText`를 표시한다.
서버는 저장 시 `textBlocks`를 검증하고 `plainText`를 `textBlocks`에서 다시 만들어 저장한다(클라이언트가 보낸 plainText는 사용하지 않음). HTML은 저장·전달하지 않는다.

| 필드 | 형식 | 필수 여부 | 허용 값 | 설명 |
|---|---|---|---|---|
| textBlocks[] | array | 선택 | 최대 500문단 | 문단 목록. 문단 사이는 줄바꿈 |
| textBlocks[].alignment | string | 선택 | `LEFT`(기본)·`CENTER`·`RIGHT` | 문단 정렬 |
| textBlocks[].runs[] | array | O | 전체 최대 2000개 | 같은 서식의 글자 묶음. 빈 배열 = 빈 문단 |
| runs[].text | string | O | 빈 값 불가, `\n`·`\t` 외 제어 문자 불가 | 글자. `\n`은 문단 내부 줄바꿈 |
| runs[].bold / italic / underline | boolean | 선택 | `true`·`false` | 굵게·기울임·밑줄 |
| runs[].color | string | 선택 | 대문자 `#RRGGBB` | 글자 색. 팔레트로 제한하지 않음(관리자 편집기 팔레트는 선택지일 뿐). 가독성은 작성자가 판단 |
| runs[].size | number | 선택 | 12·14·16·18·20·24·28·32 (px) | 글자 크기. 없으면 bodyFontSize·기본 크기 |
| runs[].font | string | 선택 | `MALGUN_GOTHIC`·`GULIM`·`DOTUM`·`BATANG` | 글꼴 ID. PC에 없으면 대체 글꼴 |

본문 전체(파생 plainText)는 20000자 이하이다. 허용 밖 키·값은 저장 API가 거부하며, WPF는 허용 밖 서식 값을 무시하고 글자만 표시한다. 1차 적용 대상은 TEXT 본문뿐이며 다른 유형의 content에 textBlocks를 넣으면 저장을 거부한다.

---

## 8.2 IMAGE

```json
{
  "imageTitle": "이미지 안내",
  "imageUrl": "https://example.com/notice.png",
  "description": "이미지 설명",
  "showDescription": true,
  "imageSizeMode": "ADAPTIVE",
  "width": 640,
  "height": 480
}
```

위 예시는 일반 모드(ADAPTIVE)다.

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| imageTitle | string | 선택 | `""` | 이미지 콘텐츠 내부 제목 |
| imageUrl | string | O | `""` | 표시할 이미지 URL/경로. 빈 값이면 이미지 팝업 생성 불가 |
| description | string | 선택 | `""` | 이미지 설명 |
| showDescription | boolean | 선택 | `true` | 설명 표시 여부 |
| imageSizeMode | string | 선택 | `ADAPTIVE` | ADAPTIVE / FIT_TO_IMAGE / ORIGINAL |
| width | number | 선택 | 원본 기반 계산 | ADAPTIVE 창 너비, FIT_TO_IMAGE 실제 이미지 너비, 양수·유한값 |
| height | number | 선택 | 원본 기반 계산 | ADAPTIVE 창 높이, FIT_TO_IMAGE 실제 이미지 높이, 양수·유한값 |
| keepAspectRatio | boolean | FIT_TO_IMAGE 전용 | `true` | 원본 비율 고정/해제 |

### imageSizeMode

| 값 | 의미 |
|---|---|
| ADAPTIVE | 팝업 크기가 기준. 이미지를 배정 영역 안에 비율 유지하여 표시 |
| FIT_TO_IMAGE | content.width/height 이미지 크기 기준, 없으면 원본 DIP. 최대 창 초과 시 축소 없이 Clip |
| ORIGINAL | 팝업 크기는 유지. 원본 이미지를 왼쪽 위에 확대·축소 없이 표시하고 오른쪽·아래 초과 부분을 자름 |

필드가 없으면 ADAPTIVE로 처리한다. 위 세 값 외의 값(과거 값 `FIXED`, 빈 문자열 포함)은 C#이 지원하지 않는 값으로 보고 팝업 변환에 실패한다. ORIGINAL은 v3.4 클라이언트부터 지원한다.

ORIGINAL은 헤더·푸터를 제외한 본문 전체를 이미지 영역으로 사용한다. 콘텐츠 제목·설명·content.width/height·keepAspectRatio는 사용하지 않는다. 작은 이미지는 확대하지 않고 남는 영역을 흰색으로 표시하며 스크롤하지 않는다. 이미지 클릭 동작은 없다(3.7에서 `linkUrl` 삭제). 원본 픽셀 크기 1px를 WPF 1 DIP / 웹 1 CSS px로 표시하며 이미지 파일의 DPI 메타데이터는 크기 계산에 사용하지 않는다(OS 화면 배율은 적용된다).

관리자 신규 등록 기본 선택은 ADAPTIVE이며, 기존 저장값과 필드 미지정 시 ADAPTIVE 동작은 유지한다. JSON 예: `{"imageSizeMode":"ORIGINAL","imageUrl":"https://example.com/notice.png"}`.

### 비율 및 창 경계 (v3.6 / 설계 23)

- 일반 IMAGE의 크기는 content.width/height 한 쌍만 전달한다. 최상위 width/height는 생략한다. ORIGINAL은 기존 최상위 창 크기를 사용한다.
- ADAPTIVE: content 크기는 창 크기. 미지정 축은 원본 이미지와 실제 제목·설명·여백을 측정해 산정한다. 로딩 전 임시 창은 560×420 DIP이며, 명시한 축은 유지한다. 이미지는 원본보다 확대하지 않고 가용 영역 안에 비율을 유지해 표시한다.
- FIT_TO_IMAGE: content 크기는 실제 이미지 표시 DIP 크기. keepAspectRatio 기본 true. 고정이면 한쪽 수정 시 다른 쪽을 원본 비율로 계산한다. 양쪽 API 값이 비율과 다르면 **너비 우선으로 높이를 정규화**한다. 편집기 연동값은 소수 둘째 자리로 반올림하되, 렌더링은 원본 비율로 다시 계산하므로 별도 오차 거부 기준은 없다.
- 해제(false)는 양쪽을 그대로 사용해 왜곡을 허용하며 누락한 축만 원본 DIP 길이로 채운다. 둘 다 없으면 원본 DIP 크기다. 서버는 원본 URL을 다운로드하지 않는다. 원본 로딩 후 WPF와 웹에서 계산한다.
- IMAGE 창 최대는 현재 모니터 작업 영역 너비·높이의 **90%**다. 고정 maximumWidth/maximumHeight 값(기본 1200×900)은 IMAGE 창 상한으로 사용하지 않는다. 최소는 이 화면 상한 이하로 보정하고, 최소로 늘어난 창에는 이미지 주변 여백을 허용한다. content.width/height의 지정 픽셀/DIP 크기는 유지하며 FIT_TO_IMAGE의 최대 초과 부분은 **중앙 기준**으로 자른다. ORIGINAL은 왼쪽 위 Clip을 유지한다. FULLSCREEN은 모니터 전체 크기를 우선한다. 다른 유형의 기존 최대 크기 정책은 유지한다.
- 설명은 항상 아래. showDescription=false 또는 공백이면 설명과 14 DIP 전용 간격을 제거한다. 설명은 가용 너비로 줄바꿈하고 하단 가용 콘텐츠 높이의 최대 30%에서 세로 스크롤한다. 제목·닫기·푸터는 이미지와 함께 스크롤하지 않는다.
- 크기 계산에는 이미지 Border, 제목·설명 실제 측정, 콘텐츠 Margin(28/24), 그림자용 바깥 Margin(24), 창 Border, 표시 중인 Header(40)·Footer(80) 행을 사용한다. 이미지와 무관한 190/300 높이 추정은 제거했다.
- WPF 원본 DIP는 파일 DPI를 반영한다. 브라우저 원본은 naturalWidth/naturalHeight CSS px이므로 파일 DPI·글꼴·작업 영역이 다른 PC와 미리보기 사이에는 차이가 생길 수 있다. ORIGINAL은 기존처럼 메타데이터 DPI와 무관하게 원본 1px=1 DIP, 왼쪽 위 기준으로 자른다.
- FILL, imageWidth/imageHeight, descriptionPosition, imageAreaRatio는 새 입력에서 제거했다. 서버 저장은 해당 키·모드와 중복 최상위 크기를 거절한다. 기존 DB는 조회 변환 또는 전환 계획 스크립트를 통해 새 계약으로 제공한다.

---

## 8.3 VIDEO

```json
{
  "videoTitle": "교육 영상",
  "videoUrl": "https://example.com/education.mp4",
  "description": "영상을 시청해 주세요.",
  "showDescription": true,
  "showControls": true,
  "allowFullScreen": true,
  "allowPlaybackRateChange": true,
  "allowSeek": true,
  "autoPlay": false,
  "isLoop": false,
  "defaultVolume": 0.7
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| videoTitle | string | 선택 | `""` | 영상 콘텐츠 내부 제목 |
| videoUrl | string | O | `""` | 재생할 영상 URL/경로 |
| description | string | 선택 | `""` | 영상 설명 |
| showDescription | boolean | 선택 | `true` | 설명 표시 |
| showControls | boolean | 선택 | `true` | 컨트롤 표시 |
| allowFullScreen | boolean | 선택 | `true` | 영상 전체화면 허용 |
| allowPlaybackRateChange | boolean | 선택 | `true` | 배속 변경 허용 |
| allowSeek | boolean | 선택 | `true` | 진행바로 재생 위치 변경 허용. 동영상+퀴즈에도 적용 |
| autoPlay | boolean | 선택 | `false` | 자동 재생 |
| isLoop | boolean | 선택 | `false` | 반복 재생 |
| defaultVolume | number | 선택 | `0.7` | 시스템 볼륨 연결 전/실패 시 내부 플레이어 초기 음량 0~1. 연결 성공 시 현재 Windows 볼륨 우선 |

VIDEO의 완료 기준은 content가 아니라 **popup 최상위 `completionRatio` / `allowCloseBeforeComplete`**를 기준으로 한다.

로컬 영상은 MediaElement, 직접 재생 가능한 HTTP/HTTPS URL은 WebView2 내부 HTML5 video로 재생하지만 두 방식 모두 영상 하단에 겹치는 **공통 WPF Overlay 컨트롤바**를 사용한다. 컨트롤은 별도 높이를 차지하지 않으며 재생 중 일반 화면 3초·영상 전체화면 2초 무입력 또는 마우스 이탈 시 숨기고 진입·이동 시 표시한다. 일시정지·조작 중에는 표시를 유지한다. URL 영상의 Chromium 기본 controls는 표시하지 않는다. `showControls=false`이면 공통 컨트롤을 숨기며 영상 클릭으로 재생/일시정지를 전환할 수 있다. `allowFullScreen=false`이면 WPF 전체화면 버튼을 숨기고 진입을 금지한다. HTML5 자체 전체화면 대신 WPF의 옵션을 검사하는 전체화면을 사용한다. `allowPlaybackRateChange=false`이면 배속 버튼을 숨기고 HTML5 영상도 1.0배로 제한한다. `allowSeek=false`이면 진행바 클릭·드래그·키보드·UI Automation으로 재생 위치를 바꿀 수 없고 HTML5 seek 명령도 무시한다. 진행률·현재/전체 시간 표시와 루프·종료 후 재시작은 유지하며 전체화면에서도 같은 정책을 적용한다.

음량·음소거는 Windows 기본 멀티미디어 출력 장치의 Master Volume/Mute와 양방향 동기화한다. 시작 시 현재 Windows 값을 읽고 시스템 설정을 바꾸지 않는다. 연결 성공 시 내부 영상 음량은 1.0으로 유지해 이중 감쇠를 방지하며, `defaultVolume`은 시스템 볼륨 연결 전/실패 시 내부 플레이어 초기값으로 사용한다. 슬라이더를 0보다 크게 조절하면 Windows 음소거도 해제하고, 음소거 버튼은 현재 음량 값을 유지한 채 Windows Mute만 전환한다. 외부 변경은 이벤트로 반영하고 기본 장치 변경·장치 없음은 2초 주기로 확인한다. 변경은 다른 프로그램의 출력에도 영향을 주며 팝업 종료 시 이전 시스템 값으로 복원하지 않는다. 장치 복구 시 새 장치의 현재 값을 읽는다.

위치·재생/일시정지·음량·배속·종료·오류는 WPF 컨트롤과 동기화하며 waiting/stalled는 버퍼링 안내로 표시한다. 탐색한 구간은 누적 `watchedSeconds`에 합산하지 않는다.

---

## 8.4 SURVEY

```json
{
  "popupId": "SURVEY-001",
  "popupType": "SURVEY",
  "title": "만족도 조사",
  "questions": [
    {
      "questionId": 101,
      "title": "서비스는 만족스러웠습니까?",
      "description": "",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": false,
      "options": [
        {
          "optionId": 1001,
          "value": "YES",
          "text": "예"
        },
        {
          "optionId": 1002,
          "value": "NO",
          "text": "아니요"
        }
      ]
    }
  ],
  "content": {
    "surveyTitle": "만족도 조사",
    "description": "문항에 응답해 주세요."
  }
}
```

SURVEY는 정답 키가 필요하지 않다.

---

## 8.5 QUIZ

```json
{
  "popupId": "QUIZ-001",
  "popupType": "QUIZ",
  "title": "보안 퀴즈",
  "passingScore": 80,
  "questions": [
    {
      "questionId": 201,
      "title": "올바른 항목을 선택하세요.",
      "description": "",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": true,
      "questionScore": 100,
      "options": [
        {
          "optionId": 2001,
          "value": "A",
          "text": "정답",
          "isCorrect": true
        },
        {
          "optionId": 2002,
          "value": "B",
          "text": "오답",
          "isCorrect": false
        }
      ]
    }
  ],
  "content": {
    "surveyTitle": "보안 퀴즈",
    "description": "통과 점수 이상 획득해야 합니다."
  }
}
```

QUIZ는 WPF에서 즉시 채점하므로 **정답 정보가 반드시 필요하다.**

### 선택형 채점

- `options[].isCorrect=true`인 선택지 집합과 사용자가 선택한 집합이 정확히 같아야 정답
- 부분 점수 없음

### TEXT 채점

TEXT 문항은 다음 필드를 사용할 수 있다.

```json
{
  "questionId": 202,
  "questionType": "TEXT",
  "isRequired": true,
  "isScored": true,
  "questionScore": 20,
  "correctAnswer": "OPENAI",
  "answerMatchMode": "EXACT",
  "options": []
}
```

`answerMatchMode`:

```text
EXACT
CONTAINS
```

### QUIZ 실패/성공 동작

```text
채점
→ passingScore 미달
→ 점수 안내
→ 창 유지
→ 답 수정 후 다시 채점

passingScore 이상
→ SUBMITTED 결과 생성
→ 로컬 큐 저장
→ 창 닫기
→ 결과 API 백그라운드 전송
```

따라서 백엔드는 **미통과 QUIZ의 SUBMITTED 결과가 오지 않는 것**을 정상 동작으로 본다.

## 8.6 동영상 + 퀴즈 (v3.3)

별도 popupType을 추가하지 않고 `popupType: "QUIZ"`, `content.videoEnabled: true`로 지정한다. 일반 QUIZ는 이 옵션을 생략하거나 false로 보낸다.

```json
{
  "popupType": "QUIZ",
  "completionRatio": 0.8,
  "passingScore": 80,
  "allowCloseBeforeComplete": true,
  "content": {
    "videoEnabled": true,
    "videoUrl": "https://example.com/training.mp4",
    "videoTitle": "이해도 확인",
    "surveyTitle": "이해도 확인",
    "description": "영상을 시청한 뒤 퀴즈에 응답하세요.",
    "autoPlay": false,
    "showControls": true
  }
}
```

위 예시는 관련 필드만 발췌했다. 공통 필드와 최상위 `questions`·정답·문항 배점은 일반 QUIZ와 같다. 영상 재생 옵션은 §8.3 VIDEO와 같다. 동영상+퀴즈의 콘텐츠 제목은 저장 컬럼 1개(CONTENT_TITLE = `surveyTitle`)에 저장하므로 이 저장소 서버는 `videoTitle`을 `surveyTitle`과 같은 값으로 내려준다. 두 제목을 다르게 보내는 계약은 없다.

- 영상 아래 퀴즈를 함께 표시한다. 영상·전체 문항은 부모 단일 세로 스크롤로 이동하고 제출 영역은 스크롤 밖 창 하단에 고정한다. 공통 푸터를 켜면 공통 푸터의 제출 버튼만 표시하고, 끄면 내부 제출 영역을 하단에 고정한다. 결합 모드의 내부 Quiz ScrollViewer는 제거하지만 단독 SURVEY/QUIZ는 자체 스크롤을 유지한다. 현재 영상 결합은 QUIZ에만 지원하며 VIDEO+SURVEY 유형은 없다.
- SURVEY/QUIZ 및 결합 QUIZ의 공통 푸터 버튼은 `footerAction=SUBMIT`(제출) 고정이다. 서버가 다른 값을 보내도 WPF는 제출로 동작하며 링크를 열지 않는다. Header에는 닫기 버튼이 없으며(고정 로고만 표시) Alt+F4 등 종료 경로는 `allowCloseBeforeComplete` 등 기존 종료 정책을 따른다.
- 영상 길이가 확인되고 `watchedSeconds / durationSeconds`를 소수점 4자리에서 내린 비율이 최상위 `completionRatio` 이상일 때 퀴즈 입력·제출 버튼과 **푸터 전체**를 활성화한다. 미설정 기준은 1.0이다.
- 현재 재생 위치나 최대 도달 위치로 활성화하지 않는다. 활성화한 뒤 되감기·반복 재생을 해도 다시 잠그지 않는다.
- `allowCloseBeforeComplete: true`면 Alt+F4 등으로 중단할 수 있지만 푸터는 시청 기준까지 비활성화한다. Header에는 X 버튼이 없다. false면 시청 기준 전 종료를 차단한다. 영상 재생 실패 시에는 종료를 허용하며 퀴즈를 자동 활성화하지 않는다.
- 이 모드는 로컬 영상 파일 경로 또는 직접 재생 가능한 HTTP(S) 영상 URL을 사용한다.
- 영상만 보고 닫으면 `VIDEO_WATCHED`를 보내되 **퀴즈 완료로 처리하지 않는다**. 퀴즈 통과 후에만 `SUBMITTED`로 완료한다. 숨김 선택 시에는 기존 HIDDEN 정책을 따른다.
- 새 모드를 사용하려면 WPF와 백엔드를 함께 갱신해야 한다. 기존 클라이언트는 `videoEnabled`를 이해하지 못한다.

---

# 9. questions[] 계약

선택지는 직접 전달한다(C#이 기본 보기를 자동 생성하지 않는다). 각 문항의 optionLayout으로 가로·세로를 개별 지정하며, 누락·미지원 값은 WPF에서 세로형으로 표시한다. 한 팝업에서 두 배치를 혼합할 수 있다.

단일·복수 선택 모두 VERTICAL은 전체 폭 Outline Row와 항상 보이는 우측 체크 Path, HORIZONTAL은 원형/사각 표시 없는 Choice Chip으로 렌더링한다. 단일 선택은 한 개, 복수 선택은 여러 개의 OPTION_ID를 수집하며 기존 응답 계약을 유지한다. 긴 문장은 자동 줄바꿈하고 선택 상태는 무채색 배경·테두리·글자 굵기로 구분한다. UI 색상·아이콘·간격을 위한 새 JSON 필드는 추가하지 않는다.

필수 응답 진행 상태와 제출 버튼은 본문 스크롤 밖 하단에 고정한다. 미응답 필수 문항이 있으면 비활성화하고, VIDEO+QUIZ는 영상 시청 잠금도 해제되어야 활성화한다. TEXT의 Placeholder는 응답으로 저장하지 않는다. Demo 및 관리자 미리보기의 예제 문항은 실제 API가 제공해야 할 기본 보기나 정답을 의미하지 않는다.

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| questionId | integer | O | `0` | 결과 answers의 참조 ID. 실제 서버는 유효 ID 제공 |
| title | string | O | `""` | 질문 제목 |
| description | string | 선택 | `""` | 부가 설명 |
| questionType | string | O | 없음 | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT |
| optionLayout | string | 선택 | `VERTICAL` | VERTICAL / HORIZONTAL |
| isRequired | boolean | 선택 | `false` | 필수 응답 여부 |
| isScored | boolean | 채점 QUIZ 필수 | `false` | QUIZ 채점 대상 여부 |
| questionScore | number | 채점 QUIZ | `null` → C# 계산상 0점 | 문항 배점 |
| correctAnswer | string | QUIZ TEXT 채점 문항 | `null` | TEXT 정답 |
| answerMatchMode | string | QUIZ TEXT 채점 문항 | `null` | EXACT / CONTAINS |
| options | array | 선택형 문항 | `[]` | 선택형 보기. TEXT는 빈 배열 |

### options[]

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| optionId | integer | O | `0` | 제출 시 optionIds에 사용. 실제 서버는 유효 ID 제공 |
| value | string | 선택 | `""` | 선택지 업무 값 |
| text | string | O | `""` | 화면 표시 문구 |
| isCorrect | boolean | QUIZ 선택형 채점 문항 | `null` | 정답 여부. SURVEY에서는 생략 가능 |

---

# 10. WPF-02 결과 단건 전송

## 10.1 기본 흐름

WPF는 사용자 동작 직후 서버 응답을 기다린 다음 창을 닫는 구조가 아니다.

```text
사용자 동작
→ WPF 로컬 결과 생성
→ %LOCALAPPDATA%\Popup\pending-results.json 저장
→ 팝업 닫기
→ POST /api/wpf/popups/results (결과 1건)
→ 응답 status·nextStatus로 다음 조회 시점 결정(§6.2)
```

팝업 1건의 결과는 요청 1건이다. 네트워크/서버 오류 시 파일에 남겨 두고 동일 `resultId`로 재전송한다(§12.1).

백엔드는 `resultId`를 **멱등 키**로 처리해야 한다.

---

## 10.2 Request

```http
POST /api/wpf/popups/results
Content-Type: application/json
Authorization: Bearer <token>
X-Client-Version: 1.0.0
```

```json
{
  "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
  "deliveryId": "d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e11",
  "popupId": "NOTICE-001",
  "resultType": "CLOSED",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00"
}
```

요청 본문은 결과 1건 객체다. 이전 envelope(`clientRequestId`·`sentAt`·`results[]` 1~50건)는 설계 35에서 삭제했으며 배열·일괄 재전송은 제공하지 않는다.

### 결과 필드

| 필드 | 형식 | 필수 여부 | Default/생성 기준 |
|---|---|---|---|
| resultId | string(GUID) | O | 팝업 결과 생성 시 GUID 생성, 재전송 시 유지. 64자 이하 |
| deliveryId | string | O | 조회 응답 `popup.deliveryId` 그대로. 64자 이하. 서버가 전달 건 소유·팝업 일치·미종료를 검증 |
| popupId | string | O | 원 팝업의 popupId. 전달 건의 팝업과 같아야 함 |
| resultType | string | O | 기본 객체값은 CLOSED이나 실제 동작에 따라 타입 결정 |
| displayedAt | string(ISO) | 선택 | `null` 가능 |
| closedAt | string(ISO) | 선택 | `null` 가능 |
| hideDays | integer | HIDDEN 필수 | `null`. HIDDEN 생성 시 조회 응답 popup의 hideDays(1~3650), 없으면 30. 1~3650(§10.4) |
| answers[] | array | SUBMITTED(SURVEY·QUIZ·VIDEO+QUIZ) 필수 | `null`. 1개 이상. `questionId`·`optionIds[]`(TEXT는 [])·`textAnswer`(TEXT 문항). null 요소 금지(§10.5·10.6) |
| score | number | QUIZ SUBMITTED 필수 | `null`. WPF 최종 채점 점수, 0 이상. SURVEY는 보내지 않음(§10.6) |
| passed | boolean | QUIZ SUBMITTED 필수 | `null`. WPF 최종 통과 여부(§10.6) |
| video | object | VIDEO_WATCHED·VIDEO+QUIZ SUBMITTED 필수 | `null`. 영상 시청 정보(§10.7) |

유형별 블록의 필수 여부는 resultType·팝업 유형에 따른 조건부 값이다. 블록 누락·형식 오류는 그 결과를 `REJECTED`로 응답한다(§11). 제안서 v0.3의 `action`·`completedAt` 이름은 채택하지 않고 기존 `resultType`·`closedAt` 등 필드 이름을 유지한다(그 밖의 차이는 §10.9).

> `closedAt - displayedAt`은 팝업 표시부터 종료·제출까지의 **화면 체류·처리 시간**이며, 첫 입력부터의 실제 응답 시간은 아니다(설계 34-09). 서버는 두 시각을 사용자·팝업 단위 상태(USER_POPUP_STATUS의 표시·닫기 시각)에 최신값으로 반영하므로, 결과 건별 체류 시간 통계가 필요하면 별도 보존 경로를 정해야 한다. 별도 응답 시작 시각(`responseStartedAt`)은 displayedAt과 같은 값이라 제거했다(설계 32). 보내더라도 서버는 무시한다.

### resultType ENUM

```text
CLOSED
HIDDEN
SUBMITTED
VIDEO_WATCHED
```

---

## 10.3 CLOSED

```json
{
  "resultId": "GUID",
  "deliveryId": "d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e11",
  "popupId": "NOTICE-001",
  "resultType": "CLOSED",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00"
}
```

---

## 10.4 HIDDEN

```json
{
  "resultId": "GUID",
  "deliveryId": "d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e12",
  "popupId": "NOTICE-001",
  "resultType": "HIDDEN",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00",
  "hideDays": 7
}
```

- `hideDays`: 1~3650
- 서버가 해당 사용자/팝업에 대한 숨김 만료 시각을 계산·저장한다.
- **HIDDEN 우선**: "다시 보지 않기"를 체크하고 닫으면 영상을 시청했더라도 결과는 `HIDDEN`이다. 이때 `video` 블록은 보내지 않으며 서버도 HIDDEN 결과에서 영상 시청 정보를 기록하지 않는다. 따라서 끝까지 시청한 VIDEO를 숨김으로 닫으면 시청 완료로 기록되지 않는다.

---

## 10.5 SUBMITTED — SURVEY

```json
{
  "resultId": "GUID",
  "deliveryId": "d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e13",
  "popupId": "SURVEY-001",
  "resultType": "SUBMITTED",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00",
  "answers": [
    {
      "questionId": 101,
      "optionIds": [1001]
    },
    {
      "questionId": 102,
      "textAnswer": "좋았습니다.",
      "optionIds": []
    }
  ]
}
```

---

## 10.6 SUBMITTED — QUIZ

```json
{
  "resultId": "GUID",
  "deliveryId": "d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e14",
  "popupId": "QUIZ-001",
  "resultType": "SUBMITTED",
  "answers": [
    {
      "questionId": 201,
      "optionIds": [2001]
    }
  ],
  "score": 100,
  "passed": true
}
```

현재 WPF는 통과한 QUIZ만 SUBMITTED 한다.

`score`·`passed`는 QUIZ SUBMITTED에서 필수다. 백엔드가 문항별로 계산한 점수·정오답(문항 상세 저장)은 진단값이며, 그 합계가 저장된 최종 점수(WPF `score`)와 다를 수 있다(설계 34-16). 최종 점수·통과·완료는 WPF 값만 기준으로 한다. QUIZ 최종 판정은 WPF 책임이며 백엔드는 두 값을 그대로 저장하고 완료 판정에 사용한다(설계 33). 값이 없거나 score가 음수·비정상 수이면 `REJECTED`(`WPF_INVALID_RESULT`)로 처리한다. 백엔드가 자체 계산한 점수와 다르면 로그만 남기고 저장 값은 바꾸지 않는다. SURVEY에는 보내지 않는다.

동영상+퀴즈의 SUBMITTED는 위 `answers`·`score`·`passed`와 함께 §10.7의 `video` 블록을 같은 결과에 넣는다. 백엔드는 영상 블록과 시청 기준을 확인한 뒤 답안을 저장하며, 시청 기준 미달 또는 영상 블록 누락 시 제출을 거절한다. 영상 시청만으로 퀴즈 완료 상태를 갱신하지 않는다.

---

## 10.7 VIDEO_WATCHED

```json
{
  "resultId": "GUID",
  "deliveryId": "d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e15",
  "popupId": "VIDEO-001",
  "resultType": "VIDEO_WATCHED",
  "displayedAt": "2026-09-28T15:30:00+09:00",
  "closedAt": "2026-09-28T15:40:00+09:00",
  "video": {
    "durationSeconds": 600.0,
    "positionSeconds": 590.0,
    "maximumPositionSeconds": 600.0,
    "watchedSeconds": 580.5
  }
}
```

| 필드 | 형식 | 필수 여부 | Default | 단위/의미 |
|---|---|---|---|---|
| durationSeconds | number | O | `0` | 초, 전체 길이 |
| positionSeconds | number | O | `0` | 초, 현재 위치 |
| maximumPositionSeconds | number | O | `0` | 초, 최대 도달 위치 |
| watchedSeconds | number | O | `0` | 초, 누적 시청 시간 |

VIDEO를 닫을 때 "다시 보지 않기"가 체크되어 있으면 `VIDEO_WATCHED` 대신 `HIDDEN`을 보낸다(§10.4 HIDDEN 우선). 이 경우 시청 정보는 전송·기록되지 않는다.

---

## 10.8 결과 저장 후 서버 처리와 재노출 기준

서버는 결과 1건을 다음 순서로 처리한다(설계 35).

```text
resultId 영수증 확인(이미 있으면 DUPLICATE)
→ 전달 건 확인: 존재·요청 사용자 소유·popupId 일치·미종료
→ 유형별 결과 처리(기존 숨김·제출·시청·완료 판정)
→ 같은 트랜잭션에서 전달 건 종료 + 재노출 유예(저장 시각 + pollingIntervalSeconds) 기록 + 영수증 기록
→ 응답(status, 저장 성공이면 nextStatus)
```

| 결과 | 이후 조회 |
|---|---|
| TEXT·IMAGE `CLOSED`(Footer 닫기·바로가기 `LINK_AND_CLOSE` 포함) | 완료 처리. 노출 기간 안에서 다시 표시하지 않음 |
| `HIDDEN` | 기존 숨김 정책. `hideDays` 동안 제외. 영상 시청 정보는 기록하지 않음(§10.4) |
| SURVEY·QUIZ `SUBMITTED`, VIDEO 시청 기준 충족 | 기존 완료 조건대로 완료 처리 |
| 미완료로 끝난 SURVEY·QUIZ·VIDEO(완료 전 닫기, QUIZ 미통과, 시청 기준 미달) | 저장 시각부터 `pollingIntervalSeconds` 동안 조회·`nextStatus` 후보에서 제외. 이후에도 표시 조건을 만족하면 다시 표시 |

`nextStatus`는 같은 제외 기준으로 남은 후보가 있는지를 뜻한다. 방금 저장한 팝업은 완료·숨김·유예로 이미 제외되어 있다.

## 10.9 제안서 0.3과 구현 계약 차이

구현 계약은 이 문서다. 제안서 v0.3은 요구사항 출처로만 참고하며, 아래 차이가 있는 항목은 이 문서의 이름·형식·응답 방식을 따른다.

| 구분 | 제안서 v0.3 | 구현 계약(이 문서) |
|---|---|---|
| 경로 | `/api/v1/auth/login`, `/api/v1/popups/next`, `/api/v1/popups/results` | `/api/wpf/auth/login`, `POST /api/wpf/popups`, `POST /api/wpf/popups/results`(§3) |
| 결과 종류·종료 시각 | `action`, `completedAt` | `resultType`, `closedAt`(§10.2에서 채택하지 않음으로 명시) |
| 답안 필드 | `answers[].selectedOptionIds`, `answers[].answerText` | `answers[].optionIds`, `answers[].textAnswer`(§10.5·10.6) |
| 시각 필수 여부 | `displayedAt`·`completedAt` 필수 | `displayedAt`·`closedAt` 선택(`null` 가능) |
| answers 필수 여부 | 항상 필수(없으면 빈 배열) | SUBMITTED일 때만 필수(1개 이상). 그 밖의 결과에는 보내지 않음 |
| 오류 응답 | HTTP 409·422·429 등 상태 코드로 구분 | 업무 오류는 HTTP 200 + `status: REJECTED` + `code`(§11). 요청 처리 자체 실패만 HTTP 오류(§13) |
| 같은 resultId·다른 본문 | 충돌(conflict)로 거절 | 본문 비교 없이 `DUPLICATE`(§12). 본문 비교 여부는 정책 보류(설계 45) |

---

# 11. 결과 API Response

```json
{
  "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
  "status": "ACCEPTED",
  "nextStatus": "AVAILABLE"
}
```

결과 1건에 대한 응답 1건이다. 팝업 콘텐츠는 포함하지 않으며, 후보가 있으면 WPF가 조회 API를 다시 호출한다.

### 응답 필드

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| resultId | string | O | 없음 | 요청 resultId와 동일 |
| status | string | O | 없음 | ACCEPTED / DUPLICATE / REJECTED / RETRYABLE_ERROR / INTERNAL_ERROR. 저장·처리 상태 |
| nextStatus | string | status가 ACCEPTED·DUPLICATE일 때 | 생략 | AVAILABLE(즉시 다음 조회) / EMPTY(남은 후보 없음, 조회 간격 대기). 거절·실패 응답에는 없음. 저장은 됐으나 후보 확인이 실패하면 생략(EMPTY로 보내지 않음) |
| code | string | 선택 | 생략 | 거절·실패 사유 코드, 또는 ACCEPTED·DUPLICATE의 후보 확인 실패 `WPF_NEXT_STATUS_UNKNOWN`. 값은 아래 "code 값" 표 |
| message | string | 선택 | 생략 | 거절·실패 설명(내부 오류 상세는 노출하지 않음) |

이전 일괄 응답의 `results[]`와 항목 `popupId`·`resultType`은 삭제했다(설계 35).

```json
{
  "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
  "status": "REJECTED",
  "code": "WPF_INVALID_DELIVERY",
  "message": "유효한 전달 건이 아닙니다. deliveryId=d6a1f0c2-5b7e-4c3a-8e9d-2f4b6a8c0e11"
}
```

```json
{
  "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
  "status": "ACCEPTED",
  "code": "WPF_NEXT_STATUS_UNKNOWN",
  "message": "결과는 저장했으나 다음 팝업 유무를 확인하지 못했습니다."
}
```

### status 의미

| status | 의미 |
|---|---|
| ACCEPTED | 처음 정상 처리 |
| DUPLICATE | 동일 resultId가 이미 처리됨. 재처리하지 않으며 `nextStatus`는 함께 반환 |
| REJECTED | 수정 없이 재전송해도 실패하는 업무 오류. 사유 기록 후 종결 |
| RETRYABLE_ERROR | DB 연결 장애·데드락·잠금 대기·타임아웃 등 확인된 일시 장애. 결과 처리는 롤백됨 |
| INTERNAL_ERROR | 원인 미확정 내부 오류. 결과 처리는 롤백됨 |

### code 값

현재 저장소 서버(WpfPopupController·WpfPopupService)가 결과 응답에 넣는 code다. WPF는 code를 로그에만 남기고 큐 처리는 `status`로만 결정하므로, 백엔드는 code를 진단용으로 확장할 수 있다.

| status | code | 의미 |
|---|---|---|
| REJECTED | WPF_INVALID_RESULT | 결과 형식 오류(resultId·deliveryId·popupId 누락·길이, 알 수 없는 resultType, hideDays 범위, score 음수, answers·optionIds null 요소, video 형식). 업무 검증 실패 중 아래 코드로 분류되지 않은 경우(HIDDEN의 hideDays 누락, answers 0개, QUIZ score·passed 누락 등)도 이 코드 |
| REJECTED | WPF_INVALID_DELIVERY | 유효한 전달 건이 아님(존재하지 않는 deliveryId, 다른 사용자의 전달 건, 전달 건의 팝업과 popupId 불일치) |
| REJECTED | WPF_DELIVERY_COMPLETED | 다른 resultId의 결과가 이미 저장된 전달 건(같은 resultId 재전송은 DUPLICATE) |
| REJECTED | WPF_NOT_ELIGIBLE | 해당 사용자에게 제출·기록 가능한 팝업이 아님(대상 아님, 유효한 영상 팝업 아님, 사용자·팝업 확인 실패) |
| REJECTED | WPF_TYPE_MISMATCH | 팝업 유형과 결과 유형 불일치(설문형 팝업 전용 제출을 다른 유형에 보냄) |
| REJECTED | WPF_INVALID_ANSWER | 문항·선택지·답안 검증 실패(존재하지 않는 문항·선택지 등) |
| REJECTED | WPF_INVALID_HIDE_DAYS | 숨김 일수 업무 검증 실패 |
| REJECTED | WPF_INVALID_VIDEO | 영상 시청 정보 검증 실패(VIDEO+QUIZ의 video 누락·시청 비율 미달 등) |
| RETRYABLE_ERROR | WPF_RETRYABLE | 확인된 일시 장애(DB 연결·데드락·잠금 대기·타임아웃 등) |
| INTERNAL_ERROR | WPF_INTERNAL | 원인 미확정 내부 오류. 검증 통과 후 변환 단계의 예상하지 못한 예외 포함 |
| ACCEPTED·DUPLICATE | WPF_NEXT_STATUS_UNKNOWN | 결과는 저장했으나 다음 후보 확인 실패. `nextStatus` 생략. WPF는 즉시 조회 |

REJECTED의 세부 code(WPF_INVALID_DELIVERY~WPF_INVALID_VIDEO)는 서버 업무 예외 메시지를 기준으로 분류한 진단값이다. 요청 처리 자체가 실패한 오류는 결과 응답 code가 아니라 §13의 HTTP 오류 본문 code로 응답한다: JSON 구문·역직렬화 오류는 400 `WPF_BAD_REQUEST`, 인증 실패는 401 `WPF_UNAUTHORIZED`, 사용자 비활성은 403 `WPF_USER_INACTIVE`, 그 밖의 처리 실패는 500 `WPF_INTERNAL`.

삭제 기준은 "서버가 응답했다"가 아니라 "그 결과의 처리가 종결됐다"이다(설계 34-19~24, 35).

| 상황 | HTTP | status | WPF 처리 |
|---|---|---|---|
| 저장 완료 | 200 | ACCEPTED | 해당 결과 삭제 후 `nextStatus`로 다음 조회 결정 |
| 동일 resultId 처리 완료 | 200 | DUPLICATE | 해당 결과 삭제 후 `nextStatus`로 다음 조회 결정 |
| 영구 업무 오류 | 200 | REJECTED | 사유 기록 후 삭제. 다음 조회를 막지 않음 |
| 확인된 일시 장애 | 200 | RETRYABLE_ERROR | 보관·재전송. 종결 전 다음 조회 보류(§12.1) |
| 원인 미확정 내부 오류 | 200 | INTERNAL_ERROR | 보관·실행당 제한 횟수(현재 3회)만 재시도하며 그동안 다음 조회 보류. 소진하면 이번 실행에서는 조회를 막지 않고, 삭제하지 않아 다음 실행에서 재시도 |
| JSON 구문·역직렬화 오류 | 400 | — | 그 결과를 이번 실행에서 제외(파일 보관, 다음 실행 재시도)하고 뒤 결과·조회를 막지 않음 |
| 요청 처리 실패 | 그 밖의 4xx·5xx | — | 보관·재전송. 다음 조회 보류(§12.1) |
| 타임아웃·연결 끊김 | 응답 없음 | — | 보관·재전송. 다음 조회 보류(§12.1) |

- 서버: JSON 구문·역직렬화 오류(잘못된 날짜·숫자 자료형 등)는 HTTP 400 `WPF_BAD_REQUEST`, 역직렬화 후 형식 검증 오류(resultId·deliveryId·popupId 누락·길이, 알 수 없는 resultType, hideDays 범위, score 음수, answers·optionIds의 null 요소, video 형식)는 HTTP 200의 `REJECTED`(`WPF_INVALID_RESULT`)로 응답한다. 검증을 통과한 뒤 변환 단계에서 예상하지 못한 예외가 나면 영구 오류로 보지 않고 `INTERNAL_ERROR`(`WPF_INTERNAL`)로 응답한다. 처리 오류의 `RETRYABLE_ERROR`·`INTERNAL_ERROR` 구분은 예외 형식·DB 오류 형식(원인 체인 포함)으로 하고 오류 메시지 문자열로 판단하지 않는다. 이 원칙은 두 상태의 구분에만 해당하며, 업무 검증 실패(REJECTED)의 세부 code 분류는 위 "code 값" 표와 같이 업무 예외 메시지를 기준으로 한다. 결과 저장·전달 건 종료·재노출 유예 기록과 resultId 처리 기록(영수증)은 같은 트랜잭션이며 실패하면 롤백한 뒤 상태를 응답한다. `nextStatus` 후보 확인은 저장 커밋 뒤에 수행한다. 분류되지 않은 예외를 REJECTED로 반환하지 않는다.
- WPF: 저장에 실패한 미확정 결과(닫기 취소·제출 저장 실패)는 큐에 남기지 않아 전송되지 않으며, 창이 상태를 유지하다 다음 닫기·제출 때 결과를 다시 만들어 저장한다(앱 종료 중 닫기만 메모리 보관 후 종료 직전 전송 시도). 보낸 결과와 다른 resultId 응답, 응답 누락, 알 수 없는 상태는 종결로 보지 않는다. 재전송 시 원래 resultId·deliveryId와 결과 데이터를 유지한다. 전송 시점은 시작·조회 전·팝업 닫힘 직후·종료 전이며, 미종결 결과가 남았을 때의 순서·재시도 간격은 §12.1 임시 기준을 따른다.

### 제거된 응답 필드

결과 응답은 결과 처리 종결 여부와 다음 후보 유무만 알린다. 위 표 밖의 필드는 내려주지 않으며 WPF도 읽지 않는다.

- `results[]`, 항목 `popupId`·`resultType`: 단건 응답으로 바꾸며 제거(설계 35). 거절 로그는 WPF가 보낸 결과의 popupId·resultType으로 남긴다

- `totalScore`·`passed`: 요청 값과 의미가 같아 제거(설계 33)
- `hiddenUntil`·`watchedRatio`·`requiredRatio`: WPF 미사용(설계 34-05)
- ROOT `receivedAt`, `popupStatus`·`completed`·`completedAt`·`responseId`: WPF 미사용·로그 미사용(설계 34-03). 서버 수신 시각은 요청 로그에 남는다.

서버는 숨김 만료·시청 기록·완료 판정·응답 저장을 내부에서 그대로 처리하며, 완료·숨김·재노출 유예는 다음 조회와 `nextStatus`에서 제외 여부로 반영된다(§10.8).

---

# 12. 멱등/재전송 규칙

백엔드 신규 구현에서 반드시 맞춰야 하는 핵심 규칙이다.

1. `resultId`는 결과 1건 단위 멱등 키다.
2. 동일 `resultId`가 여러 번 들어오면 업무 데이터를 중복 저장하지 않는다.
3. 이미 처리한 결과는 `DUPLICATE`로 응답하며 저장 성공과 같이 `nextStatus`를 함께 준다.
4. `deliveryId`는 조회 전달 건 ID다. 한 전달 건에는 결과 1건만 저장되며, 다른 resultId로 같은 전달 건의 결과를 보내면 `REJECTED`(`WPF_DELIVERY_COMPLETED`)다.
5. 네트워크 오류로 WPF가 같은 resultId를 다시 보내는 것은 정상 시나리오다. 토큰 만료로 실패하면 재로그인 후 같은 resultId로 결과 전송을 재시도하며 조회부터 다시 시작하지 않는다.
6. 한 요청에는 결과 1건만 들어온다. 배열·일괄 재전송은 제공하지 않는다.

## 12.1 미전송 결과 복구 — 임시 기준

> 장애 복구 세부 정책은 주간회의 결정 대기 항목이다(설계 35 §4). 아래는 현재 구현의 **임시 기준**이며 확정 계약이 아니다.

- 보내지 못한 결과는 로컬 파일 큐(`%LOCALAPPDATA%\Popup\pending-results.json`)에 보관하고, 조회 전에 저장 순서대로 **1건씩** 다시 보낸다.
- 미종결 결과(전송 실패·응답 없음·RETRYABLE_ERROR·재시도 횟수가 남은 INTERNAL_ERROR)가 남으면 다음 팝업을 조회하지 않고 복구 간격(10초×3회 …, §13의 조회 장애 복구 간격과 같음) 뒤 다시 시도한다.
- HTTP 400인 결과는 이번 실행에서만 제외(파일 보관)해 뒤 결과·조회를 막지 않는다. INTERNAL_ERROR는 실행당 최대 3회 시도 후 이번 실행에서는 조회를 막지 않는다. 두 경우 모두 파일에서 삭제하지 않아 다음 실행에서 다시 보낸다.
- REJECTED는 종결이므로 다음 조회를 막지 않는다.
- [설계 39-1] 큐 파일을 읽거나 보존할 수 없으면 디스크에 미전송 결과가 남았는지 알 수 없으므로 메모리 보관분만 보낸 뒤에도 조회를 보류하고 복구 간격으로 재시도한다(파일 원본은 건드리지 않음).
- [설계 39-2] 닫힘 직후와 복구 재전송 모두, 이번에 저장한 결과의 nextStatus가 EMPTY면 조회하지 않고 최신 pollingIntervalSeconds를 기다린다. AVAILABLE·nextStatus 생략은 즉시 조회, 저장한 결과가 없는 최초 조회·빈 큐는 바로 조회한다.
- 예외 이후(400 격리·INTERNAL_ERROR 소진) 조회가 허용되면 결과가 저장되지 않은 같은 OPEN 전달 건이 다시 표시될 수 있다. 다시 닫으면 새 resultId로 저장되고, 남은 이전 결과는 다음 실행에서 WPF_DELIVERY_COMPLETED로 거절·종결되어 큐에서 빠진다(누적되지 않음). 이 동작도 임시 기준이다.

---

# 13. 오류 응답

공통 오류 본문 권장 형식:

```json
{
  "code": "WPF_UNAUTHORIZED",
  "message": "인증 토큰이 없습니다.",
  "timestamp": "2026-09-28T15:30:00+09:00"
}
```

현재 C#이 중요하게 구분하는 상태는 다음과 같다.

| HTTP | 의미 | WPF 동작 |
|---|---|---|
| 400 | 요청 형식 오류(`WPF_BAD_REQUEST`): Bean Validation·JSON 구문·역직렬화 실패. 결과 API는 JSON 구문·역직렬화 오류만 400이며, 결과 형식·업무 검증 오류는 HTTP 200의 `REJECTED`로 응답(§11) | 조회는 장애 복구 제외, 정상 조회 주기 유지. 결과 전송은 그 결과를 이번 실행에서 제외(§12.1) |
| 401 | 인증 없음/만료 | 재로그인 후 원 요청 1회 재시도 |
| 403 | 인증됐지만 사용자 사용 불가(`WPF_USER_INACTIVE`) | 장애 복구 제외, 오류 표시 가능 |
| 426 | C# 버전 지원 중단 | 조회·결과 전송·정기 로그인 중단, pending 유지, 안내 닫기 후 정상 종료 |
| 500/502/503/504 | 일시 서버 오류 | 조회는 10초×3회×5 Cycle 복구, Cycle 간 30분 휴식 후 첫 10초, 이후 60분 확인. 결과 전송은 로컬 큐 유지 후 같은 간격으로 재시도하며 그동안 조회 보류(§12.1) |

DNS/연결 오류·Timeout도 조회 장애 복구 대상으로 처리한다. 401 재로그인은 기존 원 요청 1회 재전송 경로를 사용한다(결과 전송은 같은 resultId 유지). 복구 성공 시 응답의 최신 `pollingIntervalSeconds`를 적용한다. 그 외 HTTP 상태/데이터 오류는 적극 복구 루프에 넣지 않는다.

---

## 13.1 426 Upgrade Required

버전 강제 기능을 사용할 경우 다음 형태를 권장한다.

```json
{
  "code": "CLIENT_VERSION_NOT_SUPPORTED",
  "message": "WPF 클라이언트 업데이트가 필요합니다.",
  "clientVersion": "0.9.0",
  "minimumSupportedVersion": "1.0.0",
  "latestVersion": "1.2.0",
  "timestamp": "2026-09-28T15:30:00+09:00"
}
```

WPF는 426을 받으면:

- 401 인증 갱신 경로로 들어가지 않음
- 주기 조회·장애 복구·추가 결과 전송·정기 로그인 중단
- 진행 중 HTTP·인증 요청 취소, 결과 큐 삭제하지 않음
- 업데이트 안내 1회 표시 후 닫으면 Agent 정상 종료

---

# 14. ENUM / 코드값 요약

## popupType

```text
TEXT
IMAGE
VIDEO
SURVEY
QUIZ
```

## displayMode

```text
SEQUENTIAL
SIMULTANEOUS
```

조회 응답이 1건이라 서버 팝업이 동시에 여러 개 열리지 않는다.

## sizeMode

```text
FIXED
RATIO
FULLSCREEN
AUTO
```

## popupPosition

```text
CENTER
TOP_LEFT
TOP_CENTER
TOP_RIGHT
CENTER_LEFT
CENTER_RIGHT
BOTTOM_LEFT
BOTTOM_CENTER
BOTTOM_RIGHT
```

## imageSizeMode

```text
ADAPTIVE
FIT_TO_IMAGE
ORIGINAL
```

## questionType

```text
SINGLE_CHOICE
MULTIPLE_CHOICE
TEXT
```

## answerMatchMode

```text
EXACT
CONTAINS
```

## resultType

```text
CLOSED
HIDDEN
SUBMITTED
VIDEO_WATCHED
```

## result status

```text
ACCEPTED
DUPLICATE
REJECTED
RETRYABLE_ERROR
INTERNAL_ERROR
```

## nextStatus

```text
AVAILABLE
EMPTY
```

결과 status가 ACCEPTED·DUPLICATE일 때만 반환한다. 후보 확인 실패 시 생략한다.

---

# 15. 유형별 전체 JSON 예시

아래는 POST /api/wpf/popups 응답의 `popup`에 들어갈 유형별 완전한 객체다. **실제 응답에는 한 번에 1건만 들어간다.** `deliveryId`는 서버가 조회마다 발급하는 값이며 예시 값은 형식 설명용이다. 문항은 popup 최상위 questions, 통과 점수는 popup 최상위 passingScore에 둔다. 기본값을 사용하는 선택 필드는 일부 생략했다. 미디어·링크의 example.com 주소는 형식 예시이므로 실제 접근 가능한 주소로 교체해야 한다.

6개 유형의 `popup` 예시를 모은 참고 파일: [WPF-01-popup-types.json](examples/WPF-01-popup-types.json)(유형별 응답 예시 모음이며 한 응답이 아니다). 각 객체는 다음 Envelope의 `popup` 자리에 넣는다.

```json
{
  "pollingIntervalSeconds": 1800,
  "popup": { "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a01", "popupId": "TEXT-001", "popupType": "TEXT", "...": "§15.1 참고" }
}
```

## 15.1 TEXT

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a01",
  "popupId": "TEXT-001",
  "popupType": "TEXT",
  "title": "서비스 안내",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "CLOSE",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": true,
  "questions": [],
  "content": {
    "plainText": "점검 공지\n안내 내용을 확인해주세요.\n10월 5일 22시부터 23시까지 서비스 점검이 진행됩니다.",
    "textBlocks": [
      { "alignment": "LEFT", "runs": [ { "text": "점검 공지", "bold": true, "size": 24 } ] },
      { "alignment": "LEFT", "runs": [ { "text": "안내 내용을 확인해주세요." } ] },
      { "alignment": "LEFT", "runs": [ { "text": "10월 5일 22시부터 23시까지", "bold": true, "color": "#DC2626" }, { "text": " 서비스 점검이 진행됩니다." } ] }
    ],
    "showPlainText": true,
    "highlightText": "작업 내용을 미리 저장해주세요.",
    "showHighlight": true,
    "bottomDescription": "자세히 보기",
    "bottomDescriptionUrl": "https://example.com/notice",
    "showBottomDescription": true
  }
}
```

## 15.2 IMAGE

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a02",
  "popupId": "IMAGE-001",
  "popupType": "IMAGE",
  "title": "교육 안내",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "CLOSE",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": true,
  "questions": [],
  "content": {
    "imageTitle": "교육 일정",
    "imageUrl": "https://example.com/media/training.png",
    "description": "이미지에서 교육 일정을 확인해주세요.",
    "showDescription": true,
    "imageSizeMode": "ADAPTIVE",
    "width": 900,
    "height": 620
  }
}
```

## 15.3 VIDEO

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a03",
  "popupId": "VIDEO-001",
  "popupType": "VIDEO",
  "title": "교육 영상",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "CLOSE",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": false,
  "questions": [],
  "completionRatio": 0.8,
  "content": {
    "videoTitle": "보안 교육",
    "videoUrl": "https://example.com/media/security.mp4",
    "description": "영상의 80% 이상을 시청해주세요.",
    "showDescription": true,
    "showControls": true,
    "allowFullScreen": true,
    "allowPlaybackRateChange": true,
    "allowSeek": true,
    "autoPlay": true,
    "isLoop": false,
    "defaultVolume": 0.7
  }
}
```

## 15.4 SURVEY — 세로 단일 / 가로 복수 / 주관식

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a04",
  "popupId": "SURVEY-001",
  "popupType": "SURVEY",
  "title": "교육 만족도 설문",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "SUBMIT",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": true,
  "questions": [
    {
      "questionId": 101,
      "questionType": "SINGLE_CHOICE",
      "optionLayout": "VERTICAL",
      "title": "교육 내용을 이해하기 쉬웠나요?",
      "description": "",
      "isRequired": true,
      "isScored": false,
      "options": [
        {
          "optionId": 1001,
          "value": "1001",
          "text": "네"
        },
        {
          "optionId": 1002,
          "value": "1002",
          "text": "전반적으로 이해하기 쉬웠지만 실제 업무에 적용하는 구체적인 예시와 추가 설명이 조금 더 필요했습니다."
        }
      ]
    },
    {
      "questionId": 102,
      "questionType": "MULTIPLE_CHOICE",
      "optionLayout": "HORIZONTAL",
      "title": "도움이 된 자료를 모두 선택해주세요.",
      "description": "",
      "isRequired": true,
      "isScored": false,
      "options": [
        {
          "optionId": 1003,
          "value": "1003",
          "text": "텍스트"
        },
        {
          "optionId": 1004,
          "value": "1004",
          "text": "이미지"
        },
        {
          "optionId": 1005,
          "value": "1005",
          "text": "영상"
        },
        {
          "optionId": 1006,
          "value": "1006",
          "text": "설문"
        }
      ]
    },
    {
      "questionId": 103,
      "questionType": "TEXT",
      "optionLayout": "VERTICAL",
      "title": "추가 의견을 작성해주세요.",
      "description": "",
      "isRequired": false,
      "isScored": false,
      "options": []
    }
  ],
  "content": {
    "surveyTitle": "교육 만족도 설문",
    "description": "필수 문항에 응답한 후 제출해주세요."
  }
}
```

## 15.5 QUIZ — 가로 단일 / 세로 복수

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a05",
  "popupId": "QUIZ-001",
  "popupType": "QUIZ",
  "title": "보안 확인 퀴즈",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "SUBMIT",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": true,
  "questions": [
    {
      "questionId": 201,
      "questionType": "SINGLE_CHOICE",
      "optionLayout": "HORIZONTAL",
      "title": "안전한 연결 방식은 무엇인가요?",
      "description": "",
      "isRequired": true,
      "isScored": true,
      "questionScore": 40,
      "options": [
        {
          "optionId": 2001,
          "value": "2001",
          "text": "HTTPS",
          "isCorrect": true
        },
        {
          "optionId": 2002,
          "value": "2002",
          "text": "HTTP",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": 202,
      "questionType": "MULTIPLE_CHOICE",
      "optionLayout": "VERTICAL",
      "title": "안전한 계정 관리 방법을 모두 선택해주세요.",
      "description": "",
      "isRequired": true,
      "isScored": true,
      "questionScore": 60,
      "options": [
        {
          "optionId": 2003,
          "value": "2003",
          "text": "다중 인증 사용",
          "isCorrect": true
        },
        {
          "optionId": 2004,
          "value": "2004",
          "text": "모든 사이트에서 같은 비밀번호를 반복해서 사용하고 다른 사람에게도 공유합니다.",
          "isCorrect": false
        },
        {
          "optionId": 2005,
          "value": "2005",
          "text": "충분히 길고 고유한 비밀번호 사용",
          "isCorrect": true
        }
      ]
    }
  ],
  "passingScore": 80,
  "content": {
    "surveyTitle": "보안 확인 퀴즈",
    "description": "총점 100점, 통과 기준 80점입니다.",
    "videoEnabled": false
  }
}
```

## 15.6 VIDEO+QUIZ — popupType은 QUIZ

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1a06",
  "popupId": "VIDEO-QUIZ-001",
  "popupType": "QUIZ",
  "title": "영상 교육 및 확인 퀴즈",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "SUBMIT",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": false,
  "questions": [
    {
      "questionId": 301,
      "questionType": "SINGLE_CHOICE",
      "optionLayout": "HORIZONTAL",
      "title": "안전한 연결 방식은 무엇인가요?",
      "description": "",
      "isRequired": true,
      "isScored": true,
      "questionScore": 40,
      "options": [
        {
          "optionId": 3001,
          "value": "2001",
          "text": "HTTPS",
          "isCorrect": true
        },
        {
          "optionId": 3002,
          "value": "2002",
          "text": "HTTP",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": 302,
      "questionType": "MULTIPLE_CHOICE",
      "optionLayout": "VERTICAL",
      "title": "안전한 계정 관리 방법을 모두 선택해주세요.",
      "description": "",
      "isRequired": true,
      "isScored": true,
      "questionScore": 60,
      "options": [
        {
          "optionId": 3011,
          "value": "2003",
          "text": "다중 인증 사용",
          "isCorrect": true
        },
        {
          "optionId": 3012,
          "value": "2004",
          "text": "모든 사이트에서 같은 비밀번호를 반복해서 사용하고 다른 사람에게도 공유합니다.",
          "isCorrect": false
        },
        {
          "optionId": 3013,
          "value": "2005",
          "text": "충분히 길고 고유한 비밀번호 사용",
          "isCorrect": true
        }
      ]
    }
  ],
  "passingScore": 80,
  "content": {
    "videoTitle": "영상 확인 퀴즈",
    "videoUrl": "https://example.com/media/security.mp4",
    "description": "영상의 80% 이상을 시청해주세요.",
    "showDescription": true,
    "showControls": true,
    "allowFullScreen": true,
    "allowPlaybackRateChange": true,
    "allowSeek": true,
    "autoPlay": true,
    "isLoop": false,
    "defaultVolume": 0.7,
    "surveyTitle": "영상 확인 퀴즈",
    "videoEnabled": true
  },
  "completionRatio": 0.8
}
```

QUIZ의 복수 선택은 정답 집합과 선택 집합이 정확히 같아야 60점을 얻으며 부분 점수는 없다. VIDEO+QUIZ는 영상 시청 80% 완료 후 문항 제출이 가능하다. `videoTitle`은 `surveyTitle`과 같은 값이다(§8.6). TEXT 자동 채점은 최소 외부 제공 범위에 포함하지 않아 예시에서는 선택형 채점만 사용한다.

---

# 16. 백엔드 구현 체크리스트

새 백엔드가 C# WPF와 연동되기 위해 최소한 다음을 확인한다.

- [ ] 로그인 API가 accessToken을 반환한다.
- [ ] 조회/결과 API가 Bearer 인증 사용자를 식별할 수 있다.
- [ ] POST /api/wpf/popups에는 userId 요청 파라미터·본문을 요구하지 않는다.
- [ ] 조회 API는 서버에서 노출 판정·정렬을 끝낸 첫 1건만 `popup`으로 반환하고 `deliveryId`를 발급한다.
- [ ] 표시 대상이 없을 때 `popup: null`을 반환하고, 매 응답에 `pollingIntervalSeconds`를 넣는다.
- [ ] 열린 전달 건이 아직 표시 조건을 만족하면 재조회에 같은 `deliveryId`를 돌려준다.
- [ ] popupType별 content 필드 이름을 그대로 제공한다.
- [ ] QUIZ는 로컬 채점용 정답 키와 passingScore를 내려준다.
- [ ] 결과 API는 resultId 기준 멱등 처리를 한다.
- [ ] 동일 resultId 재수신 시 업무 데이터를 중복 저장하지 않는다.
- [ ] 결과 API는 결과 1건 객체를 받고 `deliveryId`의 소유·팝업 일치·미종료를 검증한다.
- [ ] status를 ACCEPTED/DUPLICATE/REJECTED/RETRYABLE_ERROR/INTERNAL_ERROR 중 하나로 반환한다.
- [ ] ACCEPTED·DUPLICATE에는 `nextStatus`(AVAILABLE/EMPTY)를 넣고, 후보 확인 실패는 EMPTY 대신 생략과 `WPF_NEXT_STATUS_UNKNOWN`으로 알린다.
- [ ] TEXT·IMAGE CLOSED는 완료로, 미완료로 끝난 SURVEY·QUIZ·VIDEO는 `pollingIntervalSeconds` 동안 재노출 유예로 처리한다.
- [ ] REJECTED는 WPF가 재전송하지 않는 종결 상태이므로 영구 업무 오류에만 쓰고, 일시 장애·미확정 오류는 RETRYABLE_ERROR·INTERNAL_ERROR로 반환한다.
- [ ] 네트워크/서버 장애 시 WPF가 같은 결과를 재전송할 수 있음을 고려한다.
- [ ] 401이면 WPF가 로그인 후 원 요청을 한 번 재시도하는 것을 고려한다.
- [ ] 426을 사용할 경우 지정된 오류 형식을 제공한다.
- [ ] 날짜는 ISO 8601로 송수신한다.
- [ ] C#과 실제 통합 테스트에서 TEXT/IMAGE/VIDEO/SURVEY/QUIZ를 각각 1건 이상 확인한다.

---

# 17. C# 기준 소스

이 문서는 다음 C# 구현을 계약 기준으로 정리했다.

```text
popup-frameWork/Popup/
├─ Services/
│  ├─ PopupApiService.cs
│  ├─ PopupResultQueue.cs
│  └─ Auth/
│     ├─ WpfLoginClient.cs
│     └─ SsoAuthHeaderProvider.cs
├─ Dtos/
│  ├─ WpfNextPopupResponseDto.cs
│  ├─ PopupResponseDto.cs
│  ├─ WpfResultDtos.cs
│  ├─ TextPopupContentDto.cs
│  ├─ ImagePopupContentDto.cs
│  ├─ VideoPopupContentDto.cs
│  ├─ SurveyPopupContentDto.cs
│  ├─ SurveyQuestionDto.cs
│  └─ SurveyOptionDto.cs
└─ Factories/
   └─ PopupFactory.cs
```

새 백엔드 구현 시 서버 내부 코드를 이 저장소와 동일하게 만들 필요는 없다. **위 C# 코드가 보내고 받는 계약만 맞으면 된다.**
