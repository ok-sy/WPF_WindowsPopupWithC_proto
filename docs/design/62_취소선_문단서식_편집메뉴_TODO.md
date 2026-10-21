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
- [ ] Windows에서 WPF 빌드 및 `dotnet run --project scripts/RichTextTests` 실행. 신규 취소선 회귀 검사 10건은 작성했으나 Linux 환경에 .NET SDK/Windows WPF가 없어 미실행.
- [ ] 서버 전체 Gradle/JUnit 실행. `PopupRichTextTest` 2건 추가. 시도한 Gradle Wrapper 다운로드가 네트워크 오류로 막혀 해당 JUnit과 전체 서비스 검증은 미실행.
- [ ] 실제 관리자 편집 Dialog에서 한글 IME·마우스 선택 확인 및 저장 → 재조회 → WPF 왕복. 독립 편집기 하네스 결과를 실제 저장/DB 검증으로 간주하지 않는다.
- [ ] Word·Excel·PDF 배포 산출물 재생성. 이번 반영은 Markdown 계약과 예제이며 기존 바이너리 문서를 최신화한 것으로 표시하지 않는다.

재현 명령(저장소 루트, 웹 의존성 설치 및 Chromium 필요):

```sh
node scripts/verify-rich-text-49.cjs
# 다른 Chromium 환경: BROWSER_PATH=/absolute/path/to/chromium node scripts/verify-rich-text-49.cjs
# JDK17 이상: DB 없이 실제 서버 검증 클래스 실행
javac -encoding UTF-8 -d .offline-verify/rich62-server zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupRichText.java scripts/RichText62ServerTest.java
java -cp .offline-verify/rich62-server server.service.core.popup.RichText62ServerTest
```
