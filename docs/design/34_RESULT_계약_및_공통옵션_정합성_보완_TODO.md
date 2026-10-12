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

- [ ] 34-01 C# DTO·사용처, Java DTO·응답 조립, Demo, JSON, 문서·Excel의 RESULT 전체 필드 대조표 작성.
- [ ] 34-02 응답 receivedAt / popupId / resultType / popupStatus / completed / completedAt / responseId의 실제 사용처와 진단 필요를 항목별 기록.
- [ ] 34-03 위 항목은 유지 확정 목록으로 간주하지 않는다. 필요한 항목만 남기되, 삭제 여부와 이유를 대조표에 먼저 확정한다.
- [ ] 34-04 resultId는 WPF 결과 항목의 멱등·응답 대응 키, responseId는 서버 응답 저장 레코드 식별자임을 구분한다. 이름이 비슷하다는 이유만으로 서로 대체하지 않는다.
- [ ] 34-05 응답의 totalScore / passed / hiddenUntil / watchedRatio / requiredRatio를 C#·Java DTO, 응답 builder, Demo, 예제·문서에서 제거.
- [ ] 34-06 제거한 응답 필드의 내부 저장·로그·완료/숨김 처리 경로가 유지되는지 확인.

### 3.3 responseStartedAt 제거

- [ ] 34-07 WpfResultItemDto, PopupResultBuilder.BuildSubmitted, WpfResultRequest.Item, WpfResultCommand와 서비스 전달 경로에서 responseStartedAt 제거.
- [ ] 34-08 PopupService.submitResponse 및 Mapper의 RESPONSE_STARTED_AT 의존을 확인하고, DB 컬럼 유지/제거와 기존 데이터 처리 방식을 명시.
- [ ] 34-09 closedAt - displayedAt은 화면 체류/처리 시간이며 실제 첫 입력부터의 응답 시간은 아님을 문서화. DB 통계가 필요하면 해당 결과의 두 시각을 보존·연계하는 경로 확인.
- [ ] 34-10 개발용 pending-results.json에 실제 미전송 자료가 있으면 결과 유실 없이 전환. 구버전 상시 호환 로직은 만들지 않으며, 테스트 데이터 초기화가 필요하면 명시적으로 수행.

## 4. WPF 판정값을 서버가 저장

확정 흐름:

```text
WPF 답안 검증·채점 → score/passed 확정 → 결과 로컬 저장 → 전송
서버 요청 검증·멱등 처리 → WPF score/passed 저장 → 같은 판정으로 완료 처리
```

현재 WpfResultProcessor는 WPF 값을 불일치 로그에만 사용하고,
PopupService.submitResponse는 자체 채점한 totalScore/passedYn을 DB 및 완료 상태에 반영한다.
응답 DTO에서 점수 필드만 삭제해서는 책임 불일치가 해결되지 않는다.

- [ ] 34-11 QUIZ의 최종 저장 점수·통과값을 요청 score/passed로 변경.
- [ ] 34-12 USER_POPUP_STATUS 완료 처리에 동일한 passed를 적용하여 WPF 합격과 서버 미완료가 어긋나지 않도록 정리.
- [ ] 34-13 신규 QUIZ SUBMITTED에서 score/passed 누락 및 잘못된 자료형·값의 검증 정책 확정. 구버전용 서버 재채점 fallback은 추가하지 않음.
- [ ] 34-14 SURVEY는 점수·통과값을 강제하지 않고 제출 완료로 처리. QUIZ와 SURVEY 검증·저장 분기 명시.
- [ ] 34-15 서버 계산을 유지한다면 비교·진단 전용으로 분리하고 최종 점수·통과·완료를 덮어쓰지 않도록 보장.
- [ ] 34-16 문항별 earnedScore/correctYn과 WPF 총점의 정합성 정책 확정. 진단값과 최종 저장값을 혼동하지 않도록 문서화.
- [ ] 34-17 형식·문항 소속·선택지·필수 답안·영상 요건·인증 검증을 단순 점수 저장 변경 때문에 제거하지 않음.
- [ ] 34-18 표시 후 정답/합격점 변경 사례에서 WPF 결과가 서버 재계산으로 바뀌지 않는지 검증. 데이터 버전 정책이 필요하면 후속 결정 사항으로 기록.

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

- [ ] 34-19 일시 실패를 표현할 HTTP 또는 항목별 status/code 계약 확정. WPF_INTERNAL을 영구 거절로 소비하지 않도록 서버·WPF를 함께 변경.
- [ ] 34-20 큐 삭제를 명시적 종결 상태에 한정하고, 응답 resultId가 현재 전송 batch에 속하는지 검증.
- [ ] 34-21 일부 항목 성공·일부 실패 시 성공만 제거하고 실패는 같은 resultId로 재전송.
- [ ] 34-22 서버 커밋 후 응답 유실 → 재전송 → DUPLICATE 시 중복 저장·집계가 없는지 검증.
- [ ] 34-23 일반 CLOSED/HIDDEN/VIDEO_WATCHED도 영속 저장 전에 창이 닫혀 결과가 소실되지 않도록 닫기 처리 검토·보완. 현재 일반 결과는 Closed 이벤트에서 저장하며, 제출 경로와 순서가 다름.
- [ ] 34-24 디스크 저장 실패·프로세스 종료·통신 실패 시 결과 보존 및 재시도 검증.

이 작업은 다음 팝업 조회 요건을 구현하는 작업이 아니다.

## 6. 공통 필드와 FOOTER_ACTION

### 6.1 신규 계약만 사용

- [ ] 34-25 TODO 29의 showCloseButton → showFooterButton 통일 및 C# LegacyShowCloseButton 제거.
- [ ] 34-26 TODO 30의 footerAction / footerLinkUrl을 popups[] 최상위로 이동.
- [ ] 34-27 TODO 31의 useBackgroundOverlay / backgroundOverlayOpacity / popupPosition / headerFontSize / bodyFontSize / footerFontSize를 최상위로 이동.
- [ ] 34-28 WPF는 최상위만 읽고, 서버 응답 content에서는 이동한 key 제거. 이행용 중복 전송·content fallback 미구현.
- [ ] 34-29 DB CONTENT_OPTIONS 등에 저장된 값은 응답 조립 시 승격 가능. API 위치 변경 때문에 불필요한 DB 컬럼을 추가하지 않음.
- [ ] 34-30 관리자 저장·재조회·미리보기 및 Demo 생성/가공 경로가 값을 잃지 않도록 확인. 관리자 API 저장 위치와 WPF 응답 위치는 별도로 문서화.

### 6.2 기본값과 검증

최상위 전용 계약이므로 누락 시 일반적인 DTO 기본값을 적용할 수 있다.
호환 목적으로 모든 속성을 nullable로 만들 필요는 없다.
다만 선택 폰트처럼 '미지정이면 기존 화면 기본값 사용'이라는 의미가 필요한 속성은 nullable을 유지한다.

- useBackgroundOverlay: 생략 시 true.
- backgroundOverlayOpacity: 생략 시 0.45. 0은 명시적인 정상값.
- popupPosition: 생략 시 CENTER.
- headerFontSize / bodyFontSize / footerFontSize: 생략 시 화면 기본값.
- footerAction: 일반 팝업 생략 시 CLOSE, SURVEY/QUIZ 생략 시 SUBMIT.

- [ ] 34-31 false/0을 누락으로 취급하지 않는지 검증.
- [ ] 34-32 null·빈 문자열·미지원 enum 및 숫자 범위 처리 정책을 서버·WPF·문서에서 일치시킴.
- [ ] 34-33 opacity 0~1, 기존 FontSize 10~40 보정, 위치 9개 값 처리 검증.

### 6.3 유형별 허용 Action

| 유형 | 허용 Action |
|---|---|
| TEXT / IMAGE / VIDEO | CLOSE / LINK_AND_CLOSE |
| SURVEY / QUIZ / VIDEO+QUIZ(popupType=QUIZ) | SUBMIT만 허용 |

공통화는 같은 필드로 동작을 정의한다는 의미이며 모든 유형에 모든 모드를 허용한다는 의미가 아니다.
SURVEY/QUIZ 제출 후 링크 열기는 이번 계약에 포함하지 않는다.

- [ ] 34-34 관리자 화면에서 유형별 Action 선택 제한.
- [x] 34-35 서버에서 명시적으로 잘못된 유형/Action 조합 검증. 누락 시 유형별 기본값과 잘못된 명시값을 구분. — 2026-10-12: SURVEY/QUIZ에 CLOSE·LINK_AND_CLOSE 명시 시 저장 거부, 생략은 SUBMIT 기본값. 일반 유형 SUBMIT 거부(기존). PopupActionOptionsTest
- [ ] 34-36 WPF에서 SURVEY/QUIZ의 제출 경로 보장.
- [ ] 34-37 제출 경로의 TryOpenSubmissionLink 호출 제거 또는 비실행 보장. SUBMIT에서 footerLinkUrl 미사용.
- [ ] 34-38 LINK_AND_CLOSE는 HTTP(S) 절대 URL 필수. 주소 오류·브라우저 실행 실패 시 창 유지.
- [ ] 34-39 VIDEO 완료 전 닫기 금지가 CLOSE/LINK_AND_CLOSE에서 우회되지 않는지 검증.
- [ ] 34-40 showFooter=false인 SURVEY/QUIZ 내부 제출 경로, showFooterButton=false에서도 제출 가능함을 검증.
- [ ] 34-41 QUIZ 미통과 시 창 유지·답안 수정·재제출, VIDEO+QUIZ 시청 조건 유지 검증.

## 7. 문서·검증·완료 기준

- [ ] 34-42 구현 시 TODO 29~33의 상태·상충 문구를 본 문서 기준으로 갱신.
- [ ] 34-43 POPUP_INTERFACE_SPEC, WPF_POPUP_MINIMAL_SPEC, WPF_POPUP_ALL_SPEC, RESULT_REQUEST/RESULT_RESPONSE Excel 및 관련 계약 문서 동기화. 전체 기능 정리로 최소 공개 범위를 임의 확장하지 않음.
- [ ] 34-44 api/examples의 목록·결과 요청·결과 응답 및 Demo 생성·표시 JSON 갱신.
- [ ] 34-45 서버/WPF 계약 테스트로 삭제 필드 부재, 신규 위치, 기본값, Action 제약, WPF 점수 저장, 결과 재시도를 검증.
- [ ] 34-46 TEXT / IMAGE / VIDEO / SURVEY / QUIZ / VIDEO+QUIZ 실제 화면 검증.
- [ ] 34-47 요건별 구현 커밋과 version-history/CHANGELOG.md에 변경·검증·미완료 사항 기록.

완료 기준:
- RESULT 필드는 실제 사용처와 필요성이 설명되며 확정 삭제 필드가 계약에서 제거됨.
- WPF의 최종 채점·통과값과 서버 저장·완료가 일치함.
- 일시 실패가 결과 유실로 이어지지 않음.
- 신규 공통 필드는 최상위에서만 소비되고 유형별 Action이 일치함.
- 구버전 호환·단계별 배포 및 보류된 다음 팝업 요건이 구현 범위에 섞이지 않음.
