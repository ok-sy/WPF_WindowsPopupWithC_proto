# POL-15 — 배포·실행 환경

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-15-01 | 배포 범위 | 자동 업데이트 TODO17은 폐기했다. 수동 EXE 교체와 기존 배포 스크립트를 사용한다. single-file은 배포 구성이고 업데이트 기능과 동일하지 않다. | 빌드 설정·외부 리소스는 오프라인 빌드 가이드 | WPF 배포 |
| POL-15-02 | 인증·버전 | 실제 통합 토큰 발급/검증은 담당 팀 범위다. WPF 헤더 확장 지점·MockSSO 프로토타입과 구분한다. 클라이언트 최소 버전 거절 426은 결과를 지우지 않고 진행을 멈추는 기준이다. | Authorization / X-Client-Version | 서버·WPF |
| POL-15-03 | 환경 확인 | WebView2·미디어·글꼴·DPI·Horizon·설치 의존성은 환경별 확인 대상이다. 저장소의 빌드 성공만으로 폐쇄망 동작을 보장하지 않는다. | 소스/로컬·원격 개발 DB·폐쇄망 검증 구분 | 각 담당 |

## 구현·계약 근거

- [Popup.csproj](../../popup-frameWork/Popup/Popup.csproj)
- [build-wpf-offline.ps1](../../scripts/build-wpf-offline.ps1)
- [export-offline-package.ps1](../../scripts/export-offline-package.ps1)

- 계약/실행 안내: [OFFLINE_WPF_BUILD.md](../../OFFLINE_WPF_BUILD.md)
- 계약/실행 안내: [README.md](../../popup-frameWork/README.md)
- 계약/실행 안내: [AGENTS.md](../../AGENTS.md)

## 원본 TODO와 대체 관계

- [TODO04](../design/04_인증설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO10](../design/10_WPF_SSO_토큰_프로토타입_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO13](../design/13_WPF_클라이언트_버전_서버검증_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO14](../design/14_폐쇄망_반입_및_UI_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO17](../design/17_WPF_단일_EXE_자동업데이트_TODO.md): 자동 업데이트 폐기; 수동 교체 유지.
- [TODO18](../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO24](../design/24_VIDEO_저사양_PC_CPU_개선_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

새 원격 DB 적용·토큰 발급·배포·업데이트를 문서 통폐합 작업에서 실행하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
