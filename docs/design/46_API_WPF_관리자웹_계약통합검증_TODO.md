# 46. API WPF 관리자웹 계약 통합 검증 TODO

기준일: 2026-10-13 (KST).  
상태: **진행중 · 계약 대조·불일치 수정 완료(2026-10-13), 관리자 웹 화면 왕복 확인 남음**.

Trello: [TODO46 API WPF 관리자웹 계약 통합 검증](https://trello.com/c/oPVWKtFu/53-%EC%A0%95%EC%B1%85-%EA%B5%AC%EC%B2%B4%ED%99%94-apiwpf%EA%B4%80%EB%A6%AC%EC%9E%90%EC%9B%B9-%EA%B3%84%EC%95%BD-%EC%A0%95%ED%95%A9%EC%84%B1). 원본 목록: 진행 프로세스 구체화 완료. Git 반영 후 진행 확정 목록으로 이동한다.

## 범위와 기존 과제 구분

새 단건 계약과 유형별 저장·표시·결과를 문서 및 실제 파일·연동 증거로 대조한다. 현재 원본 카드의 popups[]·nextPopup 및 IMAGE linkUrl ORIGINAL 전용 설명은 오래된 기준이므로 그대로 구현하지 않는다.

이번 반영은 TODO 문서와 카드 관리만 수행한다. 코드 변경·새 DB 적용·환경 배포·테스트 실행은 포함하지 않는다. 원본 카드의 아이디어/보류 표기는 제안 당시 이력이며 현재는 구체화·검토 착수를 진행 확정으로 관리한다. 숫자·필드·정책 선택이 필요한 항목은 아래에서 결정한다.

## 작업 목록

- [x] 46-1 POST /p/api/wpf/popups 응답 pollingIntervalSeconds·popup(null 키 포함)·popup.deliveryId, 결과단건요청 및 status/nextStatus를 서버·WPF·Demo·샘플에서 대조한다. displayOrder는 서버정렬 전용, 조회 userId/nextStatus 없음.
- [x] 46-2 FooterAction·Overlay·popupPosition·FontSize의 팝업 공통 위치, 필수/기본/null 규칙과 질문·선택지 위치를 확인한다.
- [x] 46-3 TEXT BODY 통합(TODO37/39), textBlocks·plainText 파생, 정렬·색상·크기·글꼴 및 C# 검사 유지(TODO36) 최신 결정을 대조한다. TODO38 기울임 잘림은 별도 표시 검증으로 연결한다.
- [x] 46-4 IMAGE linkUrl은 삭제 완료이므로 모든 모드에서 계약·DTO·관리자 입력·샘플에 되살리지 않는다. 크기·비율·설명은 TODO23 현행 기준으로 대조한다.
- [x] 46-5 단건 RESULT_REQUEST의 기존 resultType·closedAt·hideDays·video·score/passed 유지, sentAt 필수여부, answers/optionIds null요소 금지와 HIDDEN 우선을 확인한다.
- [x] 46-6 SURVEY/QUIZ Footer SUBMIT 및 VIDEO+QUIZ 제출 규칙, 관리웹 저장값과 WPF 최종 판정/서버 저장 책임을 대조한다.
- [x] 46-7 현재 MINIMAL/ALL·POPUP_INTERFACE_SPEC·Excel·Word/PDF·제안서 버전 차이를 기록하고 구현 기준과 제안 예시를 혼동하지 않도록 맞춘다.
- [ ] **일부 수행** 46-8 원격 새 서버와 WPF 화면·관리자 등록/수정/미리보기의 왕복 검증을 수행하고 미실행 환경·오류를 기록한다. 자동검증 통과만으로 실제 화면 검증을 완료로 표시하지 않는다.

## 대조 결과와 수정 (2026-10-13)

코드를 기준으로 서버·WPF·Demo·관리자 웹·명세·예제·Excel·Word/제안서 0.3을 대조했다.

| 항목 | 발견 | 조치 |
|---|---|---|
| 46-1 | 단건 계약(POST 조회·popup null 키·deliveryId, 결과 1건·nextStatus)은 서버·WPF·Demo·예제 일치. WPF DTO·Demo에 DisplayOrder가 남아 문서("응답에서 삭제")와 서술이 다름. Demo 게이트웨이가 거절 후에도 영수증을 남겨 같은 resultId 재전송이 DUPLICATE(서버는 롤백되어 다시 검사). 서버·WPF 주석에 "목록·popups[]" 표현 잔존 | DisplayOrder는 Demo 정렬 전용(서버 응답에 없음, 기본 100)으로 주석·Demo 옵션 라벨 정정. Demo 거절 시 영수증 제거(서버와 같게). 주석을 단건 구조 표현으로 정정 |
| 46-2 | 공통 옵션 위치·기본·null 규칙 일치. **결함**: 관리자 저장 API가 hideDays 3650 초과를 막지 않아 저장되면 HIDDEN 결과가 REJECTED로 종결되고 숨김이 적용되지 않음(관리자 웹은 1~3650 검사, 직접 API 경로 문제) | 서버 저장 검증을 1~3650으로 변경(`PopupService`), Demo HIDDEN도 3650 상한. 명세·ALL·MINIMAL·옵션 가이드·Excel 공통 시트에 1~3650 명시 |
| 46-3 | TEXT 세 키 제거·서식 허용값은 다섯 곳 동일. Excel TEXT 메모·옵션 가이드에 통합 규칙(제목 굵게·24, showContentHeader=false 제외, 39-3 헤더만 보이기) 누락. plainText 필수 표기가 문서마다 다름. MINIMAL의 "TextBlocks 미제공"이 이 서버 출력과 다르게 읽힘 | 규칙 추가, plainText를 "조건부"로 통일, MINIMAL은 외부 클라이언트가 plainText만 써도 된다는 뜻임을 명시 |
| 46-4 | IMAGE linkUrl 제거·크기 모드 규칙 모두 일치 | 변경 없음 |
| 46-5 | 결과 필드·검증 일치, sentAt은 이력 언급만. **결함**: Excel RESULT_REQUEST·RESPONSE G열에 삭제된 envelope 행 비고가 남아 엉뚱한 행에 붙음(deliveryId에 "필수 검증 없음"). HIDDEN 우선(다시 보지 않기 선택 시 video 미전송·시청 기록 미저장)이 계약서에 명시 안 됨. 설계34의 sentAt 미결 문구 | Excel 비고 정정, HIDDEN 우선을 명세 §10.4·10.7·10.8·ALL에 명시, 설계34에 종결 표기 |
| 46-6 | SUBMIT 고정·VIDEO+QUIZ 시청 기준·채점 책임 일치. 예시의 videoTitle이 surveyTitle과 달라 이 서버로 재현 불가(서버는 제목 1개 저장) | 명세·MINIMAL·예제 JSON·Excel Sample·Demo 샘플의 VIDEO+QUIZ videoTitle을 surveyTitle과 같게, 제목 1개 저장 주석 |
| 46-7 | Word 표지·헤더 날짜가 2026-10-12, 부록 A에 "목록" 문구. 명세의 설계 35 이전 3.7 이력이 popups[]·results[]를 현행처럼 읽힘. 제안서 0.3과 구현 차이(경로·답변 필드명·필수 여부·오류 HTTP 코드·같은 ID 다른 본문)가 정리되지 않음. Excel 개요에 버전·기준일 없음 | 생성 스크립트 날짜·문구 수정 후 Word/PDF 재생성, 이전 이력에 "(설계 35에서 단건 구조로 대체)" 표기, 명세 §10.9 "제안서 0.3과 구현 계약 차이" 표 추가(이 문서가 구현 계약, 제안서는 요구 원천), Excel 개요에 계약 버전·기준일·반영 설계 표기, Excel Sample 전 유형에 deliveryId |

46-8 수행: 이 PC의 새 서버 + 원격 개발 DB + 실제 WPF exe(API 모드)로 조회→표시→닫기→결과→다음 팝업 왕복과 재실행 시 같은 전달 건 재표시를 확인(TODO45·47 검증 결과 참조). **남음**: 관리자 웹 등록·수정·미리보기 화면 왕복(로그인 필요), 원격 개발 서버 배포 후 확인.

검증: 서버 `gradlew test --offline --continue`(로컬 XE) 125건 통과·skip 0(hideDays 범위 테스트 추가). WPF BehaviorTests 962건(Demo 거절 영수증·HIDDEN 상한 추가)·RecoveryTests 158건. 명세 json 블록·예제 JSON 37건 파싱, Excel 예시 JSON 파싱, docx 본문 반영 확인.
## 완료 기준

최신 단건·유형별 계약이 서버/웹/WPF/Demo/샘플/문서에 일치하며 남은 실제 연동 검증의 수행 상태가 설명된다.

구현한 부분과 자동검증·실제 화면/원격 환경 확인을 구분하여 변경 이력과 Trello에 근거를 남긴다. 체크되지 않은 작업은 완료로 표시하지 않는다.
