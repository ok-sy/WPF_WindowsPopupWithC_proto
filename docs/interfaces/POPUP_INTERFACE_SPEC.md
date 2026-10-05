# WPF Popup Client API Interface — JSON Contract

- 문서 버전: 3.6
- 최신화: 2026-10-06 (KST)
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
> **표 읽는 기준**: `필수 여부`는 백엔드가 계약상 값을 제공해야 하는지의 기준이고, `Default`는 필드가 생략되거나 null일 때 현재 C# 클라이언트가 사용하는 값/처리다. 필수 필드에 C# fallback이 있더라도 신규 백엔드는 필수 값을 명시해서 보내는 것을 기준으로 한다.

---

## 1. 역할 분리

### 1.1 백엔드 책임

백엔드는 다음을 끝낸 **최종 표시 대상 목록**만 WPF에 내려준다.

- 사용자 식별
- 팝업 활성 여부
- 노출 시작/종료 기간
- 사용자/부서/직급 등 대상 조건
- 숨김 기간
- 이미 완료된 팝업 제외 정책
- 기타 서버 측 업무 정책

WPF에 전체 팝업을 내려준 뒤 대상 여부를 다시 판단하게 하지 않는다.

### 1.2 WPF 책임

WPF는 서버가 내려준 최종 목록을 받아 다음을 수행한다.

- 팝업 화면 렌더링
- 표시 우선순위 및 순차/동시 표시
- 창 위치·크기 최종 보정
- SURVEY 필수 응답 확인
- QUIZ 로컬 채점
- VIDEO 완료 비율 로컬 판정
- 닫기/숨김/제출/영상 결과 생성
- 결과를 로컬 파일에 먼저 저장
- 서버 결과 API 비동기 전송 및 재전송

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
| 사용자 ID | 목록/결과 API 요청 JSON에는 userId를 넣지 않음. 인증 정보로 서버가 식별 |
| HTTP timeout | WPF HTTP 호출은 현재 10초 |
| 목록 없음 | 오류가 아니라 `popups: []` 반환 |

C# 역직렬화는 대소문자를 구분하지 않지만, 신규 백엔드는 문서의 camelCase 이름을 그대로 사용하는 것을 기준으로 한다.

---

## 3. 현재 C#이 사용하는 API

| ID | 기능 | Method | 기본 경로 |
|---|---|---|---|
| WPF-00 | 로그인/토큰 발급 | POST | `/api/wpf/auth/login` |
| WPF-01 | 표시 대상 팝업 조회 | GET | `/api/wpf/popups` |
| WPF-02 | 팝업 처리 결과 일괄 전송 | POST | `/api/wpf/popups/results` |

실제 전체 URL은 WPF의 `PopupApi.BaseUrl` 뒤에 위 경로를 붙여 사용한다.

예:

```text
BaseUrl = https://example.company/popup-api
GET https://example.company/popup-api/api/wpf/popups
```

로그인 경로는 현재 C# 설정의 `Auth.LoginPath`로 교체 가능하며, 미설정 시 `/api/wpf/auth/login`을 사용한다.

---

## 4. 공통 헤더

### 4.1 X-Client-Version

현재 C#은 로그인, 목록 조회, 결과 전송에 다음 헤더를 보낸다.

```http
X-Client-Version: 1.0.0
```

값은 WPF 실행 파일의 버전에서 생성된다.

백엔드가 최소 지원 버전을 검사하지 않는 경우 이 헤더를 무시할 수 있다. 버전 강제 업데이트 기능을 구현한다면 §9의 426 계약을 따른다.

### 4.2 Authorization

로그인 성공 후:

```http
Authorization: Bearer <accessToken>
```

형태로 목록/결과 API에 전달한다.

현재 C#의 SSO 프로토타입 인증 흐름은 다음과 같다.

```text
프로세스 최초 인증
→ 사내 SSO에서 logonId / classCode 확보
→ 로그인 API 호출
→ accessToken 메모리 저장
→ 목록/결과 API에 Bearer 토큰 전달

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
GET /api/wpf/popups
Authorization: Bearer <token>
X-Client-Version: 1.0.0
```

- Query String 없음
- Request Body 없음
- userId 없음

## 6.2 Response Envelope

```json
{
  "serverTime": "2026-09-28T15:30:00+09:00",
  "userId": "E1001",
  "pollingIntervalSeconds": 1800,
  "popups": []
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| serverTime | string(ISO) | 선택 | `null` | 서버 기준 시각. WPF는 참고만 함 |
| userId | string | 선택 | `""` | 인증 정보에서 식별된 사용자. 요청에는 보내지 않음 |
| pollingIntervalSeconds | integer | 선택 | `0` | 서버 설정이 소유하는 1800~3600초(30~60분) 주기. 0 이하면 범위 제한된 WPF 로컬 설정 유지. 기동 시점 기준 반복 조회 |
| popups | array | O | `[]` | 표시 대상 팝업. 없으면 빈 배열 |

기본 `AutoLoadOnStartup=true`에서 로그인 직후 최초 조회하고, 기동 시점 기준으로 30~60분 간격의 재조회를 수행한다. WPF는 PC 시각과 `displayStartAt`/`displayEndAt`를 비교하거나 팝업별 예약 타이머를 만들지 않는다. 서버 응답 목록을 즉시 렌더링하며 기존 순차/동시 표시 규칙을 적용한다. 열린 팝업이 있어도 재조회하고, 이번 실행에서 이미 표시한 ID를 제외한 새 팝업은 기존 표시 큐에 합류한다. 조회 요청이 진행 중이면 중복 요청은 생략하고, 401 재인증은 동일 요청 1회 재시도로 처리해 조회 타이머를 추가하지 않는다.

서버/로컬 설정의 양수 값은 1800~3600초로 보정하며 로컬 설정이 0 이하이면 1800초를 사용한다. 최대 60분의 신규 노출 지연을 허용한다. `serverTime`은 참고용이며 PC 벽시계 변경이 표시 대상 판단이나 반복 조회 기준을 바꾸지 않는다.

---

## 6.3 popups[] 공통 필드

| 필드 | 형식 | 필수 여부 | Default | C# 처리 |
|---|---|---|---|---|
| popupId | string | O | 없음 | 결과 전송 식별자 |
| popupType | string | O | 없음 | TEXT / IMAGE / VIDEO / SURVEY / QUIZ |
| title | string | O | `""` | 공통 Header 제목 |
| displayMode | string | O | `SEQUENTIAL` | SEQUENTIAL / SIMULTANEOUS |
| displayOrder | integer | O | `100` | 작은 값 우선, 같은 값은 같은 표시 그룹 |
| displayStartAt | string(ISO) | 선택 | `null` | DTO 수신 가능. 표시 대상 판단은 서버에서 완료하는 것이 기준 |
| displayEndAt | string(ISO) | 선택 | `null` | 동일 |
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
| showCloseButton | boolean | O | `true` | 닫기 버튼 표시 |
| showFooter | boolean | O | `true` | Footer 표시 |
| showDoNotShowAgain | boolean | O | `false` | 다시 보지 않기 체크박스 표시 |
| hideDays | integer | 선택 | `null` → HIDDEN 생성 시 30일 | 다시 보지 않기 결과에 사용 |
| completionRatio | number | VIDEO / 동영상+퀴즈 | `1.0` | 완료 인정 비율 0~1 |
| allowCloseBeforeComplete | boolean | VIDEO / 동영상+퀴즈 | `true` | 완료 전 닫기 허용 여부 |
| passingScore | number | QUIZ | `null` | 로컬 통과 점수. 채점 QUIZ는 반드시 명시(6.4 참고) |
| questions | array | SURVEY / QUIZ | `[]` | 문항 목록 |
| content | object | O | 유형별 필수값 포함 | 유형별 화면 데이터 및 공통 옵션 |

### 크기 처리 참고

WPF는 최종 렌더링 단계에서 화면 밖으로 나가지 않도록 값을 보정한다.

- FIXED: 작업 영역 95% 이내로 최종 제한. IMAGE는 고정 최대값을 사용하지 않고 작업 영역 90% 적용
- RATIO: 작업 영역 비율 사용
- FULLSCREEN: 주 모니터 전체
- AUTO: 콘텐츠 기준 자동 크기
- 잘못된 값은 일부 모드에서 기본값/보정값으로 처리되지만, 백엔드는 정상 범위 값을 제공해야 한다.

---

## 6.4 최신 코드 기준 필수값·누락 처리 점검 (2026-10-03)

기준 커밋: a93a74d. 아래는 WPF 수신 코드와 같은 저장소의 Java 서버 저장 검증을 함께 대조한 결과다. 표의 필수 여부는 백엔드가 보장할 계약이며, C#이 JSON 누락을 모두 거부한다는 의미는 아니다. 현재 응답 DTO에는 required/JsonRequired 선언이 없고 별도의 전체 응답 검증 단계도 없다. 관리자 저장 API와 WPF 조회 응답은 서로 다른 계약이므로 이 예시를 관리자 저장 요청으로 사용하지 않는다.

### 반드시 제공할 값

| 필드 / 조건 | 백엔드 제공 기준 | 현재 WPF 누락·오류 처리 |
|---|---|---|
| 로그인 accessToken | 공백 아닌 토큰 | 로그인 단계에서 명시적으로 거부 |
| popups | 배열. 대상 없음은 [] | 생략은 []로 조용히 처리, null은 목록 처리 실패 |
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
| 결과 응답 results[].resultId | 요청한 resultId 그대로 반환 | 누락/불일치는 대기 결과를 해제하지 못해 재전송 지속 |
| 결과 응답 results[].status | ACCEPTED / DUPLICATE / REJECTED | 현재 status 검증 없이 일치하는 resultId만으로 대기 결과를 제거. 누락·미지원 상태도 제거될 수 있으므로 서버가 반드시 보장 |

한 팝업의 Factory 변환 실패가 현재 조회 묶음 전체 생성을 중단할 수 있다. 서버는 잘못된 항목을 WPF 응답에 포함하지 않도록 응답 직전 검증을 수행해야 한다. results 배열은 반드시 반환하고 응답할 항목이 없으면 []를 사용한다. null 또는 null 항목은 처리 실패를 유발할 수 있다.

### 기본값 사용이 가능한 항목과 null 주의

- displayMode 생략은 SEQUENTIAL, sizeMode 생략은 FIXED. 명시한 값은 지원 ENUM이어야 하며 null은 허용하지 않는다.
- width/height 생략은 900/620, 표시 플래그는 6.3 표의 기본값 사용. 명시하는 수치에는 정상 범위 값을 전달한다. 기존 공통 필드 표의 O는 전체 계약 권장 출력 필드이며, 최소 제공 범위의 선택 항목은 최소 기능 정의서를 따른다.
- optionLayout 생략·미지원 값은 VERTICAL. 현재 WPF는 정확히 대문자 HORIZONTAL일 때만 가로 배치하므로 서버는 정규 ENUM을 출력한다.
- completionRatio 생략/null은 1.0(100% 시청). 80% 완료가 필요하면 0.8을 명시한다. showHighlight/showBottomDescription은 문구가 있어도 플래그 생략 시 false다.
- serverTime/userId는 참고용, pollingIntervalSeconds 생략/0은 로컬 기본 주기 사용. option.value는 선택 응답 식별자가 아니며 응답은 optionIds를 사용한다.
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

# 7. content 공통 필드

모든 popupType의 `content` 안에서 사용할 수 있다.

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| useBackgroundOverlay | boolean | 선택 | `true` | 배경 Overlay 사용 |
| backgroundOverlayOpacity | number | 선택 | `0.45` | WPF에서 0~1 보정 |
| headerFontSize | number | 선택 | XAML 기본값(현재 Header 17) | 값이 있으면 10~40으로 보정 |
| bodyFontSize | number | 선택 | 유형별 XAML 기본값 | 값이 있으면 10~40으로 보정 |
| footerFontSize | number | 선택 | XAML 기본값(현재 Footer 14) | 값이 있으면 10~40으로 보정 |
| footerAction | string | 선택 | `CLOSE` | CLOSE / LINK_AND_CLOSE |
| footerLinkUrl | string | footerAction=LINK_AND_CLOSE | `""` | 절대 http/https URL |
| popupPosition | string | 선택 | `CENTER` | 없거나 잘못되면 CENTER |

`LINK_AND_CLOSE`는 일반 콘텐츠의 하단 버튼을 **바로가기**로 표시하며, 기본 브라우저로 URL을 연 뒤 창을 닫는다. SURVEY·QUIZ·VIDEO+QUIZ에서는 버튼 이름을 **제출**로 통일하고 필수 응답 검증 및 QUIZ 통과 후 링크를 연다. URL이 잘못되었거나 브라우저 실행이 실패하면 창을 유지하고 오류를 안내한다. 헤더 X는 기존 닫기 동작을 유지한다. 버튼 표시는 `showFooter`·`showCloseButton`을 따른다.

SURVEY·QUIZ·VIDEO+QUIZ는 제출 버튼을 하나만 표시한다. 공통 푸터가 있으면 내부 제출 버튼을 숨기고 하단 제출에서 응답 수집·검증·채점을 실행한다. 푸터가 없으면 내부 제출 버튼을 사용한다. `showCloseButton=false`여도 제출 버튼은 유지한다. 미응답·QUIZ 불합격은 안내 후 창을 유지하며, 통과한 QUIZ는 `SUBMITTED`에 답안·score·passed를 포함한다. 영상 시청 후 헤더 X/Alt+F4로 종료한 결과는 제출과 구분한다. 제출·채점 안내는 흰색 바탕·검은 테두리·둥근 버튼의 공통 모달을 사용한다.

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
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "headerFontSize": 17,
  "bodyFontSize": 15,
  "footerFontSize": 14
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| contentTitle | string | 선택 | `""` | 콘텐츠 내부 제목 |
| description | string | 선택 | `""` | 콘텐츠 설명 |
| showContentHeader | boolean | 선택 | `true` | 콘텐츠 제목/설명 영역 표시 여부 |
| plainText | string | 선택 | `""` | 본문 |
| showPlainText | boolean | 선택 | `true` | 본문 표시 여부 |
| highlightText | string | 선택 | `""` | 강조 문구 |
| showHighlight | boolean | 선택 | `false` | 강조 영역 표시 여부 |
| bottomDescription | string | 선택 | `""` | 하단 설명 |
| bottomDescriptionUrl | string | 선택 | `""` | 클릭 시 이동 URL |
| showBottomDescription | boolean | 선택 | `false` | 하단 설명 영역 표시 |

Markdown 필드는 현재 C# 화면에서 사용하지 않는다.

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
  "height": 480,
  "linkUrl": "https://example.com/notice",

  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER"
}
```

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
| linkUrl | string | 선택 | `""` | 이미지 클릭 시 이동 URL |

### imageSizeMode

| 값 | 의미 |
|---|---|
| ADAPTIVE | 팝업 크기가 기준. 이미지를 배정 영역 안에 비율 유지하여 표시 |
| FIT_TO_IMAGE | content.width/height 이미지 크기 기준, 없으면 원본 DIP. 최대 창 초과 시 축소 없이 Clip |
| ORIGINAL | 팝업 크기는 유지. 원본 이미지를 왼쪽 위에 확대·축소 없이 표시하고 오른쪽·아래 초과 부분을 자름 |

필드가 없으면 ADAPTIVE로 처리한다. 위 세 값 외의 값(과거 값 `FIXED`, 빈 문자열 포함)은 C#이 지원하지 않는 값으로 보고 팝업 변환에 실패한다. ORIGINAL은 v3.4 클라이언트부터 지원한다.

ORIGINAL은 헤더·푸터를 제외한 본문 전체를 이미지 영역으로 사용한다. 콘텐츠 제목·설명·content.width/height·keepAspectRatio는 사용하지 않는다. 작은 이미지는 확대하지 않고 남는 영역을 흰색으로 표시하며 스크롤하지 않는다. `linkUrl` 이미지 클릭 동작은 유지한다. 원본 픽셀 크기 1px를 WPF 1 DIP / 웹 1 CSS px로 표시하며 이미지 파일의 DPI 메타데이터는 크기 계산에 사용하지 않는다(OS 화면 배율은 적용된다).

관리자 신규 등록 기본 선택은 ADAPTIVE이며, 기존 저장값과 필드 미지정 시 ADAPTIVE 동작은 유지한다. JSON 예: `{"imageSizeMode":"ORIGINAL","imageUrl":"https://example.com/notice.png"}`.

### 비율 및 창 경계 (v3.6 / 설계 23)

- 일반 IMAGE의 크기는 content.width/height 한 쌍만 전달한다. 최상위 width/height는 생략한다. ORIGINAL은 기존 최상위 창 크기를 사용한다.
- ADAPTIVE: content 크기는 창 크기. 미지정 축은 원본 이미지와 실제 제목·설명·여백을 측정해 산정한다. 로딩 전 임시 창은 560×420 DIP이며, 명시한 축은 유지한다. 이미지는 원본보다 확대하지 않고 가용 영역 안에 비율을 유지해 표시한다.
- FIT_TO_IMAGE: content 크기는 실제 이미지 표시 DIP 크기. keepAspectRatio 기본 true. 고정이면 한쪽 수정 시 다른 쪽을 원본 비율로 계산한다. 양쪽 API 값이 비율과 다르면 **너비 우선으로 높이를 정규화**한다. 편집기 연동값은 소수 둘째 자리로 반올림하되, 렌더링은 원본 비율로 다시 계산하므로 별도 오차 거부 기준은 없다.
- 해제(false)는 양쪽을 그대로 사용해 왜곡을 허용하며 누락한 축만 원본 DIP 길이로 채운다. 둘 다 없으면 원본 DIP 크기다. 서버는 원본 URL을 다운로드하지 않는다. 원본 로딩 후 WPF와 웹에서 계산한다.
- IMAGE 창 최대는 현재 모니터 작업 영역 너비·높이의 **90%**다. 고정 maximumWidth/maximumHeight 값(기본 1200×900)은 IMAGE 창 상한으로 사용하지 않는다. 최소는 이 화면 상한 이하로 보정하고, 최소로 늘어난 창에는 이미지 주변 여백을 허용한다. content.width/height의 지정 픽셀/DIP 크기는 유지하며 FIT_TO_IMAGE의 최대 초과 부분은 **중앙 기준**으로 자른다. ORIGINAL은 왼쪽 위 Clip을 유지한다. FULLSCREEN은 모니터 전체 크기를 우선한다. 다른 유형의 기존 최대 크기 정책은 유지한다.
- 설명은 항상 아래. showDescription=false 또는 공백이면 설명과 14 DIP 전용 간격을 제거한다. 설명은 가용 너비로 줄바꿈하고 하단 가용 콘텐츠 높이의 최대 30%에서 세로 스크롤한다. 제목·닫기·푸터는 이미지와 함께 스크롤하지 않는다.
- 크기 계산에는 이미지 Border, 제목·설명 실제 측정, 콘텐츠 Margin(28/24), 그림자용 바깥 Margin(24), 창 Border, 표시 중인 Header(48)·Footer(80) 행을 사용한다. 이미지와 무관한 190/300 높이 추정은 제거했다.
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
  "autoPlay": false,
  "isLoop": false,
  "defaultVolume": 0.7,

  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER"
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
| autoPlay | boolean | 선택 | `false` | 자동 재생 |
| isLoop | boolean | 선택 | `false` | 반복 재생 |
| defaultVolume | number | 선택 | `0.7` | 시스템 볼륨 연결 전/실패 시 내부 플레이어 초기 음량 0~1. 연결 성공 시 현재 Windows 볼륨 우선 |

VIDEO의 완료 기준은 content가 아니라 **popups[] 최상위 `completionRatio` / `allowCloseBeforeComplete`**를 기준으로 한다.

로컬 영상은 MediaElement, 직접 재생 가능한 HTTP/HTTPS URL은 WebView2 내부 HTML5 video로 재생하지만 두 방식 모두 영상 하단에 겹치는 **공통 WPF Overlay 컨트롤바**를 사용한다. 컨트롤은 별도 높이를 차지하지 않으며 재생 중 일반 화면 3초·영상 전체화면 2초 무입력 또는 마우스 이탈 시 숨기고 진입·이동 시 표시한다. 일시정지·조작 중에는 표시를 유지한다. URL 영상의 Chromium 기본 controls는 표시하지 않는다. `showControls=false`이면 공통 컨트롤을 숨기며 영상 클릭으로 재생/일시정지를 전환할 수 있다. `allowFullScreen=false`이면 WPF 전체화면 버튼을 숨기고 진입을 금지한다. HTML5 자체 전체화면 대신 WPF의 옵션을 검사하는 전체화면을 사용한다. `allowPlaybackRateChange=false`이면 배속 버튼을 숨기고 HTML5 영상도 1.0배로 제한한다.

음량·음소거는 Windows 기본 멀티미디어 출력 장치의 Master Volume/Mute와 양방향 동기화한다. 시작 시 현재 Windows 값을 읽고 시스템 설정을 바꾸지 않는다. 연결 성공 시 내부 영상 음량은 1.0으로 유지해 이중 감쇠를 방지하며, `defaultVolume`은 시스템 볼륨 연결 전/실패 시 내부 플레이어 초기값으로 사용한다. 슬라이더를 0보다 크게 조절하면 Windows 음소거도 해제하고, 음소거 버튼은 현재 음량 값을 유지한 채 Windows Mute만 전환한다. 외부 변경은 이벤트로 반영하고 기본 장치 변경·장치 없음은 2초 주기로 확인한다. 변경은 다른 프로그램의 출력에도 영향을 주며 팝업 종료 시 이전 시스템 값으로 복원하지 않는다. 장치 복구 시 새 장치의 현재 값을 읽는다.

위치·재생/일시정지·음량·배속·종료·오류는 WPF 컨트롤과 동기화하며 waiting/stalled는 버퍼링 안내로 표시한다. 탐색한 구간은 누적 `watchedSeconds`에 합산하지 않는다. YouTube iframe은 기존 별도 플레이어 UI를 유지하고 기본 음량·배속 제어 및 시청량 측정을 지원하지 않는다.

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
    "videoTitle": "교육 영상",
    "surveyTitle": "이해도 확인",
    "description": "영상을 시청한 뒤 퀴즈에 응답하세요.",
    "autoPlay": false,
    "showControls": true,
    "footerAction": "LINK_AND_CLOSE",
    "footerLinkUrl": "https://example.com/training"
  }
}
```

위 예시는 관련 필드만 발췌했다. 공통 필드와 최상위 `questions`·정답·문항 배점은 일반 QUIZ와 같다. 영상 재생 옵션은 §8.3 VIDEO와 같다.

- 영상 아래 퀴즈를 함께 표시한다. 영상·전체 문항은 부모 단일 세로 스크롤로 이동하고 제출 영역은 스크롤 밖 창 하단에 고정한다. 공통 푸터를 켜면 공통 푸터의 제출 버튼만 표시하고, 끄면 내부 제출 영역을 하단에 고정한다. 결합 모드의 내부 Quiz ScrollViewer는 제거하지만 단독 SURVEY/QUIZ는 자체 스크롤을 유지한다. 현재 영상 결합은 QUIZ에만 지원하며 VIDEO+SURVEY 유형은 없다.
- SURVEY/QUIZ 및 결합 QUIZ의 공통 푸터 버튼은 닫기·바로가기 대신 제출로 동작한다. 이 화면에서 `footerAction`·`footerLinkUrl`은 제출 동작을 대체하지 않는다. 헤더 닫기는 기존 종료 정책을 따른다.
- 영상 길이가 확인되고 `watchedSeconds / durationSeconds`를 소수점 4자리에서 내린 비율이 최상위 `completionRatio` 이상일 때 퀴즈 입력·제출 버튼과 **푸터 전체**를 활성화한다. 미설정 기준은 1.0이다.
- 현재 재생 위치나 최대 도달 위치로 활성화하지 않는다. 활성화한 뒤 되감기·반복 재생을 해도 다시 잠그지 않는다.
- `allowCloseBeforeComplete: true`면 헤더 X·Alt+F4로 중단할 수 있지만 푸터는 시청 기준까지 비활성화한다. false면 시청 기준 전 종료를 차단한다. 영상 재생 실패 시에는 종료를 허용하며 퀴즈를 자동 활성화하지 않는다.
- 현재 플레이어의 YouTube 임베드는 시청 비율을 제공하지 않으므로 이 모드는 로컬 영상 파일 또는 직접 재생 가능한 HTTP(S) 영상 URL을 사용한다.
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

# 10. WPF-02 결과 일괄 전송

## 10.1 기본 흐름

WPF는 사용자 동작 직후 서버 응답을 기다린 다음 창을 닫는 구조가 아니다.

```text
사용자 동작
→ WPF 로컬 결과 생성
→ %LOCALAPPDATA%\Popup\pending-results.json 저장
→ 팝업 닫기
→ POST /api/wpf/popups/results
```

네트워크/서버 오류 시 파일에 남겨 두고 다음 기회에 동일 `resultId`로 재전송한다.

백엔드는 `resultId`를 **멱등 키**로 처리해야 한다.

---

## 10.2 Request

```json
{
  "clientRequestId": "c2cc2e16d4714e569ea8451ab5284479",
  "sentAt": "2026-09-28T15:35:10+09:00",
  "results": [
    {
      "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
      "popupId": "NOTICE-001",
      "resultType": "CLOSED",
      "displayedAt": "2026-09-28T15:34:00+09:00",
      "closedAt": "2026-09-28T15:35:00+09:00"
    }
  ]
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| clientRequestId | string | O | C#이 전송 시 새 GUID(N 형식) 생성 | 전송 요청 단위 ID. 재전송 요청에서는 새 값일 수 있음 |
| sentAt | string(ISO) | O | C# 전송 시각 | 이번 전송 시각 |
| results | array | O | `[]` | 실제 전송 시 1~50개씩 전송 |

### results[] 공통

| 필드 | 형식 | 필수 여부 | Default/생성 기준 |
|---|---|---|---|
| resultId | string(GUID) | O | 팝업 결과 생성 시 GUID 생성, 재전송 시 유지 |
| popupId | string | O | 원 팝업의 popupId |
| resultType | string | O | 기본 객체값은 CLOSED이나 실제 동작에 따라 타입 결정 |
| displayedAt | string(ISO) | 선택 | `null` 가능 |
| closedAt | string(ISO) | 선택 | `null` 가능 |

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
  "popupId": "NOTICE-001",
  "resultType": "HIDDEN",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00",
  "hideDays": 7
}
```

- `hideDays`: 1~3650
- 서버가 해당 사용자/팝업에 대한 숨김 만료 시각을 계산·저장한다.

---

## 10.5 SUBMITTED — SURVEY

```json
{
  "resultId": "GUID",
  "popupId": "SURVEY-001",
  "resultType": "SUBMITTED",
  "responseStartedAt": "2026-09-28T15:34:00+09:00",
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

동영상+퀴즈의 SUBMITTED는 위 `answers`·`score`·`passed`와 함께 §10.7의 `video` 블록을 같은 항목에 넣는다. 백엔드는 영상 블록과 시청 기준을 확인한 뒤 답안을 저장하며, 시청 기준 미달 또는 영상 블록 누락 시 제출을 거절한다. 영상 시청만으로 퀴즈 완료 상태를 갱신하지 않는다.

---

## 10.7 VIDEO_WATCHED

```json
{
  "resultId": "GUID",
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

---

# 11. 결과 API Response

```json
{
  "receivedAt": "2026-09-28T15:35:11+09:00",
  "results": [
    {
      "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
      "popupId": "NOTICE-001",
      "resultType": "CLOSED",
      "status": "ACCEPTED"
    }
  ]
}
```

### 응답 필드

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| receivedAt | string(ISO) | 선택 | `null` | 서버 수신 시각 |
| results | array | O | `[]` | 처리한 항목별 결과 |
| results[].resultId | string | O | 없음 | 요청 resultId와 동일 |
| results[].popupId | string | O | 없음 | 요청 popupId |
| results[].resultType | string | O | 없음 | 요청 resultType |
| results[].status | string | O | 없음 | ACCEPTED / DUPLICATE / REJECTED |
| results[].code | string | 선택 | `null` | REJECTED 사유 |
| results[].message | string | 선택 | `null` | REJECTED 설명 |

### status 의미

| status | 의미 |
|---|---|
| ACCEPTED | 처음 정상 처리 |
| DUPLICATE | 동일 resultId가 이미 처리됨. 재처리하지 않음 |
| REJECTED | 업무 검증상 처리하지 않음 |

현재 C# 큐는 **응답 results에 포함된 resultId를 처리 종결 항목으로 보고 로컬 큐에서 제거**한다.

따라서 일시적 장애로 다시 받아야 하는 항목은 HTTP 5xx 등 요청 자체를 실패시키거나, 해당 계약을 별도 협의해야 한다. `REJECTED`를 반환하면 WPF는 재전송하지 않는다.

### 선택 응답 필드

C# DTO는 다음 값을 받을 수 있으나, 현재 UI는 서버 응답을 기다려 사용자 판정을 바꾸지 않는다.

```text
popupStatus
completed
completedAt
hiddenUntil
responseId
totalScore
passed
watchedRatio
requiredRatio
```

---

# 12. 멱등/재전송 규칙

백엔드 신규 구현에서 반드시 맞춰야 하는 핵심 규칙이다.

1. `resultId`는 결과 항목 단위 멱등 키다.
2. 동일 `resultId`가 여러 번 들어오면 업무 데이터를 중복 저장하지 않는다.
3. 이미 처리한 항목은 `DUPLICATE`로 응답할 수 있다.
4. `clientRequestId`는 전송 단위 추적용이며 업무 멱등 키가 아니다.
5. 네트워크 오류로 WPF가 같은 resultId를 다시 보내는 것은 정상 시나리오다.
6. 한 요청에 최대 50개의 results가 들어올 수 있다.

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
| 400 | 요청 형식/업무 검증 오류 | 장애 복구 제외, 정상 조회 주기 유지 |
| 401 | 인증 없음/만료 | 재로그인 후 원 요청 1회 재시도 |
| 403 | 인증됐지만 사용자 사용 불가 | 장애 복구 제외, 오류 표시 가능 |
| 426 | C# 버전 지원 중단 | 조회·결과 전송·정기 로그인 중단, pending 유지, 안내 닫기 후 정상 종료 |
| 500/502/503/504 | 일시 서버 오류 | 목록 조회는 10초×3회×5 Cycle 복구, Cycle 간 30분 휴식 후 첫 10초, 이후 60분 확인. 결과 전송은 로컬 큐 유지 |

DNS/연결 오류·Timeout도 목록 장애 복구 대상으로 처리한다. 401 재로그인은 기존 원 요청 1회 재전송 경로를 사용하며 정상 polling 기준점을 재설정하지 않는다. 복구 성공 시 서버 최신 주기를 기존 기동 기준으로 적용한다. 그 외 HTTP 상태/데이터 오류는 적극 복구 루프에 넣지 않는다.

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
```

---

# 15. 유형별 전체 JSON 예시

아래는 GET /api/wpf/popups의 popups 배열에 들어갈 완전한 항목이다. 문항은 popup 최상위 questions, 통과 점수는 popup 최상위 passingScore에 둔다. 기본값을 사용하는 선택 필드는 일부 생략했다. 미디어·링크의 example.com 주소는 형식 예시이므로 실제 접근 가능한 주소로 교체해야 한다.

6개 항목을 포함한 전체 응답 파일: [WPF-01-popup-types.json](examples/WPF-01-popup-types.json). 개별 항목은 다음 Envelope의 popups에 넣는다.

```json
{
  "serverTime": "2026-10-03T12:00:00+09:00",
  "userId": "E1001",
  "pollingIntervalSeconds": 1800,
  "popups": []
}
```

## 15.1 TEXT

```json
{
  "popupId": "TEXT-001",
  "popupType": "TEXT",
  "title": "서비스 안내",
  "displayMode": "SEQUENTIAL",
  "displayOrder": 100,
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
  "showDoNotShowAgain": false,
  "allowCloseBeforeComplete": true,
  "questions": [],
  "content": {
    "contentTitle": "점검 공지",
    "description": "안내 내용을 확인해주세요.",
    "showContentHeader": true,
    "plainText": "10월 5일 22시부터 23시까지 서비스 점검이 진행됩니다.",
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
  "popupId": "IMAGE-001",
  "popupType": "IMAGE",
  "title": "교육 안내",
  "displayMode": "SEQUENTIAL",
  "displayOrder": 100,
  "sizeMode": "FIXED",
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
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
  "popupId": "VIDEO-001",
  "popupType": "VIDEO",
  "title": "교육 영상",
  "displayMode": "SEQUENTIAL",
  "displayOrder": 100,
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
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
    "autoPlay": true,
    "isLoop": false,
    "defaultVolume": 0.7
  }
}
```

## 15.4 SURVEY — 세로 단일 / 가로 복수 / 주관식

```json
{
  "popupId": "SURVEY-001",
  "popupType": "SURVEY",
  "title": "교육 만족도 설문",
  "displayMode": "SEQUENTIAL",
  "displayOrder": 100,
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
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
  "popupId": "QUIZ-001",
  "popupType": "QUIZ",
  "title": "보안 확인 퀴즈",
  "displayMode": "SEQUENTIAL",
  "displayOrder": 100,
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
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
  "popupId": "VIDEO-QUIZ-001",
  "popupType": "QUIZ",
  "title": "영상 교육 및 확인 퀴즈",
  "displayMode": "SEQUENTIAL",
  "displayOrder": 100,
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
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
    "videoTitle": "보안 교육",
    "videoUrl": "https://example.com/media/security.mp4",
    "description": "영상의 80% 이상을 시청해주세요.",
    "showDescription": true,
    "showControls": true,
    "allowFullScreen": true,
    "allowPlaybackRateChange": true,
    "autoPlay": true,
    "isLoop": false,
    "defaultVolume": 0.7,
    "surveyTitle": "영상 확인 퀴즈",
    "videoEnabled": true
  },
  "completionRatio": 0.8
}
```

QUIZ의 복수 선택은 정답 집합과 선택 집합이 정확히 같아야 60점을 얻으며 부분 점수는 없다. VIDEO+QUIZ는 영상 시청 80% 완료 후 문항 제출이 가능하다. TEXT 자동 채점은 최소 외부 제공 범위에 포함하지 않아 예시에서는 선택형 채점만 사용한다.

---

# 16. 백엔드 구현 체크리스트

새 백엔드가 C# WPF와 연동되기 위해 최소한 다음을 확인한다.

- [ ] 로그인 API가 accessToken을 반환한다.
- [ ] 목록/결과 API가 Bearer 인증 사용자를 식별할 수 있다.
- [ ] GET /api/wpf/popups에는 userId 요청 파라미터를 요구하지 않는다.
- [ ] 목록 API는 서버에서 노출 판정을 끝낸 최종 목록만 반환한다.
- [ ] popups가 없을 때 빈 배열을 반환한다.
- [ ] popupType별 content 필드 이름을 그대로 제공한다.
- [ ] QUIZ는 로컬 채점용 정답 키와 passingScore를 내려준다.
- [ ] 결과 API는 resultId 기준 멱등 처리를 한다.
- [ ] 동일 resultId 재수신 시 업무 데이터를 중복 저장하지 않는다.
- [ ] results[].status를 ACCEPTED/DUPLICATE/REJECTED 중 하나로 반환한다.
- [ ] REJECTED는 WPF가 재전송하지 않는 종결 상태임을 고려한다.
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
│  ├─ WpfPopupListResponseDto.cs
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
