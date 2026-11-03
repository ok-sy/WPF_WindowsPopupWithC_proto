# DTIY3117 저장 JSON — 유형별·옵션별 가짓수 산정과 샘플

- 작성: 2026-11-03 (KST)
- 대상: DTIY3117 `POPU_BLTN_CN` 저장 형태(popup 본체, deliveryId·pollingIntervalSeconds 없음)
- 기준: `popup-full-json-defaults.yml`(정책 `3117-REG-2026-10-29`), [WPF 전체 기능 정의서](../WPF_POPUP_ALL_SPEC.md), [기본값 전체 JSON](DTIY3117-register-defaults-full.txt)
- 소스: `popup-frameWork/Popup/DemoJsonSamples3117.cs`(옵션 영역·가짓수·샘플 생성), WPF Demo JSON Validator "3117 옵션 샘플" 창

## 1. 산정 기준

| 구분 | 기준 |
|---|---|
| 옵션 영역 | 서로 배타적인 값의 목록. 첫 값은 생략했을 때의 3117 기본값 |
| 이론 가짓수 | 그 유형에 적용되는 옵션 영역의 값 수를 모두 곱한 값. 화면상 차이가 없는 조합(예: `showFooter=false`일 때 `showLater`)도 세는 상한 |
| 숫자 옵션 | 범위 전체가 아니라 대표값 2개(기본/지정)로 셈: 글자 크기, `completionRatio`, `defaultVolume`, `passingScore` |
| 묶은 영역 | 함께 써야 의미가 있는 값은 한 영역으로 셈: `showDoNotShowAgain`+`hideDays`(3), `footerAction`+`footerLinkUrl`(2), IMAGE `imageSizeMode`+창 크기(5, ORIGINAL은 크기 필수라 6이 아니라 5) |
| 제외 | 서버 소유 값(deliveryId·pollingIntervalSeconds), 본문 문구·URL·문항 문구 같은 데이터, 고정 규칙으로 값이 하나뿐인 옵션(SURVEY·QUIZ `footerAction=SUBMIT`) |
| 문항 | 문항 1개 기준의 유효 조합을 한 영역으로 셈(아래 2.3) |

## 2. 옵션 영역

### 2.1 공통(모든 유형)

| 옵션 영역 | 값 수 | 값(첫 값 = 기본) |
|---|---:|---|
| displayMode | 2 | SEQUENTIAL / SIMULTANEOUS |
| sizeMode | 3 | FIXED / RATIO / FULLSCREEN (AUTO는 WPF 전용이라 저장 불가) |
| popupPosition | 9 | CENTER / TOP_LEFT / TOP_CENTER / TOP_RIGHT / CENTER_LEFT / CENTER_RIGHT / BOTTOM_LEFT / BOTTOM_CENTER / BOTTOM_RIGHT |
| showHeader | 2 | true / false |
| showFooter | 2 | true / false |
| showFooterButton | 2 | true / false |
| showLater | 2 | false / true |
| showDoNotShowAgain·hideDays | 3 | false / true(hideDays 생략 = 결과 30일) / true + hideDays 7 |
| useBackgroundOverlay | 2 | true / false |
| footerAction·footerLinkUrl | 2 | CLOSE / LINK_AND_CLOSE + URL (TEXT·IMAGE·VIDEO만, SURVEY·QUIZ는 SUBMIT 고정) |
| header·body·footerFontSize | 2 | null(WPF 기본) / 지정 |

공통 곱: 일반 유형 20,736 = 2×3×9×2×2×2×2×3×2×2×2, 문항 유형 10,368(footerAction 제외).

### 2.2 유형 고유

| 유형 | 옵션 영역(값 수) | 유형 고유 곱 |
|---|---|---:|
| TEXT | 본문 형식 plainText/textBlocks(2), showPlainText(2), showBottomDescription(2) | 8 |
| IMAGE | imageSizeMode·크기(5: ADAPTIVE 미지정/지정, FIT_TO_IMAGE 미지정/지정, ORIGINAL 지정), showDescription(2), keepAspectRatio(2) | 20 |
| VIDEO | showDescription·showControls·allowFullScreen·allowPlaybackRateChange·allowSeek·autoPlay·isLoop(각 2), defaultVolume(2), completionRatio(2) | 512 |
| SURVEY | 문항 구성(22) | 22 |
| QUIZ | 문항 구성(24), passingScore(2) | 48 |
| VIDEO_QUIZ | VIDEO 영역(512) × 문항 구성(24) × passingScore(2) | 24,576 |

### 2.3 문항 구성(문항 1개 기준)

| 유형 | 산식 | 값 수 |
|---|---|---:|
| SURVEY | SINGLE(배치 2 × 필수 2) 4 + MULTIPLE(배치 2 × 필수 2 × 선택 수 제한 4: 없음/최소 2/최대 2/2~3개) 16 + TEXT(필수 2) 2 | 22 |
| QUIZ | SINGLE(배치 2 × 필수 2 × 채점 2) 8 + MULTIPLE(같음) 8 + TEXT(필수 2 × 채점 2 × 정답 비교 EXACT/CONTAINS 2) 8 | 24 |

선택 수 제한은 SURVEY 복수 선택에만, 정답 비교 방식은 QUIZ 주관식에만 있다. 문항이 여러 개면 문항마다 곱해진다(문항 n개 = 문항 구성 값 수의 n제곱).

## 3. 가짓수와 샘플 수

| 유형 | 이론 가짓수 | 옵션 영역 수 | 샘플(기본 1 + 옵션 변경) |
|---|---:|---:|---:|
| TEXT | 165,888 | 14 | 24 (1 + 23) |
| IMAGE | 414,720 | 14 | 27 (1 + 26) |
| VIDEO | 10,616,832 | 20 | 30 (1 + 29) |
| SURVEY | 228,096 | 11 | 41 (1 + 40) |
| QUIZ | 497,664 | 12 | 44 (1 + 43) |
| VIDEO_QUIZ | 254,803,968 | 21 | 53 (1 + 52) |
| 합계 | 266,727,168 | - | 219 + 규칙 위반 13 |

- 전수 조합은 2억 건이 넘어 샘플로 만들지 않는다. 샘플은 **기본 1건 + 옵션 영역마다 기본이 아닌 값을 하나씩만 바꾼 건**이며, 모든 옵션 값이 최소 한 번 나온다. 옵션 사이의 상호작용(예: showFooter=false × showLater=true)은 이 샘플로 다 덮지 않는다.
- 기본 샘플은 필수 입력값(본문·URL·문항)만 넣고, 나머지는 검증기가 3117 기본값으로 채운다.
- keepAspectRatio=false 샘플은 이 값이 의미 있는 FIT_TO_IMAGE 640×480을 함께 지정한다.
- 이미지·영상 URL은 `LOCAL_DEMO_IMAGE`·`LOCAL_DEMO_VIDEO` 토큰이며, 팝업을 띄울 때만 Demo 내장 미디어 경로로 바꾼다.

## 4. 규칙 위반 예시(ERROR가 나와야 정상)

| ID | 유형 | 위반 |
|---|---|---|
| S3117-ERR-01 | TEXT | 본문 없음(plainText·textBlocks 모두 없음) |
| S3117-ERR-02 | TEXT | LINK_AND_CLOSE인데 footerLinkUrl 없음 |
| S3117-ERR-03 | TEXT | sizeMode AUTO(WPF 전용) |
| S3117-ERR-04 | TEXT | showHeader 문자열 "true"(타입 불일치) |
| S3117-ERR-05 | IMAGE | ORIGINAL인데 width/height 없음 |
| S3117-ERR-06 | IMAGE | imageUrl 없음 |
| S3117-ERR-07 | VIDEO | videoUrl 없음 |
| S3117-ERR-08 | SURVEY | footerAction CLOSE(SUBMIT 고정) |
| S3117-ERR-09 | SURVEY | 선택형 문항에 선택지 없음 |
| S3117-ERR-10 | QUIZ | 문항 0개 |
| S3117-ERR-11 | VIDEO_QUIZ | popupType VIDEO_QUIZ(독립 유형 아님) |
| S3117-ERR-12 | VIDEO_QUIZ | videoEnabled 문자열 "true"(타입 불일치) |
| S3117-ERR-13 | TEXT | 응답 envelope `{popup:{...}}`로 저장 |

## 5. WPF Demo에서 보기

1. Demo 화면 → `JSON Validator · JSON 검증 / 유형별 예시` → `3117 옵션 샘플`.
2. 유형(전체·TEXT~VIDEO_QUIZ·규칙 위반)을 고르면 위쪽에 이론 가짓수·옵션 영역 산식·샘플 수가 나오고, 목록에서 샘플 JSON을 볼 수 있다.
3. `검증 후 팝업 띄우기`(또는 목록 더블클릭): 3117 모드로 검증해 ERROR가 없으면 기본값이 채워진 정규화 JSON으로 실제 팝업을 띄운다.
4. `입력창에 적용(3117 모드)`: 검증 창 입력란에 넣고 모드를 "서버 저장 JSON (3117)"로 바꾼다. 수정한 뒤 `Submit · 검증` 또는 `팝업 띄우기`로 확인한다.

팝업 띄우기는 결과 훅을 연결하지 않아 닫기·제출 결과를 저장·전송하지 않고 Demo 서버 상태(숨김·완료)도 바꾸지 않는다. 표시 중인 팝업이 있으면 먼저 닫아야 한다. C# 검증기는 진단용이라 서버 `PopupJsonValidator`와 규칙 일부(선택 수 제한 범위 등)가 다를 수 있다.

## 6. 옵션 추가·삭제 시

`DemoJsonSamples3117.Domains`에 옵션 영역을 추가하거나 값을 늘리면 가짓수와 샘플이 함께 바뀐다. 이 문서의 표와 로컬 BehaviorTests `CheckJsonSamples3117`의 기대값을 함께 고친다.
