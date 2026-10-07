# WPF 팝업 전체 기능 버전 정의서

- 문서 성격: All Feature Specification / Implemented WPF Scope
- 작성 기준: 2026-10-07 (KST)
- 기준 소스: `PopupResponseDto`, `PopupOptions`, 유형별 Content DTO, `PopupFactory`, 각 View 및 서비스
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

## 2. 전체 기능 적용 원칙

| 구분 | 전체 버전 원칙 |
|---|---|
| 기능 노출 | 구현된 기능을 기록하되 최초 외부 제공 여부는 MINIMAL에서 별도 관리 |
| 창 크기 | 일반 콘텐츠는 최상위 Width/Height. 일반 IMAGE는 content.width/height 사용 |
| IMAGE 예외 | ORIGINAL은 공통 창 크기, FULLSCREEN은 모니터 전체 영역 우선 |
| 기본값 | 응답 DTO·Factory 기본값과 Demo·관리자 화면의 초기값을 구분 |
| 고정 동작 | UI·드래그·결과 큐 등의 동작을 가상의 API 필드로 만들지 않음 |
| 호환 필드 | 신규 이름과 이전 서버 수신 호환 이름을 구분 |
| 미구현 | 구현되지 않은 기능은 전체 기능에도 지원으로 적지 않음 |

## 3. 공통 기능 범위

### 3.1 공통 표시 및 정책

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| PopupId | 지원 | Y | `""` | 식별·숨김·결과 연결 ID. 서버가 유효값 보장 |
| PopupType | 지원 | Y | `""` | TEXT / IMAGE / VIDEO / SURVEY / QUIZ |
| Title | 지원 | N | `""` | 공통 Header 제목 |
| DisplayStartAt / DisplayEndAt | DTO 수신 | N | `null` | 기간·대상·숨김·완료를 판정한 최종 목록은 서버 책임 |
| DisplayMode | 지원 | N | `SEQUENTIAL` | SEQUENTIAL / SIMULTANEOUS |
| DisplayOrder | 지원 | N | `100` | 작은 순서 그룹부터 표시 |
| ShowHeader | 지원 | N | `true` | 제목·고정 로고 및 Header 영역 |
| ShowFooterButton | 지원 | N | `true` | `showFooterButton`. 일반 콘텐츠 Footer 버튼 표시 |
| showCloseButton | 이전 이름 수신 호환 | N | 미지정 | LegacyShowCloseButton setter가 ShowFooterButton에 반영. 신규·이전 이름을 동시에 보내지 않음 |
| ShowFooter | 지원 | N | `true` | Footer 전체 표시. SURVEY/QUIZ 제출 버튼 위치에도 영향 |
| ShowDoNotShowAgain | 지원 | N | `false` | 응답 DTO 기준. 직접 PopupOptions 생성 시 기본값은 true |
| HideDays | 지원 | N | `null` → 결과에서 30일 | 다시 보지 않기 결과의 숨김 일수 |
| content.FooterAction | 지원 | N | `""` | LINK_AND_CLOSE이면 링크 실행 후 종료 |
| content.FooterLinkUrl | 조건부 지원 | 조건부 | `""` | LINK_AND_CLOSE에서 유효한 HTTP/HTTPS 절대 URL |
| content.UseBackgroundOverlay | 지원 | N | `true` | 별도 Overlay 창 사용 |
| content.BackgroundOverlayOpacity | 지원 | N | `0.45` | 0~1로 보정. 뒤쪽 마우스 입력을 막으며 키보드 전체 차단은 아님 |
| content.HeaderFontSize | 지원 | N | `null` | 미지정 시 Header 17. 지정 시 10~40 보정 |
| content.BodyFontSize | 지원 | N | `null` | 미지정 시 View 기본. 지원 View에 본문 크기 전달 |
| content.FooterFontSize | 지원 | N | `null` | 미지정 시 Footer 14. 지정 시 10~40 보정 |
| CompletionRatio | 지원 | N | `null` → `1.0` | VIDEO / VIDEO+QUIZ 누적 시청 완료 기준 |
| AllowCloseBeforeComplete | 지원 | N | `true` | 영상 완료 전 종료 허용 정책. Header X는 없음 |
| PassingScore | QUIZ에서 지원 | 채점 시 제공 | `null` | 합격점은 서버가 계약에 맞게 제공 |

Header에는 닫기 버튼이 없고 로고에는 닫기 동작을 연결하지 않는다.
SURVEY·QUIZ·VIDEO+QUIZ는 `ShowFooterButton=false`여도 제출을 유지한다.
Footer가 있으면 공통 제출 버튼, 없으면 콘텐츠 내부 제출 버튼을 사용한다.
LINK_AND_CLOSE는 일반 콘텐츠에서 바로가기, 설문·퀴즈에서 제출로 표시하며
필수 응답 검증·QUIZ 통과 후 링크를 연다. URL 오류나 실행 실패 시 창을 유지한다.

### 3.2 크기·위치

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| Width / Height | 지원 | N | `900` / `620` | FIXED 공통 창 크기. 일반 IMAGE 예외는 4.2 참조 |
| SizeMode | 지원 | N | `FIXED` | FIXED / RATIO / FULLSCREEN / AUTO. AUTO는 WPF 지원이며 서버·웹 허용과 구분 |
| WidthRatio / HeightRatio | 지원 | N | `0.7` / `0.75` | RATIO 모니터 작업 영역 비율 |
| MinimumWidth / MinimumHeight | 지원 | N | `480` / `320` | 화면 상한과 함께 보정 |
| MaximumWidth / MaximumHeight | 지원 | N | `1200` / `900` | 일반 콘텐츠 상한. IMAGE는 현재 작업 영역의 90% 적용 |
| content.PopupPosition | 지원 | N | `CENTER` | 9개 위치. 알 수 없는 값은 CENTER |
| DragMove | 고정 동작 | 해당 없음 | 설정 필드 없음 | Header 또는 Header 없는 상단 이동 영역 사용 |

위치 값: CENTER, TOP_LEFT, TOP_CENTER, TOP_RIGHT, CENTER_LEFT, CENTER_RIGHT,
BOTTOM_LEFT, BOTTOM_CENTER, BOTTOM_RIGHT. 위치·크기 계산은 대상 모니터의 DPI와
작업 영역을 사용하며 FULLSCREEN은 전체 모니터 영역을 사용한다.

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
| PlainText | 지원 | 본문 사용 시 Y | `""` | 일반 문자열 본문 |
| ShowPlainText | 지원 | N | `true` | 본문 영역 표시 |
| ContentTitle / Description | 지원 | N | `""` | 콘텐츠 내부 제목·설명 |
| ShowContentHeader | 지원 | N | `true` | 내부 제목 영역 표시 |
| HighlightText | 지원 | N | `""` | 강조 문구 |
| ShowHighlight | 지원 | N | `false` | 문구 존재로 자동 추정하지 않음 |
| BottomDescription | 지원 | N | `""` | 하단 설명 |
| BottomDescriptionUrl | 지원 | 링크 사용 시 제공 | `""` | 하단 설명 링크 |
| ShowBottomDescription | 지원 | N | `false` | 하단 설명 표시 |

창 크기는 공통 Width/Height를 사용한다. MarkdownMode·MarkdownContent는 삭제된 기능이다.

### 4.2 IMAGE

| 항목(content) | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| ImageUrl | 지원 | Y | `""` | 이미지 URL 또는 로컬 경로 |
| ImageSizeMode | 지원 | N | `ADAPTIVE` | ADAPTIVE / FIT_TO_IMAGE / ORIGINAL. 관리자 신규 기본 ORIGINAL과 구분 |
| ImageTitle | 일반 모드에서 지원 | N | `""` | ORIGINAL View는 내부 제목을 표시하지 않음 |
| Description / ShowDescription | 일반 모드에서 지원 | N | `""` / `true` | 하단 설명·스크롤. ORIGINAL View에는 전달하지 않음 |
| Width / Height | 일반 모드에서 지원 | N | `null` | ADAPTIVE 창 크기, FIT_TO_IMAGE 이미지 표시 크기. ORIGINAL에서는 사용하지 않음 |
| KeepAspectRatio | FIT_TO_IMAGE에서 지원 | N | `true` | false면 지정한 두 축 크기로 왜곡 허용 |
| LinkUrl | ORIGINAL에서 지원 | 링크 사용 시 제공 | `""` | ImageFillPopupView에 전달. 일반 ImagePopupView에는 전달하지 않음 |

- ADAPTIVE: 창 우선, 비율을 유지해 이미지 표시.
- FIT_TO_IMAGE: 이미지 표시 크기 우선. 치수 생략 시 원본 DIP 크기 사용.
- ORIGINAL: 최상위 공통 창 크기를 사용하고 원본을 왼쪽 위에서 표시·Clip.
- 일반 모드는 최상위 중복 Width/Height 대신 content.width/height를 사용한다.
- 최대 창 크기는 현재 모니터 작업 영역의 90%. 지정 이미지가 넘치면 축소하지 않고 중앙 Clip.
- FULLSCREEN은 전체 모니터 크기가 우선이다. FILL 및 과거 IMAGE FIXED는 삭제된 값이다.

### 4.3 VIDEO

| 항목(content) | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| VideoUrl | 지원 | Y | `""` | 로컬 파일·URL. 엔진별 동작 차이는 아래 참고 |
| VideoTitle | 지원 | N | `""` | 콘텐츠 내부 제목 |
| Description / ShowDescription | 지원 | N | `""` / `true` | 영상 설명 |
| ShowControls | 지원 | N | `true` | 공통 WPF 컨트롤 |
| DefaultVolume | 지원 | N | `0.7` | Windows 음량 연결 전·실패 시 대체값 |
| AllowFullScreen | 지원 | N | `true` | 영상 플레이어 자체 전체화면 |
| AllowPlaybackRateChange | 지원 | N | `true` | false면 HTML5 포함 1.0배로 제한 |
| AutoPlay | 지원 | N | `false` | 자동 재생 |
| IsLoop | 지원 | N | `false` | 반복 재생 |

CompletionRatio와 AllowCloseBeforeComplete는 최상위 필드다. content 안에 중복 정의하지 않는다.
시청량은 단순 재생 위치와 구분해 누적하며 완료 기준은 콘텐츠·결과에 연결한다.
로컬 MediaElement와 WebView2 HTML5 경로의 공통 컨트롤·진행바·버퍼 표시·hover 표시를 지원한다.
Windows Master Volume/Mute 연결 성공 시 현재 시스템 값이 우선하며 종료 후 이전 값으로 복원하지 않는다.
연결 실패 시 내부 음량을 사용한다. IsMuted라는 별도 계약 필드는 없다.
YouTube iframe은 공통 HTML5 컨트롤과 시청량 측정 대상에서 제외한다.
AllowFullScreen과 공통 SizeMode=FULLSCREEN은 별도 기능이다.

### 4.4 SURVEY / QUIZ

| 항목 | 전체 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| Questions | 지원 | Y | `[]` | 최상위 문항 목록 |
| questions[].QuestionId | 지원 | Y | `0` | 실제 ID는 서버가 보장 |
| questions[].Title | 지원 | Y | `""` | 문항 제목 |
| questions[].Description | 지원 | N | `""` | 문항 설명 |
| questions[].QuestionType | 지원 | Y | `""` | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT |
| questions[].IsRequired | 지원 | 계약상 Y | `false` | 기본값과 계약상 제공 의무 구분 |
| questions[].Options | 선택형에서 지원 | 조건부 | `[]` | TEXT는 빈 배열 |
| questions[].OptionLayout | 지원 | N | `VERTICAL` | VERTICAL / HORIZONTAL |
| questions[].IsScored | QUIZ에서 지원 | 채점 시 제공 | `false` | 채점 대상 여부 |
| questions[].QuestionScore | QUIZ에서 지원 | 채점 시 제공 | `null` | 미지정 시 로컬 점수 0. 서버는 배점 보장 |
| questions[].CorrectAnswer | TEXT QUIZ에서 지원 | 채점 시 제공 | `null` | 주관식 정답. 최소 버전에서는 미제공 |
| questions[].AnswerMatchMode | TEXT QUIZ에서 지원 | 채점 시 제공 | `null` | EXACT / CONTAINS |
| options[].OptionId | 지원 | 선택형에서 Y | `0` | 응답 OPTION_ID 연결 |
| options[].Value / Text | 지원 | 선택형에서 Y | `""` | 전달 값·화면 문구 |
| options[].IsCorrect | QUIZ에서 지원 | 채점 시 제공 | `null` | 객관식 정답 표시. SURVEY는 채점하지 않음 |
| PassingScore | QUIZ에서 지원 | 채점 시 제공 | `null` | 최상위 합격점 |
| CloseOnFail | 고정 동작 | 해당 없음 | 설정 필드 없음 | 불합격 시 창 유지·수정·재채점 |

선택형은 VERTICAL 전체 폭 Row·우측 체크 Path, HORIZONTAL 공통 Chip으로 표시한다.
긴 문장 줄바꿈, 단일/복수 선택, 필수 미응답 검증, 주관식 입력·스크롤을 지원한다.
제출 영역은 스크롤 밖에 고정한다. QUIZ는 필수 검증·로컬 채점 후 통과 시 제출하며
서버 결과 전송을 기다리기 전에 로컬 큐 저장을 완료한다. RATING5·correctAnswers는 삭제된 계약이다.

### 4.5 VIDEO+QUIZ

별도 PopupType이 아니라 `PopupType=QUIZ + content.videoEnabled=true` 조합이다.
VideoEnabled 기본값은 false이며 4.3의 영상 content와 4.4의 최상위 Questions를 함께 사용한다.
CompletionRatio 도달 전에는 QUIZ 및 제출을 잠그고 도달 후 활성화한다.
영상·문항을 부모의 단일 세로 스크롤로 표시한다. 제출 결과 한 항목에 answers와 video를 포함한다.
VIDEO+SURVEY라는 별도 조합은 현재 계약에 없다.

## 5. API·클라이언트 고정 동작 및 주의사항

| 기능 | 전체 구현 범위 | 설정·계약 구분 |
|---|---|---|
| 인증 | SSO XML → 로그인 → Bearer, 토큰 만료 시 재로그인·재시도 | 인증 URL·실환경 통합 정책은 별도 연동 조건 |
| API | 로그인·목록 조회·결과 일괄 전송 | 요청·응답·경로는 인터페이스 계약서 참조 |
| 조회 | 30~60분 조회 정책, 실패 후 재조회 복구 | 팝업 content의 옵션이 아님 |
| 결과 | 닫기·숨김·제출 및 영상 정보, 로컬 pending-results 큐·백그라운드 전송 | 재전송은 같은 resultId 유지 |
| 제출 실패 | 필수 미응답·QUIZ 불합격·로컬 저장 실패 시 창 유지 | 별도 CloseOnFail 필드 없음 |
| 실행 | 트레이·단일 인스턴스·Demo 모드·예외 로그 및 제한된 재시작 | Demo 결과는 실제 서버·DB 저장과 구분 |
| 전체화면 | 영상이 있는 모니터에서 재생, 전체화면 시 공통 Radius 0 | 플레이어와 창의 전체화면을 구분 |
| 자동 업데이트 | 구현 기능으로 포함하지 않음 | 설계 17은 착수 보류 계획 |

서버가 기간·대상·숨김·완료를 판정하고 WPF에는 최종 표시 목록을 내려준다.
서버 DB·관리자 API·웹 입력 범위는 이 전체 WPF 기능 정의서의 지원 판정과 구분한다.
전체 기능 지원 표시는 모든 영상 엔진·Horizon·DPI 조합의 실환경 검증 완료를 뜻하지 않는다.
현재 남은 실측은 [설계 25](../design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md)와
[성능 측정 가이드](../reviews/20261007_저사양_PC_VIDEO_측정_가이드.md)를 참고한다.

## 6. 전체 버전 한눈에 보기

| 유형 | 전체 제공 기능 | 최소 버전과의 주요 차이 |
|---|---|---|
| 공통 | 표시 순서·동시 표시·크기 모드·9개 위치·폰트·Footer 링크·숨김·Overlay | 최소는 기본 표시 방식·위치·폰트 및 FIXED 중심 |
| TEXT | 본문·내부 제목·설명·강조·하단 설명 및 링크 | 최소는 본문·내부 제목·설명 중심 |
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
