# 팝업콘텐츠기본(DTIY3111) 테이블 정의 — 사진 OCR

- 정리일: 2026-10-22
- 출처: 전달 사진 IMG_1418.jpeg의 ‘팝업콘텐츠기본’ 시트
- 아래는 사진의 표를 옮긴 내용이며, 실제 DB 조회 결과 또는 확정 DDL이 아니다.
- ‘미기재’는 사진에서 해당 셀이 비어 있음을 뜻한다. NULL 허용, PK 아님, 기본값 없음으로 임의 확정하지 않는다.
- 사진 오른쪽 비고 영역은 일부 잘려 있으므로 보이는 내용을 넘어 추정하지 않았다.
- NUMBER의 SIZE 5는 사진의 표기다. 정밀도·소수 자릿수와 문자 길이의 BYTE/CHAR 기준은 사진만으로 확정할 수 없다.

## 원본 컬럼 정의

테이블 논리명: 팝업콘텐츠기본  
테이블 물리명: DTIY3111

| 순번 | 컬럼 논리명 | 컬럼 물리명 | TYPE | SIZE | PK 여부 | NULLABLE | 보이는 비고 |
|---:|---|---|---|---:|---|---|---|
| 1 | 팝업콘텐츠아이디 | POPU_CNTN_ID | VARCHAR2 | 10 | Y | N | |
| 2 | 팝업콘텐츠유형코드 | POPU_CNTN_TP_CD | VARCHAR2 | 2 | 미기재 | 미기재 | 오른쪽 일부 잘림 |
| 3 | 팝업콘텐츠명 | POPU_CNTN_NM | VARCHAR2 | 200 | 미기재 | 미기재 | |
| 4 | 헤더제목 | HDR_TITL | VARCHAR2 | 200 | 미기재 | 미기재 | |
| 5 | 팝업가로크기 | POPU_WDTH_SZ | NUMBER | 5 | 미기재 | 미기재 | |
| 6 | 팝업세로크기 | POPU_LNTH_SZ | NUMBER | 5 | 미기재 | 미기재 | |
| 7 | 나중에보기여부 | AFTR_CNFM_OBJ_YN | VARCHAR2 | 1 | 미기재 | 미기재 | |
| 8 | 푸터버튼유형코드 | FTR_BTN_TP_CD | VARCHAR2 | 2 | 미기재 | 미기재 | 오른쪽 일부 잘림 |
| 9 | 푸터URL | FTR_URL | VARCHAR2 | 200 | 미기재 | 미기재 | |
| 10 | 첨부파일아이디 | APND_FILE_ID | VARCHAR2 | 16 | 미기재 | 미기재 | |
| 11 | 이미지파일경로내용 | IMG_FILE_PATH_CN | VARCHAR2 | 1000 | 미기재 | 미기재 | |
| 12 | 이미지파일명 | IMG_FILE_NM | VARCHAR2 | 200 | 미기재 | 미기재 | |
| 13 | 동영상경로내용 | VDO_FILE_PATH_CN | VARCHAR2 | 2000 | 미기재 | 미기재 | |
| 14 | 동영상파일명 | VDO_FILE_NM | VARCHAR2 | 200 | 미기재 | 미기재 | |
| 15 | 콘텐츠내용 | CNTN_CN | CLOB | 미기재 | 미기재 | 미기재 | |
| 16 | 삭제여부 | DEL_YN | VARCHAR2 | 1 | 미기재 | 미기재 | |
| 17 | 등록사용자아이디 | REG_USER_ID | VARCHAR2 | 6 | 미기재 | N | |
| 18 | 등록일시 | REG_DTTM | DATE | 미기재 | 미기재 | N | Sysdate |
| 19 | 변경사용자아이디 | CHNG_USER_ID | VARCHAR2 | 6 | 미기재 | 미기재 | |
| 20 | 수정일시 | CHNG_DTTM | DATE | 미기재 | 미기재 | 미기재 | Sysdate |

‘Sysdate’는 사진 오른쪽 비고에 보인다. DEFAULT 제약이 실제로 설정되어 있는지는 DDL 또는 DB 메타데이터로 확인해야 한다.

## Git 샘플과 다른 부분 — OCR과 별도의 검토 의견

대조 기준: main ccd7c6c(2026-10-22 확인).

| 항목 | 사진 원본 | 현재 샘플 | 수정·확인할 내용 |
|---|---|---|---|
| 콘텐츠 ID 길이 | POPU_CNTN_ID SIZE 10 | SMP-TEXT-001 등 12~14자 | 사진 정의에 맞춰 샘플 ID를 10자 이내로 변경 |
| 이미지 파일 경로·이름 | IMG_FILE_PATH_CN / IMG_FILE_NM | ATCH_FILE_PATH / ATCH_FILE_NM | 매퍼 SELECT를 실제 컬럼으로 변경하고 VO 별칭으로 연결 |
| 영상 파일 경로·이름 | VDO_FILE_PATH_CN / VDO_FILE_NM | ATCH_FILE_PATH / ATCH_FILE_NM | VIDEO와 영상+퀴즈에서 영상 컬럼 연결 방식 정리 |
| 등록 필수값 | REG_USER_ID·REG_DTTM NULLABLE=N | 샘플 INSERT에서 생략 | 등록자 필수 입력. 등록일시는 실제 DEFAULT 확인 후 입력 또는 생략 |
| 콘텐츠명 | POPU_CNTN_NM 존재 | 샘플 INSERT에서 생략 | 등록 샘플에 추가할지 확인(NULL 제약은 사진 미기재) |
| 삭제여부 | DEL_YN 존재 | 샘플 후보 SQL에 필터 없음 | 코드값 확인 후 서버 담당자가 후보 필터 연결 |

현재 샘플에서 ATCH_FILE_PATH / ATCH_FILE_NM은 미확인 교체 지점으로 표시돼 있다. 사진 원본에는 이 이름의 컬럼이 없다.

반영(2026-10-22, TODO72): 위 차이는 샘플 SQL·VO·INSERT·인계 문서에 반영했다(ID 10자, 이미지·영상 컬럼 분리, 등록자 `SAMPLE`·`SYSDATE`, DEL_YN은 주석 위치만). 실제 DDL·코드표·DB 확인은 대기다.

## 담당자 전달 문구

첨부 사진의 DTIY3111(팝업콘텐츠기본) 정의를 텍스트로 정리했습니다.
단건 조회 샘플은 이 정의를 기준으로 컬럼 매핑과 INSERT 데이터를 맞춰야 합니다.
특히 POPU_CNTN_ID 길이 10, 이미지·동영상의 별도 파일 컬럼, REG_USER_ID/REG_DTTM 필수 여부를 반영해 주세요.
비어 있는 NULLABLE 셀 및 오른쪽이 잘린 코드 설명은 확정하지 않았으며, 실제 DDL·코드표 확인이 필요합니다.

## 범위

이번 OCR은 컬럼 정의가 보이는 IMG_1418.jpeg의 DTIY3111 한 테이블이다.
이전에 공유한 관계도만으로는 다른 테이블의 컬럼명·타입·길이·제약을 복원할 수 없으므로 별도 스키마를 만들어 넣지 않았다.

