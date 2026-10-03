# 22. 웹 Survey·Quiz 미리보기 정합성

기준일: 2026-10-03. 관리자 등록/수정 화면의 편집기 내 미리보기와 실제 크기 미리보기 모두 동일 컴포넌트를 사용한다.

## 반영 내용

- [x] SurveyPreview 공통 컴포넌트·무채색 토큰 분리. 문항 Card #F8F8F8·radius 11·padding 20/18·간격 14 적용.
- [x] 세로 단일/복수 선택은 전체 폭 Outline Row + 항상 보이는 우측 SVG Path 체크. Normal/Hover/Selected는 WPF와 동일.
- [x] 가로 단일/복수 선택은 체크 없는 공통 Chip. native radio/checkbox 기능을 유지하고 원형/사각 표시만 숨김.
- [x] 8px 간격·Wrap·긴 한글/영문·공백 없는 문자열·체크 고정 영역 28 적용. Normal/SemiBold 높이를 미리 확보해 선택 시 크기 변화 방지.
- [x] 주관식 radius 10·96~180 높이·Placeholder·약한 Border·Gray Focus 적용.
- [x] 본문 Scroll과 Footer 분리. 공통 Footer 표시 여부와 관계없이 진행 문구·단일 Submit 하단 고정.
- [x] Submit #4A4A4F / Hover #3D3D42 / Pressed #303035·Disabled #E5E5E5/#A3A3A3 및 Gray Focus 적용.
- [x] 필수 응답 수/남은 문항 표시, 미완료·영상 잠금 시 Submit 비활성화. 제출은 로컬 미리보기 결과만 표시.
- [x] QUIZ 미리보기는 IsScored·정답 OPTION_ID 집합·TEXT EXACT/CONTAINS·통과점수로 로컬 점수 표시. 서버 제출·저장 호출 없음.
- [x] VIDEO+QUIZ 시청 비율 시뮬레이터와 기존 완료 기준 유지. 잠금 상태에 native 입력 Disabled 적용.
- [x] 실제 Header 닫기는 기존 neutral 스타일 유지. 설문 외 TEXT/IMAGE/VIDEO 미리보기 경로 유지.

## Demo 사례

`popupDemoQuestions.ts`는 WPF `DemoPopupDataService`의 SURVEY 6문항·QUIZ 5문항을 옮긴 미리보기 전용 데이터다. VIDEO+QUIZ도 같은 QUIZ 사례를 사용한다. `예제 문항 보기`로 전환하고 `입력한 문항 보기`로 돌아갈 수 있다.

예제·선택·주관식 응답·채점 결과는 미리보기 인스턴스에만 저장한다. 관리자 편집값·문항 템플릿·API Payload는 변경하지 않는다. 상세 문항·정답은 설계 21 참조.

## 검증

- [x] 웹 타입 검사·Next production 빌드 통과. 기존 프로젝트 lint 및 Next runtime config deprecation 경고는 유지.
- [x] 변경한 세 파일 대상 lint 경고·오류 없음.
- [x] 실제 컴포넌트를 headless Edge로 렌더링하여 브라우저 40건 통과.
- [x] SURVEY/QUIZ/VIDEO+QUIZ native 선택·Space/Enter·복수 선택·필수 응답/Submit·퀴즈 100점·영상 해금 확인.
- [x] 예제 전환 시 원본 관리자 데이터 불변 확인. Footer 고정·Submit 색상·좁은 폭 경계·텍스트/체크 비중첩·높이 안정성 확인.
- [x] PNG 시각 확인. 검증 번들·브라우저 프로필·이미지는 Git 제외 `.offline-verify/web-survey-check/`에만 생성.
- [ ] 실제 관리자 로그인·API 데이터 조회/저장·물리 입력·여러 DPI 환경 확인.

로컬 반영, 미커밋·미푸시·미배포.
