# 50. 구조 정합성 전수 점검과 정리 TODO

기준일: 2026-10-15 (KST).  
상태: **진행 확정**. 이번 등록은 점검 결과와 처리 범위 기록이며 정리 완료가 아니다.

진행 순서(2026-10-15 확정): ① 문서 정정(TODO48·49 상태 구분, 이 문서 재분류) → ② 설계 48·49 회귀 검증을 저장소 추적 검증으로 보완 → ③ 50-S 보안 정리 → ④ 50-A 수정 → ⑤ 50-B 삭제 → ⑥ 50-C 문서 정리. 단계마다 커밋을 나눈다.

검토 기준: 원격 main `0a00aa0` (TODO48·49 반영 후).

## 배경

TODO 1~49를 거치며 목록 → 단건 조회(설계 35), TEXT 콘텐츠 제목·설명 삭제(설계 37), IMAGE FILL·linkUrl 삭제(계약 3.6·3.7), 헤더 축소(TODO25), 서식 정책 분리(설계 48) 등 구조가 여러 번 바뀌었다. WPF·서버/DB·관리자 웹·문서 네 영역을 읽기 전용으로 전수 점검해 (1) 경로 간 동작 불일치, (2) 필요 없어진 코드, (3) 현재 동작과 다른 주석·문서를 찾았다. 아래는 확인된 항목과 처리 방향이다.

## 50-A 동작 불일치 (수정)

- [ ] **A1 WPF 숨김 체크박스 문구**: `PopupWindow.xaml` "30일간 보지 않기" 고정. 실제 숨김 일수는 서버 `hideDays`(1~3650, 없으면 30) → 문구를 실제 일수로 표시.
- [ ] **A2 관리자 웹 IMAGE 미리보기 크롬 치수**: `imagePreviewLayout.ts`가 TODO25 이전 값(헤더 48·테두리 2)과 가로 여백 106/108을 사용. WPF는 헤더 40·본문 테두리 0·가로 104 → FIT_TO_IMAGE 추천 크기·실제 크기 미리보기가 약 10px 큼. 미리보기 헤더 높이도 같은 기준으로 맞춤.
- [ ] **A3 관리자 웹 유형 변경 시 크기 누락**: 일반 IMAGE(서버 응답 width/height null)를 불러와 다른 유형으로 바꾸면 화면은 560×420으로 보이지만 값이 비어 서버가 저장 거절 → 유형 변경 때도 크기 보정.
- [ ] **A4 WPF 결과 큐 미호출 경로**: `FlushInBackground`·`EnqueueAsync`·큐의 `ClientVersionRejected`는 호출 0건. 주석의 "종료 직전 전송"도 실제 동작(종료 시 전송 중단)과 다름 → 미호출 경로 제거, 주석을 실제 동작으로 정정.
- [ ] **A5 계약 sizeMode AUTO**: 계약서 ENUM에 `AUTO`가 있으나 서버 검증·DB 제약은 거부 → 계약서에서 AUTO 제거(현행 동작 기준).
- [ ] **A6 관리자 웹 퀴즈 주관식 일치 방식**: `answerMatchMode` null을 화면은 '정확히 일치'로 보이나 값은 비어 서버 저장 거절 → 값이 없으면 EXACT로 채움.
- [ ] **A7 관리자 웹 '최근 생성 10개'**: 우선순위 정렬 후 10개를 잘라 실제로는 우선순위 상위 10개 → 생성 시각 기준으로 정렬.
- [ ] **A8 관리자 웹 완료 비율 잔존**: '동영상 + 퀴즈' 선택 시 0.8을 넣고 다른 유형으로 돌아가도 값이 남아 저장 요청에 실림 → 동영상이 없는 유형으로 바꾸면 비움.
- [ ] **A9 게시중단 후 결과 수용(확정 정책과 구현 불일치)**: 설계 47-4는 "게시중단 전에 표시된 팝업의 결과는 수용(EXPIRED 전달 건 포함)"으로 확정했으나, 결과 처리의 `countActiveUserAndPopup`이 팝업 `ACTIVE_YN='Y'`를 요구해 활성 해제로 게시중단하면 CLOSED·HIDDEN이 거절되고, SUBMITTED·VIDEO_WATCHED도 신규 조회와 같은 게시 조건(활성·기간)을 다시 확인해 EXPIRED 건이 거절될 수 있다. 수정 원칙: 전달 건 소유권(사용자)·popupId 일치·전달 건 종료 여부 검증은 유지하고, **신규 조회의 게시 조건**과 **이미 전달한 건의 결과 수용 조건**을 분리한다. 게시중단 방식(활성 해제·기간 종료·대상 변경)별 서버 테스트를 추가한다.
- [ ] **A10 일반 VIDEO 종료 제한 우회**: `allowCloseBeforeComplete=false`일 때 푸터 버튼은 시청 조건을 검사하지만 `OnClosing`은 VIDEO+QUIZ만 검사해 일반 VIDEO는 Alt+F4 등 창 닫기로 시청 기준 전에 닫힌다. 계약상 두 유형이 같은 필드를 쓰므로 일반 VIDEO의 창 닫기 경로에도 같은 제한을 적용한다(앱 종료·로그아웃 등 시스템 종료 경로의 예외 범위는 기존 VIDEO+QUIZ 처리와 맞춘다).

## 50-S 보안 정리 (우선)

- [x] **S1 설정 파일 평문 비밀번호 — 유지로 결정(2026-10-15)**: `application-dev_db.yml` 주석과 `JndiResource.java` 기본값에 원격 개발 DB 비밀번호가 평문으로 있다. 대상이 검증계(원격 개발) DB 계정이라 저장소에 두는 현행 방식을 유지하기로 하고, 한 번 적용했던 제거 변경을 원복했다. 운영 DB 자격 증명은 저장소에 두지 않는다는 원칙은 별도로 유지한다.

## 50-B 필요 없어진 코드 (삭제)

삭제 전 확인 기준: 참조 0건(grep)만으로 삭제를 확정하지 않는다. 종류별로 다음을 확인한 뒤 삭제한다.
- 내부 모델·private 멤버: 소스 참조 외에 리플렉션(로컬 행동 검증 포함)·`nameof`·문자열 참조 여부.
- 외부 DTO·JSON 필드: 계약 문서·예제·직렬화 대상 여부(서버 응답·WPF 역직렬화·관리자 웹 타입). 계약 필드는 코드에서 읽지 않아도 유지한다.
- 공개(public·internal) 메서드·이벤트: 다른 프로젝트·테스트·스크립트(`scripts/*`) 참조.
- XAML 리소스·이름: `StaticResource`·`DynamicResource`·`FindName`·`FindResource` 문자열 참조와 코드 비하인드 접근.
- MyBatis 구문·resultMap: XML id와 매퍼 인터페이스 메서드 대응.

- [ ] WPF: 그룹·동시 표시(SIMULTANEOUS) 경로와 미사용 매개변수, 값을 넣는 곳 없는 `PopupOptions.IsCompleted`, 참조 0건 XAML 리소스(`PopupButtonStyle`·`CommonSurfaceCardStyle`·`PopupBorderBrush`), `SurveyOption.Value`(모델), Demo의 삭제 필드 정리 코드, Demo 데이터 서비스의 미사용 유형 필터.
- [ ] 서버: 도달 불가 분기(`WPF_INVALID_HIDE_DAYS` 판정, `loadQuestions(admin=false)`, `contentTitleKey` default), 미사용 `PopupEntity.useYn`·`WpfPopupDelivery.open()`.
- [ ] 관리자 웹: `PopupPreview.previewSize()` 등 `fitContainer` 미지정 분기, FILL 잔재(`imageFillMode`·`imageFill`), 항등 함수 `adaptiveMaximum`, QUIZ 저장 키 `videoTitle`, TEXT 제목 대체 분기, `applyFormat`의 항상 false인 `focusEditor` 인자.

## 50-C 주석·문서 정합 (정정)

- [ ] 목록·일괄·WPF-01·`_shownPopupIds`·X 버튼·FILL·RATING5·passingScore 시절 주석(WPF·서버·DB 샘플).
- [ ] 설계 03·19·29·09·28의 대체 표기·상태 줄, 옵션 가이드 헤더 높이(48 → 40), IMAGE 클릭 링크 잔재(두 가이드·WPF README), MINIMAL의 폐기 키 `ImageWidth/ImageHeight`, ALL 4.4의 SURVEY/QUIZ `surveyTitle`·`description`, 계약서 §15.1 예시 indent, README 설계 범위(01~49), `OFFLINE_WPF_BUILD.md` Demo 미디어 안내, 10-13 검토 문서의 TODO35 상태.
- [ ] 서버 테스트·SQL 주석의 깨진 한글(이중 인코딩) 복원.

## 50-D 재현 후 판단 (이번 범위에서 코드 변경 안 함)

- (D1 → A9, D2 → A10으로 재분류: 확정 정책·계약과 구현의 불일치이므로 수정 대상.)
- **D3 VIDEO+QUIZ 제목·설명 중복 표시 가능성**: 실화면에서 재현한 뒤 판단.
- **D4 완료 비율 계산 방식**: WPF VIDEO(double)·VIDEO+QUIZ(소수 4자리 내림)·Demo가 다름. 경계값에서 실제 판정이 갈리는지 재현한 뒤 판단.
- **D5 결과 영수증 REJECTED·RESULT_CODE, 결과 응답 DTO 보조 조회**: DB 스키마 변경이 따르므로 원격 개발 DB 적용 계획과 함께 판단.
- (D6 → 50-S S1로 분리: 정책 보류가 아니라 우선 정리 대상.)
- Word·Excel 인터페이스 산출물 재생성은 TODO48·49 남은 항목으로 유지.

## 완료 기준

- 설계 48·49의 WPF 회귀 검증(관용 변환기·표시 방어·들여쓰기)을 Git에 추적되는 검증 프로젝트로 옮겨 다른 환경에서 같은 명령으로 재현할 수 있다.
- 50-S: 처리 결정(검증계 DB 비밀번호 유지)과 근거가 기록된다.
- 50-A 각 항목의 수정 동작을 자동 검증(서버 테스트·저장소 추적 WPF 검증·관리자 웹 tsc/하네스)으로 확인하고 실행 결과를 기록한다. A9는 게시중단 방식별 서버 테스트, A10은 창 닫기 경로 검증을 포함한다.
- 50-B 삭제 후 서버·WPF·관리자 웹 빌드와 기존 검증이 통과하고, 항목별로 위 확인 기준의 결과를 기록한다.
- 50-C 정정 후 문서가 가리키는 이름·값·경로가 코드와 일치한다.
- 50-D는 결정 전까지 현행 동작을 유지하고 미결로 남긴다.

## 진행 기록

- ② 2026-10-15: 설계 28·38·48·49 WPF 회귀 검증(서식 표시, 기울임 여유, 관용 변환기·표시 방어, 들여쓰기)을 로컬 전용 `Popup.BehaviorTests`에서 저장소 추적 `scripts/RichTextTests`로 옮김. 실행 `dotnet run --project scripts/RichTextTests` → 85건 통과. 로컬 전용 원본은 그대로 둔다.
- ③ 2026-10-15 (S1): 평문 비밀번호(설정 주석, `JndiResource` 기본값)를 제거하고 환경변수로 받도록 바꿨다가, 검증계 DB 계정이라 유지하기로 결정해 원복. 자격 증명 교체·이력 재작성 없음.
