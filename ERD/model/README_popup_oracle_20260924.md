# 팝업 Oracle ERwin 가져오기 파일

2026-09-24 저장소 `db/oracle/01_popup_schema_oracle.sql` 기준. 실제 DB를 추출한 결과가 아니다.
공통 zero_rule 테이블을 제외하고 팝업용 조직 마스터를 포함한 17개 테이블, 229개 컬럼을 담았다.
삭제 후보 컬럼과 템플릿 버전 관련 컬럼도 현재 정의대로 보존했다. 기존 `.erwin` 바이너리는 변경하지 않았다.
한글 논리명은 물리명에서 새로 작성했으며 기존 바이너리 모델에서 추출한 이름이 아니다.

## 파일 선택

| 파일 | 내용 |
|---|---|
| [popup_oracle_20260924_ca.xml](popup_oracle_20260924_ca.xml) | 구형 CA 네임스페이스 기반 ERwin XML 초안 |
| [popup_oracle_20260924_erwin.xml](popup_oracle_20260924_erwin.xml) | 신형 erwin 네임스페이스 기반 ERwin XML 초안 |
| [popup_oracle_20260924_reverse_engineer.sql](popup_oracle_20260924_reverse_engineer.sql) | 전체 물리 정의를 포함한 Oracle 역공학용 DDL |
| [popup_oracle_20260924_manifest.json](popup_oracle_20260924_manifest.json) | 원본 SHA-256, 개수, 추출한 테이블·컬럼·제약 및 한계 |

**XML은 생성·구조 검증한 초안이며 ERwin에서 열기 성공을 보증하는 파일은 아니다.**
사용 버전이 확인되지 않았고 이 환경에는 ERwin과 해당 버전의 XSD가 없다.
두 XML의 기본 모델 내용은 동일하며 루트/네임스페이스 표기만 다르다. 특정 제품 빌드에서 내보낸 파일로 표시하지 않는다.
Oracle 대상 코드는 공식 r7 문서의 Oracle 10.x/11.x 대상 설정을 사용했다. 신형 버전에서의 변환은 확인이 필요하다.

## 가져오기

1. ERwin의 파일 열기에서 사용 버전에 맞는 XML을 선택한다.
2. 테이블 17개, 컬럼 229개, PK 17개, FK 관계 25개, UNIQUE 12개를 확인한다.
3. XML 스키마 오류가 나거나 전체 물리 정의가 필요하면 ERwin의 Reverse Engineer에서 Oracle과 Script File을 선택하고 동봉 SQL을 지정한다. 실제 DB 연결이나 SQL 실행은 필요하지 않다.
4. 모델 배치는 포함하지 않았으므로 가져온 뒤 자동 배치하고 `.erwin`으로 저장한다. SQL 경로는 물리명/DDL 주석을 기준으로 하며 XML의 한글 논리명은 자동 이전되지 않는다.

## 포함 범위와 한계

- XML 객체: 한글 엔터티·속성명, 영문 테이블·컬럼명, 데이터형, NULL 여부, PK/UNIQUE 키와 FK 참조.
- XML 설명: 원본 테이블·컬럼 주석, 기본값 식, CHECK 식, FK의 원본 SQL(ON DELETE 포함).
- CHECK·기본값·ON DELETE는 XML에서 실행 가능한 전용 메타모델 속성으로 구현하지 않았다. XML로부터 DDL을 생성하면 원본과 동등하다고 볼 수 없다.
- 인덱스 15개, 시퀀스 12개, CHECK 50개, 기본값과 ON DELETE 동작을 포함한 전체 물리 정의는 SQL을 기준으로 한다.
- `WPF_RESULT_RECEIPT`는 원본 DDL에 FK가 없으므로 이름이 유사한 컬럼에 임의 관계를 추가하지 않았다.
- 원본 DDL 주석에는 현재 코드와 다른 오래된 설명이 있을 수 있다. 이번 산출물은 구조를 옮기며 기능 설명을 재정의하지 않는다.
- 실제 DB의 추가 컬럼·인덱스·뷰·트리거와의 일치는 확인하지 않았다.

## 재생성

저장소 루트에서 `node scripts/export-popup-erwin.cjs` 실행. 외부 패키지가 필요 없다.
생성기는 읽지 못하는 컬럼·키, 없는 참조, 한글명 누락을 오류로 처리한다.

참고: [CA ERwin XML Schema](https://ftpdocs.broadcom.com/cadocs/0/CA%20CA%20ERwin%20Data%20Modeler%20r7%203%2012-ENU/Bookshelf_Files/HTML/ERwin%20Online%20Help/XML_Schema.html), [신형 erwin XML Schema](https://bookshelf.quest.com/bookshelf/public_html/12.5/Content/User%20Guides/erwin%20Help/XML_Schema.html), [erwin 메타모델](https://bookshelf.erwin.com/bookshelf/9.6/Bookshelf_Files/PDF/ERwin%20Metamodel%20Overview.pdf).
