# 57. 완료 전 닫기 옵션 폐기 및 Overlay·완료·나중에 보기 역할 분리 TODO

기준일: 2026-10-19 (KST)
상태: **구현 완료(WPF·서버·관리자 웹·문서, 자동 검증) · 실화면·원격 개발 환경 확인 대기**
조사 기준: main `803cd3c`, 현재 PopupWindow의 닫기·Overlay 처리 및 인터페이스 계약.
이번 작업은 계획 등록이다. 코드·API·DB 동작은 아직 변경하지 않았다.

## 확정 방향

`allowCloseBeforeComplete`를 폐기한다. 완료 기준, 외부 종료 제한, 완료 전 연기를 아래와 같이 분리한다.

| 항목 | 역할 |
|---|---|
| useBackgroundOverlay | 배경 조작과 Alt+F4·시스템 메뉴 닫기·외부 WM_CLOSE 제한. 기존 화면 출구 예외와 앱 종료 예외 유지 |
| completionRatio | 영상 시청 완료 기준. 일반 VIDEO 닫기 버튼과 영상 결합 QUIZ 입력 잠금 해제에 사용 |
| showLater | 완료하지 않고 다음 조회 주기로 미루는 버튼 표시. showFooter 조건 유지 |
| allowCloseBeforeComplete | 관리자 설정·API 공급·WPF 동작 분기에서 폐기 예정 |

- 일반 VIDEO는 시청 기준 전 일반 닫기 버튼 비활성, 기준 충족 후 활성으로 고정한다.
- 영상 결합 QUIZ는 시청 기준 전 문항 입력·제출 잠금을 유지하고 기준 충족 후 기존 설문·퀴즈 제출 조건을 적용한다. 영상 시청 완료를 퀴즈 완료로 바꾸지 않는다.
- 완료 전 화면 버튼으로 이탈하려면 나중에 보기를 사용한다. 기존 allowCloseBeforeComplete 기반 보조 닫기는 제거한다.
- Overlay가 꺼져 있으면 시청 기준 미달이어도 Alt+F4 등 외부 닫기를 허용한다. 기존 시청 잠금으로 외부 닫기를 다시 막지 않는다.
- Overlay가 켜져 있으면 기존 외부 닫기 제한을 적용한다. 시청을 마쳐도 Alt+F4는 자동 허용하지 않는다.
- 영상 재생 실패 시 닫기 허용 유지. Overlay 상태에서도 화면에 작동하는 종료 수단이 있어야 한다.
- 앱 종료·로그오프·프로세스 강제 종료는 시청 강제 정책으로 차단하지 않는다. 기존 결과 저장·복구 범위를 유지한다.
- showLater는 실제 버튼 표시 옵션이며, 완료 판정이나 Alt+F4 차단 옵션으로 재해석하지 않는다.

## 행동 기준표

| 상황 | 일반 닫기/제출 | Alt+F4 등 외부 닫기 | 나중에 보기 |
|---|---|---|---|
| VIDEO 시청 기준 전, Overlay OFF | 일반 닫기 비활성 | 허용 | showLater + showFooter이면 허용 |
| VIDEO 시청 기준 전, Overlay ON | 일반 닫기 비활성 | 기존 Overlay 정책으로 차단 | showLater + showFooter이면 허용 |
| VIDEO 시청 기준 충족 | 일반 닫기 활성 | Overlay 정책 적용 | 표시 중이면 기존 LATER 동작 유지 |
| 영상 결합 QUIZ 시청 기준 전 | 문항·제출 잠금 | Overlay 정책 적용 | 표시 조건 충족 시 허용 |
| 영상 결합 QUIZ 시청 기준 충족 | 기존 필수 응답·채점·제출 조건 적용 | Overlay 정책 적용 | 표시 조건 충족 시 허용 |
| 영상 재생 실패 | 종료 수단 제공, 완료로 자동 처리하지 않음 | 기존 Overlay/출구 예외 적용 | 표시 조건 충족 시 허용 |

Overlay의 “화면에 종료 수단이 전혀 없으면 외부 닫기 허용” 예외를 유지한다. 따라서 showFooter=false 등 잘못 조합된 화면까지 무조건 강제 시청된다고 설명하지 않는다. 강제 시청 용도는 Overlay ON, 정상 푸터/종료 수단 구성, showLater OFF를 함께 사용하며 재생 실패·앱 종료 예외는 남는다.

## 구현 TODO

### 57-1 영향 경로 목록화
- [x] DTO·PopupOptions·Factory·PopupWindow·VideoQuizPopupView·PopupManager에서 allowCloseBeforeComplete 사용 경로를 조사한다.
- [x] 서버 요청/응답 DTO·관리자 저장/조회·DB 매퍼·관리자 편집·미리보기·Demo·샘플·명세의 동일 필드를 목록화한다.
- [x] TODO43/44/52와 기존 외부 닫기·보조 닫기·LATER 처리의 변경/유지 지점을 표로 정리한다.

### 57-2 WPF 옵션 제거와 일반 VIDEO
- [x] allowCloseBeforeComplete를 읽는 동작 분기를 제거한다. 설정 true/false 여부와 무관하게 시청 기준 전 일반 닫기는 비활성으로 고정한다.
- [x] completionRatio 판정은 기존 누적 시청량 공통 계산 경로를 재사용한다. 현재 재생 위치나 최대 재생 위치를 완료 기준으로 바꾸지 않는다.
- [x] 닫기 버튼 활성 조건과 안내 문구를 일치시키고 영상 재생 실패 시 닫기를 활성화한다.
- [x] DTO·모델 제거 후 구 JSON의 해당 필드는 기존 모르는 필드 무시 정책으로 처리되는지 확인한다. 새 필드로 이름만 변경해 같은 옵션을 남기지 않는다.

### 57-3 외부 닫기와 앱 내부 닫기 분리
- [x] OnClosing의 allowCloseBeforeComplete 기반 시청 미달 차단을 제거하고 외부 닫기는 Overlay 정책으로 판단한다.
- [x] Overlay OFF + 미완료 영상에서 Alt+F4·시스템 메뉴·WM_CLOSE가 실제로 닫히는지 확인한다.
- [x] Overlay ON에서는 기존 CloseByApp 경로와 외부 닫기 구분, 출구 없음 예외, 앱 종료 예외를 유지한다.
- [x] 화면의 일반 닫기 이벤트에는 시청 기준 가드를 유지해 비활성 버튼의 우회 호출로 닫히지 않게 한다. 이를 외부 닫기 공통 차단으로 되돌리지 않는다.
- [x] Esc는 기존처럼 팝업 닫기로 사용하지 않는다. 영상 전체화면 해제 등 별도 동작은 유지한다.

### 57-4 영상 결합 QUIZ 및 재생 실패
- [x] allowCloseBeforeComplete로 표시하던 정상 재생 중 보조 닫기를 제거한다. 완료 전 연기는 showLater로 제공한다.
- [x] 영상 시청 후에도 문항·필수 응답·퀴즈 통과 여부에 따른 기존 제출 정책을 유지한다.
- [x] 재생 실패 시 보조 닫기 등 실행 가능한 종료 수단을 유지한다. 입력 잠금이 남아 있는 상태에서 제출 버튼만 남기는 교착을 방지한다.
- [x] 영상 없는 QUIZ의 기존 미통과 안내·보조 닫기 정책을 이 옵션 폐기에 끼워 변경하지 않는다.
- [x] TEXT·IMAGE·SURVEY의 정상 닫기·제출 동작은 유지한다.

### 57-5 LATER·HIDDEN·시청 기록 유지
- [x] 나중에 보기는 시청 기준과 관계없이 기존 표시 조건에서 허용하고 LATER를 전송한다. 완료 처리하지 않는다.
- [x] LATER의 현재 계약(이번 video 블록 미전송, 서버에 이미 저장된 시청 기록 유지)을 그대로 둔다. 이번 작업으로 시청 기록 보존 기능을 새로 확정하지 않는다.
- [x] Overlay OFF에서 일반 외부 닫기가 발생하면 기존 결과 생성기의 영상 시청 기록·완료 판단 경로를 유지한다. 이를 자동으로 LATER로 바꾸지 않는다.
- [x] HIDDEN/showDoNotShowAgain/hideDays는 별도 N일 숨김 기능으로 유지한다. LATER 우선순위 등 기존 결과 정책을 유지한다.
- [x] 완료 여부는 실제 결과와 기존 서버 판정에 따른다. UI 버튼이 닫혔다는 이유로 미달 영상을 완료 처리하지 않는다.
- [x] resultId·deliveryId·재전송 본문·미전송 큐 정책은 변경하지 않는다.

### 57-6 서버·관리자 웹 인계
- [x] 서버 담당자에게 allowCloseBeforeComplete 응답 공급·관리자 저장 옵션 폐기와 행동 기준표를 전달할 수 있도록 샘플을 정리한다.
- [x] 관리자 UI에서 옵션을 제거하고 completionRatio/showLater/useBackgroundOverlay의 설명을 새 역할에 맞춘다.
- [x] 웹 미리보기의 닫기·잠금·나중에 보기 표현도 WPF 기준에 맞추도록 Front 인계 항목으로 남긴다.
- [x] DB의 기존 컬럼은 즉시 DROP하지 않는다. 미사용 컬럼 존치/후속 정리는 서버 담당자가 결정한다.
- [x] 구 WPF는 해당 필드 누락 시 기존 기본값으로 동작할 수 있으므로 서버 필드 제거와 새 WPF 배포 순서·클라이언트 버전 호환을 확인한다. 필드 삭제만으로 구 클라이언트 동작까지 바뀐다고 가정하지 않는다.

### 57-7 Demo·계약·문서
- [x] Demo 상세옵션에서 allowCloseBeforeComplete를 제거하고 완료 기준/Overlay/Later 조합 샘플을 제공한다.
- [x] 조회 응답 샘플, 인터페이스 명세, ALL/MINIMAL, 옵션 가이드, Excel/Word/PDF의 해당 항목을 검토·동기화한다. 최소 명세에 없는 기능을 이번 작업으로 추가하지 않는다.
- [x] 제거 필드와 이전 버전 차이를 변경 이력에 기록한다. 과거 설계 기록은 당시 기준으로 보존하고 최신 기준은 TODO57을 참조하게 한다.
- [x] 외부 닫기 허용과 미완료 결과 저장을 설명해 “완료 기준 전에는 어떤 방법으로도 종료 불가”라는 잘못된 안내를 제거한다.

### 57-8 검증 및 완료 구분
- [ ] VIDEO/영상 결합 QUIZ × Overlay ON/OFF × 기준 미달/충족 × Later ON/OFF 조합의 핵심 행동을 검증한다.
- [ ] 재생 실패, 푸터 숨김, 정상 닫기, Alt+F4, 외부 WM_CLOSE, 나중에 보기, 앱 종료의 예외를 확인한다.
- [ ] 기존 추적되는 WPF 테스트에서 필요한 닫기·결과 회귀 검증만 보완하고 실제 Windows 버튼/키보드 흐름을 확인한다.
- [ ] 코드 검증과 실화면 검증, Front/Server 인계·통합 검증 상태를 구분한다. 담당자 검증 전 서버 전체 완료로 표시하지 않는다.

## 구현 기록 (2026-10-19)

### 영향 경로(57-1)

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| WPF PopupResponseDto·PopupOptions·PopupFactory | AllowCloseBeforeComplete(기본 true) 수신·전달 | 속성 제거. 구 JSON 필드는 System.Text.Json이 무시 |
| PopupWindow.CloseButton_Click | 일반 VIDEO 시청 가드는 false일 때만, VIDEO+QUIZ 보조 닫기는 true면 허용 | 일반 VIDEO 가드 항상 적용, VIDEO+QUIZ 보조 닫기는 재생 실패 때만 |
| PopupWindow.ShouldShowAuxClose | VIDEO+QUIZ: true 또는 재생 실패 | VIDEO+QUIZ: 재생 실패만. QUIZ(영상 없음) 규칙은 변경 없음(TODO43) |
| PopupWindow.RefreshFooterState | 일반 VIDEO 사유·비활성은 false일 때만 | 항상 |
| PopupWindow.OnClosing | false면 시청 기준 전 창 닫기 취소 + Overlay 정책 | Overlay 정책만(TODO44 출구 없음·앱 종료 예외 유지) |
| LATER(TODO52-2)·HIDDEN·결과 생성기 | - | 변경 없음 |
| Demo | 상세옵션 "완료 전 닫기 허용", VIDEO·VIDEO+QUIZ 샘플 true | 옵션 삭제, 두 샘플은 showLater=true로 완료 전 이탈 확인 |
| 서버 PopupResponseDto·WpfPopupItem·AdminPopupSaveCommand·PopupEntity·PopupService·PopupMapper | 저장·조회·WPF 응답에 포함 | 모두 제거. DB 컬럼 ALLOW_CLOSE_BEFORE_COMPLETE_YN은 존치·미사용(MERGE에서 읽기·쓰기 제외, 신규 행은 DB 기본값 'Y') |
| 관리자 웹 PopupAdmin.ts·PopupEditorDialog·PopupPreview | 스위치·미리보기 분기 | 스위치 삭제, 완료 비율·나중에 보기·배경 클릭 차단 설명을 새 역할로 변경, 미리보기 일반 VIDEO 잠금 항상 적용·VIDEO+QUIZ 보조 닫기 없음 |
| 명세·가이드·예제 | 옵션 설명 | 폐기 표기·행동 기준 반영(아래 57-7) |

### 결정·확인 사항

- 57-3: 외부 닫기는 ShouldCancelExternalClose(Overlay ON + 화면 출구 있음, 앱 닫기·앱 종료 제외)로만 취소한다. Overlay OFF는 시청 기준 전에도 닫히고 결과는 기존 결과 생성기의 VIDEO_WATCHED(시청 기록 포함)다. Overlay ON에서는 시청 후에도 Alt+F4를 막는다. 화면 버튼 핸들러의 시청 가드는 유지해 비활성 버튼 우회 호출로 닫히지 않는다.
- 57-4: showFooter=false인 VIDEO+QUIZ가 잠긴 채 재생 실패하면 보조 닫기가 숨겨져 화면 수단이 없으므로, 기존 TODO44 출구 없음 예외로 Overlay 상태에서도 키보드 닫기를 허용한다(변경 없음). 제출만 남는 교착은 이 예외로 해소된다.
- 57-6 구 클라이언트 호환: 구 WPF는 필드 누락 시 기본 true(완료 전 닫기 허용)로 동작한다. 새 서버는 필드를 보내지 않으므로 새 서버 + 구 WPF 조합에서는 VIDEO 닫기 활성·VIDEO+QUIZ 보조 닫기가 나타난다. 새 WPF 배포(또는 TODO13 클라이언트 최소 버전 상향) 후 서버를 반영한다. DB 컬럼 DROP은 하지 않았다.
- 57-7: Excel 정의서 공통 35·VIDEO 18·SURVEY_QUIZ 37행은 행 삭제 없이 폐기 표기, Sample JSON 2건에서 필드 제거. Word는 export-interface-word.cjs로 재생성, PDF는 export-interface-pdf.vbs(Word)로 재출력. 과거 설계 문서(TODO43·44·50·52)는 당시 기준으로 보존한다.

### 검증(57-8)

- PopupWindowTests 329건 통과: VIDEO·VIDEO+QUIZ × Overlay ON/OFF × 시청 전/후 외부 닫기, 구 allowCloseBeforeComplete true/false 무시, Overlay ON 재생 실패 시 버튼 닫기, 출구 없는 VIDEO 키보드 닫기, Overlay OFF 외부 닫기 결과 VIDEO_WATCHED, 앱 종료, 나중에 보기(LATER) 회귀.
- ApiDemoTests 69건·RichTextTests 102건·CornerWindowTests 761건 통과. 서버 gradlew test 139건 통과(Oracle 연동 8건 skip). 웹 tsc·eslint 통과, verify-completion-ux-43 56건 통과.
- 미실행: 실제 Windows에서 버튼·키보드(Alt+F4·시스템 메뉴) 실조작, 관리자 웹 실화면 저장·재조회, 원격 개발 서버 반영·구 WPF 조합 확인. 로컬 전용 Popup.BehaviorTests(.gitignore 대상)는 갱신하지 않았다(폐기 속성 참조로 빌드되지 않음).

## 책임과 완료 기준

WPF 담당 범위는 클라이언트 동작 수정·샘플·명세 전달·WPF 검증이다. Front/Server 구현과 DB 변경·통합 검증은 각 담당자의 범위로 분리한다.

완료 기준: 새 WPF는 allowCloseBeforeComplete에 의존하지 않고, 화면 버튼은 완료 기준, 외부 닫기는 Overlay, 완료 전 연기는 showLater로 판단한다. Overlay OFF의 미완료 외부 종료가 허용되며 재생 실패·앱 종료 예외와 기존 결과 기록이 유지된다. 관련 옵션·샘플·문서가 같은 정책을 설명하고 구 클라이언트 전환 영향을 기록한다.

Trello: https://trello.com/c/DwaD9y8L
