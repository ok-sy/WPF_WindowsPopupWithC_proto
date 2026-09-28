# 18. 팝업 구버전 분기 및 미사용 소스 정리 TODO

- 작성일: 2026-09-28 (KST)
- 범위: **팝업 기능 소스만** — WPF `popup-frameWork/Popup`, 서버 `server.*.popup`/`server.*.wpf` 패키지·`PopupMapper.xml`, 관리자 웹 `features/RgstPop/**`·`PopupAdmin.ts`·`PopupAdminApi.ts`, `db/oracle/*.sql`. zero 공통 프레임워크(보안 필터·`DefaultPublicUrls`·`BasicConfig` 등)는 대상에서 제외한다.
- 기준: 백엔드 독립형 WPF Client API 계약서 v3.0(`docs/interfaces/POPUP_INTERFACE_SPEC.md`) — WPF가 쓰는 API는 `POST /p/api/wpf/auth/login`, `GET /p/api/wpf/popups`, `POST /p/api/wpf/popups/results` 3개뿐이다.
- 상태: **조사·목록화 완료, L-0(동작 변화 없는 삭제) 코드 반영 완료(2026-09-28, 미커밋), L-1 이후 미착수**. L-0 실행 검증(`--demo`, 서버 기동 후 HTTP 확인)은 미실행. 아래 목록은 HEAD `5bfa543` 기준 정적 조사(참조 grep, 호출 경로 추적, CHANGELOG·설계 문서 대조) 결과다. 빌드·실행 검증은 하지 않았다. 줄 번호는 조사 시점 기준이므로 착수 시 다시 확인한다.

분류:

| 분류 | 의미 |
|---|---|
| DEAD | 호출·참조가 없는 코드, 파일, 필드 |
| LEGACY-BRANCH | 구버전 데이터·계약을 받아 새 형태로 바꾸는 분기 |
| COMPAT-DEFAULT | 필드가 없는 과거 행에 기본값을 채우는 처리(현재 설계상 기본값과 겹치는 경우 포함) |
| MIGRATION-ONLY | 기존 DB 보정에만 필요한 스크립트 |
| SUSPECT | 판단 보류, 정책 결정 또는 데이터 확인 필요 |

---

## 0. 핵심 발견 — 착수 순서를 제약하는 사항

1. **`imageSizeMode = FIXED`는 과거 값이 아니라 지금도 생성되는 값이다.** 계약서(§imageSizeMode)와 WPF는 FIXED를 "과거 호환 값 → ADAPTIVE"로 처리하지만, 관리자 웹 `PopupEditorDialog.tsx:64`의 신규 팝업 기본값과 `:308` 선택 fallback·메뉴 "고정 영역"이 FIXED를 저장한다. WPF 매핑(`PopupFactory.cs:297`)을 먼저 지우면 새로 등록한 IMAGE 팝업이 깨진다. → 반드시 **웹 → 데이터 → WPF** 순서(§4 L-1).
2. **WPF SURVEY/QUIZ 구형 분기는 Demo Mode 샘플 JSON만 쓰고 있다.** 실서버는 이미 `content.questions`를 보내지 않지만, `DemoPopupDataService.cs:117-200` 샘플이 `content.questions`·`content.passingScore`·`correctAnswers`(구 정답 키) 형태다. 분기를 먼저 지우면 데모 QUIZ 채점이 항상 0점이 된다. → **데모 JSON v3 형태 전환이 선행**(§4 L-2).
3. **서버 구 WPF-01~06 엔드포인트가 인증 없이 열려 있다.** `PopupController`(`/p/api/popups`, `/p/**` 공개 경로)가 query/body의 `userId`를 그대로 신뢰해 타인 팝업 조회·숨김·응답·진행률 기록이 가능하다. WPF 호출부도 없으므로 **가장 먼저 삭제**한다(§1 S-1).
4. **`05_question_option_layout_oracle.sql`은 원격 개발 DB에 미적용**(VPN 미연결, 2026-09-28-02). 현재 매퍼가 `OPTION_LAYOUT`을 SELECT/INSERT하므로 원격 DB에서는 서버가 실패한다. 이 스크립트는 적용 전 삭제 금지(§3 D-1).

---

## 1. 서버 (`zero-rule-server` 팝업 소스)

### 1.1 미사용 소스 (DEAD)

| ID | 위치 | 내용·근거 | 변경 로직 |
|---|---|---|---|
| S-1 | `web/api/.../popup/PopupController.java` 전체 (`@RequestMapping("/p/api/popups")` L33-102) | 구 WPF-01~06: `GET ?userId=`, `/{id}/hide`, `/responses`, `/video-progress`, `/events`, `GET /statuses`. 서버·웹·WPF 현행 호출 없음. 설계 09 미결 14에서 "WPF 전환 후 제거"로 정리됨. 공개 경로에서 `userId`를 신뢰하는 보안 구멍 | 클래스 삭제. **`PopupVideoController`(`GET /p/api/popups/video`)는 같은 접두어지만 현행 영상 URL이므로 유지** |
| S-2 | `web/api/.../payload/popup/` `PopupHideRequest`, `PopupSubmitRequest`, `VideoProgressRequest`, `PopupEventRequest` | S-1 전용 | S-1과 함께 삭제 |
| S-3 | `PopupService.getPopups(userId)` L331-353, 단일 인자 `loadQuestions(ids)` L771-773, `recordPopupEvent` L712-745, `getPopupStatuses` L749-754 | S-1에서만 호출. `recordPopupEvent`는 `WpfResultProcessor.recordDisplayAndClose`가 대체 | 삭제. **`hidePopup`·`submitResponse`·`saveVideoProgress`는 `WpfResultProcessor`가 위임 호출하므로 유지** |
| S-4 | `PopupService.loadPublicQuestions` L779-782 | 호출 0건(WPF 경로는 `loadQuestionsWithAnswerKey` + `WpfPopupItem.withoutAnswerKey`) | 삭제 |
| S-5 | `PopupMapper` `upsertPopupEvent`(XML L881-922), `selectPopupStatuses`(XML L925-941), 도메인 DTO `PopupEventResponseDto`, `UserPopupStatusDto` | S-3 삭제 후 호출자 없음 | S-1~S-3과 한 커밋에 삭제 |
| S-6 | `WpfPopupItem.from(PopupResponseDto)` L68-70 | 호출 0건 | 삭제 |
| S-7 | `WpfResultCommand` 9인자 생성자 L151-155, `PopupQuestionDto` 11인자 생성자 L23-28 | 테스트에서만 사용("기존 호출부 호환용") | 삭제 후 테스트(`WpfPopupServiceTest`, `WpfResultProcessorTest`, `WpfPopupDatabaseTest`, `PopupQuestion*Test` 등)를 정식 생성자 또는 테스트 헬퍼로 교체. `PopupQuestionDatabaseTest` L73의 `service.getPopups` 호출도 S-3과 함께 교체 |
| S-8 | `/apis/popup/info` 응답 `PopupInfoResponse.adminQuestions` (`PopupAdminController` L53-54) | 웹 편집기·템플릿 선택은 `popup`·`targetGroups`만 읽음. 요청마다 문항 쿼리 1회 추가 | 응답에서 제거(웹 W-6과 함께). `/question-template`의 `adminQuestions`는 사용 중이므로 유지 |

### 1.2 축소 대상 (SUSPECT, S-1 이후)

| ID | 위치 | 내용 | 변경 로직 |
|---|---|---|---|
| S-9 | `selectVideoCompletedAt`(XML L862-868), `selectHiddenUntil`(XML L670-676), `PopupSubmitResponseDto`·`VideoProgressResponseDto`의 WPF 경로 미사용 필드 | 구 개별 API 응답을 만들던 조회. `WpfResultProcessor`는 `watchedRatio`/`requiredRatio`, 숨김 여부만 사용 | 반환형을 `WpfResultProcessor` 필요 값으로 축소하고 불필요 SELECT 제거 |
| S-10 | `PopupMapper.selectAvailablePopups(String)` default 오버로드 L129-131 | S-1 이후 `submitResponse` 재검증 전용 | `(userId, false)` 명시 호출로 바꿔 "완료 팝업 재제출 허용" 의도를 드러냄 |
| S-11 | `WpfResultRequest.sentAt` L36 | 서버 미사용(WPF는 전송) | 계약 필드이므로 유지. 필요 시 로그만 추가 |

### 1.3 구버전 데이터 분기 (LEGACY-BRANCH / COMPAT-DEFAULT)

| ID | 위치 | 대상 구버전 데이터 | 변경 로직 |
|---|---|---|---|
| S-12 | `PopupContentAssembler.assemble` L73-78, `PopupService.toResponseDto` L1095-1098 | 구 PostgreSQL `JSONB_BUILD_OBJECT` 결과·구 WPF-01 계약 재현용으로 `content`에 `questions`, `passingScore`, `validateRequiredQuestions`, `completionRatio`, `allowCloseBeforeCompletion` 중복 삽입. `WpfPopupItem` L64-65가 일부를 다시 제거 | S-1 삭제 후 중복 키 생성 중단. WPF가 `content.completionRatio` 등을 읽지 않음(C-7)을 확인하고 제거 |
| S-13 | `PopupService.toAdminSaveCommand` L960-1000 (정합성 이슈) | `content` 전체(제목·URL·`completionRatio` 등 컬럼 값 사본 포함)를 `CONTENT_OPTIONS`에 저장하고, 조회 시 `putAll`이 마지막에 실행돼 **오래된 JSON 사본이 컬럼 값을 덮어씀** | 저장 시 정규 컬럼 키와 서버 파생 키를 `CONTENT_OPTIONS`에서 제거. 웹 W-9(유형별 content 정리)와 같이 진행. 기존 행은 D-5로 정리 |
| S-14 | `PopupMapper.xml` L151-154 `DISPLAY_MODE` CASE fallback | `SEQUENTIAL`/`SIMULTANEOUS` 외 값(과거·이관 데이터)을 SEQUENTIAL로 치환. 저장 검증은 이미 거부(`PopupService` L860), DDL CHECK 없음 | D-3에서 잘못된 행 확인 → CHECK 제약 추가 → CASE 제거 |
| S-15 | `PopupService.toResponseDto` L1104-1111 크기 기본값(900/620/0.7/0.75/480/320/1200/900) | 크기 컬럼 NULL인 과거·이관 행. 관리자 저장은 항상 값을 씀 | D-3에서 NULL 행 확인 → 보정 후 NOT NULL → 기본값 제거(우선순위 낮음) |
| S-16 | `PopupQuestionDto` compact 생성자 L31 `optionLayout` null → `VERTICAL` | 컬럼은 NOT NULL DEFAULT, 웹은 항상 전송. 이 기본값 때문에 `PopupQuestionRules.validate` L131의 null 거부가 동작하지 않음 | S-7 이후 저장 경로에서 null을 검증 오류로 전환. 읽기 기본값은 D-1 적용 완료까지 유지 |
| S-17 | `PopupQuestionRules` L129 RATING5 거부 ↔ DDL 주석 "기존 데이터 RATING5 허용"(`01` L349), `QUESTION_TYPE` CHECK 없음 | 과거 RATING5 문항. 옵션 행이 없으면 제출 불가, 그대로 재저장하면 검증 실패 | D-4 결과에 따라 SINGLE_CHOICE+5지선다 이관 또는 삭제 → CHECK 추가 → 주석 수정 → WPF C-25 제거 |
| S-18 | `WpfResultProcessor.logClientScoreMismatch` L153-160 | score/passed 없는 설계 12 이전 클라이언트는 비교 생략 | 유지(무해, 모든 클라이언트가 점수를 보내면 no-op) |
| S-19 | `WpfResultRequest` `@JsonIgnoreProperties(ignoreUnknown=true)`(구 클라이언트 `userId`), `WpfClientVersionProps` 빈 최소 버전·`requireHeader=false` | 구 클라이언트 허용 스위치 | 유지(의도된 설정). 반입 직전 설정값만 확인 |

### 1.4 오래된 주석

| ID | 위치 | 변경 로직 |
|---|---|---|
| S-20 | `PopupMapper.xml` L9·L453(구 API를 현행 사용처로 기술), L460(존재하지 않는 `WpfPopupMapper.selectWpfAvailablePopups` 참조), `WpfPopupService` L232(`PopupService.getPopups` 출처 기술), `WpfPopupController` L39(`PopupController` 참조), DDL `POPUP_NOTICE.PASSING_SCORE` 주석("WPF 응답에 내려주지 않음" — 설계 12 이후 QUIZ는 전송) | S-1과 함께 수정 |

---

## 2. 관리자 웹 (`zero-rule-web` 팝업 소스)

| ID | 분류 | 위치 | 내용·근거 | 변경 로직 |
|---|---|---|---|---|
| W-1 | **구버전 값 생성** | `PopupEditorDialog.tsx:64` 기본값 `imageSizeMode: 'FIXED'`, `:308-309` fallback `\|\| 'FIXED'`·메뉴 "고정 영역" | §0-1. 계약상 과거 값인 FIXED를 신규 저장 | 메뉴에서 FIXED 제거, 기본값 `'ADAPTIVE'`. 표시 값은 `!v \|\| v === 'FIXED' ? 'ADAPTIVE' : v`로 정규화(MUI 범위 밖 경고 방지). 저장 시에도 정규화 |
| W-2 | DEAD | `main/pages/popup-preview.tsx` 전체, `PopupPreview.tsx`의 `standalone` prop(L20, 249, 253-254, 271, 299) | localStorage `?key=` 기반 새 창 미리보기. 여는 코드(`setItem`/`window.open`) 없음. 편집기 내 "실제 크기로 보기" 모달이 대체 | 페이지와 `standalone` 분기 삭제. 설계 14 §3.2의 반입 대상 목록에서도 제거 |
| W-3 | DEAD(문서) | `zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md` | TEXT 카드 2개(2026-09-16 제거)·새 창 보기(W-2) 기술, popupPosition·폰트 크기·IMAGE 모드·optionLayout 누락 | 현행 기준으로 재작성하거나 삭제 |
| W-4 | DEAD(잔재) | `PopupEditorDialog.tsx:427` 불필요한 `{...}`, `:301-302` 들여쓰기 | Markdown 조건(`!markdownMode &&`) 제거(1a445ec) 잔재 | 괄호 제거·정렬 |
| W-5 | DEAD(주석) | `PopupEditorDialog.tsx:298`, `PopupPreview.tsx:37` `[2026-09-21 제거]` 표식 | Markdown 제거 흔적. 코드·의존성은 없음 | 삭제(선택). 미정리 행의 `markdown*` 키는 편집기 저장 시 다시 기록되므로 D-2 적용이 실질 조치 |
| W-6 | DEAD 필드 | `PopupAdmin.ts:100-103` `AdminPopupQuestion.correctValues`, `:111` `AdminPopupInfo.adminQuestions` | 참조 0건. 정답은 `popup.questions[].options[].isCorrect`가 대체 | 타입에서 제거. 서버 S-8과 함께 |
| W-7 | DEAD(주석) | `PopupAdminApi.ts:51` | `updateActive` 설명 주석이 `questionTemplates` 위에 있음 | `:62` 위로 이동 |
| W-8 | COMPAT-DEFAULT(중복) | `RgstPop.tsx:110,243`, `PopupEditorDialog.tsx:168` `displayOrder ?? 100` | 컬럼 NOT NULL DEFAULT 100, 서버 저장도 100 기본값 | 제거 가능(매우 낮은 위험) |
| W-9 | SUSPECT | `PopupEditorDialog.tsx:58-75` `createDefaultPopup` | 모든 유형의 content 키를 모든 팝업에 넣어 전송 → `CONTENT_OPTIONS`에 저장. 서버가 조회 시 넣은 파생 키도 다시 저장됨(S-13) | 저장 전 유형별로 content 키 정리. 서버 S-13과 WPF가 읽는 위치(최상위 vs content) 확인 후 진행 |
| W-10 | 차이(정합성) | `PopupPreview.tsx:62-63,74-75` | `descriptionPosition`/`imageAreaRatio` 편집 UI 없음. FILL 외 모든 모드에서 imageWidth/Height를 maxWidth로 적용해 ADAPTIVE/FIT_TO_IMAGE 계약(c1d0a48)을 재현하지 않음 | 구버전 정리와 별개 과제로 기록. W-1과 함께 볼 때 참고 |

유지(구버전 분기처럼 보이지만 WPF와 짝을 이루거나 계약 기본값): `showHighlight == null ? Boolean(highlightText)`(`PopupPreview.tsx:209-210`, `PopupEditorDialog.tsx:252`), `showBottomDescription == null ? …`(`:212-215`, `:255-256`) — WPF C-13과 **반드시 함께** 제거. VIDEO 스위치 기본값, `popupPosition || 'CENTER'`, `optionLayout ?? 'VERTICAL'`, `completionRatio ?? 0.8`·볼륨 0.7·오버레이 0.45, 폰트 크기 null=기본, epoch 초/밀리초 날짜 판별(서버 Jackson이 현재 timestamp로 직렬화), `periodMode`/`repeat*` 숨김 필드(NOT NULL 컬럼).

---

## 3. DB (`db/oracle`)

| ID | 분류 | 대상 | 변경 로직 |
|---|---|---|---|
| D-1 | MIGRATION-ONLY | `05_question_option_layout_oracle.sql` | 로컬 XE 적용 완료, **원격 개발 DB 미적용**. 적용 후 서버 기동·실DB 왕복 확인 → 스크립트는 `db/oracle/archive/` 등으로 이동. 적용 전 삭제 금지 |
| D-2 | MIGRATION-ONLY | `04_cleanup_markdown_fields_oracle.sql` | 로컬 XE 완료, 원격 개발 DB 미확인. 적용 후 보관 이동 |
| D-3 | 데이터 확인 | `POPUP_NOTICE.DISPLAY_MODE`, 크기 컬럼 NULL | S-14·S-15 제거 전 조회로 비정상/NULL 행 확인. 보정 SQL → CHECK/NOT NULL 추가 |
| D-4 | 데이터 확인 | `POPUP_QUESTION.QUESTION_TYPE = 'RATING5'` | 행 존재 여부 확인 → 이관 또는 삭제 → `QUESTION_TYPE` CHECK 추가(S-17) |
| D-5 | 데이터 보정 | `CONTENT_OPTIONS` | ① `imageSizeMode` FIXED → ADAPTIVE(W-1 이후) ② 정규 컬럼·서버 파생 키 사본 제거(S-13 이후) ③ 남은 `markdown*` 키(D-2) |
| D-6 | SUSPECT(정책 결정) | `QUESTION_TEMPLATE.TEMPLATE_GROUP_ID`·`TEMPLATE_VERSION`·`CURRENT_YN`·`UK_QTEMPLATE_GROUP_VERSION`·`UX_QUESTION_TEMPLATE_CURRENT`, `POPUP_NOTICE.SHOW_ON_LOGIN_YN`·`SHOW_ON_SCHEDULE_YN`·`SCHEDULED_AT`(+`CK_POPUP_SCHEDULED_AT`) | 버전 정책 미구현(저장마다 난수 그룹·버전 1·Y), SHOW_ON_*는 항상 'N'으로 쓰고 읽지 않음. 템플릿 버전 정책을 먼저 결정한 뒤 구현 또는 컬럼 삭제. ERwin 모델(2026-09-24)도 함께 갱신. 감사용 쓰기 전용 컬럼(`HIDDEN_FROM_AT`, `RECEIVED_AT`, `FIRST_PLAYED_AT`, `LAST_POSITION_SECONDS`, `RESULT_STATUS`/`RESULT_CODE`)과 `PERIOD_MODE`/`REPEAT_*`(미확정 기능)는 유지 |

---

## 4. WPF (`popup-frameWork/Popup`)

### 4.1 미사용 소스 (DEAD) — 동작 변화 없이 삭제 가능

| ID | 위치 | 내용·근거 | 변경 로직 |
|---|---|---|---|
| C-1 | `TextPopupWindow.xaml`(776줄), `TextPopupWindow.xaml.cs` | sample 베이스라인 창. 자기 파일 외 참조 없음. 현행은 `PopupWindow` + `TextPopupView` | 두 파일 삭제 |
| C-2 | `Services/PopupApiService.cs` `GetAvailablePopupsAsync`(L179-259, `GET /api/popups?userId=`), `HidePopupAsync`(~L266-380), `SubmitResponseAsync`(L386), `SaveVideoProgressAsync`(L419), `RecordPopupEventAsync`(L445), `GetPopupStatusesAsync`(L472) | 호출 0건. L494-498 주석 스스로 "전환 완료 후 제거" 명시 | 삭제(서버 S-1과 같은 시점) |
| C-3 | `PopupApiService.cs` `PostAsync`(L632), `EnsureSuccessAsync`(L659), `BuildPopupUrl`(L673), `ValidatePopupAndUser`(L679) | C-2 전용 | C-2와 함께 삭제 |
| C-4 | `Dtos/PopupHideRequestDto.cs`, `PopupHideResponseDto.cs`, `PopupInteractionDtos.cs`의 `PopupSubmitRequestDto`·`PopupSubmitResponseDto`·`VideoProgressRequestDto`·`VideoProgressResponseDto`·`PopupEventRequestDto`·`PopupEventResponseDto`·`UserPopupStatusDto` | C-2 전용. **`PopupSubmitAnswerRequestDto`는 `WpfResultItemDto.Answers`에서 사용 중이므로 유지** | 7개 클래스·2개 파일 삭제. `PopupSubmitAnswerRequestDto`는 `WpfResultDtos.cs`로 이동 검토 |
| C-5 | `PopupResponseDto.cs:146-152` `QuestionTemplateId`, `PeriodMode`, `RepeatInterval`, `RepeatDayOfWeek`, `RepeatDayOfMonth` | 읽는 곳 없음, 계약 v3.0 §6.3에 없음 | 삭제 |
| C-6 | `PopupResponseDto.cs:20,28` `DisplayStartAt`/`DisplayEndAt` | 읽는 곳 없으나 계약 §6.3에 "수신 가능(optional)" | SUSPECT — 유지하거나 삭제 시 계약서 동시 수정 |
| C-7 | `VideoPopupContentDto.cs:95` `CompletionRatio`, `:101` `AllowCloseBeforeCompletion` | 최상위 값(`popupDto.CompletionRatio`)만 사용(계약 §8.3) | 삭제 → 서버 S-12의 중복 키 제거 선행 조건 충족 |
| C-8 | `SurveyPopupContentDto.cs:55` `ValidateRequiredQuestions` | 읽는 곳 없음 | 삭제 |
| C-9 | `PopupManager.cs:46-48` `Enqueue`/`Show`/`EnqueueRange` | 호출 0건(`ShowRange`만 사용) | 삭제 |
| C-10 | `PopupResultQueue.cs:68` `PendingCount`, `SsoAuthHeaderProvider.cs:69,71` `LastUser`/`HasToken`, `WpfResultDtos.cs:118` `IsAccepted`, `ClientVersion.cs:98` `IsVersionError` | 호출 0건 | 삭제(진단용으로 남길 경우 주석으로 의도 명시) |
| C-11 | `ImagePopupView.xaml.cs:181-194`(".NET 구버전용 체크"), `VideoPopupView.xaml.cs:623-629`(`ParseQueryString`) | 주석 처리된 코드 | 삭제 |
| C-12 | `Popup/Docs/POPUP_OPTION_GUIDE.md:232-294`, `Popup/Docs/popup-json-mapping.md`(`/api/v1/popups?userId=`), `Popup/Docs/2026hyundaicard_popup_ddl.sql`(PG DDL) | 구 6개 API·userId 계약·구 PostgreSQL 스키마 기술, 계약 v3.0과 충돌 | 삭제하거나 `docs/interfaces/POPUP_INTERFACE_SPEC.md` 안내로 대체 |

### 4.2 구버전 데이터 분기 (LEGACY-BRANCH / COMPAT-DEFAULT)

| ID | 위치 | 대상 구버전 데이터 | 변경 로직 |
|---|---|---|---|
| C-13 | `PopupFactory.cs:297` `"FIXED" => ImagePopupSizeMode.Adaptive`, `ImagePopupContentDto.cs:59-63` 기본값 `"FIXED"` | 과거 IMAGE 크기 모드 — **단, 웹이 지금도 생성(W-1)** | **L-1 순서로만 진행**: W-1 → D-5① → DTO 기본값 `"ADAPTIVE"` → 매핑 제거(FIXED는 기존 `ArgumentException` 경로) → 계약서에서 FIXED 삭제 |
| C-14 | `PopupFactory.cs:216-229` 최상위 `questions` 없으면 `content.questions`, `SurveyPopupContentDto.cs:32` `Questions` | v2 이전 서버 JSON. 실서버는 미전송, 데모 JSON만 사용(`DemoPopupDataService.cs:120,175`) | L-2: 데모 JSON 최상위 `questions`로 이동 → fallback·DTO 필드 삭제 |
| C-15 | `PopupFactory.cs:262-263` `content.passingScore` fallback, `SurveyPopupContentDto.cs:44` | 동일(데모 L174만 사용) | L-2: 데모 값을 최상위로 → 삭제 |
| C-16 | `SurveyQuestionDto.cs:67-75` `CorrectAnswers`, `Models/SurveyQuestion.cs:61-76`, `PopupFactory.cs:243`, `QuizGrader.cs:21-22,75-86` 값 집합 채점 | 구 정답 키(보기 value 목록). 실서버는 `options[].isCorrect`/`correctAnswer`/`answerMatchMode`. 데모 L183,196만 사용 | L-2: 데모 QUIZ를 `isCorrect`+`questionScore`로 전환 → `CorrectAnswers`·값 집합 분기 삭제. 이후 `SurveyAnswer.SelectedValues`는 필수 응답 검사(`SurveyPopupView:516`)만 남으므로 `SelectedOptionIds` 기준으로 교체 검토 |
| C-17 | `QuizGrader.cs:40,49` `QuestionScore` null → `100 / 채점 문항 수` | 구 데모 규칙 | SUSPECT — 서버 `gradeAnswer`의 null 배점 처리와 일치시키는 것이 우선. 데모 JSON에 `questionScore` 필수화 후 제거 여부 결정 |
| C-18 | `DemoPopupGateway.cs:21,147-150,198-225` `Grade()` | Score/Passed 없는 "구 클라이언트" QUIZ 제출. 현행 WPF는 항상 점수 전송, 데모 큐는 별도 파일이라 구 항목 유입 불가 | 삭제. 점수 누락 시 불합격 처리 또는 거부 |
| C-19 | `SurveyPopupView.xaml.cs:473-479` 문자열 Tag 호환 | "구 커스텀 컨트롤" — Tag는 항상 `SurveyOption`(L289, L313)이라 도달 불가 | 삭제. L461-464 `OptionId > 0` "자동 생성 미리보기 보기" 주석은 RATING5 자동 생성 제거(2026-09-28)로 사실과 달라짐 → 방어 조건만 남기고 주석 수정 |
| C-20 | `PopupWindow.xaml.cs:810-820` `SaveDoNotShowAgainAsync()` | 구 `/hide` 호출 흐름 유지용 껍데기(`RecordDoNotShowAgainChoice()`만 호출) | 인라인 후 삭제(동작 변화 없음) |
| C-21 | `VideoPopupView.xaml.cs:828-832` `RequestProgressSave(bool force)` | 구 10초 `/video-progress` 저장 잔재, `force`는 no-op. 호출부 L544, 549, 899, 1082, 1746, 1925, 1995 | 인자 제거, `UpdateProgressSnapshot`으로 이름 변경 검토 |
| C-22 | `Dtos/FlexibleDateTimeOffsetJsonConverter.cs` 숫자(epoch 초) 분기, 등록 `PopupApiService.cs:162-166` | 서버 교체기(구 popup-api ISO / zero-server epoch 초) 대응. WPF API 응답은 ISO(`WpfApiOracleHttpTest`) | SUSPECT — WPF 3개 API의 날짜 직렬화 형식을 확인한 뒤 숫자 분기 제거. 요청 본문용 Write(ISO "O")는 유지 |
| C-23 | `PopupFactory.cs:159,165` `ShowHighlight ?? 문구 있음`, `ShowBottomDescription ?? 문구 있음`, `TextPopupContentDto.cs:11,14` nullable | 표시 플래그 도입 이전 TEXT 행 | 데이터 확인(플래그 없는 행 0건) 후 웹 미리보기 분기(§2 유지 목록)와 **동시에** non-null 기본값으로 전환 |
| C-24 | `PopupFactory.cs:313-314` `VIEWPORT_RATIO`/`RATIO` 동시 허용 | 웹은 `RATIO`, 데모 JSON·베이스라인은 `VIEWPORT_RATIO`. 계약서는 둘 다 표기 | 하나로 확정(웹 기준 `RATIO` 권장) → 데모 JSON·계약서 정리 → 다른 쪽 제거 |
| C-25 | RATING5 매핑 `PopupFactory.cs:276`, `SurveyPopupView.xaml.cs:231,369` | 과거 문항 유형. 서버 저장은 거부, 계약 v3.0은 아직 표기 | S-17·D-4 결론 후 계약서와 함께 제거 |
| C-26 | `PopupWindow.xaml.cs:460-468` `default: goto case Fixed`, `Models/ImagePopupSizeMode.cs:8-13` Adaptive 주석 | 도달 불가 분기, 확정 계약(설계 15)과 다른 주석 | 분기 정리, 주석 수정 |

유지: `PopupFactory.cs:58-76` 오버레이 기본 true/0.45, 폰트 크기 null=기본 — 선택 필드 기본값이므로 유지하되 "기존 데이터 호환" 주석을 "미지정 시 기본값"으로 수정.

---

## 5. 연계 순서 (변경 로직)

단계 사이에 빌드·테스트를 끊어 확인한다. 각 단계는 별도 커밋으로 만들어 되돌리기 쉽게 한다.

### L-0. 동작 변화 없는 삭제 (먼저)

- [x] 서버: S-1~S-7, S-20 — 구 `PopupController`·payload 4개·`getPopups`/`recordPopupEvent`/`getPopupStatuses`/`loadPublicQuestions`·`upsertPopupEvent`/`selectPopupStatuses`·DTO 2개·`WpfPopupItem.from(dto)`·호환 생성자 2개 삭제, 테스트 호출부를 정식 생성자로 교체, 매퍼·WPF 서비스·컨트롤러 주석 수정. **S-20 중 DDL `POPUP_NOTICE.PASSING_SCORE` 주석은 보류** — `01_popup_schema_oracle.sql`을 바꾸면 미커밋 ERwin 산출물(`ERD/model/popup_oracle_20260924_manifest.json`)의 원본 해시가 어긋나므로 ERwin 작업 커밋 후 함께 수정
- [x] WPF: C-1~C-5, C-7~C-12, C-18~C-21, C-26 (C-18은 점수 누락 QUIZ 제출을 불합격으로 처리, C-21은 `UpdateProgressSnapshot()`으로 이름 변경, `PopupSubmitAnswerRequestDto`는 `WpfResultDtos.cs`로 이동)
- [x] 웹: W-2~W-5, W-7 (설계 14 §3.2 반입 목록에서 `popup-preview.tsx` 제거)
- [x] 검증(정적): 서버 popup/wpf 테스트 66건 중 60 통과·6 skip(실DB 필요)·실패 0, `dotnet build Popup.slnx` 경고 0·오류 0, `pnpm --filter @zerorule/web build` 성공
- [ ] 검증(실행): `--demo` 전체 팝업 표시·QUIZ 제출, 서버 기동 후 구 `/p/api/popups?userId=` 404 확인, **`/p/api/popups/video` 영상 재생 정상 확인**, 관리자 미리보기 화면 확인

### L-1. imageSizeMode FIXED 제거 (순서 고정)

- [ ] 1) 웹 W-1: 기본값·메뉴 ADAPTIVE, 로드·저장 시 FIXED→ADAPTIVE 정규화
- [ ] 2) (선택) 서버 저장 검증에서 IMAGE `imageSizeMode` 허용값을 ADAPTIVE/FIT_TO_IMAGE/FILL로 제한
- [ ] 3) DB D-5①: 로컬 XE·원격 개발 DB `CONTENT_OPTIONS` FIXED→ADAPTIVE, 샘플 SQL(`02`)·데모 JSON 수정
- [ ] 4) WPF C-13: DTO 기본값 ADAPTIVE → FIXED 매핑 제거
- [ ] 5) 계약서 v3.0에서 FIXED 과거 호환 설명 삭제, 설계 15 갱신

### L-2. 데모 JSON v3 전환 → WPF 설문/퀴즈 구형 분기 제거

- [ ] 1) `DemoPopupDataService` SURVEY/QUIZ: 최상위 `questions`·`passingScore`, `options[].isCorrect`, `questionScore`
- [ ] 2) `--demo`로 QUIZ 합격/불합격·재도전 확인
- [ ] 3) C-14~C-16 삭제, C-17 결정(서버 null 배점 처리와 대조)
- [ ] 4) `SelectedValues` → `SelectedOptionIds` 필수 검사 교체 검토

### L-3. content 중복 키 정리 (서버·웹·WPF 동시)

- [ ] C-7(WPF가 content 사본을 읽지 않음) 완료 확인
- [ ] 서버 S-12 중복 키 생성 중단, S-13 저장 시 컬럼·파생 키 제거
- [ ] 웹 W-9 유형별 content 정리, W-6·S-8 `adminQuestions`/`correctValues` 제거
- [ ] DB D-5② 기존 행 정리
- [ ] 검증: 관리자 수정 → 재조회 시 컬럼 값이 반영되는지(사본에 가려지지 않는지), WPF 표시 E2E

### L-4. 원격 개발 DB 적용·데이터 확인 후 기본값 분기 제거

- [ ] D-1(`05`)·D-2(`04`) 원격 개발 DB 적용 → 스크립트 보관 이동
- [ ] D-3·D-4 조회 → 보정 SQL
- [ ] S-14 CASE 제거 + DISPLAY_MODE CHECK, S-15 NOT NULL + 기본값 제거, S-16 null 검증 오류 전환
- [ ] S-17·C-25 RATING5 정리(이관/삭제 + QUESTION_TYPE CHECK + 계약서)
- [ ] C-23 TEXT 표시 플래그 non-null 전환(웹 미리보기 분기 동시)

### L-5. 정책 결정이 필요한 항목

- [ ] D-6 템플릿 버전 정책(구현 또는 컬럼 삭제), SHOW_ON_*/SCHEDULED_AT 삭제 여부 → DDL·ERwin 모델 갱신
- [ ] C-24 크기 모드 이름 `RATIO`/`VIEWPORT_RATIO` 단일화
- [ ] C-6 `DisplayStartAt`/`DisplayEndAt` 계약 유지 여부
- [ ] C-22 날짜 컨버터 숫자 분기 제거 여부
- [ ] W-3 parity 문서 재작성/삭제, W-10 미리보기 IMAGE 계약 반영(별도 과제)

---

## 6. 유의사항

- `popup-frameWork/Popup/appsettings.json`에 로컬 변경(`DemoMode: true`)이 남아 있다. 정리 커밋에 섞이지 않게 한다.
- 설계 14 §3.2 반입 목록, `scripts/export-offline-package.ps1` 매니페스트는 L-0 이후 다시 생성한다.
- 삭제 대상 중 설계 문서(01~13)에 코드 스켈레톤으로 남은 구 API 설명은 이력으로 두고, 현행 기준은 계약서 v3.0으로 일원화한다.
