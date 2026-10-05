# WPF 팝업 최소 기능 버전 정의서

- 문서 성격: Minimal Feature Specification / External Open Scope
- 작성 기준: 2026-10-06
- 기준 소스: 현재 `main` 코드 재검토 반영

## 1. 문서 목적

본 문서는 현재 구현된 WPF 팝업 기능 중 최초 외부 오픈 범위를 최소화하여 정의한다. 실제 코드가 지원하는 기능과 최초 제공 기능을 구분하며, 추후 요구가 발생하면 기능 단위로 추가 오픈할 수 있도록 한다.

백엔드 전달 시 함께 확인할 자료: [유형별 전체 JSON 예시](POPUP_INTERFACE_SPEC.md#15-유형별-전체-json-예시), [전체 응답 JSON 파일](examples/WPF-01-popup-types.json), 전체 인터페이스 6.4절의 필수값·누락 처리 점검. 필수 여부는 계약이며 현재 C#이 모든 누락을 거부하는 것은 아니다. 특히 popupId, 문항/선택지 ID, isRequired, 채점용 isScored·배점·정답·passingScore는 서버가 보장해야 한다. 선택 필드 생략과 명시적 null을 혼동하지 않는다.

## 2. 최소 기능 적용 원칙

| 구분 | 최소 버전 원칙 |
|---|---|
| 기능 노출 | 업무상 필요한 항목만 외부 설정값으로 노출 |
| 공통 크기 | 팝업 Window의 Width / Height를 공통 사용 |
| 타입별 크기 | 별도 타입 Width / Height를 중복 정의하지 않음 |
| 기본값 | 코드 기본값과 최소 버전 운영값이 다르면 비고에 구분 |
| 확장 | 현재 구현되어 있어도 최초 오픈 범위 밖이면 별도 기능 오픈 건으로 관리 |

## 3. 공통 기능 범위

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| PopupId | 지원 | Y | 없음 | 팝업 고유 ID |
| PopupType | 지원 | Y | `""` | TEXT / IMAGE / VIDEO / SURVEY / QUIZ |
| Width | 지원 | N | `900` | 팝업 Window 너비. 모든 타입 공통 |
| Height | 지원 | N | `620` | 팝업 Window 높이. 모든 타입 공통 |
| Title | 지원 | N | `""` | 공통 Header 제목 |
| ShowHeader | 지원 | N | `true` | 제목/Header 표시 여부 |
| ShowCloseButton | 지원 | N | `true` | 닫기(X) 버튼 |
| ShowFooter | 지원 | N | `true` | Footer 표시 |
| FooterAction | 지원 | N | `""` | `content.footerAction`. `LINK_AND_CLOSE` 지정 시 Footer 버튼을 바로가기로 사용 |
| FooterLinkUrl | FooterAction 사용 시 지원 | 조건부 | `""` | `content.footerLinkUrl`. `LINK_AND_CLOSE`일 때 열 HTTP/HTTPS URL |
| ShowDoNotShowAgain | 지원 | N | `false` | 다시 보지 않기 표시. 응답 DTO 기준 기본값 false |
| UseBackgroundOverlay | 지원 | N | `true` | content 옵션. 배경 Overlay 사용 |
| BackgroundOverlayOpacity | 지원 | N | `0.45` | Overlay 불투명도(0~1) |
| DragMove | 지원(고정 동작) | N | 설정 필드 없음 | 드래그 이동은 별도 API 옵션이 아닌 Window 동작 |
| HeaderFontSize | 미제공 | N | `null` | 설정 시 10~40 범위로 보정. null이면 XAML 기본 |
| BodyFontSize | 미제공 | N | `null` | TextStyle이라는 통합 필드는 없음 |
| FooterFontSize | 미제공 | N | `null` | Footer 글자 크기 |
| SizeMode | FIXED만 사용 | N | `FIXED` | 코드는 FIXED/RATIO/FULLSCREEN/AUTO 지원 |
| DisplayMode | 기본값 사용 | N | `SEQUENTIAL` | 코드는 SEQUENTIAL/SIMULTANEOUS 지원 |
| Position | 기본값 사용 | N | `CENTER` | `content.popupPosition`. 최소 버전은 CENTER 고정 |

> FontSize 계열은 미지정 시 각 XAML/콘텐츠 기본값을 유지하고, 값이 지정되면 10~40 범위로 보정(Clamp)하여 적용한다.

## 4. 팝업 유형별 최소 기능

### 4.1 TEXT

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| PlainText | 지원 | Y | `""` | 일반 본문 텍스트 |
| ShowPlainText | 지원 | N | `true` | PlainText 표시 여부 |
| ContentTitle | 지원 | N | `""` | TEXT 콘텐츠 내부 제목 |
| ShowContentHeader | 지원 | N | `true` | 콘텐츠 내부 제목 영역 표시 |
| Description | 지원 | N | `""` | 콘텐츠 설명 |
| HighlightText | 미제공 | N | `""` | 강조 텍스트 |
| ShowHighlight | 미제공 | N | `false` | 강조 영역 표시 |
| BottomDescription | 미제공 | N | `""` | 하단 설명 |
| ShowBottomDescription | 미제공 | N | `false` | 하단 설명 표시 |
| HeaderFontSize / BodyFontSize / FooterFontSize | 미제공 | N | `null` | 공통 옵션 사용. TextStyle이라는 별도 객체/필드는 없음 |

TEXT 크기는 별도 Width/Height가 아니라 공통 Width/Height를 사용한다.

### 4.2 IMAGE

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| ImageUrl | 지원 | Y | `""` | 이미지 URL 또는 경로 |
| ImageSizeMode | ORIGINAL만 사용 | Y(운영 기준) | 코드 기본 `ADAPTIVE` | 최소 버전은 `ORIGINAL`로 고정 전달 |
| ImageTitle | 미제공 | N | `""` | 이미지 콘텐츠 내부 제목 |
| Description | 미제공 | N | `""` | 이미지 설명 |
| ShowDescription | 미제공 | N | `true` | 설명 표시 여부 |
| LinkUrl | 미제공 | N | `""` | 이미지 클릭 링크 |

최소 IMAGE는 ORIGINAL 표시 + 공통 Width/Height만 사용한다. 일반 모드는 content.width/height만 사용하며 ORIGINAL에 적용하지 않는다. keepAspectRatio는 FIT_TO_IMAGE 전용이다.

### 4.3 VIDEO

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| VideoUrl | 지원 | Y | `""` | 영상 URL 또는 로컬 경로 |
| ShowControls | 지원 | N | `true` | 재생/일시정지/음량 등 기본 컨트롤 |
| DefaultVolume | 지원 | N | `0.7` | 시스템 볼륨 연결 전/실패 시 초기 음량. 연결 성공 시 현재 Windows 값 우선. 별도 IsMuted 필드는 없음 |
| AllowFullScreen | 지원 | N | `true` | 영상 플레이어 자체 전체화면 허용 |
| CompletionRatio | 지원 | N | `1.0` | 팝업 최상위 값. 완료 판단 비율 |
| VideoTitle | 미제공 | N | `""` | 영상 콘텐츠 내부 제목 |
| Description | 미제공 | N | `""` | 영상 설명 |
| ShowDescription | 미제공 | N | `true` | 영상 설명 표시 |
| AllowPlaybackRateChange | 미제공 | N | `true` | 배속 변경 허용 |
| AutoPlay | 미제공 | N | `false` | 자동 재생 |
| IsLoop | 미제공 | N | `false` | 반복 재생 |
| AllowCloseBeforeComplete | 미제공 | N | `true` | 팝업 최상위 값. 완료 전 닫기 허용 |
| SizeMode=FULLSCREEN | 지원 가능 | N | `FIXED` | 팝업 Window 자체 전체화면. AllowFullScreen과 별개 |

### 4.4 SURVEY / QUIZ

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| Questions | 지원 | Y | `[]` | 팝업 최상위 문항 목록 |
| QuestionId | 지원 | Y | `0` | 문항 ID |
| Title | 지원 | Y | `""` | 문항 제목 |
| QuestionType | 지원 | Y | `""` | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT |
| IsRequired | 지원 | N | `false` | 필수 응답 검증 |
| Options | 선택형에서 지원 | 조건부 | `[]` | 주관식(TEXT)은 빈 배열 |
| OptionLayout | 지원 | N | `VERTICAL` | VERTICAL / HORIZONTAL |
| VideoEnabled | VIDEO+QUIZ에서 지원 | N | `false` | `content.videoEnabled=true`이면 영상 시청 후 QUIZ를 푸는 결합형 화면 사용 |
| CompletionRatio | VIDEO+QUIZ에서 지원 | N | `1.0` | 누적 시청 도달률(0~1). 기준 도달 전 QUIZ 및 Footer 비활성화, 도달 시 활성화 |
| PassingScore | QUIZ에서 지원 | N | `null` | 팝업 최상위 값. SURVEY에서는 채점하지 않음 |
| IsScored | QUIZ에서 지원 | N | `false` | 문항 채점 대상 여부 |
| QuestionScore | QUIZ에서 지원 | N | `null` | 문항 배점 |
| CorrectAnswer | 미제공 | N | `null` | 주관식 정답. 최소 버전에서는 오픈하지 않음 |
| AnswerMatchMode | 미제공 | N | `null` | EXACT / CONTAINS. 주관식 정답 비교 방식 |
| CloseOnFail | 지원(고정 동작) | N | 설정 필드 없음 | 실제 필드는 없음. QUIZ 미통과 시 창을 유지하는 내부 동작 |

SURVEY는 단일 선택/복수 선택/주관식을 제공하되 채점하지 않는다. 점수·합격점·오답 시 닫기 제한은 QUIZ 동작으로 구분한다. 주관식 정답/자동 채점(`CorrectAnswer`/`AnswerMatchMode`)은 최소 버전에서 미제공한다.

단일/복수 선택의 VERTICAL은 전체 폭 Row·우측 체크 Path, HORIZONTAL은 공통 Chip으로 표시한다. 무채색 상태·긴 문장 줄바꿈·필수 응답 진행 상태는 UI 구현이며 추가 계약 필드가 없다. 제출 영역은 스크롤 밖 하단에 고정하고 필수 미응답 또는 영상 시청 잠금 시 비활성화한다. 공통 Footer가 있는 SURVEY/QUIZ의 버튼은 제출로 동작하며, Header 닫기는 기존 종료 정책을 유지한다. Demo·웹 미리보기의 예제/응답은 실제 API 데이터와 구분한다.

## 5. 필드 정리 시 주의사항

| 문서에서 혼동하기 쉬운 표현 | 실제 코드 기준 정리 |
|---|---|
| TextStyle | 해당 필드 없음. HeaderFontSize / BodyFontSize / FooterFontSize로 분리 |
| 공통 Width/Height vs IMAGE Width/Height | 공통값은 PopupWindow 크기, 일반 IMAGE content.width/height는 ADAPTIVE 창 크기 / FIT_TO_IMAGE 이미지 표시 크기 |
| ORIGINAL + ImageWidth/ImageHeight | ORIGINAL 모드에서는 ImageWidth/ImageHeight가 적용되지 않으므로 최소 버전에서 사용하지 않음 |
| IsMuted | 해당 필드 없음. 영상 컨트롤이 Windows Master Mute와 동기화하며 연결 실패 시 내부 음량으로 처리 |
| FULLSCREEN | AllowFullScreen(영상 플레이어 전체화면)과 SizeMode=FULLSCREEN(팝업 Window 전체화면)은 서로 다른 기능 |
| CloseOnFail | 해당 설정 필드 없음. QUIZ 미통과 시 창을 유지하는 내부 동작 |
| QuestionLayout | 실제 필드명은 OptionLayout. 선택지 배치를 VERTICAL/HORIZONTAL로 지정 |
| FooterAction / FooterLinkUrl | `footerAction=LINK_AND_CLOSE`이면 일반 콘텐츠는 “바로가기”, SURVEY·QUIZ·VIDEO+QUIZ는 “제출”로 표시. 응답 검증·퀴즈 통과 후 유효한 HTTP/HTTPS URL을 열고 종료 |
| VIDEO+QUIZ | `PopupType=QUIZ + content.videoEnabled=true` 조합. CompletionRatio 도달 전 Quiz/Footer 비활성화, 도달 후 활성화 |

## 6. 최소 버전 한눈에 보기

| 유형 | 최소 제공 기능 |
|---|---|
| 공통 | PopupId/PopupType + 공통 Width/Height + 제목/Header + 닫기 + Footer + 다시 보지 않기 + Overlay + 드래그 이동 + Footer 바로가기(URL 열기 후 닫기) |
| TEXT | PlainText 중심. 별도 TextStyle 없음. 공통 Width/Height 사용 |
| IMAGE | ImageUrl + ImageSizeMode=ORIGINAL + 공통 Width/Height. content.width/height 및 keepAspectRatio는 사용하지 않음 |
| VIDEO | VideoUrl + 기본 Controls/음량 + 영상 FullScreen + CompletionRatio + 공통 Width/Height |
| SURVEY | 단일/복수 선택 + 주관식 + 필수값 검증 + 선택지 VERTICAL/HORIZONTAL. 채점 없음 |
| QUIZ | 점수/합격점/배점 + 미통과 시 창 유지 + VIDEO+QUIZ(CompletionRatio 도달 후 Quiz/Footer 활성화). 주관식 정답 비교 기능은 최소 버전 미제공 |

## 7. 확장 기능 관리 원칙

현재 코드에 구현되어 있더라도 최초 오픈 범위에서 제외한 기능은 요구사항 확정 후 기능 단위로 별도 제공한다. 외부 문서에서는 “추가 기능 적용”으로 관리하며, 내부적으로는 기존 구현의 활성화 또는 필요한 보완 개발 여부를 검토하여 처리한다.

### 표시·조회 동작

- 로그인/기동 직후 최초 조회 후 30~60분 간격으로 기동 기준 반복 조회한다. 서버 `pollingIntervalSeconds`가 우선하며 선택 필드 누락/0 이하는 범위 제한된 WPF 로컬 설정을 유지한다. 서버만 활성·기간·대상·숨김·완료를 판단하고 WPF는 응답을 바로 표시한다. 열린 팝업도 조회하되 이번 실행에서 표시한 ID는 제외한다.
- 로컬 파일·HTTP/HTTPS 직접 영상은 동일한 WPF Overlay 컨트롤을 사용한다. 재생 중 무입력·마우스 이탈 시 숨기고 진입·이동 시 표시하며 일시정지·조작 중에는 유지한다. HTML5 브라우저 기본 controls는 표시하지 않고 ShowControls·AllowFullScreen을 두 재생 방식에 적용한다. 음량·음소거는 현재 Windows Master Volume/Mute와 동기화하며 내부 영상 음량은 1.0으로 유지한다. DefaultVolume은 시스템 연결 전/실패 시 초기 음량이다. Windows 값 변경은 다른 프로그램에도 영향을 주며 종료 시 이전 값으로 복원하지 않는다. 코드의 AllowPlaybackRateChange=false는 HTML5도 1.0배로 제한하지만 최소 오픈 범위의 배속 변경 옵션은 계속 미제공이다.
- VIDEO+QUIZ는 영상·전체 문항·제출 영역을 단일 세로 스크롤로 이동하고 공통 Footer는 창 하단에 고정한다. 단독 SURVEY/QUIZ 스크롤은 유지한다. YouTube iframe은 공통 HTML5 컨트롤 적용과 시청량 측정 대상에 포함하지 않는다.

### 추가 확인 사항

- Footer 바로가기는 `footerAction=LINK_AND_CLOSE`일 때만 동작하며 `footerLinkUrl`은 HTTP/HTTPS 절대 URL이어야 한다.
- VIDEO+QUIZ는 QUIZ 타입에서 `videoEnabled=true`인 경우에만 결합형으로 동작한다.
