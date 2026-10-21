# TODO63 — 문단 들여쓰기 5회 제한 해제

- 상태: 구현 완료 / 실제 관리자 저장→재조회→WPF 실화면 왕복 검증 대기
- 작성일: 2026-10-21 (KST)
- 관련: TODO49·TODO62 공용 RichText 문단 서식

## 확정 요건

문단 들여쓰기의 최대 5단계 제한을 제거한다. 1단계 40px와 JSON의 `indent` 단계 표현은 유지한다. CKEditor 툴바와 우클릭 메뉴 모두 같은 동작을 제공한다. 내어쓰기는 0단계에서 멈추며, 글자 서식 초기화 시 문단 들여쓰기·정렬을 보존한다.

적용 대상은 공용 RichText를 사용하는 TEXT 및 SURVEY·QUIZ 문항·선택지 등이다. 글로벌 CSS 변경은 포함하지 않는다.

## 구현 TODO

- [x] 63-1. `popupRichTextFormat.ts`: `limitIndent`의 최대 단계 clamp와 `indentBlock` 명령 비활성화 조건 제거. 40px 단위 정규화, 잘못된 값 처리, 문단 서식 초기화 제외 로직은 보존. 함수명·주석을 새 역할에 맞게 정리하고 호출부 갱신.
- [x] 63-2. `popupRichText.ts`: `RICH_MAX_INDENT`와 HTML→Blocks·Blocks 읽기/검증의 5단계 상한 제거. 0 이상의 정수 계약과 0일 때 키 생략 유지. 숫자 표현 가능 범위·유한값 검증은 유지하여 NaN/Infinity/오버플로를 허용하지 않음.
- [x] 63-3. `PopupRichTextMenu.tsx`: `n / 5` 표기와 최대 단계 안내 제거. 현재 단계 표시는 유지 가능. 5단계에서도 들여쓰기 활성, 0단계에서 내어쓰기 비활성. 혼합 문단 선택·정렬·취소선 등 기존 기능 유지.
- [x] 63-4. 서버 `PopupRichText.java`: `MAX_INDENT=5` 검증과 오류 문구 갱신. 공용 검증을 사용하는 설문·퀴즈 경로까지 6단계 이상 저장·조회 지원. 정수 변환 전 소수·음수·범위 초과 검증 확인.
- [x] 63-5. WPF `DemoOptionsWindow.cs`: `ServerRichMaxIndent=5` 및 입력 검증·도움말 갱신. `PopupRichText.cs`의 별도 `MaxIndent=400`/`SafeIndent` 검토 및 수정. 11단계 이상에서 여백이 갑자기 0으로 돌아오는 현상을 없애고, 콘텐츠 폭을 넘는 경우 기존 컨테이너의 줄바꿈·클리핑·스크롤 동작을 확인. 임의의 새 횟수 제한으로 대체하지 않음.
- [x] 63-6. 웹 미리보기·WPF 렌더러·DTO·변환 경로에 남은 상한 및 문구를 검색해 정합성 보완. 과도한 여백에서도 예외 없이 처리하도록 숫자 및 레이아웃 안전성 검토.
- [x] 63-7. 인터페이스 명세, ALL/MINIMAL 검토, 옵션 가이드와 예제의 `0~5`/최대 200px 설명 갱신. 최소 공개 범위는 임의 확장하지 않음. TODO49·62의 과거 구현 기록은 유지하고 변경 요건을 TODO63으로 연결.

## 검증 기준

- [x] 툴바·우클릭 각각 5→6→7단계 적용, 6단계=240px 확인.
- [x] 10→11단계(440px)에서 저장·조회·WPF 표시 중 0단계 복귀나 5단계 clamp가 없음.
- [ ] 작성→JSON 변환→서버 저장→재조회→에디터 재편집→웹 미리보기/WPF에서 동일 단계 유지.
- [x] 여러 문단의 혼합 들여쓰기, 내어쓰기 0 하한, 실행 취소/재실행, 붙여넣기, 서식 초기화 회귀 확인.
- [x] 누락/0/음수/소수/문자열/비유한값/숫자 범위 초과 처리와 좁은 팝업에서의 레이아웃 확인.
- [x] 기존 최대 5단계 관련 테스트 기대값을 새 계약으로 변경하고 6단계·11단계 사례 추가.

## 구현 기록 (2026-10-21)

| 항목 | 반영 |
|---|---|
| 63-1 편집기 | `limitIndent` → `normalizeIndent`로 이름 변경. 최대 단계 clamp와 `indentBlock` 비활성화 핸들러 제거. 40px 배수 정규화·px 외 단위 제거·숫자 범위 초과 제거, `blockIndent`·`alignment` 서식 초기화 제외는 유지. 내어쓰기 0 하한은 CKEditor 기본 동작 |
| 63-2 변환 | `RICH_MAX_INDENT` 제거, `RICH_INDENT_LIMIT = 2147483647`(횟수 제한이 아니라 서버 Java int 표현 범위). `isIndentLevel`은 0 이상 정수·범위 이하, `indentFromCss`는 clamp 대신 범위 밖이면 0. 0이면 키 생략 유지 |
| 63-3 우클릭 | `n / 5` 표기를 `n단계`로 변경. 들여쓰기 버튼은 CKEditor `indent` 명령 상태를 따르므로 5단계 이후에도 활성 |
| 63-4 서버 | `MAX_INDENT` 제거. int로 손실 없이 바뀌는 0 이상 정수만 허용(소수·음수·NaN·Infinity·int 범위 초과·BigInteger 거부). 오류 문구 `0 이상의 정수`. 설문·퀴즈는 같은 공용 검증을 사용 |
| 63-5 WPF | Demo `ServerRichMaxIndent` 제거·검증/도움말 갱신. `PopupRichText.MaxIndent=400` 제거 — `SafeIndent`는 0 이상 정수·int 이하면 단계 × 40, 그 밖만 0. 여백이 본문 폭보다 크면 TextBlock이 남은 폭에서 줄바꿈하고 높이가 늘어나 기존 본문 세로 스크롤로 표시(예외 없음) |
| 63-6 정합성 | 웹 미리보기(`PopupRichBlocks`·`PopupPreview`)는 `readTextBlocks` 결과의 단계 × 40px만 쓰므로 변경 없음. WPF DTO(`double Indent`) 변경 없음. 남은 상한 검색 결과 없음 |
| 63-7 문서 | 인터페이스 명세(변경 기록·§8.1 표·표시 방어·§8.4.1), ALL 명세, 옵션 가이드 2종 갱신. MINIMAL은 들여쓰기 항목이 없어 변경 없음(최소 제공 범위 확장 없음). TODO49·62 기록은 유지 |

## 검증 결과

- 웹: `tsc --noEmit` 오류 0, 변경 파일 eslint 오류 0(기존 경고 2). `verify-rich-text-49` 59건 통과 — 툴바 7단계(280px)·11단계(440px), 우클릭 6단계(240px)·버튼 활성·`6단계` 표기, 10→11 내어쓰기/서식 초기화/실행 취소, 붙여넣기 300px→8단계·과대 값 제거, 미리보기 11단계 440px, 다중 문단 혼합·undo/redo. `verify-survey-rich-text-55` 23건 통과.
- 서버: `PopupRichTextTest`(6·7·11·100·int 최대 허용, 음수·소수·NaN·Infinity·int 초과·BigInteger 거부)·`PopupSurveyRichTextTest`(문항 제목 6단계·선택지 11단계 유지, 음수 거부) 포함 `gradlew test --offline` 152건 중 143 통과·9 skip(Oracle 연동), 실패 0.
- WPF: `scripts/RichTextTests` 113건 통과 — 6·10·11단계 240·400·440 DIP, 범위 밖 0, 20단계(800 DIP) 여백이 560 폭에서 예외 없이 측정, Demo 11단계 허용·`2147483648` 거부.
- 실DB(2026-10-21): 로컬 XE 롤백 전용 `PopupQuestionDatabaseTest.deepIndentAndMultipleChoiceAnswerCountRoundTrip` — TEXT 본문 6·11단계와 문항 제목 7단계가 서버 저장→재조회 후 그대로 유지, plainText 파생 확인(기존 2건 포함 3건 통과).
- 미실행: 실제 관리자 웹 화면 저장→에디터 재편집→WPF 실화면 왕복(관리자 웹 전체 서버는 PostgreSQL 전용 프레임워크라 로컬 Oracle로 기동 불가), 한글 IME, 좁은 팝업 실화면 캡처, 인터페이스 Excel·Word·PDF 재생성(2026-10-21 반영 완료, CHANGELOG 2026-10-21-07).
