# IMAGE 계약 v3.6 전환

설계 23 구현 기준: 2026-10-06 (KST). DB 물리 크기 컬럼은 유지한다. 일반 IMAGE의 새 크기는 CONTENT_OPTIONS의 width/height에 저장하고 외부 응답은 content.width/height만 제공한다. ORIGINAL 및 다른 유형은 기존 최상위 창 크기를 유지한다.

## 대상 확인과 SQL 생성

Oracle 11g에는 JSON 변환 함수가 없어 문자열 정규식으로 JSON을 수정하지 않는다. `11_image_contract_candidates_oracle.sql`은 IMAGE 행과 현재 옵션을 조회한다. Java 도구는 Jackson으로 옵션을 변환하고 전환·복원 SQL 및 원문 백업 JSON을 생성한다. 도구 자체는 DB에 SELECT만 실행한다.

접속 정보는 환경변수 `POPUP_MIGRATION_JDBC_URL`, `POPUP_MIGRATION_USER`, `POPUP_MIGRATION_PASSWORD`로 제공한다. 접속 비밀번호를 명령행 인자나 생성 SQL에 포함하지 않는다. 저장소의 `zero-rule-server`에서 다음처럼 실행한다.

```powershell
# 별도 POPUP 스키마
.\gradlew.bat :service:core:planImageContractMigration --args="POPUP. ../db/oracle/image-contract-plan"
# 접속 계정 스키마: '-'는 빈 스키마 접두어를 의미한다.
.\gradlew.bat :service:core:planImageContractMigration --args="- ../db/oracle/image-contract-plan"
```

산출물은 `11_image_contract_forward.sql`, `11_image_contract_rollback.sql`, `image-contract-backup.json`이다. 상대 출력 경로는 `zero-rule-server` 루트를 기준으로 해석한다. 생성 파일은 대상 데이터가 포함되므로 소스 저장소에 넣지 않는다.

2026-10-06 적용: 로컬 XE(POPUP)와 원격 개발 DB(192.168.114.71:4004/XE, zero-rule)에서 각각 계획 생성, 전환 SQL 실행, IMAGE 행 수 확인 후 COMMIT 완료. 두 DB 모두 IMAGE 0행으로 실제 UPDATE는 0행이다. 계획·백업·실행 로그는 Git 제외 로컬 검증 폴더에 보관했다. 서버·웹·WPF 배포 및 실제 IMAGE 저장/API 연계는 별도 확인이 필요하다.

각 SQL 블록은 현재 CLOB가 계획 생성 시의 원문과 일치하는지 확인하고 행을 잠근 후 변경한다. 중간에 데이터가 바뀌었으면 오류와 ROLLBACK으로 중단한다. SQL에는 자동 COMMIT이 없다. 적용 후 검증하고 COMMIT하는 절차는 별도 실행 작업이다.

## 변환과 영향

| 기존 | 새 저장·응답 | 표시 영향 |
|---|---|---|
| ADAPTIVE 최상위 width/height | content.width/height | 창 크기 유지. 기존 별도 이미지 상한은 제거, 원본 초과 확대 제한 유지 |
| FIT_TO_IMAGE imageWidth/imageHeight | content.width/height | 0 이하·미지정 축은 null. 기본 비율 고정. 불일치한 양쪽 값은 원본 로딩 후 너비 우선으로 높이 정규화 |
| FILL | ADAPTIVE | 전체 이미지가 보이며 여백이 생길 수 있음. 저장된 제목·설명은 일반 모드 정책으로 표시 |
| RIGHT/AUTO 설명 | 하단 | 세로 이미지도 하단 설명·스크롤 사용 |
| ORIGINAL | 그대로 | 최상위 창 크기, 원본 1px=1 DIP, 왼쪽 위 Clip 유지 |

기존 FIT_TO_IMAGE의 화면 자동 축소에 의존했던 큰 이미지가 새 계약에서는 잘릴 수 있다. 계획 백업의 경고와 대상 이미지를 검토해 표시 크기를 줄이거나 ADAPTIVE로 전환한다. 이 도구는 원본 URL을 읽거나 크기를 임의 축소하지 않는다. 새 크기 필드가 이미 있으면 그 값이 우선이며, 폐기 키만 제거한다. 반복 계획 생성 시 이미 정리된 행은 변경 대상에서 빠진다.

## 전환 순서와 충돌 정책

새 클라이언트·서버·웹은 한 묶음으로 전환한다. 구 클라이언트와 새 서버를 섞으면 일반 IMAGE의 최상위 크기가 생략되어 구 클라이언트 표시가 달라질 수 있다. 기존 서버에서 새 WPF를 먼저 실행하는 순차 배포도 일반 IMAGE의 새 content 크기가 없어 안전하지 않다. 버전 제한·배포 창을 맞추거나 별도 버전 API가 필요하다.

1. 기존 설정 백업과 대상 조회·계획을 생성하고 영향을 확인한다.
2. 새 WPF·서버·웹을 함께 전환한다. 서버 조회 변환이 기존 저장 행도 새 응답으로 제공한다.
3. 계획 SQL을 별도 적용하면 물리 저장 옵션도 정리된다. 서버는 정리 전·후 저장 행을 같은 새 계약으로 조회한다.
4. 실제 API 저장/조회·WPF 표시를 확인한다. 문제가 있으면 SQL 원문 백업과 배포 묶음을 함께 복원한다.

새 저장 요청에서는 최상위 크기와 content 크기를 동시에 받지 않는다. imageWidth/imageHeight, descriptionPosition, imageAreaRatio 및 FILL 입력도 거절한다. 서버는 이미지 원본을 다운로드하지 않으므로 비율 고정 정규화는 웹·WPF에서 원본 로딩 후 수행한다.
