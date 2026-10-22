# TODO71 코드-정책 정합성 점검 (71-6·71-7)

기준일: 2026-10-22 (KST). 대상: 팝업 관련 소스 전체(WPF `popup-frameWork`, 서버 `zero-rule-server` 팝업·WPF·샘플 모듈, 관리자 웹 `RgstPop`·`PopupcommonComponent`·도메인 타입·API 클라이언트, `scripts`, `db/oracle`). Excel·Word·PDF 산출물은 별도 작업이라 제외.

## 1. 수행 내용

- 코드 주석의 내부 이력 번호(`[TODO..]`, `[설계 ..]`, `기준 N`, `L-n/C-nn`, 설계 절 번호 등)를 `POL-xx-yy : 항목명` + 현재 동작 설명으로 대체했다. 원본 TODO는 정책 문서·[원본 매핑표](INVENTORY.md)로 역추적한다.
- 클래스·컴포넌트·공개 진입점(public 메서드, API 엔드포인트, export 함수)에 `■ 기능명 / - in / - out / - 무엇을 받아 무엇을 한다` 머리 주석을 달았다.
- 주석을 쓰며 읽은 코드를 연결한 정책 항목과 대조했다. 코드는 고치지 않고 아래 §3에 기록했다. 주석이 실제 코드와 달랐던 곳은 주석만 바로잡았다(§4).
- 영역 7개(WPF 화면 22 · WPF 서비스 25 · WPF 기타 33 · 서버 핵심 52 · 서버 서비스 33 · 서버 웹 38 · 웹/스크립트/DB 49)로 나눠 진행했다. 공통 프론트 폴더(PopupcommonComponent)는 TODO69 주석 정리에서 같은 형식으로 먼저 적용했다.

## 2. 검증

| 항목 | 결과 |
|---|---|
| 주석 외 코드 불변 | `scripts/check-comment-only-71.py`(HEAD 대비, 주석·공백 제거 후 비교: C#·Java·TS/JS·XML/XAML·SQL·Python/YAML)로 변경 파일 243개 전부 일치. PowerShell `<# #>` 블록 1곳은 diff로 블록 내부 문장만 바뀐 것을 확인 |
| 의도한 문자열 변경 | Demo 상세옵션 안내 문구 3곳(`TODO58`/`설계 50-B` → `POL-04-01`/`POL-09-02`)과 WebView2 HTML 문자열 안 JS 주석 1곳만 문자열을 바꿨다 |
| 빌드·테스트 | WPF Release 빌드 경고·오류 0, `scripts/PopupWindowTests` 403건 통과. 서버 `gradlew test --offline` 187건 실패 0·skip 11(Oracle 연동). 웹 `tsc --noEmit`·eslint 오류 0, 웹 검증 9종 통과 |
| 남은 내부 번호 | 주석 0건. 문자열 리터럴만 남음(§5) |
| 정책 ID 유효성 | 주석의 POL ID는 docs/policies 표에 있는 ID만 사용(`POL-15` 2단계 1곳, 정책 줄 없는 일반 유틸 1곳은 §6) |

## 3. 코드-정책 어긋남·결정 필요 (코드 미수정)

| 정책 ID | 위치 | 정책 | 코드 실제 | 영향·결정 필요 |
|---|---|---|---|---|
| POL-10-03 | `popup-frameWork/Popup/Services/PopupResultBuilder.cs` `EffectiveHideDays` | HIDDEN hideDays 누락 시 30일, 유효 1~3650 | null뿐 아니라 0 이하도 30으로 바꾸고 3650 초과는 그대로 보냄 | 낮음(서버 저장이 1~3650으로 막음). 0 이하·상한 초과 처리 규칙 결정 필요 |
| POL-06-02 | `zero-rule-server/.../PopupService.java` `gradeAnswer` | QUIZ MULTIPLE_CHOICE는 정답 수만큼만 선택(웹·WPF가 제한) | 서버는 SINGLE_CHOICE 2개 이상만 거부, MULTIPLE_CHOICE 초과 선택은 거부 없이 오답(0점) 처리 | 낮음. 서버에서도 거부할지 결정 필요 |
| POL-09-02 | `zero-rule-server/web/api/.../sample/relay/BackendResponseMapper.java` | pollingIntervalSeconds 1800~3600초 | 중계 샘플은 양의 정수만 검사하고 범위는 보지 않음 | 낮음. 범위 검증을 중계 샘플에 둘지 백엔드에 맡길지 결정 필요 |
| POL-09-02 | `popup-frameWork/Popup/Services/DemoPopupGateway.cs` | 매 조회 응답에 pollingIntervalSeconds | Demo 응답 0, 유예는 고정 1800초 별도 계산 | Demo 전용(POL-14-02). 실제 계약 영향 없음 |
| POL-02-02 | `db/oracle/01_popup_schema_oracle.sql` 175·201줄 | allowCloseBeforeComplete 폐기 | 신규 DDL이 `ALLOW_CLOSE_BEFORE_COMPLETE_YN`(DEFAULT 'Y'·CHECK)을 계속 만든다. 서버 매퍼·DTO는 읽고 쓰지 않음(주석에 "컬럼 존치" 명시) | 낮음. 신규 DDL에서 컬럼을 뺄지(구 데이터 호환 유지 여부) 결정 필요 |
| POL-04-02 | `db/oracle/06_image_size_mode_adaptive_oracle.sql` 5줄 | IMAGE 모드 ADAPTIVE·FIT_TO_IMAGE·ORIGINAL | 과거 이관 스크립트 배경 설명에 "ADAPTIVE / FIT_TO_IMAGE / FILL"(실행 SQL은 ADAPTIVE 변환만) | 동작 영향 없음. 적용 완료된 과거 스크립트의 이력 문구로 유지(정정 시 문구만) |

참고(충돌 아님): 재노출 유예(DEFER_UNTIL_AT)는 LATER뿐 아니라 미완료로 닫힌 CLOSED(SURVEY·QUIZ·VIDEO)에도 적용된다. POL-11-02·POL-10-03 문구는 LATER만 적고 있어 정책 문서 보완을 검토할 수 있다.

## 4. 주석이 실제와 달라 주석만 바로잡은 곳

| 위치 | 기존 | 실제 |
|---|---|---|
| `popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs` FIT_TO_IMAGE | `content.width/height` | 공통 `popup.width/height`(POL-04-01) |
| `popup-frameWork/Popup/Models/ImagePopupSizeMode.cs` ADAPTIVE·FIT_TO_IMAGE | `content.width/height`, 비율 설명 누락 | `popup.width/height`, 비율 고정 Uniform·해제 Fill, 작업 영역 90% 초과분은 가운데 정렬 후 ClipToBounds |
| `popup-frameWork/Popup/Views/Contents/SurveyDesign.cs`·`SurveyStyles.V2.xaml` | V2 색 규칙 설명이 XAML 값과 다름 | 실제 V2 XAML 값 |
| `popup-frameWork/Popup/Services/DemoPopupGateway.cs` | score/passed 없으면 "불합격 기록" | `WPF_INVALID_RESULT`로 거절(REJECTED) |
| `zero-rule-server/.../PopupContentAssembler.java` | "닫기 허용"을 응답 필드로 제공 | 폐기 키는 저장·응답에서 버림 |
| `zero-rule-server/web/api/.../PrototypeTokenWpfUserResolver.java` | `GET /p/api/wpf/popups` | `POST`(POL-09-02) |
| `zero-rule-server/web/api/.../RelayBackendProperties.java` | `RELAY_BACKEND_API_KEY` | `POPUP_SAMPLE_RELAY_API_KEY` |
| `zero-rule-server/web/api/.../WpfResultRequest.java` | resultType 4종 | 5종(CLOSED·HIDDEN·LATER·SUBMITTED·VIDEO_WATCHED) |
| `zero-rule-server/repo/core/.../PopupSingleQuerySampleMapper.java` | SQL 경로 오기 | `mappers/popup/sample/PopupSingleQuerySampleMapper.xml` |
| `zero-rule-server/repo/core/.../PopupMapper.xml` | 삭제 CASCADE 설명이 시간대 resultMap 위에 있음 | `deleteAdminPopupTargets` 쿼리 위로 이동 |

## 5. 남긴 문자열 리터럴(코드 동작·출력 값이라 유지)

- 검증 스크립트·테스트의 체크 메시지 태그(`"[TODO57] ..."`, `"[설계 43] ..."`, `PASS ... (design 51, TODO54)`, Java assert 메시지): 테스트 출력 식별용. 목록은 [comments.csv](comments.csv)의 `유지` 행.
- SQL `COMMENT ON COLUMN ... IS '...(설계 12)/(TODO52-1)'`: DB 컬럼 설명 메타데이터. 바꾸려면 DDL 재적용이 필요해 유지.
- `scripts/audit-policy-docs-71.py`·`export-interface-word.cjs`의 TODO71 등 문자열: 산출물 생성 규칙.

## 6. 정책 연결 예외

- `popup-frameWork/Popup/Services/WindowsStartupService.cs`: 맞는 세부 항목이 없어 `POL-15 : 배포·실행 환경`(2단계).
- `popup-frameWork/Popup/Services/CrashGuard.cs`: 정책과 무관한 일반 유틸이라 정책 줄 없이 ■ 머리 주석만.
- 가장 가까운 항목으로 연결: 설계 24 → POL-05-01, 설계 11 → POL-02-01, 설계 44 초기 포커스 → POL-02-02, PopupAlert → POL-06-02, 기준 2 → POL-11-01, 기준 3 → POL-09-01/02, 기준 5 → POL-13-01, 기준 6 → POL-15-02, 설계 47-4 → POL-10-02.

## 7. 미실행

- 실제 Windows 실화면·관리자 웹 로그인 화면·원격 개발 DB·폐쇄망 재검증. 이번 점검은 정적 대조와 자동 테스트까지다.
