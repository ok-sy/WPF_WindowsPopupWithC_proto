# POL-16 — 검증·정합성·품질

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-16-01 | 상태 구분 | 계획 구체화·코드 구현·자동 검증·실환경 검증·인계를 따로 기록한다. 체크박스 완료 수는 작업 진행 자료이며 구현/정책 확정의 단독 근거가 아니다. | 판정: 유지/후속 대체/부분 유지/폐기/미구현/충돌/판정 보류 | 문서·검증 |
| POL-16-02 | 재현 가능한 검증 | 로컬 전용 Popup.BehaviorTests/RecoveryTests의 과거 건수를 현재 재현했다고 주장하지 않는다. 추적된 scripts 검증과 서버 테스트를 사용하며 실행 환경/명령/skip를 적는다. | 문서·주석 변경은 링크/역추적/비주석 토큰 불변 검사 | 개발 |
| POL-16-03 | 문서 우선순위 | API 계약은 interfaces, 정책은 확정 결정+구현/계약 근거, TODO는 이력·잔여 작업, CHANGELOG는 당시 변경 기록이다. 충돌 시 단순 최신 번호 우선이나 코드 단독으로 확정하지 않는다. | 원본 경로 보존·다중 정책은 주/연관 참조 | 문서 관리 |

## 구현·계약 근거

- [Program.cs](../../scripts/RichTextTests/Program.cs)
- [Program.cs](../../scripts/PopupWindowTests/Program.cs)
- [verify-rich-text-49.cjs](../../scripts/verify-rich-text-49.cjs)
- [verify-popup-common-sample-69.cjs](../../scripts/verify-popup-common-sample-69.cjs)

- 계약/실행 안내: [AGENTS.md](../../AGENTS.md)
- 계약/실행 안내: [20261013_TRELLO_완료이력_현행구조_대조.md](../reviews/20261013_TRELLO_완료이력_현행구조_대조.md)

## 원본 TODO와 대체 관계

- [TODO01](../design/01_현행분석.md): 원본 세부 요건·검증 이력 유지.
- [TODO09](../design/09_전환계획_및_미결사항.md): 원본 세부 요건·검증 이력 유지.
- [TODO18](../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO39](../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO46](../design/46_API_WPF_관리자웹_계약통합검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO48](../design/48_TEXT_서버정책_CSharp_표시방어_분리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO49](../design/49_TEXT_들여쓰기_우클릭팔레트_TODO.md): 62 서식 확장·63 5단계 해제·66 초기화 삭제.
- [TODO50](../design/50_구조정합성_전수점검_정리_TODO.md): 53-16에서 D3/D4 수정; D5는 미결.
- [TODO53](../design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO67](../design/67_MUIdeprecated속성_미리보기호환검증_TODO.md): 69: 공통 폴더 이동; slotProps 전환 유지.
- TODO71: 본 정책 체계의 전수조사·색인·주석 정리.

## 검증 상태·미확정 범위

이번 TODO71은 정적 조사·문서/주석 정리다. Windows/브라우저/Oracle 실행과 바이너리 계약 산출물 재생성은 수행하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
