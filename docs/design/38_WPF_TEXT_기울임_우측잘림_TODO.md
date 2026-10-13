# 38. WPF TEXT 기울임 글자 우측 잘림 수정 TODO

기준일: 2026-10-13 (KST).
상태: 진행중 · 코드 수정·자동 측정 검증 완료, 실제 화면 확인 대기

증상: WPF 팝업에서 텍스트 에디터로 italic을 적용한 일부 문자가 오른쪽 끝에서 잘려 보임. 관리자 웹 입력 영역이 아닌 WPF 팝업에서 발생함을 확인. 사용자 환경의 정확한 문자열·창 크기·DPI는 미확보.

검토 가설: 기울어진 글자 획의 돌출, 텍스트 측정/줄바꿈, 상위 컨테이너 클리핑. 아래 측정으로 '획 돌출 + ScrollViewer 표시 영역 클리핑'을 확인했다.

검토·수정 TODO:
- [x] 재현 자료 확보: 폭 300px 문단에 오른쪽 정렬 기울임(굵게) 문자열을 배치하고 경계 밖까지 렌더링해 잉크 위치를 측정. 15px 맑은 고딕 `기울임 끝 글자`가 경계를 2px 넘음(96DPI 비트맵). 실제 사용자 문자열·창 크기·DPI 자료는 미확보
- [x] 잘림 지점 확인: 문단 TextBlock(PopupRichText.cs) → RichTextPanel → TextPopupView의 ScrollViewer. 여백 없이 표시 영역 폭과 같은 문단 경계를 기울어진 획이 넘고 ScrollContentPresenter가 잘라냄. 창 둥근 모서리 Clip은 텍스트보다 28px 바깥이라 원인 아님
- [x] 글꼴(맑은 고딕·굴림·돋움·바탕)·크기(기본 15·32)·문자열(한글·`fff`·`WWW`)별 비교: 획 돌출은 글자 크기의 최대 약 33%(15px에서 5px, 32px에서 9px)
- [x] 보정: 외곽 클리핑은 유지하고, 기울임 구간이 있는 문단에만 가장 큰 기울임 글자 크기 × 0.35(올림)만큼 오른쪽 Padding 확보. 본문 기본 크기 변경(ApplyBodyFontSize) 시 다시 계산. 기울임이 없는 문단은 기존 배치 유지
- [ ] 실제 팝업 화면에서 줄바꿈·스크롤·여러 DPI 및 창 크기 회귀 확인(자동 측정은 96DPI 비트맵 기준)

구현 결과(2026-10-13):
- 수정: `popup-frameWork/Popup/Views/Contents/PopupRichText.cs`(`ReserveItalicOverhang`), `TextPopupView.xaml.cs`(`ApplyBodyFontSize` 후 재계산).
- 영향: 기울임 문단의 오른쪽 정렬 줄 끝이 여유 폭만큼 안쪽에서 끝나고, 왼쪽 정렬 문단은 같은 폭만큼 일찍 줄바꿈된다.
- 검증: BehaviorTests `CheckItalicOverhang38` — 글꼴 4종 × 크기 2종 × 문자열 3종의 잉크가 문단 폭 안에 있음, 본문 크기 32 변경 후에도 유지, 비기울임 문단 Padding 0. 수정 전 같은 검사는 실패(잉크 301px/폭 300px)로 재현 확인. 전체 936건 통과. BehaviorTests 프로젝트는 .gitignore 대상이라 저장소에 포함되지 않음.

완료 기준: 재현 조건에서 우측 글자 획이 온전히 표시되고 기존 외곽·레이아웃 동작이 유지됨.

Trello: [TODO38](https://trello.com/c/h3OVshVt/62-todo38-wpf-text-%EA%B8%B0%EC%9A%B8%EC%9E%84-%EA%B8%80%EC%9E%90-%EC%9A%B0%EC%B8%A1-%EC%9E%98%EB%A6%BC-%EC%88%98%EC%A0%95)

관련 과제: TODO28 FONT_EDIT. TODO36 화이트리스트 정리 및 TODO37 BODY 통합과 별개인 표시 오류다.

팝업 전체 ClipToBounds 해제는 사용하지 않았다. 측정으로 확인한 클리핑 경계(ScrollViewer 표시 영역) 안쪽에 문단 여유 폭을 두는 방식으로 보정했다.
