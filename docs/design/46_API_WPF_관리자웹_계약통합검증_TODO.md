# 46. API WPF 관리자웹 계약 통합 검증 TODO

기준일: 2026-10-13 (KST).  
상태: **진행 확정 · TODO 작성 및 착수 범위 등록**. 기능·세부 정책값의 확정과 구현·검증 완료는 별도다.

Trello: [TODO46 API WPF 관리자웹 계약 통합 검증](https://trello.com/c/oPVWKtFu/53-%EC%A0%95%EC%B1%85-%EA%B5%AC%EC%B2%B4%ED%99%94-apiwpf%EA%B4%80%EB%A6%AC%EC%9E%90%EC%9B%B9-%EA%B3%84%EC%95%BD-%EC%A0%95%ED%95%A9%EC%84%B1). 원본 목록: 진행 프로세스 구체화 완료. Git 반영 후 진행 확정 목록으로 이동한다.

## 범위와 기존 과제 구분

새 단건 계약과 유형별 저장·표시·결과를 문서 및 실제 파일·연동 증거로 대조한다. 현재 원본 카드의 popups[]·nextPopup 및 IMAGE linkUrl ORIGINAL 전용 설명은 오래된 기준이므로 그대로 구현하지 않는다.

이번 반영은 TODO 문서와 카드 관리만 수행한다. 코드 변경·새 DB 적용·환경 배포·테스트 실행은 포함하지 않는다. 원본 카드의 아이디어/보류 표기는 제안 당시 이력이며 현재는 구체화·검토 착수를 진행 확정으로 관리한다. 숫자·필드·정책 선택이 필요한 항목은 아래에서 결정한다.

## 작업 목록

- [ ] 46-1 POST /p/api/wpf/popups 응답 pollingIntervalSeconds·popup(null 키 포함)·popup.deliveryId, 결과단건요청 및 status/nextStatus를 서버·WPF·Demo·샘플에서 대조한다. displayOrder는 서버정렬 전용, 조회 userId/nextStatus 없음.
- [ ] 46-2 FooterAction·Overlay·popupPosition·FontSize의 팝업 공통 위치, 필수/기본/null 규칙과 질문·선택지 위치를 확인한다.
- [ ] 46-3 TEXT BODY 통합(TODO37/39), textBlocks·plainText 파생, 정렬·색상·크기·글꼴 및 C# 검사 유지(TODO36) 최신 결정을 대조한다. TODO38 기울임 잘림은 별도 표시 검증으로 연결한다.
- [ ] 46-4 IMAGE linkUrl은 삭제 완료이므로 모든 모드에서 계약·DTO·관리자 입력·샘플에 되살리지 않는다. 크기·비율·설명은 TODO23 현행 기준으로 대조한다.
- [ ] 46-5 단건 RESULT_REQUEST의 기존 resultType·closedAt·hideDays·video·score/passed 유지, sentAt 필수여부, answers/optionIds null요소 금지와 HIDDEN 우선을 확인한다.
- [ ] 46-6 SURVEY/QUIZ Footer SUBMIT 및 VIDEO+QUIZ 제출 규칙, 관리웹 저장값과 WPF 최종 판정/서버 저장 책임을 대조한다.
- [ ] 46-7 현재 MINIMAL/ALL·POPUP_INTERFACE_SPEC·Excel·Word/PDF·제안서 버전 차이를 기록하고 구현 기준과 제안 예시를 혼동하지 않도록 맞춘다.
- [ ] 46-8 원격 새 서버와 WPF 화면·관리자 등록/수정/미리보기의 왕복 검증을 수행하고 미실행 환경·오류를 기록한다. 자동검증 통과만으로 실제 화면 검증을 완료로 표시하지 않는다.

## 완료 기준

최신 단건·유형별 계약이 서버/웹/WPF/Demo/샘플/문서에 일치하며 남은 실제 연동 검증의 수행 상태가 설명된다.

구현한 부분과 자동검증·실제 화면/원격 환경 확인을 구분하여 변경 이력과 Trello에 근거를 남긴다. 체크되지 않은 작업은 완료로 표시하지 않는다.
