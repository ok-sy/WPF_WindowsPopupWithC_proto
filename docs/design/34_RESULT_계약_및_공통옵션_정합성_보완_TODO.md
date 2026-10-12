# 34. RESULT 계약 및 공통 옵션 정합성 보완 TODO

## 1. 목적과 적용 기준

TODO 29~33의 후속 검토 결과와 확정 요건을 통합한다.
이 문서는 구현 계획이며, 체크되지 않은 항목은 구현 완료를 뜻하지 않는다.

- 기준 소스: main `de3a6085de4363f51940743b6b11e5acced0bca3`.
- 현재는 개발자 1인이 사용하는 프로토타입이며 Demo EXE로 시연한 상태다. 배포된 지원 대상 구버전은 없다.
- 서버·WPF·관리자 웹·Demo·샘플을 신규 계약으로 함께 정리한다.
- 구버전 fallback, 신구 필드 중복 전송, 단계적 배포, 이번 변경을 위한 최소 지원 버전 상향은 작업 범위에서 제외한다. 기존 버전 검증 기능 자체를 삭제하는 의미는 아니다.
- **29~33의 내용과 충돌하면 본 문서의 확정 기준을 우선한다.** 특히 30·31의 단계별 호환 정책과 33의 응답 유지 목록은 아래 기준으로 대체한다.
- 이번 커밋은 TODO 및 변경 이력만 추가한다. 기능 구현은 별도 작업이다.

## 2. 범위와 보류 요건

### 이번 범위

1. RESULT 요청·응답의 사용처와 의미를 대조하고 중복·미사용 항목 정리.
2. WPF 채점·통과 판정과 서버 저장·완료 처리 일치.
3. RESULT 처리 상태에 따른 큐 삭제·재시도 정합성 보완.
4. Footer Action 및 PopupWindow 공통 옵션의 최상위 계약 확정.
5. 관련 Demo·문서·샘플·테스트 정합성 확보.

### 보류 — 구현하지 않음

- 첫 조회에서 팝업 1개만 전달하는 방식.
- 결과 저장 응답과 다음 팝업 전달의 결합, 또는 결과 응답 후 다음 팝업 조회.
- 위 방식에 따른 게시중단 재확인, 표시 대기 큐 재설계, 동시 표시 정책 변경.

이들은 요건 전달·판단 단계이며 이번 RESULT 필드 정리의 누락 사항으로 취급하지 않는다.
현재 목록 조회 및 표시 구조를 전제로 작업한다. 결과의 영속 저장·재시도 보완은 이 보류 요건과 별개다.

## 3. RESULT 요청·응답 항목

### 3.1 확정 사항

| 위치 | 필드 | 방향 | 이유/보존 범위 |
|---|---|---|---|
| 요청 | responseStartedAt | 제거 | 현재 displayedAt을 복사하여 중복 |
| 요청 | displayedAt / closedAt | 유지 | 표시·종료 또는 제출 시각 |
| 요청 | score / passed | 유지 | QUIZ의 WPF 최종 채점·통과값 |
| 요청 | answers / video / hideDays | 유형별 유지 | 답안·영상 시청량·숨김 처리 입력 |
| 응답 | totalScore / passed | 제거 | 사용자 판정은 WPF에서 완료 |
| 응답 | hiddenUntil | 제거 | 서버 숨김 관리값을 WPF에 다시 전달할 필요 없음 |
| 응답 | watchedRatio / requiredRatio | 제거 | 결과 처리 응답에서 재전달 불필요 |
| 응답 | resultId / status | 유지 | 결과 항목 식별 및 처리 상태 판별 |
| 응답 | code / message | 유지 | 실패 사유와 재시도 판단·진단 |

응답 필드 삭제는 요청 데이터, 서버 내부 계산, DB 저장, 로그 삭제를 뜻하지 않는다.
숨김 만료 및 영상 시청 기록·완료 계산은 유지한다.
목록 응답의 completionRatio, passingScore 등 WPF 실행 정책값도 이번 RESULT 응답 삭제 대상과 구분한다.

### 3.2 나머지 항목의 최소화 점검

- [x] 34-01 C# DTO·사용처, Java DTO·응답 조립, Demo, JSON, 문서·Excel의 RESULT 전체 필드 대조표 작성. — §3.4 작성(Excel은 저장소에 없어 제외)
- [x] 34-02 응답 receivedAt / popupId / resultType / popupStatus / completed / completedAt / responseId의 실제 사용처와 진단 필요를 항목별 기록. — §3.4 응답 표
- [x] 34-03 위 항목은 유지 확정 목록으로 간주하지 않는다. 필요한 항목만 남기되, 삭제 여부와 이유를 대조표에 먼저 확정한다. — 2026-10-12: 로그·WPF 미사용 확인 후 receivedAt·popupStatus·completed·completedAt·responseId 제거, popupId·resultType 유지(§3.4)
- [x] 34-04 resultId는 WPF 결과 항목의 멱등·응답 대응 키, responseId는 서버 응답 저장 레코드 식별자임을 구분한다. 이름이 비슷하다는 이유만으로 서로 대체하지 않는다. — §3.4 responseId 행
- [x] 34-05 응답의 totalScore / passed / hiddenUntil / watchedRatio / requiredRatio를 C#·Java DTO, 응답 builder, Demo, 예제·문서에서 제거. — 2026-10-12 제거(Java 응답·builder·processor, C# DTO, Demo 게이트웨이, 예제·계약서)
- [x] 34-06 제거한 응답 필드의 내부 저장·로그·완료/숨김 처리 경로가 유지되는지 확인. — hidePopup·saveVideoProgress·markPopupCompleted 경로 유지 확인(WpfResultProcessorTest·DB 연동 테스트)

### 3.4 RESULT 필드 대조표 (2026-10-12 작성, 34-01·02·04)

기준: C# `WpfResultDtos.cs`·`PopupResultBuilder`·`PopupResultQueue`·`DemoPopupGateway`·`DemoWindow`, Java `WpfResultRequest`·`WpfResultCommand`·`WpfResultItemResponse`·`WpfResultProcessor`·`WpfPopupService`·`PopupService`, `api/examples`, `POPUP_INTERFACE_SPEC.md` §10~11. Excel 정의서는 저장소에 없어 대조 제외.

요청

| 필드 | WPF 생성 | 서버 사용 | 상태 |
|---|---|---|---|
| clientRequestId | 전송마다 새 GUID | WPF_API_REQUEST_LOG 요청 로그 | 유지(진단) |
| sentAt | 전송 시각 | 수신만 하고 업무 미사용 | 유지 여부 결정 필요(진단용, 서버 미사용) |
| resultId | 결과 생성 시 GUID, 재전송 시 유지 | WPF_RESULT_RECEIPT 멱등 키, POPUP_RESPONSE.CLIENT_REQUEST_ID | 유지 |
| popupId / resultType | 팝업 ID·유형 | 처리 분기·대상 확인 | 유지 |
| displayedAt / closedAt | 표시·종료(제출) 시각 | USER_POPUP_STATUS 표시 횟수·닫기 시각 | 유지 |
| hideDays | HIDDEN | 숨김 만료 계산 | 유지 |
| answers | SUBMITTED | 문항 소속·필수 답안 검증, 문항별 상세 저장 | 유지 |
| score / passed | QUIZ SUBMITTED | 최종 점수·통과·완료 판정 저장(설계 33) | 유지 |
| video | VIDEO_WATCHED, 동영상+퀴즈 SUBMITTED | 시청 기록·완료 판정 | 유지 |
| responseStartedAt | — | — | 제거 완료(설계 32) |

응답 (`results[]` 외 ROOT `receivedAt`)

| 필드 | 서버 설정 | WPF 사용처 | 상태 |
|---|---|---|---|
| resultId | 요청 echo | 큐 종결 판정(PopupResultQueue) | 유지 |
| status | 처리 상태 | 큐 종결 판정·거절 로그·Demo 로그 | 유지 |
| code / message | 거절·오류 사유 | 거절 로그·Demo 로그 | 유지 |
| popupId / resultType | 요청 echo | 거절·미종결 로그 문구 | 유지(진단 로그) |
| receivedAt | — | 없음 | 제거 완료(34-03). 서버 수신 시각은 요청 로그에 남음 |
| popupStatus / completed / completedAt | — | 없음 | 제거 완료(34-03). 완료 여부는 다음 목록 조회가 반영. 응답 조립용 상태 조회(selectStatus)도 제거 |
| responseId | POPUP_RESPONSE.RESPONSE_ID | 없음 | 제거 완료(34-03). resultId(WPF 결과 멱등·응답 대응 키)와 다른 서버 저장 레코드 식별자이며 서로 대체하지 않음(34-04) |
| totalScore / passed | — | — | 제거 완료(설계 33) |
| hiddenUntil / watchedRatio / requiredRatio | — | — | 제거 완료(34-05). 숨김 만료·시청 기록·완료 계산은 서버 내부 유지(34-06) |

### 3.3 responseStartedAt 제거

- [x] 34-07 WpfResultItemDto, PopupResultBuilder.BuildSubmitted, WpfResultRequest.Item, WpfResultCommand와 서비스 전달 경로에서 responseStartedAt 제거. — TODO32 커밋(568ec33)
- [x] 34-08 PopupService.submitResponse 및 Mapper의 RESPONSE_STARTED_AT 의존을 확인하고, DB 컬럼 유지/제거와 기존 데이터 처리 방식을 명시. — 컬럼 삭제로 결정, 12번 스크립트를 로컬 XE·원격 개발 DB에 적용(기존 값 0행)
- [x] 34-09 closedAt - displayedAt은 화면 체류/처리 시간이며 실제 첫 입력부터의 응답 시간은 아님을 문서화. DB 통계가 필요하면 해당 결과의 두 시각을 보존·연계하는 경로 확인. — 계약서 §10.4·WpfResultCommand·설계 32 문구 정정. 서버는 USER_POPUP_STATUS에 사용자·팝업 단위 최신 표시·닫기 시각만 보존하므로 결과 건별 통계가 필요하면 별도 결정
- [x] 34-10 개발용 pending-results.json에 실제 미전송 자료가 있으면 결과 유실 없이 전환. 구버전 상시 호환 로직은 만들지 않으며, 테스트 데이터 초기화가 필요하면 명시적으로 수행. — 실제 %LOCALAPPDATA%\Popup\pending-results.json 없음 확인(전환 대상 없음). 구버전 호환 로직 미추가

## 4. WPF 판정값을 서버가 저장

확정 흐름:

```text
WPF 답안 검증·채점 → score/passed 확정 → 결과 로컬 저장 → 전송
서버 요청 검증·멱등 처리 → WPF score/passed 저장 → 같은 판정으로 완료 처리
```

현재 WpfResultProcessor는 WPF 값을 불일치 로그에만 사용하고,
PopupService.submitResponse는 자체 채점한 totalScore/passedYn을 DB 및 완료 상태에 반영한다.
응답 DTO에서 점수 필드만 삭제해서는 책임 불일치가 해결되지 않는다.

- [x] 34-11 QUIZ의 최종 저장 점수·통과값을 요청 score/passed로 변경. — TODO33 커밋
- [x] 34-12 USER_POPUP_STATUS 완료 처리에 동일한 passed를 적용하여 WPF 합격과 서버 미완료가 어긋나지 않도록 정리. — markPopupCompleted에 WPF passed 적용
- [x] 34-13 신규 QUIZ SUBMITTED에서 score/passed 누락 및 잘못된 자료형·값의 검증 정책 확정. 구버전용 서버 재채점 fallback은 추가하지 않음. — QUIZ score/passed 누락·음수·NaN → REJECTED(WPF_INVALID_RESULT), 재채점 fallback 없음
- [x] 34-14 SURVEY는 점수·통과값을 강제하지 않고 제출 완료로 처리. QUIZ와 SURVEY 검증·저장 분기 명시. — SURVEY는 WPF 값 미사용, 0점·통과로 제출 완료
- [x] 34-15 서버 계산을 유지한다면 비교·진단 전용으로 분리하고 최종 점수·통과·완료를 덮어쓰지 않도록 보장. — 서버 계산은 문항 상세·불일치 로그 전용(PopupSubmitScoreTest)
- [x] 34-16 문항별 earnedScore/correctYn과 WPF 총점의 정합성 정책 확정. 진단값과 최종 저장값을 혼동하지 않도록 문서화. — 계약서 §10.6: 문항별 점수·정오답은 진단값, 최종 점수·통과·완료는 WPF 값 기준
- [x] 34-17 형식·문항 소속·선택지·필수 답안·영상 요건·인증 검증을 단순 점수 저장 변경 때문에 제거하지 않음. — 문항 소속·선택지·필수 답안·영상 요건·인증 검증 유지
- [x] 34-18 표시 후 정답/합격점 변경 사례에서 WPF 결과가 서버 재계산으로 바뀌지 않는지 검증. 데이터 버전 정책이 필요하면 후속 결정 사항으로 기록. — 서버 계산과 다른 WPF 값이 그대로 저장되는지 검증(PopupSubmitScoreTest). 데이터 버전 정책은 후속 결정

## 5. RESULT 저장 성공·실패와 재전송

현재 WpfPopupService.processResults는 RuntimeException도 REJECTED/WPF_INTERNAL로 반환하며,
PopupResultQueue.FlushAsync는 응답에 resultId가 있으면 상태와 무관하게 큐에서 삭제한다.
따라서 일시적인 DB 장애로 저장 실패한 결과가 재시도 없이 소실될 수 있다.

| 처리 결과 | 큐 정책 |
|---|---|
| ACCEPTED / DUPLICATE | 전송한 항목과 일치하는 resultId만 제거 |
| 영구적인 업무 검증 실패 | 사유 기록 후 종결 |
| DB 장애 등 일시적인 서버 오류 | 보관 후 재전송 |
| 알 수 없는 상태 / 항목 응답 누락 | 보관 |

- [x] 34-19 일시 실패를 표현할 HTTP 또는 항목별 status/code 계약 확정. WPF_INTERNAL을 영구 거절로 소비하지 않도록 서버·WPF를 함께 변경. — 항목 status RETRYABLE_ERROR(예외 형식으로 분류한 일시 장애)·INTERNAL_ERROR(미확정) 추가. HTTP 4xx·5xx·응답 없음은 요청 전체 보관. WPF_INTERNAL은 INTERNAL_ERROR로 보관·제한 재시도 / 검토 보완(2026-10-12): 항목 형식 오류는 요청 전체 400이 아니라 그 항목만 REJECTED(WPF_INVALID_RESULT). WPF는 400 시 batch를 나눠 원인 항목만 이번 실행에서 제외 / 2차 검토 보완: answers·optionIds의 null 요소 금지(@NotNull), 검증 후 변환 실패도 그 항목만 REJECTED. 외곽 구조·JSON 역직렬화 오류만 400
- [x] 34-20 큐 삭제를 명시적 종결 상태에 한정하고, 응답 resultId가 현재 전송 batch에 속하는지 검증. — PopupResultQueue.Settle: 이번 batch의 resultId + 종결 상태만 제거
- [x] 34-21 일부 항목 성공·일부 실패 시 성공만 제거하고 실패는 같은 resultId로 재전송. — 일부 성공 시 성공만 제거, 나머지는 같은 resultId로 재전송(RecoveryTests)
- [x] 34-22 서버 커밋 후 응답 유실 → 재전송 → DUPLICATE 시 중복 저장·집계가 없는지 검증. — WpfPopupDatabaseTest(로컬 XE): DUPLICATE 재전송 시 표시 횟수·영수증 증가 없음
- [x] 34-23 일반 CLOSED/HIDDEN/VIDEO_WATCHED도 영속 저장 전에 창이 닫혀 결과가 소실되지 않도록 닫기 처리 검토·보완. 현재 일반 결과는 Closed 이벤트에서 저장하며, 제출 경로와 순서가 다름. — 일반 결과도 Closing(취소되지 않은 경우)에서 동기 저장 후 닫힘. 제출 경로와 순서 통일. 큐 파일 잠금과 전송 잠금 분리로 전송 중 저장 지연 없음 / 검토 보완(2026-10-12): 디스크 저장 실패 시 안내 후 닫기 취소, 다시 닫으면 같은 resultId로 재시도(앱 종료 중에는 닫기를 막지 않으며 메모리 보관분 유실 가능) / 2차 검토 보완: 저장 실패로 닫기를 취소한 결과와 제출 저장 실패 결과는 큐(메모리 포함)에 남기지 않아 먼저 전송되지 않음. 다음 닫기·제출 때 최종 상태로 다시 생성·저장(같은 resultId)
- [x] 34-24 디스크 저장 실패·프로세스 종료·통신 실패 시 결과 보존 및 재시도 검증. — 임시 파일 후 교체 저장, 손상 파일 보존(.corrupt-*.json), 디스크 저장 실패 시 실행 중 메모리 보관 후 재기록·전송, 통신 실패 시 보관. 프로세스 강제 종료 시 메모리 보관분은 남지 않음 / 검토 보완(2026-10-12): 손상 파일 보존(이동) 실패 시 원본을 덮어쓰지 않고 저장 실패로 알림, 이때 Flush는 파일을 건드리지 않고 메모리분만 전송

이 작업은 다음 팝업 조회 요건을 구현하는 작업이 아니다.

## 6. 공통 필드와 FOOTER_ACTION

### 6.1 신규 계약만 사용

- [x] 34-25 TODO 29의 showCloseButton → showFooterButton 통일 및 C# LegacyShowCloseButton 제거. — TODO29 커밋
- [x] 34-26 TODO 30의 footerAction / footerLinkUrl을 popups[] 최상위로 이동. — TODO30 커밋
- [x] 34-27 TODO 31의 useBackgroundOverlay / backgroundOverlayOpacity / popupPosition / headerFontSize / bodyFontSize / footerFontSize를 최상위로 이동. — TODO31 커밋
- [x] 34-28 WPF는 최상위만 읽고, 서버 응답 content에서는 이동한 key 제거. 이행용 중복 전송·content fallback 미구현. — content fallback·중복 전송 없음
- [x] 34-29 DB CONTENT_OPTIONS 등에 저장된 값은 응답 조립 시 승격 가능. API 위치 변경 때문에 불필요한 DB 컬럼을 추가하지 않음. — CONTENT_OPTIONS 저장 유지, 응답 조립 시 승격, DB 컬럼 추가 없음
- [x] 34-30 관리자 저장·재조회·미리보기 및 Demo 생성/가공 경로가 값을 잃지 않도록 확인. 관리자 API 저장 위치와 WPF 응답 위치는 별도로 문서화. — 관리자 저장·재조회는 content 유지(웹 tsc 통과), Demo 생성·옵션 창은 최상위로 이동. 저장 위치와 응답 위치를 계약서 §7에 문서화. 관리자 화면 수동 확인 미실행

### 6.2 기본값과 검증

최상위 전용 계약이므로 누락 시 일반적인 DTO 기본값을 적용할 수 있다.
호환 목적으로 모든 속성을 nullable로 만들 필요는 없다.
다만 선택 폰트처럼 '미지정이면 기존 화면 기본값 사용'이라는 의미가 필요한 속성은 nullable을 유지한다.

- useBackgroundOverlay: 생략 시 true.
- backgroundOverlayOpacity: 생략 시 0.45. 0은 명시적인 정상값.
- popupPosition: 생략 시 CENTER.
- headerFontSize / bodyFontSize / footerFontSize: 생략 시 화면 기본값.
- footerAction: 일반 팝업 생략 시 CLOSE, SURVEY/QUIZ 생략 시 SUBMIT.

- [x] 34-31 false/0을 누락으로 취급하지 않는지 검증. — 서버·WPF 테스트로 false·0 유지 확인
- [x] 34-32 null·빈 문자열·미지원 enum 및 숫자 범위 처리 정책을 서버·WPF·문서에서 일치시킴. — 빈 문자열·null은 생략(기본값), 미지원 enum은 응답·WPF 기본값/등록 거부. 계약서 §6.4 문서화
- [x] 34-33 opacity 0~1, 기존 FontSize 10~40 보정, 위치 9개 값 처리 검증. — opacity 0~1(서버 저장 검증·응답·WPF 보정), FontSize 10~40, 위치 9개 값 테스트

### 6.3 유형별 허용 Action

| 유형 | 허용 Action |
|---|---|
| TEXT / IMAGE / VIDEO | CLOSE / LINK_AND_CLOSE |
| SURVEY / QUIZ / VIDEO+QUIZ(popupType=QUIZ) | SUBMIT만 허용 |

공통화는 같은 필드로 동작을 정의한다는 의미이며 모든 유형에 모든 모드를 허용한다는 의미가 아니다.
SURVEY/QUIZ 제출 후 링크 열기는 이번 계약에 포함하지 않는다.

- [x] 34-34 관리자 화면에서 유형별 Action 선택 제한. — 관리자 웹 설문·퀴즈 Footer 동작 제출 고정(TODO30)
- [x] 34-35 서버에서 명시적으로 잘못된 유형/Action 조합 검증. 누락 시 유형별 기본값과 잘못된 명시값을 구분. — 2026-10-12: SURVEY/QUIZ에 CLOSE·LINK_AND_CLOSE 명시 시 저장 거부, 생략은 SUBMIT 기본값. 일반 유형 SUBMIT 거부(기존). PopupActionOptionsTest
- [x] 34-36 WPF에서 SURVEY/QUIZ의 제출 경로 보장. — ConvertFooterAction이 SURVEY/QUIZ를 항상 Submit
- [x] 34-37 제출 경로의 TryOpenSubmissionLink 호출 제거 또는 비실행 보장. SUBMIT에서 footerLinkUrl 미사용. — TryOpenSubmissionLink 삭제
- [x] 34-38 LINK_AND_CLOSE는 HTTP(S) 절대 URL 필수. 주소 오류·브라우저 실행 실패 시 창 유지. — URL 검증·실패 시 창 유지 기존 동작 유지
- [x] 34-39 VIDEO 완료 전 닫기 금지가 CLOSE/LINK_AND_CLOSE에서 우회되지 않는지 검증. — 자동 검증(BehaviorTests CheckModalFlows34): 완료 전 닫기 금지 VIDEO에서 CLOSE·LINK_AND_CLOSE 모두 '필수 영상 시청' 안내만 뜨고 창 유지, 바로가기 미실행. 모달은 테스트가 창 제목으로 찾아 닫음
- [x] 34-40 showFooter=false인 SURVEY/QUIZ 내부 제출 경로, showFooterButton=false에서도 제출 가능함을 검증. — 기존 CheckFooterSubmission(showFooter·showFooterButton 조합별 제출 버튼 1개 유지)
- [x] 34-41 QUIZ 미통과 시 창 유지·답안 수정·재제출, VIDEO+QUIZ 시청 조건 유지 검증. — 자동 검증(CheckModalFlows34): 오답 제출 시 '다시 도전해 주세요' 안내·창 유지·결과 미저장, 답안 수정 후 재제출 시 '평가를 통과했어요'·창 닫힘·통과 SUBMITTED 1건 저장. VIDEO+QUIZ 시청 조건은 기존 CheckFooterSubmission

## 7. 문서·검증·완료 기준

- [x] 34-42 구현 시 TODO 29~33의 상태·상충 문구를 본 문서 기준으로 갱신. — 설계 30·31 §8, 33 §5에 TODO34 대체 안내, 30-17·32·33 문구 정정
- [ ] 34-43 POPUP_INTERFACE_SPEC, WPF_POPUP_MINIMAL_SPEC, WPF_POPUP_ALL_SPEC, RESULT_REQUEST/RESULT_RESPONSE Excel 및 관련 계약 문서 동기화. 전체 기능 정리로 최소 공개 범위를 임의 확장하지 않음. — 계약서·최소/전체 정의서 동기화. Excel 정의서는 저장소에 없어 미반영
- [x] 34-44 api/examples의 목록·결과 요청·결과 응답 및 Demo 생성·표시 JSON 갱신. — api/examples 목록·결과 요청·결과 응답, docs/interfaces/examples 갱신
- [x] 34-45 서버/WPF 계약 테스트로 삭제 필드 부재, 신규 위치, 기본값, Action 제약, WPF 점수 저장, 결과 재시도를 검증. — 삭제 필드 부재·신규 위치·기본값·Action 제약·WPF 점수 저장·결과 재시도 테스트(서버 103, 행동 890, 복구 137)
- [ ] 34-46 TEXT / IMAGE / VIDEO / SURVEY / QUIZ / VIDEO+QUIZ 실제 화면 검증. — 미실행
- [ ] 34-47 요건별 구현 커밋과 version-history/CHANGELOG.md에 변경·검증·미완료 사항 기록. — 요건별 커밋·CHANGELOG 기록 진행 중

완료 기준:
- RESULT 필드는 실제 사용처와 필요성이 설명되며 확정 삭제 필드가 계약에서 제거됨.
- WPF의 최종 채점·통과값과 서버 저장·완료가 일치함.
- 일시 실패가 결과 유실로 이어지지 않음.
- 신규 공통 필드는 최상위에서만 소비되고 유형별 Action이 일치함.
- 구버전 호환·단계별 배포 및 보류된 다음 팝업 요건이 구현 범위에 섞이지 않음.
