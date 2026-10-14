# 팝업 프로젝트 문서

프로젝트 문서는 저장소 루트의 `docs/`에서 관리한다.

| 위치 | 내용 |
|---|---|
| [design/](design) | 설계 기준·기능별 TODO·구현 및 확인 상태. 미결 항목은 [09_전환계획_및_미결사항.md](design/09_전환계획_및_미결사항.md) |
| [interfaces/](interfaces) | WPF Client API 계약서 [POPUP_INTERFACE_SPEC.md](interfaces/POPUP_INTERFACE_SPEC.md)(v3.7), Excel 정의서 `WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx`, 최소/전체 기능 정의서, [examples/](interfaces/examples) JSON 예제 |
| [reviews/](reviews) | 구현 검토·측정 절차 |
| [reviews/POPUP_PREVIEW_WPF_PARITY.md](reviews/POPUP_PREVIEW_WPF_PARITY.md) | 관리자 미리보기와 WPF 표시 정합성·알려진 차이 |
| [reviews/20261007_저사양_PC_VIDEO_측정_가이드.md](reviews/20261007_저사양_PC_VIDEO_측정_가이드.md) | 저사양 PC / Horizon VIDEO 측정 절차 |
| [reviews/20261002_WPF_TODO_변경_라인별_설명.md](reviews/20261002_WPF_TODO_변경_라인별_설명.md) | 2026-10-02 WPF TODO 변경 소스 줄별 설명(당시 기록) |
| [reviews/20261013_TRELLO_완료이력_현행구조_대조.md](reviews/20261013_TRELLO_완료이력_현행구조_대조.md) | 2026-10-13 Trello 완료 카드와 현행 구조 대조(당시 기록) |
| [POPUP_OPTION_GUIDE.md](POPUP_OPTION_GUIDE.md) | WPF·서버·관리자 웹 옵션 및 연동 |
| [POPUP_USER_OPTION_GUIDE.md](POPUP_USER_OPTION_GUIDE.md) | 화면에서 사용하는 옵션 설명(Footer 바로가기·동영상+퀴즈 포함) |
| [../db/oracle/README.md](../db/oracle/README.md) | Oracle DDL·샘플·이관 스크립트 실행 순서 |

구버전 Word/PDF 인터페이스 정의서(v2.0·v3.5·v3.6)는 Git 제외(`.gitignore`) 로컬 폴더 `interfaces/OLD/`에만 보관한다. 현행 기준은 위 계약서와 Excel 정의서다.

현행 API 기준은 [인터페이스 정의서](interfaces/POPUP_INTERFACE_SPEC.md)이며,
변경 이력은 [저장소 CHANGELOG](../version-history/CHANGELOG.md)에 기록한다.
기능 범위는 [최소 기능 정의서](interfaces/WPF_POPUP_MINIMAL_SPEC.md)와
[전체 기능 정의서](interfaces/WPF_POPUP_ALL_SPEC.md)를 함께 관리한다.
저장소 루트의 [README](../README.md)와 WPF [실행 가이드](../popup-frameWork/README.md)를 함께 참고한다.

문서 이동 이전의 CHANGELOG·커밋 검토 표 경로는 당시 기록이다. 과거
`popup-frameWork/Popup/Docs/`의 옵션 가이드는 현재 이 폴더에 있다.
