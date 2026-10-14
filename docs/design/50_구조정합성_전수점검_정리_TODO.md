# 50. 구조 정합성 전수 점검과 정리 TODO

기준일: 2026-10-15 (KST).  
상태: **진행 확정**. 이번 등록은 점검 결과와 처리 범위 기록이며 정리 완료가 아니다.

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

## 50-B 필요 없어진 코드 (삭제)

- [ ] WPF: 그룹·동시 표시(SIMULTANEOUS) 경로와 미사용 매개변수, 값을 넣는 곳 없는 `PopupOptions.IsCompleted`, 참조 0건 XAML 리소스(`PopupButtonStyle`·`CommonSurfaceCardStyle`·`PopupBorderBrush`), `SurveyOption.Value`(모델), Demo의 삭제 필드 정리 코드, Demo 데이터 서비스의 미사용 유형 필터.
- [ ] 서버: 도달 불가 분기(`WPF_INVALID_HIDE_DAYS` 판정, `loadQuestions(admin=false)`, `contentTitleKey` default), 미사용 `PopupEntity.useYn`·`WpfPopupDelivery.open()`.
- [ ] 관리자 웹: `PopupPreview.previewSize()` 등 `fitContainer` 미지정 분기, FILL 잔재(`imageFillMode`·`imageFill`), 항등 함수 `adaptiveMaximum`, QUIZ 저장 키 `videoTitle`, TEXT 제목 대체 분기, `applyFormat`의 항상 false인 `focusEditor` 인자.

## 50-C 주석·문서 정합 (정정)

- [ ] 목록·일괄·WPF-01·`_shownPopupIds`·X 버튼·FILL·RATING5·passingScore 시절 주석(WPF·서버·DB 샘플).
- [ ] 설계 03·19·29·09·28의 대체 표기·상태 줄, 옵션 가이드 헤더 높이(48 → 40), IMAGE 클릭 링크 잔재(두 가이드·WPF README), MINIMAL의 폐기 키 `ImageWidth/ImageHeight`, ALL 4.4의 SURVEY/QUIZ `surveyTitle`·`description`, 계약서 §15.1 예시 indent, README 설계 범위(01~49), `OFFLINE_WPF_BUILD.md` Demo 미디어 안내, 10-13 검토 문서의 TODO35 상태.
- [ ] 서버 테스트·SQL 주석의 깨진 한글(이중 인코딩) 복원.

## 50-D 정책 확인 필요 (이번 범위에서 코드 변경 안 함)

- **D1 게시중단 후 결과 수용**: 설계 47-4는 "게시중단 전 표시건 결과 수용"이지만 `countActiveUserAndPopup`이 `ACTIVE_YN='Y'`를 요구해 활성 끄기로 중단하면 CLOSED·HIDDEN이 REJECTED, SUBMITTED·VIDEO_WATCHED는 기간까지 확인해 EXPIRED 건도 거절될 수 있다. 수용 범위(활성 끄기·기간 종료·대상 변경) 결정 후 별도 반영.
- **D2 일반 VIDEO 창 닫기**: VIDEO+QUIZ는 `allowCloseBeforeComplete=false`면 Alt+F4까지 막지만 일반 VIDEO는 푸터 버튼만 막는다. 의도 확인 필요.
- **D3 VIDEO+QUIZ 제목·설명 중복 표시 가능성**: 실화면 확인 필요.
- **D4 완료 비율 계산 방식**: WPF VIDEO(double)·VIDEO+QUIZ(소수 4자리 내림)·Demo가 다름. 경계값 판정 기준 확정 필요.
- **D5 결과 영수증 REJECTED·RESULT_CODE, 결과 응답 DTO 보조 조회**: DB 스키마 변경이 따르므로 원격 개발 DB 적용 계획과 함께 판단.
- **D6 설정 파일 평문 비밀번호**: `application-dev_db.yml` 주석에 원격 개발 DB 비밀번호 평문. 제거·교체 여부 결정.
- Word·Excel 인터페이스 산출물 재생성은 TODO48·49 남은 항목으로 유지.

## 완료 기준

- 50-A 각 항목의 수정 동작을 자동 검증(서버 테스트·WPF 행동 검증·관리자 웹 tsc/하네스)으로 확인하고 실행 결과를 기록한다.
- 50-B 삭제 후 서버·WPF·관리자 웹 빌드와 기존 검증이 통과한다.
- 50-C 정정 후 문서가 가리키는 이름·값·경로가 코드와 일치한다.
- 50-D는 결정 전까지 현행 동작을 유지하고 미결로 남긴다.
