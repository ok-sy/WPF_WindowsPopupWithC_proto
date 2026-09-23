# 팝업 표시 위치

관리자 웹 설정은 content.popupPosition으로 저장되며 기존 CONTENT_OPTIONS JSON 경로로 WPF에 전달된다. DB 변경은 없다.

지원 값: CENTER, TOP_LEFT, TOP_CENTER, TOP_RIGHT, CENTER_LEFT, CENTER_RIGHT, BOTTOM_LEFT, BOTTOM_CENTER, BOTTOM_RIGHT. 누락·알 수 없는 값·문자열이 아닌 값은 CENTER(주 모니터 중앙)로 처리한다.

예: "content": { "popupPosition": "TOP_LEFT" }

일반 팝업은 주 모니터 작업 영역(작업 표시줄 제외) 기준이며 그림자 여백을 유지한다. 순차·동시 표시 모두 같은 규칙으로 동시 팝업의 위치가 같으면 서로 겹친다. 이미지 로딩으로 크기가 바뀌어도 선택한 위치를 다시 적용한다. 전체 화면은 위치 선택과 무관하게 주 모니터 전체에 표시한다. 웹 미리보기는 콘텐츠 확인용이며 실제 모니터 위치를 재현하지 않는다.

## 검증 및 배포 (2026-09-23)

3모니터에서 보조 모니터별 부모 창 배치로 각 77개(총 154개) 실제 창 좌표 검증을 통과했다. 배포본은 D:/work/PopupProject2026/dist/Popup.exe이며, --demo의 텍스트 팝업 중앙 표시까지 확인했다. 주 모니터 배율 변경은 미검증이다.

관리자 웹은 dist/admin-web-position-20260923에 standalone 배포 패키지를 생성했다. start.cmd로 로컬 서버를 실행할 수 있다. 빌드 및 임시 서버 HTTP 검증은 완료했으며, 상시 웹 서비스 반영과 실제 백엔드 저장·조회 검증은 미실행이다.
