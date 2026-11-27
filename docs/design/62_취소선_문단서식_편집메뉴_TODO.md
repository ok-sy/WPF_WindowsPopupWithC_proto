# 62. 취소선과 문단 서식 편집 메뉴 TODO

기준일: 2026-10-21 (KST).

상태: **코드 구현 완료 · Windows 및 통합 검증 대기**.
Trello: https://trello.com/c/jY0lUMQh

## 확정 범위

- CKEditor 툴바와 우클릭 공용 패널에 취소선을 제공한다. 기존 글꼴·크기·색·굵게·기울임·밑줄 기능을 유지한다.
- 우클릭 패널에 문단 내어쓰기·들여쓰기와 왼쪽·가운데·오른쪽 정렬을 제공한다. CKEditor 툴바에도 같은 기능을 유지한다.
- 문단 들여쓰기는 기존 TODO49 계약 그대로 `p`의 `margin-left: 40px`씩 누적하며 최대 5단계다. JSON은 문단의 `indent` 단계로 저장한다. `margin: 40px`이나 첫 줄 들여쓰기로 바꾸지 않는다.
- 글자 서식 줄(B/I/U/취소선), 문단 서식 줄(내어쓰기/들여쓰기/정렬), 하단 별도 서식 초기화 순서로 배치한다. 초기화는 글자 서식(취소선 포함)만 지우고 문단 정렬·들여쓰기는 유지한다.
- 공용 편집기를 쓰는 TEXT 및 SURVEY·QUIZ 콘텐츠/문항/선택지에 동일하게 적용한다. 글로벌 CSS는 변경하지 않는다.

## 계약과 동작

취소선은 `runs[].strikethrough?: boolean`이다. 생략·false는 취소선 없음이며 기존 저장 데이터에 변환 작업을 요구하지 않는다. HTML 입출력은 `s`를 기준으로 하고 붙여넣기의 `del`·`strike`도 취소선으로 읽는다. 밑줄과 취소선을 동시에 표시할 수 있어야 한다. plainText에는 서식용 기호를 추가하지 않는다.

글자 서식은 선택 구간에, 선택이 없으면 다음 입력에 적용한다. 문단 서식은 커서가 있는 문단 또는 선택 범위에 걸친 모든 문단에 적용한다. 혼합 상태·명령 활성화·최대/최소 들여쓰기 상태를 표시하고, 메뉴 조작 동안 선택 범위를 보존한다. 기존 빌드에 포함된 CKEditor 명령을 재사용하며 별도 버전의 플러그인을 import하지 않는다.

## TODO

- [x] **62-1 계약·변환**: Run 타입과 HTML↔Blocks·저장값 읽기·인접 Run 합치기에 취소선을 연결한다. 이스케이프·줄바꿈·plainText 및 기존 데이터 호환을 유지한다.
- [x] **62-2 편집기·우클릭**: 빌드의 취소선 명령 지원을 확인하고 툴바·패널에 연결한다. 문단 정렬·내어쓰기·들여쓰기의 선택 상태와 비활성 상태를 반영한다. 서식 초기화를 하단으로 이동한다.
- [x] **62-3 서버·미리보기**: 서버 공용 RichText 검증에 boolean 필드를 추가하고 TEXT와 설문·퀴즈 경로에서 보존한다. 두 미리보기 렌더러에서 밑줄·취소선을 함께 표시한다. DB DDL은 변경하지 않는다.
- [x] **62-4 WPF·Demo**: DTO·관용 변환기·Run 표시·Demo 입력 검증에 취소선을 연결한다. 밑줄과 취소선의 동시 적용 및 잘못된 타입의 기본값 처리를 확인한다.
- [ ] **62-5 검증·문서**: 실제 편집기에서 선택/커서·여러 문단·혼합 상태·초기화·undo/redo·저장값 재편집·미리보기를 확인한다. 서버 검증 및 WPF 회귀 검사를 보완하고 실행 환경·미실행 항목을 구분한다. 전체 명세·계약·예제·가이드를 갱신하고 최소 제공 범위는 임의 확장하지 않는다.

## 관련 파일

- 웹: `PopupRichTextMenu.tsx`, `PopupRichTextEditor.tsx`, `popupRichTextFormat.ts`, `popupRichText.ts`, `PopupRichBlocks.tsx`, `PopupPreview.tsx`
- 서버: `PopupRichText.java`(TEXT·SURVEY·QUIZ 공통 검증), 관련 테스트
- WPF: `PopupTextBlockDto.cs`, `PopupRichText.cs`, `DemoOptionsWindow.cs`, `scripts/RichTextTests`
- 선행 과제: TODO28·49·55. 기존 구현을 대체하지 않고 같은 계약과 공용 경로를 확장한다.

## 구현·검증 기록 (2026-10-21)

- 취소선은 현재 `@cp949/ckeditor5-custom-build@0.0.15`에 이미 포함된 `strikethrough` 명령을 사용한다. 패키지나 플러그인 import 추가 없음.
- `readFormatState`는 문단 속성을 선택된 블록에서 읽고, 패널은 혼합 상태 및 CKEditor 명령 활성화 상태를 표시한다. 0단계 내어쓰기·5단계 들여쓰기는 비활성화된다.
- CKEditor의 기본 Alignment 속성이 `isFormatting=true`여서 서식 초기화가 정렬까지 지우는 기존 동작을 확인했다. 팝업 편집기 인스턴스에서 정렬을 초기화 대상에서 제외해 요구한 글자 서식 초기화 의미로 맞췄다. 기존 들여쓰기 초기화 제외도 유지한다.
- 서버 공용 검증과 WPF·Demo의 입력/표시를 확장했다. 서버의 기존 JSON 저장 경로를 사용하므로 DDL 변경 없음. WPF는 밑줄+취소선 조합 때 공유 컬렉션을 수정하지 않고 복제 후 합친다.

### 실행한 검증

| 검증 | 결과·환경 |
|---|---|
| `scripts/verify-rich-text-49.cjs` | **59건 통과**(기존 40 + TODO62 신규 19). 실제 CKEditor 빌드·MUI 패널·TEXT 및 공용 SURVEY/QUIZ 미리보기, Linux Chromium 153. `BROWSER_PATH`로 다른 Chromium 실행 파일을 지정할 수 있게 하며 기본 Windows Edge 실행 경로는 유지 |
| 변경 공용 TS/TSX strict 타입 검사 | `popupRichText.ts`, `popupRichTextFormat.ts`, `PopupRichTextMenu.tsx`, `PopupRichBlocks.tsx` 4파일 오류 0. 전체 웹 프로젝트 타입 검사·배포 빌드는 미실행 |
| `scripts/RichText62ServerTest.java` | **12건 통과**. Java17 JRE + ECJ 3.38로 실제 `PopupRichText.java`를 컴파일하여 실행. true/false/null·누락 호환·일반 문자열·허용하지 않는 타입 거부, DB 미사용 |
| 변경 검사 | `git diff --check` 통과. 글로벌 CSS 및 의존성 파일 변경 없음 |

브라우저 캡처에서 툴바·패널 행 배치와 화면 경계 보정을 확인했다. 이 환경은 한글 글꼴이 없어 실제 한글 글꼴의 표시 품질은 확인하지 않았다.

### 남은 검증·산출물 (62-5)

- [x] 웹 동작·서버 공용 검증 및 Markdown 인터페이스 계약·ALL/MINIMAL·옵션 가이드 반영. 최소 제공 범위는 그대로 유지.
- [x] Windows에서 WPF 빌드 및 `dotnet run --project scripts/RichTextTests` 실행. 신규 취소선 회귀 검사 10건은 작성했으나 Linux 환경에 .NET SDK/Windows WPF가 없어 미실행. — 2026-11-03 대조: dotnet run --project scripts/RichTextTests 113건 통과(2026-11-03)
- [x] 서버 전체 Gradle/JUnit 실행. `PopupRichTextTest` 2건 추가. 시도한 Gradle Wrapper 다운로드가 네트워크 오류로 막혀 해당 JUnit과 전체 서비스 검증은 미실행. — 2026-11-03 대조: 서버 gradlew test 실패 0(2026-10-22 이후 반복)
- [ ] 실제 관리자 편집 Dialog에서 한글 IME·마우스 선택 확인 및 저장 → 재조회 → WPF 왕복. 독립 편집기 하네스 결과를 실제 저장/DB 검증으로 간주하지 않는다.
- [x] Word·Excel·PDF 배포 산출물 재생성. 이번 반영은 Markdown 계약과 예제이며 기존 바이너리 문서를 최신화한 것으로 표시하지 않는다. — 2026-11-03 대조: Word·Excel·PDF 재생성으로 CONFLICTS C10 해소(2026-10-22)

재현 명령(저장소 루트, 웹 의존성 설치 및 Chromium 필요):

```sh
node scripts/verify-rich-text-49.cjs
# 다른 Chromium 환경: BROWSER_PATH=/absolute/path/to/chromium node scripts/verify-rich-text-49.cjs
# JDK17 이상: DB 없이 실제 서버 검증 클래스 실행
javac -encoding UTF-8 -d .offline-verify/rich62-server zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupRichText.java scripts/RichText62ServerTest.java
java -cp .offline-verify/rich62-server server.service.core.popup.RichText62ServerTest
```

## 후속 62-5 — 실제 크기 미리보기·WPF 취소선 재귀검증 (2026-11-27)

**상태: 테스트 설계 확정 / 테스트 구현·실행 및 폐쇄망 실측 대기.** 기존 62-1~4의 구현 완료 상태는 변경하지 않는다. 연계: TODO61-23의 스크롤·해상도 미리보기 검증. 별도 TODO 번호나 API 계약을 만들지 않는다.

### 재현 관찰과 검증 기준

- 폐쇄망 관리자 웹의 **「실제 크기로 보기」** 사진과 WPF **실제 팝업** 사진을 비교한 결과다. 인라인 우측 미리보기 사진은 정밀 비교 기준에서 제외한다.
- 유앤아이New·Modern·Noto 계열은 글꼴 종류 자체가 대체로 일치하는 것으로 관찰됐다. 「기본폰트 12/16/32」는 별도 패밀리명이 아니라 **font 미지정** 조건이다. 정확한 설치 서체·배율·서버 JSON은 미계측이므로 글꼴 교체부터 진행하지 않는다.
- 취소선은 WPF에서도 표시되지만, 웹의 CSS line-through와 WPF TextDecorations.Strikethrough가 실제 문자 잉크 영역 대비 **다른 위치·굵기**로 보인다. 사진만으로 좌표나 원인을 확정하지 않는다.
- 현행 scripts/RichTextTests/Program.cs의 CheckStrikethrough62()는 Run.TextDecorations.Location·조합만 확인한다. **선의 실제 화면 위치 검증은 없다.** 웹 렌더는 PopupRichBlocks.tsx의 textDecoration, WPF 렌더는 PopupRichText.cs의 CreateRun()이다.

### 구현 시 확인할 사항

- [ ] 웹 PopupRichBlocks.tsx와 WPF PopupRichText.cs/CreateRun(), PopupTextBlockDto.cs/LenientTextBlocksConverter.ReadBlocks()에 **같은 textBlocks** 데이터를 주고 runs[].font/size/bold/italic/underline/strikethrough를 원형 보존한다. 서버 저장→재조회가 개입하면 저장 전후 JSON을 각각 보관한다.
- [x] 브라우저의 DOM Range/ComputedStyle, WPF Run.TextDecorations·FontFamily·RenderTargetBitmap 캡처를 수집한다. 선의 Y 좌표·두께·색을 글자 bounding box 및 잉크 영역에 대한 상대값으로 비교한다.
- [x] (2026-11-28 `scripts/verify-strike-62.cjs` 실측, 유앤아이Modern은 이 PC 미설치라 대체 글꼴 + Noto Sans KR 대체 측정 STR-01N) 테스트 STR-01: 유앤아이Modern 32, 취소선+밑줄. STR-02: Noto Sans 32 기울임+취소선. STR-03: 기본 글꼴 미지정 12/16/32. STR-04: Noto Serif의 밑줄만/취소선만/둘 다. STR-05: 12/16/28/32 × bold/italic × 정렬 LEFT/CENTER/RIGHT. STR-06: strikethrough false/누락/잘못된 타입/빈 문단.
- [ ] 동일한 팝업 크기(DIP/CSS px)·Windows 배율·브라우저 확대율·프리셋·스크롤 위치(0/50/100%)에서 웹 실제 크기 및 WPF 캡처를 각각 생성한다. 사진 파일은 관찰 근거, 자동 캡처와 계측 JSON은 합격 근거로 구분한다.
- [x] 기존 scripts/verify-rich-text-49.cjs, scripts/RichTextTests/Program.cs, scripts/PopupParityCapture/Program.cs를 우선 확장한다. (WPF 캡처는 PopupParityCapture를 그대로 사용, 측정 하네스는 별도 `verify-strike-62.cjs`) 속성 검사만 통과하거나 이미지 전체 픽셀 차이만으로 합격 처리하지 않는다.
- [ ] 원인 구분 순서: 데이터/서식 매핑 → 실제 폰트 선택·메트릭 → 선 위치/두께 → 문단/클리핑. WPF PenOffset 등의 값은 측정 후 최소 범위에서만 검토하고 전역 덮어쓰기·전체 폰트 교체는 선행하지 않는다.
- [ ] 원인 1건만 수정 → 동일 입력으로 수정 전 실패/수정 후 통과 확인 → 모든 STR·SCR·기존 서식 회귀 재실행. 미해결이면 차이·가설·재현 조건을 기록하고 반복한다.
- [ ] 서버·Oracle·API 필드 변경 없이 해결 가능한지 우선 확인한다. 실제 전달 JSON의 strikethrough 필드 유실이 확인될 때만 서버·계약 영향을 별도 보고한다.

### 구현 전에 결정할 사항

| 항목 | 결정이 필요한 이유·선택지 | 추천 및 영향 |
|---|---|---|
| 시각적 합격 기준 | A. 전체 픽셀 완전 동일 B. 동일 Run·폰트 기준 선의 상대 위치/가독성 기준 | **B 추천.** WPF/Chromium 안티앨리어싱 차이를 오류로 오인하지 않고, 측정 가능한 선 위치·두께 기준을 실측 후 확정 |
| 취소선 보정 소유 | A. WPF Run의 Decoration 보정 B. 웹 Preview CSS만 조정 C. 기본값 유지 | **원인 측정 후 선택.** 실제 WPF 표시를 우선 기준으로 삼되 특정 글꼴만 맞추느라 다른 크기·서체를 훼손하지 않는다 |

### 완료·검증 기준

- [ ] 동일 JSON 및 동일 표시 조건으로 STR-01~06의 웹/WPF 서식값·위치·캡처를 재현 가능하게 보관했다.
- [ ] 취소선이 문자 안에서 의도한 위치에 나타나고 밑줄·기울임·정렬·크기·글꼴 미지정 케이스에 회귀가 없다.
- [ ] 최소 수정의 전후 차이와 관련 테스트 결과를 남겼으며, TEXT 외 유형 공유 컴포넌트의 영향도 확인했다.
- [ ] 정적 검토, 웹 검사, Windows/WPF 빌드·캡처, 실제 서버 왕복, 폐쇄망 실화면을 **각각 별도 상태**로 기록했다. 미실행 사항은 완료로 표시하지 않는다.

**2026-11-28 실측 기록(STR-01~06, 수정 전):**
- 도구: `node scripts/verify-strike-62.cjs`. 같은 TEXT 팝업(720×300, 헤더·푸터 숨김, 표본 `가나다 Hxg 123`)을 장식만 다른 변형 G(없음)·S(취소선)·U(밑줄)·C(둘 다)로 웹 미리보기(headless Edge 100%)와 WPF PopupWindow(PopupParityCapture, 96 DPI)에 그려, G와 변형의 차이 행 = 선, G의 어두운 픽셀 상자 = 글자 잉크로 잰다. 결과 [report.md](../reviews/TODO62-5_strike_measure/report.md)와 대표 캡처 4장.
- 구조 검사 199건 통과: 두 플랫폼 모두 취소선 1줄이 잉크 안에 있고 글자 폭을 덮음, 밑줄은 취소선 아래, 둘 다 켜면 두 선이 각자 자리에 그려짐, 정렬 LEFT/CENTER/RIGHT·굵게·기울임 회귀 없음. STR-06(false·누락·잘못된 타입·빈 문단) 웹 장식 없음(WPF는 RichTextTests CheckStrikethrough62).
- **차이(일관됨):** 글자 잉크 높이는 웹·WPF 같음(12→13, 16→17, 32→34~36). 취소선 중심은 **웹이 WPF보다 위** — 12·16px 1px, 28px 2px, 32px 1.5~3.5px(잉크 높이 대비 0.04~0.09). WPF는 잉크 높이의 약 0.47~0.55(한글 가운데), 웹은 0.40~0.48. 두께는 28px 이하 같음, 32px에서 웹 3px / WPF 2px. 글꼴별 차이: 맑은 고딕 Δ 1~2px, Noto Sans KR·Noto Serif KR 2.5px.
- 원인 판단: 글리프·전달값·Run 서식은 같고(잉크 높이·계산 글꼴·textDecorationLine 일치) **선 위치·두께 계산 방식만 다름**(웹 = 브라우저 line-through 규칙, WPF = TextDecorations.Strikethrough의 글꼴 취소선 위치). 브라우저 규칙의 정확한 식은 확인하지 않은 가설이다.
- 함께 보인 별개 차이: 본문 글자 색이 웹 더 진함(취소선과 무관, 이번 범위 밖으로 기록만).
- 미실행: 폐쇄망 유앤아이 글꼴·배율 125%+ 실측, 스크롤 SCR-01~06. 보정 소유(웹/WPF/유지)는 결정 대기.

**2026-11-27 검증 기록:** Git main의 PopupRichBlocks.tsx, PopupRichText.cs, CheckStrikethrough62() 정적 대조 및 제공된 사진 관찰만 실시. 새 테스트 코드·자동 검사·WPF 실행·폐쇄망 실측은 아직 수행하지 않음. Astra 자문 도구는 이 환경에 제공되지 않아 위치·허용오차 기준은 별도 검토 필요.
