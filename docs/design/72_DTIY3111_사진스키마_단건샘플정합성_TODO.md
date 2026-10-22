# TODO72 — DTIY3111 사진 스키마 반영 및 단건 조회 샘플 정합성 보완

- 작성일: 2026-10-22 (KST)
- 상태: 샘플 구현 완료(DB 없는 검증) / 실제 DDL·코드표·DB 연동 검증 대기
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
| 이미지 경로/이름 | IMG_FILE_PATH_CN / IMG_FILE_NM | ATCH_FILE_PATH / ATCH_FILE_NM | 실제 컬럼 SELECT, VO 이미지·영상 필드 분리 후 유형별 선택 |
| 영상 경로/이름 | VDO_FILE_PATH_CN / VDO_FILE_NM | 이미지와 같은 가정 컬럼 | VO 별도 필드로 분리, VIDEO·영상+퀴즈가 영상 컬럼 사용 |
| 첨부파일 ID | APND_FILE_ID VARCHAR2 SIZE 16 | 파일 URL 생성에 미사용 | 첨부 ID 방식이면 FileUrlResolver가 교체 지점 |
| 크기 소수 | NUMBER SIZE 5(정밀도·스케일 미확인) | 인계 응답 예시 height 420.5 | 샘플 예시는 정수로 통일, 실제 스케일 확인 |
| 필수 등록값 | REG_USER_ID, REG_DTTM NULLABLE=N | INSERT 생략 | 샘플 등록자·일시 명시, 실제 DEFAULT는 별도 확인 |
| 콘텐츠명·삭제여부 | POPU_CNTN_NM, DEL_YN 존재 | INSERT에서 생략 | 샘플 포함 여부·유효 코드 확인. 후보 정책은 서버 담당 |
| 타입·푸터 코드 | 오른쪽 코드 설명 일부 잘림 | 예시 코드 10~50 / 01~03 | 사진으로 확정하지 않고 실제 코드표 교체 지점 유지 |

## 작업 TODO

- [x] 72-1. DTIY3111의 20개 컬럼 OCR을 별도 문서로 보관하고, 사진 판독과 검토 의견을 분리한다. 빈 셀·잘린 비고·BYTE/CHAR·NUMBER 정밀도 불확실성을 표시한다.
- [x] 72-2. 매퍼 XML·VO·파일 URL 조립의 ATCH_FILE_PATH/ATCH_FILE_NM 가정을 사진의 이미지·영상 컬럼에 맞춘다. VO에 이미지 경로/파일명과 영상 경로/파일명을 별도 필드로 두고 유형별로 선택한다. APND_FILE_ID(16자)는 현재 파일 URL 생성에 미사용임을 매핑표에 기록한다. 실제 시스템이 첨부 ID로 URL을 만드는 경우 FileUrlResolver를 교체하고, 필요한 첨부 ID가 그 경계까지 전달되도록 VO·포트 시그니처를 함께 조정한다.
- [x] 72-3. IMAGE는 이미지 컬럼, VIDEO와 영상+퀴즈(QUIZ + videoEnabled=true)는 영상 컬럼으로 파일 URL을 만든다. 유효한 파일 컬럼에서 생성한 URL이 content.imageUrl/videoUrl보다 우선하고, 파일 컬럼이 없으면 content URL을 유지한다. 영상 없는 QUIZ에는 영상 컬럼을 적용하지 않는다. 경로만 또는 파일명만 있는 경우의 처리도 FileUrlResolver 계약에 명시하고 검증한다.
- [x] 72-4. 샘플 INSERT 6건의 ID를 10자 이내로 변경하고 요청 예시·기대값·정리 DELETE 조건을 함께 갱신한다. DELETE는 해당 샘플 ID만 대상으로 하여 범용 접두사에 속한 다른 데이터까지 지우지 않게 한다.
- [x] 72-5. INSERT에 REG_USER_ID='SAMPLE'(정확히 6자)와 REG_DTTM=SYSDATE를 명시한다. POPU_CNTN_NM·DEL_YN의 입력 여부와 코드는 실제 정의에 맞춰 정하며, 사진의 빈 셀을 근거로 필수값·기본값을 지어내지 않는다. DEL_YN 필터 위치는 샘플 SQL에 실행되지 않는 주석으로 표시한다(아래 참고). 코드값과 NULL 의미가 확정되기 전에는 실행 조건으로 추가하지 않는다.
- [x] 72-6. 미사용 선택 옵션의 기본값은 서버 응답 조립기가 적용하고 프론트는 신규 입력·미리보기 초기값을 가진다는 역할을 인계 문서에 명시한다. 누락/null 처리와 false·유효한 0 보존을 유지한다. 샘플의 전체 옵션 출력과 실제 API 필수 필드 범위를 구분한다.
- [x] 72-7. 사진 기반의 컬럼 이름·ID 길이·필수 INSERT 값과 SQL/VO 매핑을 확인하는 범위 검증을 추가한다. CLOB 객체 파싱·기본값·false/0 보존·TEXT/IMAGE/VIDEO/영상+퀴즈 파일 조립 회귀 검증을 수행한다. NUMBER SIZE 5의 실제 정밀도·스케일을 확인하고, NUMBER(5,0)이면 소수가 저장 시 반올림된다는 점을 인계한다. 해당 스키마 샘플의 크기 테스트는 정수로 통일하되, 공통 WPF/API의 소수 입력을 일괄 금지하지 않는다. VARCHAR2의 BYTE/CHAR와 DB 문자셋을 확인해 실제 정의에 맞는 길이 검증을 적용한다. DB 없는 검증으로 실제 Oracle 실행 성공을 주장하지 않는다.
- [x] 72-8. SERVER_SAMPLE_SINGLE_QUERY_API.md의 매핑표·실행 예시·교체 지점과 관련 샘플 테스트를 동기화한다. 해당 테이블을 전제로 한 응답 예시의 height:420.5 등은 정수로 변경한다. APND_FILE_ID 미사용·FileUrlResolver 교체, 이미지/영상별 VO, 파일 우선순위, SAMPLE 등록자, 삭제 조건의 확인 상태와 길이 단위도 명시하고 실제 DB·확정 코드표 대조 여부를 구분해 기록한다.

## 구현 시 참고

삭제 조건 위치 예시(코드값 및 NULL 의미 미확정, 주석만 추가):

```sql
/* [샘플 조건·담당 확인] 삭제 코드와 NULL 의미 확인 후 적용
   AND NVL(C.DEL_YN, 'N') = 'N'
*/
```

문자열 길이는 실제 컬럼의 BYTE/CHAR와 DB 문자셋에 따른다. 예를 들어 AL32UTF8에서 VARCHAR2(200 BYTE)는 일반적인 한글 음절(3바이트)만으로 약 66자가 들어가지만, 문자 조합·문자셋에 따라 달라진다. 무조건 66자로 제한하거나 CHAR 정의에 바이트 제한을 강제하지 않는다.

## 완료 기준

- 문서 완료: OCR 근거와 차이·수정 파일·검증 기준이 연결되어 있다. 현재는 이 단계만 완료다.
- 샘플 구현 완료: 사진에 보이는 실제 컬럼과 길이·등록 필수값이 SQL·VO·INSERT·인계 문서에서 일치하고 범위 검증을 통과한다.
- 실제 연동 검증: 서버 담당자가 확정 DDL·코드표·대상 DB를 확인하고 INSERT/SELECT 및 업무 연결을 검증한다. 미실행이면 검증 대기로 남긴다.

## 주요 수정 대상(구현 시)

- zero-rule-server/domain/src/main/java/server/domain/popup/sample/PopupContentRow.java
- zero-rule-server/repo/core/src/main/resources/mappers/popup/sample/PopupSingleQuerySampleMapper.xml
- zero-rule-server/service/core/src/main/java/server/service/core/popup/sample/PopupSingleResponseAssembler.java
- zero-rule-server/service/core/src/main/java/server/service/core/popup/sample/PopupPorts.java(FileUrlResolver)
- zero-rule-server/service/core/src/test/resources/sample/single-query/DTIY3111_sample_insert_oracle.sql
- zero-rule-server/service/core/src/test/java/server/service/core/popup/sample/PopupSingleQuerySampleTest.java
- 매퍼 XML 검증 및 관련 컨트롤러 테스트
- docs/interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md

## 구현 결과 (2026-10-22)

- 72-2·72-3: VO `PopupContentRow`에 `imageFilePath/imageFileName`(IMG_FILE_PATH_CN/IMG_FILE_NM), `videoFilePath/videoFileName`(VDO_FILE_PATH_CN/VDO_FILE_NM), `attachFileId`(APND_FILE_ID, URL 생성 미사용) 필드를 분리했다. 조립기는 IMAGE → 이미지 컬럼, VIDEO·영상+퀴즈 → 영상 컬럼으로 URL을 만들고 content URL보다 우선한다. 영상 없는 QUIZ에는 영상 컬럼을 적용하지 않는다. `FileUrlResolver` 계약: 파일명이 없으면(경로만 있어도) null → content URL 유지, 파일명만 있으면 기준 주소 바로 아래. 첨부 ID 방식이면 `FileUrlResolver`를 교체하고 기존 서버 규칙 `FileIdToUrlImpl.urlWithFileName`을 참고하도록 주석·문서에 남겼다.
- 72-4·72-5: 샘플 ID 10자(`SMP-TXT-01`·`SMP-IMG-01`·`SMP-VDO-01`·`SMP-SVY-01`·`SMP-QIZ-01`·`SMP-VQZ-01`), DELETE는 6건 `IN` 지정. INSERT에 `POPU_CNTN_NM`·`REG_USER_ID='SAMPLE'`·`REG_DTTM=SYSDATE` 추가, `DEL_YN`·`APND_FILE_ID`는 미입력. 후보 SQL에 `DEL_YN` 조건을 실행되지 않는 주석으로만 표시했다.
- 72-6·72-8: 인계 문서에 기본값 역할(서버 조립기 원본, 프론트는 입력·미리보기 초기값), 파일 URL 규칙, §3.2 길이·숫자 기준, §4 SQL·§4.1 ID, 응답 예시 height 420.0, 교체 지점(첨부 ID)을 반영했다.
- 72-7: 매퍼 XML 테스트(파일 컬럼·resultMap 필드·DEL_YN 미적용)와 샘플 테스트(사진 20개 컬럼 외 컬럼 금지, VARCHAR2 길이 BYTE·AL32UTF8 가정, ID 10자, 등록자·일시, NUMBER(5) 정수, DELETE 대상, 유형별 파일 컬럼·경로만/파일명만)를 추가했다. 샘플 크기 테스트는 정수로 통일했다.
- 확인 대기: NUMBER(5)의 실제 스케일, VARCHAR2 BYTE/CHAR·DB 문자셋, `REG_DTTM`·`DEL_YN` DEFAULT·코드, 코드표, 실제 Oracle INSERT/SELECT. 사진 정의만으로 확정하지 않았다.

## 이번 범위 밖

- 실제 DB DDL 변경·원격 INSERT 실행·서버 업무 후보 조건 구현.
- 영상+퀴즈 필수 URL 검증 누락 및 passingScore/completionRatio 원본 연결은 별도 구현 검토 사항이다. 이번 사진 스키마 보완만으로 해결됐다고 표시하지 않는다.
- WPF/API 필드·기본값·완료 정책의 임의 변경, Word/PDF/Excel 재생성.

