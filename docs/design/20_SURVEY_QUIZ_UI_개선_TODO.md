# 20. SURVEY·QUIZ UI 최종 기준 및 TODO

기준일: 2026-10-03 (KST). 최종 코드 기준으로 정리하며 이전 시안·색상 변경 이력은 CHANGELOG에 보존한다. 범위는 SURVEY·QUIZ·VIDEO+QUIZ이고 DTO·응답 저장·필수 검증·점수·제출 Payload는 유지한다.

## 1. 문항 그룹·Typography

- [x] Page White / Card #F8F8F8, Border·Shadow 없음, CornerRadius 11.
- [x] Card Padding 20/20/20/18, 문항 간격 14, Header 아래 14, 목록 Bottom 여백 20.
- [x] 문항 Divider 제거, 컨테이너 최대폭 760 유지.
- [x] 제목 25px, 질문 16px SemiBold, 번호 12px SemiBold·#737373·배경 없음·간격 16.
- [x] 설명·진행 문구 muted gray, 필수 *는 질문과 같은 색으로 표시.

## 2. 세로형 단일·복수 선택 Row

- [x] RadioButton / CheckBox 유지, SurveyOptionRowStyle 공통 Template 사용.
- [x] 단일 SurveyRadioButtonStyle / 복수 SurveyCheckBoxRowStyle. 실제 컨트롤·Border·ContentPresenter Stretch.
- [x] Normal White / Border #E5E5E5 / Text #27272A / Check #D4D4D4.
- [x] Hover #F5F5F5 / Border #D4D4D4 / Check #A3A3A3.
- [x] Selected #ECECEC / Border #AFAFAF / Text·Check #18181B / SemiBold.
- [x] Border → Grid(* / 28px) → ContentPresenter + 항상 보이는 우측 Path.
- [x] Path 14×10, M 1,5 L 5,9 L 13,1, StrokeThickness 2, Round cap/join, 전체 Row 세로 중앙.
- [x] 기본 원형·사각 표시 및 문자 체크 없음, Path는 비포커스 장식 요소.
- [x] Padding 16/12·MinHeight 48·BorderThickness 1. Focus는 #737373 border만 변경.
- [x] 긴 문장 Wrap 및 자동 높이, MaxWidth에서 체크 공간 28 확보.
- [x] Normal/SemiBold 텍스트 높이 사전 측정, 폭·폰트 변경 때 재측정하여 선택 시 높이/스크롤 흔들림 방지.

## 3. 가로형 공통 Chip 및 Margin

- [x] 단일 SurveyChoiceChipStyle / 복수 SurveyCheckBoxChipStyle, SurveyOptionChipStyle 공유.
- [x] 체크 표시 없는 Chip, 복수는 여러 항목 동시 선택 가능.
- [x] Normal White·약한 Border, Hover #F1F1F1, Selected #EAEAEA/#AFAFAF/near-black·SemiBold, Pressed #E2E2E2.
- [x] MinHeight 44·공통 Padding·동일 높이 유지. 기존 Gray FocusVisual 유지.
- [x] GetOptionMargin 공통화: 가로 오른쪽 8 / 세로 아래 8 / 마지막 Margin 0.
- [x] WrapPanel·SizeChanged MaxWidth 유지. 가로형의 제거된 CheckBox 아이콘 영역은 차감하지 않음.

## 4. TextArea·Submit·Footer·Scroll

- [x] TextArea White·Border #E5E5E5·radius 10·padding 16/14·MinHeight 96·MaxHeight 180 및 내부 스크롤.
- [x] Placeholder: 추가 의견이 있다면 자유롭게 작성해주세요. 안내 문구는 실제 응답으로 저장하지 않음.
- [x] Focus Gray Border·무채색 Caret/Selection, 비활성 입력 Hover 없음.
- [x] Submit 기본 #4A4A4F / Hover #3D3D42 / Pressed #303035 / 흰 글자·SemiBold.
- [x] Disabled #E5E5E5/#A3A3A3, Hover/Pressed 무시. Height 46·MinWidth 132·radius 11 유지, 기본 Border·Shadow 없음.
- [x] 진행 문구: 필수 문항 n/n 응답 완료 또는 응답 현황·남은 문항 수. 완료 색상 변경 없음.
- [x] 필수 미응답 또는 VIDEO+QUIZ 시청 잠금 시 Submit 비활성화.
- [x] 단독·결합 모두 본문 Scroll과 Footer 분리. 공통 Footer를 끄면 내부 제출 영역 고정, 켜면 공통 제출 하나만 표시.
- [x] 폭 8의 native ScrollBar/Thumb, 본문과 gap 10, Thumb #D4D4D4/Hover #A3A3A3.

## 5. 접근성·회귀·Demo

- [x] GroupName·IsChecked·TabStop·Space native 선택 및 기존 Enter 동작·AutomationProperties 유지.
- [x] Focus 위치 표시, Disabled Hover 제거. 선택·Focus 전후 크기 유지.
- [x] 756/380/280 폭 긴 한글/영문·체크 중앙·비중첩·Chip Wrap·TextArea·고정 Footer 자동 검증.
- [x] 단일 배타성·복수 동시 선택·모든 OPTION_ID 수집·기존 점수/제출 JSON 회귀 통과.
- [x] Demo SURVEY 6문항·QUIZ/VIDEO+QUIZ 5문항. 정답·배점·필수/선택 케이스는 설계 21 참조.
- [x] 웹 미리보기 Row/Chip·고정 Footer·예제는 설계 22 참조.
- [x] WPF 빌드 경고·오류 0, WPF 582건·HTML5 89건 통과. 웹 타입/빌드·변경 파일 lint 및 브라우저 40건 통과.
- [x] 실제 WPF·웹 PNG 렌더 시각 확인. 검증 프로젝트·하네스·이미지 Git 제외 유지.
- [ ] 실제 물리 클릭·Tab·휠·스크린리더·여러 DPI 확인.
- [ ] 실제 원격 API 조회·응답 저장·관리자 로그인 확인.

UI 상태는 유채색 없이 명암·테두리·굵기로 표현한다. 그림자·Gradient·Glass·검정 Selected Border·기본 원형/사각 표시를 사용하지 않는다. 가로/세로 단일/복수 차이는 배치와 native 선택 동작으로 표현한다.
