# TODO72 — DTIY3111 사진 스키마 반영 및 단건 조회 샘플 정합성 보완

- 작성일: 2026-10-22 (KST)
- 상태: 진행 프로세스 구체화 완료 / 구현 미착수
- 관련: [TODO65](65_단건조회_공통매핑_CLOB파싱_샘플API_TODO.md), POL-13-03(적용·샘플 구분), POL-14-03(서버 인계 예제)
- 근거: [DTIY3111 사진 OCR](../interfaces/DTIY3111_SCHEMA_OCR.md), 사진 IMG_1418.jpeg
- 코드 대조 기준: main ccd7c6c

## 목적과 책임 범위

앞서 제공된 DTIY3111(팝업콘텐츠기본) 사진 정의를 저장소에 남기고, TODO65 샘플의 미확인 파일 컬럼·샘플 ID·필수 등록값을 해당 정의에 맞춘다.
담당 범위는 단건 SELECT → 컬럼/공통 헤더 매핑 → CLOB JSON 파싱 → 기본값 → 응답 조립의 인계 샘플까지다.
대상자·게시 일정·완료·숨김·전달 건·중복 처리의 실제 업무 구현과 일괄 검증은 서버 담당자 범위다.

사진 OCR은 실제 DB 메타데이터가 아니다. 빈 NULLABLE/PK 셀을 임의 확정하거나, 비고의 Sysdate 표기만으로 DEFAULT 제약이 있다고 단정하지 않는다.

## 현재 차이

| 항목 | 사진 정의 | 현재 샘플 | 보완 |
|---|---|---|---|
| 콘텐츠 ID | POPU_CNTN_ID VARCHAR2 SIZE 10 | SMP-* ID 12~14자 | 10자 이내 샘플 ID와 관련 테스트·예시 동시 변경 |
| 이미지 경로/이름 | IMG_FILE_PATH_CN / IMG_FILE_NM | ATCH_FILE_PATH / ATCH_FILE_NM | 실제 컬럼 SELECT 및 VO 별칭 매핑 |
| 영상 경로/이름 | VDO_FILE_PATH_CN / VDO_FILE_NM | 이미지와 같은 가정 컬럼 | 유형별 영상 매핑, 영상+퀴즈 적용 범위 명시 |
| 필수 등록값 | REG_USER_ID, REG_DTTM NULLABLE=N | INSERT 생략 | 샘플 등록자·일시 명시, 실제 DEFAULT는 별도 확인 |
| 콘텐츠명·삭제여부 | POPU_CNTN_NM, DEL_YN 존재 | INSERT에서 생략 | 샘플 포함 여부·유효 코드 확인. 후보 정책은 서버 담당 |
| 타입·푸터 코드 | 오른쪽 코드 설명 일부 잘림 | 예시 코드 10~50 / 01~03 | 사진으로 확정하지 않고 실제 코드표 교체 지점 유지 |

## 작업 TODO

- [x] 72-1. DTIY3111의 20개 컬럼 OCR을 별도 문서로 보관하고, 사진 판독과 검토 의견을 분리한다. 빈 셀·잘린 비고·BYTE/CHAR·NUMBER 정밀도 불확실성을 표시한다.
- [ ] 72-2. 매퍼 XML·VO·파일 URL 조립의 ATCH_FILE_PATH/ATCH_FILE_NM 가정을 사진의 이미지·영상 컬럼에 맞춘다. 유형별 컬럼을 VO 공통 별칭으로 받을지 별도 필드로 받을지 기존 구조에 맞춰 정하고 매핑표에 기록한다.
- [ ] 72-3. 영상+퀴즈의 파일 원본을 명시한다. 영상 컬럼과 content.videoUrl이 모두 있으면 어느 값이 우선인지 IMAGE/VIDEO와 일관되게 정리하고, 파일 컬럼을 쓰지 않는다면 샘플 제한으로 명시한다.
- [ ] 72-4. 샘플 INSERT 6건의 ID를 10자 이내로 변경하고 요청 예시·기대값·정리 DELETE 조건을 함께 갱신한다. DELETE는 해당 샘플 ID만 대상으로 하여 범용 접두사에 속한 다른 데이터까지 지우지 않게 한다.
- [ ] 72-5. INSERT에 REG_USER_ID와 REG_DTTM을 포함한다. 등록자 값은 6자 제한에 맞추고 등록일시는 SYSDATE 등 명시값을 사용한다. POPU_CNTN_NM·DEL_YN의 입력 여부와 코드는 실제 정의에 맞춰 정하며, 사진의 빈 셀을 근거로 필수값·기본값을 지어내지 않는다.
- [ ] 72-6. 미사용 선택 옵션의 기본값은 서버 응답 조립기가 적용하고 프론트는 신규 입력·미리보기 초기값을 가진다는 역할을 인계 문서에 명시한다. 누락/null 처리와 false·유효한 0 보존을 유지한다. 샘플의 전체 옵션 출력과 실제 API 필수 필드 범위를 구분한다.
- [ ] 72-7. 사진 기반의 컬럼 이름·ID 길이·필수 INSERT 값과 SQL/VO 매핑을 확인하는 범위 검증을 추가한다. CLOB 객체 파싱·기본값·false/0 보존·TEXT/IMAGE/VIDEO/영상+퀴즈 파일 조립 회귀 검증을 수행한다. DB 없는 검증으로 실제 Oracle 실행 성공을 주장하지 않는다.
- [ ] 72-8. SERVER_SAMPLE_SINGLE_QUERY_API.md의 매핑표·실행 예시·교체 지점과 관련 샘플 테스트를 동기화하고, 실제 DB·확정 코드표 대조 여부를 구분해 기록한다.

## 완료 기준

- 문서 완료: OCR 근거와 차이·수정 파일·검증 기준이 연결되어 있다. 현재는 이 단계만 완료다.
- 샘플 구현 완료: 사진에 보이는 실제 컬럼과 길이·등록 필수값이 SQL·VO·INSERT·인계 문서에서 일치하고 범위 검증을 통과한다.
- 실제 연동 검증: 서버 담당자가 확정 DDL·코드표·대상 DB를 확인하고 INSERT/SELECT 및 업무 연결을 검증한다. 미실행이면 검증 대기로 남긴다.

## 주요 수정 대상(구현 시)

- zero-rule-server/domain/src/main/java/server/domain/popup/sample/PopupContentRow.java
- zero-rule-server/repo/core/src/main/resources/mappers/popup/sample/PopupSingleQuerySampleMapper.xml
- zero-rule-server/service/core/src/main/java/server/service/core/popup/sample/PopupSingleResponseAssembler.java
- zero-rule-server/service/core/src/test/resources/sample/single-query/DTIY3111_sample_insert_oracle.sql
- zero-rule-server/service/core/src/test/java/server/service/core/popup/sample/PopupSingleQuerySampleTest.java
- 매퍼 XML 검증 및 관련 컨트롤러 테스트
- docs/interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md

## 이번 범위 밖

- 실제 DB DDL 변경·원격 INSERT 실행·서버 업무 후보 조건 구현.
- 영상+퀴즈 필수 URL 검증 누락 및 passingScore/completionRatio 원본 연결은 별도 구현 검토 사항이다. 이번 사진 스키마 보완만으로 해결됐다고 표시하지 않는다.
- WPF/API 필드·기본값·완료 정책의 임의 변경, Word/PDF/Excel 재생성.

