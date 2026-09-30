# 변경 이력

프로젝트의 수정 내역과 검증 결과를 기록한다. 날짜는 한국 시간(KST)을 사용한다.

## 2026-09-30-04 — WPF 조회 주기 및 VIDEO 공통 UI 구현

- 이유: 서버 기준 표시 대상 정책에 맞춰 조회 주기를 30~60분으로 제한하고, 로컬/URL 영상의 조작 UI 및 동영상+퀴즈 이중 스크롤을 통일.
- 변경: 서버 `custom.wpf-popup.polling-interval-seconds`가 조회 주기를 소유하고 응답·WPF fallback을 1800~3600초로 제한. 로그인 직후 최초 조회 경로를 유지하고 `Stopwatch` 경과시간으로 기동 기준 조회 경계를 계산해 응답 지연·PC 시계 변경에 따른 주기 이동을 방지. 열린 팝업도 조회하며 기존 ID 중복 제거 후 새 목록을 표시 큐에 합류. 단일 타이머·조회 gate 및 426/종료 이후 재시작·늦은 응답 표시 차단. 서버 SQL의 활성·기간·대상·숨김·완료 판단은 기존 구현과 정합성을 확인해 유지.
- 변경(UI): 로컬 MediaElement와 HTTP/HTTPS HTML5 영상이 동일한 고정 WPF 컨트롤 행을 사용. WebView2 HWND와 컨트롤 영역을 분리하고 Chromium 기본 controls·자동 숨김 타이머 제거. 공통 재생·일시정지·탐색·음량/음소거·배속·전체화면 명령, WebView 메시지 상태 동기화 및 버퍼링 안내 적용. 탐색 구간 시청시간 합산 방지, 배속 변경 금지 시 HTML5 1.0배 유지, URL 쿼리의 HTML 속성 인코딩 보완. YouTube iframe은 기존 별도 플레이어 정책 유지.
- 변경(스크롤): VIDEO+QUIZ 결합 모드에서 내부 SurveyPopupView ScrollViewer를 실제 계층에서 제거하고 고정 문항 높이를 Auto로 변경. 영상·전체 문항·제출 영역을 부모 단일 스크롤에 배치하고 공통 푸터는 창 하단에 유지. 단독 SURVEY/QUIZ 자체 스크롤 유지. 현재 계약에 VIDEO+SURVEY 모드가 없음을 확인. TODO·인터페이스 조회 정책·WPF README·영상+퀴즈 안내 갱신.
- 주요 파일: `popup-frameWork/Popup/MainWindow.xaml.cs`, `Views/Contents/VideoPopupView.xaml/.cs`, `VideoQuizPopupView.cs`, `SurveyPopupView.xaml/.cs`, `Popup.BehaviorTests/Program.cs`, `Popup.BehaviorTests/video-controls.test.cjs`, `zero-rule-server/base/src/main/java/server/base/props/WpfPopupProps.java`, `WpfPopupServiceTest.java`, `docs/design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md`.
- 검증: WPF 빌드 경고·오류 0, 동작 검증 97건 통과(50문항·3종 viewport의 끝까지 스크롤 및 잠금 해제 높이 유지, 조회 경계, URL 상태·시청시간 포함). 실제 생성 HTML의 JavaScript를 영상/WebView 브리지 테스트 더블로 실행해 42건 통과. Gradle offline `:service:core:test --tests server.service.core.popup.wpf.WpfPopupServiceTest` 5개 테스트 통과. `git diff --check` 통과. 401 흐름은 단일 타이머·조회 gate·인증 재시도 경로 코드 점검. 실제 GUI·디코딩·전체화면 왕복·물리 입력 및 원격 개발 DB의 완료/숨김 후 HTTP 재조회는 미실행.
- 상태: 구현·자동 검증 완료, 이번 main 커밋에 포함해 origin/main에 푸시 진행. 커밋 전 WPF 97건·HTML5 브리지 42건 재검증 통과, 서버 서비스 테스트는 Gradle `--rerun-tasks`로 재실행. 배포용 dist·반입 패키지·관리자 UI·DDL 갱신 없음. 실제 GUI·원격 DB 확인 항목은 TODO에 미완료로 유지.

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
