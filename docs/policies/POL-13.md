# POL-13 — DB·영속성

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-13-01 | 콘텐츠와 관리 상태 | JSON 콘텐츠 저장과 대상·완료·숨김·전달·영수증 관리를 구분한다. WPF 응답 구조를 DB 한 컬럼과 동일한 구조라고 가정하지 않는다. CLOB 파싱·필드 승격·기본값은 서버 조립 책임이다. | CONTENT_OPTIONS 및 담당 실테이블 CNTN_CN | 서버·DB |
| POL-13-02 | 전달·영수증 | WPF_POPUP_DELIVERY는 DELIVERY_ID PK, 사용자별 OPEN 함수 기반 UNIQUE, DONE/EXPIRED, RESULT_ID·DEFER_UNTIL_AT을 가진다. WPF_RESULT_RECEIPT는 resultId 멱등 확인이며 중복 요청을 새 업무 결과로 다시 기록하지 않는다. | DDL 15 및 01, 조회/결과 매퍼 | Oracle |
| POL-13-03 | 적용·샘플 구분 | 신규 스키마와 기존 DB 이관은 db/oracle/README 순서를 따른다. TODO65 DTIY3111 샘플은 정렬 후 ROWNUM 1·바인딩·CLOB→객체 조립 예제이며 자격/완료/소유권 전체 로직이 아니다. | 실테이블 코드표·전달 포트는 담당 서버에 맞게 교체 | 서버 담당 |

## 구현·계약 근거

- [WpfPopupMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/WpfPopupMapper.xml)
- [PopupSingleQuerySampleMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/sample/PopupSingleQuerySampleMapper.xml)
- [PopupContentRow.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/sample/PopupContentRow.java)

- 계약/실행 안내: [README.md](../../db/oracle/README.md)
- 계약/실행 안내: [01_popup_schema_oracle.sql](../../db/oracle/01_popup_schema_oracle.sql)
- 계약/실행 안내: [SERVER_SAMPLE_SINGLE_QUERY_API.md](../interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md)

## 원본 TODO와 대체 관계

- [TODO05](../design/05_Oracle_DB_설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO06](../design/06_서버_변경설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO18](../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO32](../design/32_RESULT_responseStartedAt_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO55](../design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO65](../design/65_단건조회_공통매핑_CLOB파싱_샘플API_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

DDL 파일 존재는 원격 DB 적용 증거가 아니다. 실제 DTIY3111 SQL·코드표와 기존 DB 적용 여부는 해당 실행 기록으로 확인한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
