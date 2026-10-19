# 59. VIDEO+QUIZ 중간 notice 제거 TODO

기준일: 2026-10-19 (KST)
상태: **진행 프로세스 구체화 완료 · 구현 대기**
범위: VIDEO+QUIZ의 중복 시스템 안내 제거. 이번 등록에서는 코드 수정이나 실행 검증을 수행하지 않는다.

## 확인한 현행 동작

- VideoQuizPopupView.cs의 _notice는 영상 설명 아래·퀴즈 위에 “영상을 N% 이상 시청하면 퀴즈와 하단 버튼이 활성화됩니다.”를 표시한다.
- 시청 기준 충족 시 “시청 기준을 충족했습니다. 퀴즈에 응답해 주세요.”로 변경한다.
- PopupWindow.xaml.cs의 RefreshFooterState는 하단에 현재 시청률·기준·제출 비활성 사유를 별도로 표시한다.
- 두 안내는 content.description이 아닌 WPF 시스템 안내이며 Demo/API 모드 모두에 적용된다.
- Demo의 “객관식 4문항은 각 25점…” 문구는 별도의 샘플 content.description이다.

## 확정 작업
- [ ] **59-1 중간 notice 제거**: VideoQuizPopupView의 _notice 필드·생성·시각 트리 배치·시청 완료 문구 갱신을 제거한다.
- [ ] **59-2 레이아웃 정리**: notice 전용 행·여백을 제거하고 퀴즈 배치 행 인덱스를 조정한다. 영상 설명 아래에 빈 안내 공간이 남거나 퀴즈가 겹치지 않게 한다.
- [ ] **59-3 하단 안내 유지**: 현재 시청률·기준·필수 응답 진행 및 실제 버튼 활성 상태에 대응하는 하단 안내를 유지한다. completionRatio 변경을 반영하고 고정 80% 문자열로 바꾸지 않는다.
- [ ] **59-4 잠금 로직 보존**: IsUnlocked·Quiz.IsEnabled·Unlocked 이벤트 및 시청 기준 판정은 유지한다. 안내 제거를 위해 퀴즈 입력·제출 잠금을 제거하지 않는다.
- [ ] **59-5 푸터 숨김 점검**: showFooter=false 조합에서 내부 제출 영역과 잠금 사유가 어떻게 표시되는지 확인한다. 상단 notice는 복구하지 않으며, 상태 안내가 사라지는 경우 실제 제출 영역에 비활성 사유를 연결한다.
- [ ] **59-6 회귀 확인**: 시청 기준 전/충족 후, 재생 실패, 푸터 ON/OFF, Demo/API 수신 데이터에서 안내 중복·빈 여백·스크롤을 확인한다. 나중에 보기·닫기·결과 전송은 기존 정책을 유지한다.
- [ ] **59-7 관련 화면·문서**: 관리자 웹 미리보기에 동일 중복 안내가 있는지 확인해 Front 인계 대상으로 기록한다. 안내 스크린샷·설명을 갱신하되 API 필드는 변경하지 않는다.

완료 기준: 영상 설명과 퀴즈 사이의 시스템 notice가 없어지고 전용 빈 공간이 남지 않는다. 하단 또는 실제 제출 영역에서 필요한 잠금 사유를 확인할 수 있다. 퀴즈 해제·제출·결과 동작은 유지된다. 자동 검증과 실제 화면 확인, Front 인계 상태를 구분한다.

## 보류: Description 공통화

**명시적 보류이며 TODO59 구현에 포함하지 않는다.**

- 모든 유형의 showDescription/description을 popup 공통 영역으로 이동하는 작업은 진행하지 않는다.
- 상단·하단 표시 위치 통일, descriptionBlocks 동반 이동, TEXT bottomDescription의 공통 설명 매핑을 이번 작업에서 결정하지 않는다.
- 기존 content.description·descriptionBlocks·showDescription 및 유형별 표시 위치는 유지한다.
- VIDEO+QUIZ 영상/퀴즈 각 영역의 별도 Description은 계속 논의 사항이다.
- 문항 제목·설명을 에디터 한 영역으로 합치고 questions[].description/descriptionBlocks를 제거하는 논의는 별도 계약·데이터 보존 범위다. notice 제거에 포함하거나 함께 삭제하지 않는다.
- TEXT bottomDescriptionUrl 삭제는 앞서 제기된 별도 요건으로 남긴다. Description 공통화 보류를 해당 삭제 요건의 취소로 해석하지 않으며, TODO59에서 구현하지 않는다.

## 관련 작업과 책임

TODO43(완료 안내), TODO52(showLater), TODO57(완료 전 닫기 정책 변경 계획)과 구분한다. WPF 표시·샘플·검증은 WPF 담당 범위이며 Front/Server 구현·통합 검증을 완료로 대신 표기하지 않는다.

Trello: https://trello.com/c/xYJBlFBM
