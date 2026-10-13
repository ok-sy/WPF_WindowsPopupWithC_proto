# 37. TEXT EDITOR BODY 통합 검토 TODO

기준일: 2026-10-13 (KST).  
상태: **구현 완료 · 제목·설명을 textBlocks로 통합(2026-10-13), 브라우저·원격 DB 확인 남음**.

Trello: [TEXT EDITOR BODY 통합](https://trello.com/c/M7zvelWc).

## 범위

TEXT 편집 본문에서 제목·설명 역할까지 표현할 수 있으므로, TEXT의 content 안에 있는 별도 제목·설명 영역을 편집 본문으로 통합하는 방향으로 진행한다. 기존 TODO28의 구간별 서식 편집과 별도 결정 사항이다.

- 검토 대상은 **TEXT.content 내부**다.
- 팝업 공통 title(헤더 제목), 단건 조회의 popup 구조, 다른 팝업 유형까지 삭제·통합하는 요건이 아니다.
- BODY는 통합 본문의 개념명이다. API 속성을 body로 신설·변경한다는 결정은 아직 없다.
- textBlocks와 plainText가 같은 본문을 표현하는 현재 관계를 고려한다. 서식 원본과 파생 일반 문자열의 필요성은 별도 제목·설명 필드 유지 여부와 구분한다.

## TODO

- [x] TEXT.content의 현재 필드와 웹·서버·WPF 사용처를 대조하여 통합할 필드와 유지할 필드를 확정한다. → §결정
- [x] content 내부 title·description 등을 편집 본문으로 대체하는 구체적 필드 계약을 정한다. emphasis·footerDescription 등 다른 필드까지 자동으로 삭제 범위를 넓히지 않는다. → `contentTitle`·`description`·`showContentHeader` 삭제. highlightText·bottomDescription*·showPlainText 유지
- [x] 기존 textBlocks를 통합 본문으로 사용할지, API 명칭을 바꿀지 결정한다. → textBlocks를 유일한 본문 원본으로 사용, 이름 유지
- [x] plainText의 검색·기존 표시 fallback 등 사용처를 확인하고, 유지한다면 서식 본문에서 일관되게 파생되도록 정한다. → 검색 사용처 없음. textBlocks 없는 기존 데이터 표시·최소 범위 클라이언트용으로 유지하며 서버가 textBlocks에서 파생(설계 28 규칙 그대로)
- [x] 관리자 등록·수정 화면과 미리보기, 서버 저장·조회, WPF 표시, Demo 입력의 변경 범위를 정리한다. → §구현
- [x] 기존 샘플·등록 데이터의 제목과 설명을 합치는 순서·문단·서식 보존 방식을 정한다. 기존 데이터 유지 필요성부터 확인하고 필요한 경우에만 변환 절차를 마련한다. → DB 변환 스크립트 없이 서버 조회 시 합침(§구현)
- [x] 빈 본문, 제목만 있는 본문, 여러 문단, 재편집 후 저장 시 내용 보존을 확인할 검증 기준을 정한다. → §검증
- [x] 구현 시 TODO28 및 MINIMAL/ALL 명세·유형별 계약·샘플·Excel/Word 정의서를 함께 갱신한다. → §구현 문서 항목

## 결정 (2026-10-13)

- TEXT.content에서 `contentTitle`·`description`·`showContentHeader`를 삭제한다. 콘텐츠 제목·설명은 서식 본문(`textBlocks`) 앞 문단으로 작성한다.
- `textBlocks` 이름은 유지한다(body로 바꾸지 않음). `plainText`는 서버 파생값으로 유지한다.
- 다른 유형의 제목·설명(imageTitle·videoTitle·surveyTitle·description)과 공통 `title`(헤더)은 변경하지 않는다. DB 컬럼(CONTENT_TITLE·DESCRIPTION)은 다른 유형이 계속 사용하므로 DDL 변경 없음.

## 구현 (2026-10-13)

- 서버: TEXT 저장 시 CONTENT_TITLE·DESCRIPTION을 NULL로 저장하고 `showContentHeader`를 저장하지 않는다(`PopupService`). 조회 시 통합 전 행에 제목·설명이 있고 showContentHeader가 false가 아니면 본문 앞 문단으로 합친다 — 제목은 굵게·24, 설명은 기본 서식, textBlocks가 없던 행은 plainText 줄을 문단으로 바꿔 뒤에 둔다. plainText도 같은 순서로 앞에 붙인다(`PopupRichText.mergeLegacyHeader`, `PopupContentAssembler`). showContentHeader=false였던 행의 숨긴 제목·설명은 합치지 않는다. 관리자가 다시 저장하면 합친 본문이 저장되고 컬럼은 비워진다.
- 관리자 웹: TEXT 편집에서 콘텐츠 제목·설명 입력과 `콘텐츠 제목·설명` 표시 스위치를 제거하고, 미리보기에서 TEXT 제목·설명 영역을 제거했다.
- WPF: `TextPopupContentDto`의 세 속성, TEXT 화면의 제목·설명 영역(ContentHeaderPanel)과 미사용 TitleTextStyle을 제거했다. Demo TEXT 샘플은 제목·설명을 본문 앞 두 문단으로 옮겼다.
- 문서·샘플: POPUP_INTERFACE_SPEC·ALL/MINIMAL 명세·옵션 가이드·예제 JSON·DB 샘플 SQL·Excel 정의서 TEXT/Sample 시트 갱신.

## 검증 (2026-10-13)

- 서버 `PopupContentAssemblerTest`: 제목·설명 없는 일반 본문은 그대로, plainText만 있던 행(여러 줄·빈 줄 포함)·textBlocks가 있던 행의 합침 결과, 합친 본문이 저장 검증을 통과하고 파생 plainText와 같음(재저장 시 내용 보존), showContentHeader=false 행 미병합, TEXT 저장 옵션에서 showContentHeader 제거.
- WPF BehaviorTests: Demo 샘플 첫 문단이 굵게·24 제목, 제목 영역 요소 없음, 샘플에 삭제 키 없음.
- 미실행: 관리자 웹 브라우저 화면·실제 서버 연동 재편집 저장, 원격 개발 DB의 기존 TEXT 행 확인.

## Trello 진행중 ↔ 저장소 TODO 대조

2026-10-13 과제 진행 확정에 따라 세 카드를 진행중으로 전환한다. 각 카드에 TODO 번호·문서 링크·검토 항목을 연결한다. 구체적인 선택값이 없는 세부 계약은 구현 전 확인한다.

| 카드 | 저장소 과제 | 상태 |
|---|---|---|
| [목록 조회,결과저장,결과수신 세단계](https://trello.com/c/z0xv8TnE) | [TODO35](35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md) | 검증대기 · 정상 흐름 구현·원격 개발 DB DDL 적용 완료, 실제 연동 확인·장애 복구 정책 결정 남음 |
| [TEXT EDITOR 화이트리스트 CS쪽 제거 여부 체크](https://trello.com/c/e9oWww78) | [TODO36](36_TEXT_서식변환_타입검사_중복검토_TODO.md) | 검토 완료 · C# 검사 유지 |
| [TEXT EDITOR BODY 통합](https://trello.com/c/M7zvelWc) | TODO37(이 문서) | 구현 완료 · 화면·원격 DB 확인 남음 |

## 완료 기준

후속 검토: 기존 `showContentHeader=true`·`showPlainText=false` 행은 [TODO39 §39-3](39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md)에서 **헤더만 보이기**로 확정·구현했다(보이던 제목·설명만 문단으로, 숨긴 본문 제외, `showPlainText=true`, 재저장 시 숨긴 본문 삭제 허용). 서버 테스트로 검증, 실제 화면 확인은 남음.

통합 필드 계약·기존 데이터 처리·화면 변경 범위를 구체화하고 구현·검증 결과를 남긴다. 진행 확정과 구현 완료를 구분하며, 명시되지 않은 필드까지 임의로 삭제하지 않는다.
