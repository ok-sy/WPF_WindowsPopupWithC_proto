# WPF 팝업 최소 기능 버전 정의서

- 문서 성격: Minimal Feature Specification / External Open Scope
- 작성 기준: 2026-10-13 (KST)
- 기준 소스: 현재 `main` 코드 재검토 반영

## 1. 문서 목적

본 문서는 현재 구현된 WPF 팝업 기능 중 최초 외부 오픈 범위를 최소화하여 정의한다. 실제 코드가 지원하는 기능과 최초 제공 기능을 구분하며, 추후 요구가 발생하면 기능 단위로 추가 오픈할 수 있도록 한다.

구현된 전체 기능은 [WPF 팝업 전체 기능 버전 정의서](WPF_POPUP_ALL_SPEC.md)에서 함께 관리한다. 기능 변경 시 두 문서의 필드명·기본값·ENUM·고정 동작을 함께 확인하되, 전체 기능 추가만으로 최소 제공 범위를 확장하지 않는다.

백엔드 전달 시 함께 확인할 자료: [유형별 최소 JSON 예시](#8-백엔드-전달용-유형별-최소-json-예시), [복사·테스트용 최소 JSON 파일](examples/WPF-01-popup-types-minimal.json), [유형별 전체 JSON 예시](POPUP_INTERFACE_SPEC.md#15-유형별-전체-json-예시), [유형별 전체 popup 예시 파일](examples/WPF-01-popup-types.json), 전체 인터페이스 6.4절의 필수값·누락 처리 점검. 필수 여부는 계약이며 현재 C#이 모든 누락을 거부하는 것은 아니다. 특히 deliveryId, popupId, content, 문항/선택지 ID, isRequired, QUIZ의 isScored·배점·정답·passingScore는 서버가 보장해야 한다. 선택 필드 생략과 명시적 null을 혼동하지 않는다.

2026-10-21 TODO62 검토: 취소선과 문단 서식 메뉴는 전체 기능 확장이다. 최소 제공 범위에 `textBlocks`·취소선 설정을 새로 추가하지 않는다.

## 2. 최소 기능 적용 원칙

| 구분 | 최소 버전 원칙 |
|---|---|
| 기능 노출 | 업무상 필요한 항목만 외부 설정값으로 노출 |
| 공통 크기 | 팝업 Window의 Width / Height를 공통 사용. 최종 창은 고정 동작으로 최소 300 x 300(TODO68, 별도 설정 필드 노출 없음) |
| 타입별 크기 | 별도 타입 Width / Height를 중복 정의하지 않음 |
| 기본값 | 코드 기본값과 최소 버전에서 전달할 값이 다르면 비고에 구분 |
| 확장 | 현재 구현되어 있어도 최초 오픈 범위 밖이면 별도 기능 오픈 건으로 관리 |

## 3. 공통 기능 범위

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| DeliveryId | 지원 | Y | 계약 기본값 없음(C# 초기값 `""`) | 서버가 조회마다 발급·재사용하는 전달 건 ID(설계 35). WPF는 결과 요청에 그대로 보냄 |
| PopupId | 지원 | Y | 계약 기본값 없음(C# 초기값 `""`) | 팝업 고유 ID. 빈 값이면 결과 연결 생략 |
| PopupType | 지원 | Y | 계약 기본값 없음(C# 초기값 `""`) | TEXT / IMAGE / VIDEO / SURVEY / QUIZ. 빈 값·미지원 값은 Factory 오류 |
| Content | 지원 | Y | 없음(생략·null 시 화면 생성 실패) | 유형별 `content` object. null 금지. 유형별 필수값은 아래 표 적용 |
| Width | 지원 | N | `900` | 팝업 Window 너비. 모든 타입 공통 |
| Height | 지원 | N | `620` | 팝업 Window 높이. 모든 타입 공통 |
| Title | 지원 | Y(계약) | `""` | 공통 Header 제목. `showHeader=false`여도 백엔드 응답 계약상 값 제공 |
| ShowHeader | 지원 | N | `true` | 제목/Header 표시 여부 |
| ShowFooterButton | 지원 | N | `true` | Footer 버튼 표시. 일반 콘텐츠는 닫기·바로가기, SURVEY/QUIZ는 제출. 상단 X는 없음 |
| ShowFooter | 지원 | N | `true` | Footer 표시 |
| FooterAction | 지원 | N | `CLOSE`(SURVEY/QUIZ는 SUBMIT) | 최상위 `footerAction`. CLOSE 닫기 / LINK_AND_CLOSE 바로가기 / SUBMIT 제출(SURVEY·QUIZ 고정) |
| FooterLinkUrl | FooterAction 사용 시 지원 | 조건부 | `""` | 최상위 `footerLinkUrl`. `LINK_AND_CLOSE`일 때 열 HTTP/HTTPS URL |
| ShowDoNotShowAgain | 지원 | N | `false` | 다시 보지 않기 표시. 응답 DTO 기준 기본값 false |
| HideDays | 기본값 사용 | N | `null` → 결과에서 30일 | 다시 보지 않기 결과(HIDDEN)의 숨김 일수. 최소 버전은 생략해 30일 사용. 코드는 1~3650 값 지정 지원(관리자 저장 시 서버 검증) |
| UseBackgroundOverlay | 지원 | N | `true` | 최상위 `useBackgroundOverlay`. 배경 Overlay 사용 |
| BackgroundOverlayOpacity | 지원 | N | `0.45` | 최상위 `backgroundOverlayOpacity`. Overlay 불투명도(0~1) |
| DragMove | 지원(고정 동작) | N | 설정 필드 없음 | 드래그 이동은 별도 API 옵션이 아닌 Window 동작 |
| HeaderFontSize | 미제공 | N | `null` | 설정 시 10~40 범위로 보정. null이면 XAML 기본 |
| BodyFontSize | 미제공 | N | `null` | TextStyle이라는 통합 필드는 없음 |
| FooterFontSize | 미제공 | N | `null` | Footer 글자 크기 |
| SizeMode | FIXED만 사용 | N | `FIXED` | 코드는 FIXED/RATIO/FULLSCREEN/AUTO 지원 |
| DisplayMode | 기본값 사용 | N | `SEQUENTIAL` | 계약 값은 SEQUENTIAL/SIMULTANEOUS. 조회 응답이 1건이라 WPF는 값을 읽지 않고 항상 1건씩 표시 |
| DisplayOrder | 응답 필드 아님(설계 35) | - | - | 표시 순서는 서버가 정렬해 첫 1건만 내려주므로 조회 응답에 싣지 않음 |
| Position | 기본값 사용 | N | `CENTER` | 최상위 `popupPosition`. 최소 버전은 CENTER 고정 |

> `필수값 여부`의 `N`은 "생략하면 Default 값으로 동작"한다는 뜻이다. 인터페이스 계약서 6.3 표가 `O`(권장 출력)로 적은 필드라도 C# 기본값이 있으면 이 문서에서는 `N`으로 적으며 의미는 같다(계약서 6.4 "필수 여부 표기 기준"). Default의 "계약 기본값 없음(C# 초기값 …)"은 C# DTO 초기값이 있어도 백엔드가 생략해서는 안 되는 값이다.

> FontSize 계열은 미지정 시 각 XAML/콘텐츠 기본값을 유지하고, 값이 지정되면 10~40 범위로 보정(Clamp)하여 적용한다.

> JSON 계약명은 `showFooterButton`이며 서버 응답(Java `WpfPopupItem`)도 같은 이름을 사용한다. legacy `showCloseButton`은 수신하지 않는다(설계 29-11). `ShowFooterButton=false`여도 SURVEY·QUIZ·VIDEO+QUIZ의 제출 버튼은 유지한다. Header는 검은 배경·흰 제목·고정 로고·높이 40이며 일반 팝업 Radius 6, Fullscreen Radius 0은 API 옵션이 아닌 고정 외형이다.

## 4. 팝업 유형별 최소 기능

### 4.1 TEXT

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| PlainText | 지원 | 조건부(Y) | `""` | 일반 본문 텍스트. TextBlocks가 없을 때 표시하는 본문이며 최소 제공 범위는 TextBlocks를 쓰지 않으므로 본문을 표시하려면 제공. 콘텐츠 제목·설명이 있으면 앞 줄로 포함. 이 저장소 서버는 TEXT 응답에 항상 키를 채움(저장 본문이 없으면 `null` 가능) |
| ShowPlainText | 지원 | N | `true` | PlainText 표시 여부 |
| TextBlocks | 미제공 | N | 없음 | 서식 본문. 최소 제공 범위는 외부 클라이언트가 PlainText만 사용하면 된다는 뜻이다. 이 저장소 서버는 서식 본문이 있으면 textBlocks도 함께 보내며(plainText는 같은 내용의 파생 문자열), 최소 범위 클라이언트는 textBlocks를 무시해도 된다 |
| HighlightText | 미제공 | N | `""` | 강조 텍스트 |
| ShowHighlight | 미제공 | N | `false` | 강조 영역 표시 |
| BottomDescription | 미제공 | N | `""` | 하단 설명 |
| BottomDescriptionUrl | 미제공 | N | `""` | 하단 설명 링크 |
| ShowBottomDescription | 미제공 | N | `false` | 하단 설명 표시 |
| HeaderFontSize / BodyFontSize / FooterFontSize | 미제공 | N | `null` | 공통 옵션 사용. TextStyle이라는 별도 객체/필드는 없음 |

TEXT 크기는 별도 Width/Height가 아니라 공통 Width/Height를 사용한다.
ContentTitle·Description·ShowContentHeader는 설계 37에서 삭제했다. 콘텐츠 제목·설명은 PlainText의 첫 줄·다음 줄로 전달된다.

### 4.2 IMAGE

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| ImageUrl | 지원 | Y | `""` | 이미지 URL 또는 경로 |
| ImageSizeMode | ORIGINAL만 사용 | Y(최소 버전 명시 전달) | 코드 기본 `ADAPTIVE` | 생략하면 ADAPTIVE가 되므로 최소 버전은 `ORIGINAL`을 항상 명시해 전달 |
| ImageTitle | 미제공 | N | `""` | 이미지 콘텐츠 내부 제목 |
| Description | 미제공 | N | `""` | 이미지 설명 |
| ShowDescription | 미제공 | N | `true` | 설명 표시 여부 |

최소 IMAGE는 ORIGINAL 표시 + 공통 Width/Height만 사용한다. 전체 구현의 일반 모드도 같은 공통 Width/Height를 쓰며(TODO58, FIT_TO_IMAGE는 이미지 콘텐츠 영역으로 해석) content.width/height는 폐기했다. keepAspectRatio는 FIT_TO_IMAGE 전용이다.

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
| AllowSeek | 미제공 | N | `true` | 재생 위치 변경 허용. 생략 시 기존 탐색 가능 동작 |
| AutoPlay | 미제공 | N | `false` | 자동 재생 |
| IsLoop | 미제공 | N | `false` | 반복 재생 |
| ~~AllowCloseBeforeComplete~~ | 폐기(TODO57) | - | - | 미제공 항목이었고 전체 구현에서도 폐기. 새 WPF는 읽지 않는다 |
| SizeMode=FULLSCREEN | 지원 가능 | N | `FIXED` | 팝업 Window 자체 전체화면. AllowFullScreen과 별개 |

### 4.4 SURVEY / QUIZ

| 항목 | 최소 버전 | 필수값 여부 | Default 값 | 비고 |
|---|---|---:|---|---|
| Questions | 지원 | Y | `[]` | 팝업 최상위 문항 목록. 1개 이상 |
| QuestionId | 지원 | Y | `0` | 양수·팝업 내 고유 ID를 서버가 보장 |
| Title | 지원 | Y | `""` | 공백 아닌 문항 제목 |
| QuestionType | 지원 | Y | `""` | SURVEY: SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT. 최소 QUIZ: SINGLE_CHOICE / MULTIPLE_CHOICE |
| IsRequired | 지원 | Y(서버가 항상 true/false 제공) | `false` | 누락 시 false가 되어 필수 검증이 사라짐 |
| Options | 선택형에서 지원 | Y(선택형) | `[]` | 선택형 2개 이상. SURVEY TEXT는 빈 배열 |
| OptionId | 선택형에서 지원 | Y(선택형) | `0` | 양수·해당 문항 내 고유 ID |
| Value / Text | 선택형에서 지원 | Value N · Text Y(선택형) | `""` | 업무 값(선택) / 화면 문구. 응답 식별은 OptionId 사용 |
| IsCorrect | 최소 QUIZ 선택형에서 지원 | Y(QUIZ 선택형) | `null` | 정답 true, 오답 false를 명시 |
| OptionLayout | 지원 | N | `VERTICAL` | VERTICAL / HORIZONTAL |
| VideoEnabled | VIDEO+QUIZ에서 지원 | N | `false` | `content.videoEnabled=true`이면 영상 시청 후 QUIZ를 푸는 결합형 화면 사용 |
| CompletionRatio | VIDEO+QUIZ에서 지원 | N | `1.0` | 누적 시청 도달률(0~1). 기준 도달 전 QUIZ 및 Footer 비활성화, 도달 시 활성화 |
| PassingScore | QUIZ에서 지원 | Y(QUIZ) | `null` | 팝업 최상위 합격점. 0~총점. 누락 시 WPF는 0점 통과 기준으로 처리할 수 있음 |
| IsScored | QUIZ에서 지원 | Y(QUIZ) | `false` | 최소 QUIZ 문항은 true 명시. SURVEY는 false 사용 |
| QuestionScore | QUIZ에서 지원 | Y(QUIZ) | `null` | 양수 배점. 누락/null이면 WPF 로컬 계산은 0점 |
| CorrectAnswer | 미제공 | N | `null` | TEXT QUIZ 정답. 최소 버전의 QUIZ에서는 TEXT 자동 채점 자체를 오픈하지 않음 |
| AnswerMatchMode | 미제공 | N | `null` | EXACT / CONTAINS. 최소 버전의 QUIZ에서는 미사용 |

SURVEY는 단일 선택/복수 선택/주관식을 제공하되 채점하지 않는다. **최소 QUIZ는 SINGLE_CHOICE / MULTIPLE_CHOICE만 제공하며 TEXT 자동 채점은 최초 오픈 범위에서 제외한다.** QUIZ는 `isScored=true`, `questionScore`, 선택지별 `isCorrect`, 최상위 `passingScore`를 서버가 반드시 제공한다. QUIZ MULTIPLE_CHOICE는 `isCorrect=true` 선택지 수까지만 선택할 수 있다(TODO52-5 고정 동작, 추가 필드 없음). 미통과 시에는 별도 `CloseOnFail` JSON 필드 없이 WPF가 창을 유지하고 답 수정 후 재채점한다.

단일/복수 선택의 VERTICAL은 전체 폭 Row·우측 체크 Path, HORIZONTAL은 공통 Chip으로 표시한다. 무채색 상태·긴 문장 줄바꿈·필수 응답 진행 상태는 UI 구현이며 추가 계약 필드가 없다. 제출 영역은 스크롤 밖 하단에 고정하고 필수 미응답 또는 영상 시청 잠금 시 비활성화한다. 공통 Footer가 있는 SURVEY/QUIZ의 버튼은 제출로 동작한다. Header에는 닫기 버튼이 없으며 Alt+F4 등 종료 경로에는 기존 완료 전 종료 정책을 적용하고, 배경 Overlay가 켜져 있으면 화면에 닫기·제출 수단이 있는 동안 키보드 닫기를 막는다. Demo·웹 미리보기의 예제/응답은 실제 API 데이터와 구분한다.

## 5. 필드 정리 시 주의사항

| 문서에서 혼동하기 쉬운 표현 | 실제 코드 기준 정리 |
|---|---|
| TextStyle | 해당 필드 없음. HeaderFontSize / BodyFontSize / FooterFontSize로 분리 |
| 공통 Width/Height와 IMAGE | IMAGE도 공통 Width/Height 한 쌍만 쓴다(TODO58). ORIGINAL·ADAPTIVE는 창 크기, FIT_TO_IMAGE는 이미지 콘텐츠 영역 크기 |
| content.width/height | 폐기(TODO58). 최소 버전(ORIGINAL)은 원래 사용하지 않음. 구 키 `imageWidth/imageHeight`는 v3.6에서 폐기 |
| IsMuted | 해당 필드 없음. 영상 컨트롤이 Windows Master Mute와 동기화하며 연결 실패 시 내부 음량으로 처리 |
| FULLSCREEN | AllowFullScreen(영상 플레이어 전체화면)과 SizeMode=FULLSCREEN(팝업 Window 전체화면)은 서로 다른 기능 |
| QUIZ 미통과 동작 | 별도 JSON 설정 필드 없음. WPF가 창을 유지하고 답 수정 후 재채점 |
| QuestionLayout | 실제 필드명은 OptionLayout. 선택지 배치를 VERTICAL/HORIZONTAL로 지정 |
| FooterAction / FooterLinkUrl | `content`가 아니라 `popup` 최상위 값. 일반 콘텐츠는 CLOSE “닫기” 또는 LINK_AND_CLOSE “바로가기”(유효한 HTTP/HTTPS URL을 열고 종료), SURVEY·QUIZ·VIDEO+QUIZ는 SUBMIT “제출” 고정이며 링크를 열지 않음 |
| VIDEO+QUIZ | `PopupType=QUIZ + content.videoEnabled=true` 조합. CompletionRatio 도달 전 Quiz/Footer 비활성화, 도달 후 활성화 |

## 6. 최소 버전 한눈에 보기

| 유형 | 최소 제공 기능 |
|---|---|
| 공통 | PopupId/PopupType + 공통 Width/Height + 제목/Header + 닫기 + Footer + 다시 보지 않기 + Overlay + 드래그 이동 + Footer 바로가기(URL 열기 후 닫기) |
| TEXT | PlainText 중심. 별도 TextStyle 없음. 공통 Width/Height 사용 |
| IMAGE | ImageUrl + ImageSizeMode=ORIGINAL + 공통 Width/Height. keepAspectRatio는 사용하지 않음(content.width/height는 TODO58에서 폐기) |
| VIDEO | VideoUrl + 기본 Controls/음량 + 영상 FullScreen + CompletionRatio + 공통 Width/Height |
| SURVEY | 단일/복수 선택 + 주관식 + 필수값 검증 + 선택지 VERTICAL/HORIZONTAL. 채점 없음 |
| QUIZ | SINGLE_CHOICE / MULTIPLE_CHOICE 채점 + 배점/정답/합격점 + 미통과 시 창 유지 + VIDEO+QUIZ. TEXT 자동 채점은 최소 버전 미제공 |

## 7. 확장 기능 관리 원칙

현재 코드에 구현되어 있더라도 최초 오픈 범위에서 제외한 기능은 요구사항 확정 후 기능 단위로 별도 제공한다. 외부 문서에서는 “추가 기능 적용”으로 관리하며, 내부적으로는 기존 구현의 활성화 또는 필요한 보완 개발 여부를 검토하여 처리한다.

### 표시·조회 동작

- API는 로그인·단건 조회(`POST /api/wpf/popups`)·결과 1건 전송(`POST /api/wpf/popups/results`) 세 가지다(설계 35). 조회 응답은 `pollingIntervalSeconds`와 팝업 1건 `popup`(없으면 `null`)이며 결과 요청에는 `popup.deliveryId`를 넣는다. 상세는 [인터페이스 계약서](POPUP_INTERFACE_SPEC.md) 6·10·11절을 따른다.
- 로그인/기동 직후 최초 조회한다. 서버만 활성·기간·대상·숨김·완료·재노출 유예를 판단하고 표시 순서상 첫 1건을 내려주며 WPF는 받은 1건을 바로 표시한다. 표시 중에는 다른 조회를 하지 않는다. 결과 응답 `nextStatus`=AVAILABLE이면 즉시 다음 조회, EMPTY 또는 조회 결과 `popup=null`이면 가장 최근 `pollingIntervalSeconds`(30~60분)만큼 기다린 뒤 조회한다. 누락/0 이하는 범위 제한된 WPF 로컬 설정을 유지한다.
- 보내지 못한 결과가 남아 있거나 결과 큐 파일을 읽을 수 없으면 다음 팝업을 조회하지 않고 같은 resultId로 1건씩 재전송한다. 재전송한 결과의 nextStatus가 EMPTY면 조회 간격을 기다린다. 이 복구 동작은 주간회의 결정 전 임시 기준이다.
- 로컬 파일·HTTP/HTTPS 직접 영상은 동일한 WPF Overlay 컨트롤을 사용한다. 재생 중 무입력·마우스 이탈 시 숨기고 진입·이동 시 표시하며 일시정지·조작 중에는 유지한다. HTML5 브라우저 기본 controls는 표시하지 않고 ShowControls·AllowFullScreen을 두 재생 방식에 적용한다. 음량·음소거는 현재 Windows Master Volume/Mute와 동기화하며 내부 영상 음량은 1.0으로 유지한다. DefaultVolume은 시스템 연결 전/실패 시 초기 음량이다. Windows 값 변경은 다른 프로그램에도 영향을 주며 종료 시 이전 값으로 복원하지 않는다. 코드의 AllowPlaybackRateChange=false는 HTML5도 1.0배로 제한하지만 최소 오픈 범위의 배속 변경 옵션은 계속 미제공이다.
- VIDEO+QUIZ는 영상·전체 문항·제출 영역을 단일 세로 스크롤로 이동하고 공통 Footer는 창 하단에 고정한다. 단독 SURVEY/QUIZ 스크롤은 유지한다.

### 추가 확인 사항

- Footer 바로가기는 일반 콘텐츠에서 최상위 `footerAction=LINK_AND_CLOSE`일 때만 동작하며 최상위 `footerLinkUrl`은 HTTP/HTTPS 절대 URL이어야 한다.
- VIDEO+QUIZ는 QUIZ 타입에서 `videoEnabled=true`인 경우에만 결합형으로 동작한다.

## 8. 백엔드 전달용 유형별 최소 JSON 예시

아래 예시는 **최소 오픈 범위에서 백엔드가 WPF 조회 응답의 `popup` 1건을 만드는 기준**이다. 실제 응답은 `{"pollingIntervalSeconds": 1800, "popup": { … }}`처럼 한 번에 1건만 담는다. `deliveryId`는 서버가 조회마다 발급하며 예시 값은 형식 설명용이다. 선택 필드는 생략할 수 있지만 필수값은 기본값에 기대지 않고 명시한다. 유형별 예시 모음은 [examples/WPF-01-popup-types-minimal.json](examples/WPF-01-popup-types-minimal.json)을 사용한다.

### 8.1 TEXT

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1b01",
  "popupId": "TEXT-001",
  "popupType": "TEXT",
  "title": "서비스 안내",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "CLOSE",
  "showDoNotShowAgain": false,
  "questions": [],
  "content": {
    "plainText": "점검 공지\n안내 내용을 확인해 주세요.\n10월 5일 22시부터 23시까지 서비스 점검이 진행됩니다.",
    "showPlainText": true
  }
}
```

### 8.2 IMAGE

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1b02",
  "popupId": "IMAGE-001",
  "popupType": "IMAGE",
  "title": "교육 안내",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "CLOSE",
  "showDoNotShowAgain": false,
  "questions": [],
  "content": {
    "imageUrl": "https://example.com/media/training.png",
    "imageSizeMode": "ORIGINAL"
  }
}
```

### 8.3 VIDEO

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1b03",
  "popupId": "VIDEO-001",
  "popupType": "VIDEO",
  "title": "보안 교육",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "CLOSE",
  "showDoNotShowAgain": false,
  "completionRatio": 0.8,
  "questions": [],
  "content": {
    "videoUrl": "https://example.com/media/security.mp4",
    "showControls": true,
    "defaultVolume": 0.7,
    "allowFullScreen": true
  }
}
```

### 8.4 SURVEY

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1b04",
  "popupId": "SURVEY-001",
  "popupType": "SURVEY",
  "title": "교육 만족도 설문",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "SUBMIT",
  "showDoNotShowAgain": false,
  "questions": [
    {
      "questionId": 101,
      "title": "교육 내용을 이해하기 쉬웠나요?",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": false,
      "optionLayout": "VERTICAL",
      "options": [
        {
          "optionId": 1001,
          "value": "YES",
          "text": "네"
        },
        {
          "optionId": 1002,
          "value": "NO",
          "text": "아니요"
        }
      ]
    },
    {
      "questionId": 102,
      "title": "추가 의견을 작성해 주세요.",
      "questionType": "TEXT",
      "isRequired": false,
      "isScored": false,
      "optionLayout": "VERTICAL",
      "options": []
    }
  ],
  "content": {
    "surveyTitle": "교육 만족도 설문",
    "description": "필수 문항에 응답한 후 제출해 주세요."
  }
}
```

### 8.5 QUIZ

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1b05",
  "popupId": "QUIZ-001",
  "popupType": "QUIZ",
  "title": "보안 확인 퀴즈",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "SUBMIT",
  "showDoNotShowAgain": false,
  "passingScore": 80,
  "questions": [
    {
      "questionId": 201,
      "title": "안전한 연결 방식은 무엇인가요?",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": true,
      "questionScore": 100,
      "optionLayout": "VERTICAL",
      "options": [
        {
          "optionId": 2001,
          "value": "HTTPS",
          "text": "HTTPS",
          "isCorrect": true
        },
        {
          "optionId": 2002,
          "value": "HTTP",
          "text": "HTTP",
          "isCorrect": false
        }
      ]
    }
  ],
  "content": {
    "surveyTitle": "보안 확인 퀴즈",
    "description": "80점 이상 획득해야 합니다.",
    "videoEnabled": false
  }
}
```

### 8.6 VIDEO+QUIZ

```json
{
  "deliveryId": "3f2b8c1e-6a4d-4e2f-9b1a-0c7d5e8f1b06",
  "popupId": "VIDEO-QUIZ-001",
  "popupType": "QUIZ",
  "title": "영상 교육 및 확인 퀴즈",
  "displayMode": "SEQUENTIAL",
  "sizeMode": "FIXED",
  "width": 900,
  "height": 620,
  "showHeader": true,
  "showFooterButton": true,
  "showFooter": true,
  "footerAction": "SUBMIT",
  "showDoNotShowAgain": false,
  "completionRatio": 0.8,
  "passingScore": 80,
  "questions": [
    {
      "questionId": 301,
      "title": "안전한 연결 방식은 무엇인가요?",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": true,
      "questionScore": 100,
      "optionLayout": "VERTICAL",
      "options": [
        {
          "optionId": 3001,
          "value": "HTTPS",
          "text": "HTTPS",
          "isCorrect": true
        },
        {
          "optionId": 3002,
          "value": "HTTP",
          "text": "HTTP",
          "isCorrect": false
        }
      ]
    }
  ],
  "content": {
    "videoEnabled": true,
    "videoUrl": "https://example.com/media/security.mp4",
    "videoTitle": "영상 확인 퀴즈",
    "showControls": true,
    "defaultVolume": 0.7,
    "allowFullScreen": true,
    "surveyTitle": "영상 확인 퀴즈",
    "description": "영상의 80% 이상을 시청한 뒤 퀴즈에 응답해 주세요."
  }
}
```

> VIDEO+QUIZ의 콘텐츠 제목은 저장 컬럼 1개(CONTENT_TITLE = `surveyTitle`)에 저장하므로 이 저장소 서버는 `videoTitle`을 `surveyTitle`과 같은 값으로 내려준다.

> 최소 QUIZ 예시에는 TEXT 문항을 넣지 않는다. TEXT QUIZ 자동 채점은 전체 기능에는 구현되어 있지만 최소 외부 오픈 범위에서는 제외한다.

