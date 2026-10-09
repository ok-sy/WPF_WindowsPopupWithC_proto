# 변경 이력

프로젝트의 수정 내역과 검증 결과를 기록한다. 날짜는 한국 시간(KST)을 사용한다.

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
