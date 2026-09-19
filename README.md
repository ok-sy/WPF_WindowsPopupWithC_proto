# WPF_WindowsPopupWithC_proto — WPF 팝업 시스템 개선 개발 저장소

`ok-sy/WPF_WindowsPopupWithC_sample` (커밋 `db0cc4c`, 2026-09-16)을 **베이스라인**으로 두고, [docs/design](docs/design) 설계에 따라 개선 기능을 개발한다.

## 개발 원칙

1. **기존 구조 변경 최소화, 기능 추가 방식** — `zero-rule-server-main`(zeroserver)과 `zero-rule-web`(zeroweb)의 기존 클래스·필터·매퍼·화면은 재구성하지 않고 새 파일을 추가한다. 기존 파일 수정은 설계 문서의 자체 점검표에 명시된 최소 범위로 한정한다. 베이스라인 커밋과의 diff로 확인한다.
2. **상세 주석** — 추가·수정한 모든 소스 파일 헤더에 `[역할] / [추가 이유 — 기준 항목] / [기존 구조와의 관계]`를, 주요 메서드에 동작·예외·주의사항을 적는다.
3. **변경 이력** — 파일을 수정하면 [version-history/CHANGELOG.md](version-history/CHANGELOG.md)를 갱신한다 ([AGENTS.md](AGENTS.md) 규칙).
4. **인증 범위** — 서버 토큰 인증(웹·WPF 통합 토큰)은 타 팀이 개발한다. 이 저장소는 WPF `IAuthHeaderProvider` 확장 지점과 서버 `WpfUserResolver` 어댑터만 구현한다 ([docs/design/04](docs/design/04_인증설계.md)).

## 디렉터리

| 경로 | 내용 | 출처 |
|---|---|---|
| `docs/design/` | 설계 기준(`기준0.1.txt`)과 설계 문서 01~09 | 신규 |
| `db/oracle/` | Oracle DDL·샘플 (`POPUP` 스키마) | 신규 |
| `api/examples/` | 신규 WPF API JSON 예제 | 신규 |
| `zero-rule-server-main/` | 주 서버 (Spring Boot, MyBatis) | 베이스라인 |
| `zero-rule-web/` | 관리자 웹 (Next.js) | 베이스라인 |
| `popup-frameWork/` | WPF 클라이언트 (.NET 10) | 베이스라인 |
| `ERD/` | PostgreSQL 기준 DDL·검토 문서 (Oracle 전환 원본 참조용) | 베이스라인 |
| `docs/interfaces/` | 현행(구) 인터페이스 설계서 | 베이스라인 |
| `scripts/`, `shell/`, `OFFLINE_WPF_BUILD.md` | 빌드·실행 스크립트 | 베이스라인 |

## 베이스라인에서 제외한 항목

저장소 용량을 위해 다음은 커밋하지 않는다 (`.gitignore`). 필요하면 sample 저장소에서 복사한다.

| 항목 | 크기 | 비고 |
|---|---|---|
| `offline-sdk/dotnet-sdk-10.0.400-win-x64.exe` | 215MB | 폐쇄망 빌드용. `OFFLINE_WPF_BUILD.md` 참조 |
| `offline-packages/nuget/*.nupkg` | 97MB | 동일 |
| `popup-frameWork/dist/` | 146MB | 게시 결과물 |
| `popup-api/` | – | 별도 팝업 서버. 설계상 폐기(주 서버 단일화) |
| `ERD/2026hyundaicard_popup_data_insert.sql`, `popup-frameWork/Popup/Docs/2026hyundaicard_popup_data_insert.sql` | 14MB×2 | PostgreSQL 데이터 스냅샷. Oracle 전환 후 불필요 |
| `.vs/`, `zero-rule-server-main/.idea/` | – | IDE 캐시 |

## 구현 순서·진행 상태

[docs/design/09_전환계획_및_미결사항.md](docs/design/09_전환계획_및_미결사항.md) §1 을 따른다: Oracle 스키마 → 서버 매퍼 Oracle 변환 → 사용자 식별 어댑터 → WPF 조회 API → WPF 결과 API → WPF 클라이언트 → 관리자 웹(선택).

| 단계 | 상태 (2026-09-19) | 검증 |
|---|---|---|
| 1 Oracle 스키마 | 완료 — 21c XE `XEPDB1`에 `db/oracle/00~03` 적용 | 테이블 17·시퀀스 12·샘플 적재 |
| 2 서버 Oracle 전환 | 완료 `74456d2` | **실DB 롤백 테스트 통과**(`PopupQuestionDatabaseTest`) |
| 3~5 신규 WPF API | 완료 `8697300` | 단위·MockMvc + **실DB 롤백 테스트**(`WpfPopupDatabaseTest`) 46개 통과 |
| 6 WPF 클라이언트 | 완료 `65247b7` | `dotnet build` 경고 0·오류 0. **실연동 미검증** |
| 7 관리자 웹 | 변경 불필요(베이스라인이 이미 SURVEY 채점 입력 숨김) | 코드 확인 |
| 8, 실연동 | 미수행 — zeroserver 기동은 공통 `ZERO_RULE` 스키마(범위 외)·통합 토큰 필요 | — |

로컬 빌드 시 NuGet: 저장소 `NuGet.config`는 폐쇄망 오프라인 소스만 가리키고 nupkg는 커밋하지 않으므로, 온라인 환경에서는 `dotnet restore --source https://api.nuget.org/v3/index.json` 로 복원한다.
