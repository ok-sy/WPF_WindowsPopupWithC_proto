# 팝업 프로젝트 문서

프로젝트 문서는 저장소 루트의 `docs/`에서 관리한다.

- [SURVEY 복수 선택 최소·최대 선택 수 TODO](design/20261029_SURVEY_복수선택_최소최대선택수_TODO.md) — 구현 완료, 원격 개발 DB 적용·실화면 확인 대기.

- [등록·수정 공통 JSON 검증·기본값 생성 및 3111 직조회 전환 TODO](design/20261029_등록수정_공통JSON검증_기본값생성_3111직조회_TODO.md) — 1단계 구현(공통 모듈·3117 등록 샘플), 조회 전환·3111 보류.

- [MSI 설치 패키지 offline-export 추가 TODO](design/20261029_MSI_offline-export_추가_TODO.md) — **폐기(2026-10-29)**, 구현 대상에서 제외. 기존 소스 반입 offline-export는 유지.

- [WPF 백그라운드 기본 실행·자동 시작·트레이 옵션 TODO](design/20261028_WPF_백그라운드기본_자동시작_TRAY옵션_TODO.md) — 결정 반영, 구현 대기.

- [결과 큐 메모리 전용 전환·파일 접근 제거 TODO](design/20261028_결과큐_메모리전용_파일접근제거_TODO.md) — 진행 확정, 구현 대기. 로그·캐시는 제외.

- [2026-10-28 DTIY3117 사번 조회·최소 구성 후속 TODO](design/20261028_DTIY3117_사번조회_최소구성_후속TODO.md)

- [DTIY3117 전체 JSON 별도 조회 TODO — 기존 3111 보존](design/20261027_DTIY3117_전체JSON_별도조회프로그램_TODO.md) · 조회 샘플 인계: [SERVER_SAMPLE_FULL_JSON_API.md](interfaces/SERVER_SAMPLE_FULL_JSON_API.md)

- [DB 조회 최소 샘플·WPF 로그인 연동 TODO 가이드](design/20261027_DB조회_최소샘플_WPF로그인_연동_TODO_GUIDE.md)

| 위치 | 내용 |
|---|---|
| [policies/](policies/README.md) | 현행 정책 16개·원본 TODO 역추적·[활성 작업/보류](policies/ACTIVE_TASKS.md). TODO71 정적 대조, 미확정·실환경 검증은 분리 |
| [reviews/TODO71/](reviews/TODO71/INVENTORY.md) | 01~70 전수 목록·대체/충돌·주석·링크 점검. 원본 TODO 경로 보존 |
| [design/](design) | 설계 기준·기능별 TODO·구현 및 확인 상태. 미결 항목은 [09_전환계획_및_미결사항.md](design/09_전환계획_및_미결사항.md) |
| [design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md](design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md) | 프로젝트 검증 후속 작업: 문서 정합·TODO52 구현 연결·실제 연동/화면 검증·미결 정책. 폐쇄망 검증 제외 |
| [TODO72](design/72_DTIY3111_사진스키마_단건샘플정합성_TODO.md) | DTIY3111 사진 OCR 근거 및 단건 조회 샘플 컬럼·INSERT 정합성 보완(구체화 완료·구현 미착수) |
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
