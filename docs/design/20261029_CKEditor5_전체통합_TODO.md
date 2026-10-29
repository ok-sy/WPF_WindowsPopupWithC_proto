# CKEditor 5 Common·PopupRich 전체 통합 TODO
작성: 2026-10-29 (KST)
상태: 구현 완료(2026-10-29) · `ckeditor5` 49.0.1 + `@ckeditor/ckeditor5-react` 12.0.0 전환 · 폐쇄망 반입·실측 대기

## 목적과 현행 확인
- GitHub main의 CommonCKEditor.tsx 및 PopupRichTextEditor.tsx **둘 다** @cp949/ckeditor5-custom-build를 require로 호출한다. 이전 대화의 Common=ckeditor5 전환 설명은 현재 main 코드에 적용된 상태가 아니다.
- BbsCKEditor는 CommonCKEditor를 감싸는 Wrapper다.
- 목표: 둘 모두 **`ckeditor5` 49.0.1** 단일 패키지의 **동일한 엔진·플러그인 출처**로 전환하고 React 래퍼는 **`@ckeditor/ckeditor5-react` 12.0.0**으로 올린다(목표 버전 재확정, 2026-10-29). Common과 PopupRich UI를 강제 합치지 않는다.
- 목표 버전 재확정 근거(초안 44.3.0 + 래퍼 5.1.0에서 변경):
  - 라이선스: 44.3.0·48.x·49.0.1 모두 GPL-2.0-or-later/상용 이중 라이선스이고 `licenseKey: 'GPL'` 처리 코드가 같다(npm 설치본 허용, CDN 차단, 'Powered by CKEditor' 항상 표시). **47.x LTS 라인은 'GPL' 키를 `blockEditor('lts')`로 막으므로 제외.** GPL 기준으로는 버전 간 차이가 없다.
  - 래퍼: 5.1.0(2022, v34 시대)은 ckeditor5 peer 제한이 없을 뿐 공식 지원 조합이 아니고 구형 Watchdog을 내장한다. 49는 Watchdog을 제거했고 공식 지원 래퍼는 12.0.0(`ckeditor5 >=49`)뿐이다.
  - 지원 기간: 44.3.0(2025-03)은 후속 패치가 없고 49.0.1(2026-10-27)이 현재 지원 라인이다.
  - 49 변경점 중 영향: 기본 테마 갱신(툴바·콘텐츠 모양 변경, legacy 프리셋 미적용), Watchdog 제거, 포커스 처리 50ms 지연(아래 E 기록).
- 로컬에 수동 수정한 부분이 있을 수 있으므로 작업 시작 전 로컬 diff와 main을 대조한다.

## A. 의존성 및 현행 기능 조사
- [x] package.json/lockfile, pnpm list ckeditor5 @ckeditor/ckeditor5-react --depth 0, pnpm why @ckeditor/ckeditor5-core 확인
- [x] 전체 import/require 및 CSS 로드 위치, 번들 중복 경로, Common/Bbs/PopupRich 호출 화면 확인
- [x] 커스텀 빌드의 실제 builtinPlugins·toolbar·언어·스타일 전수 조사(아래 A-3)
- [x] ckeditor-duplicated-modules, toolbarview-item-unavailable, 타이핑 불가를 재현하고 각각 원인 기록(A-2·A-3)

### A단계 설치본·lockfile 조사 결과 (제공된 조사 기록, 2026-10-29)
- 커스텀 빌드 `@cp949/ckeditor5-custom-build@0.0.15` 내부 CKEditor 버전 **34.1.0** (번들의 버전 문자열 확인).
- `@ckeditor/ckeditor5-react@5.1.0`: 해당 설치본의 peer 범위는 React 16~18. 신규 단일 `ckeditor5` 패키지와 연동할 래퍼 호환성 점검 필요.
- `@types/ckeditor__ckeditor5-core@33.0.3` devDependency에 의해 개별 `@ckeditor/ckeditor5-*` 48.4.0 패키지가 설치된 것으로 조사됨. **설치 존재와 실제 번들 포함 여부를 구별**한다.
- 커스텀 빌드 내부 `CKEDITOR_VERSION` 중복 검사 코드 확인. 현행 main의 에디터 생성 경로는 커스텀 빌드 34.1.0을 사용하며, 개별 48.4.0 모듈을 함께 실행 경로에 불러오면 중복 모듈 오류 발생 가능.
- [x] A-1. 설치본의 위 버전·의존 관계 조사 기록 확보(실행 재현·기타 import 경로 조사까지 완료한 것은 아님).
- [x] A-2. 실제 pnpm tree·브라우저 번들/로드 순서를 대조하여 중복 오류 재현 및 검증.

### A-2 조사·재현 결과 (2026-10-29)
- 의존 트리: 로컬 pnpm 7.29는 lockfile 9.0을 읽지 못해(`pnpm why` 실패) `pnpm-lock.yaml`을 직접 분석. `main` 직접 의존은 `@ckeditor/ckeditor5-react` 5.1.0, `@cp949/ckeditor5-custom-build` 0.0.15, devDependency `@types/ckeditor__ckeditor5-core` 33.0.3 세 개뿐이고 `ckeditor5` 단일 패키지는 없다. 개별 48.4.0 패키지 49개는 모두 `@types/ckeditor__ckeditor5-core` → `@types/ckeditor__ckeditor5-*`(37.x 스텁) → 실제 `@ckeditor/ckeditor5-*` 48.4.0 경로로 설치된다. `sub/*`에는 CKEditor 의존이 없다.
- 소스 import: CKEditor를 불러오는 곳은 `CommonCKEditor.tsx`(8·40행)와 `PopupRichTextEditor.tsx`(9·83행) 두 파일뿐이고, 둘 다 `@ckeditor/ckeditor5-react` + `require('@cp949/ckeditor5-custom-build')`. 개별 `@ckeditor/ckeditor5-*`·`ckeditor5` import(타입 포함)는 없다.
- 운영 빌드(`next build`, 성공) 번들: 중복 검사 코드가 든 청크는 `9d88bdce.*.js` **1개**(`CKEDITOR_VERSION="34.1.0"`). Common·PopupRich의 래퍼 청크(`7767.*.js`)와 엔진 청크를 PdsEdit·CmpGuide·RgstPop·IS063M02Sample·PopupListSample 화면이 공유한다. 48.4.0은 번들에 포함되지 않음 → **현행 main은 한 벌만 실행되므로 중복 오류가 나지 않는 구조**.
- React 래퍼 5.1.0 번들: 구형 Watchdog 코드만 내장하고 `CKEDITOR_VERSION`은 읽기만 한다(34 미만 경고). 설정·중복 검사를 하지 않아 중복 사본의 원인이 되지 않는다. 의존은 `react`·`prop-types`뿐.
- 브라우저 재현(Edge headless, 커스텀 빌드 실물 + `@ckeditor/ckeditor5-utils` 48.4.0 실물, 같은 탭 = Next.js 클라이언트 라우팅 유지 상황):

| 시나리오 | 결과 |
|---|---|
| 커스텀 빌드 1회 로드 후 에디터 2개 생성(Common·PopupRich가 같은 번들 공유) | 정상. 두 에디터 생성·입력 OK, `isReadOnly=false` |
| 커스텀 빌드 화면 → 개별 48.4.0 모듈 화면 | 두 번째에서 `ckeditor-duplicated-modules` |
| 개별 48.4.0 모듈 화면 → 커스텀 빌드 화면 | 두 번째에서 `ckeditor-duplicated-modules` |
| 같은 커스텀 빌드가 별도 번들로 두 번 평가(복사본이 다른 경로·패키지로 해석되는 경우) | 두 번째에서 `ckeditor-duplicated-modules` |

- 결론: 오류 조건은 "한 탭에서 CKEditor 엔진 사본이 두 번 평가"되는 것이며 순서·화면 분리와 무관하다. 컴포넌트 파일 복사 자체는 같은 패키지로 해석되면 문제없고, 복사본(또는 공통 에디터)이 다른 엔진 출처(개별 패키지, `ckeditor5` 44.3.0, 다른 빌드)를 쓰면 화면을 오가는 순간 발생한다. 목표 44.3.0 전환 시 Common·PopupRich 중 하나라도 커스텀 빌드에 남으면 같은 오류가 나므로 **두 에디터를 같은 커밋에서 함께 전환**해야 한다.
- 미실행: 개발 서버(HMR) 재평가 재현, 실제 앱 로그인 후 화면 이동 재현, `toolbarview-item-unavailable`·타이핑 불가 재현(목표 44.3.0 미설치), 커스텀 빌드 builtinPlugins 전수 조사(A-3 항목).

### A-3 커스텀 빌드 전수 조사 (2026-10-29)
- `@cp949/ckeditor5-custom-build` 0.0.15는 온라인 빌더 산출물이며 소스맵의 `src/ckeditor.js`로 구성을 확인했다. 에디터는 **DecoupledEditor**(툴바를 직접 붙이는 방식 — Bbs·PopupRich가 툴바 DOM을 옮기는 이유), 한국어 번역 내장, `language: 'ko'`.
- builtinPlugins 53개: Alignment, Autoformat, Base64UploadAdapter, BlockQuote, Bold, Code, CodeBlock, Essentials, FindAndReplace, FontBackgroundColor, FontColor, FontFamily, FontSize, Heading, Highlight, HorizontalLine, Image(Caption·Insert·Resize·Style·Toolbar·Upload), Indent, IndentBlock, Italic, Link, List, ListProperties, MediaEmbed, MediaEmbedToolbar, PageBreak, Paragraph, PasteFromOffice, RemoveFormat, SourceEditing, SpecialCharacters(+Arrows·Currency·Essentials·Latin·Mathematical·Text), Strikethrough, Subscript, Superscript, Table(+CellProperties·Properties·Toolbar), TextTransformation, TodoList, Underline.
- defaultConfig: 툴바 41개 항목(heading … undo·redo), `image.toolbar`(…`linkImage`), `table.contentToolbar`.
- 경고 원인:
  - `toolbarview-item-unavailable`: 이미지 툴바 `linkImage`에 필요한 **LinkImage 플러그인이 빌드에 없음**.
  - `widget-toolbar-no-items`: **MediaEmbedToolbar**가 `mediaEmbed.toolbar` 설정 없이 등록돼 표시할 버튼이 없음.
- 타이핑 불가: 44 이상에서 `licenseKey`가 없으면 에디터가 막히는 것이 알려진 원인이다. 이번 전환은 처음부터 `'GPL'`을 넣어 재현 대상이 아니었고, 실화면에서 두 에디터 `isReadOnly=false`·`contenteditable=true`·입력 정상.

## B. CommonCKEditor 상세 기능 보존
소스: zero-rule-web/main/src/components/CommonCKEditor.tsx
- [ ] Props 유지: editorId?, className?, content?, placeholder?, onEditorReady?(editor), onContentChange(content)
- [ ] @ckeditor/ckeditor5-react를 next/dynamic(ssr:false)로 클라이언트에서 로드
- [ ] 현재 useEffect -> setupEditor -> 커스텀 빌드 require -> prepared 후 렌더 흐름을 새 엔진 초기화 방식으로 안전하게 변경
- [ ] data={content ?? ''}, onChange에서 editor.getData() HTML 전달, onReady editor 인스턴스 전달 유지
- [ ] requestFocusToEditor -> editing.view.focus() 유지
- [ ] placeholder 기본값 '여기에 입력하세요', CommonCKEditor-root/Editor CSS class 유지
- [ ] link.decorators.isExternal: 수동 새 창 열기(target=_blank) 유지
- [ ] 기존 @ts-nocheck 및 any 타입 우회 정리 가능성 검토(회귀 방지 우선)
- [ ] 과거 사용 이력의 글꼴/크기/정렬/형광펜/서식 지우기, 이미지/표/링크/목록/코드 블록/SourceEditing 등은 현재 커스텀 빌드·실제 호출 화면 제공 여부 조사 후 누락 없이 이전
- [ ] 과거 SourceEditing의 Markdown vs HTML 표시 문제 재검토. Markdown 플러그인과 소스 출력 조합 검증

## C. BbsCKEditor 기능 보존
소스: zero-rule-web/main/src/components/BbsCKEditor.tsx
- [ ] Common을 재사용하는 현재 구조와 content/onContentChange/onEditorReady/className/sx Props 유지
- [ ] onReady에 editorRef 저장, 외부 콜백 호출, addToolbar로 toolbar DOM을 .BbsCKEditor-toolbar로 이동하는 동작 유지
- [ ] useMeasure로 wrapperHeight를 측정해 editor.editing.view root height를 변경하는 동작 유지
- [ ] requestFocusToEditor, CSS 레이아웃, 툴바/스크롤/리마운트 동작 검증

## D. PopupRichTextEditor 기능 보존
소스: features/PopupcommonComponent/PopupRichTextEditor.tsx, PopupRichTextMenu.tsx, popupRichText.ts, popupRichTextFormat.ts
- [ ] label, initialBlocks, disabled, compact, placeholder, onChange(blocks,plainText) 인터페이스 유지
- [ ] richEditorConfig: 툴바, 색 팔레트, 폰트, 크기, 정렬, 40px 들여쓰기 유지
- [ ] `toolbarview-item-unavailable`의 툴바 ID마다 대응 플러그인/명령 등록 여부를 하나씩 대조하고 미등록 항목을 수정
- [ ] HTML ↔ RichBlock[]/textBlocks 변환, 일반 문자열 반환, 빈 문단·줄바꿈·Run 서식 보존
- [ ] 우클릭/Shift+F10/서식 버튼/키보드 메뉴, 혼합 서식·선택영역·포커스 복귀 유지
- [ ] 편집기 툴바 외부 이동, compact 툴바 숨김, disabled readOnly, 최초 initialBlocks·리마운트 유지

## E. 통합 구현
- [x] ckeditor5 기반 공통 엔진/플러그인 import 정책과 화면별 config 구분 설계
- [x] 목표 조합 호환성 검증 → 래퍼 버전 재결정: 49.0.1 + `@ckeditor/ckeditor5-react` 12.0.0(공식 지원 조합, 49에서 Watchdog 제거). `create`·`destroy`·읽기 전용 잠금·`onReady`/`onChange`·재마운트 실화면 확인
- [x] 44 이상은 `licenseKey`가 필수(없으면 오류·읽기 전용). 무료 사용이면 `licenseKey: 'GPL'` 적용 여부를 확인하고 두 에디터의 config에 일관되게 반영. 타이핑 불가 시 읽기 전용 상태·콘솔 라이선스 오류를 우선 진단
- [x] `ckeditor5/ckeditor5.css`를 전역에서 한 번 로드하도록 Next.js 설정 위치(`_app` 또는 현행 앱 구조의 전역 스타일 진입점) 확인; 중복/누락 방지 → `_app` 전역 대신 공통 엔진 모듈에서 import(Next는 node_modules CSS를 어디서든 import 허용). 엔진과 같은 청크로 에디터 화면에서 한 번만 로드
- [x] 입력·실행 필수 플러그인 Essentials, Typing, Paragraph 및 화면별 서식 플러그인 연결 확인
- [x] PopupRich의 커스텀 require 제거, config/툴바 플러그인·명령 유효성 확인
- [x] Common의 커스텀 require 제거 및 기존 HTML·링크·이벤트 기능 유지
- [x] Bbs와 모든 화면 호출부의 호환성 확인
- [x] Next.js SSR/client-only·CSS·다중 에디터·동적 로딩·언마운트 문제 해결
- [x] 다른 참조처가 없음을 확인한 뒤 구형 커스텀 빌드 의존성과 `@types/ckeditor__ckeditor5-core` 제거, lockfile 갱신. `ckeditor5` 자체 타입 선언 사용, 전이 설치된 48.4.0 개별 패키지의 정리 여부 재확인

## F. 검증 및 완료 조건
- [ ] 두 에디터 모두 한글 IME/영문 입력, 붙여넣기, Backspace/Delete, Undo/Redo 정상
- [ ] Common: HTML 입출력, 플러그인별 실제 사용 기능, 링크 옵션 및 콜백 정상
- [ ] Bbs: 툴바 분리/높이 동기화/게시판 화면 정상
- [ ] PopupRich: 모든 서식, 우클릭·선택 상태, JSON 왕복, 미리보기·WPF 계약 정합
- [ ] CKEditor 중복 모듈 오류와 toolbarview-item-unavailable 경고 모두 미발생
- [ ] 단독·동시 사용, 라우트 이동·리마운트, pnpm build/typecheck와 브라우저 실화면 검증
- [ ] 같은 세션에서 **팝업 등록 → 게시판**, **게시판 → 팝업 등록** 양방향 이동을 각각 검증(클라이언트 전환 시 Next.js 런타임 유지·모듈 재사용 여부 포함)
- [ ] 타이핑 불가 시 `isReadOnly`, `contenteditable`, `licenseKey` 오류, `Typing`/필수 플러그인·명령 로딩 상태를 순서대로 점검
- [ ] 결과를 CHANGELOG에 기록. 미실행 검증은 완료 표시 금지

## 구현 기록 (2026-10-29)

### 패키지
- 추가: `ckeditor5` ^49.0.1, `@ckeditor/ckeditor5-react` ^12.0.0(5.1.0에서 교체). 제거: `@cp949/ckeditor5-custom-build`, devDependency `@types/ckeditor__ckeditor5-core`(→ 전이 설치되던 개별 48.4.0 패키지도 정리, `ckeditor5` 자체 타입 사용). pnpm 9.15.2(packageManager)로 lockfile 갱신.

### 공통 엔진 `src/components/ckeditor/`
- `ckeditorEngine.ts`: `ckeditor5`에서 DecoupledEditor·플러그인·`ckeditor5/ckeditor5.css`·한국어 번역을 한 번만 불러오는 유일한 지점. 공통 config(`licenseKey: 'GPL'`, `language: 'ko'`, `translations`)와 화면별 config 두 개:
  - `commonEditorConfig`: 커스텀 빌드 builtinPlugins·툴바·이미지/표 설정을 그대로 옮기고 **LinkImage 추가, MediaEmbedToolbar 제외**(A-3 경고 원인 제거). 특수문자는 Essentials 묶음 하나로 같은 범위. 툴바 `imageInsert`는 현행 이름 `insertImage`.
  - `popupRichEditorConfig`: 서식 본문 계약에 필요한 플러그인만(Essentials, Paragraph, PasteFromOffice, Bold, Italic, Underline, Strikethrough, FontColor, FontSize, FontFamily, Alignment, Indent, IndentBlock). 이전에는 커스텀 빌드 전체 플러그인이 붙어 있어 표·목록·이미지 등 저장 시 버려지는 서식도 만들 수 있었다.
- `index.ts`: `CKEditor`(래퍼, `next/dynamic` ssr:false)와 `loadCkeditorEngine()`(dynamic import). 엔진 모듈은 컴포넌트에서 정적 import하지 않아 SSR에서 제외되고 에디터가 있는 화면에서만 엔진 청크·CSS를 받는다.

### 컴포넌트
- `CommonCKEditor`: `require` 제거, 엔진 로드 후 렌더. Props·placeholder 기본값·링크 decorator·`onReady`/`onChange`·`requestFocusToEditor` 유지. `@ts-nocheck` 제거. `CommonCKEditor-editor`·전달 className은 이전 래퍼가 무시하던 값이라 실제로 붙지 않았다 → 뷰 루트에 `writer.addClass`로 붙임(DOM classList는 CKEditor 재렌더링 때 지워짐).
- `BbsCKEditor`: 변경 없음(툴바 DOM 이동·높이 동기화 그대로 동작 확인).
- `PopupRichTextEditor`: `require` 제거, `popupRichEditorConfig` + 기존 `richEditorConfig` 병합. `@ts-nocheck` 제거(`richEditorConfig.alignment.options` 타입만 좁힘). **서식 패널 닫기 시 선택 복원 추가**: 49의 FocusObserver는 포커스 반영을 50ms 미루고, `editing.view.focus()` 때 보류된 브라우저 선택(커서)으로 모델 선택을 덮어써 Esc로 패널을 닫으면 선택 범위가 풀렸다. 닫기 전 모델 선택을 보관했다가 포커스 후 되돌린다.

### 검증 하네스(scripts)
- 에디터를 띄우는 5개(`verify-rich-text-49`·`verify-survey-rich-text-55`·`verify-popup-transform-64`·`verify-rgstpop-quiz-rule`·`verify-popup-common-sample-69`): `@/components/ckeditor` 별칭, CSS 규칙(`scripts/verify-css-loader.cjs`, style 태그 주입), `Emulation.setFocusEmulationEnabled`(49는 문서 포커스가 없으면 편집 영역을 포커스 상태로 보지 않아 headless에서 선택이 그려지지 않음), Edge 기본 확장 프로그램(`chrome-extension://`) 콘텐츠 스크립트 오류 제외.
- `verify-rich-text-49`의 우클릭 위치를 선택한 글자 위로 변경: 49는 브라우저처럼 선택 밖 우클릭 시 커서를 그 위치로 옮긴다(실사용은 선택한 글자 위에서 우클릭).

### 검증 결과
- `tsc` 0, 변경 파일 eslint 오류 0, `next build`(webpack) 성공 — CKEditor 엔진 청크 1개(`CKEDITOR_VERSION="49.0.1"`), 34.1.0 없음.
- 하네스: rich-text-49 60건, survey-rich-text-55 23건, popup-transform-64 77건, rgstpop-quiz-rule 11건, popup-common-sample-69 32건, completion-ux-43 71건 통과.
- 로컬 관리자 웹(로컬 서버 + 원격 개발 DB, Turbopack 개발 서버) Edge headless, master 로그인:
  - 자료실 등록(Bbs/Common): 툴바가 `.BbsCKEditor-toolbar`로 이동(41개 항목), 편집 영역 높이 938px = 래퍼 940px, 한국어 UI(굵게·링크…), placeholder '여기에 입력하세요', LinkImage·SourceEditing·Table·ImageInsert·TodoList 로드, 입력·Ctrl+B 굵게·Ctrl+Z 실행 취소·표 삽입, 'Powered by' 표시.
  - 같은 탭에서 팝업 등록 → 신규 등록(PopupRich, 최소 플러그인·툴바 15개): 입력·미리보기 반영, 선택 → '서식' 버튼 → 굵게 → Esc 후 선택 유지·`<strong>` 반영.
  - 다른 화면을 거쳐 자료실 재마운트 후 입력 정상. 전 과정 `ckeditor-duplicated-modules`·라이선스 오류·`toolbarview-item-unavailable`·`widget-toolbar-no-items`·예외 0건.
- 미실행: 한글 IME 조합 입력(CDP `insertText`로만 확인), 붙여넣기·SourceEditing·이미지 업로드 실조작, 게시판 화면 저장 왕복, 폐쇄망 반입본 설치·실측, WPF 화면 대조(서식 JSON 계약은 변경 없음).

## 권장 순서
실설치/기존 기능 조사 → 공통 엔진 설계 → PopupRich 전환 및 타이핑 해결 → Common 전환 → Bbs 회귀 → 패키지 정리 → 전체 검증.

## 로컬 검증 결과 (2026-10-30)
- 한글 IME 조합 입력·붙여넣기: 로컬 관리자 웹에서 개발자 수동 확인 성공.
- SourceEditing(게시판·자료실 BbsCKEditor): 소스 버튼을 눌러도 화면이 바뀌지 않던 문제 확인. CKEditor 49 SourceEditing은 외부 DOM 요소에 붙은 편집 영역(`editable.hasExternalElement`, React 래퍼 + DecoupledEditor)을 직접 바꾸지 않으므로 `CommonCKEditor`에서 소스 모드 전환을 처리하도록 수정. `scripts/verify-bbs-ckeditor-source.cjs` 5건 통과.
- 이미지(Base64UploadAdapter) 포함 저장 왕복: 저장은 성공하나 다시 열기(`/api/pds/info/{pdsId}`)·삭제가 500(`@PathVariable` 이름 미지정, `-parameters` 미적용)이라 실패로 보였음. 이름 명시로 수정 후 80KB·3MB 본문 저장→열기→삭제 API 왕복 확인.
- 폐쇄망 반입본 설치·첫 컴파일 실측·폐쇄망 브라우저 확인: 미실행(폐쇄망에서 수행).
