# 변경 이력

프로젝트의 수정 내역과 검증 결과를 기록한다. 날짜는 한국 시간(KST)을 사용한다.

## 2026-10-21-04 — TODO63 문단 들여쓰기 5단계 제한 해제

- 이유: 공용 RichText 문단 들여쓰기를 5단계 이후에도 쓸 수 있도록 편집기·변환·서버 검증·WPF 표시 방어의 상한을 제거(TODO63).
- 변경: 웹 — `RICH_MAX_INDENT` 제거, `RICH_INDENT_LIMIT`(서버 int 표현 범위, 횟수 제한 아님) 도입, `limitIndent`를 `normalizeIndent`로 바꾸고 최대 단계 clamp·`indentBlock` 비활성화 제거(40px 정규화·px 외 단위/범위 초과 제거·서식 초기화 시 정렬·들여쓰기 보존 유지), `indentFromCss`·`readTextBlocks`는 범위 밖 값을 0으로 처리, 우클릭 표기 `n / 5` → `n단계`. 서버 — `PopupRichText.MAX_INDENT` 제거, int로 손실 없이 바뀌는 0 이상 정수만 허용, 오류 문구 갱신(설문·퀴즈 공용). WPF — Demo `ServerRichMaxIndent` 제거·검증/도움말 갱신, `PopupRichText.MaxIndent=400` 제거로 11단계 이상이 0으로 돌아가던 표시 방어 수정(0 이상 정수·int 이하 적용). 테스트 기대값을 새 계약으로 바꾸고 6·7·11단계·범위 초과 사례 추가. 인터페이스 명세·ALL·옵션 가이드 2종 갱신, MINIMAL은 해당 항목 없음(최소 제공 범위 확장 없음). DB DDL·의존성 변경 없음.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/popupRichText.ts·popupRichTextFormat.ts·PopupRichTextMenu.tsx·PopupRichTextEditor.tsx, zero-rule-server/service/core/.../PopupRichText.java·PopupRichTextTest.java·PopupSurveyRichTextTest.java, popup-frameWork/Popup/Views/Contents/PopupRichText.cs·DemoOptionsWindow.cs, scripts/verify-rich-text-49.cjs·RichTextTests/Program.cs, docs/design/63_문단들여쓰기_5회제한해제_TODO.md, docs/interfaces/POPUP_INTERFACE_SPEC.md·WPF_POPUP_ALL_SPEC.md, docs/POPUP_OPTION_GUIDE.md·POPUP_USER_OPTION_GUIDE.md, version-history/CHANGELOG.md.
- 검증: 웹 tsc 오류 0, 변경 파일 eslint 오류 0(기존 경고 2). verify-rich-text-49 59건(툴바 7·11단계, 우클릭 6단계 240px·버튼 활성, 10→11단계 왕복·서식 초기화·실행 취소, 붙여넣기 정규화, 미리보기 440px, 다중 문단 undo/redo)·verify-survey-rich-text-55 23건 통과. 서버 `gradlew test --offline` 152건 중 143 통과·9 skip(Oracle 연동)·실패 0. WPF RichTextTests 113건 통과(11단계 440 DIP, 20단계 여백 예외 없음, Demo 11단계 허용·int 초과 거부). 미실행: 실제 관리자 저장→재조회→WPF 실화면 왕복, 한글 IME, 좁은 팝업 실화면 캡처, 인터페이스 Excel·Word·PDF 재생성.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영. Trello TODO63은 검증대기.

## 2026-10-21-03 — TODO64 팝업 데이터 변환 분리와 이식 안내 계획

- 이유: 에디터와 우측/모달 미리보기를 신규 등록 화면에 이식할 때 부모에 묶인 데이터 구성 로직과 통합 사용 안내가 필요.
- 변경: TODO64 작성. popupRichText의 서식 변환 역할은 유지하고 부모의 편집 초기화·미리보기·저장 객체 구성을 일반 함수로 분리하는 범위 정의. 입력 불변성, 공통 구성 재사용, 기존 계약 유지, 에디터 key 초기화와 전체 연결 예제·가이드·검증 기준 포함.
- 주요 파일: docs/design/64_팝업데이터변환_함수분리_이식가이드_TODO.md, version-history/CHANGELOG.md.
- 검증: 현행 에디터·미리보기 컴포넌트, 부모 변환 위치와 기존 이식 안내의 제외 범위 확인. 문서 전용 변경이며 실행 테스트 미실행.
- 상태: 진행 프로세스 구체화 완료. 구현 미착수. 문서 전용 커밋에 포함.

## 2026-10-21-02 — TODO63 문단 들여쓰기 5회 제한 해제 계획

- 이유: 공용 RichText의 문단 들여쓰기를 5단계 이후에도 사용할 수 있도록 제한 해제 범위 정의.
- 변경: TODO63 작성. 편집기 명령·정규화, JSON 변환, 우클릭 표시, 서버·Demo 검증의 상한 제거와 WPF 별도 400px 방어값 정합성 검토를 계획. 40px 단위·0 하한·문단 서식 보존 유지, 6단계/11단계 왕복 및 레이아웃 검증 기준 명시.
- 주요 파일: docs/design/63_문단들여쓰기_5회제한해제_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 최대 단계 및 WPF SafeIndent 제한 위치 확인, 문서 diff 검토. 문서 전용 변경으로 실행 테스트 미실행.
- 상태: 진행 프로세스 구체화 완료. 구현 미착수. 문서 전용 커밋에 포함.

## 2026-10-21-01 — TODO62 취소선과 문단 서식 편집 메뉴

- 이유: 팝업 공용 서식 편집기의 취소선을 저장·표시 경로까지 지원하고, 툴바에만 있던 문단 들여쓰기·정렬을 우클릭 패널에서도 사용할 필요.
- 변경: TODO62 작성 및 구현. CKEditor 기존 빌드의 취소선 명령을 툴바·패널에 연결, 공용 Run `strikethrough` boolean 추가(누락/false = 없음), HTML↔Blocks·서버 검증·TEXT/설문/퀴즈 미리보기·WPF DTO/관용 변환기/밑줄 동시 표시·Demo 검증 반영. 우클릭에 문단 내어쓰기/들여쓰기(기존 40px씩 최대 5단계)·왼쪽/가운데/오른쪽 정렬·혼합/비활성 상태 제공. 서식 초기화를 별도 하단 행으로 이동하고 CKEditor Alignment의 초기화 제외 보완으로 글자 서식만 제거(문단 정렬·들여쓰기 유지). 글로벌 CSS·DB DDL·의존성 변경 없음. Markdown 계약·ALL/MINIMAL·가이드 갱신, 최소 제공 범위 확장 없음.
- 주요 파일: docs/design/62_취소선_문단서식_편집메뉴_TODO.md(신규), web RgstPop/popupRichText.ts·popupRichTextFormat.ts·PopupRichTextMenu.tsx·PopupRichBlocks.tsx·PopupPreview.tsx, 서버 PopupRichText.java·PopupRichTextTest.java, WPF PopupTextBlockDto.cs·PopupRichText.cs·DemoOptionsWindow.cs, scripts/verify-rich-text-49(.cjs·-entry.tsx)·RichTextTests/Program.cs·RichText62ServerTest.java(신규), docs/interfaces/POPUP_INTERFACE_SPEC.md·WPF_POPUP_ALL_SPEC.md·WPF_POPUP_MINIMAL_SPEC.md, docs/POPUP_OPTION_GUIDE.md·POPUP_USER_OPTION_GUIDE.md.
- 검증: 실제 CKEditor·우클릭·미리보기 Chromium 하네스 59건 통과(기존 40·신규 19), 변경 공용 TS/TSX 4파일 strict 타입 검사 오류 0, 실제 서버 공용 검증 클래스 Java17+ECJ 컴파일·독립 검사 12건 통과, diff 검사 통과. WPF 회귀 10건·서버 JUnit 2건 작성. 미실행: Windows/.NET SDK가 없어 WPF 빌드·회귀 실행, Gradle 다운로드 네트워크 오류로 전체 서버/JUnit, 전체 웹 빌드, 실제 관리자 저장→재조회→WPF 왕복·한글 IME, Word/Excel/PDF 재생성. Linux 캡처는 한글 글꼴 형상 검증 제외.
- 상태: 커밋에 포함(커밋 직전 기록). 코드 구현 완료·Windows 및 통합 검증 대기. Trello TODO62는 검증대기.

## 2026-10-20-02 — TODO61 관리자 인라인·실제 크기 미리보기 컴포넌트 분리

- 이유: 등록 화면 우측 미리보기와 '실제 크기로 보기' 모달이 PopupEditorDialog의 state·계산에 묶여 있어 다른 등록 화면에서 재사용할 수 없었다(TODO61).
- 변경: `InlinePopupPreview`(제목·확대 버튼·PopupPreview)와 `PopupPreviewDialog`(크기 모드·9개 위치·가장자리 여백·Overlay·배경 클릭 차단·Esc/종료 버튼) 추가. 모달 크기·위치·여백·Overlay 계산을 `popupPreviewDialogLayout.ts` 순수 함수로 이동(계산식 동일). 모달은 자체 PopupPreview의 IMAGE 권장 크기를 받아 단독 사용 가능하고(인라인 값은 첫 표시용 선택 props), 브라우저 창 resize 시 다시 계산. PopupEditorDialog는 두 컴포넌트로 교체하고 다시 열 때 모달 열림 상태 초기화. 공통 렌더러 PopupPreview는 변경 없음. 등록 화면 없이 샘플 객체로 두 컴포넌트를 쓰는 최소 호스트 하네스 추가. 사용·이식 안내 문서(props·예시·상태 규칙·의존성) 추가, 미리보기 정합 문서의 컴포넌트 이름 갱신, TODO61 구현·검증 기록. JSON 변환 분리·서버·DB·WPF 변경 없음. WPF 명세(ALL·MINIMAL)는 WPF 기능 변경이 없어 검토만 하고 수정하지 않음.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/InlinePopupPreview.tsx·PopupPreviewDialog.tsx·popupPreviewDialogLayout.ts(신규)·PopupEditorDialog.tsx, scripts/verify-popup-preview-61(.cjs·-entry.tsx, 신규), docs/interfaces/ADMIN_POPUP_PREVIEW_COMPONENTS.md(신규), docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/61_관리자_미리보기_컴포넌트화_TODO.md, version-history/CHANGELOG.md.
- 검증: 웹 tsc 오류 0, 변경 파일 eslint 오류 0. 신규 verify-popup-preview-61 42건 통과(headless Edge — FIXED 중앙 560×420, TOP_LEFT 24px·VIDEO BOTTOM_RIGHT 0px 여백, 종료 버튼 위치, Overlay 0.45 배경·배경 클릭 무시·Esc 종료, Overlay 꺼짐 투명·배경 클릭 종료, RATIO와 창 크기 변경 재계산, FULLSCREEN, IMAGE FIT_TO_IMAGE 모달 크기가 인라인 값 전달 여부와 관계없이 동일, 설문 응답 모달·인라인 분리와 재열기 초기화, VIDEO+QUIZ 영상 영역 2개·종료 시 정리, 동결 popup 불변, 런타임 오류 0). 기존 verify-image-preview 34건·verify-completion-ux-43 60건·verify-survey-rich-text-55 23건·verify-question-template-picker 7건 통과. verify-rich-text-49는 처음 두 번 서식 메뉴 선택 상태 검사('Mixed bold selection is shown as mixed')에서 실패하고 세 번째 실행에서 40건 통과(미리보기 분리와 무관한 편집기 검사). 미실행: 실제 관리자 웹 로그인 화면에서 신규·수정·템플릿 적용 후 미리보기 확인, 다른 등록 화면 실제 이식.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-20-01 — TODO61 관리자 등록 화면 미리보기 컴포넌트화 계획

- 이유: 우측 인라인 미리보기와 실제 크기 모달을 다른 등록 화면에서 재사용할 수 있도록 화면 책임과 의존성을 정리.
- 변경: TODO61 문서 추가. 인라인 컨테이너·미리보기 모달 분리, 기존 PopupPreview 공유, props·상태 생명주기·타입 및 리소스 인계·회귀 확인 기준 정의. JSON 변환 로직 분리와 API·DB·WPF 변경은 범위에서 제외.
- 주요 파일: docs/design/61_관리자_미리보기_컴포넌트화_TODO.md, version-history/CHANGELOG.md.
- 검증: 현행 등록 화면과 미리보기 호출 구조 및 공용 타입 export 확인. 문서만 변경했으며 빌드·브라우저·Windows 실행 검증은 미실행.
- 상태: 진행 프로세스 구체화 완료. 구현 미착수. 문서 전용 커밋에 포함.

## 2026-10-19-14 — 2026-10-19 문서 전용 커밋 메시지 접두어 정리

- 이유: TODO 문서와 변경 이력만 바꾼 커밋이 `dev:` 접두어로 올라가 있어, 코드 변경 커밋과 구분되도록 `docs:`로 정리.
- 변경: 2026-10-19 커밋 중 TODO 문서·CHANGELOG만 바꾼 5건(57 TODO 추가, 58 TODO 추가, 57-58 상태 수정, 59 TODO 추가, 60 TODO 추가)의 메시지 접두어를 `dev:` → `docs:`로 바꾸도록 이력을 다시 쓰고 main에 강제 푸시(`--force-with-lease`). 파일 내용은 그대로이며 이후 커밋 ID가 모두 바뀌었다. 새 ID: 563e064·0255766·a8dd4fe·f6d5986·f9f6a91(문서), 27efb51(59)·b4e15b5(57)·6136498(60)·06f0c83(58)·b333eed(60-5)·0b2fd8f(55-4)·849a096(55-3)·85a949e(원격 DB). 문서에 남은 이전 ID(TODO58 기준 커밋, 변경 이력의 대조 HEAD)를 새 ID로 고쳤다. Trello TODO55·57·58·59·60 진행 기록의 커밋 ID도 새 값으로 교체.
- 주요 파일: docs/design/58_IMAGE_공통크기필드_모드별기준_TODO.md, version-history/CHANGELOG.md.
- 검증: 재작성 전 상태를 로컬 백업 브랜치 `backup/before-msg-rewrite-20261019`로 보존, 재작성 후 백업과 트리 차이 없음 확인, 강제 푸시 후 로컬·원격 일치.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-19-13 — TODO55-4 원격 개발 DB 17 스크립트 적용 및 적용 도구 추가

- 이유: TODO55-4 서버는 문항·선택지 서식 컬럼을 조회·저장하므로 원격 개발 DB에 17 스크립트가 먼저 있어야 함. 이후 이관 스크립트를 원격 개발 DB에 바로 적용할 수 있도록 실행 경로를 하나로 고정.
- 변경: `db/oracle/tools/apply-dev-db.ps1` 추가 — 원격 개발 DB(192.168.114.71 XE, `zero-rule`, 빈 스키마 접두어)에 `NN_*_oracle.sql` 1개를 실행. 비밀번호는 `application-dev_db.yml` 주석 줄에서 읽고 출력하지 않음, 다른 경로·파일 거부, PowerShell 5.1의 빈 인자·파이프 BOM 문제를 피하려고 `DEFINE 1 = ''` 임시 래퍼(BOM 없음)로 실행 후 삭제. 원격 개발 DB에 17 스크립트 적용. README 적용 현황·도구 절 추가.
- 주요 파일: db/oracle/tools/apply-dev-db.ps1(신규), db/oracle/README.md, version-history/CHANGELOG.md.
- 검증: 빈 접두어 래퍼 방식을 로컬 XE에서 먼저 확인(`SELECT '[&1]'` → `[]`, 파이프 방식은 BOM으로 SP2-0734 재현). 원격 개발 DB에서 17 실행 — 컬럼 3 OK·주석 3 OK·확인 쿼리 3. `PopupQuestionDatabaseTest` 2건(서식 저장·재조회·템플릿 재사용 포함)을 원격 개발 DB 대상으로 실행해 통과(롤백 전용). PowerShell에서 `POPUP_TEST_DB_SCHEMA=''` 설정은 변수 삭제가 되어 첫 실행이 ORA-00942로 실패했고, Git Bash에서 빈 값으로 다시 실행. 미실행: 원격 서버 반영(새 서버 배포).
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-19-12 — TODO55-3 설문·퀴즈 서식 관리자 편집·미리보기 반영

- 이유: 서버가 설문·퀴즈 서식을 저장하게 되어(2026-10-19-11) 관리자 웹에서 콘텐츠 제목·설명, 문항 제목·설명, 선택지 문구를 TEXT와 같은 서식 편집기로 작성하고 미리보기로 확인할 수 있어야 함.
- 변경: `PopupRichTextEditor`에 `compact` 모드(툴바 숨김·낮은 높이, 서식은 우클릭·'서식' 버튼 펼침 패널)와 placeholder 추가. `PopupQuestionEditor`의 문항 제목·설명·선택지 입력과 `PopupEditorDialog`의 설문·퀴즈 콘텐츠 제목·설명을 서식 편집기로 교체(편집기별 선택 범위·패널 분리, 선택지 key를 optionId로 바꿔 삭제 후 내용 섞임 방지, 새 문항·선택지 임시 ID 순번 추가, 문항 템플릿 불러오기 시 편집기 재생성, 글자가 없으면 서식 미전송, 저장 전 서버와 같은 길이 상한 검사). 저장 대상 content 키에 `surveyTitleBlocks`·`descriptionBlocks` 추가. 공용 `PopupRichBlocks`로 미리보기의 콘텐츠 제목·설명, 문항 제목(필수 `*`·선택 안내는 마지막 문단 끝)·설명, 선택지(접근 가능한 이름은 일반 문구) 서식 표시, VIDEO+QUIZ는 WPF와 같이 서식 설명을 퀴즈 머리말에서 숨기지 않음. 도메인 모델에 서식 필드 추가. TODO55 문서(상태·55-1/55-3/55-4 완료·반영 기록·남은 55-10), 인터페이스 명세 §8.4.1(초안 표기 제거·서버 저장 규칙), ALL 명세 갱신. MINIMAL 변경 없음.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupRichBlocks.tsx(신규)·PopupRichTextEditor.tsx·PopupQuestionEditor.tsx·PopupEditorDialog.tsx·SurveyPreview.tsx·PopupPreview.tsx, zero-rule-web/sub/domain/src/model/PopupAdmin.ts, scripts/verify-survey-rich-text-55(.cjs·-entry.tsx, 신규), docs/design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md, docs/interfaces/POPUP_INTERFACE_SPEC.md·WPF_POPUP_ALL_SPEC.md, version-history/CHANGELOG.md.
- 검증: 웹 tsc 오류 0, 변경 파일 eslint 오류 0(기존 CKEditor require 경고 1). 신규 verify-survey-rich-text-55 23건 통과(headless Edge에서 실제 CKEditor 5개 동시 편집 분리, 펼침 패널 색이 선택한 선택지 범위에만 적용, 선택지 삭제 후 ID 유지, 빈 서식 미전송, 제목 빈 값·1000자 초과 차단, 다중 문단, 임시 ID 중복 없음, 미리보기 서식·문단 정렬·들여쓰기·필수 표시 위치·접근성 이름, VIDEO+QUIZ 머리말 규칙). 기존 verify-completion-ux-43 60건·verify-question-template-picker 7건·verify-rich-text-49 40건·verify-image-preview 34건 통과. 미리보기 캡처 확인. 미실행: 실제 관리자 웹 로그인 화면 저장→재조회→WPF 표시 왕복, 인터페이스 Excel·Word·PDF 반영, WPF DPI·창 폭·키보드 실화면.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-19-11 — TODO55-4 설문·퀴즈 서식 서버 저장·API 반영

- 이유: SURVEY·QUIZ 서식(FONT EDIT)은 WPF 표시만 구현되어 있고 서버가 TEXT 외 유형의 서식을 저장·반환하지 않아, 관리자 저장부터 WPF 응답까지 서식이 이어지지 않았다. 55-1 초안의 필드 이름·위치를 확정해 서버 저장 경로를 구현.
- 변경: DB — `17_question_rich_text_oracle.sql`로 `POPUP_QUESTION.TITLE_BLOCKS`·`DESCRIPTION_BLOCKS`, `POPUP_OPTION.TEXT_BLOCKS`(CLOB, NULL = 서식 없음) 추가(멱등), `01` 신규 스키마·README 반영. 콘텐츠 제목·설명 서식은 기존 CONTENT_OPTIONS 저장(DDL 없음). 서버 — `PopupSurveyRichText`가 저장 전에 콘텐츠·문항·선택지 서식을 TEXT와 같은 규칙으로 검증하고 일반 문자열을 서식에서 파생, 필드별 상한(200·2000·1000·2000·1000) 검사, 빈 서식 제거, SURVEY·QUIZ 외 유형의 콘텐츠 서식 키 거부. 정규화 결과로 문항 템플릿 재사용을 비교해 서식만 바뀌어도 새 템플릿 생성. DTO·Entity에 서식 필드 추가(서식 없으면 JSON 키 생략, 기존 생성자 유지), 매퍼 insert·resultMap·select에 세 컬럼 추가, 저장 시 JSON 배열 문자열로 변환·조회 시 배열로 복원(손상 JSON은 문항·선택지 ID와 함께 실패). WPF 응답 정답 키 제거 사본에도 서식 유지.
- 주요 파일: db/oracle/17_question_rich_text_oracle.sql(신규)·01_popup_schema_oracle.sql·README.md, zero-rule-server/domain/.../PopupQuestionDto.java·PopupOptionDto.java·PopupQuestionEntity.java·PopupOptionEntity.java·PopupResponseDto.java·wpf/WpfPopupItem.java, repo/core/.../PopupMapper.java·PopupMapper.xml, service/core/.../PopupSurveyRichText.java(신규)·PopupService.java, 테스트 PopupSurveyRichTextTest(신규)·PopupQuestionDatabaseTest·PopupAdminQuestionsTest, version-history/CHANGELOG.md.
- 검증: 로컬 XE(POPUP)에 17 스크립트 실행 — 컬럼 3 생성, 재실행 시 SKIP. 서버 `gradlew cleanTest test --offline` 149건 중 140 통과·9 skip(Oracle 연동, 실패 0). `POPUP_TEST_DB_PASSWORD`로 실DB 실행 시 신규 서식 왕복 포함 `PopupQuestionDatabaseTest` 2건 통과. 같은 실DB 실행에서 `WpfPopupDatabaseTest` 2건·`WpfApiOracleHttpTest` 2건은 조회 결과 popup=null로 실패 — `WpfPopupDatabaseTest`는 변경 전 HEAD(a88bd22) 별도 작업 트리에서도 같은 2건이 같은 원인으로 실패해 로컬 샘플 데이터 상태 문제로 판단(HTTP 테스트 2건은 HEAD 대조 미실행). 미실행: 원격 개발 DB 17 스크립트 실행, 원격 서버 반영.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영. 배포 순서: DB 17 → 서버.

## 2026-10-19-10 — TODO60 VIDEO+QUIZ 스크롤바 경계 진동 방지 보완

- 이유: 코드 검토에서 TODO60-5 진동 방지 분기가 실행되지 않는 문제 확인. 너비 이력(_lastAspectWidth·_previousAspectWidth)이 NaN으로 시작해 `Math.Abs(width - NaN) >= 0.5`가 항상 false였고, 이력이 갱신되지 않아 본문 높이가 스크롤바 표시 경계에 걸리면 스크롤바 등장 → 영상 너비·높이 감소 → 스크롤바 사라짐 → 높이 증가가 반복될 수 있었다.
- 변경: 너비 이력 갱신을 RecordAspectWidth로 분리해 첫 유효 너비로 초기화. 직전 너비로 스크롤바 폭 이내(시스템 세로 스크롤바 폭 + 16, 설문 스크롤바 실측 차이 27)만큼 되돌아온 경우에만 마지막 높이를 유지하고, 그보다 큰 왕복(창 크기 조절 후 원래 너비 복귀)은 다시 계산해 이력 수정 후 정상 크기 변경이 막히지 않게 함. TODO60 문서 60-5 구현 기록·검증 항목 보완.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.AspectSizing.cs, scripts/PopupWindowTests/Program.cs, docs/design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md, version-history/CHANGELOG.md.
- 검증: 수정 전 코드에 스크롤바 경계 테스트(짧은 문항 1개·설명 없음, 16:9·3:2, 경계 주변 창 높이 61개를 1 DIP 간격)를 적용해 3:2·창 높이 791 등 12개 높이에서 행 높이 348.93(스크롤바 표시) ↔ 360.42(숨김) 반복 재현. 수정 후 PopupWindowTests 376건 통과(너비 이력 단위 6건, 원래 너비 복귀 재계산, 두 비율 경계 수렴 포함), WPF 빌드 경고·오류 0. 미실행: 실제 Windows 화면에서 창 크기를 손으로 조절하는 재현, DPI 125~200%에서의 스크롤바 폭 차이.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-19-09 — TODO58 IMAGE 공통 크기 필드 통합 및 모드별 크기 기준

- 이유: IMAGE 크기 입력을 공통 popup.width/height 한 쌍으로 통합하고 ADAPTIVE·ORIGINAL은 창 전체, FIT_TO_IMAGE는 이미지 콘텐츠 영역으로 해석을 명확히 하기 위한 계약 변경(TODO58).
- 변경: WPF — PopupResponseDto Width/Height를 nullable로 바꿔 생략을 구분(IMAGE 외 900×620 유지), ImagePopupContentDto 크기 제거, Factory가 최상위 값을 모드별로 매핑(구 서버 content.width/height는 최상위 축이 없을 때만 임시로 읽음), ImagePopupView.ResolveContentArea로 FIT_TO_IMAGE 두 축 지정을 그대로 콘텐츠 영역으로 사용(비율 고정 Uniform·해제 Fill). Demo 샘플·상세옵션·요약 갱신. 서버 — 일반 IMAGE도 popup.width/height(축별 생략 가능)로 검증하고 content.width/height는 거절, 저장은 기존 CONTENT_OPTIONS width/height 그대로, 응답에서 최상위로 이동. 관리자 웹 — 모델 주석, 등록 화면 모드별 라벨·도움말, ORIGINAL 포함 같은 입력, 미리보기·레이아웃 계산을 최상위 크기와 새 영역 규칙으로 변경, 구 응답 content 크기 이관. 인터페이스 명세(§8.2 크기 필드 표·§15.2·필드 표·변경 요약), ALL/MINIMAL, 옵션 가이드 2종, 미리보기 정합 문서, 예제 JSON, Excel(개요·공통·IMAGE), Word 재생성·PDF 재출력(TODO59·60 문구 포함), TODO23 상단 참조·TODO58 구현 기록 갱신. DB 변경 없음.
- 주요 파일: popup-frameWork/Popup/Dtos/PopupResponseDto.cs·ImagePopupContentDto.cs, Factories/PopupFactory.cs, Views/Contents/ImagePopupView.xaml.cs, DemoOptionsWindow(.Fields).cs, DemoWindow.Settings.cs, Services/DemoPopupDataService.cs, scripts/PopupWindowTests/Program.cs, zero-rule-server/service/core/.../PopupService.java(+PopupAdminQuestionsTest), web/api/.../WpfPopupControllerTest.java, zero-rule-web/sub/domain/src/model/PopupAdmin.ts, zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx·PopupPreview.tsx·imagePreviewLayout.ts, scripts/verify-image-preview(.cjs·-entry.tsx), docs/interfaces/*, docs/POPUP_OPTION_GUIDE.md, docs/POPUP_USER_OPTION_GUIDE.md, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/23·58, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. PopupWindowTests 365건(영역 계산·매핑·구 값 호환·IMAGE 외 기본값·TEXT/ADAPTIVE/ORIGINAL 실창 크기 동일·FIT_TO_IMAGE 영역 유지와 설명 가산·Uniform/Fill), ApiDemoTests 69건, RichTextTests 102건 통과, CornerWindowTests 761건(첫 실행은 실제 모니터 배율 왕복 단계에서 1회 실패, 재실행 통과). 서버 `gradlew test --offline --continue` 140건 통과(Oracle 연동 8건 skip, 작성 중 응답 매핑의 Double 언박싱 NPE를 테스트로 발견해 수정). 웹 tsc 오류 0·변경 파일 eslint 통과, verify-image-preview 34건·verify-completion-ux-43 60건·verify-rich-text-49 40건(첫 실행 1회 타이밍 실패, 재실행 통과)·verify-question-template-picker 7건 통과. 명세 JSON 블록 37개·예제 JSON 3개 파싱, Excel 패키지 파트 손실 없음. 미실행: DPI·다중 모니터·FULLSCREEN 실화면, 실제 관리자 웹 저장·재조회, 원격 개발 서버 반영과 구 WPF 조합 확인.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영. 배포 순서: 새 WPF → 서버.

## 2026-10-19-08 — TODO60 VIDEO+QUIZ 원본 비율 기반 영상 영역 할당

- 이유: 영상 결합 화면이 제목·설명을 포함한 영상 뷰 전체를 300 DIP로 고정해 실제 재생 공간이 줄고 원본 비율과 맞지 않아, WPF와 관리자 미리보기에서 원본 비율·실제 가용 너비로 재생 영역을 배정(TODO60).
- 변경: WPF — VideoQuizPopupView의 고정 300 행을 Auto로 바꾸고 VideoPopupView 재생 행(VideoRow)만 W × h / w로 계산(VideoPopupView.AspectSizing.cs, 메타데이터 전·실패 16:9, 상한 = 부모 스크롤 높이 × 0.7, 하한 180, 스크롤바 진동 방지, 전체화면 중 계산 보류). WebView2 HTML 메시지에 videoWidth/videoHeight·문서 loadId와 resize 이벤트 추가(다른 문서 메시지 무시, resize는 재생 상태 계산 전 반환), MediaElement는 NaturalVideoWidth/Height 사용. 단독 VIDEO는 기존 * 행 유지. 관리자 웹 — VIDEO+QUIZ 미리보기 자리표시자를 AspectVideoArea(HTML video 메타데이터 + ResizeObserver, URL 변경 시 비율 초기화)로 교체. ALL 명세·미리보기 정합 문서·TODO60에 확정 초기값과 구현 기록 추가. API 필드 변경 없음.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.AspectSizing.cs(신규), Views/Contents/VideoPopupView.xaml(.cs), Views/Contents/VideoQuizPopupView.cs, scripts/PopupWindowTests/Program.cs, zero-rule-web/main/src/features/RgstPop/AspectVideoArea.tsx(신규)·PopupPreview.tsx, scripts/verify-completion-ux-43.cjs, docs/interfaces/WPF_POPUP_ALL_SPEC.md, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. PopupWindowTests 347건 통과(계산 예시 4종·상한·하한, 실창 16:9→4:3→9:16 전환, 잘못된 크기·다른 loadId 무시, 창 너비 재계산, 시청량·잠금 불변, 단독 VIDEO 유지), ApiDemoTests 69건·CornerWindowTests 761건·RichTextTests 102건 통과. Demo VIDEO+QUIZ 실창 캡처(푸터 ON/OFF)로 592×252 영상의 재생 행 348.93(너비 817)·레터박스 없음·제목/설명 분리 확인. 웹 tsc 오류 0·변경 파일 eslint 통과, verify-completion-ux-43 60건 통과(Demo 영상 실제 메타데이터 — Edge는 593×252 보고). 미실행: HTTP 영상(WebView2) 실재생 메타데이터 수신, 세로·정사각·회전 영상 파일, DPI·전체화면 왕복 실조작, 실제 관리자 웹 화면.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영. 상한·하한은 초기값으로 실제 세로 영상 비교 후 조정 가능.

## 2026-10-19-07 — TODO57 완료 전 닫기 옵션 폐기 및 Overlay·완료·나중에 보기 역할 분리

- 이유: 완료 전 이탈 허용(allowCloseBeforeComplete)과 나중에 보기의 역할 중복을 정리하고, 화면 버튼은 완료 기준, 외부 닫기는 Overlay, 완료 전 연기는 showLater로 판단하도록 책임 분리(TODO57).
- 변경: WPF — DTO·PopupOptions·Factory에서 필드 제거(구 JSON 필드는 무시). 일반 VIDEO 닫기 버튼은 시청 기준 전 항상 비활성, VIDEO+QUIZ 보조 닫기는 재생 실패 때만 표시. OnClosing의 시청 기준 창 닫기 취소를 없애 외부 닫기는 Overlay 정책(출구 없음·앱 종료 예외 유지)으로만 판단 — Overlay 꺼짐은 시청 전에도 닫히고 VIDEO_WATCHED로 기록, 켜짐은 시청 후에도 Alt+F4 차단. Demo 상세옵션 항목 삭제, VIDEO·VIDEO+QUIZ 샘플에 showLater 적용. 서버 — PopupResponseDto·WpfPopupItem·AdminPopupSaveCommand·PopupEntity·PopupService·PopupMapper에서 필드 제거, DB 컬럼 ALLOW_CLOSE_BEFORE_COMPLETE_YN은 존치·미사용(DROP 없음). 관리자 웹 — 모델·편집 스위치 삭제, 완료 비율·나중에 보기·배경 클릭 차단 설명을 새 역할로 변경, 미리보기 VIDEO 잠금 항상 적용·VIDEO+QUIZ 보조 닫기 제거. 명세(인터페이스·ALL·MINIMAL)·옵션 가이드 2종·미리보기 정합 문서·예제 JSON·Excel 정의서(폐기 표기·Sample JSON) 갱신, Word 재생성·PDF 재출력. TODO57에 영향 경로·구 클라이언트 호환(구 WPF는 필드 누락 시 true로 동작 → 새 WPF 배포 후 서버 반영) 기록.
- 주요 파일: popup-frameWork/Popup/Dtos/PopupResponseDto.cs, Models/PopupOptions.cs, Factories/PopupFactory.cs, Views/Windows/PopupWindow.xaml(.cs), Views/Contents/VideoPopupView.xaml.cs(주석), DemoOptionsWindow.Fields.cs, Services/DemoPopupDataService.cs, scripts/PopupWindowTests/Program.cs, zero-rule-server/domain/.../PopupResponseDto.java·PopupEntity.java·AdminPopupSaveCommand.java·wpf/WpfPopupItem.java, service/core/.../PopupService.java(+테스트 3종), repo/core/.../PopupMapper.xml, zero-rule-web/sub/domain/src/model/PopupAdmin.ts, zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx·PopupPreview.tsx, scripts/verify-completion-ux-43(.cjs·-entry.tsx), docs/interfaces/*, docs/POPUP_OPTION_GUIDE.md, docs/POPUP_USER_OPTION_GUIDE.md, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, api/examples/wpf-popups-response.json, docs/design/57_완료전닫기옵션_폐기_역할분리_TODO.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. PopupWindowTests 329건 통과(VIDEO·VIDEO+QUIZ × Overlay ON/OFF × 시청 전/후, 구 필드 true/false 무시, 재생 실패, 출구 없음, 앱 종료, Overlay 꺼짐 외부 닫기 결과 VIDEO_WATCHED, LATER 회귀), ApiDemoTests 69건·RichTextTests 102건·CornerWindowTests 761건 통과. 서버 `gradlew test --offline --continue` 139건 통과(Oracle 연동 8건 skip — DB 접속 정보 미설정). 웹 tsc 오류 0·변경 파일 eslint 통과, verify-completion-ux-43 56건 통과. 예제 JSON·Excel Sample JSON 파싱, Excel 패키지 파트 손실 없음 확인. 미실행: 실제 Windows 버튼·Alt+F4·시스템 메뉴 실조작, 관리자 웹 실화면 저장·재조회, 원격 개발 서버·DB 반영과 구 WPF 조합 확인, 로컬 전용 BehaviorTests 갱신.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-19-06 — TODO59 VIDEO+QUIZ 중간 notice 제거

- 이유: 영상 설명 아래·퀴즈 위의 시스템 안내가 하단 시청/제출 안내와 중복돼 제거(TODO59).
- 변경: VideoQuizPopupView의 _notice와 전용 행 제거(본문 영상·퀴즈 2행). 잠금 사유 문구를 VideoQuizPopupView.LockedReason으로 모아 PopupWindow 푸터가 사용. 푸터 숨김(showFooter=false) 조합은 본문 제출 영역 진행 문구·제출 HelpText에 잠금 사유를 표시하고 해제 후 필수 응답 문구로 복귀(SurveyPopupView.SetLockedReason). 잠금·해제·제출 로직은 유지. 관리자 웹 미리보기의 같은 중간 안내도 제거. ALL 명세·미리보기 정합 문서·TODO59 구현 기록 갱신.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoQuizPopupView.cs, Views/Contents/SurveyPopupView.xaml.cs, Views/Windows/PopupWindow.xaml.cs, scripts/PopupWindowTests/Program.cs, zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, scripts/verify-completion-ux-43.cjs, docs/interfaces/WPF_POPUP_ALL_SPEC.md, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/59_VIDEO_QUIZ_중간안내제거_TODO.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0, PopupWindowTests 305건 통과(TODO59 신규 포함), 웹 tsc 오류 0, verify-completion-ux-43 56건 통과. WPF 실화면·실제 관리자 웹 화면 확인은 미실행.
- 상태: 커밋에 포함(커밋 직전 기록). 원격 반영.

## 2026-10-19-05 — TODO60 VIDEO+QUIZ 원본 비율 영역 할당 등록

- 이유: 영상 결합 화면의 고정 300 DIP 영역을 원본 영상 비율·실제 가용 너비에 맞추고 관리자 미리보기와 일치시킬 필요.
- 변경: 브라우저 메타데이터 기반 크기 수집, WebView2→WPF 전달, 재생 화면/제목/설명 높이 분리, 창 크기 변경·세로 영상 상한·로딩/실패 예외 및 Front 인계를 TODO60에 기록. 기본 비율·최대 높이 수치는 구현 전 구체화 대상으로 구분.
- 주요 파일: docs/design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 영상 결합 300 DIP 레이아웃과 논의 범위 대조. 문서만 작성, 실행 테스트 미실행.
- 상태: 진행 프로세스 구체화 완료 · 구현 대기. Trello 같은 목록에 등록.

## 2026-10-19-04 — TODO59 VIDEO+QUIZ 중간 notice 제거 등록

- 이유: 영상 설명 아래·퀴즈 위의 시스템 안내가 하단 시청/제출 안내와 중복됨.
- 변경: 중간 _notice 및 전용 여백 제거, 하단 안내·잠금 로직 유지, 푸터 숨김 조합 검증을 TODO59로 등록. Description 공통화는 명시적 보류로 기록하고 문항 설명 통합·영역별 설명·TEXT 링크 삭제와 작업 범위를 구분.
- 주요 파일: docs/design/59_VIDEO_QUIZ_중간안내제거_TODO.md, version-history/CHANGELOG.md.
- 검증: 현재 VideoQuizPopupView.cs의 notice 생성·완료 갱신과 PopupWindow의 하단 안내 확인. 문서만 변경, 실행 테스트 미실행.
- 상태: 진행 프로세스 구체화 완료 · 구현 대기. Trello 같은 목록에 등록.

## 2026-10-19-03 — TODO57·58 계획 작성 완료 상태 정정

- 이유: TODO 작성 완료와 구현 진행 상태를 구분하기 위한 상태 정합성 보완.
- 변경: TODO57·58 문서 상태를 진행 프로세스 구체화 완료·구현 대기로 정정하고 Trello 카드도 같은 목록으로 이동. TODO 작성만 완료된 항목은 구체화 완료로 분류한다.
- 주요 파일: docs/design/57_완료전닫기옵션_폐기_역할분리_TODO.md, docs/design/58_IMAGE_공통크기필드_모드별기준_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 문서에서 TODO57·58 미구현, TODO54~56 구현 기록 확인. 상태 변경만 수행했으며 실행 테스트는 해당 없음.
- 상태: 문서·Trello 상태 정정 완료. 구현은 미착수.

## 2026-10-19-02 — TODO58 IMAGE 공통 크기 필드 및 모드별 기준 등록

- 이유: 이미지 크기 입력을 공통 width/height 한 쌍으로 통합하고 모드별 창/콘텐츠 기준을 명확히 할 필요.
- 변경: ADAPTIVE·ORIGINAL은 창 전체 크기, FIT_TO_IMAGE는 이미지 콘텐츠 크기에 부가 영역을 더하는 계약을 TODO58에 기록. content.width/height 제거 계획, 등록 화면 라벨·도움말, 호환 전환·최소/최대·클리핑·Demo·검증·Front/Server 인계 포함. TODO23에 후속 계획 참조 추가.
- 주요 파일: docs/design/58_IMAGE_공통크기필드_모드별기준_TODO.md, docs/design/23_IMAGE_크기모드_단순화_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO23과 확정 방향 대조. 문서만 작성, 코드 변경·빌드·실화면 검증 미실행.
- 상태: 진행 확정 · 구현 대기. Trello 등록, TODO와 함께 커밋.

## 2026-10-19-01 — TODO57 완료 전 닫기 옵션 폐기 및 역할 분리 등록

- 이유: 완료 전 이탈 허용과 나중에 보기의 옵션 중복을 정리하고 완료 기준·외부 닫기·연기 동작의 책임을 명확히 할 필요.
- 변경: allowCloseBeforeComplete 폐기 계획과 일반 VIDEO 버튼의 completionRatio 기반 고정 잠금, Overlay 기반 외부 닫기, showLater 기반 연기를 TODO57로 등록. 영상 결합 QUIZ·재생 실패·앱 종료·시청 결과·구 클라이언트 호환 및 Front/Server 인계 범위 포함.
- 주요 파일: docs/design/57_완료전닫기옵션_폐기_역할분리_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 닫기 코드·계약과 합의된 행동 기준 대조. 문서만 작성했으며 코드 변경·빌드·실행 검증 미실행.
- 상태: 진행 확정 · 구현 대기. Trello 등록, TODO와 함께 커밋.

## 2026-10-18-15 — 20261018 폐쇄망 반입본 생성

- 이유: 20261017 반입 이후의 나중에 보기(TODO52-2, DB 16 포함)·Demo UI(TODO54)·설문·퀴즈 서식 표시(TODO55 초안)·설문 디자인 버전과 V2 화면(TODO56, WPF·관리자 웹 미리보기)·소유자 창 종료 결과 수정을 폐쇄망에 반입하기 위해 새 반입본 필요. 서버·웹·WPF가 모두 바뀌어 네 묶음을 모두 새로 만듦.
- 변경: main 62b755d를 깨끗한 worktree(.offline-verify/wt-20261018)로 꺼내 scripts/export-offline-package.ps1(-IncludeMockSso -NoZip)로 offline-export/20261018 생성(작업 트리의 개발 PC 전용 미커밋 application-local.yml 제외 목적). 기존 번호 체계(1-zero-rule-server·2-zero-rule-web·3-popup-frameWork·4-docs)로 정리. 서버 A 88·M 7, 웹 A 9·M 11·D 2, WPF 소스 93, 문서 95 파일. MockSso 개인 launchSettings 제외. DELETE-SINCE-20260930.txt 누적 목록 갱신과 함께 20260930 기준에 잡히지 않는 20261017 이후 삭제(Views/Contents/SurveyStyles.xaml)를 별도 구역으로 추가. README-IMPORT.md(DB 16 → 서버 → 웹·WPF 순서, 호환성, 설계 52~56 변경)와 묶음별 패치노트(README-PATCH-1·2·3) 작성. 묶음별 TAR·통합 TGZ·SHA256 생성.
- 주요 파일: offline-export/20261018/ (Git 제외), .offline-verify/package-20261018.ps1·finalize-20261018.ps1 (Git 제외), version-history/CHANGELOG.md.
- 검증: 반입본 WPF 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·폴더형 publish와 -SingleFile publish 성공(popupSample.exe 1개, 91,721,038바이트). 반입 소스 개인 PC 절대경로 검사 통과. TAR별 파일 수·경로 대조, 제외 대상 누출 검사, TGZ 해제 후 TAR 체크섬 대조, 데모 영상 해시 대조. 폐쇄망 기존 소스 병합·빌드, 폐쇄망 DB 16 적용, 폐쇄망 PC 실행은 미실행.
- 상태: 반입본 생성·검증 완료. 이 기록은 커밋에 포함.

## 2026-10-18-14 — TODO56 관리자 웹 미리보기 V2 반영

- 이유: 반입본 생성 전에 관리자 웹 미리보기도 WPF 디자인 V2(TODO56)와 같은 화면으로 맞추기로 결정(인계 대신 직접 반영).
- 변경: SurveyPreview.tsx 디자인 버전 객체에 V1·V2 동작 플래그(flatQuestions·choiceRadius·selectedBold·selectedRing·rowCheckAlways·choiceHint)와 색 추가. V2: 흰 본문, 문항 카드 없이 구분선(마지막 제외), 선택지 라운드 6, 라디오·체크박스 표시 없음, 선택 = #171717 2px 테두리(inset, 크기 불변) + 세로형만 선택 시 체크, 선택해도 굵기·색 불변, 포커스 바깥 점선, 제목 끝 "하나 선택"/"여러 개 선택 가능"(aria-describedby). V1은 기존 카드형 동작 유지. PopupPreview.tsx 필수 응답 문구를 WPF와 같게 변경. verify-completion-ux-43에 TODO56 V2 검증 6건 추가·문구 기대값 갱신. TODO56 진행 기록 갱신.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/SurveyPreview.tsx, zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, scripts/verify-completion-ux-43.cjs, docs/design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md, version-history/CHANGELOG.md.
- 검증: 웹 tsc 오류 0, eslint 경고 없음, headless Edge 하네스 56건 통과(신규 6), 하네스 캡처로 미리보기 화면 확인. 실제 관리자 웹(브라우저·Next 개발 서버) 화면은 미확인.
- 상태: 커밋에 포함(커밋 직전 기록).

## 2026-10-18-13 — TODO56 설문·퀴즈 선택 상태·응답 안내 UX(WPF, 디자인 V2 반영)

- 이유: 미선택 체크가 선택처럼 보이고 단일/복수 선택 외형이 같아 혼동(TODO56). 새 버전을 만들지 않고 최신 디자인 V2에 직접 반영하기로 결정, V1은 원복용으로 보존. 원/사각형 표시기를 1차 구현했으나 라디오·체크박스 표시기 없이 선택 후에만 체크를 보이는 방식으로 결정.
- 변경: SurveyStyles.V2.xaml 선택지 템플릿을 행·Chip 2개로 정리(단일·복수 공용, 표시기 없음). 선택 전 체크 숨김(행 오른쪽 28 자리 예약), 선택 = 2px 링 층(크기 불변) + 행만 #171717 체크(가로형 Chip은 체크 자리를 비우면 왼쪽 여백이 어색해 체크 없이 링만, 좌우 여백 동일, SurveyChipCheckWidth 0), 선택 시 SemiBold·Foreground 변경 제거, 포커스는 링 바깥 점선 FocusVisualStyle, 비활성은 선택 표시 유지. 디자인 키 SurveyReserveSelectedBold(V2 False — 굵은 글자 높이 예약 해제)·SurveyShowChoiceHint(V2 True)·SurveyIndicatorBorder 추가(V1은 키 없음 = 기존 동작). SurveyPopupView: 단일 "하나 선택"/복수 "여러 개 선택 가능" 안내 줄과 HelpText, 필수 응답 문구 "필수 응답 n/m · k문항 남음"/"필수 응답 m/m 완료"(버전 공통). TODO56 진행 기록, popup-frameWork README, 웹 SurveyPreview 인계 주석 갱신.
- 주요 파일: popup-frameWork/Popup/Views/Contents/SurveyDesigns/SurveyStyles.V2.xaml, Views/Contents/SurveyPopupView.xaml.cs, scripts/PopupWindowTests/Program.cs, scripts/RichTextTests/Program.cs, docs/design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md, popup-frameWork/README.md, zero-rule-web/main/src/features/RgstPop/SurveyPreview.tsx(주석), version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. PopupWindowTests 260건 통과(SURVEY·QUIZ × 단일/복수 × 세로/가로 표시기 없음·선택 전 체크 없음·선택 체크·링·굵기/색/크기 불변·비활성·안내, V1 안내 없음). RichTextTests 102건(서식 선택지 선택 시 Run 서식 유지, V1 상속 경로), ApiDemoTests 69건 통과. Demo 설문 실화면으로 미선택·선택·키보드 포커스 동시 표시 확인. 방향키·Space 실조작, 화면 읽기 프로그램, DPI 125~200%, 최소 창, VIDEO+QUIZ 실화면은 미확인. 웹 미리보기는 미변경(Front 인계 — 현재 TODO56 이전 V2 표시·"필수 문항" 문구, verify-completion-ux-43은 웹 문구 기준이라 영향 없음).
- 보완(56-10~13, V2에 반영): 원격 후속 TODO(2026-10-18-12)의 별도 버전 제안 대신 V2를 수정. V2 본문 흰색, 문항 카드 표면·라운드·좌우 Padding 제거와 문항 사이 구분선(마지막 제외, BuildQuestions에서 제거), 선택지·링 라운드 6·포커스 9, 선택 방식 안내를 제목 끝 12 크기 보조색 Run으로 이동, Demo "설문 (디자인 평가)"(DEMO-SURVEY-PLAIN, 실제 문구·서식 없음) 추가와 Demo 화면·게이트웨이·테스트 유형 필터(SURVEY_PLAIN) 반영. 주요 파일 추가: Services/DemoPopupDataService.cs, Services/DemoPopupGateway.cs, DemoWindow.xaml, DemoWindow.Settings.cs. 검증: WPF 빌드 경고·오류 0, PopupWindowTests 298건·RichTextTests 102건·ApiDemoTests 69건 통과, 디자인 평가 샘플 실화면 캡처 확인. 웹 미리보기 미변경(Front 인계).
- 상태: 커밋에 포함(커밋 직전 기록). 웹 미리보기 Front 인계 대기.

## 2026-10-18-12 — TODO56 문항 카드 중첩 축소 및 디자인 비교 후속 등록

- 이유: 선택 UX 개선 후 반복되는 둥근 카드 구성과 서식 검증용 데이터가 실제 설문 화면 평가를 어렵게 해 후속 디자인 범위를 구체화.
- 변경: TODO56 기본 원형·사각형 표시기 기준을 제거 방향으로 정정. 56-10~14에 흰 본문·문항 카드 제거·구분선, 선택지 라운드 축소, 제목 옆 선택 안내, 실제 문구/서식 검증 샘플 분리, 기존 디자인 버전 보존과 비교 검증을 추가.
- 주요 파일: docs/design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main 문서·디자인 버전 이력·공유 화면과 요구 범위 대조. 문서만 수정, 코드·빌드·실화면 동작 검증 미실행.
- 상태: 후속 TODO 등록, 구현 대기. 기존 구현 완료 상태는 별도 검증 대상으로 유지.

## 2026-10-18-11 — SURVEY·QUIZ 문항 디자인 버전 관리(V1·V2, 설정으로 선택)

- 이유: 문항 디자인이 다시 바뀌거나 원복될 수 있어 디자인을 버전별로 보존하고 코드 수정 없이 고를 수 있게 함. 선택 위치는 WPF 설정 파일(앱 전체)로 결정, API 계약은 변경하지 않음.
- 변경: SurveyStyles.xaml을 버전별 완결 사본 Views/Contents/SurveyDesigns/SurveyStyles.V1.xaml(8a1db82 시점 무채색, 콘텐츠 배경 흰색·Chip 체크 폭 0 키만 추가)·V2.xaml(2026-10-18-09 색 규칙)로 분리. SurveyDesign.cs(버전 목록·Latest=V2·Current·Normalize·CreateResources) 추가, SurveyPopupView는 XAML 리소스 대신 생성자에서 InitializeComponent 전에 버전 리소스를 넣음. 가로형 서식 선택지 폭 계산은 버전 키 SurveyChipCheckWidth 사용. appsettings.json PopupApi.SurveyDesignVersion(기본 V2, 없거나 모르는 값은 최신 + Debug 로그) 추가, PopupClientSettings·MainWindow 설정 읽기 반영. 관리자 웹 미리보기 SurveyPreview.tsx에 surveyDesigns(V1·V2)와 SURVEY_DESIGN_VERSION 상수, 버전별 Chip 체크 표시. popup-frameWork README 설정 표·디자인 설명 갱신.
- 주요 파일: popup-frameWork/Popup/Views/Contents/SurveyDesign.cs, Views/Contents/SurveyDesigns/SurveyStyles.V1.xaml·V2.xaml(구 SurveyStyles.xaml), SurveyPopupView.xaml(.cs), Models/PopupClientSettings.cs, MainWindow.xaml.cs, appsettings.json, zero-rule-web/main/src/features/RgstPop/SurveyPreview.tsx, scripts/PopupWindowTests/Program.cs, popup-frameWork/README.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. PopupWindowTests 219건 통과(신규 4: 기본 버전 V2, 설정 값 정규화, V1 본문·문항 카드 색, V1 선택 색·Chip 체크 없음). RichTextTests 101건, ApiDemoTests 69건 통과. 웹 tsc 오류 0, verify-completion-ux-43 50건 통과. EXE 옆 appsettings.json에 V1을 지정해 Demo 설문 실화면이 기존 무채색으로 돌아오는 것 확인(확인 후 파일 삭제). 웹 미리보기 V1 브라우저 화면은 미확인.
- 상태: 커밋에 포함(커밋 직전 기록).

## 2026-10-18-10 — TODO56 설문·퀴즈 선택 상태 및 응답 안내 UX 등록

- 이유: 미선택 체크 표시와 단일/복수 선택의 공통 외형으로 인한 혼동을 줄이고 FONT EDIT 적용 후 선택·포커스·응답 안내를 명확하게 할 필요.
- 변경: TODO56에 표시기 분리, 선택 상태 조합, 서식·레이아웃 보존, 선택 방식 안내, 필수 응답/제출 안내, 키보드, 샘플·Front 인계, 회귀 검증을 9개 작업으로 구체화. 기존 흰 카드·회색 배경과 응답·채점·완료 정책 유지. Trello 진행 확정 등록.
- 주요 파일: docs/design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 TODO55·SurveyStyles.xaml·변경 이력과 범위 대조. 문서 작업만 수행했으며 코드 변경·빌드·실화면 검증은 미실행.
- 상태: TODO 작성 완료, 구현 대기. 이 기록은 TODO 문서와 같은 커밋에 포함.

## 2026-10-18-09 — SURVEY·QUIZ 화면 색 규칙 변경(콘텐츠 배경·문항·선택지·선택 강조)

- 이유: 설문·퀴즈 화면 영역별 색 규칙 정리. 콘텐츠 배경 옅은 회색 #F5F6F8, 문항 영역 흰색, 선택지 기본 흰색 + 연한 회색 테두리, 선택된 선택지 강조색 테두리 + 체크 표시, 기본 글자색 #222222. 강조색은 팝업 공통 강조색 #171717, 적용 범위는 SurveyPopupView를 쓰는 SURVEY·QUIZ·VIDEO+QUIZ로 결정.
- 변경: SurveyStyles.xaml 색 토큰(콘텐츠 배경 추가, 문항 카드 #FFFFFF, 글자 #222222, 선택 배경 흰색, 선택 테두리·체크 #171717). 가로형 Chip에 세로형과 같은 체크 표시 추가(선택 전에도 옅게 자리를 차지해 선택 시 폭 변화 없음), 서식 선택지 폭 계산에 Chip 체크 폭 22 반영. PopupWindow가 설문 콘텐츠면 본문 테두리 배경(여백·푸터 포함)을 콘텐츠 배경으로 칠함(영상 창 표면 복사 전). 관리자 웹 미리보기(SurveyPreview·PopupPreview)도 같은 색·Chip 체크로 맞춤. popup-frameWork README 설명 갱신(설계 20·22 문서는 당시 기록으로 유지).
- 주요 파일: popup-frameWork/Popup/Views/Contents/SurveyStyles.xaml, SurveyPopupView.xaml(.cs), popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs, zero-rule-web/main/src/features/RgstPop/SurveyPreview.tsx·PopupPreview.tsx, scripts/PopupWindowTests/Program.cs, popup-frameWork/README.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. PopupWindowTests 215건 통과(신규 12: SURVEY·QUIZ 본문·콘텐츠 배경, 문항 카드, 세로·가로 선택지 기본/선택 색·체크). RichTextTests 101건, ApiDemoTests 69건 통과. 웹 tsc 오류 0, verify-completion-ux-43 50건 통과. Demo 설문 샘플 실화면 캡처로 기본·선택 상태 확인. VIDEO+QUIZ 실화면, 웹 미리보기 브라우저 화면은 미확인.
- 상태: 커밋에 포함(커밋 직전 기록).

## 2026-10-18-08 — 소유자 창 종료 시 팝업 결과의 시청량·다시 보지 않기 누락 수정

- 이유: 소유자 창(MainWindow·DemoWindow)이 닫히면 Win32가 소유 팝업을 함께 파괴해 팝업의 Closing 없이 Closed만 발생. Closing에서 하던 영상 시청량 기록과 "다시 보지 않기" 체크 기록이 빠져 VIDEO_WATCHED·HIDDEN이 CLOSED로 저장되었다(설계 44 결함 1 후속, 이번 변경 이전부터 있던 결함).
- 변경: PopupManager가 Closing 발생 여부를 기록하고, Closing 없이 Closed만 온 경우 Closed 대체 저장 전에 시청량(GetFinalProgress)과 다시 보지 않기 체크(PopupWindow.RecordDoNotShowAgainChoice, internal로 변경)를 읽는다. Closing을 거친 기존 경로는 그대로.
- 주요 파일: popup-frameWork/Popup/Managers/PopupManager.cs, popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs, scripts/PopupWindowTests/Program.cs, version-history/CHANGELOG.md.
- 검증: PopupWindowTests 203건 통과(소유자 종료 VIDEO 시청량 30초·TEXT HIDDEN 신규). 수정 전 VIDEO가 CLOSED(시청량 없음)로 저장되어 실패함을 확인, 체크 기록 호출만 빼도 TEXT가 CLOSED로 실패(변이 확인). ApiDemoTests 69건 통과, WPF 빌드 경고·오류 0. 실제 앱 종료 화면 확인은 미실행.
- 상태: 커밋에 포함(커밋 직전 기록).

## 2026-10-18-07 — TODO55 설문·퀴즈 서식 계약 초안·WPF 표시

- 이유: TEXT 서식을 설문·퀴즈의 제목·설명·문항·선택지로 확장(TODO55). 서버 저장 경로 결정 전이라 계약 초안과 WPF 표시를 먼저 진행.
- 결정: 필드 이름 `<필드>Blocks`(surveyTitleBlocks·descriptionBlocks·titleBlocks·descriptionBlocks·options[].textBlocks), TEXT와 같은 문단·구간 구조. 서식이 없거나 깨지면 일반 문자열. 명세에는 초안으로 표시.
- 변경: 55-1 필드 매핑·우선순위·상한·저장 경로 인계를 TODO55에 기록. WPF DTO·모델·Factory·SurveyPopupView 서식 표시(머리말·문항 제목/설명·선택지, 필수 표시 위치, 접근성 이름 유지, 선택지 폭 제한). Demo 설문 샘플 서식 추가, 옵션 창 `*Blocks` JSON 편집과 저장 시 일반 문자열 파생·상한 검사. 인터페이스 명세 §8.4.1·§9 표(초안), ALL 명세 행 추가.
- 주요 파일: popup-frameWork/Popup/Dtos/Survey*Dto.cs, Models/SurveyQuestion.cs·SurveyOption.cs, Factories/PopupFactory.cs, Views/Contents/SurveyPopupView.xaml(.cs), Services/DemoPopupDataService.cs, DemoOptionsWindow(.Fields).cs, scripts/RichTextTests/Program.cs, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/interfaces/WPF_POPUP_ALL_SPEC.md, docs/design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. RichTextTests 97건(신규 12), ApiDemoTests 69건, PopupWindowTests 197건 통과. 변이 확인(선택지 서식 표시 제거 시 실패). 처음 넣은 VIDEO+QUIZ 머리말 조건은 변이로도 결과가 같아 불필요함을 확인하고 제거(숨김 대상이 일반 문자열 TextBlock뿐). Demo 앱 설문 샘플 실화면 캡처 확인. 서버·관리자 웹·미리보기 미변경, Excel/Word/PDF 미반영(확정 후), MINIMAL 변경 없음.
- 상태: 커밋에 포함(커밋 직전 기록). 55-3·55-4 Front/Server 인계 대기.
- 보완(리뷰 반영): 서식 선택지가 문단에 기본 글꼴·크기·굵기·색을 고정해 bodyFontSize와 선택 강조(굵기·색 트리거)를 상속하지 못하던 문제 수정 — 선택지 문단은 글꼴 속성을 고정하지 않고 Run 지정 서식만 우선. ApplyBodyFontSize 후 문항 제목·설명·선택지 서식 문단의 기울임 여유를 다시 계산하고, 상속 크기가 정해지는 Loaded에서도 재계산. 검증: RichTextTests 101건 통과(신규 4: 크기 상속, 기울임 여유 재계산, 선택 강조 상속·Run 서식 유지, 제목 +4 유지), 변이 확인(상속 해제·재계산 제거 시 각각 실패). 실제 잘림 여부 Windows 화면 확인은 미실행. 커밋에 포함.

## 2026-10-18-06 — TODO54-6~11 Demo 연결·로그·실행 상태·초기화 구분

- 이유: API 모드 연결 입력이 작업 영역을 차지하고 현재 대상·인증 상태가 한눈에 보이지 않음. 로그 종류 구분과 실행 중 상태 표시가 없고 로컬 모드는 진행 중 버튼이 막히지 않음.
- 변경: 연결·인증 설정 접기 영역과 대상·인증 요약(토큰 값 미표시, 적용 시 접힘·입력 오류 시 펼침), 로컬 SSO·로그인 테스트 접기. 로그 `[조회]/[결과]/[로그인]` 구분, HTTP 기록 선택 시 상태·시간 요약, 퀴즈 점수의 결과 줄 통합·점수 상자 조건부 표시. 실행 상태 줄과 로컬 진행 중 실행 버튼 잠금. 초기화 3종 범위 안내. README 2곳 Demo 안내 갱신.
- 주요 파일: popup-frameWork/Popup/DemoWindow.xaml, DemoWindow.xaml.cs, DemoWindow.Api.cs, popup-frameWork/README.md, README.md, scripts/ApiDemoTests/Program.cs, docs/design/54_Demo_UI_UX_상세옵션_정리_TODO.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. ApiDemoTests 69건(신규 6: 로그 구분 판정, 연결 접힘·요약 내용·토큰 미노출, 팝업 표시 중·대기 상태, 로그 구분 표시, 로컬 초기 대기·버튼 활성), RichTextTests 85건, PopupWindowTests 197건 통과. 앱 실행 화면 캡처로 로컬 샘플 실행 중 상태 줄·버튼 잠금·로그 구분 확인. DPI·Tab 순서·키보드 조작 점검은 미실행(54-10 남음).
- 상태: 커밋에 포함(커밋 직전 기록).

## 2026-10-18-05 — TODO54-1~5 Demo 화면 구조·상세옵션 UX 정리

- 이유: Demo 기능 증가로 API 모드 주 실행이 스크롤 아래에 묻히고, 상세옵션이 섞인 그룹·비활성만으로 된 조건 표시·기본값/변경값 구분 부재로 탐색과 입력이 어려움.
- 결정: 모드는 실행 인자 유지 + 화면 표시. 상세옵션은 모달 유지·그룹 탭 정리. 복사본 편집 후 설정 적용 때만 반영, 취소 시 원본 유지. API 수신 원문은 편집하지 않음.
- 변경: 54-1 현행 기능 19개를 유지/통합/접기/이동으로 분류하고 옵션 창 문제·작은 창 문제를 TODO54에 기록. DemoWindow — 모드 배지·전환 안내, 왼쪽 패널 하단 고정 실행 영역(로컬: 샘플 실행·전체 실행·상태 초기화, API: 팝업 조회·미전송 재전송), 안내 문구 정정. DemoOptionsWindow — 그룹 탭 6종, 같은 탭 하위 입력 숨김·다른 탭/모드 의존 입력 비활성+사유, 범위·샘플 기본값 안내, 입력 즉시 검증·오류 위치 이동, 변경됨 표시·변경 개수, 탭별 기본값 복원, 숨김·비활성 입력 미적용. 기본값 기준으로 샘플 원본을 전달.
- 주요 파일: popup-frameWork/Popup/DemoWindow.xaml, DemoWindow.Api.cs, DemoWindow.Settings.cs, DemoOptionsWindow.cs, DemoOptionsWindow.Fields.cs, scripts/ApiDemoTests/Program.cs, docs/design/54_Demo_UI_UX_상세옵션_정리_TODO.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. ApiDemoTests 63건(신규 15), RichTextTests 85건, PopupWindowTests 197건 통과. 변이 확인(숨김 일수 조건부 표시 제거 시 실패). 빌드한 앱을 --demo/--demo --api로 실행해 기본 크기 메인·옵션 창, API 최소 크기(820×600) 화면 캡처 확인 — 처음 캡처에서 최소 크기 상단 문구 겹침을 발견해 모드 안내를 부제 아래로 옮김. Visual Studio가 프로젝트를 열고 있어 테스트·앱은 별도 중간 폴더(obj\cli·bin\cli)로 빌드. DPI·Tab 순서·키보드·실제 팝업 표시 왕복 화면 점검은 54-10에 남김.
- 상태: 커밋에 포함(커밋 직전 기록). 54-6~54-11 남음. 원격 푸시는 별도 확인.

## 2026-10-18-04 — TODO52-2 나중에 보기(showLater·결과 LATER) 추가

- 이유: 회의 확정 요건(나중에 보기는 다음 조회 주기에 다시 조회) 구현. 정합성 검토 결과 TEXT·IMAGE의 CLOSED는 완료 처리라 재표시가 되지 않고, HIDDEN은 hideDays 숨김이라 기존 결과 유형을 재사용할 수 없어 별도 결과 유형과 표시 필드가 필요함.
- 결정: 결과 `resultType=LATER` 신설(HIDDEN·hideDays·showDoNotShowAgain 의미 유지). 버튼 표시는 `showLater`(기본 false, showFooter=true일 때). 모든 유형 적용, 완료 전 닫기 잠금(VIDEO·VIDEO+QUIZ·QUIZ) 중에도 허용. LATER는 영상 시청량을 싣지 않으며 서버의 기존 시청 기록은 유지. 버튼으로 닫으면 다시 보지 않기 체크보다 LATER 우선.
- 변경:
  - DB: `POPUP_NOTICE.SHOW_LATER_YN`(기본 'N')·`CK_POPUP_YN_VALUES`, `WPF_RESULT_RECEIPT.CK_WPF_RESULT_TYPE`에 LATER. 신규 DB용 01 스키마와 기존 DB용 `16_popup_later_oracle.sql`(멱등, 서버 반영 전 실행) 추가.
  - 서버: `WpfResultType.LATER`·요청 검증 문구, `WpfResultProcessor.handleLater`(표시·닫기만 기록, 완료·숨김 없음 → 기존 전달 건 유예로 다음 조회 주기에 재표시). `showLater`를 관리자 저장·조회 DTO, 매퍼, WPF 조회 응답(`WpfPopupItem`)에 연결.
  - WPF: Footer `FooterLaterButton`, `PopupOptions.ShowLater`·`LaterRequested`, `PopupResultBuilder.BuildLater/BuildOnClose`, `WpfResultType.Later`. 잠금 중 닫기 취소를 LATER에서는 적용하지 않고, Overlay 화면 출구로 인정. 닫기가 취소되면 LATER 플래그를 되돌림. Demo 게이트웨이 LATER 처리(완료 없이 유예)·옵션 창 `showLater`.
  - 관리자 웹: 표시 옵션 "나중에 보기" 토글(푸터 끄면 함께 해제), 미리보기 Footer 버튼(설문·일반 공통).
  - 문서: 인터페이스 명세 §6.3·§10.2·§10.4.1(신설)·§10.8·§14, 전체 예제 JSON `showLater`, ALL 명세, 옵션 가이드 §9.1, DB README, TODO52(52-2 반영)·TODO53(53-5 진행). MINIMAL은 최소 제공 범위라 변경하지 않음.
- 주요 파일: db/oracle/01_popup_schema_oracle.sql, db/oracle/16_popup_later_oracle.sql, zero-rule-server/service/core/src/test/java/server/service/core/popup/wpf/WpfPopupDatabaseTest.java, zero-rule-server/(WpfResultType·WpfResultRequest·WpfResultProcessor·WpfPopupItem·PopupResponseDto·PopupEntity·AdminPopupSaveCommand·PopupService·PopupMapper.xml 및 테스트), popup-frameWork/Popup/(PopupWindow.xaml(.cs)·PopupManager·PopupResultBuilder·PopupOptions·PopupFactory·PopupResponseDto·WpfResultDtos·DemoPopupGateway·DemoOptionsWindow.Fields), zero-rule-web/(PopupEditorDialog·PopupPreview·PopupAdmin.ts), scripts/PopupWindowTests/Program.cs, scripts/verify-completion-ux-43.cjs, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/interfaces/WPF_POPUP_ALL_SPEC.md, docs/interfaces/examples/WPF-01-popup-types.json, docs/POPUP_OPTION_GUIDE.md, db/oracle/README.md, docs/design/52·53 TODO.
- 검증: 서버 `:service:core:test` 97건(DB 의존 4건 건너뜀)·`:web:api:test` 37건 통과 — 신규 4건(LATER 유형별 완료 없음·유예·영수증, TEXT CLOSED 대조, LATER 요청 수용, 응답 `showLater` 기본 false·분리). WPF 빌드 경고·오류 0, `scripts/PopupWindowTests` 197건(신규 41: 유형별 표시 규칙, LATER 우선·hideDays/video 미포함, 잠금 VIDEO·VIDEO+QUIZ·Overlay QUIZ에서 LATER 저장 후 닫힘, Overlay 출구 인정), ApiDemoTests 48건 통과. 변이 확인: OnClosing의 LATER 잠금 예외를 빼면 PopupWindowTests 실패. 관리자 웹 `tsc --noEmit` 오류 0, `verify-completion-ux-43` 50건(신규 20) 통과. 인터페이스 명세 JSON 블록 30개·예제 JSON 파싱 통과, `git diff --check` 통과. Visual Studio가 같은 WPF 프로젝트를 열고 있어 기본 obj 빌드가 XAML 생성 파일 충돌로 실패해 테스트는 별도 중간 폴더(`obj\cli`·`bin\cli`)로 빌드함. 실서버 HTTP 왕복·실제 Windows 화면 확인·Excel/Word/PDF 재생성은 미실행.
- 후속(로컬 DB 적용): 로컬 XE(`XEPDB1`, POPUP 계정)에 `16_popup_later_oracle.sql POPUP.` 실행 — 컬럼 추가·제약 2개 재생성 OK, 확인 쿼리 컬럼 1·제약 2. 재실행 시 컬럼 추가 SKIP·나머지 동일 결과로 멱등 확인. 적용 전후 팝업 4건(모두 `SHOW_LATER_YN='N'`)·영수증 12건 유지. `WpfPopupDatabaseTest.nextPopupAndResultRoundTripOnOracle`에 LATER 구간 추가(TEXT LATER 수용·완료/숨김 아님·LATER 영수증·전달 건 유예 1800초·유예 중 같은 팝업 제외·유예 만료 후 새 전달 건으로 재표시). 롤백 전용 실DB 테스트 3건(`PopupQuestionDatabaseTest`·위 메서드·`WpfDeliveredResultDatabaseTest`) 통과(건너뜀 0), 실행 후 영수증 12건·LATER 0건으로 잔여 행 없음. 원격 개발 DB 적용과 커밋 테스트(`queryAndResultAreSerializedPerUserOnOracle`·`WpfApiOracleHttpTest`)는 미실행.
- 후속(원격 개발 DB 적용·장애): 원격 11g XE(`zero-rule` 스키마)에 최초 16 스크립트(`ADD ... DEFAULT 'N' NOT NULL`) 적용 — 컬럼·제약 2개 OK, 팝업 4건·영수증 8건 유지. 롤백 전용 실DB 테스트 중 `PopupQuestionDatabaseTest`·`WpfPopupDatabaseTest` 왕복(LATER 구간 포함)은 통과했으나 `WpfDeliveredResultDatabaseTest`가 `UPDATE POPUP_NOTICE SET ACTIVE_YN = 'N'`에서 ORA-00600 [qkebCreateConstantOpn1]로 세션이 끊김(ORA-17008, 재실행도 동일, 로컬 21c는 통과). 11g의 메타데이터 전용 기본값 컬럼을 CHECK 제약이 참조할 때의 내부 오류로 판단해 16 스크립트를 NULL 허용 추가 → 빈 값 채움 → NOT NULL 순서로 수정. 승인 후 원격 컬럼 재생성 실행(값 확인 가드 → 제약 삭제 → 컬럼 삭제 → NULL 허용 추가 → 채움 0행 → NOT NULL → 제약·주석 재생성): 오류가 났던 `UPDATE POPUP_NOTICE SET ACTIVE_YN = ACTIVE_YN` 1행 성공(롤백), 팝업 4건 모두 'N'·NOT NULL·기본값 'N'. 이후 원격 롤백 전용 실DB 테스트 3건 모두 통과(건너뜀 0), 실행 후 팝업 4·영수증 8·전달 건 0으로 잔여 행 없음. 수정한 16 스크립트를 로컬 XE에 재실행해 컬럼 추가·NOT NULL은 SKIP, 나머지 OK로 멱등 확인. 원격 테스트 실행 시 PowerShell에서 `POPUP_TEST_DB_SCHEMA=''`는 변수가 삭제되어 기본 `POPUP.`이 붙으므로 공백 한 칸(`' '`)으로 지정.
- 후속(산출물 동기화): Excel `WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx` — 공통 시트 showDoNotShowAgain 아래 `showLater` 행 추가(위 행 서식 복사, 아래 병합 범위 이동), RESULT_REQUEST F11 resultType에 LATER·A28 저장 정책에 LATER와 우선순위, 개요 A36 핵심 변경에 TODO52-2, Sample TEXT JSON에 `showLater`. Excel·Word COM은 PowerShell 조기 바인딩이 E_NOINTERFACE로 실패해 Excel은 openpyxl로 수정(TODO53-1과 같은 방식), Word·PDF는 기존 VBScript(늦은 바인딩)로 생성. 검증: 수정 전 사본과 대조해 값 변경은 의도한 4셀+신규 행뿐(공통 시트 32행 이후는 1행 이동 후 동일, 다른 시트 서식 ID 동일), 패키지 파트 구성 동일, 예제 JSON 9개 파싱 통과. Excel 앱 렌더링은 미실행. Word — 표지 편집일 2026-10-18로 갱신 후 `export-interface-word.cjs` 재생성(표 44·제목 121, §10.4.1 추가), `export-interface-pdf.vbs`로 필드·목차 갱신 후 PDF 80쪽 출력. Windows PDF 렌더러로 표지(1쪽)·공통 필드 표 showLater 행(14쪽)·resultType ENUM과 §10.4.1(31~32쪽) 확인. 주요 파일: docs/interfaces/WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx, docs/interfaces/WPF_Popup_API_Interface_v3.7.docx·.pdf, scripts/export-interface-word.cjs.
- 상태: 커밋에 포함(커밋 직전 기록). 로컬 XE·원격 개발 DB 적용 완료. 원격 반영 여부는 원격 브랜치로 확인. 미적용 DB에서도 새 서버 기동은 되지만, `SHOW_LATER_YN`을 참조하는 쿼리(WPF 팝업 조회·관리자 상세·저장)가 실행 시 ORA-00904(부적합한 식별자)로 실패하고, LATER 결과 영수증은 `CK_WPF_RESULT_TYPE` 위반(ORA-02290)으로 거절된다. 관리자 목록은 영향 없음.

## 2026-10-18-03 — 로컬 영상 제공 root 경로를 popup-videos 폴더로 한정

- 이유: 로컬 `popup.video.root`가 기본값 `D:/popup-videos`(로컬 PC에 없는 폴더)에서 `zero-rule-server` 폴더 전체로 바뀌어 있어, 영상 주소에 `popup-videos/` 접두가 필요하고 서버 폴더 아래의 다른 영상 파일까지 제공 대상이 됨.
- 변경: `popup.video.root`를 `D:\work\PopupProject2026\WPF_WindowsPopupWithC_proto\zero-rule-server\popup-videos`로 지정. 영상 주소는 `/p/api/popups/video/demo-video.mp4` 형태가 됨. 이 경로는 로컬 PC 기준 절대경로라 반입본·다른 PC에는 그대로 맞지 않음.
- 주요 파일: zero-rule-server/app/src/main/resources-local/application-local.yml, version-history/CHANGELOG.md. 영상 폴더 `zero-rule-server/popup-videos/`(demo-video.mp4)는 Git 미추적 상태로 유지.
- 검증: 지정 폴더 존재와 demo-video.mp4 확인. 서버 기동·영상 HTTP 요청은 미실행.
- 상태: 이 PC 전용 절대경로라 yml 변경과 영상 폴더는 커밋하지 않음(작업 트리에만 유지). 이 기록만 2026-10-18-04 커밋에 함께 포함.

## 2026-10-18-02 — TODO55 SURVEY·QUIZ FONT EDIT 확장 등록

- 이유: TEXT 전용 서식 편집을 설문·퀴즈의 제목·설명·문항·선택지 표시까지 확장할 필요.
- 변경: 문단·Run 공통 모델/변환/팔레트 재사용, 필드별 계약, WPF 표시·선택지 레이아웃·답변/채점 분리·VIDEO+QUIZ 회귀·Demo/문서 갱신을 TODO55로 등록. Front/Server 인계와 WPF 검증 책임을 구분하고 과거 DB 컬럼 신설 가정을 최신 콘텐츠 JSON 계약으로 재검토하도록 명시.
- 주요 파일: docs/design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main 및 Trello 중복 확인, TODO28 §10 확장 기록과 대조. 계획 등록으로 기능 코드·DDL 변경 및 실행 테스트 없음.
- 상태: 진행 확정·구현 대기. 커밋에 포함.

## 2026-10-18-01 — TODO54 Demo UI/UX 및 상세옵션 정리 계획

- 이유: Demo 기능 증가에 따라 로컬 샘플·실제 API 작업 흐름과 상세옵션 탐색·입력 UX를 정리할 필요.
- 변경: 현행 화면 조사, 모드 구분, 상세옵션 그룹/조건부 표시/기본값 복원, 인증·요청응답·실행 상태·초기화 구분, 실제 화면 검증 및 문서 갱신을 TODO54로 등록. TODO51·52·53과 책임 범위를 연결.
- 주요 파일: docs/design/54_Demo_UI_UX_상세옵션_정리_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main TODO 번호·작업 규칙 및 Trello 카드 중복 확인. TODO 문서 등록으로 코드 변경·빌드·화면 테스트 미수행.
- 상태: 진행 확정·구현 대기. 커밋에 포함.

## 2026-10-17-08 — 20261017 폐쇄망 반입본 생성

- 이유: 20261013 반입 이후의 단건 조회·결과 API(설계 35)와 TEXT 통합·복구 동시성·완료 조건 UX·Overlay 키보드 종료·TEXT 들여쓰기·구조 정합성 정리·API 호출형 Demo(설계 37~53)를 폐쇄망에 반입하기 위해 새 반입본 필요. 서버·웹·WPF 계약이 함께 바뀌어 네 묶음을 모두 새로 만듦.
- 변경: main(9924a52 소스 기준)에서 scripts/export-offline-package.ps1(-IncludeMockSso -NoZip)로 offline-export/20261017 생성 후 기존 번호 체계(1-zero-rule-server·2-zero-rule-web·3-popup-frameWork·4-docs)로 정리. 서버 A 88·M 7, 웹 A 9·M 11·D 2, WPF 소스 91, 문서 91 파일. MockSso 개인 launchSettings 제외, DELETE-SINCE-20260930.txt 누적 삭제 목록 갱신(20261013 이후 신규 삭제 5건). README-IMPORT.md에 20261013 이후 변경·DB 15 적용 순서(서버 교체 전)·동시 배포 필요성, 서버·웹·WPF 묶음별 TODO 패치노트(README-PATCH-*.md) 작성. 묶음별 TAR·통합 TGZ·SHA256 생성.
- 주요 파일: offline-export/20261017/ (Git 제외), .offline-verify/package-20261017.ps1·finalize-20261017.ps1 (Git 제외), version-history/CHANGELOG.md.
- 검증: 반입본 WPF 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·폴더형 publish와 -SingleFile publish 성공(popupSample.exe 1개, 91,682,638바이트). TAR별 파일 수·경로 대조, 제외 대상(bin·obj·publish·node_modules·EXE/DLL/PDB·검증 하네스·개인 launchSettings) 누출 검사, TGZ 해제 후 TAR 체크섬 대조, 데모 영상 해시 대조. 소스 내 개인 PC 절대경로 없음. 폐쇄망 기존 소스 병합·빌드, 폐쇄망 DB 스크립트 적용, 폐쇄망 PC 실행은 미실행.
- 상태: 반입본 생성·검증 완료. 이 기록은 커밋에 포함, 원격 반영.

## 2026-10-17-07 — TODO53-10 서버·Oracle DB 의존 테스트 로컬 실행

- 이유: 등록 전 기준선에서 건너뛴 DB 의존 테스트(서비스 4건)와 Oracle HTTP 통합 테스트를 준비된 로컬 개발 DB에서 실행해 게시중단 후 결과 수용·동시성·중복 제출·거절 롤백 동작을 확인할 필요.
- 변경: 코드 변경 없음. `db/oracle/README.md` 실DB 테스트 절차대로 로컬 XE(`XEPDB1`, `POPUP` 스키마)에서 실행하고 TODO53-10에 결과·커밋 범위·정리 결과를 기록.
- 주요 파일: docs/design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md, version-history/CHANGELOG.md.
- 검증: 롤백 전용 `PopupQuestionDatabaseTest`·`WpfPopupDatabaseTest.nextPopupAndResultRoundTripOnOracle`·`WpfDeliveredResultDatabaseTest` 통과. 실제 커밋하는 `WpfPopupDatabaseTest.queryAndResultAreSerializedPerUserOnOracle`·`WpfApiOracleHttpTest` 4건 통과. 서버 팝업 범위 `:service:core:test` 95건(건너뜀 0)·`:web:api:test` 35건 통과. 커밋 테스트는 E1002·E1003의 WPF 상태만 앞뒤로 정리하며, 실행 전후 사용자별 상태·전달 건·영수증 행 수와 팝업 수가 같음을 조회로 확인. DDL 재적용 없음. 원격 개발 DB 재실행은 미실행.
- 상태: 로컬 검증 완료. 커밋에 포함, 원격 반영.

## 2026-10-17-06 — TODO50-D3·D4 VIDEO+QUIZ 머리말 중복·시청 비율 판정식 통일 (TODO53-16)

- 이유: 재현 결과 VIDEO+QUIZ에서 서버가 같은 제목·설명을 videoTitle·surveyTitle·description으로 보내 WPF는 제목·설명이, 관리자 미리보기는 설명이 두 번 표시됨. 일반 VIDEO만 시청 비율을 double로 비교해 decimal 비율이 기준 바로 아래일 때 서버(4자리 내림, 미완료)와 달리 닫기를 허용하는 경계 불일치가 있음.
- 변경: WPF 공통 `VideoCompletion`(서버 `PopupService`와 같은 `min(watched,duration)/duration` 4자리 내림, 1 상한, 기준 0~1 보정)을 추가해 일반 VIDEO 닫기 판정·VIDEO+QUIZ 잠금 해제·Demo 결과 판정에 사용. Demo의 VIDEO+QUIZ 시청 미달 code를 서버와 같은 `WPF_INVALID_VIDEO`로 정정. VIDEO+QUIZ 퀴즈 머리말은 영상 영역에 보인 제목·설명과 같으면 생략하고 값이 다르거나 영상 설명이 숨김이면 표시. 관리자 미리보기도 같은 설명 생략 규칙 적용(SurveyPreview는 빈 설명이면 줄을 그리지 않음). 계약서·ALL·미리보기 정합 문서·Excel 메모에 반영하고 Word/PDF 재생성(JSON 필드 변경 없음). TODO50 D3·D4 판단 결과와 TODO53-16 기록.
- 주요 파일: popup-frameWork/Popup/Services/VideoCompletion.cs, popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs, popup-frameWork/Popup/Views/Contents/VideoQuizPopupView.cs, popup-frameWork/Popup/Views/Contents/SurveyPopupView.xaml.cs, popup-frameWork/Popup/Services/DemoPopupGateway.cs, zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, zero-rule-web/main/src/features/RgstPop/SurveyPreview.tsx, scripts/PopupWindowTests/Program.cs, scripts/verify-completion-ux-43.cjs, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/interfaces/WPF_POPUP_ALL_SPEC.md, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/interfaces/WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx, docs/interfaces/WPF_Popup_API_Interface_v3.7.docx·.pdf, scripts/export-interface-word.cjs, docs/design/50·53 TODO.
- 검증: WPF 빌드 경고·오류 0. `scripts/PopupWindowTests` 156건(신규 34: 경계 10케이스×공통 식·일반 VIDEO, VIDEO+QUIZ 잠금·Demo 판정/code, 머리말 3가지·단독 QUIZ), RichTextTests 85건, ApiDemoTests 48건, 로컬 BehaviorTests 1014건·RecoveryTests 158건 통과. 관리자 웹 `tsc --noEmit` 오류 0, 하네스 완료 UX 30(신규 3)/IMAGE 34/TEXT 40/문항 템플릿 7건 통과. 변이 확인: 일반 VIDEO를 double 비교로 되돌리면·WPF 머리말 생략을 빼면·미리보기 설명 생략을 빼면 각각 실패. Word 재생성 후 PDF 80쪽 렌더링 확인. MINIMAL은 해당 동작 서술이 없어 변경 없음. 실제 Windows 화면 육안 확인은 미실행(TODO53-12·53-13).
- 상태: 커밋에 포함, 원격 반영.

## 2026-10-17-05 — TODO53-1·53-2 Excel·Word/PDF 인터페이스 산출물 동기화

- 이유: Excel 정의서와 Word/PDF 산출물이 2026-10-13 생성본에 머물러 이후 설계 43·44·48·49·50의 계약 보완(`textBlocks[].indent`, 표시 방어, `isRequired`, `durationSeconds` 최소값, 결과 code)과 어긋남.
- 변경: Excel — TEXT 시트에 `textBlocks[].indent` 행 추가, textBlocks 한도·`runs[].color` 표시 방어·동작 메모(`popups[]`→`popup`, 설계 48 표시 방어 요약) 보완, VIDEO 메모 `popup` 최상위로 정정, 공통 `sizeMode` AUTO는 WPF 전용 명시, SURVEY_QUIZ `isRequired`를 `Y(서버가 항상 true/false 제공)`로 정정, RESULT_REQUEST `durationSeconds` 기본값 없음·0.001 이상, RESULT_RESPONSE code 비고를 status별 전체 code로 보완, Sample TEXT에 `textBlocks`(indent 1) 추가. 삭제 이력으로 남긴 개요 `popups[]`는 유지. 계약서 머리에 2026-10-14~15 보완 항목 추가(버전 번호 3.7 유지), Word 표지 문서 편집일 갱신 후 docx·PDF 재생성. TODO45-7·48·49·50의 산출물 재생성 남은 항목 표기를 정리하고 TODO53 53-1~3 결과·상태 기록.
- 주요 파일: docs/interfaces/WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx, docs/interfaces/WPF_Popup_API_Interface_v3.7.docx, docs/interfaces/WPF_Popup_API_Interface_v3.7.pdf, docs/interfaces/POPUP_INTERFACE_SPEC.md, scripts/export-interface-word.cjs, docs/design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md, docs/design/45·48·49·50 TODO, version-history/CHANGELOG.md.
- 검증: 서버 Java code 상수와 계약서 code 표 대조(`WPF_INVALID_HIDE_DAYS`는 서버 미발생으로 계약서와 일치). Excel 변경 셀 재확인, JSON 예제 셀 8개 파싱 통과, 패키지 파트 비교로 손실 없음 확인(Excel 앱 렌더링은 Excel 미설치로 미실행). Word 생성 표 44·제목 120개, Word 자동화로 필드·목차 갱신 후 PDF 79→80쪽 출력. Windows PDF 렌더러로 전 쪽 이미지화해 표지·목차·문서 안내·TEXT indent 표·결과 code 표·부록 예제를 확인, 잘림 없음. ALL/MINIMAL은 기능 변경이 없어 내용 변경 없음.
- 상태: 문서·산출물 동기화 완료. 커밋에 포함, 원격 반영. 기능 코드·API·DB 변경 없음.

## 2026-10-17-04 — TODO53-3 미결 사항·TODO 상태 표기 정정

- 이유: 설계09 미결 표와 일부 TODO 상태 줄이 현재 코드·확정 요건과 달라 남은 작업 판단을 흐림.
- 변경: 설계09 미결 13(WebView2 SDK 버전 불일치)을 해소로 정정 — csproj·`OFFLINE_WPF_BUILD.md`·오프라인 캐시/반입 nupkg 모두 `1.0.3124.44`. 미결 4·19(반복/기간 노출)를 확정 요건 TODO52-1·TODO53-4로 연결. TODO52 상태를 52-4 반영·나머지 상세 계약 대기로 정정. TODO51 구현 전 구조 설명에 당시 기록임을 명시. 체크가 모두 끝났으나 실서버 HTTP·실화면 확인이 남은 TODO32·33에 상태 줄 추가.
- 주요 파일: docs/design/09_전환계획_및_미결사항.md, docs/design/32_RESULT_responseStartedAt_제거_TODO.md, docs/design/33_RESULT_응답_score판정값_제거_TODO.md, docs/design/51_DEMO_API_수동호출_팝업검증_TODO.md, docs/design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md, version-history/CHANGELOG.md.
- 검증: csproj·빌드 가이드·`.offline-cache`·`offline-export` nupkg 버전 대조. 전체 체크 완료 TODO(27·32·33·36·37·43·48·50)의 상태 줄과 남은 확인 항목을 대조. 문서 공백 검사 수행. 문서 작업으로 빌드·테스트 재실행 없음.
- 상태: 커밋에 포함, 원격 반영. TODO53 기록은 2026-10-17-05 커밋에 포함.

## 2026-10-17-03 — TODO53 프로젝트 검증 후속 작업 등록

- 이유: 구조·TODO 반영 점검에서 확인한 문서 불일치와 남은 구현·통합 검증·정책 결정을 기존 과제에 연결해 추적할 필요.
- 변경: 후속 TODO53에 18개 항목과 선행 조건·완료 증거·실행 순서를 등록. Excel/Word/PDF 및 상태 문서 정합, TODO52 확정 기능, API Demo·인증/복구·Oracle·관리자 편집·WPF 화면·영상·성능·로고, 재현 필요 항목과 기존 보류 정책을 구분. 폐쇄망 검증은 범위에서 제외하고 TODO17·26 폐기 및 TODO35·45·47 정책 보류는 유지. docs 색인과 루트 README 설계 범위 갱신.
- 보완: `net10.0-windows10.0.17763.0` 대상 WPF 폐쇄망 빌드·의존 패키지 검증 완료 확인에 따라 TODO14의 관련 3개 체크 항목을 완료로 정정하고, TODO53에서 재검증 대상을 제외한다는 점과 오프라인 빌드 가이드의 완료 상태를 명시. 타깃 프레임워크 설정은 유지.
- 주요 파일: docs/design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md, docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md, OFFLINE_WPF_BUILD.md, docs/README.md, README.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO·현재 코드 기준 5242f7d의 점검 결과와 대조. 등록 전 기준선은 WPF 빌드 경고·오류 0, WPF 회귀 122/85/48건, 웹 타입 검사 및 하네스 27/34/40/7건, 서버 서비스 91건 통과·DB 의존 4건 건너뜀, 서버 API 35건 통과. 문서 등록 후 링크·항목 번호·공백 검사 수행. 문서 작업으로 빌드·테스트 재실행 없음. 실제 서버/DB/화면 후속 검증은 미실행.
- 검증 보완: WPF 폐쇄망 검증 완료 상태는 개발자 확인에 근거해 기록. 이번 작업에서 폐쇄망 restore/build를 재실행하지 않았으며 서버·웹·SSO·재부팅 검증 완료로 확대하지 않음. 문서 공백 검사 수행.
- 상태: TODO 등록 완료(커밋 `c360b2c`, 원격 반영). 후속 진행은 2026-10-17-04·05 참고. 기능 코드·API·DB 변경 없음.

## 2026-10-17-02 — TODO52-4 배경 차단 기본값 확인

- 이유: 확정 요건 '모든 팝업은 백그라운드 동작을 차단'을 `useBackgroundOverlay` 기본값 true 보장으로 반영하기로 범위를 확정해, 계층별 기본값을 대조하고 회귀 검증을 추가.
- 변경: 코드 변경 없음(WPF DTO·PopupOptions·서버 `DEFAULT_USE_OVERLAY`·관리자 웹 기본값이 모두 true). 명시 `false`는 정상 명시값으로 유지. `scripts/PopupWindowTests`에 필드 생략 응답의 유형별 Overlay 표시·해제와 명시 false 유지 검사 추가. 설계 52의 52-4에 범위·대조 결과 기록.
- 주요 파일: scripts/PopupWindowTests/Program.cs, docs/design/52_*, version-history/CHANGELOG.md.
- 검증: `scripts/PopupWindowTests` 122건 통과(25건 추가, DTO 기본값을 false로 바꾸면 실패 확인 후 원복). WPF 빌드 경고·오류 0. 서버 기본값은 기존 `PopupActionOptionsTest` 근거(이번에 재실행하지 않음). 실화면 다중 모니터 확인은 미실행.
- 상태: 커밋에 포함, 원격 반영.

## 2026-10-17-01 — TODO51 API 호출형 Demo 구현

- 이유: 개발계/검증계 실제 API의 요청·응답을 Demo 화면에서 확인하고 기존 WPF 팝업·결과 전송 경로로 샘플을 검증하기 위해 설계 51 구현.
- 변경:
  - 실행 모드: `LaunchArguments` 추가(`-`/`--`·대소문자 무시). `-Demo -Api`는 API Demo, `-Demo`/`--demo`는 기존 인메모리 Demo, `-Api` 단독은 무시. `PopupClientSettings.DemoApi`(인자 전용), `MainWindow.ApiDemoSettings`, App의 `--show-main` 판정도 같은 파서 사용.
  - API Demo 화면(`DemoWindow.Api.cs`, `DemoWindow.xaml` `ApiPanel`): Base URL·인증 방식(로그인 JSON 후 토큰/토큰 직접 입력/헤더 없음)·X-Dev-User-Id·단건 조회 요청 JSON 입력, `연결 적용`·`로그인`·`팝업 조회`·`미전송 결과 재전송`. 수동 조회만 하고 자동 폴링·nextStatus 연속 조회 없음, 호출 중·표시 중 버튼 잠금. 인메모리 전용 조작은 숨김. 트레이 `팝업 다시 조회`를 `RefreshFromTray`로 실제 조회에 연결.
  - HTTP 관찰: `HttpExchangeRecorder`(HttpClient 안쪽 DelegatingHandler)로 실제 요청·응답·소요 시간·오류 기록, 응답 본문 종류와 오류 단계(HTTP·통신·시간 초과·426·응답 해석·팝업 생성) 구분, Authorization·accessToken 기본 마스킹(화면 평문 표시 선택), 파일 로그 없음.
  - 공통 경로 재사용: `PopupApiService.GetNextPopupAsync(JsonElement)`·`BaseUrl`, `WpfLoginClient.LoginAsync(JsonElement)` 오버로드, `DemoApiAuthHeaderProvider`(로그인 방식 401 시 같은 본문으로 1회 재로그인), `PopupResultQueue.CountPending()` 추가. 결과 큐 파일을 연결(Base URL·인증 방식·인증 대상·X-Dev-User-Id) 해시별로 분리하고 미전송이 있으면 연결 변경 전 확인.
  - 검증 프로젝트 `scripts/ApiDemoTests` 추가(로컬 모의 HTTP 서버), `.gitignore`에 빌드 결과 제외.
  - 문서: 설계 51 상태·구현 결과, `popup-frameWork/README.md` "API Demo", 루트 README, ALL 정의서 5절 실행 행. MINIMAL은 검토 결과 변경 없음(개발 검증 도구, 외부 제공 범위 유지).
- 주요 파일: popup-frameWork/Popup/(Services/LaunchArguments.cs, Services/HttpExchangeRecorder.cs, Services/Auth/DemoApiAuthHeaderProvider.cs, Services/Auth/WpfLoginClient.cs, Services/PopupApiService.cs, Services/PopupResultQueue.cs, Models/PopupClientSettings.cs, MainWindow.xaml.cs, App.xaml.cs, DemoWindow.xaml(.cs), DemoWindow.Api.cs), scripts/ApiDemoTests/, .gitignore, docs/design/51_*, docs/interfaces/WPF_POPUP_ALL_SPEC.md, popup-frameWork/README.md, README.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. `scripts/ApiDemoTests` 48건 통과(조회 본문 오버로드를 되돌리면 실패 확인). 회귀: `scripts/PopupWindowTests` 97건, `scripts/RichTextTests` 85건, 로컬 행동 검증 1014건·복구 검증 158건 통과. API Demo 화면은 오프스크린 렌더링으로 배치 확인. 개발계/검증계 실제 서버 호출·실제 화면 조작 확인은 미실행.
- 상태: 개발계/검증계 확인(51-9) 대기. 커밋에 포함, 원격 반영.

-16-02 — TODO52 회의 확정 요건 반영 계획

- 이유: 최종 회의 요건의 미확정 분류를 정정하고 기존 Trello 제안과 중복 없이 구현 작업을 연결.
- 변경: 게시 시간·매일/요일 반복·다음 조회 주기 나중에 보기·닫기와 제출 동일 취급·전체 팝업 백그라운드 차단·선택지 개수 제어 및 TEXT 우선 인계를 진행 확정 TODO52로 등록. 요건 승인과 API 상세 계약 수신을 구분하고 WPF/Front/Server 책임을 명시.
- 주요 파일: docs/design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md, version-history/CHANGELOG.md.
- 검증: 회의록 및 확정 정정 내용, Trello 제안/관련 TODO, 최신 main 번호와 작업 규칙 대조. 문서 작업으로 빌드·실행 테스트 미수행.
- 상태: 진행 확정·구현 대기. 코드·API·DB 및 구현 명세 변경 없음. 커밋에 포함.

## 2026-10-16-01 — TODO51 API 호출형 Demo 수동 요청·응답 검증 등록

- 이유: 개발계/검증계의 실제 API 요청·응답을 Demo 화면에서 확인하고 기존 WPF 팝업·결과 전송 경로로 샘플을 검증할 필요.
- 변경: -Demo -Api 진입, 요청 JSON·URL·인증 입력, HTTP 요청/응답 표시, 실제 단건 팝업 렌더링·결과 전송, 수동 조회·자동 폴링 OFF, ID 재사용·실패 복구·기존 Demo 회귀 및 WPF 담당 범위의 검증 기준을 TODO51로 등록. Trello 진행 확정 카드와 구현 체크리스트 연결.
- 주요 파일: docs/design/51_DEMO_API_수동호출_팝업검증_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main의 TODO 번호·작업 규칙·App/MainWindow/DemoWindow·IPopupGateway 구조 및 Trello 열린 카드 대조, 문서 내용·공백 확인. 문서 등록으로 빌드·실행 테스트 미수행.
- 상태: TODO 등록·구현 대기. 기능 코드·API·DB 변경 없음. 커밋에 포함.

## 2026-10-15-13 — TODO43 관리자 미리보기 완료 조건 버튼 UX 정합

- 이유: 관리자 미리보기가 일반 VIDEO 완료 전 닫기 차단·사유 문구, VIDEO+QUIZ 잠금 기준 %, QUIZ 오답 번호, 보조 닫기 규칙을 재현하지 않아 WPF(설계 43)와 다름.
- 변경: `PopupPreview.tsx`에 일반 VIDEO 시청 비율 슬라이더(정수 %)를 두어 `allowCloseBeforeComplete=false` 미달 시 Footer 버튼 비활성·사유 문구·도달 후 활성 재현, VIDEO+QUIZ 잠금 문구·본문 안내를 WPF와 같은 형식(기준 % 포함), QUIZ 미달 표시에 틀린 문항 번호, 보조 닫기 표시 규칙(VIDEO+QUIZ 완료 전 닫기 허용, QUIZ 미달 후 Overlay 꺼짐, `showFooter=false` 숨김), 사유 문구 `role="status"`·`aria-live`, 비활성 버튼 `aria-describedby`. 미리보기 대조 문서 갱신. 검증 하네스 `scripts/verify-completion-ux-43.cjs`(+entry) 추가.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, scripts/(verify-completion-ux-43.cjs, verify-completion-ux-43-entry.tsx), docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/43_*, version-history/CHANGELOG.md.
- 검증: `tsc --noEmit` 통과, eslint 오류 없음, `verify-completion-ux-43.cjs` 27건·`verify-image-preview.cjs` 34건·`verify-rich-text-49.cjs` 40건·`verify-question-template-picker.cjs` 7건 통과(headless Edge). 실제 관리자 화면 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-12 — TODO43·44 완료 조건 버튼 UX와 Background Overlay 키보드 종료 차단(WPF)

- 이유: 완료 조건 미달 상태가 버튼에서 드러나지 않고(일반 VIDEO는 누른 뒤 MessageBox), 화면에 닫을 수단이 없는 상태가 있으며, Background Overlay를 켜도 Alt+F4 등으로 바로 닫혀 강제 표시 의미가 약했음. 또 앱 종료·로그오프 중 미완료 VIDEO 결과가 사라지고, 팝업 생성 실패 시 Overlay가 남는 결함이 있었음. 결정: 버튼은 비활성 + 사유 표시, 보조 닫기는 정책상 허용될 때만, Overlay=true일 때 키보드 강제 종료 차단, Esc는 무시.
- 변경:
  - TODO43: `PopupWindow.RefreshFooterState()`로 푸터 상태 일원화. 일반 VIDEO(`allowCloseBeforeComplete=false`) 미달 시 닫기 버튼 비활성 + "영상 N% 시청 · 기준 M% 이상 시청하면 닫을 수 있습니다"(내림 표시), 도달·재생 실패 시 활성, MessageBox 삭제. VIDEO+QUIZ 잠금 중 제출·다시 보지 않기만 비활성하고 시청 사유 문구 표시, 해제 후 첫 문항 포커스. 사유 HelpText·LiveSetting. QUIZ 미달 안내에 틀린 문항 번호(`QuizGrader.Result.IncorrectQuestionNumbers`, 결과 계약 변경 없음). 보조 닫기 버튼(VIDEO+QUIZ는 완료 전 닫기 허용 또는 재생 실패, 영상 없는 QUIZ는 미달 1회 후 Overlay 꺼짐일 때, `showFooter=false`면 숨김).
  - TODO44: 앱이 시작한 닫기(`CloseByApp`)와 앱 종료만 허용하고 Overlay 켜짐에서는 Alt+F4·시스템 메뉴 닫기·외부 WM_CLOSE 취소. 화면에 닫기·제출 수단이 없으면 키보드 닫기를 막지 않음(교착 방지). Esc 무시 확정. 앱 종료·로그오프(`OnSessionEnding` → `BeginExit`) 중에는 취소하지 않고 결과(VIDEO_WATCHED·시청량 포함)를 저장, Closed 시점 재확인. 팝업 생성·표시 실패 시 Overlay 정리 후 예외 재전파. 창 Title을 팝업 제목으로, 첫 포커스를 본문 입력에(푸터 주 버튼 기본 포커스·IsDefault는 다른 작업 중 Enter 오입력 위험으로 미적용). 오래된 주석 정정.
  - 문서: 설계 43·44(결정·구현·검증·남은 항목), ALL 정의서 설계 43·44 절, 계약서 동작 설명, 옵션·사용자 가이드, MINIMAL의 Alt+F4 문장 정정(범위 확장 없음).
- 주요 파일: popup-frameWork/Popup/(Views/Windows/PopupWindow.xaml(.cs), Views/Windows/PopupStyles.xaml, Views/Contents/(VideoPopupView.xaml.cs, VideoQuizPopupView.cs, SurveyPopupView.xaml.cs), Services/QuizGrader.cs, Models/SurveySubmission.cs, Managers/PopupManager.cs, App.xaml.cs), scripts/PopupWindowTests/, docs/design/(43_*, 44_*), docs/interfaces/(WPF_POPUP_ALL_SPEC.md, POPUP_INTERFACE_SPEC.md, WPF_POPUP_MINIMAL_SPEC.md), docs/POPUP_OPTION_GUIDE.md, docs/POPUP_USER_OPTION_GUIDE.md, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. `scripts/PopupWindowTests` 97건 통과(74건 추가 — 비활성·사유·보조 닫기 규칙, Overlay 켜짐 Alt+F4 키·SendMessage WM_CLOSE/SC_CLOSE·외부 Close 취소, 출구 없을 때 허용, Esc 무시, 종료 중 결과 저장(PopupManager 연결), Overlay 정리 — 결함 1·2 보완을 되돌리면 실패 확인). `scripts/RichTextTests` 85건, 로컬 행동 검증 1014건(새 동작에 맞춰 기대 수정)·복구 검증 158건 통과. 실제 Windows 화면·Alt+Space 메뉴·다중 모니터·실제 로그오프·스크린리더 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-11 — TODO50-C 문서·계약 정합 정리

- 이유: 설계 25·35·37·48·49와 계약 3.7 이후 바뀐 동작이 일부 설계·가이드·명세에 반영되지 않았거나 문서끼리 다르게 적혀 있어 코드 기준으로 정합성 보완.
- 변경: 설계 03·09·19·29에 설계 35(단건 조회·결과) 대체 표기와 뒤집힌 결정(serverTime·userId 제거) 연결, 설계 28 상태 줄과 WPF 표시 규칙(설계 48) 표기. 옵션 가이드 Header 높이 48 → 40, TEXT·IMAGE 구성 설명(이미지 클릭 링크 삭제), FULLSCREEN을 주 모니터 기준으로 통일(ALL·사용자 가이드 포함). 사용자 가이드 ORIGINAL 설명과 과거 FIXED 값 처리(관리자 화면만 ADAPTIVE로 불러오며 DB는 06 스크립트로 정리). MINIMAL의 폐기 키 `ImageWidth/ImageHeight` 정정, ALL 4.4에 SurveyTitle·Description, 4.5에 VideoEnabled 행 추가. 문항 isRequired(서버가 항상 제공)·선택지 value(선택) 필수 여부를 계약서·ALL·MINIMAL에서 통일, 계약서 durationSeconds를 서버 검증(0.001 이상)과 일치, §15.1 TEXT 예시에 indent 반영. README 설계 범위 01~50·검토 문서 목록, 오프라인 빌드 Demo 미디어(저장소 포함·EXE 내장) 안내, 10-13 검토 문서의 TODO35 상태 보완. 설계 50 상태를 `정리 구현 완료 · 실화면 확인 대기`로 갱신하고 남은 항목 정리. 이번 날짜 항목의 상태를 원격 반영으로 갱신.
- 주요 파일: docs/design/(03_*, 09_*, 19_*, 28_*, 29_*, 50_*), docs/POPUP_OPTION_GUIDE.md, docs/POPUP_USER_OPTION_GUIDE.md, docs/interfaces/(POPUP_INTERFACE_SPEC.md, WPF_POPUP_ALL_SPEC.md, WPF_POPUP_MINIMAL_SPEC.md), docs/reviews/20261013_*, docs/README.md, README.md, OFFLINE_WPF_BUILD.md, version-history/CHANGELOG.md.
- 검증: 문서 변경만 수행. 각 정정 값은 코드(PopupWindow.xaml HeaderRow 40, PopupWindow FULLSCREEN 주 모니터 우선, PopupQuestionDto `boolean isRequired`, WpfResultRequest `@DecimalMin("0.001")`, SurveyPopupContentDto 필드)와 대조. Word·Excel 산출물 재생성은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-10 — TODO50-B 서버 불필요 코드 정리와 주석 정정

- 이유: 설계 18·35·37 이후 도달하지 않는 분기, 읽지 않는 필드·보조 조회, 이관이 끝난 일회성 도구와 목록 시절 주석이 남아 있어 정리(삭제 전 MyBatis XML·리플렉션·HTTP 직렬화·다른 모듈 참조 확인, DB 스키마 변경 없음).
- 변경:
  - 삭제: `WpfPopupService`의 도달 불가 `WPF_INVALID_HIDE_DAYS` 판정(계약서 code 표를 "현재 발생하지 않음"으로 정정, Demo 게이트웨이도 `WPF_INVALID_RESULT`로 맞춤), `PopupService.loadQuestions` admin 인자, `contentTitleKey` 도달 불가 분기, `PopupEntity.useYn`과 매퍼 `ACTIVE_YN AS USE_YN`, `WpfPopupDelivery.open()`, `PopupQuestionEntity` 11인자 생성자, `PopupHideResponseDto`와 `selectHiddenUntil`·`selectVideoCompletedAt` 보조 조회(결과 DTO는 HTTP 응답이 아니라 필요한 값만 유지), `WpfResultItemResponse` 미사용 필드, `ImageContractMigration`·전용 테스트·gradle 태스크(이관 완료, 조회 변환은 유지).
  - 보정: 관리자 크기 검사의 popupType 비교를 `normalizeUpper`로 일관화.
  - 유지·주석 정정: `selectStatus`·`WpfUserPopupStatus`(테스트 검증용).
  - 주석·문서 정정: 목록·WPF-01 표현, LINK_URL 삭제 후 컬럼 수, 결과 유형 설명, QUIZ 정답 키 전달, 컨트롤러 날짜 설명, API_REQUEST_LOG 실제 기록 범위, 02 샘플 SQL 조회 방식, db/oracle README 실DB 테스트 명령(커밋하는 테스트 구분), 11 이관 문서에 도구 제거·복원 커밋, 이중 인코딩으로 깨진 한글 주석 7개 파일 복원.
- 주요 파일: zero-rule-server/(service/core, domain, repo/core, base, web/api, app/src/test), db/oracle/(02_popup_sample_oracle.sql, 10_zero_rule_common_schema_oracle.sql, 11_IMAGE_CONTRACT_TRANSITION.md, README.md), popup-frameWork/Popup/Services/DemoPopupGateway.cs, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/50_*, version-history/CHANGELOG.md.
- 검증: `compileJava compileTestJava` 성공. `:service:core:test` popup 95건 중 91 통과·실패 0·skip 4(DB 환경변수 미설정), `:web:api:test` popup 35건 통과, 로컬 XE 롤백 전용 DB 테스트 3건(`WpfPopupDatabaseTest` 왕복, `WpfDeliveredResultDatabaseTest`, `PopupQuestionDatabaseTest`) 통과. 커밋하는 동시성 테스트·HTTP 왕복 테스트는 미실행. Demo 변경 후 로컬 행동 검증 1012건 통과.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-09 — TODO50-B WPF 불필요 코드 정리와 주석 정정

- 이유: 설계 25·35·18 이후 동작하지 않는 그룹·동시 표시 경로, 값을 넣지 않는 옵션, 참조 없는 리소스·멤버와 목록 시절 주석이 남아 있어 정리(삭제 전 리플렉션·로컬 검증·XAML 문자열·계약 필드 참조 확인).
- 변경:
  - `PopupManager`: 그룹 큐·동시 표시·정렬 경로를 삭제하고 `Show(PopupOptions)` 1건 표시로 단순화, 미사용 생성자 매개변수와 중복 위치 메서드 삭제. `PopupOptions.DisplayMode`·`DisplayOrder`, `PopupDisplayMode`, `PopupFactory.ConvertPopupDisplayMode` 삭제 — 모르는 displayMode 값으로 팝업 생성이 실패하던 경로 제거(DTO `displayMode`는 계약 필드라 유지).
  - 삭제: `PopupOptions.IsCompleted`(설정 0건), XAML 리소스 `PopupButtonStyle`·`CommonSurfaceCardStyle`·`PopupBorderBrush`와 이에만 쓰이던 `PopupSurfaceBrush`·`PopupSoftBorderBrush`, `SurveyOption.Value`(모델), Demo의 삭제 필드 정리 코드, `DemoPopupDataService.CreatePopups` 유형 필터, `SsoAuthHeaderProvider.ExpiresAt`, 미사용 using. `PopupPollingRecovery.IsRecovering`은 로컬 복구 검증이 읽어 유지.
  - 주석 정정: 표시 중 조회 안 함·`_shownPopupIds` 삭제, 단건 조회·결과 응답, 삭제된 X 버튼·Header 48 → 40, 창이 놓인 모니터 WorkArea, TEXT 제목·FILL·RATING5·passingScore, 결과 전송 시점(닫힐 때마다), appsettings EmbeddedResource, `ImageFillPopupView`(ORIGINAL 뷰, 이름 유지), WPF README PopupManager 설명.
  - `scripts/PopupWindowTests`: Demo 후보 헬퍼로 교체, displayMode 무시 검증 5건 추가.
- 주요 파일: popup-frameWork/Popup/(Managers/PopupManager.cs, Models/PopupOptions.cs, Models/SurveyOption.cs, Factories/PopupFactory.cs, Dtos/PopupResponseDto.cs, MainWindow.xaml.cs, DemoWindow.xaml.cs, DemoOptionsWindow.cs, Services/*, Views/Windows/PopupWindow.xaml(.cs), Views/Windows/PopupStyles.xaml, Views/Contents/(SurveyPopupView.xaml.cs, IBodyFontSizeAware.cs, ImageFillPopupView.xaml.cs), Popup.csproj, Properties/PublishProfiles/FolderProfile.pubxml), popup-frameWork/README.md, scripts/PopupWindowTests/Program.cs, docs/design/50_*, version-history/CHANGELOG.md. ALL·MINIMAL 정의서 DisplayMode 행은 문서 정리 커밋에 포함.
- 검증: WPF 빌드 경고·오류 0. `scripts/RichTextTests` 85건, `scripts/PopupWindowTests` 23건, 로컬 전용 행동 검증 1012건(호출 변경에 맞춰 수정)·복구 검증 158건 통과, `scripts/CornerWindowTests` 빌드 성공. 실제 Windows 화면 육안 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-08 — TODO50-B 관리자 웹 불필요 코드 정리

- 이유: 설계 18·23·37·49 이후 쓰이지 않게 된 분기·인자·export와 중복 구현이 남아 있어 정리(삭제 전 호출부·스크립트·계약 필드 참조 확인).
- 변경: `PopupPreview` `previewSize()`·`fitContainer` 미지정 경로 삭제(항상 부모 영역 채움), FILL 잔재 이름 정리·도달 불가 분기 삭제, `adaptiveMaximum` 인라인, QUIZ 저장 키 `videoTitle` 삭제, TEXT 콘텐츠 제목 분기 삭제, `applyFormat` `focusEditor` 인자 삭제, 파일 밖 미사용 export(`isAllowedColor`·`RichAlignment`·`positive`·`FORMAT_KEYS`·`FormatKey`) 제거, 문항 템플릿 선택을 유형 전환 시 초기화(후속 보완: 최초 구현은 선택을 고른 유형과 함께 보관해 다른 유형에서만 숨겨, SURVEY 선택 → QUIZ → SURVEY 복귀 시 이전 선택이 되살아났음 — 유형이 바뀌면 렌더 중 선택 상태를 실제로 비우도록 수정, 목록 재조회가 없도록 다시 마운트 방식은 쓰지 않음), 공용 `popupCommon.ts`(epoch 판별 `popupDateMillis`, `POPUP_TYPE_LABELS`, 글자 크기 10~40 `popupFontSize`) 추가 후 중복 3곳씩 대체(FIT_TO_IMAGE 설명 높이 계산에도 같은 보정), `PopupAdminApi` 수정 이력성 주석 정리. 계약 필드는 유지.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/(PopupPreview.tsx, PopupEditorDialog.tsx, PopupQuestionTemplatePicker.tsx, PopupRichTextEditor.tsx, PopupTemplateDialog.tsx, RgstPop.tsx, imagePreviewLayout.ts, popupRichText.ts, popupRichTextFormat.ts, popupCommon.ts), zero-rule-web/sub/domain/src/user-apis/PopupAdminApi.ts, scripts/(verify-image-preview-entry.tsx, verify-rich-text-49-entry.tsx), docs/design/50_*, version-history/CHANGELOG.md.
- 검증: `tsc --noEmit` 오류 0, 변경 파일 eslint 오류 0(기존 경고 3건), `verify-image-preview.cjs` 34건·`verify-rich-text-49.cjs` 40건 통과. 후속 보완 후 신규 `scripts/verify-question-template-picker.cjs`(headless Edge, 실제 MUI Select 조작) 7건 통과 — 보완 전 코드에서는 "SURVEY 복귀 시 이전 선택 복원"으로 실패함을 확인. 실제 관리자 화면 저장은 미확인.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-07 — TODO50-A 서버 게시중단 후 결과 수용(A9)·계약 sizeMode AUTO 표기(A5)

- 이유: 설계 47-4는 게시중단 전에 표시된 팝업의 결과(EXPIRED 전달 건 포함)를 수용하기로 확정했으나, 결과 처리가 신규 조회와 같은 게시 조건을 다시 검사해 활성 해제·기간 종료·대상 변경 후 결과를 거절하는 경로가 있었음(확정 정책과 구현 불일치). 계약서 sizeMode ENUM의 `AUTO`는 서버가 내려주지 않는 값인데 구분 표기가 없었음.
- 변경:
  - A9 서버: `PopupMapper.selectSubmissionContext`·`selectVideoPopupContext`에 `requirePublished` 매개변수 추가(true일 때만 활성·기간 조건). `countActiveUserAndPopup`에서 팝업 `ACTIVE_YN` 조건 제거(활성 사용자·팝업 행 존재만 확인). `PopupService`에 전달 건 결과용 `submitDeliveredResponse`·`saveDeliveredVideoProgress` 추가(노출 자격 재검사 없음, 문항·채점·저장 규칙은 공통), `WpfResultProcessor`가 제출·시청·VIDEO+QUIZ 판별을 이 경로로 처리. 전달 건 소유권·popupId 일치·DONE 거절·영수증 DUPLICATE·사용자 잠금은 유지, 신규 조회·nextStatus 쿼리는 변경 없음.
  - A5 계약서: sizeMode `AUTO`를 WPF 전용 값(서버·관리자 웹 미저장, 응답에 나오지 않음)으로 명시.
  - 계약서 WPF_NOT_ELIGIBLE 설명을 전달 건 기준 수용 규칙으로 보완, 설계 47-4에 당시 구현 불일치와 50 A9 수정 연결 기록.
- 주요 파일: zero-rule-server/repo/core/src/main/(java/server/repo/core/mapper/popup/PopupMapper.java, resources/mappers/popup/PopupMapper.xml), zero-rule-server/service/core/src/main/java/server/service/core/popup/(PopupService.java, wpf/WpfResultProcessor.java), 테스트(WpfResultProcessorTest, PopupMapperOracleStatementTest, PopupSubmitScoreTest, PopupActionOptionsTest, 신규 PopupDeliveredResultTest, 신규 WpfDeliveredResultDatabaseTest), docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/(47_*, 50_*), version-history/CHANGELOG.md.
- 검증: `:service:core:test --tests "server.service.core.popup.*"` 97건 중 93 통과·실패 0·skip 4(DB 환경변수 미설정). 로컬 XE에서 `WpfDeliveredResultDatabaseTest`(게시중단 3방식 × 결과 6종 18조합, 세이브포인트·롤백 전용)와 `WpfPopupDatabaseTest` 왕복 통과. `compileJava compileTestJava` 성공. 원격 개발 DB 실행·실제 WPF 왕복은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-06 — TODO50-A WPF 동작 불일치 수정(A1·A4·A10)

- 이유: 숨김 체크박스 문구가 실제 숨김 일수와 다르고, 결과 큐에 호출되지 않는 경로와 실제와 다른 종료 전송 주석이 남아 있으며, 일반 VIDEO는 `allowCloseBeforeComplete=false`여도 창 닫기(Alt+F4)로 시청 기준 전에 닫혀 계약과 불일치.
- 변경:
  - A1: `PopupResultBuilder.EffectiveHideDays`(서버 hideDays, 없으면 30)를 HIDDEN 결과와 `PopupWindow` 체크박스 문구(`{N}일간 보지 않기`)가 함께 사용. 관리자 미리보기 문구도 같은 규칙.
  - A4: `PopupResultQueue.EnqueueAsync`·`FlushInBackground`·큐 `ClientVersionRejected` 이벤트와 `MainWindow` 구독 삭제(426은 기존대로 `FlushAsync` 예외 → 조회 catch에서 처리). 큐·`PopupOptions`·`popup-frameWork/README.md`의 종료 직전 전송·RetainForExit 주석을 실제 동작(종료 시 전송 중단, 메모리 보관분은 유실 가능)으로 정정. 동작 변경 없음.
  - A10: `PopupWindow.OnClosing`이 일반 VIDEO도 푸터 버튼과 같은 조건(시청 기준 미달·재생 실패 아님)이면 닫기를 취소. 앱 종료(`Application.Shutdown`)는 취소를 무시하므로 기존 VIDEO+QUIZ와 같이 닫힌다.
  - 저장소 추적 검증 `scripts/PopupWindowTests` 추가(A1 4건·A10 14건), `.gitignore` bin/obj 추가. ALL 정의서 HideDays·AllowCloseBeforeComplete, 사용자 옵션 가이드 숨김 일수 설명 보완.
- 주요 파일: popup-frameWork/Popup/(Services/PopupResultBuilder.cs, Services/PopupResultQueue.cs, Models/PopupOptions.cs, MainWindow.xaml.cs, Views/Windows/PopupWindow.xaml, Views/Windows/PopupWindow.xaml.cs), popup-frameWork/README.md, zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, scripts/PopupWindowTests/, .gitignore, docs/interfaces/WPF_POPUP_ALL_SPEC.md, docs/POPUP_USER_OPTION_GUIDE.md, docs/design/50_*, version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. `scripts/PopupWindowTests` 18건 통과. 로컬 전용 행동 검증 1012건(같은 18건 포함, 기존 모달 정리 경로는 닫기 허용 후 정리로 조정)·복구 검증 158건 통과. 관리자 웹 `tsc` 통과. 실제 Windows 화면 육안 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-05 — TODO50-A 관리자 웹 동작 불일치 수정(A2·A3·A6·A7·A8)

- 이유: 전수 점검에서 관리자 웹 미리보기·편집 값이 WPF·서버 계약과 어긋난 경로 확인(정합성 보완).
- 변경:
  - A2 `imagePreviewLayout.ts`: IMAGE 크롬 상수를 WPF `PopupWindow` 실측과 일치(가로 28+28+24+24 = 104, 세로 24×4 = 96 + Header 40 + Footer 80, 본문 테두리 0, 이미지 테두리 2). 측정 폭·추천 폭이 같은 상수 사용(기존 106/108 불일치 해소). `PopupPreview.tsx` Header를 모든 유형 40(제목 한 줄 말줄임), IMAGE Paper 테두리 제거.
  - A3 `PopupEditorDialog.tsx`: 유형 변경 시 width/height가 비면 content 크기 또는 560×420으로 보정(일반 IMAGE를 불러와 다른 유형으로 바꿀 때 저장 거절 해소).
  - A6 `PopupQuestionEditor.tsx`·`PopupEditorDialog.tsx`·`PopupPreview.tsx`: QUIZ 주관식 `answerMatchMode` 미지정 시 EXACT를 실제 값으로 채움(상세 조회·팝업 템플릿·문항 템플릿·QUIZ 전환), 미리보기 채점도 같은 기본값.
  - A7 `RgstPop.tsx`: '최근 생성 10개'를 생성 시각 내림차순으로 선택·표시.
  - A8 `PopupEditorDialog.tsx`: 동영상 없는 유형으로 바꾸면 완료 비율 비움.
  - 검증 스크립트 `verify-image-preview.cjs`·entry: `@/lib/urls` alias 보완, 크롬 수치 4건·Header/테두리 DOM 3건 추가. 미리보기 대조 문서 Header·IMAGE 크롬 설명 보완.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/(imagePreviewLayout.ts, PopupPreview.tsx, PopupEditorDialog.tsx, PopupQuestionEditor.tsx, RgstPop.tsx), scripts/(verify-image-preview.cjs, verify-image-preview-entry.tsx), docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/50_*, version-history/CHANGELOG.md.
- 검증: `tsc --noEmit` 통과, 변경 파일 eslint 통과, `verify-image-preview.cjs` 34건·`verify-rich-text-49.cjs` 40건 통과(로컬 headless Edge). A3·A6·A8은 실제 관리자 화면 저장 미확인.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-04 — TODO50-S1 원격 개발 DB 평문 비밀번호 처리(제거 후 원복)

- 이유: 전수 점검에서 원격 개발 DB 비밀번호가 저장소 추적 파일(설정 주석, 서버 JNDI 기본값)에 평문으로 있음을 확인해 정리 대상으로 분류.
- 변경: `application-dev_db.yml` 비밀번호 주석 삭제, `JndiResource` 하드코딩 기본값 제거(환경변수 `ZERO_RULE_DB_PASSWORD`만 사용), README·`shell/start-dev.ps1` 안내를 한 번 적용. 이후 대상이 검증계(원격 개발) DB 계정이라 현행 유지로 결정해 네 파일을 이전 상태로 원복. 설계 50 S1을 "유지로 결정"으로 기록.
- 주요 파일: zero-rule-server/app/src/main/(java/server/app/config/JndiResource.java, resources/application-dev_db.yml), shell/start-dev.ps1, README.md, docs/design/50_*, version-history/CHANGELOG.md.
- 검증: 제거 적용 시 `:app:compileJava` 성공. 원복 후 네 파일이 제거 전 커밋과 동일함을 확인.
- 상태: 제거·원복 두 커밋에 포함(최종 결과는 변경 없음). 원격 반영. 자격 증명 교체·이력 재작성 없음.

## 2026-10-15-03 — TODO50-② TEXT 서식 WPF 회귀 검증 저장소 추적화

- 이유: 설계 48·49의 WPF 검증(981·994건 기록)이 Git 제외 로컬 전용 `Popup.BehaviorTests`에만 있어 다른 환경에서 관용 변환기·들여쓰기 회귀를 재현할 수 없음.
- 변경: `scripts/RichTextTests`(콘솔 검증 프로젝트, Popup.csproj 참조, Demo Media 복사) 추가. 설계 28 서식 표시·Demo 옵션 검증, 설계 38 기울임 오른쪽 여유, 설계 48 표시 방어·JSON 타입 오류 경계·구조 오류 plainText 대체·서버/웹 글꼴 ID 대조, 설계 49 들여쓰기(단계 × 40, 정렬·빈 문단, 기울임 여유 공존, 줄바꿈 모든 줄 시작 위치, 표시 방어, Demo 검증)를 로컬 전용 검증에서 옮김. `.gitignore`에 bin/obj 추가. 설계 48·49 문서의 검증 위치 갱신.
- 주요 파일: scripts/RichTextTests/(RichTextTests.csproj, Program.cs), .gitignore, docs/design/(48_*, 49_*, 50_*), version-history/CHANGELOG.md.
- 검증: `dotnet run --project scripts/RichTextTests` 85건 통과(로컬).
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-02 — TODO48·49 검증 상태 구분과 TODO50 재분류

- 이유: TODO48·49 완료 표시가 실제 검증 범위보다 넓었고(서버 저장 → 재조회 → WPF 왕복 미실행, DB 의존 테스트 skip, 독립 하네스·로컬 전용 WPF 검증), TODO50의 일부 항목이 확정 정책·계약과 구현의 불일치인데 정책 보류로 분류돼 정합성 보완.
- 변경:
  - 설계 49: 상태를 `코드 구현 완료 · 통합 검증 대기`로 정정. 저장 왕복 완료 기준을 미완료(통합 검증 대기)로 되돌리고, 실제 관리자 화면(편집 Dialog 안) 선택 유지·포커스·드롭다운 실제 조작·한글 IME 확인을 별도 미완료 기준으로 추가. 하네스 한계(Dialog 밖 단독 실행, 드롭다운은 값 설정 + change 이벤트, IME 미포함) 명시. 확정 결과에서 요구사항 확정값과 구현 전 확인에서 선택한 값(최대 5단계, 40색·8×5, 적용 후 유지, 서식 지우기 정책)을 구분.
  - 설계 48: 상태를 같은 기준으로 정정, WPF 행동 검증이 로컬 전용(Git 제외)임을 명시하고 저장소 추적화를 남은 항목에 추가.
  - 설계 50: D1(게시중단 후 결과 수용)을 A9, D2(일반 VIDEO 창 닫기 우회)를 A10 수정 대상으로 재분류하고 A9 수정 원칙(전달 건 소유권·popupId 일치·종료 여부 검증 유지, 신규 조회 게시 조건과 기전달 결과 수용 조건 분리) 기록. D6 평문 비밀번호를 50-S 보안 정리로 분리(현재 파일 정리와 자격 증명 교체 구분, Git 이력 잔존 명시). 50-B에 종류별 삭제 전 확인 기준(내부 모델·외부 DTO·공개 메서드·XAML 문자열·MyBatis) 추가. 진행 순서와 완료 기준(48·49 WPF 회귀 검증 저장소 추적화 포함) 갱신.
- 주요 파일: docs/design/(48_*, 49_*, 50_*), version-history/CHANGELOG.md.
- 검증: 문서 변경만 수행. 코드 수정·테스트 재실행 없음.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-15-01 — TODO50 구조 정합성 전수 점검 결과 등록

- 이유: TODO 1~49에서 조회 구조·콘텐츠 필드·헤더 치수·서식 정책이 여러 번 바뀌어, 경로 간 동작 불일치와 필요 없어진 코드·주석이 누적됐는지 전수 확인 필요.
- 변경: WPF·서버/DB·관리자 웹·문서 네 영역을 읽기 전용으로 점검한 결과를 설계 50으로 등록. 동작 불일치 8건(50-A), 삭제 대상 코드(50-B), 주석·문서 정정(50-C), 정책 결정이 필요한 항목(50-D: 게시중단 후 결과 수용, 일반 VIDEO 창 닫기, 완료 비율 계산 방식 등)으로 분류.
- 주요 파일: docs/design/50_구조정합성_전수점검_정리_TODO.md, version-history/CHANGELOG.md.
- 검증: 상위 항목(숨김 문구 고정, IMAGE 미리보기 헤더 48·여백 106/108, 결과 큐 미호출 경로, sizeMode AUTO, 게시중단 조건 ACTIVE_YN, 옵션 가이드 헤더 높이)은 코드에서 직접 재확인. 나머지는 점검 결과 기준이며 정리 단계에서 개별 확인.
- 상태: TODO 등록, 커밋에 포함. 원격 반영. 정리 구현은 후속 커밋.

## 2026-10-14-04 — TODO49 TEXT 문단 들여쓰기와 우클릭 펼침 서식 패널 구현

- 이유: TEXT 본문 문단 들여쓰기를 편집·저장·미리보기·WPF 팝업까지 같은 값으로 유지하고, 우클릭 서식 메뉴를 색 격자를 펼친 한 패널로 개편하는 TODO49 요건 반영. 구현 전 확인 항목은 단계 누적·최대 5단계, 색상 명도 단계 격자 확장, 적용 후 패널 유지로 확정.
- 변경(문단 들여쓰기):
  - 계약: 문단 필드 `textBlocks[].indent` 0~5 정수(1단계 = 40, 누락 0). 글자 서식(Run)과 분리된 문단 속성이며 plainText에 공백·탭을 넣지 않음.
  - 서버: `PopupRichText.java` 문단 키에 indent 추가·0~5 정수 검증(임의 CSS 키는 계속 거부).
  - 관리자 웹: 툴바 들여쓰기 늘리기·줄이기(IndentBlock 40px), `limitIndent`로 최대 5단계 제한(5단계에서 명령 비활성, 붙여넣기 여백을 40px 배수·200px 이하로 정규화, px 외 단위 제거), 서식 지우기가 들여쓰기를 지우지 않도록 `blockIndent`를 문단 속성으로 등록. `htmlToBlocks`·`blocksToHtml`·`readTextBlocks` 왕복, 미리보기 문단 왼쪽 여백.
  - WPF: `PopupTextBlockDto.Indent`, 렌더러 문단 왼쪽 여백 단계 × 40 DIP(줄바꿈된 모든 줄), 기울임 오른쪽 여유와 공존. 설계 48에 따라 서버 단계 목록은 복제하지 않고 정수·최대 400 DIP만 적용(밖이면 0), 타입 오류는 0. Demo 샘플 목록 문단 3개 1단계, Demo 검증에 indent 추가.
  - 문서: 인터페이스 계약 8.1(indent 행·WPF 표시 방어), ALL 정의서, 옵션 가이드, 미리보기 대조 문서, 예제 JSON(WPF-01). MINIMAL 범위 변경 없음.
- 변경(우클릭 펼침 서식 패널):
  - `PopupRichTextMenu`를 MUI Menu에서 비모달 Popper 패널로 개편. 색 격자(8계열 × 밝기 5단계 = 40색, 기존 8색·이름 유지)를 항상 펼쳐 두고 현재 색·혼합 표시, 색 초기화, 글꼴·크기 선택, 굵게·기울임·밑줄(혼합은 `aria-pressed=mixed`), 서식 지우기를 한 패널에 배치. CKEditor 색 드롭다운도 같은 팔레트·8열.
  - 적용 후 패널 유지(서식 상태 재조회), Esc(포커스 위치 무관)·바깥 클릭으로 닫으면 편집기 선택으로 복귀. 우클릭·'서식' 버튼·메뉴 키/Shift+F10 진입, Shift+우클릭 브라우저 메뉴, 화면 경계 보정, 색 격자 방향키·Home/End 이동, 읽기 전용 전환 시 닫힘. `applyFormat`에 편집기 포커스 이동 여부 인자 추가.
  - 문서: 설계 49 확정 결과·구현 결과·검증, 설계 28 §11에 후속 링크, 사용자 옵션 가이드 서식 편집 설명.
  - 검증 스크립트: `scripts/verify-rich-text-49.cjs`(+entry) — 실제 관리자 편집기 빌드를 headless Edge에서 띄워 들여쓰기·패널·미리보기를 확인.
- 주요 파일: zero-rule-server/.../popup/(PopupRichText.java, PopupRichTextTest.java), zero-rule-web/main/src/features/RgstPop/(popupRichText.ts, popupRichTextFormat.ts, PopupRichTextEditor.tsx, PopupRichTextMenu.tsx, PopupPreview.tsx), popup-frameWork/Popup/(Dtos/PopupTextBlockDto.cs, Views/Contents/PopupRichText.cs, Services/DemoPopupDataService.cs, DemoOptionsWindow.cs), scripts/(verify-rich-text-49.cjs, verify-rich-text-49-entry.tsx), docs/interfaces/*, docs/POPUP_OPTION_GUIDE.md, docs/POPUP_USER_OPTION_GUIDE.md, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/(28_*, 49_*), version-history/CHANGELOG.md.
- 검증: 서버 popup 패키지 테스트 86건 통과(들여쓰기 허용·거부 추가, DB 의존 3건은 로컬 XE 미기동으로 skip). WPF 빌드 경고·오류 0, 행동 검증 994건 통과(설계 49 전용 13건 — 단계 × 40·정렬·빈 문단·기울임 여유 공존·본문 크기 변경 후 유지·줄바꿈 모든 줄 시작 위치·표시 방어 범위·Demo 검증, 설계 38 기울임 잘림 검증 포함). 관리자 웹 `tsc --noEmit` 통과. 실제 편집기 하네스 40건 통과(변환 왕복, 저장값 재편집, 첫 들여쓰기 40px, 5단계 정지·명령 비활성, 내어쓰기, 서식 지우기 후 들여쓰기 유지, 실행 취소, 붙여넣기 정규화, 패널 8×5 격자·구성·포커스, 색 적용 후 유지·선택 구간만 적용·선택 유지, 굵게·크기·글꼴·기울임·밑줄·색 초기화·서식 지우기, 방향키·Enter·Esc, 혼합 표시, 바깥 클릭, 커서만 있을 때, '서식' 버튼·키보드 진입, Shift+우클릭, 화면 가장자리, 읽기 전용, 미리보기 줄바꿈 줄 여백). 하네스가 구현 중 결함 2건(v34에 없는 `getRoots()` 사용, `removeFormat`이 들여쓰기 삭제)을 발견해 수정 후 통과. 미실행: 로그인한 실제 관리자 화면 수동 확인(마우스·한글 IME), 실제 저장 → 원격 개발 DB → WPF 실화면 육안 확인, Word·Excel 인터페이스 산출물 재생성.
- 상태: 문단 들여쓰기·우클릭 패널 두 커밋에 나눠 포함. 원격 반영.

## 2026-10-14-03 — TODO48 TEXT 서버 정책과 C# 표시 방어 분리 구현

- 이유: 서버·C#이 같은 서식 허용 목록을 각각 관리하면 한쪽 변경 누락으로 정상 저장한 서식이 WPF에서 조용히 무시될 수 있어, 정책 검증은 서버에 두고 WPF는 표시 변환·최소 방어만 맡도록 분리.
- 변경:
  - WPF 렌더러(`PopupRichText.cs`): 크기 목록 검사(`Sizes`)와 대문자 색 검사(`IsAllowedColor`) 제거. 크기는 유한값·안전 범위 1~200 DIP만 적용하고 밖이면 기본 크기, 색은 `#RRGGBB` 대소문자 무관을 예외 없이 변환하고 실패한 구간만 기본 색. 글꼴 ID 매핑·정렬 변환·null 처리는 유지.
  - 입력 경계(`PopupTextBlockDto.cs`·`TextPopupContentDto.cs`): textBlocks 전용 `LenientTextBlocksConverter` 추가. 서식 값의 JSON 타입 오류는 그 값만 기본값으로 두고(이전에는 content 변환 예외로 팝업 전체 미표시), 글자를 읽을 수 없는 구조 오류는 서식 본문 대신 서버 파생 plainText 표시. plainText 자체의 타입 오류는 기존 content 변환 오류 경로 유지.
  - Demo: 저장 검증용 크기·글꼴·대문자 색 목록을 `DemoOptionsWindow`의 Demo 전용 사본으로 이동(운영 시점 Demo와 함께 제거 대상).
  - 문서·주석: 설계 48 구현 결과, 설계 36 상태, 설계 28 WPF 설명, 인터페이스 계약 8.1, ALL 정의서, 서버 `PopupRichText.java`·관리자 웹 `popupRichText.ts` 주석을 서버 정책 검증과 WPF 표시 방어로 구분해 갱신. MINIMAL 범위 변경 없음.
- 주요 파일: popup-frameWork/Popup/(Views/Contents/PopupRichText.cs, Dtos/PopupTextBlockDto.cs, Dtos/TextPopupContentDto.cs, DemoOptionsWindow.cs), zero-rule-server/.../popup/PopupRichText.java(주석), zero-rule-web/main/src/features/RgstPop/popupRichText.ts(주석), docs/design/(28_*, 36_*, 48_*), docs/interfaces/(POPUP_INTERFACE_SPEC.md, WPF_POPUP_ALL_SPEC.md), version-history/CHANGELOG.md.
- 검증: WPF 빌드 경고·오류 0. 행동 검증 981건 통과(로컬, 설계 48 전용 19건 추가 — 서버 목록 밖·안전 범위 안 크기 표시, 비정상 크기·색·글꼴·정렬 기본값, 타입 오류 값별 기본값, 구조 오류 8종 plainText 대체, 서버·관리자 웹 글꼴 ID와 WPF 매핑 원본 대조. 기존 설계 28 검증의 소문자 색·허용 밖 크기 무시 기대를 새 방향으로 변경). 복구 검증 158건 통과. 서버·관리자 웹은 주석만 변경해 빌드·테스트 미실행. 실제 Windows 팝업 육안 확인·원격 개발 DB 데이터 표시 확인·Word/Excel 산출물 재생성 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-14-02 — TODO49 TEXT 들여쓰기와 우클릭 펼침 팔레트 요구사항 등록

- 이유: TEXT 문단 들여쓰기의 편집·저장·팝업 표시 일관성과 우클릭 서식 패널 배치 요구사항을 정리할 필요.
- 변경: 문단 왼쪽 여백 40px, 문단 JSON 속성·HTML 왕복·서버 저장·WPF 표시 작업 등록. 우클릭 폐기·선택 툴바 대체 초안을 취소하고 우클릭을 유지하여 펼침 색상 격자와 글꼴·크기·굵게·기울임·밑줄을 함께 제공하도록 정의. 기존 기능 전체 유지 표와 49-10 누락 검증 추가. 반복 들여쓰기·최대 깊이·팔레트 구성·패널 닫힘 규칙은 구현 전 확인 항목으로 구분. Trello 진행 확정에 TODO49 등록(https://trello.com/c/GfIksO54).
- 주요 파일: docs/design/49_TEXT_들여쓰기_우클릭팔레트_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main의 TODO 번호·AGENTS.md·편집기·변환기·WPF 렌더러·TODO48 대조, Astra 설계 검토 및 로컬 문서 공백 검사. 문서 변경으로 빌드·실행 테스트 미수행.
- 상태: TODO 등록·구현 대기. 기능 코드·DB 변경 없음. 커밋에 포함.

## 2026-10-14-01 — TODO48 TEXT 서버 정책과 C# 표시 방어 분리 등록

- 이유: 서버·C# 허용 목록의 이중 관리로 정상 저장된 서식이 클라이언트에서 무시되는 변경 누락 위험을 줄이고, 운영 시점 제거 대상인 Demo를 검사 유지 근거에서 제외할 필요.
- 변경: TODO48에 정책 중복 제거, 크기 안전 범위·색상 변환 방어, 글꼴·정렬 매핑 유지, JSON 타입 오류 경계 및 회귀 검증 기준을 등록. TODO36에 기존 유지 결론을 대체하는 후속 과제 링크와 상태를 명시. Trello 진행 확정에 TODO48 카드와 작업 체크리스트 등록.
- 주요 파일: docs/design/48_TEXT_서버정책_CSharp_표시방어_분리_TODO.md, docs/design/36_TEXT_서식변환_타입검사_중복검토_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main의 TODO 번호와 작업 규칙 대조, 문서 링크·diff 및 공백 검사. 문서 변경만으로 빌드·실행 테스트 미수행.
- 상태: TODO 등록·구현 대기. 기능 코드·서버 허용 값 변경 없음. 커밋에 포함.

## 2026-10-13-31 — TODO46 API·WPF·관리자 웹 계약 대조 및 불일치 수정

- 이유: 단건 계약·유형별 저장/표시/결과가 서버·WPF·Demo·관리자 웹·명세·예제·Excel·Word·제안서 0.3 사이에서 일치하는지 대조하고 불일치를 정리.
- 변경:
  - 서버: 관리자 저장 시 hideDays를 1~3650으로 제한(`PopupService`, 기존은 1 이상만 — 3650 초과 저장 시 WPF HIDDEN 결과가 REJECTED로 종결되어 숨김 미적용). 단건 구조에 맞게 주석 정정(WpfPopupItem·PopupFooterAction·PopupWindowOptions·WpfPopupService·WpfResultItemResponse).
  - WPF·Demo: Demo 게이트웨이가 거절 시 영수증을 지워 서버 롤백 동작과 같게 하고 HIDDEN hideDays 3650 상한 검사. DisplayOrder를 Demo 정렬 전용(서버 응답에 없음)으로 주석·Demo 옵션 라벨 정정, Demo VIDEO+QUIZ videoTitle을 surveyTitle과 같게. 목록·popups[] 주석 정정.
  - 문서: POPUP_INTERFACE_SPEC(설계 35 이전 3.7 이력에 대체 표기, §6.4 날짜, §10.9 제안서 0.3과 구현 계약 차이 표, HIDDEN 우선·시청 기록 미저장 명시, VIDEO+QUIZ 제목 1개 저장, plainText 조건부, hideDays 1~3650), ALL/MINIMAL(hideDays·plainText·TextBlocks 최소 범위 의미·HIDDEN 우선), 옵션 가이드(TEXT 통합 규칙·hideDays), 예제 JSON 2종(VIDEO+QUIZ videoTitle), 설계34 sentAt 종결 표기, Excel(RESULT_REQUEST·RESPONSE G열 어긋난 비고 정정, 개요 버전·기준일·조회 API 문구, 공통 hideDays 범위, TEXT 통합 규칙, Sample 전 유형 deliveryId·VIDEO+QUIZ 제목), Word 생성 스크립트 날짜·부록 문구 수정 후 Word/PDF v3.7 재생성. 설계46 대조 결과 기록.
- 주요 파일: zero-rule-server/(service/core .../PopupService.java·wpf/WpfPopupService.java, domain .../PopupFooterAction.java·PopupWindowOptions.java·wpf/WpfPopupItem.java·wpf/WpfResultItemResponse.java, 테스트 PopupAdminQuestionsTest.java), popup-frameWork/Popup/(Services/DemoPopupGateway.cs·DemoPopupDataService.cs, Dtos/PopupResponseDto.cs·WpfResultDtos.cs, Models/PopupOptions.cs, Factories/PopupFactory.cs, DemoOptionsWindow.Fields.cs), docs/interfaces/*, docs/POPUP_OPTION_GUIDE.md, docs/design/(34_*, 46_*), scripts/export-interface-word.cjs, version-history/CHANGELOG.md.
- 검증: 서버 `gradlew test --offline --continue`(로컬 XE) 125건 통과·skip 0(hideDays 범위 테스트 추가). WPF BehaviorTests 962건(Demo 거절 후 같은 resultId 재처리, HIDDEN 3651 거절 추가)·RecoveryTests 158건(로컬). 명세 json 블록·예제 JSON 37건, Excel 예시 JSON 파싱, docx 본문 반영 확인. 관리자 웹 코드는 변경 없음. 미실행: 관리자 웹 등록·수정·미리보기 화면 왕복(로그인 필요), 원격 개발 서버 배포 후 확인.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-13-30 — TODO45·47 결정 기록 및 실환경 검증(로컬 새 서버 + 원격 개발 DB + WPF)

- 이유: 단건 RESULT 재전송·오류 정책(TODO45)과 팝업 유효성·전달 상태(TODO47)의 결정값을 기록하고 실제 서버·DB·WPF 연동 증거를 남길 필요.
- 결정: 45-3·45-4·47-7(최종 장애 복구 정책, resultId 본문 비교·보존 기간·전달 건 만료)은 현행 동작을 임시 기준으로 유지하고 주간회의까지 명시적 보류 — 검증 통과를 정책 확정으로 표시하지 않음. 47-4 이미 열린 팝업 강제 회수·긴급 공지 끼어들기는 범위 밖 확정(게시중단 전 표시 건 결과는 수용). 47-5 진행 단위는 사번 단위 유지(한 PC에서 완료하면 다른 PC 조회에서도 제외), 다중 PC 동시 표시 허용 여부와 다른 PC에 열린 팝업의 결과 수신 기준은 보류.
- 검증(실환경): 이 PC에서 새 서버(local 프로파일, 프로토타입 로그인)를 원격 개발 DB(11g XE)에 연결. HTTP 시나리오 21건 통과 — POST 조회 단건 구조, 원격 기존 TEXT 행 제목·설명 병합, 결과 전 재조회 같은 deliveryId, TEXT 닫기 ACCEPTED/AVAILABLE·완료, 같은 resultId DUPLICATE(+nextStatus), 같은 전달 건 다른 resultId WPF_DELIVERY_COMPLETED, VIDEO 미완료 닫기 유예 1800초, AVAILABLE 뒤 게시중단 시 popup=null, SURVEY 제출 EMPTY→null, OPEN 건 게시중단 시 EXPIRED 후 다음 후보, EXPIRED 건 결과 수용, 원격 DB 같은 결과 동시 제출 ACCEPTED 1·DUPLICATE 1, 401·426·400·WPF_INVALID_RESULT·WPF_INVALID_DELIVERY, 요청 로그. 실제 WPF exe(API 모드, 가짜 SSO, 사용자 E1003): 원격 TEXT 표시(합친 본문)→UI 자동화로 닫기→결과 저장(완료)→설문 즉시 표시, 표시 중 조회 요청 없음, 강제 종료·재실행 시 같은 OPEN 전달 건 재표시. 검증 스크립트의 SQL*Plus 한 줄 다중 문장 오류로 게시중단 UPDATE가 실행되지 않아 처음 2건이 실패했으나 스크립트 수정 후 통과(서버 문제 아님). 테스트 사용자 E1002·E1003의 기록과 게시 상태는 검증 후 정리(잔여 0), E1001 기존 기록은 미변경.
- 주요 파일: docs/design/(45_단건_RESULT_재전송오류_정책검증_TODO.md, 47_팝업유효성_게시중단_전달상태_정책검증_TODO.md), version-history/CHANGELOG.md.
- 미실행: 원격 개발 서버 배포, 실제 WPF의 401 재로그인·426 안내·5xx 복구 화면, 원격 DB의 조회·결과 경합 재현, 다중 PC, 폐쇄망.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-13-29 — TODO44 Background Overlay 키보드와 종료 동작 검토 진행 확정 정정

- 이유: Background Overlay 키보드와 종료 동작 검토를 보류 과제로 분류한 상태를 개발 진행 확정으로 정정할 필요.
- 변경: TODO44 문서를 다시 추가하고 구현 범위·기존 과제 대조·검증 기준을 기록. Trello 카드의 보류 표기를 제거하고 TODO 번호·Git 문서 링크 연결 후 진행 확정으로 이동.
- 주요 파일: docs/design/44_BackgroundOverlay_키보드종료_동작검토_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 Trello 카드와 대응 번호 대조. 이전 TODO43/44 번호 유지, 다른 보류 3건은 Git에 추가하지 않음. 문서 변경으로 빌드·실행 테스트 대상 없음.
- 상태: 개발 과제 확정·TODO 등록. 기능 코드·DB 변경 및 실행 테스트 미수행.

## 2026-10-13-28 — TODO43 passingScore와 completionRatio 버튼 활성화 UX 진행 확정 정정

- 이유: passingScore와 completionRatio 버튼 활성화 UX를 보류 과제로 분류한 상태를 개발 진행 확정으로 정정할 필요.
- 변경: TODO43 문서를 다시 추가하고 구현 범위·기존 과제 대조·검증 기준을 기록. Trello 카드의 보류 표기를 제거하고 TODO 번호·Git 문서 링크 연결 후 진행 확정으로 이동.
- 주요 파일: docs/design/43_완료조건_버튼활성화_UX_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 Trello 카드와 대응 번호 대조. 이전 TODO43/44 번호 유지, 다른 보류 3건은 Git에 추가하지 않음. 문서 변경으로 빌드·실행 테스트 대상 없음.
- 상태: 개발 과제 확정·TODO 등록. 기능 코드·DB 변경 및 실행 테스트 미수행.

## 2026-10-13-27 — 보류 과제 Git 제외 및 Trello 단계 구분 정정

- 이유: 보류·미확정 과제는 Trello TODO 구체화까지만 관리하고 확정된 과제만 Git에서 관리하는 기준 반영.
- 변경: 보류 제안의 TODO40~44 문서를 현재 main에서 제거하고 초기 등록 항목(19~23)을 정리. 보류 5건은 Trello 진행 프로세스 구체화 완료에서 관리하며 TODO45~47 확정 후속 정책·계약·전달 검증 과제는 Git에 유지하고 진행 확정으로 이동.
- 주요 파일: docs/design/40~44 문서 삭제, version-history/CHANGELOG.md.
- 검증: 제안 카드 5건·구체화 카드 3건 분류 대조. TODO45~47 유지 및 보류 5건 삭제 대상 확인. 문서·카드 작업으로 빌드·테스트 미실행.
- 상태: 현재 소스에서 보류 과제 제외. 기존 커밋 이력 재작성 없음, 구현 코드·DB 변경 없음.

## 2026-10-13-26 — TODO47 팝업 유효성 게시중단과 전달 상태 후속 검증 과제 등록

- 이유: Trello 진행 프로세스 구체화 완료 과제를 저장소에서 추적하고 진행 확정 착수 범위로 정리할 필요.
- 변경: TODO47 문서 추가. TODO35 전달 건과 TODO39 사용자 잠금·동시성의 구현·자동검증 완료 범위를 연결하고 남은 다중PC·만료·실환경 정책을 관리한다. 전달 건 테이블과 원격 DDL은 이미 반영되어 재적용 작업을 만들지 않는다. 원본 카드·기존 과제 연결, 정책 결정·구현·검증 기준을 구분.
- 주요 파일: docs/design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main 221e9ff의 TODO1~39·Trello 두 목록의 열린 카드 8건과 대조해 번호 중복 없음. TODO35·39 구현/자동검증 완료 범위와 남은 정책·실환경 검증 분리. Astra 추가 검토로 상시 개념 미확정·제출버튼 교착·대상/로그 표현 구분 확인. 문서 변경만으로 빌드·테스트 대상 없음.
- 상태: TODO 문서 등록. Git 반영 후 카드에 TODO 번호·문서 링크를 연결하고 진행 확정으로 이동할 대상. 기능 코드 변경·새 DB 적용·실행 테스트 미수행.

## 2026-10-13-25 — TODO46 API WPF 관리자웹 계약 통합 검증 과제 등록

- 이유: Trello 진행 프로세스 구체화 완료 과제를 저장소에서 추적하고 진행 확정 착수 범위로 정리할 필요.
- 변경: TODO46 문서 추가. 새 단건 계약과 유형별 저장·표시·결과를 문서 및 실제 파일·연동 증거로 대조한다. 현재 원본 카드의 popups[]·nextPopup 및 IMAGE linkUrl ORIGINAL 전용 설명은 오래된 기준이므로 그대로 구현하지 않는다. 원본 카드·기존 과제 연결, 정책 결정·구현·검증 기준을 구분.
- 주요 파일: docs/design/46_API_WPF_관리자웹_계약통합검증_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main 221e9ff의 TODO1~39·Trello 두 목록의 열린 카드 8건과 대조해 번호 중복 없음. TODO35·39 구현/자동검증 완료 범위와 남은 정책·실환경 검증 분리. Astra 추가 검토로 상시 개념 미확정·제출버튼 교착·대상/로그 표현 구분 확인. 문서 변경만으로 빌드·테스트 대상 없음.
- 상태: TODO 문서 등록. Git 반영 후 카드에 TODO 번호·문서 링크를 연결하고 진행 확정으로 이동할 대상. 기능 코드 변경·새 DB 적용·실행 테스트 미수행.

## 2026-10-13-24 — TODO45 단건 RESULT 재전송과 오류 분류 후속 정책 검증 과제 등록

- 이유: Trello 진행 프로세스 구체화 완료 과제를 저장소에서 추적하고 진행 확정 착수 범위로 정리할 필요.
- 변경: TODO45 문서 추가. TODO34·35·39에서 구현한 결과 상태·큐·복구를 다시 구현하는 과제가 아니다. 단건 전환 후 남은 최종 장애 정책 결정과 실제 서버·WPF 오류 분기 증거를 관리한다. 원본 카드·기존 과제 연결, 정책 결정·구현·검증 기준을 구분.
- 주요 파일: docs/design/45_단건_RESULT_재전송오류_정책검증_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main 221e9ff의 TODO1~39·Trello 두 목록의 열린 카드 8건과 대조해 번호 중복 없음. TODO35·39 구현/자동검증 완료 범위와 남은 정책·실환경 검증 분리. Astra 추가 검토로 상시 개념 미확정·제출버튼 교착·대상/로그 표현 구분 확인. 문서 변경만으로 빌드·테스트 대상 없음.
- 상태: TODO 문서 등록. Git 반영 후 카드에 TODO 번호·문서 링크를 연결하고 진행 확정으로 이동할 대상. 기능 코드 변경·새 DB 적용·실행 테스트 미수행.

## 2026-10-13-18 — TODO39 단건 API 복구·동시성·TEXT 정합성 보완 구현

- 이유: TODO39에서 확인한 5개 보완(큐 파일 읽기 실패 시 조회 허용, 복구 재전송 결과의 EMPTY 무시, 헤더 표시·본문 숨김 TEXT 행의 헤더 소실, 조회와 결과 커밋 경합, 동일 결과 동시 제출 판정) 구현. 39-3 규칙은 "헤더만 보이기"로 확정(보이던 제목·설명만 본문 문단으로, 숨긴 본문은 표시 응답에서 제외, 관리자 재저장 시 숨긴 본문 삭제 허용).
- 변경:
  - 39-1 WPF: `PopupResultQueue.FlushAsync`가 큐 파일을 읽거나 보존할 수 없으면 메모리 보관분 전송 후에도 Blocked 반환(파일 원본 유지).
  - 39-2 WPF: `MainWindow.LoadAndShowAvailablePopupsAsync`가 이번에 저장한 결과의 nextStatus=EMPTY면 조회 없이 최신 조회 간격 대기, `OnPopupFinished`는 같은 메서드로 위임(닫힘 직후·복구 경로 공통). AVAILABLE·nextStatus 생략·빈 큐 최초 조회는 즉시 조회 유지.
  - 39-3 서버: `PopupRichText.mergeLegacyHeader`에서 헤더 표시 + `showPlainText=false` 행은 헤더 문단만 보내고 `showPlainText=true`로 변경.
  - 39-4·39-5 서버: `WpfPopupMapper.lockActiveUser`(APP_USER 행 FOR UPDATE)를 조회 시작·결과 처리 시작에서 먼저 잡아 사용자 단위 직렬화. 결과 처리는 잠금 후 영수증 확인으로 동시 제출의 뒤 요청이 DUPLICATE. 잠금 순서 사용자 → 전달 건, 다른 사용자와 독립.
  - 39-6 문서: POPUP_INTERFACE_SPEC(3.7 이력에 설계 39, TEXT 변환 규칙, §12.1 임시 기준에 39-1·39-2 및 예외 이후 재표시·큐 비누적 설명), ALL/MINIMAL, popup-frameWork README, 설계35·37·39 갱신, Word/PDF v3.7 재생성. API 필드 계약 변경 없음(Excel 유지).
- 주요 파일: popup-frameWork/Popup/(MainWindow.xaml.cs, Services/PopupResultQueue.cs), zero-rule-server/(service/core .../popup/PopupRichText.java·wpf/WpfPopupService.java·wpf/WpfResultProcessor.java, repo/core mappers/popup/WpfPopupMapper.xml·WpfPopupMapper.java, 테스트 PopupContentAssemblerTest·WpfPopupServiceTest·WpfResultProcessorTest·WpfPopupDatabaseTest), docs/interfaces/(POPUP_INTERFACE_SPEC.md, WPF_POPUP_ALL_SPEC.md, WPF_POPUP_MINIMAL_SPEC.md, WPF_Popup_API_Interface_v3.7.docx·pdf), popup-frameWork/README.md, docs/design/(35_*, 37_*, 39_*), version-history/CHANGELOG.md.
- 검증: 서버 `gradlew test --offline --continue`(로컬 XE) 124건 통과·skip 0 — 신규 Oracle 동시성 테스트(두 연결·실제 커밋: 결과 커밋 전 조회 잠금 대기 후 TEXT 완료·SURVEY 유예 각각 새 OPEN 미발급, 다른 사용자 즉시 처리, 동시 조회 OPEN 1건 재사용, 동일 결과 동시 제출 ACCEPTED 1·DUPLICATE 1·영수증 1·표시 횟수 1), TEXT 표시 조합 변환 테스트, 잠금 순서 단위 테스트. WPF BehaviorTests 960건(복구 ACCEPTED/EMPTY·DUPLICATE/EMPTY 조회 0회·2700초 예약, AVAILABLE·nextStatus 생략 즉시 조회, 빈 큐 최초 조회), RecoveryTests 158건(큐 파일 배타 잠금 시 조회 보류·잠금 해제 후 같은 resultId 전송). 첫 Oracle 테스트 실행에서 MyBatis `commit()`이 쓰기 없는 세션의 커밋을 건너뛰어 FOR UPDATE 잠금이 남아 대기하는 테스트 하네스 문제를 확인, `commit(true)`로 수정(운영 코드는 Spring 트랜잭션 관리자가 커밋해 해당 없음). 중단된 실행이 남긴 로컬 테스트 데이터(E1003)는 정리. 미실행: 원격 개발 환경 새 서버 반영 후 실제 서버+WPF 화면, 원격 DB 동시성, 폐쇄망 반입.
- 상태: 커밋에 포함. 원격 반영.
- 보완(동시성 검증 정확도·상태 표기): 첫 기록의 "동시 조회 OPEN 1건 재사용" 확인은 앞 요청이 커밋된 뒤 실행되어 실제로는 순차 재조회의 deliveryId 재사용만 검사했으므로 표현을 정정. 두 조회를 시작 latch로 같은 시점에 출발시키는 동시 조회 검증을 추가(5회 반복, 매회 같은 deliveryId·전달 건 1건). 잠금 대기 확인을 고정 대기(700ms) 대신 작업 진입 latch + 제3 연결 `FOR UPDATE NOWAIT`의 ORA-00054(잠금 보유) + 해제 전 미완료로 변경. `WpfPopupDatabaseTest` 2건 통과(로컬 XE). TODO39 연결 항목의 "진행 확정·개발 대기" 표기를 검증대기·구현 완료 상태로 정정하고 Trello 설명도 맞춤. 원격 반영.

## 2026-10-13-17 — TODO39 단건 API 복구·동시성·TEXT 후속 보완 계획 추가

- 이유: 7e7a56f 포함부터 76d50e6까지 TODO35·37 구현 검토의 복구 분기·동시성·기존 TEXT 표시 보존 누락을 후속 과제로 관리하고 문서 상태를 맞춤.
- 변경: TODO39에 큐 파일 읽기 실패 시 조회 보류, 복구 EMPTY 대기, TEXT 헤더 표시/본문 숨김 조합 보존, 조회·결과 커밋 경합 보호, 동일 결과 동시 요청 DUPLICATE 판정의 재현 조건·보완 방향·검증 기준 추가. TODO35의 기존 400 격리·INTERNAL_ERROR 상한 이후 조회 차단 해제 예외를 임시 동작으로 명시. TODO37의 TODO35 상태·popup 명칭 갱신 및 후속 검증 연결. Trello TODO39 진행 확정 등록·구현/회귀 체크리스트 연결.
- 주요 파일: docs/design/(39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md, 35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md, 37_TEXT_EDITOR_BODY_통합검토_TODO.md), version-history/CHANGELOG.md.
- 검증: 검토 기준 및 최신 main 804cc00 대조(후속 변경은 원격 DB 적용 기록). TEXT 실제 Java 변환 메서드로 헤더 병합 후 showPlainText=false 유지 확인. 검토 범위 JSON/XML 파싱·diff 공백 검사 통과. 큐·복구·동시성은 코드 검토이며 Oracle 동시 요청·WPF 화면 재현·전체 테스트는 미실행(Gradle 다운로드 접근 불가·WPF 환경 없음). TODO 링크·체크리스트와 Git diff 확인.
- 상태: 계획·문서 보완만 반영. 코드 수정·새 검증 시나리오 실행 대기. TODO 문서와 변경 이력을 커밋에 함께 포함.

## 2026-10-13-16 — TODO35 단건 순차 조회·결과 1건 수신 API 구현(제안 0.3 기준)

- 이유: 팝업 순차 전달 API 제안 0.3(`docs/interfaces/popup_api_proposal_v0.3.docx`)의 정상 흐름(로그인 → 단건 조회 → 표시 → 결과 1건 수신 → nextStatus에 따른 다음 조회) 구현. 결정값: 기존 조회 경로를 POST로 교체, 전달 건(deliveryId) 포함, 결과 요청은 기존 필드 유지 + deliveryId, TEXT·IMAGE 닫기는 완료 처리, 설문·퀴즈·영상 미완료 결과는 저장 시각부터 pollingIntervalSeconds 동안 사용자·팝업 단위 재노출 유예(조회·nextStatus 공통 조건).
- 변경:
  - DB: `WPF_POPUP_DELIVERY` 신설(사용자당 OPEN 1건 함수 기반 유니크 인덱스, `DEFER_UNTIL_AT`). `01` §12 반영, 증분 `15_wpf_popup_delivery_oracle.sql` 추가.
  - 서버: `POST /p/api/wpf/popups` → `{pollingIntervalSeconds, popup|null}`(popup에 deliveryId, displayOrder·serverTime·userId·popups[] 삭제). OPEN 전달 건 재사용·대상 아님 시 만료·동시 조회 시 유니크 위반 재조회. `POST /p/api/wpf/popups/results` 결과 1건 → `{resultId, status, nextStatus}`(전달 건 소유·팝업 일치·미종료 검증, 처리 후 전달 건 종료·유예 기록, 후보 확인은 조회와 같은 SQL 조각 `eligiblePopupCte` + ROWNUM 1, 후보 확인 실패는 nextStatus 생략·`WPF_NEXT_STATUS_UNKNOWN`). 새 거절 코드 `WPF_INVALID_DELIVERY`·`WPF_DELIVERY_COMPLETED`. 일괄 envelope·results[] 삭제.
  - WPF: 게이트웨이 `GetNextPopupAsync`·`PostResultAsync`, 결과 대기열 저장 순서 1건씩 전송(미종결에서 멈춤 → `ResultFlushOutcome`), MainWindow 1건 표시 → 닫힘 → 결과 → AVAILABLE 즉시 조회·EMPTY 최신 간격 대기, 표시 중 조회 금지, `_shownPopupIds` 삭제, 빈 조회 대기를 기동 시점 경계 대신 최신 간격 전체로 변경. deliveryId를 PopupOptions·PopupResultBuilder로 전달. Demo 게이트웨이·Demo 화면도 단건 흐름.
  - 장애 복구(주간회의 결정 대기) 임시 기준: 기존 디스크 대기열 유지, 미전송 결과를 순서대로 1건씩 재전송, 미종결 결과가 남으면 다음 팝업을 조회하지 않고 복구 간격 뒤 재시도. 400 결과는 실행 중 격리, INTERNAL_ERROR는 실행당 3회 후 차단 해제.
  - 문서: POPUP_INTERFACE_SPEC(3.7 변경 이력에 설계 35, 버전 유지)·ALL/MINIMAL 명세·옵션 가이드 2종·popup-frameWork README·미리보기 대응 문서, 예제 JSON 5종(유형별 예제는 popup 카탈로그 구조), Excel 정의서(공통·유형별 경로 popup., deliveryId 행, RESULT_REQUEST/RESPONSE 단건·nextStatus, 개요·Sample), Word/PDF v3.7 재생성, DB README·설계05, 설계35 결정·구현·검증 기록. 제안 0.3 원본 문서 저장소 반영.
- 주요 파일: db/oracle/(01_popup_schema_oracle.sql, 15_wpf_popup_delivery_oracle.sql, README.md), zero-rule-server/(web/api .../wpf/WpfPopupController.java·payload/WpfResultRequest.java, service/core .../wpf/WpfPopupService.java·WpfResultProcessor.java, repo/core mappers/popup/PopupMapper.xml·WpfPopupMapper.xml 및 매퍼 인터페이스, domain .../wpf/WpfNextPopupResponse.java·WpfPopupDelivery.java·WpfResultResponse.java·WpfResultCommand.java·WpfPopupItem.java, 관련 테스트), popup-frameWork/Popup/(MainWindow.xaml.cs, Services/PopupApiService.cs·IPopupGateway.cs·PopupResultQueue.cs·PopupResultBuilder.cs·PopupPollingRecovery.cs·DemoPopupGateway.cs, Dtos/WpfNextPopupResponseDto.cs·WpfResultDtos.cs·PopupResponseDto.cs, DemoWindow.xaml(.cs), Factories/PopupFactory.cs, Models/PopupOptions.cs, Managers/PopupManager.cs), docs/interfaces/*, docs/design/(35_*, 05_*), api/examples/*, version-history/CHANGELOG.md.
- 검증: 로컬 XE(POPUP)에 15 스크립트 실행·재실행 SKIP 확인, 03 재실행으로 로컬 ZERO_RULE 권한 부여. 서버 `gradlew test --offline --continue`(POPUP_TEST_DB_PASSWORD 설정) 120건 통과·skip 0 — 단위·실DB 롤백(TEXT 닫기 완료 → 영상 미완료 유예 1800초 → QUIZ → SURVEY → EMPTY → popup=null, 다른 사용자 전달 건 거절)·실서버 HTTP 통합(POST 조회·재사용, 결과 순차·DUPLICATE·popup=null·커밋 확인). WPF 빌드 경고 0·오류 0, BehaviorTests 955건(실제 MainWindow + 가짜 HTTP: 1건 표시 → 닫힘 → deliveryId 결과 → AVAILABLE 즉시 조회 → EMPTY 2700초 대기, 결과 전송 실패 시 조회 보류·10초 복구 예약), RecoveryTests 153건(로컬, 테스트 프로젝트는 .gitignore 대상). 예제 JSON·명세 json 블록·Excel 예시 JSON 파싱, docx 본문 반영 확인. 미실행: 원격 개발 DB 15 스크립트 적용, 실제 서버+WPF 화면 연동, 관리자 웹 영향 확인(관리자 API 변경 없음), 폐쇄망 반입. 실서버 HTTP 테스트에서 JDK HttpURLConnection이 본문 있는 POST의 401 응답 본문을 읽지 못해 무헤더 401은 상태 코드만 확인(본문 코드는 MockMvc 테스트에서 확인).
- 상태: 커밋에 포함. 원격 반영. 원격 개발 DB에 15 스크립트 적용 전에는 새 서버의 조회·결과 API가 ORA-00942로 실패한다.
- 보완(원격 개발 DB 적용): 적용 대상(신규 테이블 1개·인덱스 2개, 기존 객체 변경 없음)을 확인하고 원격 개발 DB(11g XE, `ZERO-RULE` 스키마)에 `15_wpf_popup_delivery_oracle.sql` 실행 — 생성 OK, 행 0. 접속 시 하이픈 계정명은 대문자 `"ZERO-RULE"`로 인용해야 하며 서버 설정(JndiResource)의 접속 정보를 사용. db/oracle/README.md·설계35 적용 현황 갱신. 새 서버 반영·실제 연동 확인은 미실행. 원격 반영.

## 2026-10-13-15 — TODO37 TEXT 콘텐츠 제목·설명을 서식 본문(textBlocks)으로 통합

- 이유: 서식 본문으로 제목·설명 역할까지 표현할 수 있어 TEXT.content의 별도 제목·설명 영역을 본문으로 통합(진행 확정 과제). textBlocks 이름 유지, plainText는 서버 파생값으로 유지하기로 결정.
- 변경:
  - 서버: TEXT 저장 시 CONTENT_TITLE·DESCRIPTION을 NULL로 저장하고 `showContentHeader`를 저장하지 않음(`PopupService`). 조회 시 통합 전 행의 제목·설명을 본문 앞 문단(제목 굵게·24, 설명 기본)으로 합치고 plainText도 같은 순서로 앞에 붙임. textBlocks가 없던 행은 plainText 줄을 문단으로 변환. showContentHeader=false 행의 숨긴 값은 합치지 않음(`PopupRichText.mergeLegacyHeader`, `PopupContentAssembler`). DB 변환 스크립트·DDL 변경 없음(컬럼은 다른 유형이 계속 사용).
  - 관리자 웹: TEXT 편집의 콘텐츠 제목·설명 입력과 `콘텐츠 제목·설명` 스위치 제거, 미리보기의 TEXT 제목·설명 영역 제거.
  - WPF: `TextPopupContentDto`의 ContentTitle·Description·ShowContentHeader, TEXT 화면 제목·설명 영역과 미사용 TitleTextStyle 제거. Demo TEXT 샘플의 제목·설명을 본문 앞 두 문단으로 이동.
  - 문서·샘플: POPUP_INTERFACE_SPEC(3.7 변경 이력에 설계 37 추가, 버전 유지), WPF_POPUP_ALL_SPEC·WPF_POPUP_MINIMAL_SPEC(최소 범위는 세 필드 삭제만, textBlocks 미추가), 옵션 가이드 2종, 미리보기 대응 문서, 예제 JSON 3종, DB 샘플 SQL(SAMPLE-TEXT-001), 설계05 메모, Excel 정의서 TEXT 시트 3행 삭제·메모·Sample 갱신(XML 수준 편집), Word/PDF v3.7 재생성. 설계37 결정·구현·검증 기록 및 카드 대응표 상태 갱신.
- 주요 파일: zero-rule-server/service/core/.../popup/(PopupRichText.java, PopupContentAssembler.java, PopupService.java, PopupContentAssemblerTest.java), zero-rule-web/main/src/features/RgstPop/(PopupEditorDialog.tsx, PopupPreview.tsx), popup-frameWork/Popup/(Dtos/TextPopupContentDto.cs, Factories/PopupFactory.cs, Views/Contents/TextPopupView.xaml(.cs), Services/DemoPopupDataService.cs, DemoOptionsWindow.Fields.cs), docs/interfaces/*, docs/(POPUP_OPTION_GUIDE.md, POPUP_USER_OPTION_GUIDE.md), docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/design/(05_Oracle_DB_설계.md, 37_TEXT_EDITOR_BODY_통합검토_TODO.md), api/examples/wpf-popups-response.json, db/oracle/02_popup_sample_oracle.sql, version-history/CHANGELOG.md.
- 검증: 서버 `gradlew test --offline` 성공(최근 실행 112건, Oracle 연동 6건 skip) — 통합 전 행 합침(여러 줄·빈 줄·기존 textBlocks), 합친 본문의 저장 검증 통과·파생 plainText 일치, 숨김 행 미병합, 저장 옵션 정리 포함. 관리자 웹 `tsc --noEmit`·eslint(변경 파일)·`npm run build` 성공. WPF BehaviorTests 938건·RecoveryTests 146건 통과(로컬, 테스트 프로젝트는 .gitignore 대상), 렌더링 이미지에서 제목이 첫 문단으로 표시됨 확인. 예제 JSON·명세 예제·SQL 옵션 JSON 파싱, Excel TEXT 시트·Sample JSON, docx 본문 확인. 미실행: 브라우저 화면 확인, 실제 서버 연동 재편집 저장, 원격 개발 DB 기존 TEXT 행 조회·샘플 SQL 실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-13-14 — TODO35 착수 전 현행 대조 및 구현 보류 사유 기록

- 이유: 단건 조회·결과 수신 흐름 구현 전 현행 코드 대조에서 결정이 필요한 항목이 확인되어 구현 보류.
- 변경: 설계35 §4에 현행 구조(목록·배치 결과·디스크 대기열), 확정 사항(기존 `GET /api/wpf/popups` 응답을 단건 구조로 교체, 새 경로 없음), 미결 사항(결과 수신 요청 단건/배열, 닫기(CLOSED) 후 재노출 기준) 기록. CLOSED는 완료·숨김으로 기록되지 않아 단건 흐름에서 nextStatus=AVAILABLE → 같은 팝업 재조회가 반복될 수 있고, 현재는 클라이언트 `_shownPopupIds`로 걸러짐을 명시.
- 주요 파일: docs/design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md, version-history/CHANGELOG.md.
- 검증: 서버 `selectAvailablePopups` 제외 조건(숨김·완료), WPF `MainWindow.xaml.cs`의 `_shownPopupIds` 사용 확인. 실행 코드 변경 없음.
- 상태: 커밋에 포함. 원격 반영. 구현 보류(결정 대기).

## 2026-10-13-13 — TODO36 C# 서식 화이트리스트 검토 완료(유지 결정)

- 이유: 서버·웹·C# 서식 허용 규칙 중복 여부와 C# 검사 제거 가능 범위 판단.
- 변경: 세 구현의 색·크기·글꼴·정렬·키·개수 규칙 대조표, 호출 경로별 검증 경계, 표시 변환과 정책 검사 구분, 결정 근거를 설계36에 기록. 서버 검증이 관리자 저장 시에만 실행되고 조회 응답·Demo 내장 샘플은 재검증하지 않아 C# 검사를 표시 단계 방어선으로 유지. 호출처가 없는 `PopupRichText.ToPlainText` 삭제, 클래스 주석에 유지 근거 추가. 허용 규칙·인터페이스 계약 변경 없음. JSON 형식 오류(예: `"bold":"true"`) 시 TEXT 팝업 생성 실패 위험은 범위 밖 잔여 위험으로 기록.
- 주요 파일: docs/design/36_TEXT_서식변환_타입검사_중복검토_TODO.md, popup-frameWork/Popup/Views/Contents/PopupRichText.cs, version-history/CHANGELOG.md.
- 검증: 서버 `validateAndDerivePlainText` 호출처가 `PopupService` 저장 경로뿐임을 grep으로 확인. `ToPlainText` 호출처 없음 확인. BehaviorTests 936건 통과(로컬). 형식 오류 시 예외 동작은 코드 확인만, 실행 재현 안 함.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-13-12 — TODO38 WPF TEXT 기울임 글자 우측 잘림 수정

- 이유: WPF 팝업 서식 본문에서 줄 끝 기울임 글자의 오른쪽 획이 잘리는 표시 오류 수정.
- 변경: 원인을 문단 TextBlock이 ScrollViewer 표시 영역 폭과 같아 기울어진 획 돌출분(글자 크기의 최대 약 33%)이 표시 영역 클리핑에 걸리는 것으로 확인. 외곽 클리핑은 유지하고 기울임 구간이 있는 문단에만 가장 큰 기울임 글자 크기 × 0.35(올림)의 오른쪽 Padding을 두는 `PopupRichText.ReserveItalicOverhang` 추가. 본문 기본 크기 적용(ApplyBodyFontSize) 후 다시 계산. 기울임이 없는 문단은 배치 변화 없음. 기울임 문단의 오른쪽 정렬 줄 끝·줄바꿈 위치가 여유 폭만큼 안쪽으로 이동.
- 주요 파일: popup-frameWork/Popup/Views/Contents/(PopupRichText.cs, TextPopupView.xaml.cs), docs/design/38_WPF_TEXT_기울임_우측잘림_TODO.md, version-history/CHANGELOG.md.
- 검증: BehaviorTests에 `CheckItalicOverhang38` 추가(로컬, .gitignore 대상이라 미커밋) — 폭 300px 오른쪽 정렬 기울임 문단을 경계 밖까지 렌더링해 잉크 위치 측정. 수정 전 실패(잉크 301px) 재현, 수정 후 글꼴 4종 × 크기 2종 × 문자열 3종·본문 크기 32 변경 모두 경계 안, 비기울임 문단 Padding 0. 전체 936건 통과. 실제 팝업 화면·고DPI·사용자 재현 문자열 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영. 실제 화면 회귀 확인 남음. MINIMAL/ALL 명세는 표시 보정으로 계약 변경이 없어 유지.

## 2026-10-13-11 — TODO26 Header/Footer 분리 설계 폐기 상태 동기화

- 이유: Trello 상태와 현행 코드·설계 문서 정합성 보완.
- 변경: 설계26을 Trello와 동일한 폐기로 명시. 과거 체크리스트는 이력으로 보존하며 이미 구현된 PerMonitorV2·Win32 모서리 DPI/드래그 보완은 유지. 주요 파일: docs/design/26_VIDEO_팝업_HWND_구조_개선_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 main과 Trello 카드 대조, VideoPopupView.xaml의 CompositionControl 및 OpaqueWindowCorners.cs의 UpdateLayeredWindow 확인. ALL/MINIMAL 현행 구현 설명 확인, 기능 계약 변경 없어 유지.
- 상태: 문서·카드 정리. 실행 코드 변경·빌드·런타임 테스트 미실행.

## 2026-10-13-10 — TODO25 모서리 구현 설명 및 완료 이력 분류 정정

- 이유: Trello 상태와 현행 코드·설계 문서 정합성 보완.
- 변경: 설계25의 WPF HwndSource·지연 재생성·CompositionControl 미적용 설명을 현행 Win32 레이어드 창·HWND 재사용·적용 상태로 수정. docs/reviews/20261013_TRELLO_완료이력_현행구조_대조.md에 완료 카드의 대체·통합·부분 제거 구분 기록. 주요 파일: 설계25, 대조 문서, version-history/CHANGELOG.md.
- 검증: 최신 main과 Trello 카드 대조, VideoPopupView.xaml의 CompositionControl 및 OpaqueWindowCorners.cs의 UpdateLayeredWindow 확인. ALL/MINIMAL 현행 구현 설명 확인, 기능 계약 변경 없어 유지.
- 상태: 문서·카드 정리. 실행 코드 변경·빌드·런타임 테스트 미실행.

## 2026-10-13-09 — TODO38 WPF 기울임 글자 잘림 TODO 추가

- 이유: WPF 서식 텍스트 표시 오류 추적 필요.
- 변경: WPF 팝업 우측 끝 italic 글자 잘림 증상·원인 가설·재현 및 회귀 검증 과제 등록.
- 주요 파일: docs/design/38_WPF_TEXT_기울임_우측잘림_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO 번호·카드 대응 및 문서 상태 확인. 실행 코드 변경 없이 빌드·테스트 미실행.
- 상태: TODO만 등록, 진행예정. 세부 미전달 선택값은 임의 확정하지 않음.

## 2026-10-13-08 — TODO37 TEXT BODY 통합 진행 확정

- 이유: 협의 과제의 진행 확정을 저장소와 Trello에 일치시킬 필요.
- 변경: BODY 통합을 진행중으로 전환하고 개발 여부 보류 문구 및 세 카드 대응표 갱신.
- 주요 파일: docs/design/37_TEXT_EDITOR_BODY_통합검토_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO 번호·카드 대응 및 문서 상태 확인. 실행 코드 변경 없이 빌드·테스트 미실행.
- 상태: 과제 진행 확정, 구현 완료 아님. 세부 미전달 선택값은 임의 확정하지 않음.

## 2026-10-13-07 — TODO36 C# 화이트리스트 정리 진행 확정

- 이유: 협의 과제의 진행 확정을 저장소와 Trello에 일치시킬 필요.
- 변경: 화이트리스트 검토·정리 과제를 진행중으로 전환하고 제거 범위와 표시 방어 책임 구분 유지.
- 주요 파일: docs/design/36_TEXT_서식변환_타입검사_중복검토_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO 번호·카드 대응 및 문서 상태 확인. 실행 코드 변경 없이 빌드·테스트 미실행.
- 상태: 과제 진행 확정, 구현 완료 아님. 세부 미전달 선택값은 임의 확정하지 않음.

## 2026-10-13-06 — TODO35 API 흐름 진행 확정

- 이유: 협의 과제의 진행 확정을 저장소와 Trello에 일치시킬 필요.
- 변경: API 흐름 과제를 진행중으로 전환하고 복구 정책의 미전달 선택값을 분리.
- 주요 파일: docs/design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO 번호·카드 대응 및 문서 상태 확인. 실행 코드 변경 없이 빌드·테스트 미실행.
- 상태: 과제 진행 확정, 구현 완료 아님. 세부 미전달 선택값은 임의 확정하지 않음.

## 2026-10-13-05 — TODO37 TEXT BODY 통합 및 Trello 협의 과제 대조

- 이유: Trello 진행협의중의 TEXT BODY 통합 논의가 저장소 TODO에서 독립적으로 추적되지 않아 보완.
- 변경: TODO37 추가. TEXT.content 내부의 제목·설명 통합 검토, 공통 헤더와 다른 유형의 범위 구분, 서식 원본·파생 문자열·데이터 보존 검토를 기록. 진행협의중 세 카드와 TODO35~37의 대응표 및 원본 링크 추가.
- 주요 파일: docs/design/37_TEXT_EDITOR_BODY_통합검토_TODO.md, version-history/CHANGELOG.md.
- 검증: 진행협의중 카드 3건과 TODO35~37을 대조해 누락·중복 없음 확인. 카드 상세 설명·체크리스트 없음 확인. 문서 내부 링크 대상 확인.
- 상태: 문서 반영. BODY 통합·화이트리스트 제거 개발 결정 보류, 실행 코드 변경·빌드·테스트 미실행. Trello 카드 상태 유지.

## 2026-10-13-04 — TODO36 TEXT 서식 변환·C# 화이트리스트 중복 검토

- 이유: 서버와 C#의 서식 정책 중복 여부 및 표시 변환·오류 방어 책임을 구분할 필요.
- 변경: 진행협의중 카드 `TEXT EDITOR 화이트리스트 CS쪽 제거 여부 체크`(https://trello.com/c/e9oWww78)를 연결. 기존 popupType 중복 분기 중심 설명을 실제 색상·크기 허용 검사와 글꼴 매핑 검토로 정정.
- 주요 파일: docs/design/36_TEXT_서식변환_타입검사_중복검토_TODO.md, version-history/CHANGELOG.md.
- 검증: 최신 원격 main의 popup-frameWork/Popup/Views/Contents/PopupRichText.cs에서 IsAllowedColor, Sizes.Contains, Fonts.TryGetValue 및 nullable 값 확인을 확인. 파일을 찾지 못했다는 기존 작업본 기준 기록을 정정.
- 상태: 검토 TODO만 수정. 화이트리스트 제거 여부 미결정, 코드 변경·실행 테스트 미실행.

## 2026-10-13-03 — TODO35 단건 팝업 API 흐름 및 응답 상태 정리

- Trello 대조 보완: 진행협의중 카드 `목록 조회,결과저장,결과수신 세단계`(https://trello.com/c/z0xv8TnE)를 TODO35에 연결. 실제 API 구분은 로그인·조회·결과 수신이며 결과 저장은 결과 수신 책임임을 명시. 카드 상태와 미결 정책을 유지하고 문서 링크·중복 과제 여부를 확인.

- 이유: 로그인·조회·결과 수신을 세 API로 분리하고 단건 순차 처리하는 합의 사항과 결과 후속 조회 상태를 구현 전 기준으로 보존할 필요.
- 변경: TODO35 추가. 조회 응답의 매 조회 pollingIntervalSeconds, 단건 nextPopup/null, userId·nextStatus 제외 및 C# 단건 DTO를 기록. 결과 응답의 처리 status와 nextStatus(AVAILABLE/EMPTY)를 구분하고 저장 후 후보 유무 확인 및 회의 미결 복구 정책을 분리.
- 주요 파일: docs/design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md, version-history/CHANGELOG.md.
- 검증: 기존 TODO29~34 확인 후 번호 중복 없음. 설계 문서 추가만으로 실행 테스트 대상 없음.
- 상태: 요구사항·계약 TODO만 추가. 구현·계약 정의서 갱신·빌드·테스트 미실행.

## 2026-10-13-02 — 20261013 폐쇄망 반입본 생성

- 이유: 20261012 반입 이후의 Demo SSO·로그인 분리 테스트(2026-10-13-01)와 설계 17 폐기 문서(2026-10-12-25)를 폐쇄망에 반입하기 위해 새 반입본 필요.
- 변경: main(f4e768e 소스 기준)에서 scripts/export-offline-package.ps1(-IncludeMockSso -NoZip)로 offline-export/20261013 생성. 서버·웹 묶음은 20261012와 바이트 단위로 같아(6ac5375 이후 zero-rule-server·zero-rule-web 변경 없음) 제외하고 3-popup-frameWork·4-docs만 기존 번호로 구성. MockSso 개인 launchSettings 제외. DELETE-SINCE-20260930(20261012와 같은 목록, 머리글 인코딩만 정상화), MANIFEST, 반입 안내(README-IMPORT), 소스 SHA256, TAR·통합 TGZ 및 체크섬 생성. NuGet·SDK는 20261006 반입본 사용(패키지 참조 변경 없음).
- 주요 파일: offline-export/20261013/ (Git 제외), .offline-verify/package-20261013.ps1·finalize-20261013.ps1 (Git 제외), version-history/CHANGELOG.md.
- 검증: 20261012 대비 WPF 묶음은 DemoWindow.AuthTest.cs 1개 추가(86개), 문서 73개 동일 구성. 반입 WPF 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·폴더형 publish와 -SingleFile publish 성공(popupSample.exe 1개, 91,637,582바이트). TAR·TGZ 항목 수·누출(exe·dll·bin/obj·검증 하네스) 검사 통과. 폐쇄망 PC 반입·실행·배포 미실행.
- 상태: 반입본 생성·검증 완료. 이 기록과 2026-10-12-25·2026-10-13-01 항목은 같은 푸시로 원격 반영.
- 보완(20261012 병합): 20261012 반입본을 폐쇄망에 반입하지 못해 20261013 단독으로는 서버·웹 변경이 빠짐. 20261012의 1-zero-rule-server·2-zero-rule-web 묶음과 MANIFEST를 20261013에 합치고(diff -rq로 원본과 동일 확인), README-IMPORT를 20261007 기준 병합 안내(12 반입분·13 추가분·DB 스크립트 순서)로 재작성. 3·4 묶음은 20261012 파일을 모두 포함(WPF는 DemoWindow.AuthTest.cs만 추가, 문서 73개 동일)해 그대로 사용. finalize 스크립트로 4개 TAR·SHA256SUMS·SOURCE-SHA256SUMS·통합 TGZ 재생성. 20261012.tgz는 따로 반입하지 않음. 폐쇄망 반입·서버 병합 빌드·DB 적용 미실행. 병합 기록은 커밋에 포함해 원격 반영.
- 보완(TODO별 패치노트·AGENTS.md 제외): 묶음별 변경 내용과 확인 위치를 알 수 있도록 1·2·3 묶음 루트에 README-PATCH-<묶음>.md를 추가하고 20261007 이후 변경을 TODO별(10·27~34, IMAGE linkUrl 삭제, 관리자 웹 정합성, Demo 보완)로 파일 목록과 함께 정리. 반입 루트 README.md를 덮어쓰지 않도록 묶음별 고유 파일명 사용, 각 MANIFEST에 항목 추가. 20261012 README에서 누락된 설계 27(allowSeek, YouTube 임베드 제거)을 README-IMPORT 변경 목록에 보완. 개발 저장소 작업 규칙인 AGENTS.md를 4-docs·MANIFEST에서 빼고 scripts/export-offline-package.ps1 문서 묶음 ExtraFiles에서도 제외. finalize로 TAR·체크섬·통합 TGZ 재생성. 패치노트 내용은 adf2617..HEAD 커밋별 변경 파일·커밋 메시지와 대조. 미커밋.

## 2026-10-13-01 — TODO10 Demo SSO·로그인 분리 테스트

- 이유: 서버 팝업 API 연동 없이 SSO 사용자 정보 획득과 서버 로그인 API 호출을 각각 확인할 필요가 있어, 기존 관리 화면 "SSO 로그인 테스트"(SSO→로그인 일괄, DemoMode=false 전용)와 별도로 Demo 화면에 단계별 테스트를 추가.
- 변경: appsettings `PopupApi.DemoSsoLoginTest`(기본 false) 추가. true이고 DemoMode이면 Demo 화면에 `SSO · 로그인 테스트` 영역 표시 — `SSO 테스트`는 Auth.SsoUrl GET(Windows 통합 인증) 후 사번·구분 코드를 입력칸에 채우고, `로그인 테스트`는 입력칸 값으로 BaseUrl+Auth.LoginPath POST(직접 입력으로 단독 호출 가능). 결과칸에 주소·값·소요 시간·실패 예외 표시, 토큰은 길이만 표시하고 보관하지 않음. 팝업 조회·결과 전송·정기 재로그인은 Demo에서 계속 수행하지 않음. MainWindow가 설정을 `DemoAuthTestSettings`로 넘기고 App이 DemoWindow에 연결.
- 주요 파일: popup-frameWork/Popup/(DemoWindow.AuthTest.cs, DemoWindow.xaml, App.xaml.cs, MainWindow.xaml.cs, Models/PopupClientSettings.cs, appsettings.json), popup-frameWork/README.md.
- 검증: WPF 빌드(별도 출력 폴더) 경고 0·오류 0. 기본 출력 폴더는 실행 중인 popupSample.exe 잠금으로 복사 실패. 이후 앱 종료 뒤 DemoSsoLoginTest=true로 Debug 재빌드해 출력 DLL에 설정·버튼 영역 포함 확인(설정은 false로 원복, appsettings는 EXE 내장 리소스라 값 변경 시 재빌드 필요). BehaviorTests·실제 화면·MockSso/서버 연동 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-25 — TODO17 단일 EXE 자동 업데이트 폐기

- 이유: 자동 업데이트 과제를 진행하지 않기로 확정해 착수 보류 상태였던 설계 17을 폐기로 정리하고 관련 문서의 상태 표기를 맞춤.
- 변경: 설계 17 상단 우선순위·상태를 폐기로 변경(설계 초안은 기록으로 유지). 설계 09 P3 항목, 설계 14 후속 TODO 항목을 폐기로 표기. WPF_POPUP_ALL_SPEC 미포함 기능 표의 설계 17 설명을 폐기로 갱신. MINIMAL 명세는 해당 항목이 없어 변경 없음.
- 주요 파일: docs/design/17_WPF_단일_EXE_자동업데이트_TODO.md, docs/design/09_전환계획_및_미결사항.md, docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md, docs/interfaces/WPF_POPUP_ALL_SPEC.md.
- 검증: 문서 변경만 있어 빌드·테스트 대상 없음. docs 내 설계 17 참조 문구 grep으로 확인.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-24 — 인터페이스 정의서 Word/PDF v3.7 생성

- 이유: Markdown 정의서 v3.7(설계 29~34, 문서 정합성 보완, IMAGE linkUrl 삭제 반영)에 맞는 Word/PDF 배포본이 없어 생성. 구버전 v2.0·v3.5·v3.6은 docs/interfaces/OLD(Git 제외)로 옮긴 상태.
- 변경: `scripts/export-interface-word.cjs`로 `docs/interfaces/WPF_Popup_API_Interface_v3.7.docx` 생성(표 42·제목 114), `scripts/export-interface-pdf.vbs`(Word COM)로 필드·목차 갱신 후 `WPF_Popup_API_Interface_v3.7.pdf` 생성.
- 주요 파일: docs/interfaces/WPF_Popup_API_Interface_v3.7.docx, docs/interfaces/WPF_Popup_API_Interface_v3.7.pdf.
- 검증: docx 본문에서 버전 3.7 표기·RETRYABLE_ERROR 포함, VERSION 3.6 표기 없음, linkUrl은 3.7 삭제 이력·ORIGINAL 설명에만 남음 확인. Word에서 PDF 내보내기 정상 완료. PDF 화면 검토는 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-23 — 관리자 웹 WPF 기준 미반영 항목 보완(최소·최대 크기, Header 로고, 표시 위치 미리보기)

- 이유: WPF(C#) DTO·창 동작과 관리자 웹을 대조한 결과 WPF가 사용하는 최소·최대 창 크기를 관리자 화면에서 편집할 수 없었고, 미리보기는 WPF에 없는 Header X 닫기 버튼을 그리며 실제 크기 미리보기에 popupPosition이 반영되지 않아 정합성 보완.
- 변경: 크기 설정에 최소·최대 너비/높이 입력 추가(WPF ApplyWindowSize·EffectiveMaximum 기준 — FULLSCREEN은 숨김, IMAGE는 최소만 표시하고 최대는 작업 영역 90% 안내, 그 밖은 네 값 표시, 서버 검증과 같은 양수·최대≥최소 보정). PopupDimensionField에 helperText 선택 prop 추가. 미리보기 Header의 X 버튼을 제거하고 WPF HeaderLogo.png 사본(`public/images/popup-header-logo.png`)을 같은 크기(100×24)·여백으로 클릭 불가 표시. 실제 크기로 보기 모달에 9방향 위치 정렬 적용(브라우저 창을 작업 영역으로 보고 가장자리 여백 일반 24px·영상 0px, FULLSCREEN 무시, 위쪽 배치 시 종료 버튼을 아래로 이동). 미리보기 대응 문서와 사용자 가이드 갱신.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/(PopupEditorDialog.tsx, PopupPreview.tsx), zero-rule-web/main/public/images/popup-header-logo.png, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, docs/POPUP_USER_OPTION_GUIDE.md.
- 검증: `npx tsc --noEmit -p .` 오류 없음, 변경 파일 eslint 통과, `npm run build` 성공(경고는 기존 미변경 파일에서만). 브라우저 화면 확인은 미실행. WPF DTO 대비 관리자 미편집 항목은 서버가 받지 않는 sizeMode AUTO만 남음(설계 09 미결 18).
- 상태: 커밋에 포함. 원격 반영. 남은 차이 — WPF Header 배경은 검정·미리보기 Header는 흰색, WPF 일반 창은 그림자 여백 24px가 창 크기에 포함, 설문·퀴즈 미리보기는 showFooter와 무관하게 제출 영역 표시.

## 2026-10-12-22 — IMAGE linkUrl(이미지 클릭 링크) 삭제

- 이유: IMAGE linkUrl은 WPF에서 ORIGINAL 모드에만 동작하고 관리자 화면은 모든 모드에서 입력·미리보기를 제공해 동작이 엇갈렸음. 이미지 클릭 링크 기능을 사용하지 않기로 확정해 모든 모드에서 제거하고 데이터·코드를 정규화(운영 버전이 없어 하위 호환 없이 처리).
- 변경: WPF — ImagePopupContentDto.LinkUrl, ImageFillPopupView 생성자 인자·손 모양 커서·ToolTip·클릭 처리기, Demo 옵션 창 linkUrl 항목 삭제. 서버 — AdminPopupSaveCommand·PopupEntity linkUrl, PopupMapper LINK_URL 조회·저장, PopupContentAssembler 응답 조립, PopupService 저장값 추출 삭제. 요청 content에 남은 linkUrl은 거부하지 않고 저장 사본 키 목록(폐기 키)으로 버리며 기존 CONTENT_OPTIONS 사본도 응답에 싣지 않음. DB — `db/oracle/14_drop_link_url_oracle.sql`(CONTENT_OPTIONS의 "linkUrl" 키 제거 후 POPUP_CONTENT.LINK_URL 컬럼 삭제, 재실행 시 SKIP), 01 스키마·README, ERD SQL 3종, export-popup-erwin 라벨 갱신. 관리자 웹 — IMAGE 기본값·저장 키·"클릭 연결 URL" 입력·미리보기 링크 삭제(다음 저장 때 기존 값 제거). 문서 — POPUP_INTERFACE_SPEC 3.7 변경 이력·IMAGE 표·ORIGINAL 설명, ALL/MINIMAL·옵션 가이드·사용자 가이드에서 linkUrl 행 삭제, Excel IMAGE 시트 linkUrl 행 삭제(시트 XML 직접 수정)·개요 핵심 변경 추가. footerLinkUrl·bottomDescriptionUrl은 유지.
- 주요 파일: popup-frameWork/Popup/(Dtos/ImagePopupContentDto.cs, Factories/PopupFactory.cs, Views/Contents/ImageFillPopupView.xaml(.cs), DemoOptionsWindow(.Fields).cs), zero-rule-server/(AdminPopupSaveCommand, PopupEntity, PopupMapper.xml, PopupContentAssembler, PopupService, PopupContentAssemblerTest), db/oracle/(14_drop_link_url_oracle.sql, 01_popup_schema_oracle.sql, README.md), ERD/(01~03 SQL), scripts/export-popup-erwin.cjs, docs/interfaces/*, docs/POPUP_OPTION_GUIDE.md.
- 검증: WPF 빌드 경고·오류 0, 로컬 BehaviorTests 910건 통과(ORIGINAL 이미지에 커서·ToolTip 없음 검사 추가), RecoveryTests 빌드 성공(미실행). 서버 service:core 71건·web:api 34건 통과(실DB 테스트 포함, 컬럼 삭제 후 실행), app 컴파일 성공. 로컬 XE에 14 스크립트 실행 — 값 있는 행 0, 키 있는 행 0, 컬럼 삭제 OK, 재실행 SKIP 확인. Excel은 IMAGE·개요 시트 XML만 바뀌고 파일 정상 열림 확인. ERD/model 스냅샷(2026-09-28)과 .erwin은 재생성하지 않음.
- 상태: 커밋에 포함. 원격 반영. 원격 개발 DB에도 14 스크립트 실행 완료(2026-10-12, 값·키 보유 행 0, 컬럼 삭제 OK, 잔여 0). 이전 버전 서버로 원격 DB를 쓰면 LINK_URL 조회 실패.

## 2026-10-12-21 — 불필요 문서 정리 및 문서 정합성 보완

- 이유: 설계 29~34 이후 docs에 이미 해결된 차이 목록·중복 안내·구버전 정의서가 남아 현행 계약과 다른 내용(Header X 닫기, 구 Demo 화면, IMAGE FILL·TEXT 카드, displayStartAt, v3.5·v3.6 표기, Popup.exe 등)을 안내하고 있어 정리 필요.
- 변경(정리): 삭제 — docs/POPUP_ADMIN_UI_GAP.md(미해결 2건 AUTO 크기 모드·기간/반복 정책은 설계 09 미결 18·19로 이관), docs/FOOTER_LINK_VIDEO_QUIZ.md(유효 내용은 POPUP_USER_OPTION_GUIDE §10~11로 흡수), docs/OPTION_LAYOUT_DEMO.md, docs/interfaces/popup-interface-examples.json(삭제된 구 WPF-01~06 예제), 설계 08·16·21(21은 설계 20 §6으로 통합), docs/reviews/20261007_커밋메시지_TODO_분류검토.md. 구버전 Word/PDF(v2.0·v3.5·v3.6)는 docs/interfaces/OLD/로 옮기고 .gitignore에 추가해 로컬에만 보관. zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md는 docs/reviews/로 옮겨 현행 기준으로 재작성(미리보기 Header X 표시·IMAGE linkUrl 모든 모드 링크·popupPosition 미반영을 알려진 차이로 기록). 설계 03에는 대체됨 배너 추가.
- 변경(정합성): POPUP_INTERFACE_SPEC — IMAGE linkUrl ORIGINAL 전용, sentAt 서버 선택, 426 참조 §13.1, 400 의미(결과 API 항목 오류는 200 REJECTED), Header 닫기 서술, results[] 공통 표 보강, 항목 code 값 표 신설, 필수 여부 표기 기준, §15 TEXT textBlocks. ALL/MINIMAL — IMAGE 관리자 신규 기본 ADAPTIVE, 호환 필드 서술 제거, MINIMAL HideDays·DisplayOrder 행과 예시 displayOrder 추가. Excel RESULT_REQUEST VIDEO+QUIZ 예시를 Sample의 문항 301만 쓰도록 수정. Word 생성 스크립트 기본 출력·표지를 v3.7/2026.10.12로 갱신. 가이드 2종·docs/README·루트 README·OFFLINE_WPF_BUILD·popup-frameWork/README·db/oracle/README를 현행 코드(popupSample.exe, TargetFramework·WebView2 버전, Demo 7종, 최상위 공통 옵션, allowSeek, 서식 편집)에 맞춰 갱신. 반입 스크립트의 docs 묶음에서 OLD 제외. 설계 02·05·06·07·09·12·14·18·19·23·24·25·26·30·32에 상태 정정·날짜 메모 추가(23 DB 적용, 30·32 스크립트 13·12 적용, YouTube 제거, showCloseButton 별칭 삭제 등).
- 주요 파일: docs/(README.md, POPUP_OPTION_GUIDE.md, POPUP_USER_OPTION_GUIDE.md), docs/interfaces/(POPUP_INTERFACE_SPEC.md, WPF_POPUP_ALL_SPEC.md, WPF_POPUP_MINIMAL_SPEC.md, WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx), docs/design/*, docs/reviews/POPUP_PREVIEW_WPF_PARITY.md, README.md, OFFLINE_WPF_BUILD.md, popup-frameWork/README.md, db/oracle/README.md, scripts/(export-interface-word.cjs·.ps1, export-offline-package.ps1), .gitignore.
- 검증: 삭제·이동 문서를 가리키는 링크를 저장소 전체에서 검색해 정리(남은 언급은 이관·이동 이력 표기뿐). JSON 예제 5개와 SPEC의 json 블록 파싱 정상, MINIMAL §8 예시와 examples JSON 일치. Excel은 RESULT_REQUEST 시트 XML만 직접 수정하고 다른 엔트리·셀 텍스트 변화 없음 확인. node --check(export-interface-word.cjs), PowerShell 구문 검사(export-offline-package.ps1) 통과. git diff --check 통과. Word 생성기·반입 스크립트 실행, 앱 실행 확인은 미실행. 코드 변경 없음.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-20 — Excel 인터페이스 정의서(WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx) 대조·보완

- 이유: docs/interfaces에 추가된 Excel 인터페이스 정의서를 최신 main 계약과 대조한 결과 일부 비고가 현재 동작과 다르고 최근 결과 처리 규칙이 빠져 있었음. 또 원본에 예전 배치의 병합 영역이 남아 서로 겹치거나 데이터 행을 덮고 있어(TEXT showPlainText~description 4행, 공통 backgroundOverlayOpacity·content 행, SURVEY_QUIZ 영상+퀴즈 추가 필드 표 등) Excel에서 복구 안내가 뜨거나 덮인 행이 보이지 않을 수 있었음.
- 변경: 병합 정리 — 다른 값 셀을 덮는 병합, 겹치는 병합 중 시작 셀이 빈 병합, 남은 겹침 중 작은 범위를 제거(9개 시트, 제거 40건). 셀 값·서식은 유지. 내용 보완 — TEXT 정렬·글자색(대문자 #RRGGBB, 팔레트 제한 없음)·크기(12~32px 8종)·글꼴 ID 4종, IMAGE linkUrl은 ORIGINAL 전용, RESULT_REQUEST sentAt 서버 필수 아님·answers/optionIds null 요소 금지·HIDDEN 우선순위, RESULT_RESPONSE 예시 메시지를 실제 서버 문구로 바꾸고 오류 분류 기준 표(HTTP·항목 status·code·WPF 처리, 미확정 결과 비전송) 추가, 개요 핵심 변경에 설문·퀴즈 SUBMIT 전용·항목 오류 분류·큐 삭제 기준 추가. 설계 29~33의 Excel 반영 항목과 34-43 완료 처리.
- 주요 파일: docs/interfaces/WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx, docs/design/(29_*·30_*·31_*·32_*·33_*·34_*).
- 검증: 편집 전 원본 백업. 첫 시도(openpyxl 저장)에서 겹친 병합에 덮인 셀 값이 지워지는 것을 확인해 즉시 원본으로 되돌리고(해시 일치), 시트 XML을 직접 편집하는 방식으로 다시 작업. 결과 파일에서 모든 XML 파싱 정상, 병합 겹침·데이터 덮음 0건, 원본 대비 셀 값 차이가 의도한 셀(14개 셀 수정·RESULT_RESPONSE 43~51행 추가)뿐임을 확인. openpyxl로 경고 없이 열리고 다시 저장해도 값 손실 없음. Excel 자동화(COM)는 이 PC에서 등록 오류(E_NOINTERFACE)로 실행할 수 없어 Excel 화면 확인 미실행.
- 상태: 커밋에 포함. 원격 반영. 20261012 반입본에는 이 Excel 정의서가 포함되지 않음.

## 2026-10-12-19 — TODO34 결과 항목 변환 예외 상태 분리

- 이유: 2026-10-12-15에서 추가한 검증 후 변환(toCommand) 예외 처리가 모든 RuntimeException을 REJECTED/WPF_INVALID_RESULT로 응답해, 서버 코드 결함 등 원인 미확정 오류도 WPF가 영구 오류로 보고 결과를 삭제할 수 있었음(보존 정책과 충돌).
- 변경: WpfPopupController의 항목 처리를 processItems로 분리하고, validationError()로 확인한 입력 오류만 REJECTED/WPF_INVALID_RESULT, 검증 통과 후 예상하지 못한 변환 예외는 INTERNAL_ERROR/WPF_INTERNAL(상세 비노출, error 로그)로 응답. 항목별 처리·요청 순서 유지는 그대로. 계약서 11장에 변환 예외 상태 추가, popup-frameWork/README의 메모리 보관 설명을 "이미 확정된 항목의 재기록 실패·앱 종료 중 결과만"으로 좁힘, 설계 34-19 보완 기록.
- 주요 파일: zero-rule-server/web/api/.../popup/wpf/WpfPopupController.java, WpfPopupControllerTest.java, docs/interfaces/POPUP_INTERFACE_SPEC.md, popup-frameWork/README.md, docs/design/34_*.
- 검증: 변환 예외를 강제로 발생시키는 항목(Mockito)과 정상 항목·형식 오류 항목을 함께 처리해 정상은 ACCEPTED, 변환 예외는 INTERNAL_ERROR(WPF_INTERNAL, 상세 비노출), 형식 오류는 REJECTED이며 응답 순서가 요청 순서와 같음을 확인. 로컬 XE DB 연동 포함 서버 105건 통과(skip 0), :app 컴파일 통과. WPF 코드 변경 없음(INTERNAL_ERROR 보관·제한 재시도는 기존 RecoveryTests로 확인됨).
- 상태: 커밋에 포함. 원격 반영. 20261012 반입본에는 포함되지 않음(반입 후 변경).

## 2026-10-12-18 — 20261012 폐쇄망 반입본 생성

- 이유: 20261007 반입 이후의 설계 28(TEXT 서식) 후속·29~34(WPF 목록·결과 계약 정리, Footer·공통 UI 옵션 최상위, WPF 판정값 저장, 결과 재전송 정합성)·DB 스크립트 12·13·단일 EXE 빌드 옵션을 폐쇄망에 반입하기 위해 새 반입본 필요. 서버·웹·WPF가 계약을 함께 바꿨으므로 세 묶음을 모두 포함.
- 변경: main(7d3d26a 소스 기준, 변경 이력은 이 기록 포함 커밋)에서 scripts/export-offline-package.ps1(-IncludeMockSso -NoZip)로 offline-export/20261012 생성 후 기존 번호 체계(1-zero-rule-server·2-zero-rule-web·3-popup-frameWork·4-docs)로 정리. MockSso 개인 launchSettings 제외. DELETE-SINCE-20260930(20261007과 같은 목록, adf2617 이후 신규 삭제 없음), MANIFEST, 반입 안내(README-IMPORT), 소스 SHA256, TAR·통합 TGZ 및 체크섬 생성. NuGet·SDK는 20261006 반입본 사용(adf2617 이후 csproj·package.json·Gradle 의존성 변경 없음). 20261006의 6-offline-packages에는 예전 scripts/build-wpf-offline.ps1이 들어 있어 의존 묶음을 먼저 풀고 3-popup-frameWork를 덮어써야 함을 반입 안내에 명시.
- 주요 파일: offline-export/20261012/ (Git 제외), .offline-verify/package-20261012.ps1·finalize-20261012.ps1 (Git 제외), version-history/CHANGELOG.md.
- 검증: 묶음 구성 확인(서버 A88·M7, 웹 A7·M9·D1, WPF 85, 문서 82). 실행 산출물(exe·dll·pdb)·bin/obj·검증 하네스 누출 없음. 반입 WPF 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·폴더형 publish와 -SingleFile publish 성공(출력 폴더에 popupSample.exe 1개, 91,631,950바이트). 서버·웹 묶음은 git diff 기준 파일 목록이며 폐쇄망 기존 소스 병합·빌드는 미실행. 구현 검증은 2026-10-12-15 기준(서버 104·행동 905·복구 146, 이후 Demo 경로 변경으로 행동 906). 폐쇄망 PC 반입·실행·배포, 폐쇄망 DB 12·13 스크립트 적용 미실행.
- 상태: 반입본 생성·검증 완료. 이 기록과 2026-10-12-15~17 항목은 같은 푸시로 원격 반영.

  재생성: 최초 생성 이후의 결과 항목 변환 예외 상태 분리(2026-10-12-19)와 Demo 창 높이 미세 조정(7dcbbaa, DemoWindow.xaml 1줄)을 반영하기 위해 main 7dcbbaa 기준으로 offline-export/20261012를 지우고 같은 절차로 다시 생성(이 보완 기록 포함 커밋의 변경 이력으로 4-docs 교체). 묶음 구성은 같음(서버 A88·M7, 웹 A7·M9·D1, WPF 85, 문서 82). 서버 묶음의 WpfPopupController에 processItems 반영, WPF 묶음의 DemoWindow.xaml이 저장소와 같음을 확인. 반입 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·폴더형 publish와 -SingleFile publish 성공(popupSample.exe 1개, 91,631,950바이트). 구현 검증은 서버 105건(로컬 XE DB 연동 포함). 재생성 기록 커밋은 원격 반영. 폐쇄망 PC 반입·실행·배포, 폐쇄망 DB 12·13 적용 미실행.

  재생성(2차): 문서 정리·정합성 보완(2026-10-12-21), IMAGE linkUrl 삭제·DB 14(2026-10-12-22), 관리자 웹 WPF 정합성 보완(2026-10-12-23), 정의서 Word/PDF v3.7(2026-10-12-24)을 반영하기 위해 main 6ac5375 소스 기준으로 offline-export/20261012를 지우고 같은 절차로 다시 생성(이 보완 기록 포함 커밋의 변경 이력으로 4-docs 교체). 묶음 구성: 서버 A88·M7, 웹 A8·M8·D2, WPF 85, 문서 73(구버전 Word/PDF는 docs/interfaces/OLD 제외 규칙으로 미포함, Excel 정의서·Word/PDF v3.7 포함). DELETE-SINCE-20260930에 이번 문서 정리 삭제분 14개 추가(반입 안내에 구버전 Word/PDF는 OLD로 옮겨 보관 가능하다고 명시). 반입 안내에 DB 적용 순서 13 → (서버 교체) → 12 → 14 반영. 반입 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·폴더형 publish와 -SingleFile publish 성공(popupSample.exe 1개, 91,630,926바이트). 재생성 기록 커밋은 원격 반영. 폐쇄망 PC 반입·실행·배포, 폐쇄망 DB 12·13·14 적용 미실행.

## 2026-10-12-17 — 오프라인 빌드 스크립트 단일 EXE 옵션

- 이유: 폐쇄망 빌드 스크립트(build-wpf-offline.ps1)는 폴더형 게시만 지원했고, 단일 EXE 게시는 온라인 NuGet 원본을 쓰는 README 명령으로만 안내되어 있었음. 오프라인 패키지로 실행 파일 하나만 내보낼 수 있게 함.
- 변경: scripts/build-wpf-offline.ps1에 -SingleFile 스위치 추가 — FolderProfile.pubxml과 같은 설정(PublishSingleFile·IncludeNativeLibrariesForSelfExtract·EnableCompressionInSingleFile·DebugType=None·DebugSymbols=false)에 참조 설명서(.xml) 제외(AllowedReferenceRelatedFileExtensions=.pdb)를 더해 popup-frameWork\publish\win-x64-single에 게시. 옵션 없이 실행하면 기존 폴더형 게시(publish\win-x64)와 같음. restore·publish 종료 코드 확인 추가. OFFLINE_WPF_BUILD.md에 사용법·포함 범위·WebView2 Runtime 별도 설치 필요 기록.
- 주요 파일: scripts/build-wpf-offline.ps1, OFFLINE_WPF_BUILD.md.
- 검증: -SingleFile로 스크립트를 실행해 출력 폴더에 popupSample.exe(91,631,438바이트) 1개만 생성됨을 확인. 생성된 EXE 실행·폐쇄망 PC 확인과 옵션 없는 폴더형 게시 재실행은 미실행.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-16 — Demo 샘플 절대경로 구분자 '/' 치환

- 이유: Demo 요청·응답 JSON 로그에서 로컬 미디어 절대경로가 "C:\\Users\\...\\demo-video.mp4"처럼 JSON 이스케이프로 표시되어 읽기 어려움. 슬래시 구분자 절대경로가 실제 재생에 문제없음을 확인해 Demo 샘플 경로만 텍스트 치환.
- 변경: DemoPopupDataService가 Demo 샘플 content에 넣는 imageUrl·videoUrl(DemoMediaPathService 반환값)의 '\'를 '/'로 치환. 미디어 파일 위치·추출 로직, 서버·관리자 데이터, 실제 API 경로 처리는 변경 없음.
- 주요 파일: popup-frameWork/Popup/Services/DemoPopupDataService.cs, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 행동 검증 CheckDemoVideoPath를 '/' 구분자·파일 존재(영상·이미지)·JSON 왕복 검증으로 갱신해 906건 통과(Demo 이미지·영상을 쓰는 기존 렌더링·재생 검증 포함). 실행 중인 popupSample이 기본 출력 파일을 잠그고 있어 임시 출력 경로로 빌드·실행. 실제 Demo 화면 재생은 개발자 확인 완료로 전달받음.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-15 — TODO34 결과 큐 2차 검토 보완(미확정 결과 선전송·answers null 요소)

- 이유: 2026-10-12-14 변경 검토에서 두 가지 확인. ① 저장 실패로 닫기를 취소해도 항목이 큐 메모리(_unsaved)에 남아 다른 Flush(폴링·다른 팝업 종료)로 먼저 전송될 수 있었고, 사용자가 '다시 보지 않기' 등을 바꿔 다시 닫으면 같은 resultId가 DUPLICATE로 처리되어 최종 결과가 반영되지 않았음. 제출 저장 실패 경로도 같은 문제. ② 결과 요청 answers가 List<@Valid Answer>라 [null] 요소가 검증을 통과한 뒤 변환(Answer::toAnswer)에서 NullPointerException이 나, 같은 요청의 정상 항목까지 처리되지 않을 수 있었음. 또 계약서의 "HTTP 400은 envelope 오류에만" 설명은 JSON 역직렬화 오류(잘못된 날짜·숫자 자료형)가 여전히 전체 400인 구현과 맞지 않았음.
- 변경(WPF): PopupResultQueue.Enqueue는 디스크 저장에 실패하면 항목을 어디에도 남기지 않고 예외를 던짐(미확정 결과 비전송). 창은 상태를 유지하다 다음 닫기·제출 때 결과를 다시 만들어 같은 resultId로 저장. 앱 종료 중에만 RetainForExit(PopupOptions.RetainResultForExit)로 메모리에 남겨 종료 직전 전송을 시도(종료 후 유실 가능). 이미 파일에 있던 확정 항목의 재기록 실패만 메모리에 보관.
- 변경(서버): WpfResultRequest의 answers를 List<@NotNull @Valid Answer>, optionIds를 List<@NotNull Long>로 바꿔 null 요소를 항목 검증 오류로 처리. 컨트롤러는 검증 후 변환(toCommand)에서 예외가 나도 그 항목만 REJECTED(WPF_INVALID_RESULT)로 돌리고 로그를 남김.
- 문서: 계약서 11장 — "요청 외곽 구조 및 JSON 역직렬화 오류는 HTTP 400, 역직렬화 후 항목 검증 오류는 항목별 REJECTED"로 정정, 미확정 결과 비전송 규칙 추가. popup-frameWork/README 결과 큐, 설계 34-19·23 보완 기록.
- Demo videoUrl 확인: Demo 요청·응답 JSON 로그의 "C:\\Users\\Administrator\\AppData\\Local\\Popup\\DemoMedia\\<해시>\\demo-video.mp4"는 JSON 문자열 이스케이프(\\ = \)로 정상. 실제 값은 단일 백슬래시 로컬 경로이며 파일이 존재(9,403,080바이트)하고 JSON 왕복 시 같은 값으로 복원됨을 행동 검증으로 확인(CheckDemoVideoPath). 코드 변경 없음.
- 주요 파일: popup-frameWork/Popup/(Services/PopupResultQueue.cs, Managers/PopupManager.cs, Models/PopupOptions.cs, MainWindow.xaml.cs, DemoWindow.xaml.cs, README.md), zero-rule-server/web/api/.../payload/popup/wpf/WpfResultRequest.java, zero-rule-server/web/api/.../popup/wpf/WpfPopupController.java, WpfPopupControllerTest.java, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/34_*, popup-frameWork/Popup.BehaviorTests·Popup.RecoveryTests/(로컬 전용).
- 검증: 서버 컨트롤러 혼합 요청 테스트에 answers:[null]·optionIds:[null] 항목 추가(정상 항목 처리, 해당 항목만 REJECTED), 로컬 XE DB 연동 포함 서버 104건 통과(skip 0), :app 컴파일 통과. RecoveryTests: 저장 실패 결과 미전송, RetainForExit 항목만 메모리 전송, 손상 파일 사용 불가 시 실패 결과 미전송·종료 보관분 전송으로 갱신해 146건 통과. BehaviorTests: 닫기 저장 실패 후 '다시 보지 않기'를 바꿔 다시 닫으면 최종 상태(HIDDEN)로 1건 저장, Demo videoUrl 경로 검증 추가해 905건 통과. 실행 중인 popupSample(PID 35976)·Visual Studio가 Popup/bin 출력 파일을 잠그고 있어 WPF 테스트는 임시 출력 경로(-p:OutDir)로 빌드·실행(컴파일 경고·오류 없음 확인). 실제 디스크 장애·앱 종료 중 저장 실패는 미확인.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-14 — TODO34 결과 큐 검토 지적 보완(닫기 저장 실패·손상 파일 보존 실패·400 차단)

- 이유: 2026-10-12-10 구현 검토에서 세 가지 결함 확인. ① 일반 닫기 경로가 디스크 저장 실패를 로그로만 처리하고 창을 닫아, 전송도 실패한 채 프로그램이 종료되면 결과가 유실될 수 있었음(34-23 "영속 저장 후 닫기" 미충족 — 10번 항목의 완료 판정 정정). ② 손상 큐 파일을 .corrupt로 옮기지 못해도 빈 목록으로 진행해 이후 저장에서 원본이 삭제·덮어써질 수 있었음. ③ 서버가 항목 형식까지 @Valid로 검사해 한 항목의 형식 오류가 요청 전체 400이 되고, WPF는 4xx를 보관 후 같은 50건을 반복 전송해 뒤의 정상 결과까지 계속 대기할 수 있었음(결과 요청 javadoc의 "항목 형식 오류가 요청 전체를 400으로 만들지 않는다"는 설명과도 불일치).
- 변경(WPF): 일반 결과 저장 실패 시 안내('저장하지 못했어요') 후 닫기를 취소하고, 다시 닫으면 같은 resultId로 재시도(TryEnqueueBeforeClose). 앱 종료(App.IsExiting·Dispatcher 종료) 중에는 닫기를 막지 않으며 이때 메모리 보관분은 유실될 수 있음. 손상 파일 이동에 실패하면 IOException으로 중단해 원본을 덮어쓰지 않고, Enqueue는 저장 실패를 알리며(항목은 메모리 보관) Flush는 파일을 건드리지 않고 메모리 보관분만 전송·종결. HTTP 400이면 batch를 반으로 나눠 재전송해 원인 항목을 좁히고, 단독으로도 400인 항목은 이번 실행에서만 제외(파일 보관, 다음 실행 재시도).
- 변경(서버): 결과 요청은 envelope(clientRequestId·results 1~50개)만 @Valid로 400 처리하고, 항목 형식(Bean Validation 제약·resultType ENUM·score 유한값)은 Item.validationError()로 항목마다 검사해 실패 항목만 REJECTED(WPF_INVALID_RESULT)로 응답, 나머지는 처리하며 응답 순서는 요청 순서 유지. resultType은 문자열로 받아 대소문자 무시로 변환(알 수 없는 값은 항목 REJECTED).
- 문서: 계약서 11장 상황표(400 분리 처리, 항목 형식 오류 REJECTED), popup-frameWork/README 결과 큐, 설계 34-19·23·24 보완 기록.
- 주요 파일: popup-frameWork/Popup/(Services/PopupResultQueue.cs, Managers/PopupManager.cs, App.xaml.cs, README.md), zero-rule-server/web/api/.../payload/popup/wpf/WpfResultRequest.java, zero-rule-server/web/api/.../popup/wpf/WpfPopupController.java, WpfPopupControllerTest.java, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/34_*, popup-frameWork/Popup.BehaviorTests·Popup.RecoveryTests/(로컬 전용).
- 검증: 서버 컨트롤러 테스트에 정상 2건·형식 오류 4건(알 수 없는 resultType·hideDays 0·video 형식·빈 resultId) 혼합 요청이 200으로 정상 항목만 처리되고 오류 항목만 REJECTED되는지 추가, 로컬 XE DB 연동 포함 서버 104건 통과(skip 0), :app 컴파일 통과. RecoveryTests에 400 원인 항목 격리·같은 실행 미재전송·이후 결과 비차단·다음 실행 재시도, 손상 파일 이동 불가 시 Enqueue 실패 통지·메모리분 전송·원본 미변경 검증을 추가해 145건 통과. BehaviorTests에 닫기 중 디스크 저장 실패 시 안내·창 유지, 재시도 시 같은 resultId 1건 저장 검증을 추가해 902건 통과. WPF 앱 빌드 경고·오류 0. 실제 디스크 장애·앱 종료 중 저장 실패는 미확인.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-13 — TODO34-03 결과 응답 미사용 필드 제거

- 이유: 34-03 결정. 결과 응답의 ROOT receivedAt과 popupStatus·completed·completedAt·responseId는 WPF가 읽지 않고 서버·WPF 로그에도 쓰이지 않음을 확인(서버 요청 로그는 컨트롤러의 자체 수신 시각과 상태별 건수만 기록, WPF 큐 로그는 popupId·resultType·code·message만 사용)해 제거. popupId·resultType은 거절·미종결 로그 진단용으로 유지.
- 변경(서버): WpfResultItemResponse를 resultId·popupId·resultType·status·code·message만 남기고 Builder 제거(accepted/duplicate/rejected/failed 팩토리), WpfResultResponse에서 receivedAt 제거. WpfResultProcessor의 응답 조립용 상태 조회(selectStatus) 4곳 제거로 결과 항목당 조회 1회 감소(완료·숨김·시청·응답 저장은 그대로). 요청 로그 응답 요약을 상태별 실제 건수(accepted·duplicate·rejected·retryable_error·internal_error)로 바꾸고 success를 "모두 ACCEPTED·DUPLICATE"로 판정 — 2026-10-12-10 변경 후 일시·미확정 오류가 duplicate로 집계되던 문제 수정.
- 변경(WPF): WpfResultResponseDto.ReceivedAt, WpfResultItemResponseDto.PopupStatus·Completed·CompletedAt·ResponseId 삭제. Demo 게이트웨이 응답 설정 제거(완료·숨김 상태 관리는 유지).
- 문서: 계약서 11장 응답 예시·필드표·제거 필드 안내, 결과 응답 예제 JSON, 설계 34 §3.4 대조표·34-03 갱신.
- 주요 파일: zero-rule-server/domain/.../popup/wpf/(WpfResultItemResponse.java, WpfResultResponse.java, WpfUserPopupStatus.java), zero-rule-server/service/core/.../popup/wpf/(WpfResultProcessor.java, WpfPopupService.java), zero-rule-server/web/api/.../popup/wpf/WpfPopupController.java, 서버 테스트(WpfResultProcessorTest·WpfPopupServiceTest·WpfPopupDatabaseTest·WpfPopupControllerTest), popup-frameWork/Popup/(Dtos/WpfResultDtos.cs, Services/DemoPopupGateway.cs), api/examples/wpf-results-response.json, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/34_*, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 응답 필드 부재(서버 record·HTTP JSON·C# DTO) 검증 확대, DB 연동 테스트의 완료·숨김 확인을 응답 필드 대신 USER_POPUP_STATUS 조회로 변경, 요청 로그 요약 문자열 검증 추가. 로컬 XE DB 연동 포함 서버 103건 통과(skip 0), :app 컴파일 통과. WPF 행동 검증 900건(Demo 완료 확인을 다음 목록 제외 여부로 변경), 재전송 큐 137건 통과.
- 상태: 커밋에 포함. 원격 반영.

## 2026-10-12-12 — TODO34-39·41 모달 안내 흐름 자동 검증

- 이유: 완료 전 닫기 금지 VIDEO의 Footer 동작 우회 여부(34-39)와 QUIZ 미통과 후 재제출 흐름(34-41)은 Win32 MessageBox·PopupAlert 모달이 테스트 실행을 멈춰 실제 화면 확인 대상으로 남아 있었음.
- 변경: 로컬 전용 행동 검증에 같은 UI 스레드의 보이는 최상위 창을 제목으로 찾아 WM_CLOSE로 닫고 뜬 안내창을 기록하는 도우미를 추가하고 CheckModalFlows34 작성. VIDEO(완료 비율 0.8, 완료 전 닫기 금지)에서 CLOSE·LINK_AND_CLOSE 각각 Footer 클릭 시 '필수 영상 시청' 안내만 뜨고 창이 유지되며 바로가기가 실행되지 않음(차단이 뚫리면 잘못된 URL 안내가 떠 구분)을 확인. QUIZ는 PopupManager 경로로 오답 제출 → '다시 도전해 주세요'·창 유지·결과 미저장, 정답으로 고쳐 재제출 → '평가를 통과했어요'·창 닫힘·통과 SUBMITTED 1건(100점) 저장을 확인. 실제 창을 띄우므로 키보드 포커스에 민감한 기존 검증 뒤(마지막)에 실행. 제품 코드 변경 없음. 설계 34-39·41 체크.
- 주요 파일: popup-frameWork/Popup.BehaviorTests/Program.cs(로컬 전용, Git 제외), docs/design/34_*.
- 검증: 행동 검증 895건 통과(2회 연속 실행). 첫 배치에서는 새 검증을 앞쪽에 두어 뒤의 'Space 키 라디오 선택' 검증이 포커스 영향으로 실패했고, 실행 순서를 마지막으로 옮겨 해결.
- 상태: 문서 커밋에 포함(검증 프로젝트는 Git 제외). 원격 반영. 34-46(유형별 실제 화면 육안 확인) 미실행.

## 2026-10-12-11 — TODO34 공통 옵션 기본값·빈 값 정책 및 문서 정합성

- 이유: 34-31·32(false/0을 누락으로 취급하지 않음, null·빈 문자열·미지원 enum 처리의 서버·WPF·문서 일치)와 34-42(설계 29~33의 상충 문구 정리) 반영. 서버는 응답 조립에서 빈 문자열을 기본값으로 처리하면서 등록 검증에서는 Footer 동작·위치·폰트의 빈 문자열을 거부해 정책이 어긋나 있었음.
- 변경: PopupFooterAction.explicitValue 추가, 등록 검증(Footer 동작·Overlay·위치·폰트 크기)에서 null·빈 문자열을 생략(유형별 기본값)으로 처리. 미지원 값·유형에 맞지 않는 Action 거부는 유지. 계약서 §6.4에 빈 값·false/0·non-nullable 정책 명시. 설계 30·31 §8(단계별 호환)과 33 §5(응답 유지 목록)에 설계 34로 대체되었음을 안내하고, 설계 34 체크리스트를 구현·검증 결과로 갱신(41개 완료, 34-03·39·41·43·46·47 미완료 사유 기록).
- 주요 파일: zero-rule-server/domain/.../popup/PopupFooterAction.java, zero-rule-server/service/core/.../popup/PopupService.java, PopupActionOptionsTest.java, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/(30_*, 31_*, 33_*, 34_*), popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 서버 빈 값·false/0 테스트 추가, 로컬 XE DB 연동 포함 :service:core popup·:web:api popup 103건 통과(skip 0), :app 컴파일 통과. WPF 행동 검증에 false/0 유지·빈/null enum 기본값 검증을 추가해 890건 통과. 최소 정의서는 기본값 기술이 그대로 맞아 변경 없음.
- 상태: 커밋에 포함. 원격 반영. 미완료: 34-03(응답 삭제 후보 5개 필드 확정), 34-39·41·46(실제 Windows 화면 확인), 34-43(Excel 정의서 저장소에 없음).

## 2026-10-12-10 — TODO34 RESULT 처리 상태별 큐 삭제·재전송 정합성

- 이유: 서버가 원인 미확정 오류까지 REJECTED/WPF_INTERNAL로 돌려주고 WPF 큐는 응답에 resultId만 있으면 상태와 무관하게 삭제해, 일시 장애로 저장 실패한 결과가 재시도 없이 소실될 수 있었음(34-19~24). 삭제 기준을 "서버 응답 수신"이 아니라 "항목 처리 종결"로 확정한 최종안 반영. 요청 데이터와 목록 조회 방식은 변경하지 않음.
- 변경(서버): WpfResultItemResponse.Status에 RETRYABLE_ERROR·INTERNAL_ERROR 추가, failed() 팩토리 추가. WpfPopupService.processResults는 IllegalArgumentException만 REJECTED로, 예외 형식(원인 체인 포함: TransientDataAccessException·RecoverableDataAccessException·DataAccessResourceFailureException·CannotCreateTransactionException·TransactionTimedOutException·SQLTransientException·SQLRecoverableException)으로 확인된 일시 장애는 RETRYABLE_ERROR(WPF_RETRYABLE), 그 밖은 INTERNAL_ERROR(WPF_INTERNAL, 상세 비노출)로 응답. 메시지 문자열로 판단하지 않음. 항목 처리와 영수증은 기존 REQUIRES_NEW 트랜잭션이라 실패 항목은 롤백 후 응답(확인).
- 변경(WPF): PopupResultQueue를 이번 batch의 resultId이면서 ACCEPTED·DUPLICATE·REJECTED인 항목만 제거하도록 변경. RETRYABLE_ERROR·알 수 없는 상태·응답 누락·다른 batch 응답은 보관, INTERNAL_ERROR는 실행당 3회(임시값)까지만 재시도하고 소진해도 삭제하지 않음(다음 실행에서 재시도). 파일 잠금과 전송 잠금을 분리해 전송 중에도 저장이 즉시 끝나고, 전송 후 최신 파일을 다시 읽어 종결 항목만 제거(전송 중 저장 항목 보존). 임시 파일 기록 후 교체, 손상 파일은 pending-results.corrupt-시각.json으로 보존, 디스크 저장 실패 항목은 실행 중 메모리에 보관했다가 재기록·전송. 일반 결과(CLOSED/HIDDEN/VIDEO_WATCHED)를 Closed 이후 비동기 저장에서 Closing(취소되지 않은 경우) 동기 저장으로 옮겨 제출 경로와 순서 통일(PopupOptions.EnqueueResultAsync → EnqueueResult, 제출 경로 동기화). 재시도 간격·최대 횟수·재개 시점은 기존 전송 시점을 유지하고 별도 확정 대상으로 남김.
- 문서: 계약서 3.7(status 5종, 상황별 HTTP·status·WPF 처리 표, 서버·WPF 기준, 백엔드 체크리스트), 전체 정의서 결과 행, popup-frameWork/README 결과 큐 흐름, 설계 34-19~24 갱신. 최소 정의서에는 결과 큐 기술이 없어 변경 없음.
- 주요 파일: zero-rule-server/domain/.../popup/wpf/WpfResultItemResponse.java, zero-rule-server/service/core/.../popup/wpf/WpfPopupService.java, 서버 테스트(WpfPopupServiceTest·WpfPopupDatabaseTest), popup-frameWork/Popup/(Services/PopupResultQueue.cs, Managers/PopupManager.cs, Models/PopupOptions.cs, MainWindow.xaml.cs, DemoWindow.xaml.cs, README.md), docs/interfaces/(POPUP_INTERFACE_SPEC.md, WPF_POPUP_ALL_SPEC.md), docs/design/34_*, popup-frameWork/Popup.BehaviorTests·Popup.RecoveryTests/(로컬 전용).
- 검증: 서버 분류 테스트(데드락·연결 불가·원인 체인 SQLRecoverableException → RETRYABLE_ERROR, 무결성 위반·메시지에 timeout/deadlock이 있는 IllegalStateException → INTERNAL_ERROR) 추가, DB 연동 테스트에 DUPLICATE 재전송 시 표시 횟수·영수증 미증가 검증 추가. 로컬 XE 대상 DB 연동 포함 :service:core popup·:web:api popup 102건 통과(skip 0), :app 컴파일 통과. RecoveryTests에 상태별 종결·보관, 다른 batch 응답 무시, INTERNAL_ERROR 실행당 3회·미삭제·다음 실행 재전송, RETRYABLE_ERROR 매번 재전송, 요청 전체 실패 보관, 전송 중 저장 보존, 손상 파일 보존·임시 파일 미잔존, 디스크 저장 실패 시 메모리 보관 후 전송 검증을 추가해 137건 통과. BehaviorTests에 CLOSED·HIDDEN이 Closed 이전에 한 번만 저장되는지 검증을 추가해 888건 통과. WPF 앱 빌드 경고·오류 0. 실제 서버 장애 상황(DB 중단)과 Windows 화면·프로세스 강제 종료 확인은 미실행.
- 상태: 커밋에 포함. 원격 반영. 재시도 간격·최대 횟수·재개 시점 정책 미확정.

## 2026-10-12-09 — TODO34 RESULT 응답 필드 추가 정리 및 대조표

- 이유: TODO34 §3.1 확정 사항 중 미반영이던 응답 hiddenUntil·watchedRatio·requiredRatio 제거와, 나머지 RESULT 필드의 사용처·필요성 기록(34-01~06), 체류 시간·문항별 점수 의미 문서화(34-09·16) 필요.
- 변경: Java WpfResultItemResponse에서 hiddenUntil·watchedRatio·requiredRatio와 Builder.video 제거(status()의 hiddenUntil 복사 제거), WpfResultProcessor의 영상 비율 응답 조립 제거(saveVideoProgress·hidePopup 내부 처리 유지). C# WpfResultItemResponseDto에서 HiddenUntil·WatchedRatio·RequiredRatio 삭제, Demo 게이트웨이 응답 설정 제거(Demo 숨김 상태는 유지). 결과 응답 예제 JSON·계약서 11장 갱신. TODO34 §3.4에 요청·응답 필드 대조표(WPF 생성·서버 사용·상태) 추가: receivedAt·popupStatus·completed·completedAt·responseId는 WPF 미사용으로 삭제 후보 표시(확정 대기), popupId·resultType은 거절 로그용으로 유지 권장, sentAt은 서버 미사용 기록. resultId(결과 멱등 키)와 responseId(서버 응답 레코드 ID) 구분 명시. closedAt - displayedAt을 화면 체류·처리 시간으로 정정(계약서·WpfResultCommand·설계 32), 서버가 USER_POPUP_STATUS에 사용자·팝업 단위 최신 시각만 보존함을 기록. 문항별 점수·정오답은 진단값이고 최종 점수·통과·완료는 WPF 값 기준임을 계약서 10.6에 명시. 실제 pending-results.json 없음 확인(34-10).
- 주요 파일: zero-rule-server/domain/.../popup/wpf/(WpfResultItemResponse.java, WpfResultCommand.java), zero-rule-server/service/core/.../popup/wpf/WpfResultProcessor.java, 서버 테스트(WpfResultProcessorTest·WpfPopupDatabaseTest), popup-frameWork/Popup/Dtos/WpfResultDtos.cs, popup-frameWork/Popup/Services/DemoPopupGateway.cs, api/examples/wpf-results-response.json, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/(32_*, 34_*), popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 확정 삭제 5개 필드 부재 테스트(서버 record·C# DTO) 추가. :service:core popup·:web:api popup 101건 통과, 로컬 XE 대상 DB 연동 테스트 2건(PopupQuestionDatabaseTest·WpfPopupDatabaseTest) 별도 실행 통과, :app 컴파일 통과. WPF 행동 검증 884건 통과. 34-35 변경도 같은 실행에서 확인. 실제 서버 HTTP·Windows 화면 미확인. Excel 정의서 미반영(저장소에 없음).
- 상태: 커밋에 포함. 원격 반영. 34-03(삭제 후보 5개 필드 확정) 결정 대기.

## 2026-10-12-08 — TODO34-35 설문·퀴즈 Footer 동작 명시값 검증

- 이유: TODO34 §6.3(SURVEY/QUIZ는 SUBMIT만 허용, 생략과 잘못된 명시값 구분)이 TODO30의 정규화 수용 정책보다 우선. 기존 저장 데이터는 13번 스크립트로 로컬·원격 개발 DB 모두 정규형이라 거부로 바꿔도 재저장 실패 대상이 없음.
- 변경: PopupService.validateActionOptions가 SURVEY/QUIZ(동영상+퀴즈 포함)에 CLOSE·LINK_AND_CLOSE를 명시하면 거부. 생략·SUBMIT은 허용하고 저장 시 키를 남기지 않는 정규형은 유지. 관리자 웹은 설문·퀴즈 저장 시 두 키를 보내지 않으므로 변경 없음. WPF의 방어적 SUBMIT 처리 유지. 계약서 §6.3 footerAction 설명, 설계 30-17·34-35 갱신.
- 주요 파일: zero-rule-server/service/core/.../popup/PopupService.java, PopupActionOptionsTest.java, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/(30_*, 34_*).
- 검증: PopupActionOptionsTest(SURVEY/QUIZ × 생략·SUBMIT 허용, CLOSE·LINK_AND_CLOSE 거부, 저장 키 미보존) 통과. 전체 popup 테스트는 아래 34 후속 항목과 함께 실행.
- 상태: TODO34-35 커밋에 포함. 원격 반영.

## 2026-10-12-07 — TODO32·30 DB 스크립트 로컬 XE·원격 개발 DB 적용

- 이유: TODO34-35(설문·퀴즈의 잘못된 Footer 동작 명시값 거부) 반영 전에 기존 저장 데이터를 정규형으로 맞추고, 설계 32의 미사용 컬럼을 정리할 필요.
- 변경: 로컬 XE(POPUP 스키마)에 13_normalize_footer_action_oracle.sql(정리 대상 0행, 잔여 0)과 12_drop_response_started_at_oracle.sql(값이 있던 행 0, RESPONSE_STARTED_AT 삭제, 잔여 컬럼 0)을 실행. 실행 전 TNS 리스너가 중지되어 있어 로컬 서비스를 시작. 13번 정규식을 예시 문자열로 확인한 결과 값에 이스케이프된 따옴표가 있는 쌍이 맨 앞에 오면 지워지지 않는 제한(07과 동일)을 db/oracle/README에 기록.
- 주요 파일: db/oracle/README.md.
- 검증: 실행 전 조회(샘플 4행에 Footer 키 없음, RESPONSE_STARTED_AT 값 0행)와 스크립트 결과 확인. 실행 후 실DB 테스트 PopupQuestionDatabaseTest·WpfPopupDatabaseTest(롤백 전용)를 로컬 XE로 실행해 통과(기존에는 skip이던 테스트로, 컬럼 삭제 후 MERGE·WPF 점수 저장·결과 처리 경로 확인).
- 원격 개발 DB(zero-rule 스키마): 실행 전 조회로 콘텐츠 4행 중 Footer 키 보유 0행, RESPONSE_STARTED_AT 값 0행(POPUP_RESPONSE 0행) 확인. 12번 실행 — 컬럼 삭제 OK, 잔여 컬럼 0. 13번 실행 — 정리 대상 0행, 갱신 0행, 잔여 0. 원격에서 이전 버전 서버가 동작 중이면 응답 저장이 실패하므로 원격 서버는 설계 32 이후 코드로 실행해야 함.
- 상태: 로컬 XE·원격 개발 DB 적용 완료. 원격 대상 실DB 테스트는 미실행. 문서 커밋에 포함. 원격 반영.

## 2026-10-12-06 — TODO34 RESULT 계약 및 공통 옵션 정합성 보완 계획

- 이유: TODO 29~33 검토에서 RESULT 응답 추가 삭제 합의 누락, WPF 판정과 서버 저장 책임 불일치, 결과 실패 처리 및 공통 옵션 계약 보완 필요 확인.
- 변경: TODO34에 응답 5개 필드 제거, 요청 responseStartedAt 제거 및 score/passed 유지·서버 저장, 나머지 RESULT 항목 사용처 점검, 일시 실패 재전송, Footer 유형별 제약 및 공통 옵션 최상위 전환을 정리. 프로토타입 기준으로 구버전 호환·단계별 전환을 제외하고 다음 팝업 조회 요건은 보류로 명시. TODO 29~33과 충돌하는 경우 TODO34를 우선하는 기준 추가.
- 주요 파일: docs/design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md, version-history/CHANGELOG.md.
- 검증: 기준 main de3a608의 TODO 29~33 및 앞선 소스 정적 검토 결과와 확정 범위 대조. 신규 TODO 번호 중복 없음 확인. 문서 변경만 수행하여 빌드·Windows 실행·DB 연동 테스트는 미실행.
- 상태: 계획 문서 추가 커밋에 포함. 기능 구현 및 구현 TODO 체크는 미완료. 다음 팝업 조회 방식은 요건 판단 단계로 보류.

## 2026-10-12-05 — TODO31 PopupWindow 공통 UI 옵션 최상위 계약 정리

- 이유: 설계 31 반영. Overlay·위치·Header/본문/Footer 글자 크기는 콘텐츠가 아니라 PopupWindow 전체 정책이므로 WPF 응답에서 popups[] 최상위로 분리해 content에는 유형별 콘텐츠·전용 옵션만 남김. 운영 배포 버전이 없어 content fallback 없이 즉시 전환.
- 정합성 확인: 설계 31의 현재 상태 기술(PopupFactory content lookup, opacity 0~1 보정, 위치 미지원 값 CENTER, PopupWindow 10~40 보정)은 코드와 일치. 서버는 폰트 크기만 저장 검증하고 Overlay·위치 값은 검증하지 않고 있었음.
- 변경(서버): domain에 PopupWindowOptions(6개 키·기본값·읽기 규칙) 추가. WpfPopupItem에 최상위 useBackgroundOverlay·backgroundOverlayOpacity(0~1 보정)·popupPosition(9개 값, 그 밖 CENTER)·header/body/footerFontSize(설정 시만)를 추가하고 content에서 6개 키 제거. 관리자 저장 검증에 validateWindowOptions(Overlay boolean, opacity 0~1 숫자, 위치 9개 값) 추가. opacity 범위는 서버 저장 검증 + WPF 보정 유지로 확정(31-10). 관리자 API·DB 저장 위치(CONTENT_OPTIONS)와 관리자 웹은 변경 없음(웹 입력 값 형식이 새 검증과 맞는 것 확인).
- 변경(WPF): PopupResponseDto에 UseBackgroundOverlay(true)·BackgroundOverlayOpacity(0.45)·PopupPosition("CENTER")·Header/Body/FooterFontSize 추가. PopupFactory의 content lookup(GetContentDouble·GetContentNullableDouble·GetPopupPosition) 삭제, 최상위 값 사용(opacity 0~1 보정, ConvertPopupPosition). Demo 옵션 창의 위치·Overlay·글자 크기 필드를 최상위로 이동.
- 문서: 인터페이스 계약 3.7(§6.3 최상위 필드 추가, §7을 PopupWindow 공통 옵션 안내로 교체, §8 유형별 content 예시에서 공통 옵션 제거, §15 예시에 최상위 값), 전체/최소 정의서, 예제 JSON(api/examples·docs/interfaces/examples/WPF-01-popup-types.json), 설계 31 체크리스트 갱신. zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md는 관리자 content 기준 문서라 유지.
- 주요 파일: zero-rule-server/domain/.../popup/(PopupWindowOptions.java, wpf/WpfPopupItem.java), zero-rule-server/service/core/.../popup/PopupService.java, 서버 테스트(PopupActionOptionsTest·WpfPopupServiceTest·WpfPopupControllerTest), popup-frameWork/Popup/(Dtos/PopupResponseDto.cs, Factories/PopupFactory.cs, Models/PopupOptions.cs, DemoOptionsWindow.Fields.cs), api/examples/wpf-popups-response.json, docs/interfaces/, docs/design/31_PopupWindow_공통_UI_옵션_최상위_계약_TODO.md, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 저장 검증 테스트와 최상위 승격·기본값·보정 HTTP 테스트를 추가해 :service:core popup·:web:api popup 101건 통과(DB 연동 2건 기존대로 skip), :app 컴파일 통과. WPF 앱 빌드 경고·오류 0, 행동 검증에 content 키 미사용·최상위 값 반영·opacity 보정·위치 9개 값/미지원 값·생략 기본값 검증을 추가하고 Demo 글자 크기 편집 검증을 최상위 필드로 옮겨 880건 통과, 재전송 큐 122건 통과. Overlay·위치·폰트 실제 WPF 화면 수동 검증(31-23)과 실제 서버 HTTP 확인 미실행. Excel 정의서 미반영(저장소에 없음).
- 상태: TODO31 커밋에 포함. 원격 반영.

## 2026-10-12-04 — TODO30 Footer Action 최상위 계약 및 3모드 정리

- 이유: 설계 30 반영. Footer는 콘텐츠 속성이 아니라 PopupWindow 공통 영역의 동작이므로 WPF 응답에서 showFooter·showFooterButton과 같은 레벨(popups[] 최상위)로 정리하고 동작을 3값으로 명시. 운영 배포 버전이 없어 구버전 호환 단계(content 중복 전송·fallback) 없이 코드와 저장 데이터를 정규화.
- 정합성 확인: 기존 코드는 SURVEY/QUIZ/VIDEO+QUIZ에 LINK_AND_CLOSE를 설정하면 '제출 후 링크 열기'로 동작(PopupWindow.TryOpenSubmissionLink, docs/FOOTER_LINK_VIDEO_QUIZ.md)해 설계 30의 SUBMIT 고정 정책과 충돌. 3모드 정의(CLOSE '닫기' / LINK_AND_CLOSE '바로가기' / SUBMIT '제출')에 맞춰 제출 후 링크 경로를 제거. 관리자 미리보기는 이미 설문·퀴즈를 제출로만 처리해 변경 없음.
- 변경(서버): domain에 PopupFooterAction(3값, 유형별 실제 동작·저장 정규형) 추가. WpfPopupItem에 최상위 footerAction·footerLinkUrl(LINK_AND_CLOSE일 때만)을 추가하고 content에서 두 키 제거. SURVEY/QUIZ는 저장 값과 무관하게 SUBMIT. 관리자 저장 검증은 미지원 값과 일반 유형의 SUBMIT을 거부하고(LINK_AND_CLOSE URL 검증 유지), 저장 시 PopupService.storedOptions로 정규화(SURVEY/QUIZ는 두 키 미저장, 일반 유형은 LINK_AND_CLOSE일 때만 저장). 기존 행 정리용 db/oracle/13_normalize_footer_action_oracle.sql(07과 같은 정규식 방식, 멱등) 추가. 관리자 API·DB 저장 위치(CONTENT_OPTIONS)는 유지.
- 변경(WPF): PopupResponseDto.FooterAction("CLOSE")·FooterLinkUrl 추가, PopupFooterAction enum(Close/LinkAndClose/Submit)과 PopupOptions.FooterAction 추가(OpenFooterLinkAndClose는 파생 속성). PopupFactory는 content lookup을 제거하고 ConvertFooterAction으로 유형별 정규화(SURVEY/QUIZ Submit, 일반 유형은 LINK_AND_CLOSE만 바로가기·그 밖은 Close). PopupWindow.TryOpenSubmissionLink와 PopupManager 호출 삭제. Demo 샘플(DEMO-FOOTER-LINK)·옵션 창의 Footer 동작을 최상위로 옮기고 설문·퀴즈는 '제출 고정' 표시.
- 변경(관리자 웹): 설문·퀴즈는 푸터 버튼 동작을 '제출' 고정(비활성)으로 표시하고 저장 시 두 키를 보내지 않음. 일반 유형도 바로가기일 때만 동작·URL을 저장(서버 정규형과 동일).
- 문서: 인터페이스 계약 3.7(§6.3 최상위 필드 추가, §7 content 공통 필드에서 제거, 동영상+퀴즈 예시·설명, §15 예시에 footerAction), 전체/최소 정의서, 예제 JSON(api/examples·docs/interfaces/examples), FOOTER_LINK_VIDEO_QUIZ·옵션 가이드·사용자 옵션 가이드, db/oracle/README, 설계 30 체크리스트 갱신.
- 주요 파일: zero-rule-server/domain/.../popup/(PopupFooterAction.java, wpf/WpfPopupItem.java), zero-rule-server/service/core/.../popup/PopupService.java, 서버 테스트(PopupActionOptionsTest·WpfPopupControllerTest), db/oracle/(13_normalize_footer_action_oracle.sql, README.md), popup-frameWork/Popup/(Dtos/PopupResponseDto.cs, Models/PopupOptions.cs, Factories/PopupFactory.cs, Views/Windows/PopupWindow.xaml.cs, Managers/PopupManager.cs, Services/DemoPopupDataService.cs, DemoOptionsWindow(.Fields).cs), zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx, docs/interfaces/, docs/(FOOTER_LINK_VIDEO_QUIZ.md, POPUP_OPTION_GUIDE.md, POPUP_USER_OPTION_GUIDE.md), api/examples/wpf-popups-response.json, docs/design/30_Footer_Action_최상위_계약_TODO.md, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 서버 유형별 정책·저장 정규형 테스트와 최상위 승격 HTTP 테스트를 추가해 :service:core popup·:web:api popup 99건 통과(DB 연동 2건 기존대로 skip), :app 컴파일 통과. WPF 앱 빌드 경고·오류 0, 행동 검증에 동작 변환·content 키 미사용·SURVEY/QUIZ/VIDEO+QUIZ 제출 고정·제출 후 링크 경로 삭제·Demo 설문 편집 SUBMIT 고정 검증을 추가해 873건 통과, 재전송 큐 122건 통과. 관리자 웹 tsc --noEmit 통과. 13번 SQL(로컬·원격 개발 DB), 실제 Windows 화면·브라우저 실행, 관리자 화면 수동 확인 미실행. Excel 정의서 미반영(저장소에 없음).
- 상태: TODO30 커밋에 포함. 원격 반영.

## 2026-10-12-03 — TODO33 결과 응답 totalScore/passed 제거 및 WPF 판정값 저장

- 이유: 설계 33 반영. QUIZ 채점·통과 판정 책임이 WPF에 있으므로 결과 응답에서 같은 의미의 totalScore/passed를 제거. 정합성 확인 중 설계 33 §2(서버는 WPF 판정 결과를 저장)와 달리 서버가 자체 채점값을 저장하고 WPF 값은 비교 로그에만 쓰는 것을 확인해 WPF 값 저장으로 일치시킴.
- 변경: 서버 WpfResultItemResponse에서 totalScore·passed와 Builder.score 제거, WpfResultProcessor의 QUIZ 점수 응답 조립·유형 재조회(popupTypeOf)·불일치 로그 제거. PopupService.submitResponse가 clientScore/clientPassed를 받아 QUIZ는 두 값을 필수로 검증(누락·음수·비정상 수는 IllegalArgumentException → REJECTED WPF_INVALID_RESULT)하고 POPUP_RESPONSE.TOTAL_SCORE·PASSED_YN과 완료 판정(markPopupCompleted)에 그대로 사용. 서버 계산값은 문항별 상세(POPUP_RESPONSE_ANSWER) 저장과 불일치 경고 로그(PopupService로 이동)에만 사용. SURVEY는 기존처럼 0점·통과 저장으로 제출 즉시 완료. C# WpfResultItemResponseDto.TotalScore·Passed 삭제, Demo 게이트웨이는 응답 점수 설정을 제거하고 서버와 같이 score/passed 없는 QUIZ 제출을 거절. 결과 요청·응답 예제 JSON, 계약서 10.6·11장, 설계 33 갱신. 전체/최소 정의서에는 응답 필드 기술이 없어 변경 없음.
- 주요 파일: zero-rule-server/domain/.../popup/wpf/(WpfResultItemResponse.java, WpfResultCommand.java), zero-rule-server/service/core/.../popup/(PopupService.java, wpf/WpfResultProcessor.java), zero-rule-server/web/api/.../payload/popup/wpf/WpfResultRequest.java, 서버 테스트(PopupSubmitScoreTest 신규·WpfResultProcessorTest·WpfPopupDatabaseTest·PopupQuestionDatabaseTest), popup-frameWork/Popup/Dtos/WpfResultDtos.cs, popup-frameWork/Popup/Services/DemoPopupGateway.cs, api/examples/(wpf-results-request.json, wpf-results-response.json), docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/33_RESULT_응답_score판정값_제거_TODO.md, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: PopupSubmitScoreTest 3건(서버 계산과 다른 WPF 값 저장·완료 판정, score/passed 누락·음수·NaN 거절 및 미저장, SURVEY 기존 저장 유지) 추가, :service:core popup·:web:api popup 테스트 97건 통과(DB 연동 2건 기존대로 skip), :app 컴파일 통과. WPF 행동 검증에 응답 로그 totalScore/passed 미포함·score 없는 QUIZ 거절·응답 DTO 필드 부재 검증을 반영해 858건 통과, 재전송 큐 검증 122건 통과. DB 연동 테스트(로컬·원격 개발 DB)와 실제 서버 HTTP·Windows 화면 확인 미실행. Excel 정의서 미반영(저장소에 없음).
- 상태: TODO33 커밋에 포함. 원격 반영.

## 2026-10-12-02 — TODO32 결과 요청 responseStartedAt 제거

- 이유: 설계 32 반영. WPF가 SUBMITTED 결과의 responseStartedAt에 displayedAt을 그대로 복사해 보내 표시 시각과 의미가 중복. 응답·처리 소요 시간은 closedAt - displayedAt으로 계산 가능.
- 정합성 확인: 설계 32의 현재 상태 기술(`ResponseStartedAt = _displayedAt`)은 코드와 일치. 서버는 값을 POPUP_RESPONSE.RESPONSE_STARTED_AT에 저장만 하고 읽는 곳(통계·관리자 조회)은 없음.
- 변경: C# WpfResultItemDto.ResponseStartedAt과 PopupResultBuilder.BuildSubmitted 할당 삭제. 서버 WpfResultRequest.Item·WpfResultCommand에서 필드 제거(구 클라이언트가 보내도 ignoreUnknown으로 무시), PopupService.submitResponse·PopupMapper.upsertPopupResponse 인자와 MERGE의 RESPONSE_STARTED_AT 갱신·삽입 제거. DB 컬럼은 삭제하기로 하고 db/oracle/12_drop_response_started_at_oracle.sql(멱등, 서버 배포 후 실행) 추가, 01 스키마에서 컬럼 제거, db/oracle/README 절 추가. 결과 요청 예제 JSON·계약서 10.4/10.5·설계 32 갱신. 전체/최소 정의서에는 해당 필드 기술이 없어 변경 없음. 설계 03·07(당시 설계 기록)과 ERD 스냅샷(ERD/model, 2026-09-28)은 변경하지 않음.
- 주요 파일: popup-frameWork/Popup/Dtos/WpfResultDtos.cs, popup-frameWork/Popup/Services/PopupResultBuilder.cs, zero-rule-server/web/api/.../payload/popup/wpf/WpfResultRequest.java, zero-rule-server/domain/.../popup/wpf/WpfResultCommand.java, zero-rule-server/service/core/.../popup/(PopupService.java, wpf/WpfResultProcessor.java), zero-rule-server/repo/core/.../popup/(PopupMapper.java, PopupMapper.xml), 서버 테스트(WpfResultProcessorTest·WpfPopupServiceTest·WpfPopupDatabaseTest·PopupQuestionDatabaseTest·WpfPopupControllerTest), db/oracle/(01_popup_schema_oracle.sql, 12_drop_response_started_at_oracle.sql, README.md), api/examples/wpf-results-request.json, docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/design/32_RESULT_responseStartedAt_제거_TODO.md.
- 검증: :service:core popup·:web:api popup 테스트 통과(94건, DB 연동 2건 기존대로 skip), 요청에 responseStartedAt이 있어도 정상 변환되는지 HTTP 테스트에 추가. :app 컴파일 통과. WPF 행동 검증에 생성 JSON 미포함·큐에 남은 구 형식 항목 역직렬화 검증을 추가해 856건 통과, 재전송 큐 검증(RecoveryTests) 122건 통과. 12번 SQL·DB 연동 테스트는 로컬·원격 개발 DB 모두 미실행. Excel 정의서 미반영(저장소에 없음).
- 상태: TODO32 커밋에 포함. 원격 반영.

## 2026-10-12-01 — TODO29 WPF 목록 API 응답 계약 정리

- 이유: 설계 29 반영. 노출 판정은 서버가 끝낸 최종 목록만 내려주므로 WPF가 쓰지 않는 서버 내부 판정 값을 목록 응답에서 제거하고, Footer 버튼 표시 이름의 서버·C# 불일치(showCloseButton ↔ showFooterButton)를 해소. 운영 배포 버전이 없어 구버전 호환 단계 없이 코드를 정규화.
- 정합성 확인: 설계 29~33을 코드와 대조. 설계 29의 현재 상태 기술은 코드와 일치(serverTime·userId는 WPF에서 읽는 곳 없음, Demo 게이트웨이만 값 설정). docs/interfaces/popup-interface-examples.json은 삭제된 legacy WPF-01~06 엔드포인트와 관리자 API 예제라 WPF 목록 계약 변경 대상에서 제외. 설계 문서의 'Excel 인터페이스 정의서'는 저장소에 없음(docx·pdf v3.6만 존재).
- 변경: 서버 WpfPopupItem에서 displayStartAt·displayEndAt·periodMode·repeatInterval·repeatDayOfWeek·repeatDayOfMonth 제거, showCloseButton을 showFooterButton으로 직렬화(관리자 API PopupResponseDto·DB SHOW_CLOSE_BUTTON_YN 이름은 유지). C# PopupResponseDto에서 DisplayStartAt·DisplayEndAt와 legacy showCloseButton 수신 별칭(LegacyShowCloseButton) 삭제. ROOT serverTime·userId는 진단용으로 유지하기로 확정하고 서버·C# 주석과 계약서에 용도 명시. 목록 응답 예제 JSON·인터페이스 계약 3.7·전체/최소 정의서·설계 29 체크리스트 갱신.
- 주요 파일: zero-rule-server/domain/.../popup/wpf/(WpfPopupItem.java, WpfPopupListResponse.java), zero-rule-server/web/api/src/test/.../WpfPopupControllerTest.java, zero-rule-server/service/core/src/test/.../WpfPopupDatabaseTest.java, popup-frameWork/Popup/Dtos/(PopupResponseDto.cs, WpfPopupListResponseDto.cs), api/examples/wpf-popups-response.json, docs/interfaces/(POPUP_INTERFACE_SPEC.md, WPF_POPUP_ALL_SPEC.md, WPF_POPUP_MINIMAL_SPEC.md), docs/design/29_WPF_목록_API_응답_계약_정리_TODO.md, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: :service:core popup·:web:api popup 테스트 통과(94건, DB 연동 2건 기존대로 skip), 제거 필드 미출력·showFooterButton 직렬화 HTTP 테스트 추가. :app 컴파일 통과. WPF 행동 검증에 제거 필드 수신 무시·legacy showCloseButton 미반영·showFooterButton 반영·과거 종료 시각 무관 표시 검증을 추가해 854건 통과(빌드 경고·오류 0). 실제 서버 HTTP·Windows 화면 확인 미실행. Excel 정의서 미반영(저장소에 없음).
- 상태: TODO29 커밋에 포함. 원격 반영.

## 2026-10-09-04 — TODO28 TEXT 본문 서식 1차 구현

- 이유: 설계 28 1차 범위(TEXT 본문)의 서식 편집을 저장·조회·표시까지 반영. 저장 기준은 문단·Run JSON(content.textBlocks)이며 HTML은 저장하지 않음.
- 변경(서버): PopupRichText에서 textBlocks 구조·허용 값(정렬 3종, 색 8종, 크기 8종, 글꼴 ID 4종)·제한(500문단·2000구간·20000자·제어 문자)을 검증하고 허용 밖 키·값은 저장 거부. TEXT 외 유형의 textBlocks 거부. 저장 시 plainText(CONTENT_BODY)를 textBlocks에서 파생하며 textBlocks는 기존 CONTENT_OPTIONS에 저장(DB 변경 없음). textBlocks가 없으면 기존 plainText 저장 유지.
- 주요 파일: zero-rule-server/service/core/.../popup/PopupRichText.java, PopupService.java, PopupRichTextTest.java.
- 검증: PopupRichTextTest 6건(파생 문자열의 공백·줄바꿈·빈 문단 보존, 클라이언트 plainText 무시, 허용 밖 값·HTML 문자열 거부, 제한, 유형 제한, CONTENT_OPTIONS 저장·조회) 포함 :service:core popup 패키지 테스트 통과(DB 연동 2건 기존대로 skip).
- 상태: 서버·관리자 웹·WPF/Demo/문서·글자색·글꼴 정규형·우클릭 메뉴 커밋에 포함. 관리자 화면 수동 확인(서식 메뉴 마우스·키보드, 한글 IME·복사/붙여넣기·실제 저장→재편집), CKEditor 라이선스 배포 조건·보안 권고 확인 미완료.
  관리자 웹: 팝업 전용 서식 편집 컴포넌트(PopupRichTextEditor, 기존 CKEditor 빌드 사용, 툴바를 굵게·기울임·밑줄·글자색·크기·글꼴·정렬·서식 지우기·실행 취소/다시 실행으로 제한)로 TEXT 일반 본문 입력을 교체하고 변경 시 textBlocks와 파생 plainText를 함께 갱신. popupRichText.ts에 허용 값과 HTML↔Run 변환(허용 밖 서식 제거, script·style·이미지 제거, 제목·인용·목록·표 셀 글자는 일반 문단으로 보존, 공백·빈 문단 규칙, 재편집 HTML 이스케이프) 추가. 서식 본문 없는 기존 데이터는 plainText를 서식 없는 문단으로 열어 편집. 미리보기는 React 요소로 서식 본문 표시(innerHTML 미사용). 공용 CommonCKEditor는 변경하지 않음. 주요 파일: zero-rule-web/main/src/features/RgstPop/(popupRichText.ts, PopupRichTextEditor.tsx, PopupEditorDialog.tsx, PopupPreview.tsx). 검증: tsc --noEmit 통과. 변환 모듈을 실제 편집기 빌드(CKEditor 5 v34.1.0)와 WebView2 하네스(저장소 밖)에서 실행해 편집 명령 서식의 Run JSON 왕복 일치, 툴바 항목 제한, 붙여넣기 HTML 정리, 기존 plainText 변환 왕복, 저장 데이터의 허용 밖 값 필터링, 읽기 전용 전환 확인(표 셀 글자 누락을 발견해 수정). 관리자 화면 실행·수동 입력 확인 미실행.
  WPF·Demo·문서: TextPopupContentDto.TextBlocks(PopupTextBlockDto·PopupTextRunDto)와 PopupRichText 렌더러 추가. TextPopupView는 서식 본문이 있으면 문단별 TextBlock Inlines로 표시(허용 밖 서식 값 무시, 빈 문단 한 줄 유지, 큰 글자 구간은 줄 높이 확장)하고 없으면 기존 plainText 표시. bodyFontSize는 문단 기본 크기에 적용되고 구간 크기가 우선. Demo TEXT 샘플에 서식 본문 10문단 추가, 옵션 창에 textBlocks JSON 편집(서버와 같은 검증·plainText 파생, 비우면 일반 본문), 시나리오 요약에 서식 본문 문단 수 표시. 인터페이스 계약 8.1(textBlocks 표·허용 값)·전체 정의서·최소 정의서(미제공 표기)·옵션 가이드·전체 예제 JSON·설계 28 갱신. 주요 파일: popup-frameWork/Popup/Dtos/(TextPopupContentDto.cs, PopupTextBlockDto.cs), Views/Contents/(PopupRichText.cs, TextPopupView.xaml(.cs)), Factories/PopupFactory.cs, Services/DemoPopupDataService.cs, DemoOptionsWindow(.Fields).cs, DemoWindow.Settings.cs, docs/interfaces/, docs/POPUP_OPTION_GUIDE.md, docs/design/28_TEXT_FONT_EDITING_TODO.md, popup-frameWork/Popup.BehaviorTests/(로컬 전용). 검증: 빌드 경고·오류 0, 행동 검증 서식 표시·허용 밖 값 무시·plainText 대체·showPlainText·기본 크기·줄 높이·Demo 편집/거부/파생/요약 검증을 추가해 847건 통과(Demo는 서식 본문이 있으면 plainText를 다시 만들므로 기존 일반 본문 편집 검증은 서식 본문을 비운 뒤 수행하도록 조정), HTML5 브리지 95건 통과, 서식 본문 렌더링 이미지 확인. 실제 Windows 팝업·Demo 화면 육안 확인 미실행.
  글자 색 규칙 변경: 팔레트 8색 제한을 없애고 대문자 #RRGGBB 형식만 검사(서버 저장 검증·WPF 표시·관리자 변환·Demo 검증 공통). 형식 검사는 CSS·XAML 속성 주입 방지 목적이며 가독성(명도 대비)은 검사하지 않고 작성자가 판단. 관리자 편집기 팔레트는 선택지로 유지하고 붙여넣은 색은 hex로 바꿔 보존. 인터페이스 계약 8.1·설계 28 갱신. 검증: PopupRichTextTest 7건(임의 hex 허용, 소문자·짧은 형식·이름·rgb·덧붙인 문자열 거부) 포함 popup 테스트 통과, 행동 검증 849건 통과, 관리자 웹 tsc 통과, 실제 편집기 하네스 왕복 일치. 글자색 규칙 커밋에 포함.
  글꼴 정규형 수정: 관리자 웹 글꼴 CSS 중 굴림·돋움·바탕이 CKEditor 정규형(공백 있는 이름만 따옴표)이 아니어서 서식 명령과 저장 본문 재편집(setData) 시 글꼴이 오류 없이 사라지는 문제를 실제 편집기 검증에서 발견. RICH_FONTS CSS를 정규형으로 수정(저장 데이터는 글꼴 ID라 영향 없음)하고 설계 28 §9.3 설명 정정. 검증: 4개 글꼴 모두 명령 적용·HTML 출력·Run 왕복 유지 확인(저장소 밖 하네스), tsc 통과. 글꼴 정규형 커밋에 포함.
  우클릭 서식 메뉴(설계 28 §11): 서식 편집 영역 우클릭·'서식' 버튼·메뉴 키로 여는 서식 메뉴(굵게·기울임·밑줄, 글자 색·색 초기화, 크기, 글꼴, 서식 지우기) 추가. 선택 구간에만 적용하고 커서만 있으면 이후 입력에 적용, 적용·Esc 후 선택 범위로 복귀, 선택 값이 섞이면 '혼합' 표시, Shift+우클릭은 브라우저 기본 메뉴. 상태 읽기·적용 로직은 popupRichTextFormat.ts로 분리. 주요 파일: zero-rule-web/main/src/features/RgstPop/(PopupRichTextMenu.tsx, popupRichTextFormat.ts, PopupRichTextEditor.tsx), docs/design/28_TEXT_FONT_EDITING_TODO.md. 검증: tsc 통과, 로직 11건을 실제 편집기 빌드 하네스(저장소 밖)에서 확인. 메뉴 UI 관리자 화면 수동 확인 미실행.

## 2026-10-09-03 — TODO28 TEXT 본문 서식 편집 방향 정리

- 이유: 서식 편집 요구사항의 저장 형식·편집기·보안·적용 범위를 개발 결정 전에 확정할 필요.
- 변경: 1차 범위를 TEXT 일반 본문으로 확정하고 SURVEY·QUIZ는 공통 구조만 준비하는 것으로 정리. 저장·전달은 문단·Run JSON(content.textBlocks, CONTENT_OPTIONS 저장, DB 변경 없음), plainText는 서버 파생, HTML은 편집기 입출력 경계에서만 처리하는 방향과 방식 비교·변환 책임 표 추가. 서식 범위(굵게·기울임·밑줄, 허용 목록 색·크기, 제한된 글꼴), 보안 원칙(innerHTML 금지, 재편집 HTML 생성 시 이스케이프, 서버 재검증, style 값 별도 검증), 기존 CKEditor 빌드 확인 결과(@cp949/ckeditor5-custom-build 0.0.15 내장 CKEditor 5 v34.1.0, 서식 플러그인 포함·General HTML Support 미포함, GPL 사용 시 배포 조건 확인 필요), Demo 반영 항목, 문항·선택지 확장 시 DB·VARCHAR 제한, 개발 전 왕복 검증 계획 기록.
- 주요 파일: docs/design/28_TEXT_FONT_EDITING_TODO.md.
- 검증: 편집기 빌드 버전·플러그인과 DB 스키마(CONTENT_OPTIONS·CONTENT_BODY CLOB, 문항·선택지 VARCHAR2)를 저장소에서 확인. 제품 코드 변경이 없어 빌드·실행 검증 미실행.
- 상태: 문서 커밋에 포함. 개발 미착수.

  왕복 검증(spike): 실제 관리자 편집기 빌드(CKEditor 5 v34.1.0)를 WebView2에서 실행해 편집 명령으로 서식을 적용하고 HTML → Run JSON → HTML → 재편집 → Run JSON 왕복과 WPF TextBlock 렌더링을 확인. 한글·앞뒤/연속 공백·빈 문단·줄바꿈·정렬·혼합 서식·특수문자에서 Run JSON 왕복 일치, WPF 표시 정상, 비허용 입력은 허용 서식만 잔존. HTML 문자열은 왕복 후 달라져(nbsp 위치·태그 순서·이스케이프) Run JSON을 기준으로 저장하는 결정을 확인. 공백 글꼴명은 편집기 설정에서 따옴표가 없으면 무시되는 점, 크기 값이 'NNpx' 문자열인 점, 기본 툴바에 HTML 소스 편집 등이 포함된 점, 빈 문단·nbsp·붙여넣기 정리 규칙을 설계 28 §9에 기록. 검증 코드는 저장소 밖 임시 경로에서 실행했고 제품 코드 변경 없음. 한글 IME 수동 입력·서버 Java 구현 결과는 미검증.

## 2026-10-09-02 — VIDEO YouTube 임베드 재생 제거

- 이유: 영상 소스를 로컬 파일 경로와 HTTP(S) 직접 재생 URL(스트리밍)로 한정하기로 확정. YouTube 임베드는 공통 컨트롤·시청량 측정·음량 동기화·탐색 정책을 적용할 수 없는 별도 경로라 유지 비용만 발생.
- 변경: VideoPopupView에서 YouTube 주소 판별(TryGetYouTubeVideoId·전용 쿼리 파서)·embed URL 생성·YouTube 전용 분기(컨트롤·클릭·배속·진행 계산·로드 완료 처리·시스템 볼륨 연결 제외)를 삭제하고 미사용 using System.Web 제거. HTTP(S) URL은 모두 HTML5 video로 재생하며 YouTube 페이지 주소는 일반 URL로 취급되어 재생 실패 처리. 서버·관리자 웹의 동영상+퀴즈 YouTube URL 거부 검사와 해당 테스트 케이스 삭제(영상 URL 필수 검사는 유지). DTO 주석·README·옵션 가이드·사용자 옵션 가이드·인터페이스 계약·전체/최소 정의서·푸터 링크 문서·웹 미리보기 정합성 문서에서 YouTube 설명 제거. 설계·검토 이력 문서는 당시 기록으로 유지.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs, popup-frameWork/Popup/Dtos/VideoPopupContentDto.cs, zero-rule-server/service/core/.../PopupService.java·PopupActionOptionsTest.java, zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx, popup-frameWork/README.md, docs/POPUP_OPTION_GUIDE.md, docs/POPUP_USER_OPTION_GUIDE.md, docs/FOOTER_LINK_VIDEO_QUIZ.md, docs/interfaces/(POPUP_INTERFACE_SPEC·WPF_POPUP_ALL_SPEC·WPF_POPUP_MINIMAL_SPEC), zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md, docs/design/27_VIDEO_SEEK_ON_OFF_TODO.md.
- 검증: 아래 TODO27 항목과 같은 실행에서 확인(WPF 빌드·행동 검증·HTML5 브리지·서버 popup 테스트·웹 tsc). 실제 Windows 화면 재생 확인 미실행.
- 상태: YouTube 재생 제거 커밋에 포함, 원격 반영.

## 2026-10-09-01 — TODO27 영상 진행바 SEEK ON/OFF 구현

- 이유: 설계 27에 따라 영상 재생 위치 변경 허용 여부를 content 옵션으로 제어하고, 진행률 표시와 기존 재생 기능은 유지할 필요.
- 변경: content.allowSeek(boolean, 생략 시 true) 추가. WPF는 VideoPopupContentDto → PopupFactory → VideoPopupView 경로로 전달해 VIDEO·VIDEO+QUIZ에 같은 정책을 적용. OFF에서 진행바를 비활성(IsEnabled·IsTabStop false)으로 두어 마우스·키보드·UI Automation 입력을 막고, 진행바 누름 처리는 캡처·일시정지·탐색 상태 설정 전에 반환하며 FinishSeeking과 HTML5 seek 명령에서도 위치 변경을 거부. 종료 후 재시작·루프는 별도 경로로 유지. 진행률·시간 갱신 유지, 접근성 HelpText로 탐색 불가 상태 노출(진행바 외형 변경 없음). YouTube는 별도 처리 없이 재생 기능 자체를 제거(2026-10-09-02). 관리자 웹 '재생 위치 변경 허용' 스위치(기본 켜짐)·미리보기 '탐색 제한' 표시, Demo 옵션 라벨 추가. 서버는 기존 CONTENT_OPTIONS로 저장·조회하고 boolean 이외 값을 거부(DB 컬럼 추가 없음). 인터페이스 계약·전체/최소 정의서(최소 범위는 미제공으로 표기)·옵션 가이드·JSON 예제 갱신.
- 주요 파일: popup-frameWork/Popup/Dtos/VideoPopupContentDto.cs, popup-frameWork/Popup/Factories/PopupFactory.cs, popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs, popup-frameWork/Popup/DemoOptionsWindow.Fields.cs, zero-rule-server/service/core/.../PopupService.java·PopupActionOptionsTest.java, zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx·PopupPreview.tsx, docs/interfaces/(POPUP_INTERFACE_SPEC·WPF_POPUP_ALL_SPEC·WPF_POPUP_MINIMAL_SPEC·예제 JSON), docs/POPUP_OPTION_GUIDE.md, docs/design/27_VIDEO_SEEK_ON_OFF_TODO.md, popup-frameWork/Popup.BehaviorTests/(로컬 전용).
- 검증: 행동 검증 테스트를 임시 출력 경로로 빌드(경고·오류 0)하고 factory 전달(VIDEO·VIDEO_QUIZ × true/false/누락)·OFF 진행률 표시·누름 시 캡처 미발생·UI Automation SetValue 거부·HelpText 검증 12건을 추가해 816건 통과. HTML5 브리지 검증에 seek 차단·종료 후 재시작 유지를 추가해 95건 통과. 서버 :service:core popup 패키지 테스트 통과(DB 연동 2건은 기존대로 skip). 관리자 웹 tsc --noEmit 통과. 실제 Windows 화면에서 로컬/HTTP 영상·전체화면·VIDEO+QUIZ 조작 확인과 관리자 웹 화면 확인 미실행.
- 상태: TODO27 커밋에 포함, 원격 반영. 설계 27 §2·§3 완료.

  표시 정책 확정: 탐색 금지 시 진행바 외형은 허용 상태와 동일하게 두고 입력만 막는 것으로 결정(흐림·커서·툴팁 등 별도 시각 표시 없음, 접근성 HelpText만 유지). 코드 변경 없이 설계 27 §2 해당 항목 완료 처리. 후속 문서 커밋에 포함, 원격 반영.

  Demo 반영: Demo 샘플(DEMO-VIDEO-001·DEMO-VIDEO-QUIZ) content에 allowSeek=true를 명시하고 Demo 창 시나리오 요약에 영상 샘플의 '재생 위치 변경 허용/제한' 표시 추가. Demo 옵션 창은 DTO 속성에서 자동 생성되어 '재생 위치 변경 허용' 체크박스가 이미 표시됨. 행동 검증에 두 샘플의 옵션 창 기본값(체크)·해제 값의 DTO 반영·실제 팝업 진행바 비활성·Demo 요약 표시 검증 8건을 추가해 824건 통과, HTML5 브리지 95건 통과. 주요 파일: popup-frameWork/Popup/Services/DemoPopupDataService.cs, popup-frameWork/Popup/DemoWindow.Settings.cs. Demo 반영 커밋에 포함, 원격 반영. Demo 화면 동작 확인 완료.

  실제 Windows 화면 검증: 설계 27 §3 항목(true/false/누락 조합의 로컬·HTTP 영상, OFF 시 진행바 입력 차단과 진행률 갱신, ON 회귀, 재생 컨트롤·전체화면·루프·재오픈, VIDEO+QUIZ 시청 조건·결과 전송, 배속 옵션 독립성, 창 드래그·저사양 개선 유지)을 Windows에서 확인 완료. 설계 27 문서 체크 갱신 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인.

## 2026-10-08-02 — TODO28 TEXT 본문 서식 편집 요구사항 기록

- 이유: TEXT 선택 구간 서식 편집 요구사항의 범위와 구조 검토안을 개발 여부 결정 전 기록할 필요.
- 변경: 문단·Run 기반 전체 본문 저장, 동일 문자열의 위치별 편집, 서식 후보, 글꼴 설치·포함 정책 및 기존 plainText 호환 검토 항목 정리. 개발 여부 결정 보류와 API 미확정 상태 명시. 후속 검토로 단일 Run 배열/문단 구조 선택 기준, SURVEY·QUIZ 공통화 후보, 관리자 우클릭 팔레트·글꼴 메뉴 및 서식 버튼 권장안, 선택 범위 보존·접근성·회귀 검증 항목 추가.
- 주요 파일: docs/design/28_TEXT_FONT_EDITING_TODO.md.
- 검증: 문서 내용 및 diff 공백 검사. 제품 코드 변경이 없어 빌드·실행 검증 미실행.
- 상태: 요구사항 문서 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 개발 결정 보류·미구현.

## 2026-10-08-01 — TODO27 영상 진행바 SEEK ON/OFF 계획

- 이유: 영상 재생 위치 변경 허용 여부를 설정으로 제어하면서 진행률 표시와 기존 재생 기능을 유지할 필요.
- 변경: content.allowSeek(기본 true), OFF에서 진행바 클릭·드래그·키보드 탐색 차단, 로컬/HTTP 및 VIDEO+QUIZ/전체화면 공통 정책과 회귀 검증 TODO 작성. 창 이동은 변경 범위에서 제외.
- 주요 파일: docs/design/27_VIDEO_SEEK_ON_OFF_TODO.md.
- 검증: main 4a90327의 진행바 탐색 핸들러와 HTML5 seek 명령 경로 확인, 문서 diff 검사. 제품 코드 변경·빌드·Windows 검증 미실행.
- 상태: 문서 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 구현·배포 미실행.

## 2026-10-07-15 — Demo 목록 조회 요청·응답 JSON 로그

- 이유: Demo 모드에서 결과 전송만 JSON 로그로 남아 Header·Footer 표시·폰트·content 등 목록 응답으로 내려오는 팝업 설정을 확인할 곳이 없음.
- 변경: 목록 조회 시 로그 항목을 추가하고 요청 탭에 실제 모드와 같은 GET /api/wpf/popups(본문 없음, X-Client-Version 헤더), 응답 탭에 목록 응답 전체 JSON을 기록. 표시할 팝업이 없는 조회도 기록하고 조회 직후 응답 탭을 선택. Demo에는 인증 토큰이 없어 Authorization·X-Dev-User-Id는 기록하지 않으며 샘플 유형 선택은 Demo 전용 필터라 로그 줄에만 표시. 로그 제목을 '목록 조회 · 결과 전송 로그'로 변경. 전체 기능 정의서 실행 항목 갱신(최소 제공 범위·JSON 계약 변경 없음).
- 주요 파일: popup-frameWork/Popup/DemoWindow.xaml(.cs), docs/interfaces/WPF_POPUP_ALL_SPEC.md, popup-frameWork/Popup.BehaviorTests/Program.cs(로컬 전용).
- 검증: 실행 중인 앱이 기본 출력 파일을 잠그고 있어 임시 출력 경로로 빌드(경고·오류 0). 기존 행동 검증에 목록 조회 로그 선택·요청 method/URL/버전 헤더·응답의 showHeader/showFooter/content·응답 탭 선택·빈 목록 기록 검증 5건을 추가해 803건 통과. 실제 Demo 화면 육안 확인 미실행.
- 상태: Demo 목록 조회 JSON 로그 커밋에 포함, 원격 반영. 20261007 반입본에 포함.

  표시 보완: Demo 요청·응답 JSON 탭에서 한글이 \uXXXX로 이스케이프되어 읽기 어려운 문제 확인(System.Text.Json 기본 인코더 동작, JSON 값 자체는 정상). 표시·복사용 포맷에 UnsafeRelaxedJsonEscaping 인코더를 적용해 원문을 그대로 표시(TextBox 표시 전용, HTML·스크립트 삽입 없음). 결과 전송 로그에도 동일 적용. 한글 원문 표시 검증 추가해 행동 검증 804건 통과.

## 2026-10-07-14 — 20261007 폐쇄망 반입본 생성

- 이유: 20261006 반입 이후의 설계 25(Header·외곽 UI)·설계 26(PerMonitorV2, VIDEO 모서리 DPI·드래그 동기화)·Demo 창 조정·문서 정리를 폐쇄망에 반입하기 위해 새 반입본 필요.
- 변경: main의 Demo 목록 조회 JSON 로그 커밋(2026-10-07-15) 기준으로 offline-export/20261007 생성(4a90327 기준 최초 생성 후 Demo 변경을 포함해 재생성, WPF/MockSso·문서 묶음, MANIFEST, DELETE-SINCE-20260930, 반입 안내, 소스 SHA256, TAR·통합 TGZ 및 체크섬). 서버·웹 묶음은 20261006과 바이트 단위로 같아 제외하고, 기존 반입본과 같은 3·4 번호를 유지. MockSso 개인 launchSettings 제외. 이력 재작성으로 직전 기준 커밋과 조상 관계가 없어 삭제 목록은 rename 미적용 트리 비교로 산출해 popup-frameWork/Popup/Docs 5개(루트 docs 이동) 추가. NuGet·SDK는 20261006 반입본 사용(패키지 참조 변경 없음).
- 주요 파일: offline-export/20261007/ (Git 제외), .offline-verify/package-20261007.ps1·finalize-20261007.ps1 (Git 제외), version-history/CHANGELOG.md.
- 검증: 생성 단계에서 서버·웹 묶음이 20261006과 바이트 단위 동일함을 확인해 제외, WPF 묶음 차이는 Git 변경 파일과 일치. 새 worktree 체크아웃은 core.autocrlf로 줄바꿈이 달라져 사용하지 않고 정리된 main 작업 트리에서 생성. 반입 WPF 소스와 20261006 오프라인 NuGet만으로 외부 feed 없는 restore·win-x64 self-contained publish 성공, popupSample.exe의 PerMonitorV2 manifest 포함 확인. TAR 목록·제외 대상 누출·영상 원본 해시·TGZ 구성 검증, TGZ 추출 후 TAR·소스 SHA256 일치. 서버·웹은 소스 변경이 없어 포함·재빌드 미실행.
- 상태: 반입본 생성·검증 완료. 이 변경 이력 항목은 Demo 목록 조회 JSON 로그 커밋에 포함, 원격 반영. 폐쇄망 PC 반입·실행·배포 미실행.

## 2026-10-07-13 — TODO26 VIDEO 모서리 창 DPI 이동 동기화

- 이유: VIDEO 팝업을 배율이 다른 모니터로 드래그할 때 모서리 창 4개와 본 창이 어긋나는 현상 확인. manifest가 없어 앱이 System-aware로 실행되어 DWM이 본 창과 모서리 창을 HWND별로 서로 다른 시점에 확대했고, PerMonitorV2에서도 기존 코드는 본 창 DPI 변경 시 모서리를 숨긴 뒤 Loaded 우선순위에서 HWND를 재생성하고 모서리 자체 WM_DPICHANGED는 OS 권장 rect로 이동해 어긋남이 남는 구조.
- 변경: app.manifest와 ApplicationManifest로 PerMonitorV2 선언(WinForms 전용 WFO0003 경고 제외). OpaqueWindowCorners의 DPI 처리를 숨김·재생성 방식에서 HWND 재사용 방식으로 변경. 본 창 WM_DPICHANGED Hook 단계에서 wParam의 새 DPI로 모서리 물리 크기·Geometry를 다시 그리고 Region·위치를 즉시 갱신. 모서리 창 자체 WM_DPICHANGED는 권장 rect를 본 창 모서리 위치로 바꾸고 새 DPI로 다시 그림. 모서리 검증 프로젝트 scripts/CornerWindowTests 추가 및 bin/obj 제외. 전체 기능 정의서의 VIDEO 모서리 이동 항목 갱신(최소 제공 범위·JSON 계약 변경 없음).
- 주요 파일: popup-frameWork/Popup/Views/Windows/OpaqueWindowCorners.cs, popup-frameWork/Popup/app.manifest, popup-frameWork/Popup/Popup.csproj, scripts/CornerWindowTests/, docs/interfaces/WPF_POPUP_ALL_SPEC.md, .gitignore.
- 검증: 수정 전 모서리 검증에서 모서리 자체 DPI 변경 후 본 창 모서리 이탈 실패 재현. 수정 후 합성 WM_DPICHANGED(96/120/144) 기준 모서리 부착·물리 픽셀 크기·Geometry·표시 유지·HWND 재사용 388개 통과. WPF 빌드 경고·오류 0, 기존 로컬 행동 검증 798개 통과. 실제 배율이 다른 모니터 간 드래그, PerMonitorV2 전환에 따른 TEXT/IMAGE/SURVEY·MainWindow·트레이 표시 회귀, Horizon 검증 미실행.
- 상태: TODO26 dev 커밋 2건(PerMonitorV2 manifest, 모서리 DPI·드래그 동기화)에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미실행.

  드래그 동기화 보완: 영상 재생 중 드래그 시 모서리가 본체에서 쪼개져 보이는 현상 확인. 이동 루프가 본 창을 먼저 옮긴 뒤 WM_WINDOWPOSCHANGED에서 모서리 4개를 개별 SetWindowPos로 따라가게 해 그 사이 DWM 합성이 끼는 구조. 이동 루프(WM_ENTERSIZEMOVE~EXITSIZEMOVE) 중 본 창 WM_WINDOWPOSCHANGING의 제안 위치·크기로 본 창과 모서리 4개를 DeferWindowPos 한 묶음으로 이동하고 원래 제안은 NOMOVE/NOSIZE로 변경. 이동 루프·DPI 권장 rect 계산은 OS 기본 동작 유지, 묶음 실패 시 기존 추적 경로로 복귀. 모서리 검증에 이동 루프 중 위치·크기 변경 시 제안 좌표 유지 및 본 창 이동 통지 시점의 모서리 부착 검증 추가해 793개 통과, 묶음 이동을 끈 빌드에서 부착 검증 실패 확인 후 원복. 앱 빌드 경고·오류 0, 기존 행동 검증 798개 통과. 실제 영상 재생 중 드래그 육안 확인·Horizon 미실행.

  모서리 렌더 구조 변경: 150% 모니터를 다녀온 뒤 우상단 모서리가 6px 칸에 약 4px로 작게 그려지는 화면 캡처를 확인. 연결된 실제 100%/150% 모니터 사이 프로그램 이동으로 재현했으며 WPF HwndSource 레이어드 모서리의 렌더 내용이 창 DPI와 어긋나는 문제로 판단(크기·배율 값은 정상). HEAD의 숨김·재생성 방식도 같은 왕복에서 Region과 모서리가 어긋남을 확인. 모서리 창을 WPF HwndSource에서 DefWindowProc만 쓰는 Win32 레이어드 창으로 교체하고, 본 창 DPI 기준 물리 픽셀 quarter-circle을 RenderTargetBitmap(96 DPI)으로 만들어 UpdateLayeredWindow로 위치·크기·내용을 한 번에 적용. 모서리 창은 WM_DPICHANGED에 반응하지 않으며 크기가 바뀐 모서리는 묶음 이동에서 제외하고 WM_WINDOWPOSCHANGED에서 내용과 함께 갱신. CornerWindowTests를 새 구조 기준(레이어드·소유 관계·DPI별 물리 크기·HWND 재사용·묶음 이동·표시/종료)으로 갱신하고, 배율이 다른 모니터가 있으면 실제 드래그 왕복 3회 후 네 모서리 화면 픽셀(CAPTUREBLT)이 처음과 같은지 비교하도록 추가. 100%↔150% 실모니터 왕복 포함 761개 통과. 앱 빌드 경고·오류 0, 기존 행동 검증 798개 통과. 마우스 드래그·영상 재생 중 육안 확인, 125% 조합, Horizon 미실행.

## 2026-10-07-12 — 최소·전체 WPF 기능 정의서 동시 관리 및 바깥 문서 정리

- 이유: 최초 외부 제공 범위와 전체 구현 기능을 구분해 유지하고 저장소 바깥의 별도 문서 사본으로 인한 혼동 제거.
- 변경: MINIMAL과 같은 공통·유형별·주의사항·요약 구조의 WPF_POPUP_ALL_SPEC.md 추가. DTO·Factory·View 기준 전체 지원·기본값·전달 위치·고정 동작·미구현 및 미검증 범위를 명시. MINIMAL의 ShowFooterButton·상단 X 제거·계약상 필수값 설명을 정정하고 최소 제공 범위 유지. 두 문서의 공동 갱신 규칙을 AGENTS.md에 추가하고 상호 링크·문서 목록·옵션 가이드 연결. API 계약과 JSON 예제의 신규 Footer 필드명 정합성 보완, 이전 showCloseButton 수신 호환은 별도 명시. Word 생성에 전체 기능 부록 C 추가. 외부 D:\work\PopupProject2026\docs는 정확한 절대 경로 확인 후 삭제.
- 주요 파일: docs/interfaces/WPF_POPUP_MINIMAL_SPEC.md, WPF_POPUP_ALL_SPEC.md, POPUP_INTERFACE_SPEC.md, JSON 예제 2개, docs/README.md, docs/POPUP_OPTION_GUIDE.md, AGENTS.md, scripts/export-interface-word.cjs.
- 검증: 소스의 DTO·Factory·View와 주요 필드·기본값 대조. MINIMAL·ALL을 포함한 임시 Word 생성 성공(표 39개·제목 105개). 바깥 docs 삭제 후 Test-Path false 확인. JSON 예제 2개 구문 및 관련 로컬 문서 링크 21개 확인, git diff --check 통과. 코드 변경이 없어 앱 빌드·기능 테스트 미실행. 저장소 기존 Word/PDF 재생성 및 실환경 기능 검증 미실행.
- 상태: 최소·전체 기능 정의서 공동 관리 문서 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-11 — 프로젝트 문서를 루트 docs로 통합

- 이유: 저장소 루트와 WPF 내부에 분산된 문서의 위치와 참조 기준을 통일.
- 변경: 기존 루트 docs의 설계·인터페이스·검토 문서 38개는 루트 위치로 유지하고 WPF 내부 옵션 가이드 5개를 docs로 이동. 통합 문서 목록 docs/README.md 및 AGENTS.md 문서 위치 규칙 추가. WPF 내부 Docs 폴더 제거. 옵션 가이드의 상대 링크와 참조 경로, Word 생성 시 옵션 가이드 안내 경로 보정. 반입 스크립트의 docs 전체 포함으로 가이드까지 A-docs에 통합. 과거 변경 이력·커밋 검토 표의 당시 경로는 유지.
- 주요 파일: docs/, popup-frameWork/Popup/Docs/ 이동 항목, README.md, AGENTS.md, scripts/export-interface-word.cjs, scripts/export-offline-package.ps1.
- 검증: 루트 통합 시 정상 상대 링크 54개 대상 보존 확인, Word/PDF 5개 원본 보존. 루트 경로에서 임시 Word 생성 성공(표 29개·제목 89개). 반입 스크립트 구문 및 문서 복사 함수로 44개 문서 파일 복사 확인. WPF 내부 Docs 제거 및 git diff --check 확인. 문서 변경으로 앱 빌드·기능 테스트 미실행. 전체 반입본 재생성 미실행.
- 상태: 루트 docs 통합 문서 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 기존 Word/PDF 파일은 유지. 반입본·배포 미갱신.

## 2026-10-07-10 — TODO 커밋 제목 dev 접두사 적용

- 이유: TODO 개발 작업과 번호 없는 공통 문서 작업을 커밋 제목에서 구분할 필요.
- 변경: AGENTS.md 형식을 `dev: TODO번호_TODO작업_수정/추가/삭제`로 보완. TODO 관련 계획·검증·문서에도 dev 접두사 적용. 기존 TODO 형식 55개와 이후 설계 25 문서 현행화 1개의 제목을 변경하고 나머지 86개 제목 유지. 기존 main 142개 이력은 로컬 backup/main-before-dev-prefix에 보존. 공통 문서 docs 및 다른 작업 브랜치는 유지.
- 주요 파일: AGENTS.md, docs/reviews/20261007_커밋메시지_TODO_분류검토.md, version-history/CHANGELOG.md, main 커밋 메타데이터.
- 검증: 재작성 중 각 커밋의 파일 트리·작성자·커미터·작성 시각·본문 보존 확인. 부모 ID 연결에 맞춰 병합 구조 유지, 기존 커밋 수 142개 유지. 메시지 재작성 전후 main 최종 트리 동일. 코드 변경이 없어 빌드·테스트 미실행.
- 상태: 로컬 이력 재작성 완료. 규칙·검토 표 주석·변경 이력은 별도 공통 문서 커밋에 포함하며 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-09 — 기존 커밋 제목의 TODO 형식 정리

- 이유: 기존 개발 이력에서 TODO 번호와 구현 요건·변경 종류를 일관되게 식별할 필요.
- 변경: main의 기존 140개 커밋 제목·변경 파일·설계 문서·변경 이력을 검토해 TODO 연결이 확인되는 55개 제목을 `TODO번호_TODO작업_수정/추가/삭제` 형식으로 변경. 초기 반입·병합·공통 문서·번호 불명확 작업 85개는 제목 유지. 번호 없는 작업에 임의의 00을 사용하지 않는 예외를 AGENTS.md에 명시. 전체 검토 표 추가. 기존 이력은 로컬 backup/main-before-todo-message-rewrite 브랜치에 보존하고 다른 작업 브랜치는 변경하지 않음.
- 주요 파일: AGENTS.md, docs/reviews/20261007_커밋메시지_TODO_분류검토.md, version-history/CHANGELOG.md, main 커밋 메타데이터.
- 검증: 기존 140개와 재작성한 140개의 각 파일 트리·작성자·커미터·작성 시각 일치 확인. 본문 보존 및 새 부모 ID 연결로 병합 구조 유지. main 최종 트리 동일, 기존 커밋 수 140개 유지. 이전/새 ID 매핑은 Git 제외 .tmp/commit-message-rewrite-map.csv에 저장. 코드 변경이 없어 빌드·테스트 미실행.
- 상태: 로컬 이력 재작성 완료. 규칙·검토 표·변경 이력은 별도 문서 커밋에 포함하며 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-08 — TODO 기준 커밋 메시지 형식 고정

- 이유: 구현 요건과 변경 종류가 커밋 제목에서 일관되게 식별되도록 규칙 정리.
- 변경: AGENTS.md에 `TODO번호_TODO작업_수정/추가/삭제` 형식과 마지막 구분 선택 규칙, 요건별 커밋 분리 및 예시 추가. 이후 커밋부터 적용.
- 주요 파일: AGENTS.md, version-history/CHANGELOG.md.
- 검증: 문서 변경 내용 확인. 코드 변경이 없어 빌드·테스트 미실행.
- 상태: 규칙·검토 이력 문서 커밋에 포함. 기존 커밋 메시지의 후속 변경은 2026-10-07-09 참조. 원격 반영 여부는 Git 이력으로 확인.


## 2026-10-07-07 — chore(git): 임시 작업 폴더 제외

- 이유: 임시 빌드와 측정 산출물의 커밋 혼입 방지.
- 변경: 루트 /.tmp/ 제외. 6bc4678을 soft reset한 뒤 구현 요건별 재구성하여 임시 산출물을 새 커밋 이력에서 제외. 기존 커밋은 로컬 backup/6bc4678-before-split에 보존.
- 주요 파일: .gitignore.
- 검증: git ls-files .tmp 결과 0개, 제외 규칙·로컬 파일 보존 확인. .tmp·.gitignore·변경 이력을 제외한 최종 트리는 6bc4678과 동일. git diff --check 통과. 실행 중인 앱의 기본 출력 잠금으로 임시 출력 경로를 사용한 WPF 빌드 경고·오류 0. 행동 검증 재실행은 하지 않음.
- 상태: 구현 요건별 분할 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-06 — test(wpf): 저사양 PC 성능 측정 도구와 절차 추가

- 이유: 대상 PC에서 동일 조건의 성능 비교 준비.
- 변경: 앱 본체·WebView2 자손 CPU와 메모리 CSV, 요약·환경 JSON 기록. 구간별 측정 가이드 추가.
- 주요 파일: scripts/measure-popup-performance.ps1, docs/reviews/20261007_저사양_PC_VIDEO_측정_가이드.md.
- 검증: 로컬 PowerShell 대상 4초 측정·4개 샘플·파일 생성 확인. 실제 저사양·Horizon 측정 미실행.
- 상태: 구현 요건별 분할 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-05 — fix(wpf): VIDEO 모서리 좌표 및 드래그 표시 보완

- 이유: 모서리 돌출과 드래그 중 사라짐 보완.
- 변경: 물리 픽셀 영역에 대응하는 quarter-circle Geometry 사용. DPI 적용 후 재생성, 드래그 중 표시·위치 추적 유지, 이동 종료 시 위치만 갱신. VIDEO 불투명 창 유지.
- 주요 파일: popup-frameWork/Popup/Views/Windows/OpaqueWindowCorners.cs, docs/design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md.
- 검증: 분할 전 드래그 숨김 제거 후 WPF 빌드 경고·오류 0. Horizon·다중 DPI·영상 CPU 실측 미실행.
- 상태: 구현 요건별 분할 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-04 — refactor(wpf): Footer 버튼 표시 옵션 이름 통일

- 이유: 버튼 표시 옵션을 실제 Footer 역할에 맞게 정리.
- 변경: ShowFooterButton으로 모델·DTO·Factory·Demo 옵션 변경. 기존 서버 showCloseButton JSON 수신 호환 유지.
- 주요 파일: popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs, popup-frameWork/Popup/Models/PopupOptions.cs, popup-frameWork/Popup/Dtos/PopupResponseDto.cs, popup-frameWork/Popup/Factories/PopupFactory.cs, popup-frameWork/Popup/Services/DemoPopupDataService.cs, popup-frameWork/Popup/DemoOptionsWindow.Fields.cs, popup-frameWork/Popup/Docs/POPUP_OPTION_GUIDE.md.
- 검증: 분할 전 행동 검증 798건 통과. 서버·웹 옵션 이름은 변경하지 않음.
- 상태: 구현 요건별 분할 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-03 — style(wpf): 팝업 외곽 테두리 제거 및 Radius 6 적용

- 이유: 공통 팝업 외곽 규격 통일.
- 변경: 외곽 테두리 0·Radius 6, Header 위쪽 Radius 6 적용. Fullscreen Radius 0과 Clip 계산 구조 유지.
- 주요 파일: popup-frameWork/Popup/Views/Windows/PopupWindow.xaml, popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs.
- 검증: 분할 전 새 창 크기·Clip 기준 행동 검증 798건 통과. 분할 커밋별 테스트는 미실행.
- 상태: 구현 요건별 분할 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-02 — feat(wpf): 검은 헤더와 고정 로고 적용

- 이유: 공통 헤더 외형 단순화.
- 변경: 검은 배경·흰 제목·높이 40과 고정 로고 Resource 적용. 상단 X 제거, Header 높이는 XAML 단일 기준 사용. 로고는 기존 웹 이미지 임시 사용.
- 주요 파일: popup-frameWork/Popup/Views/Windows/PopupWindow.xaml, popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs, popup-frameWork/Popup/Popup.csproj, popup-frameWork/Popup/Resources/HeaderLogo.png.
- 검증: 분할 전 WPF 빌드 경고·오류 0. 로고 최종 확정·실환경 표시 확인 미완료.
- 상태: 구현 요건별 분할 커밋에 포함. 원격 반영 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-07-01 — VIDEO 불투명 창 둥근 모서리를 Region 절단 + 모서리 레이어드 창으로 전환

- 이유: Horizon(VMware) 환경에서 DWM rounded corner가 동작하지 않고, 대안으로 시험한 CreateRoundRectRgn + SetWindowRgn은 픽셀 단위 경계라 곡선 계단이 남음(설계 25 2026-10-07 검증 결과). VIDEO 창 모서리 아래에는 영상이 오지 않고 항상 Header/본문 단색이라는 점을 이용해 AllowsTransparency=false를 유지하면서 일반 팝업과 같은 안티앨리어싱 곡선을 재현.
- 변경: Views/Windows/OpaqueWindowCorners 추가. 본 창 Region을 전체 사각형에서 네 모서리의 Radius 크기 정사각형만 뺀 직사각형 조합으로 설정하고, 그 자리에 본 창 소유의 per-pixel alpha HwndSource 4개(WS_EX_TOOLWINDOW·NOACTIVATE·TRANSPARENT·TOPMOST)를 띄워 같은 CornerRadius·테두리·배경의 WPF Border 모서리를 그림. WM_WINDOWPOSCHANGED에서 위치 추적·크기 변경 시에만 Region 재생성, DpiChanged에서 재생성, IsVisibleChanged로 표시 동기화, Closed에서 해제. SetWindowRgn 실패 시에만 HRGN 해제. PopupWindow는 0으로 바꾸기 전 PopupBodyBorder Radius를 기억해 FULLSCREEN 외 VIDEO/VIDEO+QUIZ에 적용하고, 위쪽 모서리 색은 ShowHeader에 따라 Header/본문 배경 사용. 기존 DWM rounded-corner 메서드·상수·PInvoke 제거. 설계 25에 방식·성능 판단·확인 항목 추가.
- 주요 파일: popup-frameWork/Popup/Views/Windows/OpaqueWindowCorners.cs, popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs, docs/design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md.
- 검증: WPF 빌드 경고·오류 0, 행동 검증 798건 통과. 실제 화면의 모서리 품질, 드래그 중 모서리 추적, DPI·다중 모니터, Horizon 환경 표시, VIDEO 재생 CPU 실측 미실행.
- 상태: 로컬 반영, 미커밋. 반입본·배포 미갱신. 설계 25의 나머지 항목(Header 검은색·로고·ShowFooterButton·Radius 6 전환)은 미적용.

## 2026-10-06-10 — popupSample 전환 및 VIDEO 경량화 반입본 갱신

- 이유: 2026-10-06-06~09(출력 어셈블리 popupSample 전환, VIDEO 저사양 PC 부하 개선, DWM 둥근 모서리, 버퍼 막대 갱신 축소)를 20261006 폐쇄망 반입본에 포함.
- 변경: offline-export/20261006의 3-popup-frameWork에 a1d8a1e 이후 변경된 WPF 소스 9개, 4-docs에 설계 24와 변경 이력을 반영. MANIFEST-4-docs에 설계 24 추가, 반입 안내의 기준 커밋·변경 요약·실행 파일 이름(popupSample.exe) 갱신, 소스 SHA256·3/4번 TAR·통합 TGZ 및 체크섬 재생성. 서버·웹 묶음은 변경 없음. 이전 TGZ와 안내·체크섬은 Git 제외 검증 폴더에 백업.
- 주요 파일: offline-export/20261006/ (Git 제외), version-history/CHANGELOG.md.
- 검증: 3·4번 묶음 소스 145개와 저장소 파일 일치 확인. 새 3번 TAR만 새 폴더에 풀고 6-offline-packages의 NuGet만으로 build-wpf-offline.ps1 실행해 외부 feed 없이 restore·win-x64 self-contained publish 성공(popupSample.exe 생성). 통합 TGZ를 새 폴더에 풀어 개별 TAR SHA256과 추출 소스 SHA256 대조. 게시본 실행, 폐쇄망 PC 실행·배포 미실행.
- 상태: 반입본 갱신·검증 완료. 이 변경 이력 항목은 main 커밋·푸시 대상이며 완료 여부는 Git 이력으로 확인. 폐쇄망 PC 반입·배포 미실행.

## 2026-10-06-09 — VIDEO 버퍼 막대 갱신 축소 (렌더링 진단 로그는 측정 후 제거)

- 이유: 저사양 PC CPU 측정값이 WPF 소프트웨어 렌더링(원격 데스크톱·가상머신·오래된 드라이버) 상태에서 나온 것인지 구분할 근거가 없음. HTML5 재생 중 모든 메시지마다 버퍼 막대 요소를 지우고 새로 만드는 부분 정리. 로딩·버퍼링·재생 상태별 CPU 점유율과 컨트롤바 표시 지연을 현장에서 수치로 확인할 필요.
- 변경(보완): Services/VideoPerformanceMonitor 추가. 영상 팝업 Loaded~Unloaded 동안 1초마다 스레드 풀에서 앱·영상 전용 WebView2 프로세스(CoreWebView2Environment.GetProcessInfos)·시스템 CPU를 작업 관리자 기준(전체 코어 대비 %)으로 샘플링하고, 같은 시점에 Input 우선순위 작업의 UI 스레드 실행 지연을 측정. 상태(loading/buffering/playing/paused/idle/error/youtube)가 바뀌거나 30초가 지나면 구간별 CPU 평균/최대와 UI 지연 p50/p95/max를 render 로그에 기록. 숨겨진 컨트롤바를 마우스로 다시 띄운 경우 OS 입력 시각부터 다음 렌더 프레임까지의 지연을 기록.
- 변경: Services/RenderDiagnostics 추가. 단일 인스턴스 확정 후 `%LOCALAPPDATA%\Popup\logs\render-yyyyMMdd.log`에 RenderCapability Tier·원격 세션 여부·ProcessRenderMode를 기록하고 TierChanged 시 다시 기록. 영상이 열리면 엔진(MediaElement/WebView2-HTML5/WebView2-YouTube), 원본 해상도(HTML5는 메시지에 videoWidth/videoHeight 추가, YouTube는 0x0), 표시 영역 크기를 기록. 버퍼 구간·길이가 바뀐 경우에만 DrawBufferedTrack을 호출하고, 기존 Rectangle을 재사용하며 남는 막대만 제거.
- 변경(제거): 로컬 측정을 마친 뒤 진단 코드 전체 제거. RenderDiagnostics.cs·VideoPerformanceMonitor.cs 삭제, App 시작 시 호출, 영상 열림 로그 호출, HTML5 메시지의 videoWidth/videoHeight, 컨트롤바 표시 지연 측정용 래퍼를 되돌림. 버퍼 막대 갱신 축소(구간·길이 변경 시에만 다시 그리고 Rectangle 재사용)만 유지.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs (진단 단계에서 Services/RenderDiagnostics.cs, Services/VideoPerformanceMonitor.cs, App.xaml.cs를 수정했다가 제거).
- 검증: 진단 코드 포함 상태와 제거 후 모두 WPF 빌드 경고·오류 0, 행동 검증 798건 통과(실행 중인 popupSample.exe가 기본 출력 파일을 잠그고 있어 임시 출력 폴더로 빌드·실행). 진단 코드 포함 상태의 로컬 MediaElement 재생 로그(16코어, Tier 2, 592x252 영상): playing 구간 app CPU 평균 0.4~2.4%(최대 5.9%), system 4.0~11.7%, UI 지연 p95 23~36ms(최대 43ms). 컨트롤바 표시 지연은 모두 0ms로 기록되어 측정 방식의 신뢰성이 낮았음. 버퍼 막대 표시, HTML5·YouTube 경로, 저사양 PC CPU 실측 미실행.
- 상태: 로컬 반영. main 커밋·푸시 대상이며 완료 여부는 Git 이력으로 확인. 반입본·배포 미갱신. 측정 결과 파일 `%LOCALAPPDATA%\Popup\logs\render-20261006.log`는 로컬에 남아 있음.

## 2026-10-06-08 — VIDEO 불투명 창 둥근 모서리 DWM 적용

- 이유: 2026-10-06-06에서 CPU 부하 때문에 VIDEO 창을 불투명 창으로 바꾸면서 둥근 모서리가 사라짐. WPF Clip이나 레이어드 창을 다시 쓰지 않고, 영상 프레임마다 CPU 작업이 늘지 않는 방식으로 외형을 복원.
- 변경: VIDEO/VIDEO+QUIZ 창(FULLSCREEN 제외)의 SourceInitialized에서 DwmSetWindowAttribute(DWMWA_WINDOW_CORNER_PREFERENCE=ROUND)를 적용. DWM이 GPU 합성 단계에서 모서리를 자르므로 WPF 렌더링은 변하지 않음. 적용에 성공하면 모서리에서 끊기는 WPF 1px 테두리를 0으로 바꾸고, 같은 색(#E5E7EB)을 DWMWA_BORDER_COLOR로 지정. 속성을 지원하지 않는 OS(Windows 10 등)는 실패 HRESULT를 받아 기존 직각 창과 1px 테두리를 유지.
- 주요 파일: popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs.
- 검증: WPF 빌드 경고·오류 0(실행 중인 popupSample.exe가 기본 출력 파일을 잠그고 있어 임시 출력 폴더로 빌드). 실제 화면의 모서리·테두리 확인, Windows 10 fallback 확인, 저사양 PC CPU 실측, 행동 검증 미실행.
- 상태: 로컬 반영. main 커밋·푸시 대상이며 완료 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-06-07 — WPF 출력 어셈블리 이름 popupSample 전환

- 이유: WPF 실행 파일 이름을 popupSample로 바꾸려면 출력 어셈블리 이름과 XAML ResourceDictionary pack URI의 어셈블리 이름이 같아야 함. 다르면 공통 스타일 로드에 실패해 팝업 화면 생성 중 예외가 발생.
- 변경: Popup.csproj에 AssemblyName=popupSample 추가. PopupWindow·TextPopupView·ImagePopupView·VideoPopupView·SurveyPopupView XAML과 PopupAlert.cs의 `/Popup;component/` 참조를 `/popupSample;component/`로 변경. 루트 네임스페이스(Popup.*)와 포함 리소스 LogicalName(Popup.appsettings.json, Popup.DemoMedia.*)은 명시 값이라 유지.
- 주요 파일: popup-frameWork/Popup/Popup.csproj, Views/Windows/PopupWindow.xaml, Views/Windows/PopupAlert.cs, Views/Contents/{Text,Image,Video,Survey}PopupView.xaml.
- 검증: WPF 빌드 경고·오류 0, popupSample.exe/.dll 생성 확인. `--demo` 실행과 POPUP_DEV_USER_ID 지정 일반 실행 모두 15초 이상 종료 없이 유지. 행동 검증 798건·복구 122건 통과. 19:03~19:04 이벤트 로그의 Popup.dll 비정상 종료(0xe0434352, 스택 없음)는 원인 스택을 확보하지 못해 이번 변경과의 직접 관련은 미확인. 스크립트에는 Popup.exe 참조가 없으나 README·설계 문서의 `Popup.exe` 표기는 미갱신.
- 상태: 로컬 반영·검증 완료. main 커밋·푸시 대상이며 완료 여부는 Git 이력으로 확인. 반입본·배포 미갱신.

## 2026-10-06-06 — VIDEO 저사양 PC 렌더링 부하 개선

- 이유: 저사양 PC에서 영상 팝업 재생 중 CPU 약 90%, 일시정지 중 약 80%가 관찰됨. 현장 비교에서 무한 로딩 애니메이션, 영상 부모 Border의 DropShadowEffect, 레이어드(AllowsTransparency) 창이 주요 부하 요인으로 확인되어 설계 24로 정리하고 기능 유지 범위에서 반영.
- 변경: 설계 24(현장 비교 결과·수정 TODO) 작성. VideoPopupView의 Loaded 트리거 RepeatBehavior=Forever 회전 애니메이션을 제거하고 SetLoadingAnimation 단일 지점에서 로딩·버퍼링 동안만 실행. 안내 닫기·재생 차단·오류·일시정지·재생 종료·Unloaded에서 clock 제거, 중복 시작 방지. PopupWindow는 VIDEO/VIDEO+QUIZ 창만 핸들 생성 전에 AllowsTransparency=false, 흰 배경, 그림자 여백·DropShadowEffect·둥근 모서리 제거(1px 테두리 유지). 다른 팝업 유형·배경 오버레이·전체화면 창은 변경 없음. 장식용 그림자 대안은 실측 후 결정하도록 보류.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml/.cs, popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs, docs/design/24_VIDEO_저사양_PC_CPU_개선_TODO.md, Popup.BehaviorTests/Program.cs(Git 제외 검증 프로젝트).
- 검증: WPF 빌드 경고·오류 0. 행동 검증 798건 통과(신규 23건: 유형별 창 불투명·그림자 정책, 로딩/재버퍼링/일시정지/재생 차단/오류/Unloaded별 애니메이션 clock 유무). 복구 122건·HTML5 bridge 89건 통과. 기준 커밋에 임시 테스트 코드(OpenSimpleVideoTest 등)가 없음을 확인. 저사양 PC CPU 실측, 불투명 창 외형·드래그·다중 모니터/DPI·WebView2 표시의 실제 화면 확인 미실행.
- 상태: 로컬 구현·자동 검증 완료. main 커밋·푸시 대상이며 완료 여부는 Git 이력으로 확인. 반입본 갱신·배포 미실행.

## 2026-10-06-05 — Demo 옵션 및 IMAGE 화면 정책 반입본 갱신

- 이유: Demo 관리 화면·옵션 편집·JSON 복사와 IMAGE 작업 영역 90% 정책을 최신 폐쇄망 반입본에 포함.
- 변경: offline-export/20261006의 서버·웹·WPF·문서 소스를 현재 수정분으로 갱신하고 신규 Demo 설정 파일 3개 포함. 반입 안내·manifest·소스 SHA256·TAR/TGZ 및 체크섬 재생성. 이전 TGZ는 Git 제외 검증 폴더에 백업. NuGet/SDK는 기존 반입본 사용, 개인 MockSso 실행 설정과 검증 프로젝트·실행 산출물은 제외.
- 주요 파일: offline-export/20261006/ (Git 제외), version-history/CHANGELOG.md 및 2026-10-06-03/04의 코드·문서.
- 검증: 반입 소스 파일별 SHA256 일치 확인, 반입본만 새 폴더에 복사해 외부 feed 없이 restore·win-x64 self-contained publish 성공. TAR/TGZ 목록·실행 산출물 제외 및 추출 파일 SHA256 검증 완료. 기존 구현 검증은 WPF 775건·서버 85건·브라우저 27건 및 웹 type-check/build 통과.
- 상태: 반입본 갱신·검증 완료. main 커밋·푸시 대상이며 완료 여부는 Git 이력으로 확인. 폐쇄망 PC 실행·배포 미실행.

## 2026-10-06-04 — IMAGE 창 최대를 화면 작업 영역 기준으로 전환

- 이유: IMAGE 창에 고정 최대값 1200×900이 먼저 적용되어 큰 디스플레이에서 지정 크기보다 작게 표시되는 문제 개선.
- 변경: IMAGE(ORIGINAL 포함)의 일반 창 최대를 현재 모니터 작업 영역 너비·높이의 90%로 계산하고 고정 maximumWidth/maximumHeight 값을 상한으로 사용하지 않음. 최소는 화면 상한 이하로 보정. FIT_TO_IMAGE 지정 이미지 픽셀/DIP 크기를 유지하고 중앙 Clip, ADAPTIVE 비율 유지 표시, ORIGINAL 왼쪽 위 Clip, FULLSCREEN 전체 모니터 우선 유지. 모니터/작업 영역/DPI 변경 시 기존 이미지 추천 크기도 새 화면 상한으로 재적용. 다른 유형의 기존 최대값 정책 유지.
- 변경: Demo 이미지 고정 최대 입력 제거와 화면 정책 안내, 웹 미리보기/실제 크기 모달의 동일 90% 제한 및 ORIGINAL 크기 입력의 고정 최대 제약 제거. 서버/웹/Demo IMAGE 최소가 사용하지 않는 고정 최대보다 큰 경우의 비교 검증 제거(저장 컬럼의 유한 양수 검증 유지). 인터페이스 v3.6 MD/Word/PDF·설계 23·옵션 가이드 갱신.
- 주요 파일: PopupWindow.xaml.cs, DemoOptionsWindow.cs/.Fields.cs, imagePreviewLayout.ts, PopupPreview.tsx, PopupEditorDialog.tsx, PopupService.java, PopupAdminQuestionsTest.java, scripts/verify-image-preview*, 인터페이스 v3.6 및 IMAGE 문서.
- 검증: WPF 빌드 경고·오류 0, 행동 검증 775건 통과(고정 최대 무시·작업 영역 90%·4K 상한·ORIGINAL 및 최소 상한 보정·다른 유형 회귀 포함). 서버 core/API 85건 통과. 브라우저 IMAGE 검증 27건·웹 type-check/build 통과(기존 lint/runtimeConfig 경고 존재). 인터페이스 Word 갱신·PDF 내보내기 및 git diff --check 완료. 물리 다중 모니터/DPI 전환·폐쇄망 실행 미실행.
- 상태: 로컬 구현·검증 완료. DB 구조·저장 데이터 수정·배포 미실행. 반입본 갱신과 커밋·푸시 후속 결과는 2026-10-06-05 및 Git 이력 참조.

## 2026-10-06-03 — Demo 관리 화면·옵션 편집 및 요청·응답 JSON 복사

- 이유: 누적된 유형별 옵션과 실행 버튼을 정리하고 전송 결과 JSON의 확인·복사 편의 개선.
- 변경: 전체 실행·상태 초기화 상단 배치, 샘플 선택·실행·옵션 편집·선택 옵션 기본값 복원 분리. 설정창에서 공통 창/콘텐츠/문항·선택지를 편집하며 크기·비율·위치·표시 영역·숨김·완료 조건·푸터 링크·Overlay·폰트, 텍스트 문구, 이미지 표시 크기/비율, 영상 재생, 문항·선택지 문구/배치/필수·배점/정답 등을 지원. 비활성 옵션의 입력 검증 제외, 유한 숫자·범위·최소/최대·푸터 URL 검증, 설정 취소 시 원본 보존. 샘플별 편집 값을 실제 표시와 게이트웨이 결과 검증에 함께 적용하고 상태 초기화 후에도 유지(앱 종료 시 초기화).
- 변경: 결과 요약·점수·JSON 상세 구분. 결과 한 건당 로그 요약 한 줄 표시, 선택한 과거 결과의 Request/Response JSON을 들여쓰기해 표시. 읽기 전용 텍스트 선택·Ctrl+C 및 요청/응답별 복사 버튼 제공, 빈 상세 복사 비활성화와 클립보드 사용 실패 안내. 로그 초기화 시 JSON 상세·복사 상태·점수 초기화. Demo 설정 코드를 별도 partial 파일로 분리하고 목록 로딩 중 재진입 방지.
- 주요 파일: popup-frameWork/Popup/DemoWindow.xaml, DemoWindow.xaml.cs, DemoWindow.Settings.cs, DemoOptionsWindow.cs, DemoOptionsWindow.Fields.cs, Services/DemoPopupGateway.cs, popup-frameWork/README.md.
- 검증: WPF 빌드 경고·오류 0. 로컬 행동 검증 765건 통과. 기존 회귀, 결과 선택·JSON 보존·복사 버튼 상태·초기화, 두 화면 크기의 7개 샘플 배치, 모든 샘플 설정창/탭 배치, 편집 취소 원본 보존·실제 Factory 적용·영상 완료 비율의 게이트웨이 검증·상태 초기화 후 옵션 유지 검증. 렌더링 이미지 확인. 실제 시스템 클립보드 쓰기는 코드 검토 범위이며 자동 검증에서 실행하지 않음.
- 상태: 로컬 구현·검증 완료. 반입본 갱신과 커밋·푸시 후속 결과는 2026-10-06-05 및 Git 이력 참조. 배포 미실행. 로컬 검증 프로젝트는 기존 Git 제외 정책 유지.

## 2026-10-06-02 — IMAGE DB 전환 확인 및 폐쇄망 반입본 생성

- 이유: IMAGE v3.6 구현분의 개발 DB 정합성 확인과 최신 소스·문서의 폐쇄망 반입 준비.
- 변경: 로컬 OracleServiceXE 시작, 로컬 POPUP 및 원격 개발 DB zero-rule에서 전환 계획·원문 백업 생성 후 전환 SQL 실행·검증·COMMIT. 두 DB 모두 IMAGE 0행으로 UPDATE 0행. Gradle 전환 도구의 상대 출력 경로를 서버 루트 기준으로 고정. 20261006 반입본은 서버·웹 변경분, WPF/MockSso 소스와 기존 영상 교체분, 최신 문서의 4개 TAR 및 통합 TGZ로 구성. NuGet·SDK는 기존 반입본 사용, 개인 launchSettings와 검증 하네스·빌드 산출물 제외.
- 주요 파일: db/oracle/11_IMAGE_CONTRACT_TRANSITION.md, db/oracle/README.md, 설계 23, service/core/build.gradle.kts, offline-export/20261006/ (Git 제외), version-history/CHANGELOG.md.
- 검증: 두 DB 계획 생성·전환 SQL·COMMIT 성공, IMAGE 행 수 각각 0 확인. 반입본 소스만 새 폴더에 복사해 외부 feed 없이 restore·win-x64 self-contained publish 성공. Gradle 상대 출력 경로 검증 성공. TAR/TGZ 목록·실행 산출물 제외·영상 원본 SHA256 일치 및 압축 SHA256 검증 완료.
- 상태: DB 전환 확인 완료. 반입본 생성·검증 완료. 구현 커밋 6cb656e main 푸시 완료. 검증 결과 기록 보완은 후속 커밋에 포함. 배포·실제 IMAGE 저장/API 연계·물리 다중 모니터·폐쇄망 실행 미실행. MockSso 개인 실행 설정은 Git 제외 유지.
## 2026-10-06-01 — IMAGE 단일 크기 계약 및 비율 옵션 구현

- 이유: 설계 23의 창 우선/이미지 우선 구분, 비율 잠금, 최대 창 초과 Clip, 하단 설명 계약 반영.
- 변경: 일반 IMAGE 외부 크기를 content.width/height 한 쌍으로 통일하고 FIT_TO_IMAGE 전용 keepAspectRatio(기본 true)를 추가. 웹 모드별 라벨·비율 양방향 연동·독립 입력·왜곡 안내 및 미리보기 반영. WPF는 고정 시 너비 우선 원본 비율 정규화, 해제 시 지정 크기·누락 축 원본 DIP 사용, 최대 초과 시 표시 크기 유지/중앙 Clip. 창 계산은 제목·설명 측정, 표시 중인 헤더/푸터 행과 실제 여백/Border를 합산. 설명 하단 통일·30% 제한 스크롤, 빈 제목/설명 간격 제거, 모니터·작업 영역·DPI 재계산. ADAPTIVE 원본 초과 확대 제한 및 ORIGINAL/FULLSCREEN 계약 유지.
- 변경: 서버 DTO의 일반 IMAGE 최상위 크기 생략, 새 입력의 구 필드·FILL·중복 크기 지시·비율 모드·크기 검증, 기존 저장 행의 새 응답 변환. FILL 분기와 설명 배치/비율 계약 제거. Oracle 11g용 대상 조회 및 원문 백업·전환/복원 SQL 생성 도구 준비(SELECT만 실행하는 도구, 원문 비교·행 잠금·오류 시 ROLLBACK, 자동 COMMIT 없음). 최초 구현 검증 시 DB 미실행, 후속 적용 결과는 2026-10-06-02 참조.
- 주요 파일: PopupEditorDialog.tsx, PopupPreview.tsx, imagePreviewLayout.ts, ImagePopupContentDto.cs, PopupFactory.cs, ImagePopupView.xaml/.cs, PopupWindow.xaml.cs, PopupContentAssembler.java, PopupService.java, ImageContractMigration.java, db/oracle/11_IMAGE_CONTRACT_TRANSITION.md, 설계 23, 인터페이스 v3.6 Markdown/JSON/Word/PDF 및 가이드.
- 검증: WPF 빌드 경고·오류 0 및 로컬 행동 검증 699건, 서버 core 55건/API 29건(총 84건), headless Edge IMAGE 표시 23건 통과. 웹 type-check·build 성공(기존 lint/runtimeConfig 경고 존재). Word 목차 갱신·PDF 내보내기 완료. git diff --check 통과. 원격 DB·실제 API 저장 클릭·물리 다중 모니터/DPI 전환·폐쇄망 실행은 미실행.
- 상태: 로컬 구현·자동 검증 완료, 미커밋. DB 전환·반입·커밋·푸시 후속 결과는 2026-10-06-02 및 Git 이력 참조. 배포 미실행. 기존 영상/MockSso 및 반입 패키지 변경 이력 보존. WPF 로컬 검증 프로젝트는 기존 Git 제외 정책 유지.

## 2026-10-05-01 — IMAGE 크기 모드 단순화 구현 TODO

- 이유: 창 기준과 이미지 기준 표시를 명확히 구분하고 FIT_TO_IMAGE의 불필요한 여백·설명 배치·최소/최대 계산 정책을 정리.
- 변경: ADAPTIVE/FIT_TO_IMAGE 두 일반 모드, FILL 제거, 설명 선택 및 하단 통일, 모드별 크기 입력 분리(ADAPTIVE는 창/FIT_TO_IMAGE는 이미지), 표시 크기·비율 잠금, 등록·서버·WPF 크기 검증, 최소 크기 예외 여백, 최대 제한 시 이미지 자동 축소 없이 잘림, 기존 데이터 전환 및 회귀 검증 TODO 작성. FULLSCREEN/ORIGINAL 유지 및 서로 다른 크기 옵션 계층 명시.
- 주요 파일: docs/design/23_IMAGE_크기모드_단순화_TODO.md.
- 변경(최종): IMAGE 응답 크기를 content.width/height로 통일하고 수신 시 내부 창/이미지 크기로 변환하도록 명시. FIT_TO_IMAGE 전용 keepAspectRatio(기본 true), 고정 시 비율 연동·해제 시 지정 크기와 왜곡 허용, 최대 창 초과 시 자동 축소 없는 Clip, JSON 예시·기존 필드 전환·검증 항목으로 설계 23 재정리. 별도 stretch ENUM은 추가하지 않으며 DB 컬럼 통합은 전제하지 않음.
- 검증: 현행 ImagePopupView·PopupWindow·PopupFactory·관리자 편집기 및 설계 15 대조, 문서 diff 점검. 제품 코드 미변경으로 빌드·런타임 테스트·DB 전환 미실행.
- 상태: TODO 문서 커밋 대상. 구현·원격 푸시·배포 미실행. 커밋 여부는 Git 이력으로 확인.

## 2026-10-03-18 — 폐쇄망 반입 패키지 20261003 생성

- 이유: 최신 WPF·웹 UI, Demo 문항, VIDEO 및 백엔드 전달 정의서를 폐쇄망 반입용 소스로 정리.
- 변경: 기존 서버/웹 기준 커밋 대비 변경분, WPF 소스 및 MockSso, 최신 문서를 4개 묶음과 오늘자 TGZ로 구성. 기존 폐쇄망 의존성 반입본을 사용하므로 최종 TGZ에서 6-offline-packages와 해당 manifest·체크섬 항목 제외. 개발용 로컬 검증 프로젝트·캐시·별도 실행 설정·빌드 산출물 제외. 20260930 이후 삭제 목록과 manifest·SHA256 제공. 브라우저 끝부분 탐색 시 처음부터 재생되는 Demo 영상 이슈에 대해 libx264/yuv420p/High/AAC/faststart 재인코딩본으로 Media/demo-video.mp4 교체.
- 주요 파일: offline-export/20261003의 반입 패키지 및 README-IMPORT.md, MANIFEST, SHA256SUMS.txt, DELETE-SINCE-20260930.txt.
- 검증: 반입 파일만 새 폴더에 복사해 외부 feed 없이 restore·win-x64 self-contained publish 성공. 재인코딩 영상 전체 디코딩 오류 없음. headless Edge 중간/끝부분/되감기 탐색 4곳 및 끝부분 재생 확인(96.708초에서 97.008초로 진행, 오류 없음). TAR/TGZ 파일 목록 및 SHA256 확인. 기존 코드 검증 결과는 해당 변경 이력 참조.
- 상태: 로컬 반입 패키지 생성 완료. NuGet은 기존 반입본 사용, 이번 TGZ에 포함하지 않음. 패키지·FFmpeg 도구·로컬 검증은 Git 제외, 영상 소스 및 변경 이력 미커밋. 폐쇄망 PC 설치·실행·실제 API 연계 미실행.

## 2026-10-03-17 — 백엔드 전달용 유형별 JSON 및 필수값 누락 점검

- 이유: 백엔드 연동 시 실제 수신 기본값과 계약상 필수값을 구분하고 누락으로 인한 결과 전송·필수 응답·채점 오류를 예방.
- 변경: TEXT/IMAGE/VIDEO/SURVEY/QUIZ/VIDEO+QUIZ 전체 항목 예시 및 6종 Envelope JSON 추가. WPF DTO·Factory·결과 대기열·채점기와 Java 저장 검증을 대조해 필수값, 생략/null 차이, ID 양수/중복, isScored·passingScore 누락, 결과 status 미검증을 명시. 최소 정의서에서 예시/점검표 연결. 기존 v3.5 DOCX/PDF 갱신.
- 주요 파일: docs/interfaces/POPUP_INTERFACE_SPEC.md, WPF_POPUP_MINIMAL_SPEC.md, examples/WPF-01-popup-types.json, WPF_Popup_API_Interface_v3.5.docx/.pdf.
- 검증: 실제 C# DTO/QuizGrader를 링크한 로컬 제외 프로젝트 58건 통과(6종 JSON·ID/옵션/레이아웃·100점 정답/미응답·0점 통과 누락 재현·null 처리). Word 목차·페이지 갱신 및 PDF 52쪽 생성. 미디어 URL은 형식 예시이며 실제 원격 자원 재생/API 연동은 미실행.
- 상태: 문서 검증 완료, main 커밋·푸시 대상으로 확정. 개발용 로컬 테스트와 별도 MockSso 실행 설정은 Git 반영 제외. 제품 코드·수신 검증·서버 저장 로직 변경 없음. 필수값 보완 대상은 정의서 6.4절 TODO로 기록.

## 2026-10-03-16 — 문서·인터페이스 정의서 정합성 점검 및 통합 반영

- 이유: VIDEO·Survey·Quiz·웹 미리보기 수정분을 문서와 대조하고 커밋 가능한 최종 결과물로 정리.
- 변경: 인터페이스 v3.5에서 결합 화면의 영상/문항 Scroll과 하단 고정 제출 영역을 구분하고 공통 Footer의 제출 우선 동작·Row/Chip 표시·필수 진행 상태 명시. JSON 필드·ENUM·응답/점수 계약은 유지. 설계 20을 최종 무채색 UI 기준으로 통합하고 가이드·README의 오래된 스크롤 설명 보완. Word 생성기의 관리자 미리보기 부록 보완, DOCX 목차/페이지 갱신 및 PDF 43쪽 재생성. 앞선 변경 상태는 각 작업 시점의 기록이며 통합 반영은 Git 이력으로 확인한다.
- 주요 파일: 인터페이스 Markdown/최소 범위/DOCX/PDF, Word 생성기, 설계 19~22·WPF/웹 가이드, 앞선 VIDEO·Survey·Demo·웹 코드 및 검증 프로젝트 Git 제외 정책.
- 검증: WPF 최종 빌드 경고·오류 0, WPF 582건·HTML5 89건 재검증 통과. 웹 타입/production 빌드·변경 파일 lint·headless Edge 40건 통과 결과 유지. DOCX 실제 텍스트에 수정 내용 포함 확인, Word PDF 43쪽 생성. git diff --check 및 원격 main 동기화 확인. 로컬 검증 프로젝트·하네스 및 기존 별도 MockSso 실행 설정은 커밋 대상에서 제외.
- 상태: 검증 완료, main 통합 커밋·푸시 대상 확정. 실행 파일/dist 반입 패키지·배포 갱신 없음. 실제 물리 입력·DPI·원격 API·관리자 로그인 검증은 미실행으로 유지.

## 2026-10-03-15 — 웹 Survey·Quiz 미리보기 WPF UI 정합성 반영

- 이유: 관리자 웹 미리보기의 기본 Radio/Checkbox·스크롤 내부 제출 영역을 최종 WPF Survey·Quiz UI와 동일한 시각·동작 규칙으로 구성.
- 변경: SurveyPreview 공통 컴포넌트·무채색 토큰, 세로 전체 폭 Row/우측 Path·가로 공통 Chip·선택 높이 안정화·TextArea·고정 Footer·필수 진행 문구·진회색 Submit 적용. native 입력·Space/Enter·영상 완료 기준 잠금/해금 유지. WPF Demo SURVEY 6/QUIZ 5문항을 예제 전환으로 제공하며 원본 편집 데이터에 저장하지 않음. 응답·채점은 미리보기 로컬 상태에만 반영, API·서버·Payload 변경 없음.
- 주요 파일: PopupPreview.tsx, SurveyPreview.tsx, popupDemoQuestions.ts, 웹 README·설계 22. 검증 하네스·PNG Git 제외 유지.
- 검증: 웹 타입 검사·production 빌드 통과, 변경 세 파일 lint 경고·오류 없음. headless Edge 브라우저 40건 통과: native 선택/키보드·필수 응답·100점 채점·영상 해금·원본 데이터 불변·Footer 고정·버튼 색상·좁은 폭/긴 문장·크기 안정성. PNG 시각 확인. 기존 전체 프로젝트 lint 및 runtime config deprecation 경고 유지. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시·미배포. 실제 관리자 로그인·API 저장·물리 입력·DPI 검증 미실행. dist 반입 패키지 갱신 없음.

## 2026-10-03-14 — Demo Survey·Quiz Q&A 조합 확장

- 이유: 가로·세로 단일/복수 선택과 짧은/긴 보기의 UI를 세 Demo에서 충분히 확인할 수 있도록 사례 확장.
- 변경: SURVEY 6문항에 세로/가로 복수 선택·짧은/긴 가로 단일 선택 추가. QUIZ 5문항에 가로 단일·세로 복수·선택 주관식 추가, 객관식 4문항 각 25점·총점/통과점수 100 구성. 짧은 한글·긴 한글·긴 영문·공백 없는 문자열 혼합. VIDEO+QUIZ는 확장된 QUIZ를 복제하고 80% 시청 안내 추가. 기존 문항/선택지 ID·데이터 계약·채점/응답 로직 유지.
- 주요 파일: DemoPopupDataService.cs, 설계 21 Demo Q&A. 로컬 검증 소스 Git 제외 유지.
- 검증: WPF 빌드 경고·오류 0, WPF 582건 통과. 세 Demo의 네 조합·주관식·ID 중복 없음, 정답 100점 통과 및 한 문항 오답 75점 미통과, 기존 제출·영상 해금·응답 수집 회귀 확인. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 실제 Demo 물리 입력·다양한 모니터 확인 미실행. 원격 API·배포 갱신 없음.

## 2026-10-03-13 — MultipleChoice Row/Chip 스타일 분기 명확화

- 이유: 세로형 복수선택의 전체 폭 Outline Row 정책과 가로형 Chip 정책을 명시하고 긴 문장 렌더링 정합성 확인.
- 변경: SurveyCheckBoxStyle을 SurveyCheckBoxRowStyle로 명확히 명명하고 HorizontalOptions 분기에서 참조. 공통 Row 컨트롤·Template Border에 Stretch 명시, SingleChoice와 동일 Path·Padding·상태 유지. 기존 Margin·CheckBox 동작·응답 수집·채점·Payload 유지.
- 주요 파일: SurveyStyles.xaml, SurveyPopupView.xaml.cs, 설계 20. 로컬 검증 소스 Git 제외 유지.
- 검증: WPF 빌드 경고·오류 0, WPF 555건 통과. Factory 경로에서 복수선택 VERTICAL DTO의 짧은/긴 문장 전체 폭·Border Stretch·700/380/280 폭 Wrap·체크 중앙/비중첩·선택 높이·모든 OPTION_ID 수집 확인. 세로 복수선택 PNG 생성·시각 확인. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 실제 물리 입력·원격 API 검증 미실행. Demo 원본 배치 데이터·배포 변경 없음.

## 2026-10-03-12 — Survey·Quiz 가로형 복수선택 Chip 시각 통일

- 이유: 가로형 복수선택에 남아 있던 기존 체크박스 Indicator를 제거하고 단일선택 Chip과 시각 규칙 통일.
- 변경: SurveyOptionChipStyle 공통 ToggleButton Template을 RadioButton·CheckBox에서 공유. 복수선택 사각 Indicator·문자 체크 제거, 기존 Chip의 Selected/Hover/Pressed/Focus/Disabled 상태 유지. MaxWidth 계산에서 가로형 CheckBox 아이콘 폭 32 차감 제거. 세로형 우측 Path·단일/복수 선택·필수 검증·점수·Payload 유지.
- 주요 파일: SurveyStyles.xaml, SurveyPopupView.xaml.cs, 설계 20·설문 안내. 검증 소스 Git 제외 유지.
- 검증: WPF 빌드 경고·오류 0, WPF 524건 통과. Demo QUIZ·VIDEO+QUIZ의 Factory 경로에서 기본 glyph 제거·700/280 폭 긴 문장·복수 선택 및 원래 OPTION_ID 수집 확인. QUIZ PNG 생성·시각 확인. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 실제 물리 입력·원격 API 검증 미실행. 배포 갱신 없음.

## 2026-10-03-11 — Survey Submit 버튼 진회색 톤다운

- 이유: Submit의 과한 near-black 대비를 낮추고 설문 UI에 어울리는 무채색 CTA로 조정.
- 변경: SurveyButtonBackgroundBrush #4A4A4F, SurveySubmitHoverBrush #3D3D42, SurveySubmitPressedBrush #303035 적용. 흰 텍스트·SemiBold·Disabled·Focus·버튼 크기/Padding/Radius 유지. Header 닫기는 기존 투명 스타일 유지. 선택지·응답·검증·채점·Payload 변경 없음.
- 주요 파일: SurveyStyles.xaml, 설계 20·설문 안내. Git 제외 로컬 검증 코드 보완.
- 검증: WPF 빌드 경고·오류 0, WPF 496건 통과. 반복 Hover/Pressed/Disabled 전환·Enabled 복귀·Focus 및 크기 안정성 검증. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 물리 입력·모니터 대비 확인 미실행. 검증 프로젝트 Git 제외 유지, 배포 갱신 없음.

## 2026-10-03-10 — Survey 세로 선택지 Outline 및 우측 체크 Path

- 이유: Hover 이전에도 선택 영역을 구분하고, 무채색 체크 명도로 선택 상태를 전달하며 긴 문장 선택 시 레이아웃 흔들림 방지.
- 변경: 세로형 RadioButton·CheckBox 공통 Row Template에 고정 폭 28의 우측 체크 Path 적용. Normal White/#E5E5E5/#D4D4D4, Hover #F5F5F5/#D4D4D4/#A3A3A3, Selected #ECECEC/#AFAFAF/near-black 상태 적용. Padding 16/12·MinHeight 48·BorderThickness 1 유지, Focus는 border 색만 변경. 가로형 Chip Template 유지. 긴 텍스트 MaxWidth에서 체크 공간 확보하고 Normal/SemiBold 높이를 사전 측정해 선택 시 높이 변화 방지. 응답·필수 검증·점수·Payload 변경 없음.
- 주요 파일: SurveyStyles.xaml, SurveyPopupView.xaml.cs, 설계 20·README·설문 안내. 검증 소스는 Git 제외 유지.
- 검증: 최종 WPF 빌드 경고·오류 0, WPF 483건·HTML5 89건 통과. 756/380/280 폭의 체크 중앙·텍스트 비중첩·선택 크기·스크롤 안정성, Hover/Selected/Disabled 체크 명도, 단일/복수 선택·키보드·응답 ID·기존 채점/제출 회귀 확인. 기본·선택·좁은 창 렌더 PNG 확인. 추가 검증에서 발견한 SemiBold 줄바꿈 높이 변동을 수정하고 전체 재검증 통과. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 실제 물리 입력·스크린리더·DPI·원격 API 검증 미실행. 배포 갱신 없음.

## 2026-10-03-09 — Survey 가로·세로 옵션 간격 정합성 수정

- 이유: 가로형 옵션에 아래 Margin이 섞여 마지막 옵션과 세로 배치가 달라 보이고 마지막 오른쪽에 여백이 남는 문제 수정.
- 변경: 단일·복수 선택의 Margin 계산을 GetOptionMargin(horizontal, isLast)로 공통화. 가로형은 오른쪽 8px, 세로형은 아래 8px만 사용하고 마지막 항목은 Margin 0. 기존 스타일 높이·Padding·Selected BorderThickness·WrapPanel·MaxWidth 및 응답 로직 유지.
- 주요 파일: SurveyPopupView.xaml.cs, 설계 20. Git 제외 로컬 검증 코드 보완.
- 검증: WPF 빌드 경고·오류 0, WPF 416건 통과. 네 배치 조합의 동일 높이·실제 8px 간격·마지막 여백 제거, 이미지/설문 선택 전후 높이·BorderThickness 1, 좁은 폭 줄바꿈·선택 배타성·복수 선택·응답 OPTION_ID 검증. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 검증 프로젝트 Git 제외 유지. 실제 물리 입력·다중 행 간격의 주관적 시각 확인 미실행. 가로형 아래 Margin은 요구 규칙대로 0 유지.

## 2026-10-03-08 — Survey 무채색 테마 전환

- 이유: 최종 UI 구조를 유지하며 Survey·Quiz 상태 표현을 White/Gray/Near Black 명암 체계로 통일.
- 변경: Survey 전용 teal 제거. Card #F8F8F8·Hover #F1F1F1·Selected #EAEAEA/#AFAFAF·Focus #737373 적용. 번호·설명·진행 문구 muted gray, 활성 Submit near-black, Disabled 연회색 적용. 선택지·입력·스크롤바를 공통 리소스로 구성. 레이아웃·응답·필수 검증·점수·DTO·Payload 유지.
- 주요 파일: SurveyStyles.xaml, SurveyPopupView.xaml/.cs, PopupWindow.xaml, 설계 20·README·설문 안내.
- 검증: WPF 빌드 경고·오류 0, WPF 동작 362건·HTML5 89건 통과. 상태·긴 문장·좁은 창·고정 Footer·스크롤·Demo/DTO 왕복 회귀 및 렌더 PNG 확인. git diff --check 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 검증 프로젝트 Git 제외 유지. 물리 입력·스크린리더·DPI·실제 원격 API 검증 미실행. dist·배포 갱신 없음.

## 2026-10-03-07 — 설문 약한 그룹 카드 및 선택 Row/Chip 리디자인

- 이유: 비선택 상태의 세로 보기가 입력창처럼 보이는 형태를 정리하고, 문항 구분·선택 강조·키보드 포커스·고정 제출 영역을 동일한 시각 규칙으로 구성.
- 변경: #FAFBFB 배경·radius 11·border/shadow 없음·padding 20/20/20/18·간격 14의 약한 문항 그룹 복원, 문항 Divider 및 상단 설명 Divider 제거. 배경 없는 01 번호·Header 간격 16·입력 간격 14 적용. 세로 선택지는 비선택 배경/테두리를 투명하게 두고 선택 때만 공통 연한 teal 배경·soft teal border·teal text·SemiBold 표시. Chip은 매우 약한 기본 테두리와 흰 배경을 유지하며 동일 선택 토큰 사용. MinHeight 44·자동 높이·긴 한글/공백 없는 영문 Wrap 유지. Hover/Pressed/Focus/Disabled와 FocusVisualStyle 적용, disabled hover 제거·focus padding 보정. RadioButton IsChecked·GroupName·native 접근성·Space 및 Enter 선택 유지.
- 변경(입력/스크롤): TextArea 기본 테두리 약화·focus만 포인트 강조·padding 16/14·placeholder 유지. MinHeight 96 및 MaxHeight 180 이후 내부 스크롤 적용. Footer 진행 텍스트는 subdued gray, 버튼은 높이 46·radius 11 유지. VIDEO+QUIZ는 공통 Footer를 끈 경우에도 내부 제출 영역을 부모 ScrollViewer 밖 하단 Row로 옮겨 고정. 설문 최대폭 760 및 목록 Bottom 여백 20 적용. native ScrollContentPresenter/PART_Track/스크롤 명령을 유지하는 폭 8의 연한 ScrollBar/Thumb, 본문과 gap 10 적용. 스타일 색상·간격·Focus·카드 규칙은 SurveyStyles 공통 리소스로 분리. DTO·서버 모델·응답 저장·필수 검증·점수 계산·제출 JSON 변경 없음.
- 주요 파일: `SurveyStyles.xaml`, `SurveyPopupView.xaml/.cs`, `VideoQuizPopupView.cs`, `PopupWindow.xaml.cs`, 설계 20·README·설문/퀴즈 안내.
- 검증: .NET SDK 10.0.400 WPF 빌드 경고·오류 0, 로컬 WPF 동작 362건 및 HTML5 브리지 89건 통과. 기존 채점·답안·전송 JSON·Demo 회귀, API DTO JSON 왕복 후 Factory의 SURVEY 생성, 756/380/280 폭의 긴 영문·Chip·TextArea 경계, 상태 속성 주입, native 역할/SelectionItem·synthetic Space/Enter 선택·배타성, focus 높이 유지·disabled hover 제거, 실제 Thumb 폭 및 native Drag 이벤트, TextArea 내부 스크롤, 단독/결합 Footer 고정 검증 포함. 비선택·선택 완료·좁은 창 WPF PNG 생성·시각 확인. `git diff --check` 통과. 실패한 후속 검증은 native ScrollBar 명령을 거치도록 입력 주입을 보정하고 TextArea 높이 상한을 적용한 뒤 전체 재검증 통과.
- 상태: 로컬 반영, 미커밋·미푸시. 검증 프로젝트는 Git 제외 유지. PNG는 `.offline-verify/master-volume-build/bin/Popup.BehaviorTests/debug/survey-redesign-default.png`, `survey-redesign-selected.png`, `survey-redesign-narrow.png`. 실제 물리 클릭·Tab/키보드·휠/트랙 클릭·스크린리더·모니터 DPI·원격 API 조회/저장 검증은 미실행으로 상세 TODO에 유지. 기존 변경 유지, dist·반입 패키지·배포 갱신 없음.

## 2026-10-03-06 — 설문 문항 배경 제거 및 Divider 구분

- 이유: 문항을 감싸는 배경·라운드를 제거해 선택지 카드 중심으로 화면 밀도를 정리.
- 변경: 문항의 연회색 배경·CornerRadius·외곽 padding과 번호 배지 배경 제거. 문항 사이에만 1px Divider 및 위아래 합계 20px 간격 적용. 마지막 선택지 아래 여백을 제거해 문항 간 간격 중복 방지. 선택지의 포인트 색·카드 모양·선택/focus 상태는 유지하며 기본 높이 48→42, 세로 padding 12→9로 축소. focus padding도 보정해 높이 변화 방지. 긴 선택지는 자동 줄바꿈·높이 증가 유지. 주관식 입력 스타일과 답안·채점·제출 기능 유지.
- 주요 파일: `SurveyPopupView.xaml.cs`, `SurveyStyles.xaml`, 설계 20·README.
- 검증: WPF 빌드 경고·오류 0, 로컬 전용 WPF 동작 318건 통과. 기존 레이아웃 확인을 배경·라운드 제거 및 Divider·간격 기준으로 갱신. 실제 WPF 렌더 PNG를 재생성·시각 확인. `git diff --check` 통과. 물리 마우스·키보드 및 모니터 DPI 검증 미실행.
- 상태: 로컬 반영, 미커밋·미푸시. 검증 프로젝트 Git 제외 유지, 앞선 변경 유지. dist·반입 패키지 갱신 없음.

## 2026-10-03-05 — SURVEY·QUIZ 카드/Chip UI 및 필수 응답 진행 상태

- 이유: 긴 답변·가로형 짧은 보기·주관식 입력을 같은 시각 체계로 정리하고 필수 응답 완료 여부를 제출 전에 확인할 수 있도록 UI 개선.
- 변경: 설문 전용 스타일에서 틸 #0F766E를 선택·포커스·제출에 적용. 단일 선택은 RadioButton IsChecked·GroupName을 유지하며 원형/체크 아이콘 없이 전체 클릭 가능한 카드·가로 Choice Chip으로 렌더링. 배경·테두리·SemiBold로 선택 상태 구분, hover·focus·disabled 스타일 적용. 긴 문장의 줄바꿈·높이 증가·폭 방어·padding·줄 간격 반영. 복수 선택은 기존 CheckBox 기능 유지. 문항 테두리 제거·연한 배경·radius 14·padding 20·간격 20, 01 번호 배지·제목 25·문항 제목 16 적용. 주관식 radius 10·포인트 focus·placeholder 적용하며 안내를 답안으로 넣지 않음.
- 변경(제출): 기존 답안 수집 결과로 필수 완료/전체 수를 표시하고 미응답·공백·입력 삭제 및 영상 퀴즈 잠금에 맞춰 내부/공통 Footer 제출 버튼을 활성·비활성화. 높이 46·radius 11의 전용 제출 버튼 적용. 공통 Footer 사용 시 내부 안내·버튼 영역 숨김, Footer 높이는 Auto로 응답 상태·숨김 체크박스 줄바꿈에 대응. 기존 필수 응답 검증·점수 계산·제출 이벤트 데이터 구조 유지. 단일·복수 선택에서 Enter 선택 처리 및 자동화 이름 제공, 기존 native 접근성 역할·키보드 기능 유지.
- 주요 파일: `SurveyStyles.xaml`, `SurveyPopupView.xaml/.cs`, `PopupWindow.xaml/.cs`, `docs/design/20_SURVEY_QUIZ_UI_개선_TODO.md`, README·설문/퀴즈 안내. 로컬 Git 제외 검증 프로젝트에서 후속 UI 검증 추가.
- 검증: WPF 빌드 경고·오류 0, 기존 채점·제출·VIDEO+QUIZ 스크롤·시청 정책을 포함한 WPF 동작 318건 및 HTML5 브리지 89건 통과. 필수 응답 진행·Footer 활성·optional TextBox·공백/삭제·마지막 복수 선택 해제·영상 잠금·Radio 배타성·native 접근성 역할/SelectionItem·glyph 제거·620/300 폭의 긴 문장·Chip·선택 스타일·placeholder 검증 포함. WPF RenderTargetBitmap으로 응답 완료 및 미완료 화면 PNG를 생성·시각 확인. `git diff --check` 통과. 실제 물리 Tab/Space/Enter/방향키·전체 카드 클릭·스크린리더·모니터 DPI 검증은 미실행.
- 상태: 로컬 반영, 미커밋·미푸시. 검증 프로젝트는 Git 제외 유지. PNG는 `.offline-verify/master-volume-build/bin/Popup.BehaviorTests/debug/survey-card-preview.png` 및 `survey-card-incomplete-preview.png`에 생성. 기존 시스템 볼륨·전체화면 숨김·검증 프로젝트 Git 제외 변경 유지. dist·반입 패키지·배포 갱신 없음.

## 2026-10-03-04 — SURVEY·QUIZ 선택지 흑백 하이라이트

- 이유: 설문·퀴즈 선택지의 파란 강조색을 검은색 기본 강조와 회색 명암으로 통일.
- 변경: 공통 RadioButton·CheckBox의 기본 테두리를 회색 #737373, hover 테두리를 진회색 #404040·배경을 #F5F5F5, 선택 배경을 #E5E5E5·표시색을 #171717로 변경. 단일 선택 점·다중 선택 체크는 동일한 검정 계열을 사용하고 비활성 상태는 기존 불투명도 0.45 유지. 같은 SurveyPopupView를 쓰는 SURVEY·QUIZ·VIDEO+QUIZ에 공통 적용.
- 주요 파일: `popup-frameWork/Popup/Views/Windows/PopupStyles.xaml`.
- 검증: .NET SDK 10.0.400 WPF 빌드 경고·오류 0. 두 선택지 템플릿의 파란 색상 제거 및 기본/hover/선택 명암 구분 확인. `git diff --check` 통과. 실제 마우스 조작·GUI 시각 확인은 미실행.
- 상태: 로컬 반영, 미커밋·미푸시. 앞선 시스템 볼륨·전체화면 숨김·검증 프로젝트 Git 제외 변경 유지. dist·반입 패키지 갱신 없음.

## 2026-10-03-03 — VIDEO 전체화면 컨트롤 2초 자동 숨김

- 이유: 영상 전체화면에서 마우스가 영상 위에 머무를 때 컨트롤 자동 숨김 대기시간 단축.
- 변경: 컨트롤 표시·타이머 재예약 시 영상 전체화면은 2초, 일반 화면은 3초로 설정. 전체화면 진입·복귀와 마우스 이동 시 현재 모드의 시간을 적용. 일시정지·Seek·마우스/키보드 조작 중 표시 유지 및 마우스 이탈 즉시 숨김은 유지. 관련 인터페이스·옵션 안내·README·설계 19와 Word/PDF 갱신.
- 주요 파일: `popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs`, `docs/design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md`, 인터페이스 정의서·옵션 안내·README.
- 검증: .NET SDK 10.0.400 WPF 빌드 경고·오류 0. 전체화면 진입·복귀에서 공통 컨트롤 표시 메서드를 호출하는 경로 확인. Word 실제 열기·목차 갱신·PDF 출력 성공(43쪽). `git diff --check` 통과. 실제 마우스 hover·2초 경과·전체화면 왕복 GUI 확인은 미실행.
- 상태: 로컬 반영, 미커밋·미푸시. 앞선 검증 프로젝트 Git 제외 및 시스템 볼륨 수정 유지. dist·반입 패키지 갱신 없음.

## 2026-10-03-02 — WPF 검증 프로젝트 Git 추적 제외

- 이유: 개발용 독립 검증 프로젝트를 제품 소스·반입 대상과 분리하고 저장소 구성을 정리.
- 변경: `Popup.BehaviorTests`·`Popup.RecoveryTests`의 추적 파일 5개를 Git 인덱스에서 제거하고 `.gitignore`에서 두 디렉터리 전체 제외. 최신 로컬 검증 소스와 빌드 결과는 유지. README·결합 화면 안내에서 저장소에 없는 프로젝트 실행 명령을 제거하고 설계·리뷰 문서에는 검증 당시 기록임을 명시. 기존 검증 결과·변경 이력은 유지.
- 주요 파일: `.gitignore`, `popup-frameWork/README.md`, `Popup/Docs/FOOTER_LINK_VIDEO_QUIZ.md`, 설계 19·20261002 리뷰 문서, Git 인덱스의 검증 프로젝트 파일 5개.
- 검증: 솔루션은 기존부터 Popup·MockSso만 참조하며 검증 프로젝트 참조 없음. Git 추적 파일 0개·디렉터리 제외 규칙 적용·로컬 파일 5개 보존 확인. `git diff --check` 및 인덱스 변경 공백 검사 통과. 실행 코드 변경 없음으로 추가 빌드·테스트는 실행하지 않음.
- 상태: 로컬 정리 완료, 검증 프로젝트 삭제는 스테이징 상태. 미커밋·미푸시. 앞선 시스템 볼륨 구현·문서 변경과 기존 `MockSso/Properties/`는 유지. 기존 반입 패키지·dist 재생성 없음.

## 2026-10-03-01 — VIDEO Windows 시스템 볼륨 동기화 및 추가 변경 정합성 보완

- 이유: 설계 19 §9.8의 시스템 볼륨 0·Mute 상태에서도 플레이어에서 음량을 조절할 수 있도록 양방향 동기화 구현. 기존 Overlay 변경 이후 인터페이스·옵션 문서에 남은 고정 컨트롤 행 설명과 상태 기록의 불일치 해소.
- 변경: 외부 NuGet 없이 Core Audio COM 직접 연동. 기본 멀티미디어 출력 장치의 Master Volume/Mute 초기 조회·변경·외부 이벤트 수신, Dispatcher에서 COM 소유·해제, 2초 주기의 기본 장치 변경·연결 복구 적용. 로컬/HTML5 내부 음량을 1.0으로 유지해 이중 감쇠 방지. 슬라이더 증가 시 시스템 Mute 해제, 음소거 시 음량 값 유지. 장치 없음·연결 실패 시 내부 음량으로 전환하고 새 장치 연결 시 현재 Windows 값을 채택. 실패한 쓰기는 실제 상태로 UI 복원. 종료 시 콜백·타이머·COM 정리하며 시스템 값 복원 없음. YouTube는 기존 자체 플레이어 유지.
- 변경(문서): defaultVolume을 시스템 연결 전/실패 시 초기값으로 명시하고, Overlay·자동 숨김·시스템 음량 정책을 인터페이스 정의서·최소 정의서·옵션 안내·결합 화면 안내·README·설계 07/19에 반영. 설계 19의 중복 §9.9 번호와 이미 푸시된 Overlay의 미커밋 표기 수정. TODO는 자동 검증과 실제 장치 조작 검증을 분리. JSON 필드·ENUM 변경 없이 v3.5 유지, Word 생성 기준일 갱신 및 DOCX/PDF 재생성.
- 주요 파일: `popup-frameWork/Popup/Services/WindowsMasterVolume.cs`, `Views/Contents/VideoPopupView.xaml.cs`, `Popup.BehaviorTests/Program.cs`, `video-controls.test.cjs`, `docs/design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md`, 인터페이스 정의서·옵션 안내·README, `scripts/export-interface-word.cjs`.
- 검증: .NET SDK 10.0.400에서 WPF 빌드 경고·오류 0, WPF 동작 292건·생성 HTML5 브리지 89건 통과. 시스템 초기 0·Mute·슬라이더/음소거·외부 알림 쓰기 루프 방지·실패한 쓰기의 UI 복원·장치 없음/복구·내부 unity gain·종료 후 늦은 이벤트 무시·최종 설정 미복원 검증 포함. 실제 Core Audio 초기 조회 성공(Windows 설정 변경 없이 읽기만 수행). 설치된 Word에서 실제 열기·목차 갱신·PDF 출력 성공(43쪽), DOCX XML/rels 파싱 및 시스템 볼륨·Overlay·기준일 문구 확인. `git diff --check` 통과. 격리 산출물은 `.offline-verify/master-volume-build/`에 생성. 기존 오프라인 NuGet 소스 부재로 이번 복원만 공식 NuGet 소스를 지정했으며 SDK/NuGet 설정 파일은 유지.
- 상태: 로컬 코드·문서 수정 완료, 미커밋·미푸시. 실제 Windows 볼륨 쓰기·외부 변경 알림·물리 출력 장치 교체·BackgroundOverlay에서 오디오 출력·전체화면 왕복·물리 입력·Runtime 134·원격 DB 검증 미실행. PDF 전체 페이지 시각 검토 미실행. dist·반입 패키지·배포 갱신 없음. 기존 미추적 `MockSso/Properties/` 유지. 자동 업데이트 설계 17의 P3 미착수 및 기존 수동/통합 검증 대기 상태 유지.

## 2026-10-02-05 — WPF framework 소스 반입 패키지 생성

- 이유: VIDEO Overlay·hover 수정이 반영된 framework 소스를 폐쇄망 저장소에 전달하기 위한 소스 전용 묶음 생성.
- 변경: origin/main 푸시 완료한 eaafad1 기준으로 추적 중인 popup-frameWork 파일 85개를 원본 경로 유지 ZIP 및 source 폴더로 추출. bin/obj/publish/dist·EXE/DLL/PDB·미커밋 데모 데이터/영상·서버/웹·SDK/NuGet 묶음 제외. 내장 리소스로 필요한 커밋된 데모 이미지·영상 포함. MANIFEST·SHA256SUMS·반입 안내 생성.
- 주요 파일: `offline-export/20261002-wpf-source/popup-framework-source-20261002.zip`(9,847,367 bytes), `source/popup-frameWork/`, `MANIFEST.txt`, `SHA256SUMS.txt`, `README-IMPORT.md`(Git 제외).
- 검증: Git 트리와 ZIP 파일 수 85개 일치, framework 외 경로·빌드 출력·실행 바이너리 0건. 추출된 XML/JSON 파싱 및 Overlay/hover 소스 포함 확인. SHA256 F53AD4924C45743BAAC603DFB452B844ECD9C6A2E8301D0485363A3F3ED65132. 실행 파일 생성·폐쇄망 빌드·배포는 수행하지 않음.
- 상태: 소스 묶음 생성 완료. 산출물은 Git 제외이며 변경 이력만 커밋·푸시 대상으로 정리. Windows SDK NuGet 의존성 재수집 및 Runtime 134 검증은 남아 있고 소스 묶음에 SDK/NuGet 바이너리는 포함하지 않음. 별도 SDK/NuGet 설정·미디어·데모 데이터·서버 로컬 설정·IDE 변경 유지.
## 2026-10-02-04 — VIDEO 공통 Overlay 및 자동 숨김 구현

- 이유: 설계 19 §9의 영상 위 컨트롤·중앙 재생 상태·로딩 피드백 요구사항 반영.
- 변경: 컨트롤 전용 행 제거, 로컬/URL 공통 WPF Overlay·영상 클릭 입력·700ms Play/Pause 피드백·중앙 Spinner 적용. 재생 중 3초 자동 숨김과 입력 시 재표시, Pause·Seek·마우스/키보드 조작 중 표시 유지, 종료 시 타이머 정리. HTML5 buffered 구간을 진행바에 표시하고 시청시간 계산과 분리. 전체화면은 동일 VideoContainer·Overlay를 이동해 재사용. YouTube 자체 플레이어 및 기존 옵션 정책 유지.
- 변경(의존성): 현행 WebView2 SDK의 CompositionControl로 HWND 겹침을 해소. 실제 초기화에 필요한 Windows SDK 런타임을 포함하도록 Popup·동작 검증 프로젝트를 net10.0-windows10.0.17763.0으로 변경. WebView2 패키지 버전 유지, 폐쇄망 의존성 재수집 필요 사항을 README에 기록.
- 주요 파일: `VideoPopupView.xaml/.cs`, `Popup.csproj`, `Popup.BehaviorTests/Popup.BehaviorTests.csproj`, `Program.cs`, `video-controls.test.cjs`, 설계 19, WPF README.
- 검증: Windows WPF 동작 245건·HTML5 64건 통과. 실제 MediaElement/WebView2 Runtime 154.0.4258.48·로컬 HTTP 자동 검증 37건 통과(자동 재생·지연 로딩·오류·이벤트 주입 Buffering·영상 클릭·3초 숨김·중앙 피드백 제거·Pause 표시 유지·Overlay 배치). 로컬/URL PNG를 렌더링·시각 확인해 영상 위 WPF 컨트롤 표시 확인. 기존 VIDEO+QUIZ 단일 스크롤·높이·잠금·시청시간 검증 유지. `git diff --check` 통과.
- 후속(hover 반응): 영상 MouseEnter 즉시 표시·MouseLeave 즉시 숨김 적용. 영상 내부 3초 무입력 정책 유지, Pause·Seek·마우스/키보드 조작 중 이탈은 표시 유지. 영상 밖에서 조작·키보드 포커스가 끝나면 즉시 숨김. 진입/이탈·Pause·드래그 유지 회귀 검증을 추가해 WPF 동작 253건 통과. 실제 물리 hover 입력 검증은 미실행.
- 상태: VIDEO Overlay·hover 수정은 ae4d017로 커밋하고 원격 문서를 통합한 eaafad1까지 origin/main 푸시 완료. 실제 전체화면 왕복·물리 입력·모니터 DPI·Runtime 134·YouTube·사용 서버 URL 미실행. Windows SDK 패키지 반입·dist·반입 묶음·배포 갱신 없음. 기존 SDK/NuGet·미디어·데모 데이터 별도 변경 유지.
## 2026-10-02-03 — URL 영상 자동 재생 및 로딩 안내 보완

- 이유: URL 영상에서 클릭 전 자동 재생이 원활하지 않은 현상과 영상 준비 중 안내가 조기에 사라지는 흐름을 보완.
- 변경: 영상 전용 WebView2 프로필의 자동 재생 정책 지정, HTML5 preload·canplay 시 1회 재생 요청 추가. 초기 로딩·버퍼링에 불확정 ProgressBar 및 안내 표시. 페이지 탐색 완료·메타데이터·음량 변경 시 로딩 유지, 실제 재생 준비/시작 시 해제. 정책 거절·실제 오류·재생 취소 구분, 수동 pause·autoPlay=false 유지. 자동 검증에 로딩 상태·정책 거절·재생 오류·자동 재생 1회 실행 추가.
- 주요 파일: `VideoPopupView.xaml/.cs`, `Popup.BehaviorTests/Program.cs`, `video-controls.test.cjs`, 설계 19.
- 검증: Windows WPF 동작 223건, 생성 HTML5 브리지 60건 통과. 임시 로컬 HTTP 서버와 실제 WebView2 Runtime 154.0.4258.48에서 20건 통과(응답 지연 중 안내, 소리 유지·클릭 없는 자동 재생, 자동 재생 끔·WPF 재생, pause 유지, 브라우저 버퍼링 이벤트 및 음량 변경·재개 표시, 실제 HTTP 404 오류). `git diff --check` 통과. 실제 사용 서버 URL·물리 네트워크 버퍼링·Runtime 134·YouTube 미실행.
- 상태: URL 영상 자동 재생·로딩 안내 및 검증 기록을 main 커밋·origin/main 푸시 대상으로 정리. 개발용 자동 재생 플래그는 프로토타입에 적용하며 정식 배포 전 대상 Runtime 정책 검토 필요. 기존 SDK/NuGet·미디어·데모 데이터 변경 유지. 기존 실행 앱·dist·반입 패키지·배포 변경 없음.
## 2026-10-02-02 — 설계 19 Windows 후속 검증 및 VIDEO 빌드 오류 수정

- 이유: 설계 19의 Windows 렌더링·HTML5 브리지 미실행 항목을 검증하고 실제 환경 확인과 자동 검증 범위를 구분.
- 변경: VIDEO 제목의 중복 Margin 제거(MC3000 해결). 현행 외곽 반경 16·두께 1에 맞춰 Clip 테스트 기대값을 15.5로 정정하고 주석 보완. 설계 19에 자동 검증 완료와 실제 GUI·네트워크·DB 미완료를 분리 기록.
- 주요 파일: `VideoPopupView.xaml`, `PopupWindow.xaml.cs`, `Popup.BehaviorTests/Program.cs`, `docs/design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md`.
- 검증: Windows SDK 10.0.401·임시 artifacts 경로에서 WPF 빌드 및 동작 213건, HTML5 브리지 42건, 복구/HTTP/인증/큐 122건 통과. 4종 크기 모드·리사이즈·4종 렌더 DPI 및 결합 스크롤 포함. `git diff --check` 통과. SDK 고정·폐쇄망 설정 변경 없음. 오프라인 NuGet 폴더 부재로 이번 실행만 공식 소스 지정. 삭제된 데모 미디어는 HEAD에서 임시 테스트 출력에만 복사.
- 상태: 설계 19 후속 수정과 검증 기록은 edaef84로 커밋. 원격 b2f3ee0의 동일 Margin 수정은 속성 순서 차이만 있어 단일 Margin 형태로 병합하고 origin/main 푸시 대상으로 정리. 실제 영상 디코딩·GUI 입력·모니터 DPI·네트워크 재연결·서버 재기동 미실행. DB 검증 환경변수 부재로 원격 개발 DB 미실행. 검증 당시 미디어 삭제 상태를 유지했으며 별도 SDK/NuGet·미디어·데모 데이터 변경은 이번 커밋에서 제외. dist·반입 패키지·배포 변경 없음.
## 2026-10-02-01 — 공통 외곽 Clip 및 polling 장애 복구 구현

- 이유: 설계 19 §6·§7의 FILL 모서리 넘침, 통신 실패 시 장시간 조회 공백, 426 안내 후 에이전트 계속 실행을 현행 조회·인증·결과 큐 정책과 맞춰 보완.
- 변경: 공통 본문 Grid에 테두리 안쪽 반경(일반 11.5 / 전체화면 0) Clip 적용. 단일 조회 타이머/gate에서 10초×3회×5 Cycle, Cycle 사이 30분 휴식 후 첫 10초, 이후 60분 복구 구현. 400/403·최종 401 제외, 복구 성공 시 최신 서버 주기/기동 기준 복귀. 로그인 통신 오류 전파 및 정기 로그인 실패 후 주기 유지. 목록/결과/로그인 426 시 모든 추가 통신·정기 인증 중단, 안내 닫기 후 트레이와 같은 정상 종료, pending 파일 및 로컬 저장 유지. HTTP·인증 취소 토큰 전달.
- 주요 파일: `MainWindow.xaml.cs`, `App.xaml.cs`, `PopupPollingRecovery.cs`, `PopupApiService.cs`, `PopupResultQueue.cs`, `SsoAuthHeaderProvider.cs`, `WpfLoginClient.cs`, `PopupWindow.xaml/.cs`, `Popup.RecoveryTests`, `Popup.BehaviorTests/Program.cs`, 설계 19·인터페이스 정의서·README·줄별 설명.
- 검증: 임시 .NET SDK 10.0.100에서 WPF/동작 테스트 cross-target 빌드 경고 0·오류 0, 실제 복구/HTTP/인증/큐 코드 자동 검증 122건 통과. `global.json`의 10.0.400 및 폐쇄망 NuGet 설정 유지. Windows Clip 테스트는 추가·컴파일했지만 실행 미완료. HTML5 브리지 테스트는 WPF 생성 HTML 부재(ENOENT)로 실행 못 함. 실제 DPI/GUI/WebView2/서버·DB·사내 SSO 검증 미실행.
- 상태: main 커밋·origin/main 푸시 대상으로 구현/문서 정리. 실제 푸시 결과는 커밋 생성 이후 보고. dist·반입 패키지·Word/PDF 재생성 없음. 자동 업데이트 §17은 착수 보류 유지.

## 2026-09-30-06 — 제출 버튼 통일 및 제출 안내 UI 정리

- 이유: VIDEO+QUIZ 하단 닫기를 퀴즈 제출로 오인하는 흐름을 해소하고, 단독 설문·퀴즈와 제출 동작·버튼 디자인을 통일.
- 변경: SURVEY·QUIZ·VIDEO+QUIZ 하단 버튼을 제출로 연결하고, 푸터가 있으면 내부 버튼을 숨겨 제출 버튼 하나만 표시. 푸터 미표시 시 내부 제출 유지, 닫기 숨김 옵션과 제출 버튼 구분. 영상 잠금·필수 응답 검증·로컬 채점·통과 시 저장·전송 순서를 유지하고 바로가기 설정은 검증/통과 후 실행. 헤더 X·Alt+F4는 별도 종료 경로 유지. 흰 바탕·검은 테두리·둥근 모서리의 공통 버튼 및 채점·미응답·저장 오류 모달 적용. 관련 안내·인터페이스 정의서 및 Word/PDF 갱신.
- 주요 파일: `PopupWindow.xaml/.cs`, `SurveyPopupView.xaml/.cs`, `PopupManager.cs`, `PopupStyles.xaml`, `PopupAlert.cs`, `Popup.BehaviorTests/Program.cs`, 인터페이스 정의서 및 WPF 가이드.
- 검증: 별도 출력 경로에서 WPF 동작 검증 143건 통과(기존 Debug 실행 파일이 실행 중으로 잠김). 단독/결합 모드 및 푸터 표시/닫기 표시 조합의 단일 제출·실제 답안 수집·채점, 영상 잠금 경계, 모달 레이아웃·Enter/Escape 설정 검증. 안내창을 WPF 비트맵으로 렌더링해 시각 확인. Word에서 목차 갱신·PDF 재출력 성공(42쪽). 실제 GUI 클릭·영상 디코딩은 미실행.
- 상태: 문서 후속 수정·점수 로그 검증과 함께 main 커밋 및 origin/main 푸시 대상으로 정리. 실행 중인 기존 앱은 종료하거나 교체하지 않음.

## 2026-09-30-05 — DemoWindow 퀴즈 점수 반환·로그 검증

- 이유: VIDEO+QUIZ 제출 후 점수 반환과 DemoWindow 로그 표시 경로를 단독 QUIZ와 비교할 필요.
- 변경: 실제 DemoPopupGateway 및 DemoWindow 이벤트 처리기를 연결해 결합·단독 퀴즈의 응답 totalScore/passed, 요청 score/passed 로그, 응답 로그, 화면 점수 요약을 검증하는 8개 확인 추가. 실행 코드 변경 없음.
- 주요 파일: `popup-frameWork/Popup.BehaviorTests/Program.cs`.
- 검증: 전체 동작 검증 105건 통과. 두 모드 모두 점수 100·통과 true가 응답 및 로그에 유지됨. 실제 영상 재생·수동 제출 증상은 미재현. 조사 시 실행 중인 Popup.exe 프로세스 없음.
- 상태: 제출 UI 변경과 함께 main 커밋 및 origin/main 푸시 대상으로 정리.

## 2026-09-30-04 — WPF 조회 주기 및 VIDEO 공통 UI 구현

- 이유: 서버 기준 표시 대상 정책에 맞춰 조회 주기를 30~60분으로 제한하고, 로컬/URL 영상의 조작 UI 및 동영상+퀴즈 이중 스크롤을 통일.
- 변경: 서버 `custom.wpf-popup.polling-interval-seconds`가 조회 주기를 소유하고 응답·WPF fallback을 1800~3600초로 제한. 로그인 직후 최초 조회 경로를 유지하고 `Stopwatch` 경과시간으로 기동 기준 조회 경계를 계산해 응답 지연·PC 시계 변경에 따른 주기 이동을 방지. 열린 팝업도 조회하며 기존 ID 중복 제거 후 새 목록을 표시 큐에 합류. 단일 타이머·조회 gate 및 426/종료 이후 재시작·늦은 응답 표시 차단. 서버 SQL의 활성·기간·대상·숨김·완료 판단은 기존 구현과 정합성을 확인해 유지.
- 변경(UI): 로컬 MediaElement와 HTTP/HTTPS HTML5 영상이 동일한 고정 WPF 컨트롤 행을 사용. WebView2 HWND와 컨트롤 영역을 분리하고 Chromium 기본 controls·자동 숨김 타이머 제거. 공통 재생·일시정지·탐색·음량/음소거·배속·전체화면 명령, WebView 메시지 상태 동기화 및 버퍼링 안내 적용. 탐색 구간 시청시간 합산 방지, 배속 변경 금지 시 HTML5 1.0배 유지, URL 쿼리의 HTML 속성 인코딩 보완. YouTube iframe은 기존 별도 플레이어 정책 유지.
- 변경(스크롤): VIDEO+QUIZ 결합 모드에서 내부 SurveyPopupView ScrollViewer를 실제 계층에서 제거하고 고정 문항 높이를 Auto로 변경. 영상·전체 문항·제출 영역을 부모 단일 스크롤에 배치하고 공통 푸터는 창 하단에 유지. 단독 SURVEY/QUIZ 자체 스크롤 유지. 현재 계약에 VIDEO+SURVEY 모드가 없음을 확인. TODO·인터페이스 조회 정책·WPF README·영상+퀴즈 안내 갱신.
- 주요 파일: `popup-frameWork/Popup/MainWindow.xaml.cs`, `Views/Contents/VideoPopupView.xaml/.cs`, `VideoQuizPopupView.cs`, `SurveyPopupView.xaml/.cs`, `Popup.BehaviorTests/Program.cs`, `Popup.BehaviorTests/video-controls.test.cjs`, `zero-rule-server/base/src/main/java/server/base/props/WpfPopupProps.java`, `WpfPopupServiceTest.java`, `docs/design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md`.
- 검증: WPF 빌드 경고·오류 0, 동작 검증 97건 통과(50문항·3종 viewport의 끝까지 스크롤 및 잠금 해제 높이 유지, 조회 경계, URL 상태·시청시간 포함). 실제 생성 HTML의 JavaScript를 영상/WebView 브리지 테스트 더블로 실행해 42건 통과. Gradle offline `:service:core:test --tests server.service.core.popup.wpf.WpfPopupServiceTest` 5개 테스트 통과. `git diff --check` 통과. 401 흐름은 단일 타이머·조회 gate·인증 재시도 경로 코드 점검. 실제 GUI·디코딩·전체화면 왕복·물리 입력 및 원격 개발 DB의 완료/숨김 후 HTTP 재조회는 미실행.
- 후속 문서: 설계 02·03·06·07·09, 전체/최소 인터페이스 정의서, 옵션·사용자 가이드, 웹 미리보기 정합성 문서를 현재 조회·VIDEO 컨트롤·결합 스크롤 동작에 맞춰 보완. JSON 계약 변경이 없어 v3.5 유지. Word 생성 스크립트 기준일 갱신 후 DOCX/PDF 재생성.
- 후속 검증: Word에서 실제 열기·목차 갱신·PDF 출력 성공(41쪽). DOCX XML/rels 15개 파싱 성공 및 고정 WPF 컨트롤바·30~60분·부모 단일 스크롤·기동 기준 문구 포함 확인. 전체 PDF 시각 검토는 미실행.
- 상태: 구현은 `944bf7b`로 origin/main 푸시 완료. 후속 문서 수정은 제출 UI 변경과 함께 main 커밋 및 푸시 대상으로 정리. 커밋 전 WPF 97건·HTML5 브리지 42건 재검증 통과, 서버 서비스 테스트는 Gradle `--rerun-tasks`로 재실행. 배포용 dist·반입 패키지·관리자 UI·DDL 갱신 없음. 실제 GUI·원격 DB 확인 항목은 TODO에 미완료로 유지.

## 2026-09-30-03 — 20260930 반입 폴더 전체 TGZ 압축

- 이유: 현재 반입 폴더 전체를 단일 파일로 전달하기 위한 압축본 생성.
- 변경: `offline-export/20260930/`의 현재 내용 전체(하위 폴더, 기존 tar, 안내·목록 파일)를 최상위 `20260930/` 경로를 유지해 `offline-export/20260930.tgz`로 압축. 원본 폴더 변경 및 최신 소스·문서 재수집은 수행하지 않음.
- 주요 파일: `offline-export/20260930.tgz`(20,630,341 bytes, Git 제외).
- 검증: tar 생성·전체 목록 읽기 성공, 원본 파일 수와 압축 내 파일 수 233개 일치.
- 상태: 로컬 압축본 생성 완료. 미커밋·미푸시.

## 2026-09-30-02 — Word 인터페이스 정의서 v3.5 최신화

- 이유: Word 정의서가 2026-09-22 v2.0에 남아 있어 최신 Markdown 계약 및 구현과 정합성 보완.
- 변경: 최신 `POPUP_INTERFACE_SPEC.md` v3.5 전체를 Word 본문으로 반영. 필수 여부·Default 표, IMAGE ORIGINAL, 푸터 바로가기, 동영상+퀴즈, 결과 JSON을 포함. 관리자 API 6개 및 구 WPF API 제거 현황을 부록 A, 최소 기능 정의서를 부록 B로 정리. 기존 링크 유지를 위해 파일명은 유지하고 문서 내부 버전·기준일 갱신. 외부 패키지 없이 재생성하는 PowerShell 스크립트 추가.
- 주요 파일: `docs/interfaces/WPF_Popup_API_Interface_v2.0.docx`, `scripts/export-interface-word.ps1`.
- 검증: 생성 스크립트 실행 성공. DOCX 내부 XML·관계 파일 17개 파싱, Word 표 27개 확인. 계약서와 최소 기능 정의서의 전체 비어 있지 않은 본문·표 셀을 Word 추출 텍스트와 대조해 누락 0건. `git diff --check` 통과. Word 앱에서 실제 페이지 배치 확인은 미실행.
- 상태: 로컬 문서 갱신, 미커밋·미푸시. 기존 Word 잠금 파일 삭제 상태는 유지. 기존 반입 패키지는 재생성하지 않음.
- 후속(Word 가독성 재편집): 단순 Markdown 전사 방식의 가독성을 보완해 표지·읽는 순서·클릭 가능한 자동 목차·머리말·페이지 번호·제목 계층을 구성. 5열 필드 표를 `필드/형식 · 필수/기본값 · 설명`의 3열로 재편하고 열 너비·셀 여백·교차 음영·반복 머리글·행 분할 방지를 적용. JSON은 고정폭 글꼴과 구문 색상으로 구분하고 불필요한 강제 페이지 구분을 제거. 생성기는 Node 표준 라이브러리 기반 `scripts/export-interface-word.cjs`로 교체하고 기존 PowerShell 진입점 유지.
- 후속 산출물: 기존 파일의 잠금으로 최종 편집본은 `docs/interfaces/WPF_Popup_API_Interface_v3.5.docx`로 저장. 동일 문서의 PDF도 함께 제공(`WPF_Popup_API_Interface_v3.5.pdf`).
- 후속 검증: 설치된 Word 2013에서 실제 열기·목차 갱신·저장·PDF 출력 성공(최종 40쪽). PDF 전체 페이지 이미지 생성 및 표지·목차·주요 필드 표·유형별 예제의 시각 검토 수행. 최종 DOCX의 XML 파싱 및 원문 본문·표 셀 대조 누락 0건, 표 28개 확인. 초기 PowerShell COM 연결 오류는 VBScript 자동화로 해결. 미커밋·미푸시·기존 반입 패키지 미갱신.

## 2026-09-30-01 — 폐쇄망 반입 패키지 20260930 생성

- 이유: 20260928 반입 이후 추가된 푸터 바로가기, 동영상+퀴즈, IMAGE ORIGINAL, 퀴즈 점수 전송, DemoWindow 보완, 계약서 v3.5·최소 기능 정의서를 폐쇄망에 반입하기 위한 패키지 생성. VS Code 확장·.NET SDK·NuGet 패키지는 신규 의존성이 없어 제외(20260922 반입분 사용).
- 생성: `scripts/export-offline-package.ps1 -IncludeMockSso -NoZip`(커밋 `5b58e59`, main 기준)로 묶음을 만든 뒤 20260928과 같은 구성으로 정리 — `1-zero-rule-server`(88: A 81·M 7)·`2-zero-rule-web`(9: A 1·M 8, D 1)·`3-popup-frameWork`(78, MockSso 포함)·`4-docs`(46) 폴더와 tar, `MANIFEST-*`, `SHA256SUMS.txt`, `README-IMPORT.md`, `DELETE-SINCE-20260928.txt`, 최종 `popup-offline-20260930.tgz`.
- 제외: 커밋 `b42613d`에 함께 들어간 Word 임시 잠금 파일 `docs/interfaces/~$F_Popup_API_Interface_v2.0.docx`가 4-docs에 복사되어 패키지와 MANIFEST에서 제거. 저장소의 해당 파일은 그대로 둠.
- 삭제 목록: 20260928 MANIFEST 대비 사라진 파일 0건이라 `DELETE-SINCE-20260928.txt`는 빈 목록으로 두고, 20260922 삭제 목록 미적용 시 먼저 적용하도록 README에 안내. DB는 20260928 이후 DDL 변경이 없어 신규 구축 순서를 그대로 유지하고, 계약서 3.5 동시 배포 조건과 `appsettings.json`의 `DemoMode` 기본값 `true` 변경(서버 연계 시 `false`)을 README에 기재.
- 위치: `offline-export/20260930/`(저장소 루트, git 제외 경로).
- 검증: tgz를 임시 폴더에 풀어 항목 11개 확인, tar 4개 SHA256 일치, 신규 파일(`VideoQuizPopupView.cs`, `WPF_POPUP_MINIMAL_SPEC.md`, `PopupActionOptionsTest.java`)과 최신 ORIGINAL Canvas 정리 반영 확인, WPF 묶음 exe/dll/pdb·bin/obj·개인 PC 절대경로·`~$` 임시 파일 0건, 4-docs CHANGELOG에 병합 충돌 표시 0건. `Popup.csproj`를 참조하는 임시 콘솔(저장소 외부)에서 `DemoPopupDataService` 팝업 7종을 실제 `PopupFactory.Create`로 변환해 모두 성공. 화면 표시(`Popup.exe --demo`)와 폐쇄망 빌드(`build-wpf-offline.ps1`)는 미실행.
- 상태: 반입 패키지는 `.gitignore` 대상이라 저장소에 포함되지 않음. 이 변경 이력만 main 커밋·푸시.

## 2026-09-29-07 — IMAGE ORIGINAL 레이아웃 정합성 점검

- 이유: ORIGINAL의 Canvas가 Grid만으로 충분한 클리핑에 대한 과한 중복 방어인지 점검. FIXED/RATIO/FULLSCREEN처럼 창 크기가 정해진 경우에는 Grid만으로도 잘리지만, `sizeMode=AUTO`는 `SizeToContent`로 무한 크기 측정을 하므로 Grid 안의 원본 크기 Image가 그대로 창 크기로 전달되어 "팝업 크기 유지" 계약이 깨짐. Canvas는 자식과 무관하게 DesiredSize 0을 반환하므로 유지가 맞다고 판단.
- 변경: Canvas는 유지하고 중복 설정만 제거. 바깥 Border의 `ClipToBounds`와 겹치는 Canvas `ClipToBounds`, 기본값과 같은 `Canvas.Left/Top=0` 삭제. Canvas를 쓰는 이유를 XAML 주석으로 기록. 무한 크기 측정 시 원본 이미지가 DesiredSize로 전달되지 않는지 확인하는 동작 검증 추가.
- 주요 파일: `popup-frameWork/Popup/Views/Contents/ImageFillPopupView.xaml`, `popup-frameWork/Popup.BehaviorTests/Program.cs`.
- 검증: `Popup.BehaviorTests` 54건 통과(기존 좌상단 고정·클리핑·흰 여백·창 크기 유지 포함). 같은 검증을 Canvas 대신 Grid로 임시 교체해 실행했을 때 신규 SizeToContent 검증이 실패함을 확인한 뒤 원복. 실제 GUI에서 AUTO+ORIGINAL 팝업 수동 확인은 미실행.
- 상태: 2026-09-29-06 충돌 정리와 함께 main 커밋·푸시.

## 2026-09-29-06 — DemoWindow 새 기능 실행 및 설정 영역

- 이유: 추가된 기능을 데모 화면에서 쉽게 찾고 설정을 바꾸며 확인할 수 있도록 시연 진입점 보완.
- 변경: 왼쪽 상단에 새 기능 확인 영역 추가. 바로가기 URL 입력·링크 열고 닫기 실행, 동영상+퀴즈 완료 비율 선택(0·25·50·80·100%), 퀴즈 푸터 바로가기 사용 체크, ORIGINAL 이미지 직접 실행 버튼 제공. 퀴즈 완료 시 오른쪽 상단에 score·passed 요약 표시하고 기존 요청·응답 JSON 로그 유지. 링크 검증·로그 초기화 처리 및 잘못된 정답 미제공 안내 문구 수정.
- 주요 파일: `popup-frameWork/Popup/DemoWindow.xaml`, `DemoWindow.xaml.cs`.
- 검증: WPF 빌드 및 기존 동작 검증 50건 통과. `git diff --check` 통과. 실제 GUI 버튼 클릭·브라우저 실행은 미실행.
- 상태: `b42613d` 커밋 후 문서 작업(2026-09-29-05)과 `a96056c`로 병합해 main 반영. 병합 시 남은 CHANGELOG 충돌 표시는 이후 정리(두 항목 모두 유지, 커밋 시각 순으로 순번 조정). Debug 실행 파일 빌드 완료. 배포용 dist·오프라인 패키지는 갱신하지 않음.

## 2026-09-29-05 — API/인터페이스 및 팝업 가이드 최신화

- 이유: 최신 main의 IMAGE ORIGINAL, 푸터 바로가기, 동영상+퀴즈 기능이 인터페이스 계약에는 일부 반영됐지만, 필드별 필수 여부·생략 시 기본값이 표마다 일관되지 않았고 옵션/사용자/미리보기 가이드에는 구 API·구 이미지 모드·과거 정책 설명이 남아 있어 연동 기준을 명확히 할 필요가 있음.
- 변경(인터페이스): `POPUP_INTERFACE_SPEC.md`를 v3.5로 올리고 로그인, 팝업 목록, 공통 content, TEXT/IMAGE/VIDEO, questions/options, 결과 요청·응답·영상 블록의 표를 `필수 여부 / Default / 설명` 기준으로 정리. 필수 필드에 C# fallback이 있더라도 신규 백엔드는 값을 명시해야 한다는 표 해석 원칙 추가. IMAGE enum 요약에 ORIGINAL을 포함하고 최신 v3.4 기능을 재점검.
- 변경(가이드): `POPUP_OPTION_GUIDE.md`의 PostgreSQL·구 이벤트 API·반복 정책 DTO 설명을 현재 Oracle + 3개 WPF API 구조로 정리하고 ORIGINAL, 기본 completionRatio 1.0, 푸터 바로가기, 동영상+퀴즈를 반영. 사용자 가이드의 이미지 모드·숨김 일수·퀴즈 채점·결과 전송 흐름과 미리보기 정합성 문서를 최신 main 기준으로 갱신. 동영상+퀴즈 전용 안내 문서의 계약 버전을 v3.5로 연결.
- 주요 파일: `docs/interfaces/POPUP_INTERFACE_SPEC.md`, `popup-frameWork/Popup/Docs/POPUP_OPTION_GUIDE.md`, `POPUP_USER_OPTION_GUIDE.md`, `FOOTER_LINK_VIDEO_QUIZ.md`, `zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md`.
- 검증: 최신 main의 `PopupResponseDto`, TEXT/IMAGE/VIDEO/Survey DTO, `PopupFactory`, 결과 DTO와 문서 기본값을 대조. 원격 반영 후 v3.5 표 구조와 가이드 링크를 재조회하고, 잔존 구문(RATIO 명칭 불일치·VIDEO 연결 미확정 표현·RATING5 문구)을 추가 정리. 문서 전용 변경으로 빌드·실행 테스트는 수행하지 않음.
- 상태: main 커밋·푸시 후 원격 내용 재조회로 확인.

## 2026-09-29-04 — IMAGE ORIGINAL 원본 크기 자르기 모드

- 이유: 팝업 크기에 이미지를 맞추거나 창 크기를 재계산하지 않고, 원본을 그대로 넣어 초과 영역만 자르는 기본 표시 방식 추가.
- 변경: `content.imageSizeMode=ORIGINAL` 지원. 헤더·푸터 사이 본문 왼쪽 위에 원본 픽셀 크기로 표시하고 오른쪽·아래 초과 부분을 자름. 확대·축소·스크롤·창 자동 크기 변경 없음. 작은 이미지의 남는 영역은 흰색. 이미지 메타데이터 DPI와 무관하게 1px를 1 DIP로 배치하며 OS 화면 배율은 적용. 제목·설명·요청 이미지 너비/높이는 사용하지 않고 이미지 클릭 링크는 유지. FILL의 로더·링크 처리를 재사용하되 Canvas로 원본 크기를 고정하여 잘라냄.
- 변경(웹·서버): 관리자 모드 선택 및 미리보기 추가, 신규 등록 기본 선택 ORIGINAL. 기존 저장값과 옵션 누락 시 ADAPTIVE 유지. 서버 허용값에 ORIGINAL 추가(기존 CONTENT_OPTIONS 사용, 신규 DDL 없음). WPF 데모 이미지 모드 선택 추가. 인터페이스 계약 v3.4 갱신.
- 주요 파일: `ImageFillPopupView.xaml/.cs`, `PopupFactory.cs`, `DemoWindow.xaml/.cs`, `PopupEditorDialog.tsx`, `PopupPreview.tsx`, `imagePreviewLayout.ts`, `PopupService.java`.
- 검증: WPF 빌드 및 동작 검증 총 50건 통과. 신규 원본 모드 16건은 80×60·400×300 이미지 × DPI 96·192 조합을 실제 RenderTargetBitmap으로 렌더링하여 좌상단 정렬, 확대·축소 없음, 큰 이미지 클리핑, 작은 이미지 흰 여백, 창 크기 유지 확인. 서버 관리자 저장 테스트 11건 통과(ORIGINAL 포함). 웹 타입 검사 및 `git diff --check` 통과.
- 상태: 2026-09-29-03 변경과 함께 이번 main 커밋에 포함하며 원격 푸시 후 동기화 확인. 실제 GUI·원격 이미지 다운로드·브라우저 화면 수동 검증, 배포·오프라인 패키지 재생성은 미실행.

## 2026-09-29-03 — 푸터 바로가기 및 동영상+퀴즈 모드

- 이유: 푸터에서 안내 링크를 열고 종료하는 동작과 영상 시청 후 퀴즈 응답을 활성화하는 교육 흐름 지원.
- 변경(WPF): `footerAction=LINK_AND_CLOSE`이면 하단 버튼을 바로가기로 표시하고 HTTP(S) 주소를 기본 브라우저로 연 뒤 닫음. 주소 오류·실행 실패 시 창 유지. `QUIZ`의 `content.videoEnabled=true`이면 영상 아래 퀴즈를 함께 표시하고, 누적 시청 비율이 최상위 `completionRatio` 이상일 때 퀴즈와 푸터 전체를 활성화. 완료 전 입력·푸터 클릭 차단, 완료 후 되감기에도 활성 유지, 작은 창에서는 본문 스크롤. 일반 종료와 제출 모두 영상 진행률을 수집하며 제출 항목에 답안·점수와 video를 함께 기록. 데모 화면에 두 모드 실행 버튼 추가.
- 변경(웹·서버): 관리자 유형 선택에 동영상+퀴즈 추가(저장은 QUIZ+videoEnabled), 푸터 동작·URL 편집과 시청 비율 미리보기 추가. 기존 MEDIA_URL·CONTENT_OPTIONS로 저장·복원하고 URL·모드 검증 추가. 서버는 시청 기준을 충족한 동영상+퀴즈 제출만 허용하며, 영상만 시청한 결과로 퀴즈를 완료 처리하지 않음. 신규 DDL 없음. 인터페이스 계약 v3.3 및 사용 가이드 추가.
- 주요 파일: `Popup/Views/Contents/VideoQuizPopupView.cs`, `VideoPopupView.xaml.cs`, `PopupWindow.xaml.cs`, `PopupFactory.cs`, `PopupManager.cs`, `PopupResultBuilder.cs`, `PopupEditorDialog.tsx`, `PopupPreview.tsx`, `PopupService.java`, `PopupContentAssembler.java`, `WpfResultProcessor.java`, `PopupMapper.xml`.
- 검증: WPF 빌드 성공 및 `Popup.BehaviorTests` 22건 통과(시청 경계 0·80·100%, 건너뛰기·되감기, 퀴즈·푸터 활성화, 필수 시청 종료 제한, 기본 닫기 유지, 통합 제출과 완료 판정). 서버 API·테스트 컴파일 및 service core popup 테스트 49건 중 47 통과·2 skip·실패 0. 웹 타입 검사·프로덕션 빌드 성공(기존 공통 lint·runtime config 경고 존재). `git diff --check` 통과.
- 한계·미실행: GUI에서 실제 영상 재생·외부 브라우저 실행, 실DB 왕복 검증 미실행. 동영상+퀴즈는 시청 비율을 제공하지 않는 YouTube 임베드를 지원하지 않으며 영상 파일·직접 재생 URL 사용. 새 모드 사용 시 WPF·서버 동시 갱신 필요.
- 상태: 2026-09-29-04 변경과 함께 이번 main 커밋에 포함하며 원격 푸시 후 동기화 확인. 배포·DB 적용·오프라인 패키지 재생성은 수행하지 않음.
- 후속(퀴즈 점수 JSON): 일반 퀴즈·동영상+퀴즈 모두 기존 `results[].score`·`passed` 경로로 완료 점수를 전달하는 것을 확인. 실제 API 직렬화 옵션과 재전송 큐 옵션으로 0점·87.5점·100점의 JSON 변환·복원 검증 12건 추가. WPF 동작 검증 총 34건 통과. 결과 전송 로직의 추가 변경은 필요하지 않았음.

## 2026-09-29-02 — 오프라인 패키지 작업 브랜치 main 병합

- 이유: 20260928 오프라인 패키지의 설계 18 후속 변경이 로컬 작업 브랜치에만 남아 있어 main과 정합성을 맞춤.
- 변경: `worktree-popup-l1-image-size-fixed`의 L-1~L-5, IMAGE 미리보기, DB 및 ERwin 갱신, 반입 문서를 병합. 중복 L-0 커밋의 충돌은 후속 작업 브랜치 기준으로 해결하고 main의 `DemoMode=true`, 오프라인 폴더 `.gitkeep` 삭제 및 기존 변경 이력은 유지.
- 주요 파일: WPF 팝업 DTO·Factory·설문·퀴즈·이미지 처리, 서버 popup 패키지, 웹 미리보기, `db/oracle`, `ERD/model`, 설계·반입 문서.
- 검증: WPF 솔루션 빌드 경고 0·오류 0, 서버 API 및 테스트 컴파일 성공, service core popup 테스트 44건 중 42 통과·2 skip·실패 0, 웹 타입 검사 통과. 미해결 충돌 없음. ERwin 생성 SQL의 기존 공백 6행을 제외한 스테이징 공백 검사 통과. 작업 브랜치 대비 차이는 기존 main 설정·gitkeep 삭제·변경 이력뿐임.
- 상태: 이번 병합 커밋에 포함하며 main 및 작업 브랜치를 원격에 푸시 후 확인. 오프라인 압축파일 재생성, DB 적용, 화면 실행은 수행하지 않음.

## 2026-09-29-01 — main 작업 내용 일괄 커밋

- 이유: 누적된 팝업 소스 정리와 ERwin 산출물 및 문서 변경을 원격 저장소에 반영하기 위해 현재 작업 내용을 확정.
- 변경: 아래 2026-09-28-03·04 및 2026-09-24-01의 미커밋 변경을 함께 포함. WPF `DemoMode=true` 설정과 `offline-packages/nuget/.gitkeep`, `offline-sdk/.gitkeep` 삭제도 포함.
- 주요 파일: WPF·서버·웹 팝업 소스, `ERD/model/*`, `scripts/export-popup-erwin.cjs`, 설계 문서, `db/oracle/README.md`.
- 검증: 기존 추적 파일의 공백 검사 통과. 전체 스테이징 후 ERwin 역공학 SQL의 공백만 있는 6개 행에서 trailing whitespace 확인; 생성 산출물은 원본 그대로 포함. 이번 작업에서는 빌드·테스트를 재실행하지 않음.
- 상태: 관련 변경 전체를 이번 main 커밋에 포함. 아래 항목의 미커밋 표시는 당시 상태이며, 푸시 결과는 원격 브랜치와 커밋을 대조하여 확인.

## 2026-09-28-12 — 폐쇄망 반입 패키지 20260928 생성

- 이유: 설계 18(L-0~L-5, D-6, W-10)과 DB 스크립트 정리분을 폐쇄망에 반입하기 위한 패키지 생성. VS Code 확장·.NET SDK·NuGet 패키지는 20260922에 반입 완료라 제외.
- 생성: `scripts/export-offline-package.ps1 -IncludeMockSso -NoZip`(커밋 `8ab4665` 기준, 작업 트리 브랜치)로 묶음을 만든 뒤 20260922와 같은 구성으로 정리 — `1-zero-rule-server`(87)·`2-zero-rule-web`(9)·`3-popup-frameWork`(76, MockSso 포함)·`4-docs`(45) 폴더와 tar, `MANIFEST-*`, `SHA256SUMS.txt`, `README-IMPORT.md`, 최종 `popup-offline-20260928.tgz`.
- 추가: `DELETE-SINCE-20260922.txt` — 20260922 반입분에는 있었지만 이번 소스에 없는 파일(서버 7: 구 `PopupController`·payload·DTO, WPF 8: `TextPopupWindow`·구 API DTO·`FlexibleDateTimeOffsetJsonConverter.cs` 등, 문서 1: `04_cleanup`의 `archive/` 이동). 베이스라인에도 없던 파일이라 git diff 기준 MANIFEST에 D로 나오지 않아 별도 목록으로 만듦. README에 계약서 3.2 동시 배포 조건 기재. 폐쇄망에는 팝업 DB가 아직 구축되지 않았으므로 DB 안내는 신규 구축 순서(`00`(방식 A) → `01` → `02`(선택) → `03`(방식 A) → `04_popup_web_menu`)로 작성하고, `06`~`09`·`archive/`는 기존 DB 마이그레이션용이라 실행하지 않는다고 명시(처음에는 마이그레이션 순서로 작성했다가 수정해 패키지를 다시 생성).
- 위치: `offline-export/20260928/`(저장소 루트, git 제외 경로).
- 검증: tgz를 임시 폴더에 풀어 항목 11개 확인, tar 4개 SHA256 일치, 각 tar 해제 후 신규 파일(`IsoDateTimeOffsetJsonConverter.cs`, `imagePreviewLayout.ts`, `09_drop_unused_columns_oracle.sql`, `archive/05_*`) 포함·삭제 파일(`PopupController.java`, `FlexibleDateTimeOffsetJsonConverter.cs`) 미포함, WPF 묶음 exe/dll/pdb·bin/obj 0건, 개인 PC 절대경로 0건. 첫 생성 시 패키징 스크립트 인코딩(BOM 없음)으로 README·삭제 목록 한글이 깨져 폴더를 지우고 다시 생성한 뒤 한글 정상 확인.
- 참고: `appsettings.json`은 로컬 값(localhost, `DevUserId` E1001)이며 README 체크리스트대로 폐쇄망에서 변경 필요(20260922와 동일).
- 폐쇄망 사용 범위 반영: 폐쇄망은 서버·관리자 웹·DB 연계 없이 WPF Demo Mode(`--demo` 또는 `PopupApi.DemoMode`)로만 테스트하므로, README 첫머리에 사용 범위를 명시하고 서버·웹·DB 스크립트는 소스 동기화용·연계 시점 적용으로, DB 절과 반입 전 확인의 연계 항목은 연계 시점 확인으로 표시해 패키지를 다시 생성.
- 데모 검증: `Popup.csproj`를 참조하는 임시 콘솔(STA, 저장소 외부)에서 `DemoPopupDataService` 팝업 5종(TEXT·IMAGE·VIDEO·SURVEY·QUIZ)을 실제 `PopupFactory.Create`로 변환 — 모두 성공(RATIO → ViewportRatio 매핑 포함), QUIZ 채점 전부 정답 100·통과 / 한 문항 오답 50·불합격. 데모 이미지·영상(`Media/`)이 3-popup-frameWork 묶음에 포함되고 EXE 내장 리소스로 빌드됨을 확인. 화면 표시(`Popup.exe --demo`) 자체는 미실행.
- 미실행 검증: 폐쇄망 신규 구축에 쓰일 `01_popup_schema_oracle.sql`(설계 18 L-4·L-5 제약·컬럼 변경 반영)을 빈 스키마에 처음부터 실행하는 확인. 로컬 XE에 새 스키마를 만들 DBA 계정 정보가 없어 수행하지 않음(ERwin 생성기의 DDL 파싱은 성공).
- 상태: 패키지 생성 완료(반입 전). 변경 이력은 작업 브랜치에 커밋, 미푸시.

## 2026-09-28-11 — 설계 18 DB 스크립트 로컬 XE·원격 개발 DB 적용

- 이유: 설계 18 L-1~L-5 코드가 전제하는 스키마·데이터 상태를 로컬 XE와 원격 개발 DB에 맞추기 위해 미적용 스크립트를 실행. 원격 개발 DB는 04(markdown 정리)·05(선택지 배치)도 미적용 상태였다.
- 실행 전 확인: 원격 개발 DB 포트 연결 확인 후 읽기 전용 조회 — `OPTION_LAYOUT` 없음, markdown 잔여 1행, 08 제약 없음, 09 대상 컬럼 존재, 팝업 4·템플릿 2, 비정상 DISPLAY_MODE·SIZE_MODE·문항 유형·FIXED 이미지 0행. `POPUP_CONTENT.CONTENT_OPTIONS`·`POPUP_NOTICE`·`QUESTION_TEMPLATE` 주요 값을 작업 로그용으로 스풀 백업(저장소 외부).
- 실행: 로컬 XE — `09`(컬럼 6개 삭제, 잔여 0). 원격 개발 DB(방식 B, 접두어 빈 값) — `04`(markdownMode=false 1행 정리) → `05`(OPTION_LAYOUT 추가, 기존 3문항 VERTICAL) → `06`(0행) → `07`(`SAMPLE-TEXT-001` 사본 키 제거 1행) → `08`(보정 0행, CHECK·NOT NULL 11건) → `09`(컬럼 6개 삭제, `CK_POPUP_YN_VALUES` 재생성).
- 변경(스크립트): `04`·`06`~`09`가 `DEFINE S = &1`로 접두어를 받아, README 안내대로 빈 값(`""`)을 넘기면 SP2-0137로 모든 문장이 실행되지 않는 문제를 원격 첫 실행에서 확인(04 첫 시도는 변경 없음). `COLUMN schema_prefix NEW_VALUE S` + `SELECT '&1'` 방식으로 바꿔 빈 값과 `POPUP.`을 모두 처리하도록 수정(원격·로컬에서 읽기 전용 확인 후 적용). 적용을 마친 `04_cleanup_markdown_fields_oracle.sql`·`05_question_option_layout_oracle.sql`은 `db/oracle/archive/`로 이동(설계 18 D-1·D-2)하고 참조 경로 수정.
- 문서: `db/oracle/README.md` 적용 현황·인자 안내, 설계 18 상태·D-1·D-2·L-1·L-4·D-6 체크리스트, `POPUP_ADMIN_UI_GAP.md`·`OPTION_LAYOUT_DEMO.md`의 05 경로.
- 검증: 스크립트별 결과 확인 조회 모두 0(잔여 FIXED·사본 키·비정상 값·삭제 대상 컬럼). 실DB 테스트(`PopupQuestionDatabaseTest`·`WpfPopupDatabaseTest`, 롤백 전용)를 로컬 XE와 원격 개발 DB 각각에서 실행해 모두 통과. 원격 실행 후 팝업 4·템플릿 2·문항 3·선택지 4로 건수 변화 없음, `SAMPLE-TEXT-001` 제목·설명·본문 컬럼 값 유지 확인.
- 미실행: 서버 기동 후 WPF·관리자 화면 확인.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시. DB 변경은 로컬 XE·원격 개발 DB에 이미 반영됨(되돌릴 수 없는 컬럼 삭제 포함).

## 2026-09-28-10 — 데모 JSON v3 전환·설문/퀴즈 구형 분기 제거(설계 18 L-2) 및 관리자 IMAGE 미리보기 계약 반영(W-10)

- 이유: WPF 설문/퀴즈의 구형 분기(`content.questions`·`content.passingScore`·보기 value 목록 정답)는 Demo Mode 샘플만 쓰고 있어, 샘플을 계약서 v3 형태로 바꾼 뒤 분기를 제거. 관리자 미리보기는 IMAGE의 ADAPTIVE/FIT_TO_IMAGE 차이와 설명 배치를 재현하지 않아 WPF 표시와 달랐고, 설명 배치 옵션은 편집할 수 없었다.
- 변경(WPF, L-2): 데모 SURVEY/QUIZ를 최상위 `questions`·`passingScore`, `options[].isCorrect`, `questionScore`(각 50)로 변경. `PopupFactory`의 `content.questions`·`content.passingScore` fallback, `SurveyPopupContentDto.Questions/PassingScore`, `SurveyQuestionDto/SurveyQuestion.CorrectAnswers`, `QuizGrader`의 value 집합 채점 분기 삭제. 배점 없는 채점 문항은 0점(C-17 — 기존 100/문항 수 규칙 삭제). `SurveyAnswer.SelectedValues`를 삭제하고 필수 응답 검사를 `SelectedOptionIds` 기준으로 변경. 관련 주석 정리.
- 변경(웹, W-10): `imagePreviewLayout.ts` 추가 — WPF `ImagePopupView`·`PopupWindow`의 규칙과 상수(오른쪽 설명 260, 여백 56/190/300, 테두리 2, 작업 영역 90%/95%, 최소 창 280×300)로 설명 위치(AUTO는 가로/세로 0.8 이하면 오른쪽), 영역 비율(0.5~0.9, 그 외 0.75), ADAPTIVE 최대 크기(원본·요청 중 작은 값), FIT_TO_IMAGE 이미지·창 크기를 계산. `PopupPreview`는 이미지 원본 크기를 읽어 이 규칙으로 배치하고 FIT_TO_IMAGE 창 크기를 편집기에 알린다(FULLSCREEN 제외). 편집기에 모드별 안내 문구, 설명 위치·이미지 영역 비율 입력, 신규 기본값(AUTO·0.75), 저장 전 비율 범위 검사 추가, 실제 크기 모달은 FIT_TO_IMAGE 재계산 크기로 연다. 불러오기·저장 시 설명 위치 정규화.
- 변경(서버): IMAGE 저장 검증에 `descriptionPosition`(AUTO/RIGHT/BOTTOM)·`imageAreaRatio`(0.5~0.9) 검사 추가(값 없음은 통과), 테스트 1건 추가.
- 문서: 설계 18 L-2·W-10, 설계 15 §6, `zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md`.
- 주요 파일: `popup-frameWork/Popup/Services/DemoPopupDataService.cs`, `Factories/PopupFactory.cs`, `Services/QuizGrader.cs`, `Models/SurveyAnswer.cs`, `Models/SurveyQuestion.cs`, `Dtos/SurveyPopupContentDto.cs`, `Dtos/SurveyQuestionDto.cs`, `Views/Contents/SurveyPopupView.xaml.cs`, `zero-rule-web/main/src/features/RgstPop/imagePreviewLayout.ts`, `PopupPreview.tsx`, `PopupEditorDialog.tsx`, `PopupService.java`.
- 검증: 데모 JSON을 node로 파싱해 구조 확인(SURVEY 3문항·QUIZ 2문항 최상위, content에는 제목·설명만). `Popup.csproj`를 참조하는 임시 콘솔(작업 폴더 밖)로 실제 데모 QUIZ를 `QuizGrader` 채점 — 전부 정답 100·통과, 복수 선택 일부 50·불합격, 단일 오답 50·불합격, 무응답 0·불합격. `dotnet build popup-frameWork/Popup.slnx --no-incremental` 경고 0·오류 0. `imagePreviewLayout.ts`를 TypeScript로 변환해 설계 15 §5 조건(팝업 400×700, 원본 750×1030, 요청 620×520, 설명 AUTO)에서 창 938×712로 WPF 측정값과 일치, 작업 영역 축소·최대 크기 보정·한 축만 지정한 경우도 확인. 서버 `:service:core:test --tests server.service.core.popup.*` 44건 — 42 통과, 2 skip(실DB), 실패 0. `pnpm --filter @zerorule/web build` 성공, 변경 파일 eslint 경고 없음.
- 미실행 검증: `--demo` 화면에서 SURVEY/QUIZ 제출·재도전, 관리자 편집기 브라우저에서 IMAGE 세 모드·설명 위치 미리보기 확인.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시.

## 2026-09-28-09 — 미사용 템플릿 버전·예약 표시 컬럼 삭제(설계 18 L-5 D-6)

- 이유: 문항 템플릿 버전 정책은 구현되지 않았고(저장마다 난수 그룹·버전 1·`CURRENT_YN='Y'`), 팝업의 로그인 시 표시·예약 표시 플래그와 예약 시각은 항상 N/NULL로만 쓰고 읽는 곳이 없다. 표시 시점은 노출 기간(`DISPLAY_START_AT`~`DISPLAY_END_AT`)과 WPF 폴링으로 정해지므로 정책 구현 대신 컬럼 삭제로 결정.
- 변경(DB): `QUESTION_TEMPLATE`에서 `TEMPLATE_GROUP_ID`·`TEMPLATE_VERSION`·`CURRENT_YN`과 `UK_QTEMPLATE_GROUP_VERSION`·`CK_QUESTION_TEMPLATE_VERSION`·`CK_QUESTION_TEMPLATE_CURRENT`·`UX_QUESTION_TEMPLATE_CURRENT` 삭제, `POPUP_NOTICE`에서 `SHOW_ON_LOGIN_YN`·`SHOW_ON_SCHEDULE_YN`·`SCHEDULED_AT`·`CK_POPUP_SCHEDULED_AT` 삭제, `CK_POPUP_YN_VALUES`는 나머지 Y/N 컬럼으로 재정의(`01`). 샘플 `02`는 템플릿을 이름으로 조회하도록 변경. 기존 DB용 `09_drop_unused_columns_oracle.sql` 추가(확인 조회 → `CURRENT_YN='N'` 템플릿 비활성화 → 인덱스·제약·컬럼 삭제 → YN CHECK 재생성, 멱등). 테이블은 삭제하지 않음.
- 변경(서버): `insertQuestionTemplate`에서 삭제 컬럼 제외, 팝업 MERGE INSERT에서 `SHOW_ON_*` 제외, 템플릿 목록 조회 조건에서 `CURRENT_YN` 제외. Java 코드 참조 없음.
- 변경(ERD): `scripts/export-popup-erwin.cjs`가 스냅샷 날짜를 인자로 받도록 바꾸고(기본 20260928) 누락된 `OPTION_LAYOUT` 한글명 추가. `ERD/model/popup_oracle_20260928_*`로 재생성(17 테이블, 224 컬럼, UNIQUE 11, CHECK 51, 인덱스 14)하고 2026-09-24 스냅샷 파일은 삭제(git 이력 보존), README를 0928 기준으로 갱신.
- 문서: `db/oracle/README.md` 09 절차, 설계 18 D-6.
- 주요 파일: `db/oracle/01_popup_schema_oracle.sql`, `02_popup_sample_oracle.sql`, `09_drop_unused_columns_oracle.sql`, `PopupMapper.xml`, `scripts/export-popup-erwin.cjs`, `ERD/model/*20260928*`.
- 검증: 서버 `compileJava compileTestJava` 및 `:service:core:test --tests server.service.core.popup.*` 43건 — 41 통과, 2 skip(실DB 테스트, 환경 변수 미지정), 실패 0. ERwin 생성기 실행 성공(컬럼 수 229 → 224 = 삭제 6 + `OPTION_LAYOUT` 1 반영 확인).
- 미실행: **`09`는 로컬 XE·원격 개발 DB 모두 미실행**(되돌릴 수 없는 컬럼 삭제라 개발자 실행으로 남김). 로컬 XE에 09를 실행하기 전까지 새 매퍼의 템플릿 저장과 실DB 테스트(`PopupQuestionDatabaseTest` 등)는 NOT NULL 위반으로 실패한다. `01`·`02`를 빈 스키마에 새로 실행하는 확인도 미실행.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시.

## 2026-09-28-08 — 크기 모드 이름·날짜 형식 단일화(설계 18 L-5 일부)

- 이유: 설계 18 L-5의 정책 항목 중 권장안이 분명한 항목을 확정. 서버·관리자 웹은 `RATIO`를 쓰는데 WPF와 데모 JSON은 `VIEWPORT_RATIO`도 받는 이중 이름, 서버 교체기에만 필요했던 epoch 초 날짜 허용이 남아 있었다.
- 결정: C-24 → `RATIO`로 단일화. C-22 → 날짜는 ISO 문자열만 허용. C-6 → `displayStartAt`/`displayEndAt` 선택 필드 유지. W-3 → L-0에서 완료된 것으로 정리. D-6(템플릿 버전 정책·미사용 컬럼 삭제)은 스키마 삭제를 동반해 결정 대기, W-10은 별도 기능 과제로 유지.
- 변경(WPF): `PopupFactory.ConvertPopupSizeMode`에서 `VIEWPORT_RATIO` 삭제(내부 enum `ViewportRatio` 유지), 데모 JSON 4건 `RATIO`로 변경, 관련 주석 수정. `FlexibleDateTimeOffsetJsonConverter` → `IsoDateTimeOffsetJsonConverter`로 이름을 바꾸고 숫자(epoch 초) 읽기 분기 삭제(쓰기 ISO "O" 유지).
- 변경(DB): `08_legacy_data_constraints_oracle.sql`에 SIZE_MODE 확인 조회(1-1), `VIEWPORT_RATIO → RATIO` 보정, `CK_POPUP_SIZE_MODE`(FIXED/RATIO/FULLSCREEN — 서버 `SIZE_MODES`와 동일) 추가. `01`에도 같은 CHECK 반영.
- 문서: 계약서 3.2 변경 항목에 `VIEWPORT_RATIO` 삭제 추가(sizeMode 표·ENUM·크기 처리 참고), `POPUP_OPTION_GUIDE.md` 크기 모드 표·주의 문구·§11, `db/oracle/README.md` 08 표, 설계 18 L-5 체크리스트.
- 주요 파일: `popup-frameWork/Popup/Factories/PopupFactory.cs`, `Services/DemoPopupDataService.cs`, `Dtos/IsoDateTimeOffsetJsonConverter.cs`, `Services/PopupApiService.cs`, `db/oracle/08_legacy_data_constraints_oracle.sql`, `db/oracle/01_popup_schema_oracle.sql`, `docs/interfaces/POPUP_INTERFACE_SPEC.md`.
- 검증: 서버 WPF 응답 DTO의 날짜 필드가 모두 `@JsonFormat(STRING, WpfJson.DATE_TIME)`임을 확인. 로컬 XE에 `VIEWPORT_RATIO` 임시 행을 넣고 08 재실행 → RATIO 보정·`CK_POPUP_SIZE_MODE` 추가 OK, 기존 제약 SKIP, 결과 확인 0건, 임시 행 삭제. `dotnet build popup-frameWork/Popup.slnx`(`--no-incremental` 포함) 경고 0·오류 0. 서버·웹 코드 변경 없음.
- 미실행 검증: `--demo`에서 RATIO 크기 팝업 표시 확인, 원격 개발 DB 08 실행.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시.

## 2026-09-28-07 — 과거 데이터 기본값 분기 제거 및 DB 제약 추가(설계 18 L-4)

- 이유: 과거·이관 데이터를 위해 서버·WPF·관리자 웹에 흩어져 있던 기본값 보정(DISPLAY_MODE CASE, 크기 NULL 기본값, optionLayout null 보정, RATING5 매핑, TEXT 표시 플래그 추정)을 DB 보정과 제약으로 옮겨 코드 분기를 제거. 원격 개발 DB는 VPN 미연결로 조회할 수 없어, 보정·제약을 한 스크립트로 묶고 배포 전 실행 조건으로 둠.
- 변경(DB): `db/oracle/08_legacy_data_constraints_oracle.sql` 추가 — 확인 조회 4종 → DISPLAY_MODE 보정, 크기 NULL을 기존 서버 기본값으로 보정, RATING5를 SINGLE_CHOICE + HORIZONTAL로 이관(선택지 없으면 1~5 생성), TEXT `showHighlight`/`showBottomDescription`을 기존 fallback 규칙(문구 유무)으로 채움 → `CK_POPUP_DISPLAY_MODE`, 크기 8컬럼 NOT NULL, `CK_QUESTION_TYPE` 추가(이미 있으면 SKIP) → 표 주석 갱신. `01_popup_schema_oracle.sql`에 같은 제약 반영, L-0에서 보류한 `PASSING_SCORE` 주석 수정.
- 변경(서버): 매퍼 `popupEntityColumns`의 DISPLAY_MODE CASE 제거, `toResponseDto` 크기 기본값 제거, `PopupQuestionDto`의 null optionLayout → VERTICAL 보정 제거. `PopupQuestionRules`에 null 배치 명시 거부 조건 추가(`Set.of().contains(null)`이 NPE를 내던 문제 — 테스트로 발견). 테스트: null 배치·RATING5 거부 추가, 배치 누락 기본값 테스트를 거부 기대로 변경.
- 변경(WPF): `SurveyQuestionType.Rating5`와 `PopupFactory` RATING5 매핑·`SurveyPopupView` 분기·관련 주석 삭제. `TextPopupContentDto.ShowHighlight`/`ShowBottomDescription`을 `bool`(기본 false)로 바꾸고 `PopupFactory`의 문구 유무 추정 삭제.
- 변경(웹): `PopupEditorDialog`·`PopupPreview`의 TEXT 표시 플래그 null fallback 삭제(WPF와 동일하게 값이 없으면 숨김).
- 문서: 계약서 3.2(RATING5 삭제, TEXT 플래그 미지정 시 false), `db/oracle/README.md`(08 절차·적용 현황), 설계 18 L-4 체크리스트, `POPUP_OPTION_GUIDE.md`·`POPUP_USER_OPTION_GUIDE.md`·`OPTION_LAYOUT_DEMO.md`.
- 주요 파일: `db/oracle/08_legacy_data_constraints_oracle.sql`, `db/oracle/01_popup_schema_oracle.sql`, `PopupMapper.xml`, `PopupService.java`, `PopupQuestionDto.java`, `PopupQuestionRules.java`, `popup-frameWork/Popup/Factories/PopupFactory.cs`, `Dtos/TextPopupContentDto.cs`, `Models/SurveyQuestionType.cs`, `Views/Contents/SurveyPopupView.xaml.cs`, `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`, `PopupPreview.tsx`.
- 검증: 로컬 XE 현황 조회(DISPLAY_MODE 전부 SEQUENTIAL, 크기 NULL 0, RATING5 0, TEXT 플래그 보유) 후 임시 검증 행(비정상 DISPLAY_MODE, NULL 크기, 보기 없는/있는 RATING5, 플래그 없는 TEXT 3종 — `{}` 포함)을 넣고 08 실행 → 보정값·생성 선택지·플래그가 기존 fallback 결과와 일치, 제약 추가 OK, 재실행 시 0행·SKIP 확인, 임시 행 삭제(로컬 XE에는 제약이 남음). 서버 `:service:core:test --tests server.service.core.popup.*` 43건 전부 통과(로컬 XE 실DB 2건 포함). `dotnet build popup-frameWork/Popup.slnx` 경고 0·오류 0. `pnpm --filter @zerorule/web build` 성공.
- 미실행 검증: `01` 전체를 빈 스키마에 새로 실행하는 확인(변경은 컬럼 NOT NULL·CHECK 2개·주석), `--demo` 표시, 서버 기동 E2E.
- 주의: **원격 개발 DB에 08 미실행.** 크기 NULL 행이 있으면 L-4 서버 조회가 NPE로 실패하고, RATING5 문항이 있으면 L-4 WPF에서 해당 팝업 목록 변환이 실패하므로 08 실행 후 배포한다. D-1(`05`)·D-2(`04`) 원격 적용과 보관 이동도 미실행. ERwin 산출물(2026-09-24 스냅샷)은 변경 전 `01` 기준이다.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시.

## 2026-09-28-06 — content 중복 키 정리(설계 18 L-3)

- 이유: 관리자 저장 때 content 전체가 `CONTENT_OPTIONS`에 들어가고 조회 때 그 JSON이 정규 컬럼 위에 병합되어, 오래된 사본(특히 서버가 덧붙인 `completionRatio` 등 파생 키)이 실제 컬럼 값을 가리는 정합성 이슈. 모든 유형의 content 키가 모든 팝업에 저장되던 문제와 WPF가 읽지 않는 구 계약용 중복 키도 함께 정리.
- 변경(서버): `PopupContentAssembler`가 옵션 JSON을 먼저 넣고 정규 컬럼이 덮어쓰도록 순서를 바꾸고, `completionRatio`·`allowCloseBeforeCompletion`·`passingScore`·`validateRequiredQuestions`를 content에 만들지 않음. 컬럼 사본·파생 키 목록(`STORED_COPY_KEYS`)을 두어 조회 시 무시하고 저장 시 `CONTENT_OPTIONS`에서 제거(`withoutStoredCopies`). `toResponseDto`의 `content.questions` 중복 삽입과 `WpfPopupItem`의 content 키 제거 목록 삭제. `/apis/popup/info` 응답의 `adminQuestions`(웹 미사용, 요청마다 문항 쿼리 1회)와 `AdminPopupQuestion.correctValues`(`options[].isCorrect`와 중복) 삭제. 테스트는 새 조립 규칙·저장 형태로 수정하고 사본 무시·저장 필터 테스트 추가.
- 변경(웹): 저장 요청 content를 팝업 유형별 키(공통 Overlay·위치·폰트 + 유형별 WPF DTO·미리보기 키)만 남기도록 `contentForType` 추가. 편집 중 유형 전환 시 입력값은 유지. 타입에서 `AdminPopupInfo.adminQuestions`·`AdminPopupQuestion.correctValues` 제거.
- 변경(DB): `db/oracle/07_cleanup_content_option_copies_oracle.sql` 추가 — 11g 호환 정규식으로 `CONTENT_OPTIONS`의 사본·파생 키 쌍 제거(문자열·숫자·불리언·null 값만, 배열·객체 값은 남김), 멱등.
- 문서: 설계 18 L-3 체크리스트, `db/oracle/README.md`, `POPUP_OPTION_GUIDE.md`(SURVEY content 옵션), `POPUP_ADMIN_UI_GAP.md` §8.
- 주요 파일: `zero-rule-server/.../popup/PopupContentAssembler.java`, `PopupService.java`, `WpfPopupItem.java`, `AdminPopupQuestion.java`, `PopupAdminController.java`, `PopupAdminPayloads.java`, `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`, `zero-rule-web/sub/domain/src/model/PopupAdmin.ts`, `db/oracle/07_cleanup_content_option_copies_oracle.sql`.
- 검증: 서버 `gradlew --offline compileJava compileTestJava` 성공, `:service:core:test --tests server.service.core.popup.*` 42건 — 40 통과, 2 skip, 실패 0. 로컬 XE 실DB 테스트(`POPUP_TEST_DB_*` 지정) `PopupQuestionDatabaseTest`·`WpfPopupDatabaseTest` 통과(롤백 전용). `pnpm --filter @zerorule/web build` 성공(변경 파일 lint 경고 없음). 07 치환식은 DUAL 샘플(이스케이프 따옴표·쉼표 포함 문자열, 값 안의 키 문자열, 배열 값, 첫 키 위치)로 확인 후 로컬 XE 실행 — 대상 0행(실행 전 `CONTENT_OPTIONS` 백업 스풀). WPF 코드 변경 없음(content 사본 참조 0건 확인).
- 미실행 검증: 관리자 수정 → 재조회 브라우저 확인, WPF 표시 E2E, 원격 개발 DB에서 07 실행.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시.

## 2026-09-28-05 — IMAGE 크기 모드 과거 값 FIXED 제거(설계 18 L-1)

- 이유: `imageSizeMode = FIXED`는 계약상 과거 호환 값인데 관리자 웹이 신규 IMAGE 팝업 기본값·메뉴로 계속 저장하고 있어, WPF 호환 매핑을 없애기 전에 생성 경로와 기존 데이터를 먼저 정리할 필요. 설계 18 L-1 순서(웹 → 서버 검증 → 데이터 → WPF → 문서)대로 반영.
- 변경(웹): `PopupEditorDialog` 신규 기본값을 `ADAPTIVE`로 바꾸고 "고정 영역" 메뉴 삭제. `normalizeImageSizeMode`로 IMAGE 팝업을 불러올 때·템플릿을 불러올 때·저장할 때 FIXED/빈 값/그 외 값을 `ADAPTIVE`로 정규화(선택 값이 메뉴 범위를 벗어나지 않게 표시 값도 같은 함수 사용).
- 변경(서버): `PopupService.validateAdminPopup`에 IMAGE `content.imageSizeMode` 검사 추가 — 값이 없으면 통과(WPF 기본 ADAPTIVE), ADAPTIVE/FIT_TO_IMAGE/FILL(대소문자 무관) 외 값은 거부. `PopupAdminQuestionsTest`에 FIXED 거부·현행 3값 허용 테스트 2건 추가.
- 변경(DB): `db/oracle/06_image_size_mode_adaptive_oracle.sql` 추가 — `CONTENT_OPTIONS`의 `"imageSizeMode":"FIXED"`(대소문자 무관)와 빈 값을 `ADAPTIVE`로 치환, 대상 목록·IMAGE 분포·잔여 건수 출력, 멱등. 팝업 창 `sizeMode`의 FIXED는 대상 아님. 샘플 SQL(`02`)에는 `imageSizeMode`가 없고 데모 JSON은 이미 ADAPTIVE라 수정 없음.
- 변경(WPF): `ImagePopupContentDto.ImageSizeMode` 기본값 `ADAPTIVE`, `PopupFactory.ConvertImagePopupSizeMode`의 `FIXED → Adaptive` 매핑 삭제(FIXED는 지원하지 않는 값으로 `ArgumentException`), `ImagePopupSizeMode.Adaptive` 주석 수정.
- 문서: 계약서 `POPUP_INTERFACE_SPEC.md` 3.1로 갱신(IMAGE 표·ENUM에서 FIXED 삭제, 미지정 시 ADAPTIVE·그 외 값은 변환 실패 명시), 설계 15, `POPUP_OPTION_GUIDE.md`, `db/oracle/README.md`(06 실행 절차·적용 현황), 설계 18 L-1 체크리스트 갱신.
- 주요 파일: `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`, `zero-rule-server/.../popup/PopupService.java`, `PopupAdminQuestionsTest.java`, `db/oracle/06_image_size_mode_adaptive_oracle.sql`, `popup-frameWork/Popup/Dtos/ImagePopupContentDto.cs`, `Factories/PopupFactory.cs`, `docs/interfaces/POPUP_INTERFACE_SPEC.md`.
- 검증: 서버 `gradlew --offline :service:core:test --tests server.service.core.popup.*` 39건 — 37 통과, 2 skip(실DB 필요), 실패 0(신규 IMAGE 테스트 2건 포함). `dotnet build popup-frameWork/Popup.slnx` 경고 0·오류 0. `pnpm --filter @zerorule/web build` 성공, `PopupEditorDialog.tsx` eslint 경고 없음. 로컬 XE(POPUP)에 06 실행 — 대상 0행(IMAGE 팝업 없음), 치환식은 DUAL 샘플 JSON으로 FIXED/fixed/빈 값만 ADAPTIVE로 바뀌고 FIT_TO_IMAGE·FILL·`sizeMode":"FIXED"`는 유지됨을 확인. `git diff --check` 통과.
- 미실행 검증: 관리자 웹에서 기존 FIXED 팝업 열기·저장 브라우저 확인, `--demo` IMAGE 팝업 표시, 서버 기동 후 FIXED 저장 요청 거부 HTTP 확인.
- 주의: **원격 개발 DB에는 06 미적용**(VPN 연결 필요). FIXED 행이 한 건이라도 남은 상태에서 이 WPF를 배포하면 해당 사용자의 팝업 목록 변환이 실패하므로, 원격 개발 DB에 06 실행 후 WPF를 배포한다.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 커밋, main 미반영·미푸시.

## 2026-09-28-04 — 팝업 미사용 소스 정리(설계 18 L-0)

- 이유: WPF 인터페이스가 3개 API로 통합된 뒤 남은 구 WPF-01~06 경로와 호출자 없는 코드를 제거. 특히 구 `PopupController`는 공개 경로(`/p/**`)에서 요청의 `userId`를 그대로 신뢰해 다른 사용자의 팝업 조회·숨김·응답 기록이 가능한 상태였다. 동작이 바뀌지 않는 삭제만 먼저 반영하고 구버전 데이터 분기는 이후 단계로 남김.
- 변경(서버): `PopupController`(`/p/api/popups` 목록·`/hide`·`/responses`·`/video-progress`·`/events`·`/statuses`)와 요청 payload 4개, `PopupService.getPopups`·`recordPopupEvent`·`getPopupStatuses`·`loadPublicQuestions`·1인자 `loadQuestions`, 매퍼 `upsertPopupEvent`·`selectPopupStatuses`, `PopupEventResponseDto`·`UserPopupStatusDto`, 호출자 없는 `WpfPopupItem.from(dto)`, 테스트 전용 호환 생성자(`WpfResultCommand` 9인자, `PopupQuestionDto` 11인자) 삭제. 테스트 호출부는 정식 생성자로 바꾸고, `PopupQuestionDatabaseTest`의 공개 목록 확인은 매퍼 노출 조회와 `WpfPopupItem.withoutAnswerKey`로 대체. `hidePopup`·`submitResponse`·`saveVideoProgress`는 `WpfResultProcessor`가 위임하므로 유지, 영상 스트리밍 `PopupVideoController`(`GET /p/api/popups/video`)도 유지. 매퍼 XML·WPF 서비스·컨트롤러·결과 요청 주석을 현행 구조로 수정.
- 변경(WPF): sample 베이스라인 `TextPopupWindow` 삭제. `PopupApiService`의 구 API 메서드 6개와 전용 헬퍼 4개, 구 요청/응답 DTO 파일 3개 삭제(`PopupSubmitAnswerRequestDto`는 `WpfResultDtos.cs`로 이동). 미사용 필드·멤버(`PopupResponseDto` 템플릿/반복 필드, VIDEO content의 완료 비율 사본, SURVEY `ValidateRequiredQuestions`, `PopupManager.Enqueue/Show/EnqueueRange`, `PendingCount`, `LastUser`/`HasToken`, `IsAccepted`, `IsVersionError`)와 주석 처리된 코드 삭제. 데모 게이트웨이의 구 클라이언트용 서버 재채점 `Grade()` 삭제(점수 누락 QUIZ 제출은 불합격). 설문 문자열 Tag 호환 분기 삭제, `SaveDoNotShowAgainAsync` 인라인, 영상 진행률의 no-op 인자를 없애고 `UpdateProgressSnapshot()`으로 이름 변경, 도달 불가 `goto case` 정리, `ImagePopupSizeMode.Adaptive` 주석을 확정 계약으로 수정. 구 API를 설명하던 `Popup/Docs/popup-json-mapping.md`·PostgreSQL DDL 삭제, `POPUP_OPTION_GUIDE.md`는 계약서 v3.0 안내로 교체.
- 변경(웹): 여는 코드가 없는 새 창 미리보기 페이지 `main/pages/popup-preview.tsx`와 `PopupPreview`의 `standalone` 분기 삭제. Markdown 제거 잔재(불필요한 괄호·들여쓰기·표식 주석) 정리, `PopupAdminApi.ts` 주석 위치 수정, `POPUP_PREVIEW_WPF_PARITY.md`를 현행 기준으로 재작성.
- 문서: 설계 18 L-0 상태 갱신, 설계 14 §3.2 반입 목록에서 미리보기 페이지 제거, `ERD/README.md`·`POPUP_ADMIN_UI_GAP.md`의 삭제 파일·메서드 언급 수정.
- 주요 파일: `zero-rule-server/.../popup/PopupService.java`, `PopupMapper.java/.xml`, `WpfPopupItem.java`, `WpfResultCommand.java`, `PopupQuestionDto.java`, 서버 popup 테스트, `popup-frameWork/Popup/Services/PopupApiService.cs`, `DemoPopupGateway.cs`, `Dtos/*`, `Views/**`, `zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx`, `PopupEditorDialog.tsx`.
- 검증: 서버 `gradlew --offline compileJava compileTestJava` 및 `:web:api`·`:service:core`·`:app` popup/wpf 테스트 66건 — 60 통과, 6 skip(실DB 필요), 실패 0(매퍼 메서드↔구문 1:1 검사 포함). `dotnet build popup-frameWork/Popup.slnx`(증분·`--no-incremental`) 경고 0·오류 0. `pnpm --filter @zerorule/web build` 성공(변경 파일 lint 경고 없음, 라우트 목록에서 `/popup-preview` 제거 확인). 삭제 심볼 잔존 참조 grep 0건(설명 주석 제외). `git diff --check` 통과.
- 미실행 검증: `--demo` 전체 팝업 표시·QUIZ 제출, 서버 기동 후 구 경로 404와 영상 스트리밍 확인, 관리자 미리보기 브라우저 확인.
- 보류: DDL `POPUP_NOTICE.PASSING_SCORE` 주석 수정은 미커밋 ERwin 산출물의 원본 DDL 해시와 충돌하므로 ERwin 작업 반영 후 진행. `offline-export/20260922`의 기존 반입 산출물은 삭제 파일을 포함하므로 반입 전 재생성 필요.
- 상태: 작업 브랜치 `worktree-popup-l1-image-size-fixed`에 ERwin 작업(2026-09-24-01)과 함께 커밋(L-1 작업의 기준 상태), main 미반영·미푸시. `popup-frameWork/Popup/appsettings.json`의 로컬 `DemoMode` 변경은 커밋에서 제외.

## 2026-09-28-03 — 팝업 구버전 분기·미사용 소스 조사 및 정리 TODO

- 이유: WPF 인터페이스가 3개 API(계약서 v3.0)로 통합되고 IMAGE 크기 모드·문항 구조·Markdown 제거 등이 확정된 뒤에도 구 계약용 코드와 과거 데이터 분기가 남아 있어, 폐쇄망 반입 전에 정리 대상과 순서를 확정할 필요.
- 변경: 팝업 소스(WPF `popup-frameWork/Popup`, 서버 popup/wpf 패키지·`PopupMapper.xml`, 관리자 웹 `features/RgstPop`·`PopupAdmin.ts`·`PopupAdminApi.ts`, `db/oracle`)를 조사해 미사용 소스와 구버전 데이터 분기를 `docs/design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md`에 서버 S-1~20, 웹 W-1~10, DB D-1~6, WPF C-1~26으로 목록화하고, 변경 로직을 L-0(동작 변화 없는 삭제)~L-5(정책 결정) 단계로 정리. 설계 14 §8에 P1A 항목으로 연결. zero 공통 프레임워크는 대상에서 제외.
- 주요 확인 사항: ① 구 `PopupController`(`/p/api/popups?userId=`, `/hide`·`/responses`·`/video-progress`·`/events`·`/statuses`)가 공개 경로에서 `userId`를 신뢰하며 호출부 없음 — 우선 삭제 대상(`/p/api/popups/video`는 현행이라 유지). ② `imageSizeMode` FIXED는 계약상 과거 값이지만 관리자 웹 기본값·메뉴가 아직 생성하므로 WPF 매핑은 웹·데이터 정리 후 제거. ③ WPF의 `content.questions`·`content.passingScore`·`correctAnswers` 분기는 Demo Mode 샘플 JSON만 사용하므로 데모 JSON 전환이 선행 조건. ④ 서버가 `content` 전체를 `CONTENT_OPTIONS`에 저장하고 조회 시 덮어써 컬럼 값이 오래된 사본에 가려질 수 있는 정합성 이슈. ⑤ `05_question_option_layout_oracle.sql`은 원격 개발 DB 미적용이라 삭제 금지.
- 주요 파일: `docs/design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md`, `docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md`.
- 검증: HEAD `5bfa543` 기준 참조 grep·호출 경로 추적과 CHANGELOG·설계 문서 대조로 수행한 정적 조사. 구 `PopupController` 매핑, 웹 FIXED 기본값, `TextPopupWindow` 무참조, 데모 JSON 구형 필드, `PopupFactory` FIXED/`content.passingScore` 분기는 직접 재확인. 소스 변경·빌드·실행 검증은 하지 않음.
- 상태: 문서만 작성, 코드 정리 미착수. 미커밋.

## 2026-09-28-02 — 문항별 선택지 가로·세로 배치 및 줄바꿈

- 이유: 설문·퀴즈 선택지는 직접 입력하고 각 문항에서 배치 방향을 개별 지정하도록 통일.
- 변경: 문항 편집기에 세로형(기본)/가로형 선택 추가. questions[].optionLayout을 문항 템플릿의 POPUP_QUESTION.OPTION_LAYOUT에 저장하고 관리자 조회·WPF 응답·정답 제거 경로에 유지. 웹 미리보기/WPF는 문항별 배치를 적용하고 가로형 너비 초과 시 줄바꿈. RATING5의 5열 전용 UI 및 자동 보기 생성 제거. DB 초기 스키마 및 기존 DB용 05_question_option_layout_oracle.sql 추가.
- 데모·문서: 1번/2번 문항 배치를 각각 선택하도록 데모 수정. 긴 문장·공백 없는 문자열·복수 선택 보기 포함. 사용자/옵션/JSON/API 계약 및 OPTION_LAYOUT_DEMO.md의 실행·확인 절차를 문항별 설정으로 정리.
- 주요 파일: PopupQuestionEditor.tsx, PopupPreview.tsx, PopupAdmin.ts, PopupQuestionDto/Entity.java, PopupMapper.xml, PopupService.java, WpfPopupItem.java, SurveyQuestionDto.cs, PopupFactory.cs, SurveyPopupView.xaml.cs, DemoWindow.xaml(.cs), DemoPopupDataService.cs, db/oracle/*.sql.
- 검증: 웹 타입 검사 및 WPF 빌드(경고 0/오류 0) 통과. 서버 관련 테스트 23건 통과/실DB 테스트 1건 생략(접속 정보 없음). JSON 왕복·문항별 혼합 배치·정답 제거 후 배치 유지·기본값/유효성·MyBatis 바인딩 검증. 로컬 .offline-verify/option-layout 하네스에서 설문·퀴즈 × 문항별 가로/세로 조합 × 폭 400/620/900 레이아웃 393건 통과. git diff --check 통과.
- 상태: 관련 코드·문서·SQL을 이번 main 커밋에 포함하며 푸시 결과는 원격 브랜치로 확인한다. DB SQL 적용·실제 DB 왕복·브라우저 화면·데모 창 버튼 클릭/제출·배포는 미실행. 서버 배포 전에 기존 DB에 컬럼 추가 SQL 적용 필요.
- 후속(기존 DB 적용): 로컬 XE(`//localhost:1521/XEPDB1`, POPUP 계정)에 `05_question_option_layout_oracle.sql` 실행(`NLS_LANG=KOREAN_KOREA.AL32UTF8`, `WHENEVER SQLERROR EXIT FAILURE`). 실행 전 컬럼 없음 확인 → 실행 후 `OPTION_LAYOUT VARCHAR2(10 CHAR) NOT NULL DEFAULT 'VERTICAL'`, 제약 `CK_QUESTION_OPTION_LAYOUT`(VERTICAL/HORIZONTAL) 생성, 기존 문항 3행 모두 VERTICAL. **원격 개발 DB(192.168.114.71:4004/XE)는 TCP 연결 불가(VPN 미연결)로 미실행** — 연결 후 `sqlplus zero-rule/<pw>@//192.168.114.71:4004/XE @05_question_option_layout_oracle.sql` 실행 필요. 적용 후 서버 기동·실DB 왕복 테스트는 미실행. `db/oracle/README.md`에 적용 현황 기록.

## 2026-09-28-01 — 백엔드 독립형 WPF Client API 계약서 v3.0 정리

- 이유: 별도 백엔드가 기존 zero-rule-server 구현·DB·관리자 API를 재사용하지 않고 새로 구축되는 경우에도 제공되는 C# WPF 클라이언트와 연동할 수 있도록 인터페이스 문서의 책임 범위를 분리.
- 변경: `docs/interfaces/POPUP_INTERFACE_SPEC.md`를 v3.0으로 재구성. 관리자 API, DB 매핑, Java/Spring 내부 클래스, 기존 서버 설정·구형 WPF API 설명을 본문 계약에서 제거하고, WPF가 실제 사용하는 로그인·최종 팝업 조회·결과 일괄 전송 3개 API와 HTTP/JSON 규약만 남겼다. 백엔드가 활성·기간·대상·숨김·완료 판정을 끝낸 최종 목록을 반환해야 한다는 책임 경계를 명시하고, WPF의 로컬 QUIZ 채점·VIDEO 완료 판정·결과 큐 저장·재전송 규칙을 별도 절로 정리했다.
- 계약 보강: popupType별 TEXT/IMAGE/VIDEO/SURVEY/QUIZ content, popupPosition, IMAGE ADAPTIVE/FIT_TO_IMAGE/FILL 및 descriptionPosition/imageAreaRatio, 문항·정답 키, resultType, 결과 status, resultId 멱등 처리, 401 재인증 1회 재시도, 426 pending 보존 규칙, ENUM 요약과 신규 백엔드 구현 체크리스트를 포함했다.
- 기준 소스: `PopupApiService.cs`, `PopupResultQueue.cs`, `WpfLoginClient.cs`, `SsoAuthHeaderProvider.cs`, WPF DTO 및 `PopupFactory.cs`의 현재 main 구현을 기준으로 필드와 처리 흐름을 대조했다.
- 주요 파일: `docs/interfaces/POPUP_INTERFACE_SPEC.md`, `version-history/CHANGELOG.md`.
- 검증: 현재 main의 WPF 호출 경로·DTO·Factory·결과 큐 구현과 문서 내용을 대조. 문서 변경만 수행했으며 WPF 빌드, 서버 실행, 신규 백엔드 E2E 테스트는 수행하지 않음.
- 상태: 인터페이스 문서 변경 커밋 `218943c` main 반영 완료. 변경 이력까지 main에 반영하며 별도 배포 변경 없음.

## 2026-09-24-01 — 팝업 Oracle ERwin XML 초안 및 역공학 DDL 생성

- 이유: 현재 팝업 DB 구조를 ERwin에서 검토할 수 있는 교환 파일 준비. 기존 바이너리 모델은 현재 Oracle DDL과 자동 동기화되지 않음.
- 변경: Oracle 초기 DDL에서 팝업용 조직 마스터를 포함한 17개 테이블·229개 컬럼·PK 17개·FK 25개·UNIQUE 12개를 추출해 CA/신형 erwin 네임스페이스별 XML 초안 생성. 한글 논리명과 영문 물리명, 타입·NULL 여부·키 참조 포함. 삭제 후보와 템플릿 버전 컬럼은 보존. 전체 물리 정의용 역공학 SQL, 원본 해시·추출 결과 manifest, 재생성 스크립트와 안내 문서 추가.
- 주요 파일: `scripts/export-popup-erwin.cjs`, `ERD/model/popup_oracle_20260924_*`, `ERD/model/README_popup_oracle_20260924.md`.
- 검증: 생성기 실행 성공. 두 XML의 .NET XML 파싱, 객체 수, ID 중복 없음, 참조 해소, 추출 정의 대비 컬럼 타입·NULL 여부 대조 통과. `git diff --check` 통과. SQL에는 CHECK 50개·시퀀스 12개·인덱스 15개를 포함. DB 실행·접속은 하지 않음.
- 상태: 미커밋. ERwin 및 버전별 XSD가 없어 실제 가져오기 호환성 미검증. XML의 CHECK·기본값·ON DELETE는 설명으로 보존하며 전용 물리 메타모델 객체는 미구현; 전체 물리 정의는 동봉 SQL 기준. 다이어그램 배치 미포함. 기존 `.erwin` 파일과 애플리케이션·DB 변경 없음.

## 2026-09-23-05 — 단일 EXE 자동 업데이트 최하위 TODO 정리

- 이유: 런타임 포함 단일 EXE 교체와 서버 그룹별 순차 배포 방향을 후속 개선 과제로 보존하고 기존 반입·안정화 작업과 우선순위를 구분.
- 변경: 설계 17에 PowerShell 교체·백업·기동 확인·복구, MAJOR/MINOR/PATCH 기본 정책과 별도 긴급도, 그룹별 일정·재접속·재시도 분산, 트래픽 산정, 426 최소 버전과의 충돌 방지, 진행 중 팝업·미전송 큐 보존, CrashGuard·Mutex 연계, 검증 기준을 문서화. 설계 14에 P3(최하위·명시적 착수 요청 전 이행 금지), 설계 09에 후순위 링크 추가. 다른 TODO 완료·일반 개선/검증/배포 요청·방식 논의를 착수 근거로 삼지 않는 조건 명시. API 필드는 미구현 후보로 명시.
- 주요 파일: docs/design/17_WPF_단일_EXE_자동업데이트_TODO.md, docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md, docs/design/09_전환계획_및_미결사항.md.
- 검증: 기존 버전 검사·업데이트 안내·CrashGuard·Mutex 코드 및 TODO 우선순위 대조. 관련 문서 링크 존재, 세 문서의 명시적 착수 조건, 미완료 체크리스트 및 git diff --check 검증 통과. 문서 변경으로 빌드·실행 테스트는 수행하지 않음.
- 상태: 문서 작성, 기능 미구현·미착수. 이번 main 커밋에 포함하며 푸시 결과는 원격 브랜치로 확인한다. 이 작업에서 배포 변경 없음.

## 2026-09-23-04 — 주 모니터 팝업 표시 위치 옵션

- 이유: 부모 창 위치와 무관하게 주 모니터 지정 위치에 팝업을 표시하는 요구사항 반영.
- 변경: content.popupPosition으로 중앙 및 8방향 위치 선택. 누락·잘못된 값은 중앙. 관리자 웹 선택과 WPF 표시를 연결하고 순차·동시·이미지 크기 변경에 공통 적용. 전체 화면은 주 모니터 사용.
- 주요 파일: PopupOptions.cs, PopupFactory.cs, PopupManager.cs, PopupWindow.xaml.cs, PopupEditorDialog.tsx, docs/design/16_popup_position.md.
- 검증(WPF): 3모니터 환경(주 모니터 2560x1440, 작업 영역 2560x1392)에서 실제 WPF 창을 생성하고 Win32 GetWindowRect로 좌표 확인. 두 보조 모니터에 각각 부모 창을 배치하여 77개 검사씩 총 154개 통과. FIXED/RATIO/AUTO × 9개 위치, 창 크기 변경, 누락·null·숫자·미지원 값의 중앙 기본값, 대소문자·공백, PopupManager 순차/동시 표시, FULLSCREEN 주 모니터 전체 영역 확인. 검증 하네스는 로컬 .offline-verify/position에 보관(Git 제외). 주 모니터 배율 변경 검증은 미실행.
- 검증(웹): pnpm --filter @zerorule/web build 성공(타입 검사·페이지 생성 포함). 기존 파일의 lint 및 Next.js runtime config 폐기 예정 경고가 있으나 빌드 오류 없음. standalone 패키지를 임시 127.0.0.1:3107에서 실행해 /login/ 및 JS 정적 파일 HTTP 200 확인 후 종료. 실제 백엔드 저장·조회 왕복은 미실행.
- 배포(WPF): Release/win-x64/self-contained/single-file 게시 후 D:/work/PopupProject2026/dist/Popup.exe 갱신(85,666,721바이트). 기존 파일은 dist/Popup.before-position-20260923.exe로 백업. 게시본과 배포본 SHA256 일치: 55F930B61D4E18432277615C16C6CCB55C36749F8AA4B21A0981BADB8C620872. 배포본 --demo 기동 후 텍스트 버튼 실행, 실제 팝업 rect (790,286)-(1770,1106)이 주 모니터 작업 영역 중앙임을 확인하고 테스트 프로세스 종료. 최초 UI Automation 최상위 열거에서 소유 팝업이 누락되어 Win32 EnumWindows로 확인.
- 웹 패키지: D:/work/PopupProject2026/dist/admin-web-position-20260923 (standalone + static + public + start.cmd). 대상 서버 미지정으로 상시 웹 서비스 반영은 미실행. 기존 설정(API_BASE_URL 미지정)을 유지하며 실제 API 연동 시 해당 환경의 백엔드·프록시 필요.
- 상태: WPF 로컬 dist 배포 완료, 웹 배포 패키지 생성·기동 검증 완료. 관련 소스·문서·검증 이력을 이번 main 커밋에 포함하며 푸시 결과는 원격 브랜치로 확인한다. 배포 바이너리는 Git 제외 유지.

## 2026-09-23-03 — IMAGE 크기 모드 계약 정리(ADAPTIVE/FIT_TO_IMAGE/FILL), 트레이 재표시 작업 표시줄 복구

- 이유: `2026-09-23-02` 실행 검증에서 작은 팝업의 IMAGE ADAPTIVE가 이미지를 좌우로 자르는 것이 확인됐다. 원인을 추적한 결과 `imageSizeMode` 세 값이 "팝업 크기와 이미지 크기 중 무엇이 기준인가"를 다르게 정의하는데 WPF 구현이 그 구분을 지키지 않고 있었다. 함께 확인된 `RecommendedSizeChanged` 미구독 문제로 FIT_TO_IMAGE는 팝업 크기를 바꾸지 못하는 상태였다.
- 계약 확정: ADAPTIVE는 팝업 width/height가 기준이고 이미지는 배정된 영역 안에 맞춰지며 imageWidth/imageHeight는 최대 표시 크기로만 쓴다. FIT_TO_IMAGE는 imageWidth/imageHeight가 1순위이고 없으면 원본 크기를 쓴 뒤 그 결과로 팝업 크기를 재계산한다. FILL은 팝업 width/height가 기준이고 이미지가 영역을 꽉 채운다. 과거 값 FIXED는 ADAPTIVE와 동일하게 처리한다.
- 변경(크기 계산 분리): `ApplyAdaptiveLayout()`이 모드에 따라 경로를 나눈다. `TryApplyRequestedImageSize()`는 FIT_TO_IMAGE에서만 호출하고, ADAPTIVE는 신규 `ApplyAdaptiveImageSizing()`이 담당한다. 이전에는 모드와 무관하게 지정 크기가 먼저 절대값으로 적용돼, 지정 크기가 팝업이 내준 칸보다 크면 컨테이너가 칸을 넘쳐 잘렸다.
- 변경(ADAPTIVE): `PopupImage`·`ImageContainer`의 Width/Height를 해제하고 정렬을 Stretch로 되돌린 뒤, 신규 `ResolveAdaptiveMaximum()`으로 원본 크기와 요청 크기 중 작은 값을 MaxWidth/MaxHeight에 넣는다. 원본을 상한에 포함해 작은 이미지의 확대를 막는다. `ImagePopupView.xaml`의 `PopupImage` 기본 정렬도 Center에서 Stretch로 바꿨다 — Center이면 Uniform이어도 요소가 영역 크기와 무관하게 자기 크기를 유지해 넘친 부분이 잘린다.
- 변경(배치/크기 책임 분리): `ApplyLandscapeLayout()`·`ApplyPortraitLayout()`·`ApplySquareLayout()`에서 `PopupImage.MaxWidth/MaxHeight` 고정값(820x430 등)과 추천 팝업 크기 전달(920x680 등)을 제거했다. 배치 메서드는 행·열 구성과 여백만 담당한다.
- 변경(FIT_TO_IMAGE): 신규 `ApplyFitToImageGridSizing()`으로 이미지 칸을 Auto, 설명 칸을 팝업 크기 계산에 쓴 고정 값으로 맞춰 고정 크기 컨테이너가 비율 칸을 넘치지 않게 했다. `TryApplyRequestedImageSize()`에 작업 영역 90% 기준 축소를 추가했고(자동 계산 경로에만 있던 보정), `ApplyFitToImageSize()`의 세로형 판단을 비율 기준에서 `ResolveDescriptionPosition()` 기준으로 바꿔 배치와 크기 계산이 어긋나지 않게 했다.
- 변경(팝업 크기 반영): `PopupWindow`가 `ImagePopupView.RecommendedSizeChanged`를 구독한다. 이 이벤트는 저장소 어디에서도 구독되지 않아 FIT_TO_IMAGE 계산 결과가 버려지고 있었다. 핸들러는 `SizeToContent`를 Manual로 바꾼 뒤 `PopupOptions`의 Minimum/Maximum과 작업 영역 95%(설계 11과 같은 기준)로 보정해 적용하고 창을 다시 중앙에 맞춘다. FULLSCREEN은 제외한다.
- 변경(Demo Mode 창): `ShowMainWindowMenuItem_Click()`의 Demo 분기에서 `ShowInTaskbar`를 복구하고 최소화 상태도 되돌린다. `DemoWindow_Closing`이 창을 숨기며 `ShowInTaskbar=false`로 두기 때문에, X로 닫았다 트레이로 다시 연 Demo Mode 창은 화면에는 보이지만 작업 표시줄 버튼이 없었다. API 모드 분기에는 같은 복구가 이미 있었다.
- 문서: `docs/design/15_IMAGE_팝업_크기모드_정리.md` 추가. `ImagePopupContentDto`의 `ImageSizeMode`·`ImageWidth`·`ImageHeight` 주석을 확정된 계약으로 갱신(기존 주석은 FIXED/FIT_TO_IMAGE 두 값만 언급).
- 주요 파일: `popup-frameWork/Popup/Views/Contents/ImagePopupView.xaml(.cs)`, `popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs`, `popup-frameWork/Popup/Dtos/ImagePopupContentDto.cs`, `popup-frameWork/Popup/App.xaml.cs`, `docs/design/15_IMAGE_팝업_크기모드_정리.md`.
- 검증: `dotnet build popup-frameWork/Popup/Popup.csproj` 오류 0·경고 0. 로컬 `Popup.exe --demo`로 `DEMO-IMAGE-001`(팝업 FIXED 400x700, imageWidth 620·imageHeight 520, 원본 `Media/demo-image.jpg` 750x1030) 기준 세 모드 확인 — ADAPTIVE는 창 480x700 유지에 이미지 전체가 잘림 없이 표시, FIT_TO_IMAGE는 창이 938x712로 재계산·재중앙 배치되고 계산식(622+260+56, 522+190)과 일치, FILL은 창 480x700 유지에 이미지가 영역을 꽉 채움. FIT_TO_IMAGE·FILL은 데모 JSON의 `imageSizeMode`만 임시로 바꿔 확인한 뒤 되돌렸다(`git status` 기준 데모 파일 변경 없음). 트레이 재표시 후 창 확장 스타일에 `WS_EX_APPWINDOW`가 설정되고 작업 표시줄에 버튼이 표시되는 것도 확인.
- 미실행 검증: 외부 URL 이미지(다운로드 경로), VIEWPORT_RATIO·FULLSCREEN 팝업과의 조합, 폐쇄망 환경 재확인.
- 상태: main 반영.

## 2026-09-23-02 — IMAGE 설명 영역 분리·공통 배치 옵션 추가

- 이유: 작은 FIXED/VIEWPORT_RATIO 창에서 IMAGE ADAPTIVE 사용 시 이미지와 설명이 같은 가변 영역을 경쟁해 이미지가 좌우로 억지로 맞춰지는 것처럼 보이는 문제를 줄이고, 이미지 크기 모드와 설명 배치 정책의 책임을 분리.
- 변경(WPF DTO/모델): IMAGE content 공통 옵션 descriptionPosition(AUTO/RIGHT/BOTTOM, 기본 AUTO)과 imageAreaRatio(기본 0.75, 유효 범위 0.5~0.9) 추가. ImageDescriptionPosition 모델을 추가해 문자열 옵션을 화면 코드에서 직접 비교하지 않도록 구성.
- 변경(WPF 화면): ImagePopupView가 ADAPTIVE와 FIT_TO_IMAGE 모두 동일한 설명 배치 옵션을 사용하도록 변경. AUTO는 기존 의도대로 세로형(비율 <= 0.8)은 RIGHT, 그 외는 BOTTOM을 선택하고, 명시값은 이미지 비율과 무관하게 적용. 설명 표시 시 이미지/설명 영역을 imageAreaRatio로 먼저 분리하고 각 영역 안에서 이미지는 Stretch=Uniform으로 원본 비율을 유지. showDescription=false이면 설명 영역을 제거하고 이미지가 전체 영역을 사용.
- 변경(Demo Mode): IMAGE 샘플에 descriptionPosition: AUTO, imageAreaRatio: 0.75를 추가하고 설명 표시를 켜 공통 레이아웃을 바로 확인할 수 있게 변경.
- 호환성: 기존 JSON에 신규 필드가 없어도 AUTO/0.75 기본값으로 동작. FILL은 전체 배경형 전용 View라 설명 영역을 사용하지 않아 이번 옵션 적용 대상에서 제외.
- 주요 파일: popup-frameWork/Popup/Dtos/ImagePopupContentDto.cs, Models/ImageDescriptionPosition.cs, Views/Contents/ImagePopupView.xaml.cs, Factories/PopupFactory.cs, Services/DemoPopupDataService.cs.
- 검증: `dotnet build popup-frameWork/Popup/Popup.csproj` 성공(오류 0·경고 0). Demo Mode의 DEMO-IMAGE-001(팝업 sizeMode FIXED 400x700, 원본 `Media/demo-image.jpg` 750x1030 → 비율 0.728)을 로컬에서 실행해 확인 — AUTO가 의도대로 RIGHT로 해석되어 설명이 이미지 오른쪽에 배치되고 열 비율도 0.75/0.25로 적용됐다.
- 미해결(실행 중 확인된 이슈): 같은 조건에서 이미지가 좌우로 잘려 보인다. `TryApplyRequestedImageSize()`가 content의 `imageWidth`/`imageHeight`(620x520)를 `PopupImage.Width/Height`와 `ImageContainer.Width/Height`에 절대값으로 지정하는데, 이 적용이 레이아웃 계산 뒤에 일어나고 가용 폭으로 제한되지 않는다. 400폭 창에서 이미지 열은 약 300이라 622폭 컨테이너가 넘쳐 잘린다. `imageAreaRatio` 도입만으로는 해소되지 않으므로 지정 크기를 가용 공간 기준으로 축소하는 보정이 별도로 필요하다. 설명 열도 0.25 적용 시 약 75폭이라 문구가 3~4자 단위로 줄바꿈된다.
- 상태: main 반영.

## 2026-09-22-10 — 변경 이력 문체 규칙 적용(잔여 대화체 정리)·프로토타입 단계 역할 표현 기준 추가

- 이유: 2026-09-22에 정한 변경 이력 문체 규칙(AGENTS.md "변경 이력 문체")이 과거 항목 일부에 적용되지 않은 채 남아 있어 정리. 더불어 대화 주어를 걷어내는 과정에서 현재 존재하지 않는 역할(`운영 담당`)을 쓰는 문제가 드러나, 프로토타입 단계의 역할·환경 표현 기준을 규칙에 명시.
- 변경(`version-history/CHANGELOG.md`): 잔여 대화체 7곳을 기술 서술로 교체 — `2026-09-22-09` 이유·`.gitignore` 변경 사유, `2026-09-20-04` 이유, `2026-09-20-04` 검증의 작업 트리 표현, `2026-09-20-06`·`2026-09-20-05` 이유, `2026-09-20-05` 검증의 원격 DB 적용 문구. 요청 원문 인용 제거, 주체는 행위 중심 서술로 대체. 사실 관계·검증 결과·미실행 표시는 그대로 두었다.
- 변경(`AGENTS.md`): "변경 이력 문체" 절에 프로토타입 단계 기준 추가 — 개발자 1명·운영자 없음이므로 `운영 담당`·`운영 기준`·`운영 승인` 같은 없는 역할과 절차를 만들지 않고, 환경은 `로컬`/`원격 개발 DB`/`테스트`로 구분한다. `운영 토큰`·`운영 DB`처럼 장래 운영 환경을 가리키는 도메인 표현은 허용. 권장 이유 예시에서 `운영 기준 변경`을 빼고 `반입 준비`를 넣었으며, 같은 취지의 피함/권장 예시 한 쌍을 추가했다.
- 유지: `사용자 ID`, `사용자 식별 어댑터`, `사용자 모니터/PC`, `사용자가 기다리지 않도록`, `해당 사용자가 없습니다`처럼 시스템 도메인 용어로서의 "사용자"는 규칙대로 그대로 둔다(잔여 11곳).
- 검증: 문서만 수정했고 코드·설정 변경 없음(빌드·테스트 해당 없음). `git diff`로 두 파일의 변경 범위가 문구에 한정됨을 확인했고, 기존 항목에 `사용자 요청`·`사용자 지시`·`운영 담당` 표현이 남아 있지 않음을 검색으로 확인(이 항목이 규칙을 설명하며 인용한 것은 제외). 두 파일 모두 UTF-8·CRLF 유지.
- 후속(폐쇄망 반입 패키지 재생성): 기존 `offline-export/20260922/` 패키지가 커밋 `89e1e68` 시점 산출물이라 이후 변경(worktree 2개 병합분 + 이번 문체 수정)이 빠져 있어 현재 HEAD 기준으로 갱신했다. 갱신 파일 8개 — 4-docs: `AGENTS.md`, `version-history/CHANGELOG.md`, `db/oracle/README.md`, 신규 `db/oracle/04_popup_web_menu_oracle.sql`(MANIFEST-4-docs에도 추가) / 3-popup-frameWork: `VideoPopupContentDto.cs`, `PopupFactory.cs`, `VideoPopupView.xaml(.cs)` / 2-zero-rule-web: `PopupEditorDialog.tsx`. `1-zero-rule-server`·`5-offline-extention`·`6-offline-packages`는 변경 없어 기존 tar 그대로 재사용(SHA256 동일 확인). 두 README의 기준 커밋 표기를 `a37ff76`으로 갱신.
- 검증(패키지): `2·3·4-*.tar` 재생성 후 `SHA256SUMS.txt` 재작성 → `sha256sum -c` 6/6 OK. `popup-offline-20260922.tgz`(1~5, 189,582,119바이트)·`팝업프로젝트_초기세팅파일.tgz`(1~6, 289,577,340바이트) 재압축 후 구성 파일 목록이 이전과 동일함을 확인. 후자를 임시 폴더에 풀어 `sha256sum -c` 6/6 OK, 내부 4-docs·3-popup-frameWork·2-zero-rule-web의 갱신 파일 6개가 저장소 현재 내용과 바이트 단위로 일치함을 `cmp`로 확인. 미실행: 폐쇄망에서의 실제 빌드·반입.
- 상태: 문서 수정은 커밋 `a37ff76` 푸시 완료. 반입 패키지는 `.gitignore` 대상이라 저장소에 포함되지 않는다(로컬 `offline-export/20260922/`).

## 2026-09-23-01 — Demo Mode 관리 화면 재열기 예외 수정

- 이유: Demo Mode 선택 화면을 X 버튼으로 닫은 뒤 트레이의 "관리 화면 열기"를 선택하면, 이미 Close된 `DemoWindow` 인스턴스에 `Show()`를 다시 호출해 `InvalidOperationException`이 발생하는 문제 확인.
- 원인: API 모드 `MainWindow`는 `Closing` 이벤트에서 Close를 취소하고 `Hide()` 처리하지만, Demo Mode의 `DemoWindow`에는 같은 보호 로직이 없었다.
- 변경(WPF): `App.OnStartup()`에서 `DemoWindow.Closing`을 `DemoWindow_Closing`에 연결. 일반 X 버튼에서는 `e.Cancel=true` 후 `Hide()` 처리하고, 트레이의 실제 "종료"에서는 `_isExiting=true` 상태이므로 정상 Close되도록 구성.
- 영향 범위: 실서버/API 모드의 `MainWindow` 동작은 기존과 동일. 이번 예외는 Demo Mode 전용 경로에서 발생하던 문제를 수정.
- 주요 파일: `popup-frameWork/Popup/App.xaml.cs`.
- 검증: `dotnet build popup-frameWork/Popup/Popup.csproj` 성공(오류 0·경고 0). 로컬에서 `Popup.exe --demo` 실행 후 Demo Mode 창에 WM_CLOSE를 보내 X 버튼 경로를 재현했고, 창 핸들이 유지된 채 숨겨지며 프로세스가 살아 있음을 확인. 이어서 트레이 메뉴 `관리 화면 열기`로 같은 핸들의 창이 예외 없이 다시 표시되고 `이미지 팝업 열기`까지 정상 동작하는 것, 트레이 `종료`로 프로세스가 정상 종료되는 것을 확인.
- 후속 확인 필요: 재표시 경로에서 `ShowInTaskbar`가 복구되지 않는다. `DemoWindow_Closing`이 `ShowInTaskbar=false`로 두는데 `ShowMainWindowMenuItem_Click`의 Demo 분기는 `Show()`·`Activate()`만 호출해, X로 닫았다 다시 연 Demo Mode 창에는 작업 표시줄 버튼이 없다(재표시 후 확장 스타일에 WS_EX_APPWINDOW가 없음을 확인). API 모드 `_mainWindow` 분기에는 `ShowInTaskbar=true` 복구가 들어 있다.
- 상태: main 반영 완료.

## 2026-09-22-09 — worktree 브랜치 2개 main 병합, 확장 바이너리·worktree `.gitignore` 등록

- 이유: 미반영 변경과 미병합 브랜치가 남아 있는지 점검하고 저장소 상태를 정리. 확인 결과 main·두 worktree 브랜치 모두 작업 트리가 깨끗하고 origin과 동기화돼 있어 새로 푸시할 미커밋 변경은 없었고, 남은 것은 main에 병합되지 않은 브랜치 2개와 추적되지 않는 파일뿐이었다. 두 브랜치는 main에 병합하기로 결정했다.
- 병합 1 — `worktree-fix-start-dev-command-quote`(커밋 `6efc4fd`, 기록 2026-09-20-04): main에 이미 같은 `-Command` 괄호 수정이 들어가 있어 코드는 동일했다. `shell/start-dev.ps1` 주석만 충돌 — 파일의 다른 주석과 맞춰 한글 원인 설명을 남기고 영문본은 버렸다. 병합 커밋 `f9408ce`.
- 병합 2 — `worktree-popup-web-menu-data`(커밋 `497f1ad`·`f1eac89`·`4502089`, 기록 2026-09-20-05·-06): WPF·웹 코드(`PopupFactory`, `VideoPopupView.xaml(.cs)`, `VideoPopupContentDto`, `PopupEditorDialog.tsx`)는 main의 후속 작업(폰트 크기 `IBodyFontSizeAware`, QUIZ 정답 키)과 같은 파일을 건드렸으나 자동 병합됐다. 충돌 2건을 수동 해소: `db/oracle/README.md` 실행 순서 표에 `04_popup_web_menu_oracle.sql`·`04_cleanup_markdown_fields_oracle.sql` 두 행을 모두 두고 번호만 같고 서로 독립임을 주석으로 명시, `version-history/CHANGELOG.md`는 날짜별 순번 충돌(둘 다 2026-09-20-04)로 웹 메뉴 항목을 `-05`, 옵션 정합성 항목을 `-06`으로 재번호. 병합 커밋 `03da3b0`.
- 변경(`.gitignore`, 대용량 확장 바이너리·작업용 체크아웃 추적 제외): `offline-extention/`(VS Code 확장 `.vsix` 5개, 총 175MB — `ms-dotnettools.csharp` 하나가 131MB로 GitHub 파일 제한 초과), `.claude/worktrees/`(작업용 worktree 체크아웃) 추가. 두 경로 모두 커밋하지 않는다.
- 검증: WPF `dotnet build Popup/Popup.csproj -c Debug`(소스 `.offline-cache/packages`) 경고 0·오류 0. 웹 `npx tsc --noEmit -p main/tsconfig.json` 오류 0. `shell/start-dev.ps1` 파싱 오류 0. **미실행**: 병합된 기능의 실제 동작 확인(WPF 영상 재생 옵션 6개, 브라우저에서 숨김 일수 저장 왕복, 사이드바 "팝업 관리 > 팝업 등록" 표시), 서버 테스트, 웹 lint.
- 상태: main에 병합·커밋 후 origin/main 푸시. worktree 브랜치 2개는 삭제하지 않고 그대로 뒀다.

## 2026-09-22-08 — Word 인터페이스 정의서 v2.0 저장소 반입 (QUIZ 재채점 정책 반영)

- 이유: 설계 14 §1 "Word 인터페이스 정의서 최신화". `D:\work\PopupProject2026\docs\`에 전달된 v2.0 기준본(`WPF_Popup_API_Interface_Baseline_With_Admin_Content_Options.docx` — POPUP_INTERFACE_SPEC.md v2.0과 같은 구조·내용)을 저장소에 넣는다.
- 변경: `docs/interfaces/WPF_Popup_API_Interface_v2.0.docx` 추가. 기준본 `word/document.xml`에서 2026-09-22-07(QUIZ 미통과 시 창 유지·재채점, 통과 시에만 제출) 관련 문구 3곳만 텍스트 치환(4.2 WPF 처리 규칙, 4.3 score/passed 설명, 10 QUIZ 규칙). 구조·서식 변경 없음.
- 검증: 수정 후 `word/document.xml` XML well-formed 확인(PowerShell XmlDocument). 이 PC에 pandoc·LibreOffice·Word COM이 없어 렌더링 확인은 미수행 — Word에서 한 번 열어 확인 필요.
- 문서: 설계 14 P0 항목·상태 갱신.
- 상태: 커밋 `4a28283` (main) 푸시 완료.

## 2026-09-22-07 — QUIZ 미통과 시 창 유지·재채점 (통과할 때까지)

- 이유: QUIZ는 통과 시에만 닫고, 미통과 시 점수 안내 후 재응답할 수 있어야 한다는 요구사항 반영. 이전(2026-09-22-06)에는 미통과여도 답안을 제출하고 창을 닫았다.
- 변경(WPF): `PopupManager.SubmitSurveyResultAsync` — QUIZ `passed=false`면 점수·통과 점수 안내(MessageBox)만 하고 `return`(결과 생성·로컬 큐 저장·창 닫기 없음). 답안을 수정한 뒤 "채점"을 다시 실행할 수 있다. 통과(또는 SURVEY)일 때만 SUBMITTED를 큐에 저장하고 닫는다. 닫기 버튼으로 나가면 CLOSED만 전송되어 다음 조회 때 다시 노출된다(기존 동작). `SurveyPopupView` 주석 갱신.
- 변경(서버·웹): 없음. 결과 API 계약은 그대로이며 QUIZ SUBMITTED는 실제로 통과 점수 이상만 들어온다.
- 문서: 설계 12 §9 표, `popup-frameWork/README.md` §16, `POPUP_INTERFACE_SPEC.md` §3-A score 설명.
- 검증: `dotnet build Popup.slnx` 경고 0·오류 0. 실행 확인(미통과 → 창 유지 → 수정 → 통과 → 닫힘)은 미수행.
- 상태: 커밋 `191dca6` (main) 푸시 완료.

## 2026-09-22-06 — 설계 11·12·13·14 TODO 구현 (FIXED 방어, 결과 비동기·로컬 판정, 클라이언트 버전 검증, 폰트 크기, Services 폴더, 반입 패키지, 정의서 v2.0)

- 이유: 설계 11~14에 남아 있던 미수행 항목(코드 수정·반입 준비·정의서 최신화) 처리.
- **WPF 폴더 정리(설계 14 §5A)**: `git mv Popup/Service → Popup/Services`(namespace `Popup.Services` 그대로). README·정의서·설계 10/12/13의 경로 참조 갱신.
- **FIXED 화면 초과 방어(설계 11)**: `PopupWindow.ApplyWindowSize()` Fixed 분기 — WorkArea 95% 상한, 서버 Maximum 적용, Minimum > 상한 역전 보정, Window Min/Max도 보정값으로 재지정. 알 수 없는 SizeMode(default)도 Fixed 분기로 합류.
- **결과 제출 UX·로컬 판정(설계 12)**:
  - WPF: `PopupResultQueue` — `EnqueueAsync`(파일 저장만) / `FlushAsync` / `FlushInBackground`(예외 내부 처리)로 역할 분리, `EnqueueAndSendAsync`·`SendImmediateAsync` 삭제. `PopupOptions` 훅을 `EnqueueResultAsync`/`FlushResultsInBackground`로 교체(`ReportResult*` 삭제). `PopupManager` — 제출·닫기 모두 "로컬 큐 저장(await) → QUIZ 점수 안내 → 창 닫기 → 백그라운드 전송". `SurveyPopupView` — 필수 응답 검증 후 QUIZ는 새 `Services/QuizGrader`(서버 gradeAnswer와 같은 규칙: 선택 집합==정답 집합·EXACT/CONTAINS·부분 점수 없음, 구 데모 JSON correctAnswers 호환)로 즉시 채점, 이벤트 인자를 `Models/SurveySubmission`(answers/score/passed/passingScore)으로 변경, `passingScore` 매개변수 복원. DTO/모델에 `questionScore`/`correctAnswer`/`answerMatchMode`/`options[].isCorrect` 추가, `WpfResultItemDto.Score/Passed` 추가, `PopupResultBuilder.BuildSubmitted(SurveySubmission)`. `PopupFactory` — 정답 키·passingScore(최상위 우선, content 폴백) 전달. `DemoPopupGateway` — WPF가 보낸 score/passed 우선 사용. `MainWindow`/`DemoWindow` 훅 연결 교체.
  - 서버(popup 영역만): `WpfPopupService.getPopupsForUser` — `PopupService.loadQuestionsWithAnswerKey`(신규, admin=true 재사용)로 1회 조회 후 **QUIZ에만** 정답 키·최상위 `passingScore` 포함, 그 외는 `WpfPopupItem.withoutAnswerKey`로 제거. `WpfPopupItem`에 `passingScore` 필드·`from(dto, includeGradingInfo)`. `WpfResultRequest.Item`/`WpfResultCommand`에 `score`/`passed`(선택, 기존 9-인자 생성자 유지). `WpfResultProcessor.handleSubmitted` — 서버 저장 계산값과 WPF 값이 다르면 경고 로그만(재채점·거절 없음).
- **클라이언트 버전 서버 검증(설계 13)**:
  - WPF: `Popup.csproj` `<Version>1.0.0</Version>`(+Assembly/FileVersion), `Services/ClientVersion.cs`(InformationalVersion 읽기, `X-Client-Version`), `PopupApiService.SendWithAuthAsync`·`WpfLoginClient.LoginAsync`에 헤더 부착. 426 → `WpfClientVersionException`(401 재시도 경로와 분리) → `MainWindow.HandleClientVersionRejected`(주기 조회 중단, 업데이트 안내 1회, 수동 조회 시 재안내), `PopupResultQueue.FlushAsync`는 426이면 pending 보존·전파(`ClientVersionRejected` 이벤트), `SsoAuthHeaderProvider`는 로그인 426을 삼키지 않고 정기 재로그인 루프 중단.
  - 서버(신규 파일만, 공통 WebMvcConfig 미수정): `base/props/WpfClientVersionProps`(custom.wpf-client: latest-version / minimum-supported-version / require-header), `web/api/.../wpf/version/ClientSemver`(숫자 비교), `WpfClientVersionInterceptor`(/p/api/wpf/** 전용, 426 + `domain/.../WpfClientVersionErrorResponse` JSON), `WpfClientVersionWebConfig`(별도 WebMvcConfigurer). `application-common.yml`에 latest 1.0.0 / minimum 1.0.0 / require-header true.
- **폰트 크기(설계 14 §5)**: DB 컬럼 없이 content(CONTENT_OPTIONS)의 `headerFontSize`/`bodyFontSize`/`footerFontSize`(10~40, 없으면 기본). 웹 `PopupEditorDialog` "폰트 크기" 입력 3개(`PopupFontSizeField`, 비우면 null)·`PopupPreview` 반영. 서버 `PopupService.validateFontSizeOptions`(저장 시 범위 검사). WPF `PopupOptions.Header/Body/FooterFontSize` → `PopupFactory` → `PopupWindow.ApplyFontSizes`(Clamp; Header=제목, Footer=체크박스+닫기 버튼) → 본문은 새 `IBodyFontSizeAware`를 TEXT(본문 4개+LineHeight 비율)/IMAGE(설명)/VIDEO(설명)/SURVEY(선택지 상속 + 문항 제목 +4·설명 +1)가 구현.
- **폐쇄망 반입 준비(설계 14 §2·3·4·7)**: `scripts/export-offline-package.ps1` 신규 — A 문서 / B 서버(`git diff 0294d1e..HEAD`) / C 웹(`git diff f66e8ed..HEAD`) / D WPF 소스(bin·obj·publish·exe·dll·pdb 제외, 누출 검사) / E 개발 의존(옵션) 묶음·MANIFEST(A/M 상태)·README-IMPORT·zip 생성. `.gitignore`에 `offline-export/`.
- **인터페이스 정의서 최신화(설계 14 §1)**: `docs/interfaces/POPUP_INTERFACE_SPEC.md` v2.0 — §1.1 공통 헤더·인증 흐름, §1.2 WPF 오류(426 포함), §2 목록에 WPF2-00~02 추가·구형 표시, §3-A WPF2-00/01/02 IN/OUT 표·샘플, §3-B 구형 WPF-01~06 부록, §3-C 관리자, §5 폰트 크기 공통 필드, §6 정답 키 제공 범위·로컬 채점 규칙, §8·§9·§10 갱신. `api/examples/wpf-popups-response.json`(QUIZ isCorrect/passingScore/폰트 크기)·`wpf-results-request.json`(score/passed, 공통 헤더 주석) 갱신. **Word 기준본(.docx)은 이 PC·저장소에 없어 Word 파일 갱신은 미수행.**
- 문서: 설계 11·12·13·14 상태 절과 체크리스트 갱신, `popup-frameWork/README.md` §16·§17 흐름 갱신.
- 검증: `dotnet build Popup.slnx` 경고 0·오류 0. 서버 `gradle --offline :web:api:test --tests server.web.api.popup.wpf.* :service:core:test --tests server.service.core.popup.*` 55개 통과(DB 필요 2개 skip; 신규 `WpfClientVersionInterceptorTest` 8개, `WpfPopupServiceTest` SURVEY 정답 제거 케이스, `WpfPopupControllerTest` score/passed 전달 추가, `WpfPopupDatabaseTest` 기대값 갱신). RgstPop 8개 파일 한정 `tsc --noEmit` 오류 0. 예제 JSON 파싱 확인. 반입 스크립트 로컬 실행(A 34/B 87/C 4/D 79 파일, zip 생성) 확인.
- 미실행: WPF 실제 실행(FIXED 초과 값 화면, QUIZ 통과/미통과 안내, 네트워크 단절 pending, 426 안내, 폰트 크기 표시), 관리자 웹 화면 조작, 실제 서버 기동 E2E, 폐쇄망 PC `dotnet restore/build`, 원격 개발 DB 통합 테스트(`WpfPopupDatabaseTest`·`WpfApiOracleHttpTest`).
- 상태: 커밋 `78486d2`·`c83286b` (main) 푸시 완료.

## 2026-09-21-05 — TEXT 팝업 Markdown 모드 제거 (WPF·관리자 웹·예제·문서)

- 이유: TEXT 팝업에서 Markdown 기능을 사용하지 않기로 확정해 관련 코드와 의존성을 제거. TEXT 팝업은 콘텐츠 제목·설명, 일반 텍스트, 강조 문구, 하단 설명만 사용한다.
- 변경(WPF): `TextPopupView.xaml(.cs)` — 생성자 매개변수 `markdownMode`/`markdownContent`, `MarkdownPanel`, `RenderMarkdown`/`AddInlineMarkdown`(자체 렌더러) 삭제. `TextPopupContentDto` — `MarkdownMode`/`MarkdownContent` 삭제(서버 JSON에 남아 있어도 무시). `PopupFactory.CreateTextPopupView` 인자 정리. `DemoPopupDataService` — 데모 TEXT를 plainText/강조/하단 설명 구성으로 교체. `popup-frameWork/demo-text-notice.json`(markdown 데모, 코드 미참조) 삭제.
- 변경(관리자 웹, popup 영역): `PopupEditorDialog.tsx` — 기본 content의 markdown 필드, "Markdown 모드" 스위치, "Markdown 내용" 입력란 삭제(일반 텍스트·강조 문구 항상 표시). `PopupPreview.tsx` — `MarkdownView`·markdown 분기 삭제, `react-markdown`/`remark-gfm` import 제거. `main/package.json` — 두 의존성 제거(팝업 전용이었음, 다른 사용처 없음 확인). `pnpm-lock.yaml` — pnpm 9.15.2 `install --lockfile-only`로 재생성(삭제만 875줄, 추가 0줄; pnpm이 바꾼 무관한 glob deprecated 문구 1줄은 원복).
- 변경(서버): 없음 — content는 JSON 문자열로만 다루며 Java에 markdown 관련 코드 없음.
- 변경(예제·문서): `api/examples/wpf-popups-response.json`, `docs/interfaces/popup-interface-examples.json`·`POPUP_INTERFACE_SPEC.md`, `docs/design/03`, `db/oracle/02` 샘플 content JSON에서 두 필드 제거. `Popup/Docs/POPUP_OPTION_GUIDE.md`·`POPUP_USER_OPTION_GUIDE.md`·`POPUP_ADMIN_UI_GAP.md`, `ERD/STRUCTURE_REVIEW.md` 표기 갱신. 루트 설계본(`docs/03`, `api/examples`, `db/oracle/02`)도 동일 반영.
- 검증: `dotnet build Popup.slnx` 경고 0·오류 0. RgstPop 9개 파일 한정 `tsc --noEmit` 오류 0(전체 웹 type-check는 공통 MUI 타입 문제로 기존부터 미실행). `pnpm install --frozen-lockfile --offline` 성공(lockfile 정합). JSON 예제 파싱 확인. 소스 트리에 markdown 참조 없음(변경 이력·과거 검토표 제외). 미실행: 관리자 웹 화면 조작, 기존 DB에 markdownMode=true로 저장된 팝업의 표시 확인(해당 팝업은 plainText가 비어 있으면 본문이 비게 됨 — 운영 데이터 점검 필요).
- 상태: 커밋 `1a445ec` 푸시 완료(pull 시 CHANGELOG만 충돌 — 원격의 `2026-09-21-04` 항목과 번호가 겹쳐 이 항목을 `-05`로 조정, 코드 충돌 없음).
- **후속(DB 데이터 점검·정리)**: 로컬 XE `POPUP.POPUP_CONTENT` 4행 중 1행(`SAMPLE-TEXT-001`, `markdownMode:false` — 일반 텍스트 팝업)에만 두 필드가 남아 있어 JSON에서 필드만 제거(UPDATE 1행, COMMIT, 잔여 0행). `markdownMode=true` 팝업은 없음. 재실행 가능한 정리 스크립트 `db/oracle/04_cleanup_markdown_fields_oracle.sql`(인자: 스키마 접두어) 추가 — false 행은 필드 제거, true 행은 목록만 출력(삭제는 확인 후 수동). 로컬에서 재실행해 0행 확인. **원격 개발 DB(192.168.114.71)는 VPN 미연결로 미점검** — 연결 후 `sqlplus zero-rule/...@//192.168.114.71:4004/XE @04_cleanup_markdown_fields_oracle.sql ""` 실행 필요.
## 2026-09-22-05 — WPF Service 폴더와 namespace 정합성 TODO 추가

- 이유: 현재 물리 폴더는 `Popup/Service/`인데 namespace는 `Popup.Services`로 달라 IDE0130 스타일 진단과 소스 탐색 혼동이 발생할 수 있어 폐쇄망 반입 전 정리 필요.
- 문서 갱신: `docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md`
- 권장 방향:
  - 폴더 `Service` → `Services` rename.
  - 기존 namespace `Popup.Services`, `Popup.Services.Auth`는 유지.
  - csproj/README/스크립트/XAML 등 물리 경로 직접 참조 여부 확인.
  - rename 후 IDE0130 및 `dotnet build` 확인.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: TODO 반영 완료, 실제 폴더 rename은 후속 작업.

## 2026-09-22-04 — 폐쇄망 반입 및 WPF UI 보완 TODO 문서화

- 이유: 폐쇄망 반입 전 문서/Server/Web/WPF 소스 범위를 분리하고, 현재 확정된 후속 기능을 한 체크리스트로 관리하기 위함.
- 추가 문서: `docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md`
- 주요 내용:
  - 기존 Word 기준본 `WPF_Popup_API_Interface_Baseline_With_Admin_Content_Options.docx`를 현재 WPF 전용 API/결과 구조 기준으로 최신화하는 TODO.
  - zero-rule-server는 popup 관련 domain/mapper/service/web-api와 최소 공통 의존 파일만 선별 반입.
  - zero-rule-web은 popup 관리자 UI/도메인/API 관련 소스만 선별 반입.
  - popup-frameWork는 EXE/DLL/PDB/bin/obj/publish 제외, 소스/XAML/csproj/slnx/설정/필요 리소스만 반입.
  - .NET SDK/NuGet/VSIX 등 개발 의존성은 소스 반입물과 별도 패키지로 관리.
  - Header/Footer/본문 폰트 크기를 관리자 설정 → Server → WPF로 전달하는 옵션 추가 계획.
  - 폰트 크기 기본값/Clamp/기존 데이터 호환 정책과 적용 대상 정리.
  - FIXED 화면 초과, 비동기 결과 제출, 로컬 판정, Client Version 검증 등 기존 설계 TODO를 폐쇄망 반입 전 점검 항목에 포함.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: TODO 문서 main 반영 완료, 실제 반입 패키지/폰트 기능 구현은 후속 작업.

## 2026-09-22-03 — WPF 클라이언트 버전 서버 검증 계획 문서화

- 이유: 오래된 WPF 클라이언트가 서버 API를 호출해 DTO/API 계약 불일치나 필수 수정 미적용 상태로 동작하는 것을 방지하기 위함.
- 추가 문서: `docs/design/13_WPF_클라이언트_버전_서버검증_계획.md`
- 주요 내용:
  - 서버가 `latestVersion`, `minimumSupportedVersion`을 보유.
  - WPF는 주요 요청마다 `X-Client-Version` Header 전달.
  - 로그인 API 포함 최초 서버 접점부터 버전 검증.
  - 최소 지원 버전 미만 요청은 비즈니스 처리 전에 차단.
  - 버전 비교는 문자열이 아닌 숫자 버전 비교.
  - 권장 응답은 `426 Upgrade Required`.
  - 426은 401 재로그인 로직과 분리.
  - pending 결과 전송 중 426이면 결과를 삭제하지 않고 유지.
  - 실행 중 서버 최소 지원 버전이 변경돼도 다음 요청에서 즉시 검증.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: 문서 main 반영 완료, 코드 구현은 후속 작업.

## 2026-09-22-02 — WPF 결과 제출 UX 및 로컬 판정 구조 문서화

- 이유: 팝업 닫기/제출 시 서버 결과 API 응답 대기로 사용자가 기다리지 않도록 UI 처리와 결과 전송을 분리하기 위함.
- 추가 문서: `docs/design/12_WPF_결과제출_UX_및_로컬판정_수정계획.md`
- 주요 내용:
  - CLOSED/HIDDEN/VIDEO_WATCHED/SURVEY/QUIZ 결과는 서버 응답을 기다리지 않는 방향.
  - 결과는 먼저 `pending-results.json`에 저장한 뒤 창을 닫고 백그라운드에서 Flush.
  - 설문 필수응답 검증은 WPF에서 즉시 처리.
  - 퀴즈 점수/통과 여부는 WPF에서 즉시 계산.
  - 신규 입사자 안내 영상 수준의 시청 확인은 WPF의 로컬 시청 비율 판정 유지.
  - 현재 사용 범위에서는 서버 재채점/재검증은 구현하지 않고 결과 저장과 resultId 멱등성에 집중.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: 문서 main 반영 완료, 코드 구현은 후속 작업.

## 2026-09-22-01 — WPF FIXED 크기 화면 초과 방어 수정 계획 문서화

- 이유: FIXED 픽셀 크기가 사용자 모니터 작업 영역보다 크게 설정될 경우 Header/Footer/닫기 버튼이 화면 밖으로 밀리고, Topmost + Overlay 조합에서 사용자 PC 조작을 방해할 수 있는 위험 확인.
- 추가 문서: `docs/design/11_WPF_FIXED_화면초과_방어_수정계획.md`
- 주요 내용:
  - 현재 SizeMode별 화면 초과 방어 상태 정리(FIXED만 미방어).
  - `PopupWindow.ApplyWindowSize()`의 `PopupSizeMode.Fixed`에서 WorkArea 기준 최종 clamp 적용안.
  - `MinimumWidth/MinimumHeight > 화면 최대값`일 때 최소/최대 역전 방어.
  - 다중 모니터 및 DPI 단위 주의사항.
  - 정상/초과/Minimum 역전/Overlay+Topmost/회귀 테스트 항목 정의.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: 문서 main 반영 완료, 코드 구현은 후속 작업.

## 2026-09-21-04 — WPF 실행 흐름 README 및 소스 길잡이 주석 보강

- 이유: 전체 프로젝트 설명이 방대해 WPF(`popup-frameWork`)만 프로그램 실행 순서대로 따라볼 수 있는 입문 문서와 소스 내 길잡이 주석을 요청.
- 변경:
  - `popup-frameWork/README.md`를 WPF 전용 실행 흐름 문서로 확장. `App → MainWindow → SSO → 로그인 → API → PopupFactory → PopupManager → PopupWindow → ResultBuilder/Queue` 순서와 파일 역할표, 추천 소스 읽기 순서 추가.
  - 핵심 소스에 `[실행 순서]`, `[인증 흐름]`, `[401 복구 지점]`, `[결과 전송 흐름]` 주석 추가.
  - 주석 추가 파일: `App.xaml.cs`, `MainWindow.xaml.cs`, `SsoAuthHeaderProvider.cs`, `PopupApiService.cs`, `PopupFactory.cs`, `PopupManager.cs`, `PopupResultQueue.cs`.
  - 기능 로직·API 계약·설정값은 변경하지 않음.
- 참고: README와 인증 주석에 현재 코드와 확정 설계의 차이(자동 재로그인 시 SSO 재호출 부분)를 명시해 후속 수정 위치를 찾기 쉽게 함.
- 검증: 변경 내용은 README/주석만이며 실행 코드 변경 없음. GitHub main에 각 파일 반영 확인. 별도 빌드·실행 테스트는 미수행.
- 상태: main 반영 완료.
- 후속(검토 반영, 2026-09-21): ① `SsoAuthHeaderProvider` `[401 복구 지점]`·README §8의 "현재 구현은 재로그인마다 SSO 재호출 → 후속 수정 대상" 문장은 `4fe59aa`에서 이미 구현돼 낡았으므로 구현 상태로 정정. ② `[실행 순서 3/6]`이 비어 있어 인증 진입점(`GetAuthorizationHeaderAsync`) 주석을 `3/6 — 인증 흐름`으로 번호 부여. ③ README §1에 "SSO·로그인은 첫 GET popups 직전에 지연 실행" 한 줄, §4 `DevUserId`에 서버 프로토타입 모드에서 무시됨(설계 10 §14) 명시, 섹션 헤딩 레벨 통일(`## N.` / `### 파일`). 코드 동작 변경 없음, WPF 빌드 경고 0·오류 0.

## 2026-09-21-03 — WPF SSO 재로그인 정책 확정 및 설계 10 보완

- 이유: SSO·토큰 프로토타입 구현 검토 후 실제 운영 의도에 맞는 재인증 정책을 확정.
- 확정:
  - 실제 사내 SSO 응답의 `ks_c_5601-1987`/CP949 인코딩 처리는 폐쇄망 실연동에서 확인 후 필요 시 보강.
  - **SSO GET은 WPF 프로세스 시작 후 최초 1회만 수행**. 이후 토큰 만료(401) 및 1시간 정기 갱신은 메모리에 보관한 `MAIN_USER_ID`/`MAIN_USER_CLASSI_CODE`로 Zero 로그인 API만 재호출.
  - `DevUserId`/`X-Dev-User-Id` 유지 여부는 별도 의사결정 대기.
  - 로깅 제외 범위는 DB 이벤트·DISPLAYED/CLOSED·video-progress 호출이며, 개발 진단 로그와 `PopupResultQueue`는 유지.
- 변경(문서): `docs/design/10_WPF_SSO_토큰_프로토타입_계획.md`의 1시간 갱신/401 재로그인 흐름을 SSO 재호출 없는 구조로 수정하고, 확정사항 및 폐쇄망 실연동 확인 항목 추가.
- 코드 변경: 없음. 현재 `SsoAuthHeaderProvider.LoginAsync()`는 재로그인마다 SSO를 다시 호출하므로 후속 구현 수정 필요.
- 검증: 현재 main 소스와 설계 문서를 대조해 변경 대상 확인. 실행/빌드 테스트는 문서 변경만 수행하여 미실행.
- 상태: main 반영 완료.
- **후속(같은 작업, 구현 반영)**: `popup-frameWork/Popup/Service/Auth/SsoAuthHeaderProvider.cs` `LoginAsync()` — §14.1대로 `_lastUser`가 없을 때만 `SsoClient.GetUserAsync()`를 호출하고, 있으면 그 값으로 `WpfLoginClient.LoginAsync()`만 호출(401 재로그인·정기 갱신 모두). 진단 로그에 "SSO 호출/재호출 없음" 표시. 관리 화면 "SSO 로그인 테스트"(`TestLoginAsync`)는 §14.1 단서대로 매번 SSO GET 유지. 헤더 주석 갱신.
  - 검증(MockSso Negotiate + 로컬 XE + TTL 20초, exe 자동 조회): 시작 시 SSO GET **1회**(20:28:02, NTLM) → `auth/login` → `GET popups` 200 → TEXT 팝업. 26초 후 닫기 → `POST results` 401(만료) → **SSO 재호출 없이** `auth/login` → 같은 resultId 재전송 → 영수증 ACCEPTED(TEXT). 다시 26초 후 VIDEO 닫기 → 401 → `auth/login`만 → 재전송 → ACCEPTED(VIDEO). MockSso 로그의 GET은 프로세스 전체에서 1건. `dotnet build Popup.slnx` 경고 0·오류 0.
  - 미실행: 1시간 정기 갱신에서의 SSO 미호출(코드 경로는 401과 동일한 `LoginAsync`), 실제 사내 SSO 인코딩 확인(§14.2).

## 기록 규칙

- 수정 작업 한 건마다 항목을 추가한다. 같은 작업의 후속 수정은 해당 항목에 보완한다.
- 최신 항목을 위에 적는다. 기록 ID는 `YYYY-MM-DD-NN` 형식으로 날짜별 순번을 사용한다.
- 변경 이유, 실제 변경 내용, 주요 파일, 검증 결과, 커밋 및 미완료 사항을 기록한다.
- 확인만 한 내용은 실제 수정과 구분하고, 미실행·실패·건너뛴 검증을 명시한다.
- 배포 버전과 기록 ID는 별개다. Git 커밋을 소스 버전 기준으로 사용하고, 배포하지 않은 작업을 배포 완료로 기록하지 않는다.
- 비밀번호, 토큰, 개인정보는 적지 않는다.
- zeroserver/zeroweb 변경은 추가/수정/삭제로 분류해 기존 구조 변경 여부를 함께 적는다.

## 2026-09-21-02 — 임시 SSO 프로그램(C#, Negotiate)·WPF "SSO 로그인 테스트" 버튼 — 로그인까지 단독 테스트 가능

- 이유: SSO XML 수신·파싱부터 로그인 API까지 독립적으로 검증할 수 있는 임시 프로그램이 필요해 구현. 필드는 협의된 기준대로 `classCode`(XML `MAIN_USER_CLASSI_CODE`) 유지 — 중간에 `userId/groupId`로 바꿨던 서버 변경은 커밋 전에 되돌림(설계 10 그대로 `logonId`/`classCode`).
- 변경(WPF·도구):
  - [추가] `popup-frameWork/MockSso`(콘솔, `HttpListener`, 외부 패키지 없음 → 폐쇄망 SDK로 빌드) — 실제 SSO처럼 **Windows 통합 인증(Negotiate) 도전**을 하고(`--anonymous`면 도전 없음) `MAIN_USER_ID`·`MAIN_USER_CLASSI_CODE`(+진단용 `WINDOWS_USER`/`AUTH_TYPE`) XML을 돌려준다. `--user E1001|windows`, `--class A1`, `--port 8099`, `--fail`(항상 401). `Popup.slnx`에 추가.
  - [삭제] `shell/mock-sso.js`(node) — WPF PC에 node가 없을 수 있어 C#으로 대체. `start-dev.ps1 -MockSso`는 `dotnet run --project popup-frameWork/MockSso`를 띄우고 `-MockSsoClassCode` 인자 추가.
  - [추가] 관리 화면 `MainWindow.xaml` "SSO 로그인 테스트" 버튼 → `SsoAuthHeaderProvider.TestLoginAsync()`(`SsoLoginTestResult`): SSO GET(URL·파싱된 logonId/classCode·소요 ms) → 로그인 API(URL·요청 필드·tokenType·토큰 길이·expiresAt·소요 ms)를 MessageBox로 표시, 실패 시 예외 종류·메시지로 단계 구분. 성공 토큰은 현재 토큰으로 교체. `SsoClient.SsoUrl` 속성 추가.
  - [추가] `App.xaml.cs` 실행 인자 `--show-main` — 관리 화면을 트레이로 숨기지 않고 띄운 채 시작(테스트 버튼을 바로 누르기 위함). 인자 없으면 기존 동작.
- 문서: README(임시 SSO 실행·`--show-main`·테스트 버튼), `docs/design/04 §6`(도구 행; 루트 docs/04 동일), `09` 진행 상태.
- 검증:
  - `curl` 무인증 → 401(`WWW-Authenticate: Negotiate`), `curl --negotiate -u :` → 200 XML(AUTH_TYPE=NTLM) — 실제 사내 SSO에서 확인한 조건과 동일.
  - **WPF exe(`--show-main`) + MockSso(Negotiate) + 전체 서버(로컬 XE)**: 시작 시 `UseDefaultCredentials`로 NTLM 인증 후 XML 수신 → `auth/login` → 팝업 GET 200. UI Automation으로 "SSO 로그인 테스트" 클릭 → MockSso 로그에 두 번째 GET(NTLM), 서버에 두 번째 `auth/login`, MessageBox "SSO 로그인 테스트 — 성공"(MAIN_USER_ID=E1001, MAIN_USER_CLASSI_CODE=A1, 토큰 64자, expiresAt +10분) 스크린샷 확인.
  - `dotnet build Popup.slnx` 경고 0·오류 0. 서버 소스는 2026-09-21-01 커밋과 동일(변경 없음). `start-dev.ps1` 구문 검사 통과(`-MockSso` 창 실제 기동은 미수행 — MockSso.exe를 직접 띄워 검증).
  - 미실행: `--fail`·`--user windows` 옵션의 WPF 연동, 실제 사내 SSO URL.
  - **세션(토큰) 만료 재검증(MockSso Negotiate 구성 + 서버 TTL 20초, 로컬 XE)**: exe 옆 appsettings로 `AutoLoadOnStartup=false`, `--show-main`. ① "SSO 로그인 테스트"로 토큰 발급(20:24:38) → 25초 대기 → "팝업 다시 조회" → `GET popups` 401(서버 "토큰 만료") → SSO GET(NTLM) → `auth/login` 재발급 → `GET popups` 200·팝업 표시(사용자 조작 없음). ② 새 토큰 만료 후 TEXT 팝업 닫기 → `POST results` 401 → SSO GET → `auth/login` → **같은 RESULT_ID(07183dd6…)로 재전송 → `WPF_RESULT_RECEIPT` INSERT 1건 CLOSED/ACCEPTED**(RESULT_ID 조회 1회 = 중복 없음). 만료마다 SSO·로그인 각 1회. 검증 후 exe 옆 appsettings 삭제.
- 상태: 커밋 `95300ea` 푸시 완료. 만료 재검증 기록은 후속 커밋.

## 2026-09-21-01 — WPF SSO·토큰 프로토타입 (설계 10): 서버 로그인 API·메모리 토큰 검사, WPF SSO→로그인→Bearer·401 재로그인·정기 재로그인

- 이유: `docs/10_WPF_SSO_토큰_프로토타입_계획.md`의 후속 구현 진행. 운영 토큰(타 팀 통합 토큰) 구현이 아니라 **통신 형태와 `401 → 재로그인 → 원 요청 재전송` 동작을 검증하는 프로토타입**. 04 문서의 범위(타 팀)는 유지하며 서버 기본값은 꺼짐.
- 변경(서버, 모두 popup·WPF 영역 — 공통 프레임워크 파일 무변경):
  - [추가] `base/.../props/WpfAuthPrototypeProps` — `custom.wpf-auth-prototype.enabled`(기본 false), `token-ttl-minutes`(Duration, 단위 없는 숫자=분, 기본 10; `20s` 처럼 초 지정 가능).
  - [추가] `web/api/.../popup/wpf/auth/WpfPrototypeTokenStore` — JVM 메모리 `ConcurrentHashMap`, 토큰 = SecureRandom 32B + logonId + 발급시각의 SHA-256 hex(64자), 발급 시 만료 항목 정리, `Clock` 주입. `WpfAuthController` — `POST /p/api/wpf/auth/login {logonId, classCode, linkYn}` → `{accessToken, tokenType, expiresAt}`(진위 검증 없음, 필수 값만). `PrototypeTokenWpfUserResolver` — `WpfUserResolver` 구현, `@Primary` + `@ConditionalOnProperty(enabled=true)`: Bearer 없음/미등록/만료 → `WpfUnauthorizedException`(401 `WPF_UNAUTHORIZED`). `WpfLoginRequest`(payload)·`WpfLoginResponse`(domain, ISO 날짜).
  - [수정] `WpfApiExceptionHandler` — `assignableTypes`에 `WpfAuthController` 추가. `application-local.yml` — `custom.wpf-auth-prototype.enabled: true, token-ttl-minutes: 10`(로컬 전용; 켜지면 `X-Dev-User-Id`는 무시됨). `application-common.yml` — 주석만(값은 local에만 두는 이유 기재).
  - [테스트 추가] `WpfPrototypeTokenStoreTest` 4개(TTL 경계·미등록·재로그인 시 이전 토큰 유지·만료 정리), `WpfAuthPrototypeControllerTest` 4개(T1 로그인→Bearer→200, T2 만료→401→재로그인→200, 헤더 없음/Basic/모르는 토큰/개발 헤더만 → 401, 필수 값 검증 400).
- 변경(WPF):
  - [추가] `Service/Auth/SsoClient.cs` — `HttpClientHandler.UseDefaultCredentials=true`(+PreAuthenticate)로 SSO GET, XML에서 `MAIN_USER_ID`·`MAIN_USER_CLASSI_CODE`를 대소문자·네임스페이스 무시로 추출. `WpfLoginClient.cs` — 로그인 API 호출(자격 증명 미전송). `SsoAuthHeaderProvider.cs` — `IAuthHeaderProvider` 구현: 토큰 없으면 최초 로그인, `OnUnauthorizedAsync`는 `SemaphoreSlim` 안에서 "현재 토큰 == 401 받은 토큰"일 때만 재로그인(동시 401 → 1회), `PeriodicTimer` 정기 재로그인(실패 시 기존 토큰 유지), `Dispose`로 루프 정지·토큰 폐기. 토큰은 메모리 필드에만.
  - [수정] `IAuthHeaderProvider.OnUnauthorizedAsync(string? failedAuthorizationHeader, ct)` — 실패한 헤더 값을 넘기도록 시그니처 변경(구현체 없던 기본 메서드). `PopupApiService.SendWithAuthAsync` — 그 값을 넘기고 진단 로그 1줄(재시도 구조·body 객체 재사용은 그대로 → resultId 유지). `PopupClientSettings` — `AuthSsoUrl/AuthLoginPath/AuthPeriodicLoginMinutes`. `MainWindow` — `Auth.Mode=SsoPrototype` 분기(+정기 루프 시작), `OnClosed`에서 Dispose, SsoUrl 필수 검증. `appsettings.json` — `Mode: SsoPrototype`, `SsoUrl`(기본 로컬 모의 SSO `http://localhost:8099/...`), `LoginPath`, `PeriodicLoginMinutes: 60`.
- 변경(도구·문서): [추가] `shell/mock-sso.js` — SSO 모의 서버(node, 의존성 없음, `MOCK_SSO_USER_ID`/`MOCK_SSO_FAIL`). `shell/start-dev.ps1` — `-MockSso`(세 번째 창), `-TokenTtl '20s'`(백엔드 환경변수). 문서: `docs/design/10` 반입, `04 §6`(프로토타입 추가/수정 목록; 루트 docs/04에도 동일 반영), `09`(진행 상태 2026-09-21, 미결 2·9), README(진행 상태 행·서버 실행 안내).
- 검증:
  - 서버 전체 테스트(로컬 XE, `POPUP_TEST_DB_*`) **59개 통과·skip 0**(신규 8 포함).
  - 전체 zeroserver를 로컬 XE + `CUSTOM_WPF_AUTH_PROTOTYPE_TOKEN_TTL_MINUTES=20s`로 기동: 헤더 없음 401, `X-Dev-User-Id`만 → 401("Bearer 토큰이 필요"), 로그인 200(64자 hex, expiresAt +20s), 토큰으로 팝업 GET 200(E1001 실DB 목록), 21초 후 같은 토큰 401("만료").
  - **WPF Debug exe + 모의 SSO + 전체 서버 E2E**(서버 로그·모의 SSO 로그로 확인): T1 시작 → SSO GET 200 → `POST auth/login` → `GET popups` Bearer 200(로그인 UI 없음). T2/T3 토큰 만료 후 TEXT 팝업 닫기(UI Automation `FooterCloseButton`) → `POST popups/results` 401(서버 "토큰 만료") → SSO GET → `auth/login` 재발급 → **같은 RESULT_ID로 재전송 → `WPF_RESULT_RECEIPT` INSERT 1건 ACCEPTED**(중복 없음). T4 exe 옆 appsettings로 `PeriodicLoginMinutes=1` → 정확히 1분 뒤 401 없이 `auth/login` 재발급. 구 이벤트/영상 진행률 API(`/events`, `/video-progress`) 호출 0건(`/p/api/popups/video?path=`는 VIDEO 팝업의 WebView2 영상 파일 요청).
  - WPF `dotnet build` 경고 0·오류 0. `start-dev.ps1` 구문 검사 통과(`-MockSso` 창 실제 기동은 미수행 — 모의 SSO는 직접 `node`로 띄워 검증).
  - 미실행: T5 동시 401(코드의 `SemaphoreSlim`+토큰 비교로 설계, 동시 실행 테스트 없음), T6 앱 재시작, T7 SSO 실패(`MOCK_SSO_FAIL=1` 미실행), **실제 사내 SSO(Negotiate 도전) 연결**, 원격 개발 DB(VPN 미연결).
- 상태: 커밋 후 푸시 예정. 로컬 XE 검증 행(`WPF_RESULT_RECEIPT`·`USER_POPUP_STATUS` E1001)은 정리하지 않음(로컬 전용 DB).

## 2026-09-20-04 — `shell/start-dev.ps1` 백엔드 창 즉시 종료 수정 (-Command 인자 괄호 누락)

- 이유: `.\start-dev.ps1` 실행 시 백엔드 창이 `문자열에 " 종결자가 없습니다`(TerminatorExpectedAtEndOfString)로 바로 죽어 8080이 뜨지 않았고, WPF·프런트가 8080 연결 오류를 냈다.
- 원인: 백엔드 `Start-DevWindow` 호출의 `-Command 'Write-Host "DB: ' + $dbLabel + '...'` 가 괄호 없이 쓰여, PowerShell 인자 모드에서 `-Command`에는 `Write-Host "DB: ` 까지만 바인딩되고 나머지(`+`, `$dbLabel`, …)는 `$args`로 흘러갔다(함수에 CmdletBinding이 없어 오류 없이 통과). 새 창은 닫히지 않은 큰따옴표 명령을 받아 파서 오류로 종료. 첫 커밋 `ee7d5e9`부터 있던 결함이며 프런트 쪽은 이미 괄호를 쓰고 있었다.
- 변경(수정, `shell/start-dev.ps1` 83행): 인자를 `-Command ('...' + $dbLabel + '...')`로 괄호 묶음 + 원인 주석 추가. 그 외 변경 없음(공통 서버·웹 파일 무변경).
- 검증: 스크립트 파싱 오류 0. `Start-DevWindow` 바인딩 시뮬레이션에서 수정 전 `-Command`=`Write-Host "DB: ` + 잔여 인자 4개 → 수정 후 전체 명령 1개·잔여 인자 0·생성 명령 파싱 오류 0 확인. 실제 스크립트로 두 창을 다시 띄우는 것은 이 세션에서 미수행(별도 창 생성 필요) — 개발자 로컬 작업 트리에서 `.\shell\start-dev.ps1` 재실행으로 확인 필요.
- 상태: 브랜치 `worktree-fix-start-dev-command-quote`에 커밋(`6efc4fd`) 후 푸시. **2026-09-22 main 병합 완료** — main에는 이미 같은 괄호 수정이 영문 주석과 함께 들어가 있어 코드 변경은 동일했고, 병합 시 파일의 다른 주석과 맞춰 이 한글 주석만 남겼다.

## 2026-09-20-06 — 관리자 웹 등록 화면 옵션 정합성 점검 및 보완 (VIDEO 재생 옵션 WPF 적용, 숨김 일수 입력 추가)

- 이유: 관리자 웹 등록 화면에 노출된 옵션이 전부 실제로 적용 가능한지 정합성 점검하고, 누락된 옵션은 기능 보완. `PopupEditorDialog`의 옵션 하나하나를 서버 저장(`PopupService.toAdminSaveCommand`·`PopupMapper.upsert*`) → DB 컬럼/`CONTENT_OPTIONS` → 조회(`PopupContentAssembler`·`WpfPopupItem`) → WPF 소비(`PopupFactory`·각 View·`PopupWindow`·`PopupManager`)까지 대조했다.
- 점검 결과(확인만, 수정 없음 — 모두 끝까지 적용됨): 팝업 유형 5종 / 표시 방식·우선순위 / 노출 기간 / 크기 모드(FIXED·RATIO·FULLSCREEN)·너비/높이·비율·최소/최대 / 헤더·닫기·푸터·다시 보지 않기 / 활성화 / 배경 오버레이 사용·어둡기 / 대상 조건(부서·직급·사번·입사일, 연산자, 하위 부서 포함) / TEXT(제목·설명 표시, 일반 텍스트, 강조 문구, 하단 설명·URL, Markdown) / IMAGE(URL, 크기 모드 FIXED·FIT_TO_IMAGE·ADAPTIVE·FILL, 너비/높이, 클릭 URL, 설명 표시) / VIDEO(URL, 설명 표시, 완료 비율, 완료 전 닫기 허용) / SURVEY·QUIZ(문항 3종, 필수·채점·배점, 선택지·정답, 주관식 정답·비교 방식, 통과 점수, 템플릿 불러오기).
- 불일치 1 — **VIDEO 재생 옵션 6개가 WPF에서 무시됨**: `showControls`·`allowFullScreen`·`allowPlaybackRateChange`·`autoPlay`·`isLoop`·`defaultVolume`는 웹에서 편집·저장되고 서버가 `content`로 내려주며 `VideoPopupContentDto`까지 파싱되지만 `PopupFactory.CreateVideoPopupView`가 제목·URL·설명·설명 표시만 넘겨 전부 버려졌다(배속 UI 자체도 없었음).
  - 변경(수정, WPF `popup-frameWork/Popup`): `Factories/PopupFactory.cs` — 옵션 6개를 `VideoPopupView` 생성자로 전달. `Views/Contents/VideoPopupView.xaml(.cs)` — 생성자 매개변수 6개 추가 및 적용: 컨트롤 표시 꺼짐이면 컨트롤바를 어떤 경로에서도 띄우지 않고(`ControlBarVisibility` 헬퍼) 영상 클릭으로 재생/일시정지; 전체화면·배속 버튼은 허용 여부에 따라 열 자체를 접음; **배속 버튼 신설**(0.5→0.75→1.0→1.25→1.5→2.0 순환, `MediaElement.SpeedRatio`); 자동 재생 꺼짐이면 첫 프레임에서 일시정지; 반복 재생이면 `MediaEnded`에서 처음부터 재생; 기본 음량을 볼륨 슬라이더·음소거 복원값에 적용. 웹 플레이어는 HTML5 `<video>` 속성(`controls`/`autoplay`/`loop`/`controlsList nofullscreen·noplaybackrate`/`video.volume`)과 YouTube 파라미터(`autoplay`/`controls`/`fs`/`loop&playlist`)로 반영(YouTube는 음량·배속 허용을 URL로 제어할 수 없어 미적용). `Dtos/VideoPopupContentDto.cs` 주석 갱신. JSON에 키가 없을 때 기본값은 웹 편집기 기본 표시와 동일(autoPlay·isLoop 꺼짐, 나머지 켜짐, 음량 0.7).
- 불일치 2 — **숨김 일수(hideDays) 입력란 없음**: DB(`POPUP_NOTICE.HIDE_DAYS`)·서버 검증(1 이상)·WPF(다시 보지 않기 체크 시 `HIDDEN` 결과의 hideDays, 없으면 30일)는 지원하는데 웹은 항상 null로 저장했다.
  - 변경(수정, 웹 popup 파일): `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx` — 표시 옵션에 "다시 보지 않기 숨김 일수" 숫자 입력 추가(푸터+다시 보지 않기가 켜진 경우만 활성, 비우면 WPF 기본 30일 안내), 저장 시 1~3650 정수 검증(WPF 숨김 API 범위와 동일).
- 확인만(변경 없음): `periodMode`/`repeatInterval`/`repeatDayOfWeek`/`repeatDayOfMonth`는 화면에 노출되지 않는 숨은 필드(항상 `FIXED`)이며 서버 노출 판정·WPF 어디에서도 쓰이지 않는다 — 화면 옵션이 아니므로 이번 범위 밖. 웹 문항 유형은 TEXT/SINGLE_CHOICE/MULTIPLE_CHOICE 3종이고 WPF가 추가로 아는 RATING5는 서버 규칙(`PopupQuestionRules`)이 거절하므로 등록 불가(불일치 아님).
- 검증: WPF `dotnet build Popup.csproj -c Debug`(오프라인 캐시 `.offline-cache/packages`를 소스로 지정) 오류 0·경고 0, 산출 DLL 타임스탬프 확인. 웹 `tsc --noEmit -p main/tsconfig.json` 및 `eslint PopupEditorDialog.tsx` 통과(워크트리에 node_modules 정션을 임시로 만들어 실행 후 제거). **실제 WPF 실행·영상 재생 동작(자동 재생 꺼짐·반복·배속·컨트롤 숨김) 및 브라우저에서 숨김 일수 저장 왕복은 미확인.**
- 상태: 커밋 `4502089`(브랜치 `worktree-popup-web-menu-data`) 푸시 후 **2026-09-22 main 병합 완료**. 병합 시 main의 후속 작업(폰트 크기 `IBodyFontSizeAware`, QUIZ 정답 키 전달)과 같은 파일을 건드렸으나 자동 병합됐다. 원래 기록 ID는 `2026-09-20-05`였으나 같은 날짜 순번이 `shell/start-dev.ps1` 항목과 겹쳐 `-06`으로 조정했다.

## 2026-09-20-05 — 관리자 웹 메뉴 데이터: 팝업 관리 폴더(NAV)·그룹(SECTION)·팝업 등록 페이지 (`db/oracle/04_popup_web_menu_oracle.sql`)

- 이유: 관리자 웹 사이드바에 팝업 등록 화면용 폴더·그룹 메뉴 추가(기능 개발이 아닌 메뉴 데이터 추가). zero-rule-web 사이드바는 DB 메뉴(`CLOVER_USER.nav_id` → `CLOVER_NAV`(폴더) → `CLOVER_NAV_ITEM` → `CLOVER_PAGE_SECTION`(그룹) → `CLOVER_PAGE`)를 쓰는데, 팝업 등록 화면(`/rgst-pop`, `features/RgstPop`)은 scene-router에만 있고 DB 메뉴에 없어 사이드바에 나오지 않았다. 원격 개발 DB 조회로 확인: NAV 2개(1 기본, 2 관리자 메뉴), `/rgst-pop` 페이지 없음, 사용자 3명.
- 변경(추가, 공통 테이블 *데이터만*, 코드·구조 무변경): `db/oracle/04_popup_web_menu_oracle.sql` — 멱등 PL/SQL 블록(이름·url로 존재 확인 후 없는 것만 삽입, ID는 공통 `CLOVERFRAMEWORK_SEQ`, 11g 호환).
  - `CLOVER_NAV` "팝업 관리"(폴더), `CLOVER_PAGE_SECTION` "팝업 관리"(그룹, 아이콘 `FolderOutlined`), `CLOVER_PAGE` "팝업 등록"(`/rgst-pop`, `page_key` = 기존 숫자 키 최대값+1, 아이콘 `NoteAlt`).
  - `CLOVER_NAV_ITEM`: 새 NAV에 CLOVER 메인(sort 100, 다른 NAV와 동일한 첫 항목) + 그룹/팝업 등록(sort 200); 기존 "관리자 메뉴"(nav 2, master) 끝(sort max+100)에도 같은 그룹/팝업 등록 추가.
  - 되돌리기 SQL을 파일 끝 주석으로 둠. `db/oracle/README.md` 실행 순서 표에 4번 행과 "04 — 관리자 웹 메뉴 데이터" 절 추가.
- 검증: 로컬 XE 21c(`ZERO_RULE@XEPDB1`, 공통 테이블 존재·거의 비어 있음)에서 04를 2회 실행 — 1회차 NAV/SECTION/PAGE/ITEM 추가, 2회차 전부 "기존 사용"으로 중복 없음(멱등 확인; 로컬엔 CLOVER 메인 페이지·관리자 메뉴 NAV가 없어 해당 분기는 건너뜀). 원격 개발 DB(192.168.114.71) **조회**(NAV·SECTION·PAGE·NAV_ITEM·USER·시퀀스) 후 적용 대상·영향 범위를 확인하고 **원격 개발 DB에 04 실행 완료**.
  - 1차 실행은 `ORA-12899`(CLOVER_NAV.EXPL 100바이트 초과 — 원격 11g는 BYTE 의미, 한글 3바이트)로 블록 전체 실패(삽입 0건). NAV 설명을 'WPF 팝업 시스템 관리자 메뉴'로 줄여 재실행 → NAV 376030, SECTION 376031, PAGE 376032(`/rgst-pop`), NAV_ITEM 3건(새 NAV: CLOVER 메인 sort 100·팝업 등록 sort 200 / 관리자 메뉴 nav 2: 팝업 등록 sort 2300) 추가·COMMIT.
  - `page_key`는 원격의 'test' 페이지 키 `11111` 때문에 `11112`로 채번됨. 웹은 4자리 패딩 조회라 동작에는 영향 없음. 스크립트는 이후 실행을 위해 4자리 이하 숫자 키만 최대값 계산 대상으로 수정(원격 행 정정 `UPDATE clover_page SET page_key='27' WHERE url='/rgst-pop'`은 미수행). 참고로 원격에 `page_key='26'` 중복(이메일송수신정보조회·OKSY)이 기존부터 있음.
  - 실행 후 `master` 로그인 → 사이드바 "팝업 관리 > 팝업 등록" 표시와 `/rgst-pop` 진입은 브라우저 미확인.
- 상태: 커밋 `497f1ad`·`f1eac89`(브랜치 `worktree-popup-web-menu-data`) 푸시 후 **2026-09-22 main 병합 완료**. 원래 기록 ID는 `2026-09-20-04`였으나 같은 날짜 순번이 `shell/start-dev.ps1` 항목과 겹쳐 `-05`로 조정했다. `db/oracle/README.md` 실행 순서 표에는 main의 `04_cleanup_markdown_fields_oracle.sql` 행과 나란히 두고, 두 `04_` 스크립트가 서로 독립임을 주석으로 적었다.

## 2026-09-20-03 — 백엔드·프런트엔드 동시 실행 스크립트 보강 (`shell/start-dev.ps1`)

- 후속 2(같은 작업, 2026-09-21 커밋): 백엔드 창의 `-Command` 인자에 괄호가 없어 `'Write-Host "DB: '` 까지만 바인딩되고 나머지가 `$args`로 새어 새 창이 `TerminatorExpectedAtEndOfString`으로 실패(8080 미기동). 프런트 호출과 같이 괄호로 감싸 수정(스크립트 주석에 기록). 구문 검사 통과, 이번 세션의 서버는 같은 환경변수로 직접 기동해 확인.
- 후속(같은 작업): 첫 커밋 `ee7d5e9`에 전역 pnpm 7.29가 다시 쓴 `zero-rule-web/pnpm-lock.yaml`(lockfile 9.0 → 6.0, 의존성 버전 변동)이 딸려 들어갔음을 발견 → 원본으로 되돌림(공통 웹 파일 무변경). 원인 제거: 스크립트가 `package.json`의 `packageManager`(pnpm@9.15.2)를 `npx --yes`로 실행하고 `install --frozen-lockfile`을 쓴다(corepack 0.29는 서명 키 오류로 사용 불가). 9.15.2로 재설치 후 lockfile 무변경·프런트 기동·`API_BASE_URL` 주입 재확인. `README.md` "서버 실행"에 스크립트 안내 추가.

- 이유: 백엔드·프런트엔드 동시 실행 스크립트가 필요해 보강. 기존 스크립트는 경로만 바뀐 상태라 새 구조(원격/로컬 DB 전환, 팝업 스키마 설정, 프런트 API 주소)를 반영하지 못했고, 프런트 `.env`가 없어 `API_BASE_URL`이 비어 있었다.
- 변경(수정, `shell/start-dev.ps1`): 백엔드·프런트 창을 각각 띄우는 구조는 유지하고
  - 옵션 `-LocalDb`(로컬 XE: `ZERO_RULE_DB_URL/USER/PASSWORD` + `CUSTOM_POPUP_SCHEMA=POPUP`을 창 환경변수로), `-ApiBaseUrl`(기본 `http://localhost:8080/zero-rule-server`), `-RouterBaseUrl`, `-SkipBackend`, `-SkipFrontend`.
  - JDK 17을 `JAVA_HOME` 또는 `C:\Program Files\Java\jdk-17*`에서 찾아 창에 지정. 프런트 `node_modules`가 없으면 `pnpm install`을 먼저 실행.
  - 프런트 창에 `API_BASE_URL`·`ROUTER_BASE_URL` 환경변수 주입 후 `pnpm run dev --env-mode=loose`. **turbo 2.x는 strict env 모드**라 turbo.json에 선언되지 않은 환경변수를 `next dev`에 넘기지 않으므로 `--env-mode=loose`가 필요(turbo.json은 공통 파일이라 미수정). `pnpm run dev -- --env-mode=loose`처럼 `--`를 넣으면 turbo가 그 뒤를 next에 통째로 넘겨 효과가 없었다.
- 검증: 스크립트로 두 창 기동 → 백엔드 `http://localhost:8080/zero-rule-server`(원격 DB) 401/200, 프런트 `http://localhost:3000/login/` 200이며 페이지 runtimeConfig에 `API_BASE_URL=http://localhost:8080/zero-rule-server`, `ROUTER_BASE_URL=/` 포함 확인. 브라우저와 같은 조건(Origin `http://localhost:3000`)의 preflight 200·로그인 POST에 `Access-Control-Allow-Origin` 반환·서버가 원격 DB 조회 응답("해당 사용자가 없습니다"). `-LocalDb`·`-SkipFrontend` 조합 기동 확인. 실제 브라우저 로그인·화면 조작은 미수행.
  - 참고: 확인 초기에 preflight가 403(`Invalid CORS request`)으로 보였으나 서버 재기동 후 재현되지 않음(기동 중 요청 또는 이전 프로세스 잔존으로 추정, 설정 변경 없음).
- 상태: 커밋 후 푸시.


## 2026-09-20-02 — 원격 개발 DB(Oracle 11g XE) 연동: 매퍼 PG 잔재 점검, DDL 11g 호환, 팝업 스키마 한정자 설정화, WPF↔서버↔원격 DB 왕복 확인

- 이유: PostgreSQL 잔여 매퍼를 Oracle 기준으로 정리하고 WPF ↔ Java ↔ 원격 DB 연동까지 검증. 팝업 계정 분리 검토 중 앱 계정에 CREATE USER 권한이 없어 별도 사용자 생성 대신 스키마 분리 방식으로 확정.
- 확인(읽기):
  - 서버 매퍼 XML에 PostgreSQL 구문 없음(`nextval(`·`::`·`LIMIT`·`ON CONFLICT`·`RETURNING` 등 검색 — `PopupMapper.xml` 변환 규칙 *주석*에만 존재). cloverframework 3.0.3 내장 매퍼도 Oracle. nav는 프레임워크 `CLNavApiController`(`/apis/cloverframework/nav/*`)가 제공하고 zero-rule-web(`sub/domain/src/api-url.ts`)이 그 경로를 호출 → sample의 `/apis/nav/*` 서버 코드는 웹이 쓰지 않던 사본. 미결 16 해소.
  - 원격 개발 DB `192.168.114.71:4004/XE`: **Oracle 11g XE 11.2.0.2**(설계 가정 19c와 다름). 앱 계정 `zero-rule`: 공통 테이블 53개, 권한 CONNECT/RESOURCE(+CREATE TABLE/SEQUENCE…), **CREATE USER 없음**. `POPUP` 계정 없음. 팝업 객체 17테이블·12시퀀스·제약/인덱스 이름은 기존 175개 객체와 충돌 없음. `ojdbc8 23.5.0.24.07`·`ojdbc6 11.2.0.4` 모두 11g 접속·`nowKst` 쿼리 정상.
- 변경(DDL, `db/oracle/`): `01` — 11g 호환: 30자 초과 제약명 3개 단축(`UK_QTEMPLATE_GROUP_VERSION`, `CK_TCOND_INCLUDE_CHILD`, `CK_TCOND_CHILD_DEPARTMENT`), `CK_CONTENT_OPTIONS_JSON (IS JSON)` 제거(JSON 유효성은 Java), 헤더 "대상 11g XE 이상", `ALTER SESSION SET CURRENT_SCHEMA=POPUP` 주석 처리(실행 계정 스키마에 생성), 주석 안 세미콜론 제거(SQL*Plus가 문장 끝으로 오해 → ORA-00907). `02` — CURRENT_SCHEMA 주석 처리. `03` — 권한 대상 계정을 인자(`&1`)로 받아 큰따옴표 식별자로 사용(`ZERO_RULE` / `ZERO-RULE`). `00` — 원격 실행 안내.
- 변경(서버, 스키마 분리 설정화):
  - `repo/core/.../popup/PopupSchema.java` [추가] — 설정 `custom.popup.schema` → MyBatis 변수 `popupSchemaPrefix`("POPUP." 또는 ""). `PopupMapper.xml`·`WpfPopupMapper.xml` — `POPUP.` 67곳 → `${popupSchemaPrefix}`(상수 치환, 설정값만 사용).
  - `app/.../config/MyBatisConfig.java` [공통, 추가 4줄] — `@Value custom.popup.schema`(기본 POPUP) → `factoryBean.setConfigurationProperties(PopupSchema.variables(...))`. 다른 매퍼는 변수를 쓰지 않아 영향 없음. 공통 파일 수정은 이제 6개(모두 추가형).
  - `application-dev_db.yml` [공통, 추가] — `custom.popup.schema: ""`(원격 개발 DB는 앱 계정 스키마). 로컬 XE(POPUP 계정)로 띄울 때는 `CUSTOM_POPUP_SCHEMA=POPUP` 환경변수.
  - 테스트 6개 — `POPUP_TEST_DB_SCHEMA`(기본 POPUP, 빈 값 = 접속 계정 스키마)로 같은 변수 주입(`Configuration.setVariables` / `mybatis.configuration-properties.*`), `WpfApiOracleHttpTest` 정리 SQL 접두어 변수화, `WpfApiDevServer` 동일.
- 문서: `db/oracle/README.md`(11g·원격 적용 절차·스키마 배치 A/B·원격에서 부딪힌 것 5건), `README.md`(서버 실행: 기본 원격/로컬 환경변수, 진행 상태 행), `docs/design/05`(전제 11g·스키마 배치 행), `06`(공통 파일 6개), `09`(진행 상태 2차, 미결 1·16·17 해소).
- 검증:
  - 로컬 XE(POPUP 계정, 접두어 "POPUP."): 서버 테스트 50개 통과·skip 0 (변경 후 회귀 확인).
  - 원격 11g에 `zero-rule`로 `01`·`02` 적용: 테이블 17·시퀀스 12·주석 37·샘플 36행 (`NLS_LANG=KOREAN_KOREA.AL32UTF8` 필요 — 없으면 한글 주석 따옴표가 깨져 ORA-01756. 1차 실행에서 7개 문장 실패 후 실패분만 재적용, COMMENT 37개는 UTF-8로 전부 덮어씀).
  - 원격으로 `cleanTest` 후 popup 테스트 38개(service:core 34 + app HTTP 4) 통과·skip 0 — 시퀀스 진행값(`SEQ_API_REQUEST_LOG` 101 등)으로 실제 원격 실행 확인, E1002 정리 확인.
  - **전체 zeroserver를 기본 설정(JNDI → 원격 11g, 접두어 "")으로 기동** → `PK_BATCH_NODE` 오류 없음(정식 공통 스키마). `/p/api/wpf/popups` 무헤더 401, E1001 200(팝업 4건).
  - **WPF Debug exe(`BaseUrl=localhost:8080/zero-rule-server/p`, `DevUserId=E1001`) 실행 → UI Automation으로 TEXT 팝업 "9월 시스템 점검 안내" 닫기(`FooterCloseButton`) → 서버 로그 `GET popups`·`POST popups/results` → 원격 DB `USER_POPUP_STATUS`(CLOSED, 표시 1회, 표시·닫힘 시각)·`WPF_RESULT_RECEIPT`(CLOSED/ACCEPTED)·`API_REQUEST_LOG`(200) 기록 확인.** 다음 팝업(VIDEO) 창 표시 확인. 로그 SQL `INSERT INTO WPF_RESULT_RECEIPT`(한정자 없음)로 설정 반영 확인. 검증 행 3건 삭제, 원격은 샘플만 남음.
  - 미수행: 관리자 웹 화면, VIDEO/SURVEY/QUIZ 팝업의 WPF 조작(자동화 범위 밖 — 서버 측은 HTTP 테스트로 커버), 운영 DB.
- 상태: 커밋 후 푸시 예정.


## 2026-09-20-01 — 서버 공통 베이스라인을 업스트림 zero-rule-server Oracle 버전으로 교체, popup 재적용, 전체 서버 Oracle 기동 확인

- 이유: Oracle 기준 zero-rule-server 업스트림(`git.labcl.net/clover/zero-rule-server` @`56bb0c5`)에 맞춰 정합성과 설정 정보를 재정리. 공통 영역은 기존 동작을 유지하고 추가·분기 방식으로만 반영. 기존 sample 서버는 PostgreSQL 전용 프레임워크라 전체 기동이 불가했음(미결 15).
- 정합성 확인(읽기): 업스트림은 Spring Boot 3.4.1 / Java 17 / cloverframework `3.0.3-SNAPSHOT`(repo.labcl.net 접근 확인) / 공통 매퍼 13개 Oracle SQL. 공통 보안·설정 파일(`SecurityConfig`·`CustomAuthenticationFilter`·`DefaultPublicUrls`·`MyBatisConfig`·`BasicConfig`·`WebMvcConfig`)은 기존과 내용 동일. popup 코드가 의존하는 공통 클래스는 `ApiBaseController`·`CLNewApiResponse` 뿐. 업스트림에 없는 것: popup/WPF 71개(우리 추가분), `nav` 기능 26개(sample 전용).
  - 처음 전달된 버전(`zero-server`, Spring Boot 2.7 / Java 8 / `/zero-server` 컨텍스트)은 다른 제품 계열이라 제품 계열이 다른 것으로 확인되어 두 번째 전달본으로 교체 후 진행.
- 변경(교체, 커밋 `0294d1e`): `zero-rule-server-main/` 제거 → `zero-rule-server/`(업스트림 원본 그대로). 업스트림 클론의 `.git`은 `zero-rule-server/.git-upstream-56bb0c5/`로 이름만 바꿔 보관(.gitignore). `.idea/`도 ignore. `.gitignore` 경로 갱신.
- 변경(재적용, 추가): popup·WPF 소스 71개(`domain/popup/**`, `repo/.../popup/**`, `service/.../popup/**`, `web/api/.../popup/**`, `base/props/WpfPopupProps`, 테스트 12개, `samples/popup-video-range/README.md`)를 이전 커밋에서 그대로 복원.
- 변경(공통 파일, 모두 추가형·분기):
  - `app/src/main/java/server/app/config/JndiResource.java` — 환경변수 `ZERO_RULE_DB_URL/USER/PASSWORD` 우선 분기 추가(없으면 업스트림 개발 DB 값 그대로). 드라이버(log4jdbc)·JNDI 이름 등 업스트림 유지. 이전 판의 `ALTER SESSION SET TIME_ZONE`은 popup 매퍼가 `SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul'`로 세션 시간대와 무관하므로 넣지 않음.
  - `application-common.yml` — `custom.wpf-popup.polling-interval-seconds` 추가. **`dev-user-header: false`는 넣지 않음**: 전체 서버 기동 확인에서 `X-Dev-User-Id`가 무시됨 → 활성 프로파일 순서가 `local, common, springdoc, dev_db`라 common 값이 local의 `true`를 덮어쓰는 것이 원인. 기본값(false)은 `WpfPopupProps`가 가지므로 local에만 `true`를 둔다(주석에 기록).
  - `application-local.yml` — `popup.video.*`, `custom.wpf-popup.dev-user-header: true` 추가.
  - `service/core/build.gradle.kts` — `jackson-databind` 추가(PopupContentAssembler·PopupService). `app/build.gradle.kts` — `wpfDevServer` 태스크 재추가(주석을 "공통 DB 접속 불가 환경용"으로 수정).
- 문서·스크립트: `README.md`(베이스라인 교체 설명, 디렉터리·진행 상태 표, "서버 실행" 절 신설), `docs/design/06`(헤더·공통 파일 5개 명시), `docs/design/09`(진행 상태 2026-09-20, 미결 15 해소, 미결 16 nav·17 로컬 BATCH_NODE 추가), `db/oracle/README.md`·`docs/interfaces/POPUP_INTERFACE_SPEC.md`·`shell/start-dev.ps1` 경로 `zero-rule-server-main` → `zero-rule-server`. 01·02 설계 문서와 과거 이력의 옛 경로는 역사 기록으로 그대로 둠.
- 검증:
  - `gradlew compileJava compileTestJava -Pprofile=local` 성공(JDK 17, Gradle 8.11.1, cloverframework 3.0.3-SNAPSHOT 원격 해석).
  - 서버 테스트 50개 통과·실패 0·skip 0 (`service:core` 34, `web:api` 12, `app` 4 — 실DB `PopupQuestionDatabaseTest`·`WpfPopupDatabaseTest`·HTTP `WpfApiOracleHttpTest` 포함, 로컬 XE `XEPDB1`).
  - **전체 zeroserver 기동**: `ZERO_RULE_DB_*`=로컬 XE로 `:app:bootRun -Pprofile=local` → `Started App`. 공통 `CustomAuthenticationFilter`를 거쳐 `GET /p/api/wpf/popups` 무헤더 401, `X-Dev-User-Id: E1001` 200(팝업 4건), `POST /p/api/wpf/popups/results` CLOSED → ACCEPTED, 재전송 → DUPLICATE. 검증 행(USER_POPUP_STATUS·WPF_RESULT_RECEIPT·API_REQUEST_LOG)은 sqlplus로 삭제.
  - 기동 로그에 `CLOVER_BATCH_NODE` INSERT `ORA-00001` 1건 — 로컬 공통 스키마(PG DDL 변환본) 이슈, 동작 영향 없음(미결 17). 개발 DB `192.168.114.71:4004`는 이 PC에서 접속 불가라 미확인.
  - WPF exe 실연동·관리자 웹은 이번에 재실행하지 않음(서버 API 계약 변경 없음).
- 상태: 커밋 후 푸시 예정. nav 기능 반입 여부는 별도 결정 대기.


## 2026-09-19-10 — 서버 확인: 실제 HTTP+Oracle 통합 테스트, 팝업 슬라이스 개발 서버, WPF 실연동

- 이유: Oracle 위에서 신규 WPF API를 실제 HTTP로 검증하고 WPF exe까지 연결해 서버 연동 상태를 확인한다.
- 확인된 제약: 전체 zeroserver를 Oracle로 기동하면 `SELECT nextval('cloverframework_seq')`(cloverframework_mappers/CLSequenceMapper.xml)에서 `ORA-00923` — 저장소의 zero 프레임워크가 `clover-* 0.0.1-POSTGRE-SNAPSHOT`이고 공통 매퍼 13개(`repo/core/mappers/*.xml`, popup 제외)도 PostgreSQL 전용. 공통 프레임워크 Oracle 빌드는 타 팀/운영 소관 → 미결 15로 기록. 공통 스키마 DDL은 참고용으로 변환해 둠(`db/oracle/10_zero_rule_common_schema_oracle.sql`, `tools/convert-zero-rule-ddl.pl`, ZERO_RULE에 53개 테이블·54 PK/UK·12 시퀀스 적용 성공).
- 변경(추가): `app/src/test/.../wpf/WpfApiOracleHttpTest.java` — 팝업·WPF 빈만 올린 `@SpringBootTest(RANDOM_PORT)` + 실제 Oracle: 401/403 코드, 목록(사용자 판정·ISO 날짜·정답 비노출·content.questions 제거), 결과 5항목(HIDDEN·SURVEY 완료·VIDEO 완료·대상 외 REJECTED·DUPLICATE)이 항목별 커밋(영수증 3·로그 1)되고 이후 목록이 비는 것, 400 코드. E1002 데이터 자동 정리. `WpfApiDevServer`(테스트 소스) + Gradle 태스크 `:app:wpfDevServer` — 같은 슬라이스를 8080으로 실행.
- 변경(수정): WPF 응답 DTO 5개에 `@JsonInclude(NON_NULL)` 명시 — 전역 BasicConfig 설정 없이도 계약 유지(HTTP 테스트에서 `totalScore: null` 노출로 발견). `app/build.gradle.kts` 태스크 추가(기존 빌드 설정 변경 없음).
- 주요 파일: app/src/test/java/server/app/wpf/*, app/build.gradle.kts, domain/.../popup/wpf/*.java, db/oracle/10_*.sql, db/oracle/tools/*, db/oracle/README.md, docs/design/09.
- 검증: 서버 테스트 50개 통과·skip 0(HTTP 통합 4 포함). `:app:wpfDevServer` 기동 후 `curl`로 목록 200/무헤더 401 확인. **WPF Debug 빌드(실서버 모드, DevUserId=E1001)를 붙여 UI Automation으로 첫 팝업(TEXT) 닫기 → Oracle `USER_POPUP_STATUS`(CLOSED, 표시 1회, 표시·닫힘 시각)·`WPF_RESULT_RECEIPT`(ACCEPTED)·`API_REQUEST_LOG`(200, accepted=1) 기록, 다음 팝업(VIDEO) 표시 확인.** 테스트 행 정리, 서버 종료.
- 상태: 커밋 후 푸시.

## 2026-09-19-09 — WPF 방어 로직: 전역 예외 처리·크래시 로그·자동 재시작

- 이유: 트레이 상주 프로그램이 처리되지 않은 예외로 죽으면 이후 팝업이 뜨지 않고 미전송 결과 큐도 멈춘다.
- 변경: `Service/CrashGuard.cs` 신규 — `DispatcherUnhandledException`(로그 후 Handled=true, 프로세스 유지·안내), `TaskScheduler.UnobservedTaskException`(로그·SetObserved), `AppDomain.UnhandledException`(로그 후 같은 인자로 자동 재시작, 10분 내 3회 제한, `--restarted` 인자). 로그 `%LOCALAPPDATA%\Popup\logs\crash-yyyyMMdd.log`. `App.OnStartup` — `CrashGuard.Install` 최우선 호출, `--restarted`이면 단일 인스턴스 Mutex 획득을 5초간 재시도(죽어 가는 부모와의 경합 대비).
- 주요 파일: popup-frameWork/Popup/Service/CrashGuard.cs, App.xaml.cs.
- 검증: 빌드 경고 0·오류 0. `--demo --restarted`로 기동 확인, 두 번째 인스턴스 즉시 종료 확인. 실제 예외 유발 경로(강제 크래시)는 미검증. 재게시 `dist/Popup.exe`.
- 상태: 커밋 후 푸시.

## 2026-09-19-08 — VIDEO 전체화면을 팝업 창이 있는 모니터에 표시

- 이유: 시연 중 확인된 이슈. 전체화면 창이 `WindowState.Maximized`만 지정되어 기본 위치(주 모니터/마지막 활성 모니터)에서 최대화되므로, 팝업이 보조 모니터에 있어도 전체화면은 다른 모니터에 떴다.
- 변경: `VideoPopupView.EnterFullScreen` — 팝업 창 HWND로 현재 모니터(`Forms.Screen.FromHandle`)를 구해 `WindowStartupLocation.Manual` + 그 모니터 영역으로 Left/Top/Width/Height 지정, `SourceInitialized`에서 `SetWindowPos(HWND_TOPMOST, 물리 픽셀 영역)`로 정확히 맞춤. `Topmost=true`(팝업·Overlay와 동일 층). `WindowState`는 Normal 유지.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs.
- 검증(UI Automation): Demo Mode에서 비디오 팝업을 열고 창을 오른쪽 모니터(3200,300)로 이동 후 전체화면 버튼 실행 → 전체화면 창 rect `(2560,0)-(5120,1440)` = 해당 모니터 전체. 빌드 경고 0·오류 0. 재게시 `publish/win-x64/Popup.exe`·`dist/Popup.exe`. 고DPI(150%) 모니터에서의 전체화면은 미검증.
- 상태: 커밋 후 푸시.

## 2026-09-19-07 — WPF 시연 피드백 반영: 창 목록 1개·팝업 항상 최상위·Overlay 수정

- 이유: 시연 결과 (1) 작업 관리자·작업 표시줄에 창이 여러 개 보임, (2) 배경을 누르면 팝업이 뒤로 가림, (3) 설문 시 메인 모니터에 배경(Overlay)이 안 보임.
- 변경:
  - `PopupWindow.xaml` — `ShowInTaskbar="False"`, `Topmost="True"`. `PopupManager` — 팝업은 Overlay 사용 여부와 무관하게 항상 Topmost, `Deactivated` 시 재확인, 열린 창 집합(`_openWindows`) 관리, Overlay 클릭 시 `BringPopupsToFront()`.
  - `BackgroundOverlayManager` — Overlay 창에 `WS_EX_NOACTIVATE|WS_EX_TOOLWINDOW`, `WM_MOUSEACTIVATE → MA_NOACTIVATEANDEAT`(클릭은 삼키되 활성화 안 함 → 팝업 z-순서·포커스 유지), 제목 비움·소유자 지정(앱 창 목록 제외), Show/Loaded 뒤 `SetWindowPos`로 모니터 영역 재적용, `BackgroundClicked` 이벤트. **`AllowsTransparency=true` 추가** — 원본은 이 설정이 없어 `Opacity`가 무시되고 Overlay가 완전 불투명(검정)으로 떴음(실행 캡처로 확인).
  - 팝업 위에 뜨는 `MessageBox` 전부에 팝업 창을 owner로 지정(Topmost 팝업 뒤에 숨지 않도록): `PopupManager`, `PopupWindow`, `SurveyPopupView`, `ImageFillPopupView`, `TextPopupView`.
- 주요 파일: popup-frameWork/Popup/Managers/BackgroundOverlayManager.cs, Managers/PopupManager.cs, Views/Windows/PopupWindow.xaml(.cs), Views/Contents/SurveyPopupView.xaml.cs, ImageFillPopupView.xaml.cs, TextPopupView.xaml.cs.
- 검증(UI Automation으로 Demo Mode 실행·설문 팝업 열기·창 열거·화면 캡처, 3모니터 환경): Overlay가 3개 모니터(주 모니터 (0,0)-(2560,1440) 포함) 모두에 생성되고 툴창·NOACTIVATE·Topmost 확인. 주 모니터 배경 클릭 후에도 `PopupWindow`가 z-순서 최상단·포그라운드 유지. Overlay 어둡기: 흰 배경 픽셀 250→137(≈0.55, 설정 0.45 반영), 수정 전에는 순흑(불투명). 재게시 `publish/win-x64/Popup.exe`·`dist/Popup.exe`. **(3)의 "설문 시 메인 모니터 Overlay 미생성"은 수정 전 빌드로도 재현되지 않았고**(모든 모니터에 생성됨) 원인이 불투명 Overlay 또는 창 소유 관계로 추정되어 위 수정으로 함께 대응. 작업 관리자 목록은 자동 확인 불가 — 수동 확인 필요.
- 상태: 커밋 후 푸시.

## 2026-09-19-06 — WPF Demo Mode 재구성(결과 흐름 시뮬레이션) 및 단일 exe 게시

- 이유: 기존 Demo Mode는 샘플 팝업만 띄우고 결과를 버렸다. 새 구조(기준 3·4)의 핵심인 "종료 시 결과 항목 1회 전송"을 서버 없이도 확인할 수 있게 하고, 배포용 exe를 만든다.
- 변경(추가): `Service/IPopupGateway`(목록·결과 2개 메서드 추상화, `PopupApiService`가 구현), `Service/DemoPopupGateway`(인메모리 서버: 숨김·완료 상태 유지·다음 조회 제외, QUIZ는 샘플 JSON `correctAnswers`로 채점, SURVEY 즉시 완료, VIDEO 비율 판정, DUPLICATE, `ResultProcessed` 이벤트).
- 변경(수정): `PopupResultQueue` 생성자를 `IPopupGateway`로. `DemoWindow.xaml/.cs` — 실제 모드와 같은 `PopupResultQueue`·훅을 쓰고 오른쪽에 결과 요청/응답 JSON 로그, "서버 상태 초기화"·"로그 지우기" 버튼, 숨김·완료 카운트. `MainWindow` — 실행 인자 `--demo`로 Demo Mode 활성(설정 파일 수정 불필요). README에 실행·게시 방법.
- 주요 파일: popup-frameWork/Popup/Service/IPopupGateway.cs, DemoPopupGateway.cs, PopupResultQueue.cs, PopupApiService.cs, DemoWindow.xaml(.cs), MainWindow.xaml.cs, README.md.
- 검증: `dotnet build` 경고 0·오류 0. `dotnet publish`(Release, win-x64, self-contained, single-file) → `popup-frameWork/publish/win-x64/Popup.exe` 82MB(Git 제외, 사본 `D:\work\PopupProject2026\dist\Popup.exe`). 게시본을 `--demo`로 실행해 8초 후 프로세스 생존·창 제목 `Popup Demo Mode` 확인 후 종료. **팝업 버튼 클릭·결과 로그 표시·퀴즈 채점 등 화면 조작은 미검증**(자동화 불가, 수동 확인 필요).
- 상태: 커밋 후 푸시. 게시 결과물은 커밋하지 않음.

## 2026-09-19-05 — [단계 1] Oracle 스키마 실제 적용 및 실DB 검증

- 이유: 로컬 Oracle 21c XE(system 계정) 확보. 기준 5의 DDL과 단계 2~5의 매퍼·서비스를 실DB로 검증.
- 변경(DB): `db/oracle/00_create_schema_oracle.sql`(POPUP·ZERO_RULE 사용자 생성)·`03_grant_zero_rule_oracle.sql`(ZERO_RULE에 POPUP DML·시퀀스 권한) 신규, `db/oracle/README.md`(실행 순서·테스트 방법·실DB 특이사항). `01_popup_schema_oracle.sql`에서 UNIQUE 제약과 같은 컬럼의 인덱스 2개(`ix_question_template`, `ix_option_question`) 생략 — Oracle `ORA-01408`.
- 변경(서버): `KstTimestampTypeHandler` — null도 `setNull(Types.TIMESTAMP)`로 바인딩(`Types.NULL`은 CHAR로 추론되어 `COALESCE(?, TIMESTAMP)`에서 `ORA-00932`). `PopupQuestionDatabaseTest` Configuration에 `jdbcTypeForNull=NULL`(운영 mybatis-config와 동일, 없으면 `ORA-17004`). 신규 `WpfPopupDatabaseTest`(실DB 롤백 전용: 사용자 3명 기대 목록, HIDDEN/SUBMITTED QUIZ·SURVEY/VIDEO_WATCHED/DUPLICATE, 완료·숨김 제외, 구 WPF-01 계약 유지, 대상 외 REJECTED, 요청 로그).
- 변경(문서): `docs/design/05` §7 검증 결과, `docs/design/09` 진행 상태, README 단계 표.
- 주요 파일: db/oracle/00·01·03·README, zero-rule-server-main/repo/core/.../KstTimestampTypeHandler.java, service/core/src/test/.../PopupQuestionDatabaseTest.java, service/core/src/test/.../wpf/WpfPopupDatabaseTest.java.
- 검증: XEPDB1에 `POPUP` 스키마 적용(테이블 17·시퀀스 12·인덱스 15·주석 37·샘플 36행, 한글·`IS JSON` 정상). `ZERO_RULE` 계정에서 POPUP 테이블 조회·시퀀스 사용 확인. `POPUP_TEST_DB_PASSWORD` 설정으로 `:service:core:test :web:api:test` 46개 통과·skip 0. 롤백 후 잔여 행 0 확인(status/response/receipt/log). **zeroserver 기동·WPF HTTP 실연동은 미수행** — 공통 `ZERO_RULE` 스키마(PostgreSQL DDL만 존재)가 Oracle에 없어 앱이 뜨지 않으며, 이는 기준 범위(popup DB) 밖.
- 상태: 단계 1 완료. 커밋 후 푸시.

## 2026-09-19-04 — [단계 6] WPF 클라이언트를 신규 API(조회 1 + 결과 1)로 전환

- 이유: 기준 2(서버 판정 목록 그대로 렌더링), 3(API 2개), 4(종료 시 1회 전송·실시간 제거), 6(userId 미전송, 인증 헤더 확장 지점).
- 변경(추가): `Service/Auth/IAuthHeaderProvider`(+None/Static 구현) — Authorization 헤더 공급 확장 지점(SSO·통합 토큰은 타 팀, 지금은 동작 불필요). `Service/PopupResultQueue`(로컬 파일 큐 `%LOCALAPPDATA%\Popup\pending-results.json`, 즉시 전송·flush·항목 종결 시 제거), `Service/PopupResultBuilder`(창 생명주기 → 결과 항목 1개, resultId 창 생성 시 확정), `Dtos/WpfPopupListResponseDto`, `Dtos/WpfResultDtos`.
- 변경(수정): `PopupApiService` — `GetWpfPopupsAsync`·`PostResultsAsync`·`SendWithAuthAsync`(헤더 부착·401 1회 재시도·WPF 오류 JSON 해석), 생성자에 헤더 공급자·개발용 `X-Dev-User-Id`. 기존 6개 메서드는 호출부 없이 유지. `MainWindow` — UserId 제거, 시작·조회 전 큐 flush, 서버 `pollingIntervalSeconds` 우선, `HasOpenPopups`면 조회 건너뜀, `/statuses`·완료 필터 제거. `PopupManager` — 콜백 5개를 `PopupResultBuilder` 기반 결과 수집으로 교체(제출은 즉시 전송 후 QUIZ 통과/미통과·REJECTED 안내), `HasOpenPopups` 추가. `PopupOptions` — 콜백 → `ReportResultAsync`/`ReportResultImmediateAsync`, `DoNotShowAgainChecked`/`HideDays`/`PopupType`. `PopupWindow` — 숨김 API 직접 호출 제거, `OnClosing`에서 체크 기록, 완료 전 닫기 금지 판단을 `VideoPopupView.HasReachedCompletion` 로컬 추정으로. `VideoPopupView` — 10초 진행률 저장 타이머·`VideoProgressSaveRequested` 제거, `GetFinalProgress()`·`HasReachedCompletion()` 추가. `SurveyPopupView` — 로컬 퀴즈 채점(`CalculateScore`·`AreAnswersEqual`·`_passingScore`) 제거(서버 채점). `PopupFactory` — 최상위 `questions` 우선(없으면 `content.questions` 호환), `PopupType`·`HideDays` 전달. `PopupService` — 로컬 정책 제거. `PopupClientSettings`·`appsettings.json`·`launchSettings.json` — `UserId`/`POPUP_USER_ID` → `Auth.Mode/StaticHeader`, `DevUserId`/`POPUP_DEV_USER_ID`, 폴링 기본 1800.
- 변경(삭제): `Service/PopupPolicyService.cs`, `Service/PopupStorageService.cs`.
- 변경(문서): `docs/design/07` 구현 결과 요약 추가, `Popup/Docs/POPUP_OPTION_GUIDE.md` §8 신규 API 안내.
- 주요 파일: popup-frameWork/Popup/{MainWindow.xaml.cs, Managers/PopupManager.cs, Models/PopupOptions.cs, Models/PopupClientSettings.cs, Factories/PopupFactory.cs, Service/*, Dtos/Wpf*.cs, Views/Windows/PopupWindow.xaml.cs, Views/Contents/VideoPopupView.xaml.cs, Views/Contents/SurveyPopupView.xaml.cs, appsettings.json, Properties/launchSettings.json}.
- 검증: `dotnet build Popup.csproj -c Debug` 경고 0·오류 0 (SDK 10.0.400). 저장소 `NuGet.config`는 폐쇄망 오프라인 소스만 가리키고 nupkg는 저장소에 없어 `--source https://api.nuget.org/v3/index.json`으로 복원함(설정 파일 변경 없음). csproj의 WebView2 1.0.3124.44와 `OFFLINE_WPF_BUILD.md`의 1.0.4078.44가 베이스라인부터 불일치 — 미수정, 미결로 기록. **실서버 연동·화면 동작·데모 모드 실행은 미검증.**
- 상태: 단계 6 코드 완료. 다음 단계 7(관리자 웹 SURVEY 채점 입력 숨김, 선택) 및 실DB·실연동 검증.

## 2026-09-19-03 — [단계 3~5] 신규 WPF API: 사용자 식별 어댑터·조회 API·결과 API

- 이유: 기준 2(서버 노출 판단·완료 제외), 3(조회 1개 + 결과 1개 API), 4(종료 시점 1회 전송), 6(토큰 기준 사용자 식별, 토큰 자체는 타 팀).
- 변경(추가 21개 소스 + 테스트 3개):
  - `GET /p/api/wpf/popups`, `POST /p/api/wpf/popups/results` — `WpfPopupController`, `WpfApiExceptionHandler`(WPF 컨트롤러 한정 {code,message,timestamp}), 요청 DTO `WpfResultRequest`(본문 userId 무시).
  - 사용자 식별 어댑터 `WpfUserResolver` + `SecurityContextWpfUserResolver`(기본, 통합 토큰 필터 결과 사용·매핑 TBD) + `DevHeaderWpfUserResolver`(`custom.wpf-popup.dev-user-header=true`일 때만, `X-Dev-User-Id`).
  - `WpfPopupService`(목록 조립·결과 일괄·요청 로그), `WpfResultProcessor`(항목 REQUIRES_NEW, CLOSED/HIDDEN/SUBMITTED/VIDEO_WATCHED를 기존 `PopupService.hidePopup/submitResponse/saveVideoProgress`에 위임, `WPF_RESULT_RECEIPT` 멱등), `WpfPopupMapper`(+XML: mergeDisplayAndClose·countActiveUser·selectStatus·countReceipt·insertReceipt·insertApiRequestLog).
  - 도메인 DTO `server.domain.popup.wpf.*` 10개 (날짜는 `@JsonFormat` ISO 8601 — 전역 epoch 설정 미변경). `WpfPopupProps`(base/props).
- 변경(popup 소스 수정): `PopupMapper.selectAvailablePopups(userId, excludeCompleted)` + 호환 default, `PopupMapper.xml`에 `<if test="excludeCompleted"> OR COMPLETED_YN='Y'`, `PopupService`에 public `loadPublicQuestions`·`toPublicResponseDto`.
- 변경(설정): `application-common.yml` `custom.wpf-popup`(polling 1800, dev-user-header false), `application-local.yml` dev-user-header true.
- 변경(문서): `docs/design/06` 구현 반영 전면 갱신, `docs/design/03` REJECTED 코드 목록.
- 주요 파일: web/api/.../popup/wpf/*, web/api/.../payload/popup/wpf/WpfResultRequest.java, service/core/.../popup/wpf/*, repo/core/.../WpfPopupMapper.java·.xml, domain/.../popup/wpf/*, base/.../props/WpfPopupProps.java.
- 검증: `:service:core:test` + `:web:api:test` 45개 통과·1개 skip(실DB). 신규 `WpfResultProcessorTest`(7)·`WpfPopupServiceTest`(3)·`WpfPopupControllerTest`(4, MockMvc)·`PopupMapperOracleStatementTest`(+1: WPF 매퍼 바인딩·cross-namespace include·excludeCompleted 동적 SQL). `:app:compileJava` 통과. **Oracle 실DB·실연동 미검증.** 프레임워크 파일(SecurityConfig·필터·MyBatisConfig·WebMvcConfig·BasicConfig) 미수정.
- 상태: 단계 3~5 코드 완료. 통합 토큰 필터 적용 후 `SecurityContextWpfUserResolver` 매핑 확정 필요. 다음 단계 6(WPF 클라이언트).

## 2026-09-19-02 — [단계 2] 서버 popup 매퍼·데이터소스 Oracle 전환

- 이유: 기준 5(PostgreSQL popup 스키마 → Oracle). 관리자 API와 기존 WPF API가 Oracle POPUP 스키마에서 동작하도록 매퍼를 변환한다. popup 관련 소스는 이번 개발 범위에서 추가된 코드이므로 구조 수정을 허용하고, 프레임워크 파일은 접속 값·드라이버 토글만 바꿨다.
- 변경(popup 소스):
  - `PopupMapper.xml` 27개 구문 Oracle 변환 — RETURNING→selectKey(시퀀스), ON CONFLICT→MERGE, AT TIME ZONE→FROM_TZ, CURRENT_TIMESTAMP→공통 조각 `nowKst`, boolean 바인드 `= 1`, TO_CHAR/TO_DATE, CLOB jdbcType, WITH 재귀 컬럼 목록, BOOL_AND→MIN=1. 구문 ID·파라미터 유지. 콘텐츠 JSON은 SQL 조립을 제거하고 컬럼 6개를 반환.
  - `PopupMapper.java` — 키 반환 5개 메서드를 Map 파라미터 추상 메서드 + 기존 시그니처 default 어댑터로 분리(PopupService 호출부 변경 없음).
  - `PopupEntity` — `contentJson` 대신 콘텐츠 컬럼 6개 필드. `PopupService` — `PopupContentAssembler`로 content 조립, `parseContentJson` 제거.
  - 신규 `PopupContentAssembler`(원본 JSONB 조립 규칙 재현), `KstTimestampTypeHandler`(OffsetDateTime→KST TIMESTAMP 바인드).
  - `PopupQuestionDatabaseTest` 대상 DB를 Oracle(POPUP, SAMPLE-SURVEY-004)로 변경.
- 변경(프레임워크, 최소): `JndiResource` JNDI 데이터소스를 Oracle 드라이버·URL·계정(환경변수 우선)으로, 세션 TIME_ZONE 초기화 SQL 추가. `app/build.gradle.kts`·`service/core/build.gradle.kts` PostgreSQL→ojdbc 토글.
- 변경(DDL·문서): `db/oracle/01_popup_schema_oracle.sql`의 `DEFAULT SYSTIMESTAMP` 33곳을 KST 고정식으로. `docs/design/05` §3·§6·§7을 구현 결과로 갱신.
- 주요 파일: zero-rule-server-main/repo/core/src/main/resources/mappers/popup/PopupMapper.xml, repo/core/.../PopupMapper.java, repo/core/.../KstTimestampTypeHandler.java, domain/.../PopupEntity.java, service/core/.../PopupService.java, service/core/.../PopupContentAssembler.java, app/.../JndiResource.java, app/build.gradle.kts, service/core/build.gradle.kts, db/oracle/01_popup_schema_oracle.sql, docs/design/05_Oracle_DB_설계.md.
- 검증: `:app:compileJava` 등 전체 컴파일 통과. `:service:core:test --tests server.service.core.popup.*` 21개 통과·1개 skip — 기존 `PopupAdminQuestionsTest`(7)·`PopupQuestionRulesTest`(5) 회귀 없음, 신규 `PopupMapperOracleStatementTest`(4: 매퍼 메서드↔구문 1:1, selectKey keyProperty, 레코드 속성 경로, PG 문법 잔존 0)·`PopupContentAssemblerTest`(5). **Oracle 실DB 실행은 미수행**(로컬에 Oracle 없음). 관리자 웹·기존 WPF 실연동 미검증.
- 상태: 단계 2 코드 완료. 실DB 검증은 단계 1(스키마 적용) 환경 확보 후 `POPUP_TEST_DB_PASSWORD` 설정으로 `PopupQuestionDatabaseTest` 실행 예정. 커밋 후 푸시.

## 2026-09-19-01 — proto 저장소 베이스라인 구성 및 설계 문서 반입

- 이유: `WPF_WindowsPopupWithC_proto`를 개선 개발 저장소로 지정. sample 저장소 최신 소스(커밋 db0cc4c)를 베이스라인으로 두고 그 위에 설계(docs/design)에 따른 변경을 쌓기 위함.
- 변경: sample의 `zero-rule-server-main`, `zero-rule-web`, `popup-frameWork`, `ERD`, `docs/interfaces`, `scripts`, `shell`, 빌드 설정을 복사. 대용량 바이너리(offline-sdk exe, nupkg, dist)와 `popup-api/`(폐기), PG 데이터 스냅샷 2개, IDE 캐시는 제외하고 `.gitignore`에 추가. 설계 문서 9개와 기준 파일을 `docs/design/`, Oracle DDL·샘플을 `db/oracle/`, 신규 WPF API JSON 예제를 `api/examples/`에 반입. 저장소 README 신규 작성.
- 주요 파일: README.md, .gitignore, docs/design/*, db/oracle/*, api/examples/*, version-history/CHANGELOG.md.
- 검증: 복사 후 파일 1,616개·37MB. 2MB 초과 파일은 `popup-frameWork/Popup/Media/demo-video.mp4`(9.2MB, 데모용 유지)만 남음. 빌드·테스트 미실행(소스 변경 없음).
- 상태: 베이스라인 소스는 sample과 동일(제외 항목 외 수정 없음). 커밋·푸시는 변경 내용 확인 후 수행.

## 2026-09-16-08 — JSON 송수신 인터페이스 설계서 작성

- 이유: 시스템 간 JSON 송수신 기준을 명확히 하기 위해 인터페이스 설계서를 작성.
- 변경: 팝업 공개 API 6개와 관리자 API 6개 요청·응답, 공통 필드, 유형별 content, 문항·정답·대상 조건, 날짜/응답 래퍼/null 규칙 및 검증 한계 문서화. 복사 가능한 가상 JSON 예제 모음 추가.
- 주요 파일: docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/interfaces/popup-interface-examples.json, version-history/CHANGELOG.md.
- 검증: 실제 컨트롤러·DTO·서비스·매퍼·ObjectMapper·웹 API 클라이언트 대조. 문서 JSON 코드 블록 30개 파싱, API 예제 12개 경로·메서드 대조, 응답 DTO 7종 필드 대조 및 공개 예시 정답 비노출 검사 통과. git diff --check 통과. 서버 호출·배포 미실행.
- 상태: 이번 master 커밋에 포함(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 직전 편집 화면 배치 수정 유지.

## 2026-09-16-07 — 팝업 편집 입력과 표시 옵션 재배치

- 이유: 입력 항목이 길어 필수·주요 입력은 왼쪽, 토글 옵션은 오른쪽 아래로 정리하도록 요청함.
- 변경: 왼쪽을 기본 정보 → 콘텐츠 → 노출 대상으로 정리. 공통 활성화·헤더·닫기·푸터·다시 보지 않기·배경 차단 및 유형별 표시/재생 토글을 오른쪽 미리보기 아래로 이동. 크기 설정도 오른쪽 옵션에 배치. 미리보기와 옵션 영역을 나누고 옵션만 독립 스크롤. 좁은 화면은 한 열로 전환. 대상 조건에 종속된 하위 부서 포함 토글은 대상 입력 옆에 유지.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx, version-history/CHANGELOG.md.
- 검증: TSX 구문 검사 및 git diff --check 통과. 변경 전후 AST 비교로 입력 변경 처리 50개 보존 확인(CRLF/LF 정규화). 전체 타입 검사 및 실제 브라우저 배치 검증은 미실행. 저장 데이터 구조와 기본값 변경 없음.
- 상태: 이번 master 커밋에 포함(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 배포 없음.

## 2026-09-16-06 — 실제 크기 미리보기 전용 종료 버튼 추가

- 이유: 헤더·닫기 표시를 끄고 배경 차단을 켜면 실제 크기 미리보기에서 마우스로 나갈 수 없음.
- 변경: 팝업 표시 옵션과 독립적인 미리보기 종료 버튼을 화면 오른쪽 위에 항상 표시. 고정·비율·전체화면에서 동일하게 동작하고 기존 Esc 종료도 유지. 팝업 자체 크기를 바꾸지 않는 고정 위치 버튼 사용.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx, version-history/CHANGELOG.md.
- 검증: TypeScript transpileModule TSX 구문 오류 0개 및 git diff --check 통과. 전체 타입 검사는 재실행하지 않음. 실제 브라우저 클릭 동작 미검증.
- 상태: 이번 master 커밋에 포함할 내용으로 확정(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 기존 작업 보존. 배포 없음.

## 2026-09-16-05 — 좌우 카드 제거 및 하단 설명 링크 추가

- 이유: 좌우 카드 기능을 제거하고 하단 설명에 URL 이동과 클릭·호버 동작을 제공하도록 요청함.
- 변경: 관리자 입력 및 웹/WPF 렌더링, DTO, 팩토리에서 좌우 카드와 추가 설명 제거. 서버 본문 저장·조회 필드를 plainText로 통일. bottomDescriptionUrl 입력 추가, HTTP/HTTPS 링크를 웹 새 창/WPF 기본 브라우저로 열고 호버·키보드 포커스 스타일 적용. URL이 없거나 유효하지 않은 경우 일반 설명 표시. Markdown 모드에도 하단 설명 표시.
- 주요 파일: PopupEditorDialog.tsx, PopupPreview.tsx, TextPopupContentDto.cs, TextPopupView.xaml 및 코드 비하인드, PopupFactory.cs, PopupService.java, PopupMapper.xml(주 서버 및 popup-api), DemoPopupDataService.cs, demo-text-notice.json, POPUP_OPTION_GUIDE.md, ERD/STRUCTURE_REVIEW.md.
- 후속 수정: 미리보기 URL 미적용 제보에 따라 https:// 생략 주소를 보정하는 공통 함수를 입력 저장·미리보기에 적용. 설명 없이 URL만 입력해도 링크 표시. 하단 설명 영역 전체를 클릭 가능한 링크로 변경. 주요 파일에 normalizePopupLink.ts 추가. WPF도 설명이 없으면 URL 표시. 후속 검증: URL 보정 6개 및 미리보기 정적 렌더링 5개(일반/Markdown 모드, URL 단독, 숨김) 통과. Markdown 렌더러는 테스트 대역 사용. 편집기 TSX 구문 및 diff 검사 통과. WPF 재빌드 경고·오류 0개. 전체 타입 검사 재실행 및 브라우저 실제 클릭은 미검증.
- 검증: WPF dotnet build --no-restore 경고·오류 0개. 서버 :service:core:compileJava 통과. 웹 전체 타입 검사에서 이전과 동일한 108개 오류 발생, 수정한 PopupPreview.tsx 및 PopupEditorDialog.tsx 오류 없음. 미리보기 페이지 HTTP 200 및 git diff --check 통과. 실제 브라우저/WPF 클릭·호버 동작 미검증. 기존 DB 및 SQL 스냅샷은 변경하지 않음. 과거 JSON의 카드 필드는 더 이상 표시하지 않으며 DB 데이터 변환은 미실행.
- 상태: 이번 master 커밋에 포함할 내용으로 확정(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 앞선 배경 미리보기 수정 유지. 운영 배포 없음.

## 2026-09-16-04 — 배경 차단 설정 미리보기 반영

- 이유: 배경 차단 사용 여부와 어둡기 설정이 미리보기 렌더링에 연결되지 않아 변경 효과가 보이지 않음.
- 변경: 편집기 미리보기에 배경 여백 및 설정값에 따른 검정 오버레이 표시. 실제 크기 창의 배경에도 사용 여부와 어둡기 적용. 차단 사용 시 배경 클릭으로 미리보기가 닫히지 않도록 처리. 실제 크기 창 내부에는 중복 배경을 표시하지 않음.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, PopupEditorDialog.tsx, version-history/CHANGELOG.md.
- 검증: git diff --check 통과. 전체 웹 TypeScript 검사 실행 결과 공통 UI의 MUI SxProps 타입 충돌 등 108개 오류로 실패. 오류 목록에서 수정한 PopupPreview.tsx 및 PopupEditorDialog.tsx 오류 없음 확인. 개발 서버 /popup-preview/ HTTP 200 확인. 별도 창 미리보기의 기존 크기 유지. 브라우저 실제 배경색·클릭 동작 및 WPF 화면 미검증.
- 상태: 이번 master 커밋에 포함할 내용으로 확정(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 운영 배포 없음.

## 2026-09-16-03 — 남은 로컬 커밋 및 변경 이력 master 통합

- 이유: 미반영 브랜치의 커밋과 변경 이력을 master에 통합하고 원격 저장소에 반영.
- 변경: agent/wpf-7-user-configuration의 79f8910 커밋 이력을 master에 병합. 해당 launchSettings.json의 POPUP_USER_ID=E1002 설정은 이미 master에 동일하게 존재하여 소스 변경 없음. 오늘 작업 기록 2026-09-16-01 및 02를 함께 커밋 대상으로 포함.
- 주요 파일: version-history/CHANGELOG.md. 병합 대상 커밋의 파일은 popup-frameWork/Popup/Properties/launchSettings.json.
- 검증: 최신 origin/master와 동기화 상태 확인. 병합 충돌 및 소스 변경 없음. 실행 설정 JSON 파싱 성공. build/offline-wpf-dependencies와 feature/popup-video-db-samples의 커밋은 이미 master에 포함됨. 소스 변경이 없어 빌드 및 테스트는 추가 실행하지 않음.
- 상태: 병합 및 변경 이력 커밋 직전 기록. 앞선 두 항목의 미커밋·미푸시 표시는 최초 기록 당시 상태이며 이번 커밋에 함께 포함함. 푸시 결과는 작업 완료 응답과 실제 원격 브랜치로 확인. 운영 배포 없음.

## 2026-09-16-02 — 로컬 DB 문항 편집 및 표시 순서 마이그레이션 적용

- 이유: 미완료 상태였던 DB 변경을 마저 적용. 서버 JNDI 설정의 실제 대상은 localhost:5432/postgres이며 표시 순서·주관식 정답 관련 컬럼 3개가 누락되어 있었음.
- 변경: 기존 마이그레이션 3개를 단일 트랜잭션으로 실행하고 COMMIT 확인. popup.popup_notice.display_order(integer, NOT NULL, 기본값 100) 및 1 이상 제약, popup.popup_question.correct_answer(text), answer_match_mode(varchar(10), EXACT/CONTAINS 제약) 추가.
- 권한: 문항 템플릿 목록·상세 API 권한은 이미 존재하여 추가 행 0개. 기존 팝업 상세 권한 복사 SQL 실행 완료.
- 주요 파일: 실행한 ERD/popup_display_order_migration.sql, ERD/popup_question_answer_migration.sql, ERD/migrations/20260913_popup_question_template_permissions.sql. SQL 원본 변경 없음. 기록 파일 version-history/CHANGELOG.md 갱신.
- 검증: 적용 전후 팝업 5개·문항 3개 유지. 별도 연결에서 컬럼·제약 및 기존 표시 순서 기본값 100 확인. 실제 postgres DB에서 PopupQuestionDatabaseTest 1개 실행, 실패·오류·건너뜀 0개. 문항 저장·재조회·주관식/객관식 채점·공개 응답 정답 비노출·기존 템플릿 보존 검사 통과. 테스트 데이터 롤백 후 팝업/문항 수 유지 확인.
- 상태: 로컬 DB 반영 완료, 변경 이력 미커밋. 커밋·푸시·운영 배포 없음. 브라우저/WPF 화면 미검증. 템플릿 버전 증가·재제출 이력 정책·기존 설문 데이터 전환은 이번 마이그레이션 범위에 포함하지 않음.

## 2026-09-16-01 — 노트북 변경 반영 후 markdown 의존성 복구

- 이유: 최신 커밋에서 추가한 `react-markdown`, `remark-gfm`이 현재 PC에 설치되지 않아 모듈을 찾지 못하는 오류 발생.
- 확인: 프로젝트 지정 pnpm은 9.15.2이나 현재 전역 pnpm은 8.15.4. 두 패키지 모두 `MODULE_NOT_FOUND` 재현.
- 변경: `zero-rule-web`에서 `npx.cmd --yes pnpm@9.15.2 install --frozen-lockfile` 실행으로 로컬 의존성 복구. 소스, package.json, pnpm-lock.yaml 변경 없음. 전역 pnpm 버전 변경 없음.
- 주요 파일: `version-history/CHANGELOG.md`. 설치 대상은 Git 추적 제외된 `zero-rule-web/node_modules` 및 워크스페이스 의존성.
- 검증: 의존성 설치 종료 코드 0. Node ESM으로 두 패키지 import 성공. 설치 후 Git 추적 파일 변경 없음 확인. 전체 TypeScript 검사는 장시간 완료되지 않아 중단했으며 통과로 판단하지 않음. 실제 웹 화면 미검증.
- 상태: 변경 이력 미커밋. 커밋·푸시·배포 없음.

## 2026-09-15-05 — 로컬 작업 보존 및 최신 master 동기화

- 이유: 미커밋 로컬 변경이 있는 상태에서 원격 변경 반영이 막혀 Git 충돌 해결을 요청함.
- 변경: 로컬 수정 및 미추적 JSON을 stash에 백업하고 원격 13개 커밋을 fast-forward로 반영한 뒤 로컬 변경을 재적용. `Popup.csproj`와 서버 `PopupService.java`는 자동 병합됨.
- 보존: 미디어 내장·교체 이미지·데모 공지·영상 탐색·마크다운 미리보기·서비스 주석·로컬 설정 유지. 내부망에 맞춘 WebView2 SDK `1.0.3124.44` 고정과 원격 문항 편집 기능 유지.
- 주요 파일: `popup-frameWork/Popup/Popup.csproj`, `zero-rule-server-main/service/core/src/main/java/server/service/core/popup/PopupService.java`, 기존 로컬 수정 파일 및 `popup-frameWork/demo-text-notice.json`.
- 검증: 미해결 Git 항목 없음, HEAD와 origin/master 차이 0개, 자동 병합 외 로컬 수정 10개 파일은 stash와 동일. 지정 SDK 복원 후 WPF 빌드 경고·오류 0개. 전체 웹 `pnpm type-check` 통과. `git diff --check` 통과.
- 상태: 로컬 수정은 미커밋으로 유지. 추가 커밋·푸시·배포 없음. 백업 stash `backup before master sync 2026-09-15` 보존. 실제 UI 및 Java 테스트는 이번 동기화에서 실행하지 않음.

## 2026-09-15-04 — 실행 스크립트·이력 파일 커밋 및 master 반영 준비

- 이유: 작업 브랜치를 원격에 반영하고 master 병합·fetch·로컬 master 전환까지 정리.
- 변경: `shell/start-dev.ps1`, `AGENTS.md`, 변경 이력을 함께 커밋 대상으로 정리. 이전 항목의 미커밋·미푸시 표기는 최초 기록 시점의 상태임을 명시.
- 검증: 최신 origin/master의 추가 미반영 커밋 없음. PowerShell 구문 및 신규 파일 공백 검사 확인.
- 진행 상태: 이 항목은 커밋 직전에 작성함. 원격 반영 여부는 Git 원격 브랜치와 최종 작업 결과로 확인한다.
- 참고: MUI 참조 경로 수정과 실제 DB 마이그레이션은 이번 작업에 포함하지 않음.
## 2026-09-15-03 — 변경 이력 관리 시작

- 이유: 수정할 때마다 작업 내역을 누적하고 이후 작업에서도 기록을 유지하기 위함.
- 변경: `version-history/CHANGELOG.md`에 기록 규칙과 초기 이력 작성. 루트 `AGENTS.md`에 수정 시 이력 갱신 규칙 추가.
- 주요 파일: `version-history/CHANGELOG.md`, `AGENTS.md`.
- 검증: 문서 내용과 Git 변경 상태 확인.
- 상태(최초 기록 당시): 미커밋·미푸시.

## 2026-09-15-02 — master 병합 및 공통 UI 타입 오류 검증

- 이유: 현재 작업 브랜치에 없던 다중 모니터 배경 팝업과 관리자 설정을 반영하기 위함.
- 변경:
  - `origin/master`의 `7eec255`를 `feat/popup-question-editor-erd`에 병합.
  - 모니터별 배경창, 배경 클릭 차단, 관리자 배경 사용 여부·어둡기 설정 반영.
  - 최신 문항 편집 기능에 기존 문항 템플릿 조회·불러오기 기능 통합.
  - 중복 문항 저장 SQL 제거, 로컬 DB 설정 유지.
  - 통합 ERD에 표시 우선순위와 주관식 정답·비교 방식 컬럼 반영.
- 주요 파일:
  - `popup-frameWork/Popup/Managers/BackgroundOverlayManager.cs`
  - `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`
  - `zero-rule-web/main/src/features/RgstPop/PopupQuestionTemplatePicker.tsx`
  - `zero-rule-server-main/service/core/src/main/java/server/service/core/popup/PopupService.java`
  - `zero-rule-server-main/repo/core/src/main/resources/mappers/popup/PopupMapper.xml`
  - `ERD/01_schema.sql`
- 검증:
  - Java API 컴파일 성공, 서비스·영상 API 테스트 20개 통과.
  - DB 연결 테스트 1개는 연결 설정이 없어 건너뜀. 실제 DB 마이그레이션 미실행.
  - 지정 WebView2 SDK 복원 후 WPF 빌드 성공, 경고·오류 0개. 실제 다중 모니터 동작은 미검증.
  - 팝업 관련 9개 파일 타입 검사 오류 0개.
  - 원래 설정의 전체 프런트엔드 타입 검사는 공통 UI의 MUI 스타일 타입 충돌로 실패.
  - 후속 원인 검증: 대표 컴포넌트 2개에서 오류 재현. 메모리상으로 MUI 참조 경로를 통일하면 전체 885개 파일 검사 오류 0개.
- 커밋: `4e54d19` (부모: `d6a7b0f`, `7eec255`). 최초 기록 당시 원격 푸시 미실행.
- 남은 사항: MUI 경로 통일은 검증만 했으며 실제 `tsconfig.json` 수정은 아직 하지 않음.

## 2026-09-15-01 — 개발 서버 통합 실행 스크립트

- 이유: 한 번의 명령으로 Java 백엔드와 프런트엔드 개발 서버를 실행하기 위함.
- 변경: `shell/start-dev.ps1` 추가. 백엔드 `:app:bootRun -Pprofile=local`과 프런트엔드 `pnpm run dev`를 각각 별도 PowerShell 창에서 실행.
- 주요 파일: `shell/start-dev.ps1`.
- 실행: 프로젝트 루트에서 `powershell -ExecutionPolicy Bypass -File .\shell\start-dev.ps1`.
- 검증: PowerShell 구문 검사 통과. 스크립트를 통한 실제 서버 실행은 미검증.
- 상태(최초 기록 당시): 미커밋·미푸시. master 병합 커밋에는 포함하지 않음.
