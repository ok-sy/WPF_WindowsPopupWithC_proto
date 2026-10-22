# POL-06 — SURVEY·QUIZ

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-06-01 | 문항·서식 | SURVEY/QUIZ 및 VIDEO+QUIZ 설문 영역에 공용 문단·Run 서식을 사용한다. 평문 필드 옆의 대응 Blocks 배열을 사용한다. 문항·선택지의 식별자와 답변 값은 서식과 구분한다. | questions[].titleBlocks/descriptionBlocks, options[].textBlocks; 콘텐츠 surveyTitleBlocks/descriptionBlocks | 웹·서버·WPF |
| POL-06-02 | 선택·제출 | QUIZ MULTIPLE_CHOICE는 isCorrect=true인 정답 수만큼 선택 가능하다. 별도 count 필드는 추가하지 않는다. SURVEY 복수 선택은 이 제한을 적용하지 않는다. 필수 응답·채점·passingScore·제출 조건은 유지한다. | options[].isCorrect; result score/passed는 WPF 계산값 | 웹 미리보기·WPF; 서버 저장 |
| POL-06-03 | 표현·수명 | 선택 UI 개선은 답변 계약을 바꾸지 않는다. 영상 시청 완료만으로 퀴즈 완료가 되지 않는다. 미통과·닫기·LATER의 결과 매핑은 POL-10과 분리하지 않는다. | showLater / SUBMITTED / VIDEO_WATCHED | 웹·WPF·서버 |

## 구현·계약 근거

- [SurveyPopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/SurveyPopupView.xaml.cs)
- [SurveyPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/SurveyPreview.tsx)
- [PopupQuestionDto.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/PopupQuestionDto.java)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO20](../design/20_SURVEY_QUIZ_UI_개선_TODO.md): 원본 세부 요건·검증 이력 유지.
- TODO21: TODO20 §6 통합; DEMO QA 유지 (Git `e65f88c`).
- [TODO22](../design/22_WEB_SURVEY_QUIZ_UI.md): 원본 세부 요건·검증 이력 유지.
- [TODO43](../design/43_완료조건_버튼활성화_UX_TODO.md): 57: allowCloseBeforeComplete 폐기; 완료 조건 UX 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO55](../design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO56](../design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

문항 description 삭제나 전체 Description ROOT 공통화는 이번 정리에서 확정하지 않는다. 실화면·저장 왕복은 TODO55·56·52 잔여 항목이다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
