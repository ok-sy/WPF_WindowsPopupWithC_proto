# WPF 팝업 전체 기능 버전 정의서

- 문서 성격: All Feature Specification / Implemented WPF Scope
- 작성 기준: 2026-10-13 (KST)
- 기준 소스: `WpfNextPopupResponseDto`, `PopupResponseDto`, `WpfResultDtos`, `PopupOptions`, 유형별 Content DTO, `PopupFactory`, 각 View 및 서비스
- 대응 문서: [최소 기능 버전 정의서](WPF_POPUP_MINIMAL_SPEC.md)

## 1. 문서 목적

현재 WPF가 구현한 전체 기능을 최소 기능 정의서와 같은 구분으로 관리한다.
전체 기능에 포함되어도 최초 외부 제공 범위에 자동으로 포함되지는 않는다.
외부 제공 범위는 MINIMAL, 구현 기능은 ALL, HTTP·JSON의 상세 필수값과 예제는
[인터페이스 계약서](POPUP_INTERFACE_SPEC.md)를 기준으로 확인한다.

표의 필드명은 C# 속성 기준이며 JSON은 camelCase를 사용한다. `content.` 또는
`questions[].`를 붙인 항목은 실제 전달 위치를 나타낸다. 기본값은 별도 설명이 없으면
응답 DTO 또는 Factory의 생략 처리 기준이다. 필수값은 계약상 제공 의무이며 C#이
기본값을 갖는다고 생략해도 된다는 뜻은 아니다. 명시적 null은 nullable 필드만 사용한다.
ID·필수 응답·채점 관련 서버 보장 조건은 계약서 6.4절을 함께 적용한다.
`필수값 여부`의 `N`은 "생략하면 Default 값으로 동작"한다는 뜻이다. 계약서 6.3 표가 `O`(권장 출력)로
적은 필드라도 C# 기본값이 있으면 이 문서에서는 `N`으로 적으며 의미는 같다(계약서 6.4 "필수 여부 표기 기준").
Default의 "계약 기본값 없음(C# 초기값 …)"은 C# DTO 초기값이 있어도 백엔드가 생략해서는 안 되는 값이다.

## 2. 전체 기능 적용 원칙

| 구분 | 전체 버전 원칙 |
|---|---|
| 기능 노출 | 구현된 기능을 기록하되 최초 외부 제공 여부는 MINIMAL에서 별도 관리 |
| 창 크기 | 일반 콘텐츠는 최상위 Width/Height. 일반 IMAGE는 content.width/height 사용 |
| IMAGE 예외 | ORIGINAL은 공통 창 크기, FULLSCREEN은 모니터 전체 영역 우선 |
| 기본값 | 응답 DTO·Factory 기본값과 Demo·관리자 화면의 초기값을 구분 |
| 고정 동작 | UI·드래그·결과 큐 등의 동작을 가상의 API 필드로 만들지 않음 |
| 필드 이름 | 계약 이름 하나만 수신. legacy 수신 별칭(`showCloseButton` 등)은 삭제(설계 29-11) |
| 미구현 | 구현되지 않은 기능은 전체 기능에도 지원으로 적지 않음 |

## 3. 공통 기능 범위

### 3.1 공통 표시 및 정책

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| DeliveryId | 지원(설계 35) | Y | 계약 기본값 없음(C# 초기값 `""`) | 조회 응답 `popup.deliveryId`. 서버가 조회마다 발급·재사용하는 전달 건 ID이며 결과 요청에 그대로 보냄. 빈 값이면 결과가 `REJECTED`(`WPF_INVALID_RESULT`) |
| PopupId | 지원 | Y | 계약 기본값 없음(C# 초기값 `""`) | 식별·숨김·결과 연결 ID. 서버가 유효값 보장. 빈 값이면 결과 연결 생략 |
| PopupType | 지원 | Y | 계약 기본값 없음(C# 초기값 `""`) | TEXT / IMAGE / VIDEO / SURVEY / QUIZ. 빈 값·미지원 값은 Factory 오류 |
| Content | 지원 | Y | 없음(생략·null 시 화면 생성 실패) | 유형별 `content` object. null 금지. 유형별 필수값은 각 절 적용 |
| Title | 지원 | Y(계약) | `""` | 공통 Header 제목. Header 숨김 여부와 별개로 백엔드 응답 계약상 제공 |
| DisplayStartAt / DisplayEndAt | 삭제(설계 29) | - | - | 기간·대상·숨김·완료 판정은 서버 책임. 조회 응답·DTO에 없음 |
| DisplayMode | 계약 필드만 유지 | N | `SEQUENTIAL` | SEQUENTIAL / SIMULTANEOUS. 조회 응답이 1건이라 WPF는 값을 읽지 않고 항상 1건씩 표시(동시 표시 경로 삭제, 모르는 값도 팝업 실패 없음) |
| DisplayOrder | 응답에서 삭제(설계 35) | - | - | 관리자 표시 순서는 서버 정렬 기준으로만 사용하고 조회 응답에 싣지 않음. 서버가 순서상 첫 1건을 내려줌 |
| ShowHeader | 지원 | N | `true` | 제목·고정 로고 및 Header 영역 |
| ShowFooterButton | 지원 | N | `true` | `showFooterButton`. 일반 콘텐츠 Footer 버튼 표시 |
| ShowFooter | 지원 | N | `true` | Footer 전체 표시. SURVEY/QUIZ 제출 버튼 위치에도 영향 |
| ShowDoNotShowAgain | 지원 | N | `false` | 응답 DTO 기준. 직접 PopupOptions 생성 시 기본값은 true |
| HideDays | 지원 | N | `null` → 결과에서 30일 | 다시 보지 않기(HIDDEN) 결과의 숨김 일수. 1~3650(관리자 저장 시 서버 검증). 체크박스 문구도 같은 값으로 `{N}일간 보지 않기` 표시 |
| FooterAction | 지원 | N | `CLOSE`(SURVEY/QUIZ는 SUBMIT) | 최상위 `footerAction`(설계 30). CLOSE 닫기 / LINK_AND_CLOSE 바로가기 / SUBMIT 제출. SURVEY·QUIZ·VIDEO+QUIZ는 SUBMIT 고정, 일반 유형의 그 밖의 값은 CLOSE |
| FooterLinkUrl | 조건부 지원 | 조건부 | `""` | 최상위 `footerLinkUrl`. LINK_AND_CLOSE에서 유효한 HTTP/HTTPS 절대 URL |
| UseBackgroundOverlay | 지원 | N | `true` | 최상위 `useBackgroundOverlay`(설계 31). 별도 Overlay 창 사용. 켜지면 Alt+F4·시스템 메뉴 닫기·외부 닫기 요청을 막고 앱 내 닫기·제출과 앱 종료만 허용한다. 화면에 닫기·제출 수단이 없으면 막지 않는다(설계 44) |
| BackgroundOverlayOpacity | 지원 | N | `0.45` | 최상위. 0~1로 보정(서버 저장 검증). 뒤쪽 마우스 입력을 막으며 키보드 전체 차단은 아님 |
| HeaderFontSize | 지원 | N | `null` | 최상위. 미지정 시 Header 17. 지정 시 10~40 보정 |
| BodyFontSize | 지원 | N | `null` | 최상위. 미지정 시 View 기본. 지원 View에 본문 크기 전달 |
| FooterFontSize | 지원 | N | `null` | 최상위. 미지정 시 Footer 14. 지정 시 10~40 보정 |
| CompletionRatio | 지원 | N | `null` → `1.0` | VIDEO / VIDEO+QUIZ 누적 시청 완료 기준 |
| AllowCloseBeforeComplete | 지원 | N | `true` | 영상 완료 전 종료 허용 정책. Header X는 없음. `false`면 VIDEO·VIDEO+QUIZ 모두 시청 기준 전 푸터 버튼·Alt+F4 닫기를 막는다(재생 실패·앱 종료는 예외). 일반 VIDEO 푸터 닫기는 비활성으로 두고 시청 %·기준 사유를 표시한다(설계 43). `true`인 VIDEO+QUIZ는 푸터에 보조 닫기를 표시한다 |
| PassingScore | QUIZ에서 지원 | Y(QUIZ) | `null` | 합격점은 서버가 0~총점 범위로 제공. 누락 시 WPF는 0점 통과 기준으로 처리할 수 있음 |

Footer 버튼 표시는 서버 응답(Java `WpfPopupItem`)과 C# 모두 `showFooterButton` 하나만 사용한다. legacy `showCloseButton` 수신 별칭은 삭제했다(설계 29-11). 관리자 API·DB는 기존 이름(showCloseButton·SHOW_CLOSE_BUTTON_YN)을 유지하고 WPF 응답 조립 시 변환한다.

Header에는 닫기 버튼이 없고 로고에는 닫기 동작을 연결하지 않는다.
SURVEY·QUIZ·VIDEO+QUIZ는 `ShowFooterButton=false`여도 제출을 유지한다.
Footer가 있으면 공통 제출 버튼, 없으면 콘텐츠 내부 제출 버튼을 사용한다.

완료 조건 버튼 표현(설계 43, 계약 필드 추가 없음):

- 버튼은 숨기지 않고 **비활성 + 사유 표시**로 표현한다. 사유 문구는 Footer 진행 문구 위치에 표시하며 스크린리더 Live Region(Polite)이고, 비활성 버튼의 HelpText에도 같은 사유를 둔다.
- 일반 VIDEO(`AllowCloseBeforeComplete=false`): 기준 미달이면 닫기 비활성 + `영상 {현재}% 시청 · 기준 {기준}% 이상 시청하면 닫을 수 있습니다`. 표시 %는 내림이라 비활성인데 기준 이상으로 보이지 않는다. 기준 도달·재생 실패 시 활성. 예전 '필수 영상 시청' 안내창은 없앴다.
- VIDEO+QUIZ 잠금 중: 제출·다시 보지 않기 비활성(기존 계약) + `영상 {현재}% · 기준 {기준}% 이상 시청하면 퀴즈와 제출이 활성화됩니다`. 해제 뒤에는 필수 문항 진행 문구로 바뀌고 첫 문항으로 포커스를 옮긴다.
- SURVEY/QUIZ 제출은 필수 미응답일 때만 비활성이다. 통과 점수로 제출을 막지 않는다(채점 전 교착 방지). QUIZ 불합격 안내에는 점수와 틀린 채점 문항 번호(예: `틀린 문항: 2, 4번`)를 표시한다. 결과 계약(`score`·`passed`)은 바뀌지 않는다.
- 보조 닫기(제출 버튼과 구분되는 밝은 버튼)는 정책상 제출 전 이탈이 허용될 때만 Footer에 표시한다. VIDEO+QUIZ는 `AllowCloseBeforeComplete=true`(잠금 여부 무관) 또는 재생 실패, QUIZ(영상 없음)는 불합격 1회 이후이면서 Background Overlay가 꺼진 경우다. SURVEY·TEXT·IMAGE·VIDEO와 `ShowFooter=false`에서는 표시하지 않는다. 결과는 Alt+F4 닫기와 같은 CLOSED(영상은 VIDEO_WATCHED)다.

Background Overlay와 닫기 경로(설계 44, 고정 동작·관리자 옵션 없음):

- `UseBackgroundOverlay=true`: Footer 닫기·보조 닫기·바로가기·제출 완료 후 닫기 등 앱이 시작한 닫기와 앱 종료(트레이 종료·426 종료·Windows 로그오프)만 허용하고 Alt+F4·시스템 메뉴 닫기·외부 WM_CLOSE는 무시한다.
- 교착 방지: 화면에 닫기·제출 수단이 하나도 없으면(TEXT/IMAGE/VIDEO의 `ShowFooter=false` 또는 `ShowFooterButton=false`, 푸터 없는 VIDEO+QUIZ가 잠긴 채 재생 실패) 키보드 닫기를 막지 않는다. VIDEO의 완료 전 닫기 제한은 그대로 적용한다. SURVEY/QUIZ는 제출 버튼이 항상 보이므로 제출로 닫는다(QUIZ는 통과해야 닫힘).
- `UseBackgroundOverlay=false`: 기존 동작(Alt+F4 허용, VIDEO 제한은 `AllowCloseBeforeComplete`).
- Esc는 팝업을 닫지 않는다(아무 동작 없음). 영상 전체화면 해제·공통 안내창의 Esc는 그대로다.
- 앱 종료 중에는 닫기 제한을 적용하지 않으며 결과(CLOSED/VIDEO_WATCHED·시청량)를 큐에 저장한다. 창 제목은 팝업 제목이며(Alt+Tab·스크린리더) 첫 포커스는 SURVEY/QUIZ의 첫 입력 또는 본문의 첫 포커스 가능 요소다. Enter·Space로 의도치 않게 닫히지 않도록 Footer 버튼에는 첫 포커스와 IsDefault를 두지 않는다.
Footer 버튼 이름은 CLOSE '닫기', LINK_AND_CLOSE '바로가기', SUBMIT '제출'이다.
LINK_AND_CLOSE는 일반 콘텐츠에서만 링크를 연 뒤 종료하며 URL 오류나 실행 실패 시 창을 유지한다.
설문·퀴즈의 제출 후 링크 열기는 제거했다(설계 30).

### 3.2 크기·위치

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| Width / Height | 지원 | N | `900` / `620` | FIXED 공통 창 크기. 일반 IMAGE 예외는 4.2 참조 |
| SizeMode | 지원 | N | `FIXED` | FIXED / RATIO / FULLSCREEN / AUTO. AUTO는 WPF 지원이며 서버·웹 허용과 구분 |
| WidthRatio / HeightRatio | 지원 | N | `0.7` / `0.75` | RATIO 모니터 작업 영역 비율 |
| MinimumWidth / MinimumHeight | 지원 | N | `480` / `320` | 화면 상한과 함께 보정 |
| MaximumWidth / MaximumHeight | 지원 | N | `1200` / `900` | 일반 콘텐츠 상한. IMAGE는 현재 작업 영역의 90% 적용 |
| PopupPosition | 지원 | N | `CENTER` | 최상위 `popupPosition`(설계 31). 9개 위치. 알 수 없는 값은 CENTER |
| DragMove | 고정 동작 | 해당 없음 | 설정 필드 없음 | Header 또는 Header 없는 상단 이동 영역 사용 |

위치 값: CENTER, TOP_LEFT, TOP_CENTER, TOP_RIGHT, CENTER_LEFT, CENTER_RIGHT,
BOTTOM_LEFT, BOTTOM_CENTER, BOTTOM_RIGHT. 위치·크기 계산은 대상 모니터의 DPI와
작업 영역을 사용하며 FULLSCREEN은 주 모니터 전체 영역을 사용한다.

### 3.3 공통 외형

| 항목 | 구현 상태 | API 설정 여부 |
|---|---|---|
| Header | 검은 배경·흰 제목·고정 로고·높이 40 | 표시·제목·폰트만 설정. 색·높이·로고 URL 옵션 없음 |
| 외곽 | BorderThickness 0 / Radius 6 | 고정 외형. FULLSCREEN은 Radius 0 |
| 일반 팝업 Clip | 실제 본문 크기와 안쪽 반경으로 계산 | 별도 옵션 없음 |
| VIDEO / VIDEO+QUIZ | AllowsTransparency=false, 내부 WPF Radius 0 | 고정 정책. 작은 모서리 창으로 외곽 곡선 보완 |
| VIDEO 모서리 이동 | Win32 레이어드 모서리 창 4개를 본 창 DPI 기준 물리 픽셀로 직접 그림. DPI 변경 시 HWND 재사용·즉시 재배치, 드래그 중 본 창과 묶음 이동. 앱은 PerMonitorV2로 실행 | 별도 옵션 없음. 실제 다중 DPI 모니터·Horizon 품질 및 CPU 실측은 남아 있음 |

## 4. 팝업 유형별 전체 기능

### 4.1 TEXT

| 항목(content) | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| PlainText | 지원 | 조건부 | `""` | TextBlocks가 없을 때 표시하는 일반 문자열 본문. TextBlocks가 있으면 서버가 TextBlocks에서 만든 파생 값이며 표시는 TextBlocks 우선. 이 저장소 서버는 TEXT 응답에 항상 키를 채움(저장 본문이 없으면 `null` 가능) |
| TextBlocks | 지원 | N | 없음 | 문단·Run 서식 본문(굵게·기울임·밑줄, 허용 색·크기·글꼴, 문단 정렬·들여쓰기 0~5단계 × 40, 설계 49). 콘텐츠 제목·설명도 앞 문단으로 포함. 있으면 PlainText 대신 표시. 허용 값은 서버가 검증하고 WPF는 표시 방어(안전 범위·변환 실패 시 기본값·구조 오류 시 PlainText)만 한다(설계 48). 상세는 인터페이스 계약 8.1 |
| ShowPlainText | 지원 | N | `true` | 본문 영역 표시 |
| HighlightText | 지원 | N | `""` | 강조 문구 |
| ShowHighlight | 지원 | N | `false` | 문구 존재로 자동 추정하지 않음 |
| BottomDescription | 지원 | N | `""` | 하단 설명 |
| BottomDescriptionUrl | 지원 | 링크 사용 시 제공 | `""` | 하단 설명 링크 |
| ShowBottomDescription | 지원 | N | `false` | 하단 설명 표시 |

창 크기는 공통 Width/Height를 사용한다. MarkdownMode·MarkdownContent는 삭제된 기능이다.
ContentTitle·Description·ShowContentHeader와 별도 내부 제목 영역은 설계 37에서 삭제했다. 콘텐츠 제목·설명은 본문(TextBlocks/PlainText)의 앞 문단으로 전달된다.

### 4.2 IMAGE

| 항목(content) | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| ImageUrl | 지원 | Y | `""` | 이미지 URL 또는 로컬 경로 |
| ImageSizeMode | 지원 | N | `ADAPTIVE` | ADAPTIVE / FIT_TO_IMAGE / ORIGINAL. 필드 생략 시 ADAPTIVE이며 관리자 신규 등록 기본 선택도 ADAPTIVE |
| ImageTitle | 일반 모드에서 지원 | N | `""` | ORIGINAL View는 내부 제목을 표시하지 않음 |
| Description / ShowDescription | 일반 모드에서 지원 | N | `""` / `true` | 하단 설명·스크롤. ORIGINAL View에는 전달하지 않음 |
| Width / Height | 일반 모드에서 지원 | N | `null` | ADAPTIVE 창 크기, FIT_TO_IMAGE 이미지 표시 크기. ORIGINAL에서는 사용하지 않음 |
| KeepAspectRatio | FIT_TO_IMAGE에서 지원 | N | `true` | false면 지정한 두 축 크기로 왜곡 허용 |

- ADAPTIVE: 창 우선, 비율을 유지해 이미지 표시.
- FIT_TO_IMAGE: 이미지 표시 크기 우선. 치수 생략 시 원본 DIP 크기 사용.
- ORIGINAL: 최상위 공통 창 크기를 사용하고 원본을 왼쪽 위에서 표시·Clip.
- 일반 모드는 최상위 중복 Width/Height 대신 content.width/height를 사용한다.
- 최대 창 크기는 현재 모니터 작업 영역의 90%. 지정 이미지가 넘치면 축소하지 않고 중앙 Clip.
- FULLSCREEN은 전체 모니터 크기가 우선이다. FILL 및 과거 IMAGE FIXED는 삭제된 값이다.

### 4.3 VIDEO

| 항목(content) | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| VideoUrl | 지원 | Y | `""` | 로컬 파일 경로 또는 HTTP(S) 직접 재생 URL. 엔진별 동작 차이는 아래 참고 |
| VideoTitle | 지원 | N | `""` | 콘텐츠 내부 제목 |
| Description / ShowDescription | 지원 | N | `""` / `true` | 영상 설명 |
| ShowControls | 지원 | N | `true` | 공통 WPF 컨트롤 |
| DefaultVolume | 지원 | N | `0.7` | Windows 음량 연결 전·실패 시 대체값 |
| AllowFullScreen | 지원 | N | `true` | 영상 플레이어 자체 전체화면 |
| AllowPlaybackRateChange | 지원 | N | `true` | false면 HTML5 포함 1.0배로 제한 |
| AllowSeek | 지원 | N | `true` | false면 진행바 탐색 금지, 진행률 표시 유지. VIDEO+QUIZ 공통 |
| AutoPlay | 지원 | N | `false` | 자동 재생 |
| IsLoop | 지원 | N | `false` | 반복 재생 |

CompletionRatio와 AllowCloseBeforeComplete는 최상위 필드다. content 안에 중복 정의하지 않는다.
시청 기준 도달은 일반 VIDEO·VIDEO+QUIZ·Demo 모두 서버와 같은 식(누적 시청/길이를 소수점 4자리에서 내림, 1 상한 ≥ CompletionRatio)으로 판정한다(설계 53-16). VIDEO+QUIZ는 영상 영역에 보인 제목·설명과 같은 퀴즈 머리말을 반복 표시하지 않는다.
시청량은 단순 재생 위치와 구분해 누적하며 완료 기준은 콘텐츠·결과에 연결한다.
로컬 MediaElement와 WebView2 HTML5 경로의 공통 컨트롤·진행바·버퍼 표시·hover 표시를 지원한다.
`allowSeek=false`이면 진행바 클릭·드래그·키보드·UI Automation으로 재생 위치를 바꿀 수 없고 HTML5 seek 명령도 무시한다. 진행률·현재/전체 시간 표시와 루프·종료 후 재시작은 유지하며 전체화면에서도 같은 정책을 적용한다.
Windows Master Volume/Mute 연결 성공 시 현재 시스템 값이 우선하며 종료 후 이전 값으로 복원하지 않는다.
연결 실패 시 내부 음량을 사용한다. IsMuted라는 별도 계약 필드는 없다.

AllowFullScreen과 공통 SizeMode=FULLSCREEN은 별도 기능이다.

### 4.4 SURVEY / QUIZ

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| SurveyTitle | 지원 | N | `""` | content 안 설문·퀴즈 제목. 공통 Header 제목과 별개. VIDEO+QUIZ는 영상 제목과 같은 값 |
| Description | 지원 | N | `""` | content 안 제목 아래 설명 |
| Questions | 지원 | Y | `[]` | 최상위 문항 목록 |
| questions[].QuestionId | 지원 | Y | `0` | 실제 ID는 서버가 보장 |
| questions[].Title | 지원 | Y | `""` | 문항 제목 |
| questions[].Description | 지원 | N | `""` | 문항 설명 |
| questions[].QuestionType | 지원 | Y | `""` | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT |
| questions[].IsRequired | 지원 | Y(서버가 항상 true/false 제공) | `false` | 누락 시 false로 보아 필수 검증 없음 |
| questions[].Options | 선택형에서 지원 | 조건부 | `[]` | TEXT는 빈 배열 |
| questions[].OptionLayout | 지원 | N | `VERTICAL` | VERTICAL / HORIZONTAL |
| questions[].IsScored | QUIZ에서 지원 | Y(QUIZ 계약) | `false` | 채점 문항은 true 명시. 현재 서버 저장 규칙은 최소 1개 true 존재까지는 보장하지 않으므로 응답 검증 필요 |
| questions[].QuestionScore | QUIZ에서 지원 | Y(QUIZ 계약) | `null` | 양수 배점. 누락/null이면 WPF 로컬 점수 0 |
| questions[].CorrectAnswer | TEXT QUIZ에서 지원 | Y(TEXT QUIZ) | `null` | 공백 아닌 주관식 정답. 최소 버전에서는 TEXT QUIZ 미제공 |
| questions[].AnswerMatchMode | TEXT QUIZ에서 지원 | Y(TEXT QUIZ) | `null` | EXACT / CONTAINS |
| options[].OptionId | 지원 | Y(선택형) | `0` | 응답 OPTION_ID 연결. 양수·문항 내 고유 ID를 서버가 보장 |
| options[].Value / Text | 지원 | Value N · Text Y(선택형) | `""` | 업무 값(선택)·화면 문구. 응답 식별은 OptionId |
| options[].IsCorrect | QUIZ에서 지원 | Y(QUIZ 선택형) | `null` | 정답 true, 오답 false를 명시. SURVEY는 채점하지 않음 |
| PassingScore | QUIZ에서 지원 | Y(QUIZ) | `null` | 최상위 합격점. 0~총점 범위 |

선택형은 VERTICAL 전체 폭 Row·우측 체크 Path, HORIZONTAL 공통 Chip으로 표시한다.
긴 문장 줄바꿈, 단일/복수 선택, 필수 미응답 검증, 주관식 입력·스크롤을 지원한다.
제출 영역은 스크롤 밖에 고정한다. QUIZ는 필수 검증·로컬 채점 후 통과 시 제출하며
서버 결과 전송을 기다리기 전에 로컬 큐 저장을 완료한다. **미통과 시 별도 `CloseOnFail` JSON 필드 없이 창을 유지하고 수정·재채점한다.** RATING5·correctAnswers는 삭제된 계약이다.

### 4.5 VIDEO+QUIZ

별도 PopupType이 아니라 `PopupType=QUIZ + content.videoEnabled=true` 조합이다.
VideoEnabled 기본값은 false이며 4.3의 영상 content와 4.4의 최상위 Questions를 함께 사용한다.

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| VideoEnabled | VIDEO+QUIZ에서 지원 | N | `false` | `content.videoEnabled=true`이면 영상 시청 후 QUIZ를 푸는 결합형 화면 |
CompletionRatio 도달 전에는 QUIZ 및 제출을 잠그고 도달 후 활성화한다.
영상·문항을 부모의 단일 세로 스크롤로 표시한다. 제출 결과 한 항목에 answers와 video를 포함한다.
VIDEO+SURVEY라는 별도 조합은 현재 계약에 없다.

## 5. API·클라이언트 고정 동작 및 주의사항

| 기능 | 전체 구현 범위 | 설정·계약 구분 |
|---|---|---|
| 인증 | SSO XML → 로그인 → Bearer, 토큰 만료 시 재로그인·재시도 | 인증 URL·실환경 통합 정책은 별도 연동 조건 |
| API | 로그인·단건 조회(`POST /api/wpf/popups`)·결과 1건 전송(`POST /api/wpf/popups/results`) (설계 35) | 요청·응답·경로는 인터페이스 계약서 참조 |
| 조회 | 한 번에 팝업 1건 표시. 표시 중에는 다른 조회 없음. 결과 저장 응답 `nextStatus`=AVAILABLE이면 즉시 조회, EMPTY·`popup=null`이면 가장 최근 `pollingIntervalSeconds`(30~60분) 대기, `nextStatus` 없음은 즉시 조회. 조회 실패 후 재조회 복구 | 팝업 content의 옵션이 아님. 대기는 기동 시점 기준이 아니라 해당 응답 시점부터 계산 |
| 결과 | 닫기·숨김·제출 및 영상 정보, 로컬 pending-results 큐에 저장 후 1건씩 순서대로 전송. 결과에 조회 응답의 `deliveryId` 포함. "다시 보지 않기"를 체크하고 닫으면 영상을 시청했어도 HIDDEN이 우선하며 video 블록을 보내지 않아 시청 정보·시청 완료가 기록되지 않음 | 재전송은 같은 resultId 유지. ACCEPTED·DUPLICATE·REJECTED만 큐에서 제거하고 RETRYABLE_ERROR·INTERNAL_ERROR(실행당 3회)·응답 누락은 보관(설계 34). 일반 결과도 창이 닫히기 전에 저장 |
| 미전송 결과 복구 | 미종결 결과(전송 실패·RETRYABLE_ERROR·재시도 남은 INTERNAL_ERROR)가 남으면 다음 팝업을 조회하지 않고 복구 간격(10초×3회 …) 뒤 재시도. 400 결과는 이번 실행에서 제외, 배열 일괄 재전송 없음. 큐 파일을 읽을 수 없어도 조회 보류(설계 39-1), 복구 재전송 결과의 EMPTY도 조회 간격 대기(설계 39-2) | 주간회의 결정 전 **임시 기준**(설계 35 §4). 확정 계약 아님 |
| 제출 실패 | 필수 미응답·QUIZ 불합격·로컬 저장 실패 시 창 유지. QUIZ 불합격 안내에 틀린 문항 번호 표시(설계 43) | 별도 JSON 제어 필드 없음 |
| 실행 | 트레이·단일 인스턴스·Demo 모드·예외 로그 및 제한된 재시작. Demo 로그는 조회(POST /api/wpf/popups 요청과 Header·Footer·content를 포함한 단건 응답 JSON)와 결과 전송 요청·응답 JSON을 함께 쌓음. Demo도 AVAILABLE이면 같은 샘플 유형의 다음 1건을 이어서 표시. API Demo(`-Demo -Api`, 설계 51)는 Demo 화면에서 Base URL·인증·조회 요청 JSON을 입력해 실제 단건 조회·결과 API를 수동 호출하고 실제 HTTP 요청·응답(토큰 마스킹)을 기록하며 자동 폴링·nextStatus 연속 조회를 하지 않음 | 인메모리 Demo 결과는 실제 서버·DB 저장과 구분(요청 JSON에 인증 헤더 없음, 샘플 유형 선택은 로그 줄에만 표시). API Demo는 개발계/검증계 검증 도구로 실제 전달 건·결과를 생성하며 계약 필드·외부 제공 범위를 바꾸지 않음 |
| 전체화면 | 영상이 있는 모니터에서 재생, 전체화면 시 공통 Radius 0 | 플레이어와 창의 전체화면을 구분 |
| 자동 업데이트 | 구현 기능으로 포함하지 않음 | 설계 17은 폐기(2026-10-12) |

서버가 기간·대상·숨김·완료·재노출 유예를 판정하고 WPF에는 표시 순서상 첫 1건을 내려준다. TEXT·IMAGE 닫기(CLOSED)는 서버에서 완료로 처리하고, 미완료로 끝난 SURVEY·QUIZ·VIDEO는 결과 저장 시각부터 `pollingIntervalSeconds` 동안 조회에서 제외된다.
서버 DB·관리자 API·웹 입력 범위는 이 전체 WPF 기능 정의서의 지원 판정과 구분한다.
전체 기능 지원 표시는 모든 영상 엔진·Horizon·DPI 조합의 실환경 검증 완료를 뜻하지 않는다.
현재 남은 실측은 [설계 25](../design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md)와
[성능 측정 가이드](../reviews/20261007_저사양_PC_VIDEO_측정_가이드.md)를 참고한다.

## 6. 전체 버전 한눈에 보기

| 유형 | 전체 제공 기능 | 최소 버전과의 주요 차이 |
|---|---|---|
| 공통 | 단건 순차 표시·크기 모드·9개 위치·폰트·Footer 링크·숨김·Overlay | 최소는 기본 표시 방식·위치·폰트 및 FIXED 중심 |
| TEXT | 서식 본문(제목·설명 문단 포함)·강조·하단 설명 및 링크 | 최소는 일반 본문(PlainText) 중심 |
| IMAGE | ADAPTIVE / FIT_TO_IMAGE / ORIGINAL, 이미지 치수·비율·설명·화면 상한 | 최소는 ORIGINAL 및 공통 창 크기 |
| VIDEO | 공통 컨트롤·시청량·음량·전체화면·배속·자동 및 반복 재생 | 최소는 기본 컨트롤·음량·전체화면·완료 비율 중심 |
| SURVEY | 문항 설명·필수 검증·선택 Row/Chip·주관식 | 최소 제공 범위와 공통 기능 확장 구분 |
| QUIZ | 객관식·주관식 채점·배점·합격점·재채점 | 최소는 주관식 정답·자동 채점 미제공 |
| VIDEO+QUIZ | 영상 시청 잠금·단일 스크롤·영상 및 답안 통합 결과 | 최소에서도 결합 모드 지원, 영상 확장 옵션은 별도 |

## 7. 두 기능 정의서의 관리 기준

기능 추가·수정·삭제 시 MINIMAL과 ALL을 함께 검토한다. ALL에는 구현 상태를,
MINIMAL에는 최초 외부 제공 범위를 기록하며 전체 지원을 이유로 최소 범위를 임의 확장하지 않는다.
이름·JSON 위치·기본값·ENUM·고정 동작 변경은 두 문서와 인터페이스 계약서를 함께 갱신한다.
예제와 옵션 가이드가 영향을 받으면 같이 갱신하고 검증·미실행 항목을 CHANGELOG에 기록한다.
Word 생성 스크립트는 두 기능 정의서를 함께 포함하며, 문서의 지원 여부만으로 배포·검증 완료를 선언하지 않는다.
