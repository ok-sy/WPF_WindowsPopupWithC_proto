# 서버 샘플 — DTIY3117 전체 JSON 단건 조회 API

기준일: 2026-10-27 (KST) · 관련: [`docs/design/20261027_DTIY3117_전체JSON_별도조회프로그램_TODO.md`](../design/20261027_DTIY3117_전체JSON_별도조회프로그램_TODO.md)

DTIY3117 게시내용 CLOB(`POPU_BLTN_CN`)에 저장한 **popup 객체 본체 JSON**을 읽어 기존 WPF 단건 조회 응답 `{pollingIntervalSeconds, popup}`으로 돌려주는 별도 Java 조회 샘플이다.
기존 DTIY3111 샘플([SERVER_SAMPLE_SINGLE_QUERY_API.md](SERVER_SAMPLE_SINGLE_QUERY_API.md))의 소스·SQL·경로는 바꾸지 않았고 둘은 동시에 켤 수 있다. **기본 비활성**이다.

## 1. 흐름과 파일

```text
POST /p/api/sample/wpf/popups/full-json/single?popupId=S17-TXT-01  (본문 {} 또는 생략, 사용자 = WpfUserResolver)
 → PopupFullJsonSampleController (web/api)
 → PopupFullJsonSampleService (service/core)
    1) PopupFullJsonSampleMapper.selectByPopupId    SQL: POPU_ID 바인딩 조회 → PopupBulletinRow(popupId, popupJson)
    2) parse                                         CLOB 문자열 → ObjectNode(빈 값·구문 오류·객체 아닌 루트는 500)
    3) applyIdentity                                 popupId = DB POPU_ID(불일치 거절), deliveryId·pollingIntervalSeconds 저장값 제거
    4) promoteFromContent · dropUnknownKeys          content 안 창·푸터 옵션 → 최상위, 계약 외 최상위 키 제거
    5) checkExplicitValues                           명시값 타입·ENUM·범위 검증(잘못된 값은 기본값으로 바꾸지 않고 거절)
    6) validateRequired                              유형별 필수 콘텐츠(기본값 적용 전 원본 기준)
    7) applyPopupDefaults · fill(content)            누락/null만 3117 기본값(PopupFullJsonDefaults) + 조건부 규칙
    8) cleanQuestions                                문항 형식 확인, SURVEY 정답 키 제거
 → {pollingIntervalSeconds, popup}  (기존 WPF 단건 조회 계약과 같은 필드·위치·순서, deliveryId는 테스트 UUID)
```

| 모듈 | 경로 | 내용 |
|---|---|---|
| domain | `server/domain/popup/sample/fulljson/PopupBulletinRow.java` | 조회 VO(popupId, popupJson) |
| repo/core | `server/repo/core/mapper/popup/sample/fulljson/PopupFullJsonSampleMapper.java` | 매퍼 인터페이스(기존 `@MapperScan(server.repo)`로 자동 등록) |
| repo/core | `resources/mappers/popup/sample/fulljson/PopupFullJsonSampleMapper.xml` | POPU_ID 조회 SQL·resultMap(기존 `mappers/**/*.xml`로 자동 로드) |
| service/core | `server/service/core/popup/sample/fulljson/` | `PopupFullJsonSampleConfig`(조건부 Bean)·`PopupFullJsonSampleService`·`PopupFullJsonDefaults` |
| service/core | `resources/popup/sample/popup-full-json-defaults.yml` | 3117 전용 기본값 설정(기동 시 1회 로드) |
| web/api | `server/web/api/popup/sample/fulljson/PopupFullJsonSampleController.java`·`...ExceptionHandler.java` | API·샘플 한정 오류 응답 |
| service/core(test) | `src/test/resources/sample/full-json/DTIY3117_sample_insert_oracle.sql` | 유형별 샘플 INSERT 6건. 테스트가 같은 파일로 응답 조립을 확인 |

예외 클래스는 기존 `PopupSampleException`을 그대로 쓴다(수정 없음, `contentId()`에 POPU_ID가 들어간다).

## 2. 실행 설정

```yaml
popup:
  sample:
    full-json:
      enabled: true                                                          # 기본 false(등록 안 됨)
      defaults-location: classpath:popup/sample/popup-full-json-defaults.yml # [교체] 기본값 파일 위치(file:D:/... 가능)
```

기존 서버 DataSource(Oracle)·인증 설정을 그대로 쓴다. `DTIY3117`은 스키마 한정자 없이 접속 계정 기준이다.

```powershell
Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/zero-rule-server/p/api/sample/wpf/popups/full-json/single?popupId=S17-TXT-01' `
  -ContentType 'application/json' -Body '{}' -Headers @{ 'X-Dev-User' = 'E1001' }   # 개발 헤더 이름은 custom.wpf-popup.dev-user-header
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 정상 | 200 | `{pollingIntervalSeconds, popup}` |
| POPU_ID 없음 | 200 | `{pollingIntervalSeconds: 1800, popup: null}` |
| popupId 누락·본문이 객체 아님 | 400 | `WPF_BAD_REQUEST` |
| 사번 없음 | 401 | `WPF_UNAUTHORIZED` |
| 저장 데이터 오류 | 500 | `WPF_INTERNAL`(메시지 비노출, 서버 로그에 popupId·reason) |

## 3. 저장 JSON 경계

`POPU_BLTN_CN` = popup 객체 본체. 응답 envelope는 저장하지 않는다.

```json
{
  "popupType": "TEXT",
  "title": "테스트 공지",
  "width": 560,
  "height": 420,
  "content": { "plainText": "테스트 팝업입니다.", "showPlainText": true },
  "questions": []
}
```

| 항목 | 처리 |
|---|---|
| popupId | DB `POPU_ID`가 기준. 저장값이 없으면 DB 값, 같으면 통과, **다르면 거절(500)** |
| deliveryId · pollingIntervalSeconds | 서버 소유 값. 저장값을 **제거**하고 서버가 설정(조회 주기는 기본값 파일 `response.pollingIntervalSeconds`) |
| 계약 외 최상위 키(관리용 필드 등) | 응답에서 제거(로그) |
| content 안의 `useBackgroundOverlay`·`backgroundOverlayOpacity`·`popupPosition`·`*FontSize`·`footerAction`·`footerLinkUrl` | 최상위에 없으면 최상위로 옮기고 content에서는 항상 뺀다(기존 관리자 저장 형태 호환). 둘 다 있으면 최상위 우선 |
| content 그 밖의 키 | 그대로 전달(TEXT 서식 블록 등 중첩 구조 보존) |
| questions | content와 같은 저장 객체의 최상위 배열 |
| 조회 중 보정 | 파싱한 작업용 객체에만 한다. DB 원본은 다시 저장하지 않는다 |

## 4. 기본값(3117 전용)과 조건부 규칙

값은 `popup-full-json-defaults.yml`에 있다. 저장 JSON에 **키가 없거나 null일 때만** 채우고 명시한 true/false·0은 유지한다.

| 구분 | 기본값 |
|---|---|
| 응답 | pollingIntervalSeconds 1800 |
| popup | displayMode SEQUENTIAL · sizeMode FIXED · width/height 900/620(IMAGE 제외) · widthRatio/heightRatio 0.7/0.75 · minimum 300/300 · maximum 1200/900 · showHeader/showFooter/showFooterButton true · footerAction CLOSE · showLater/showDoNotShowAgain false · useBackgroundOverlay true · backgroundOverlayOpacity 0.45 · popupPosition CENTER · header/body/footerFontSize null · hideDays null |
| TEXT | showPlainText true · showHighlight/showBottomDescription false |
| IMAGE | **showDescription false** · imageSizeMode ADAPTIVE · keepAspectRatio true |
| VIDEO | **showDescription false** · showControls/allowFullScreen true · **allowPlaybackRateChange/allowSeek false** · autoPlay/isLoop false · defaultVolume 0.7 |
| QUIZ | videoEnabled false |

코드에 고정한 조건부 규칙(설정 파일로 바꾸지 않음):

- IMAGE: width/height가 없거나 null이면 채우지 않고 키도 싣지 않는다(크기 미지정 = 원본 기준). `imageSizeMode=ORIGINAL`은 width/height 필수.
- SURVEY·QUIZ: footerAction 없으면 SUBMIT, 다른 명시값은 거절. TEXT·IMAGE·VIDEO의 SUBMIT은 거절. LINK_AND_CLOSE는 절대 http/https `footerLinkUrl` 필수, 그 밖의 동작이면 `footerLinkUrl`을 싣지 않는다.
- VIDEO·영상 QUIZ(`videoEnabled=true`): completionRatio 없으면 1.0. 그 밖 유형은 null.
- 영상 QUIZ: VIDEO content 기본값을 함께 채운다(명시값 유지). 영상 없는 QUIZ에는 VIDEO 필드를 넣지 않는다.
- passingScore: QUIZ만 싣는다(없으면 null). title: 없으면 "".
- 본문·파일 URL·문항·정답은 채우지 않는다. 필수 콘텐츠(TEXT 본문 또는 textBlocks, IMAGE imageUrl, VIDEO·영상 QUIZ videoUrl, SURVEY·QUIZ 문항)가 없으면 거절한다.

설정 파일은 기동 시 검증한다. 모르는 키·빠진 키·타입/ENUM/범위 오류·`footerAction`이 CLOSE가 아님·minimum > maximum이면 **기동이 실패**한다.

## 5. 문항

- 형식: 각 항목은 객체, `questionType`은 SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT, 선택형은 `options` 1개 이상.
- SURVEY: `correctAnswer`·`answerMatchMode`·`options[].isCorrect`를 제거한다(기존 `WpfPopupItem.withoutAnswerKey`와 같은 규칙).
- QUIZ: 기존 채점 계약대로 정답 키를 유지한다. 배점·선택 필드 기본값은 WPF 계약 기본값을 따른다(서버가 채우지 않음).
- TEXT·IMAGE·VIDEO에 저장된 questions는 응답에서 빈 배열로 바꾼다.

## 6. 샘플 INSERT

`DTIY3117_sample_insert_oracle.sql` — `S17-TXT-01`(링크 후 닫기·배경 없음·글자 크기), `S17-IMG-01`(크기 미지정), `S17-VDO-01`(재생 옵션 생략·completionRatio 0.9·defaultVolume 0), `S17-SVY-01`(정답 키 포함 원본 → 응답에서 제거), `S17-QIZ-01`(채점·통과 점수), `S17-VQZ-01`(영상 QUIZ·allowSeek 명시 true).
POPU_ID는 10자, `REG_USER_ID='SAMPLE'`·`REG_DTTM=SYSDATE`. 정리 DELETE는 이 6개 ID만 지운다. 문장당 CLOB 리터럴 4000바이트 이하.

## 7. 교체 지점과 책임 범위

| 표식 | 위치 | 실제 구현 시 |
|---|---|---|
| [담당 구현] | Mapper XML WHERE | 사용자별 후보 선정·게시 상태·기간 조건(관계 스키마 확인 후) |
| [교체 지점] | Service `nextPopup` deliveryId | 전달 건 생성/재사용·결과 수신 연결. 현재 테스트 UUID는 영속 전달 이력이 아니다 |
| [교체 지점] | `defaults-location` | 기본값 파일 위치 |
| [미확인] | 컬럼 철자 `POPU_BLTN_CN`·키 길이·DEFAULT | 실제 DDL과 대조 |

범위 제외: 관리자 상세조회 복원, 기존 3111 데이터 이관, WPF EXE 변경. WPF 응답 계약이 같으므로 WPF 파서·창은 바꾸지 않았다.

## 8. 옵션 추가·삭제 예시

- **기본값을 둘 옵션 추가**(예: TEXT `showTitle`): ① `PopupFullJsonDefaults.CONTENT_RULES`의 TEXT에 `"showTitle", bool()` 추가 → ② YAML `content.TEXT.showTitle: true` 추가. 한쪽만 바꾸면 기동이 실패한다.
- **기본값 변경**(예: VIDEO 탐색 허용): YAML `content.VIDEO.allowSeek: true`만 바꾼다. 3111 샘플·WPF 자체 기본값에는 영향이 없다.
- **옵션 삭제**: 규칙 표와 YAML에서 함께 지운다. 저장 JSON에 남은 같은 키는 content면 그대로 전달되고, 최상위면 계약 외 키로 제거된다.
- **최상위 응답 필드 추가**: `POPUP_RULES`(기본값 있음) 또는 `POPUP_VALUE_RULES`(검증만)에 추가하고 Service `OUTPUT_ORDER`에 위치를 넣는다. 넣지 않으면 계약 외 키로 제거된다.

## 9. 검증 상태 (2026-10-27)

- 실행: `PopupFullJsonSampleTest` 15건(파싱 실패 유형, popupId 기준, 서버 소유 값 제거, 계약 외 키 제거·키 순서, 기본값·false/0 유지, 타입 오류 거절, content 옵션 승격, 설정 원본 불변, IMAGE 크기, 푸터 규칙, 영상 QUIZ 상속, 필수 콘텐츠·문항 형식, 샘플 INSERT 6건 조립, 설정 파일 기동 검증 9종), `PopupFullJsonSampleMapperXmlTest` 3건(바인딩 SQL·CLOB 매핑·3111 매퍼와 공존), `PopupFullJsonSampleControllerTest` 4건(200/null·500·401·400). service/core·repo/core·web/api 전체 회귀 통과.
- 변이 확인: 기본값 `allowSeek` true 변경·SURVEY `isCorrect` 제거 생략 시 각각 실패.
- 미실행: 실제 Oracle DTIY3117 조회·DDL 대조, 서버 기동 후 HTTP 호출, API Demo·WPF 유형별 표시, 등록/수정·상세조회 왕복.

## 10. 등록·수정 공통 JSON 검증·기본값 생성 (2026-10-29)

근거: [등록·수정 공통 JSON 검증 TODO](../design/20261029_등록수정_공통JSON검증_기본값생성_3111직조회_TODO.md). 조회 단계 기본값 재조립을 없애기 위한 첫 단계로, **등록·수정 시 DB 쓰기 직전**에 호출할 공통 모듈과 인계용 등록 샘플을 추가했다. 기존 3111·3117 **조회 경로는 바꾸지 않았다**(전환은 TODO §3, 별도 진행).

### 10-1. 파일과 선언 이유

| 파일 | 선언 이유 |
|---|---|
| `service/core/.../fulljson/PopupJsonValidator.java` | 공통 모듈 본체. 타입·필수값·ENUM·범위를 **오류를 모아** 검사하고, 누락/null에만 기본값을 채운 정규화 popup을 만든다. 예외를 던지지 않고 결과 객체로 돌려준다 |
| `PopupJsonValidationResult.java` | 저장 가능 여부(`valid()` = 오류 0건)·정규화 결과(오류면 null)·오류·변경 이력·정책 버전 |
| `PopupJsonIssue.java` | 오류 1건 `{path, code, expected, actual, message}` — 관리자 화면에 필드별로 표시 |
| `PopupJsonChange.java` | 경고 1건 `{path, before, after, reason}` — 기본값 적용·제거·이동 이력 |
| `PopupFullJsonRegisterSampleService.java` | 인계용 등록·수정 흐름 예시: 검증 → 오류면 쓰기 0건 → 통과 시 정규화 JSON INSERT/UPDATE |
| `repo/core/.../PopupFullJsonRegisterSampleMapper.java` + `.xml` | DTIY3117 INSERT/UPDATE(CLOB 바인딩). 조회 매퍼와 분리해 기존 조회 샘플·테스트를 바꾸지 않는다 |
| `PopupFullJsonDefaults.java`(수정) | `Rule.accepts`·`issueCode`·`describe` 추가. 규칙 표·YAML 기본값을 조회 샘플과 **공유**한다(규칙 복제 없음) |

Bean은 기존 `popup.sample.full-json.enabled=true`일 때 `PopupFullJsonSampleConfig`가 함께 등록한다.

### 10-2. 처리 로직

객체 확인 → envelope(`{popup:...}`) 거절 → `deliveryId`·`pollingIntervalSeconds` 제거 → popupId를 DB 키와 대조(없으면 채움) → content/questions 분리 → content 안 창·푸터 옵션 최상위 이동 → 계약 외 최상위 키 제거 → 명시값 타입·ENUM·범위 → 유형별 필수 콘텐츠 → 누락/null 기본값 → 푸터 규칙 → 최소/최대 크기 → 문항 → 조회 응답과 같은 키 순서로 조립.

| 입력 | 처리 |
|---|---|
| 명시값 타입·ENUM·범위 오류(`videoEnabled:"videoEnabled"`, `"true"`, `sizeMode:"AUTO"`) | 오류. 자동 변환·기본값 대체 없음 |
| 누락·null | 기본값 + 이력. 명시한 false·0·빈 문자열 유지. 기본값이 null인 키(글자 크기·hideDays)는 null |
| 기본값 | `popup-full-json-defaults.yml` 그대로. IMAGE·VIDEO `showDescription`, VIDEO `allowSeek`·`allowPlaybackRateChange` = **false**(2026-10-27 확정값 유지, 영상 QUIZ 상속) |
| SURVEY 정답 키 | 관리자 원본 왕복을 위해 **저장 시 유지**. WPF 응답에서 빼는 것은 조회 책임 |
| 같은 결과 재검증 | 같은 결과·이력 0건(멱등) |

오류 code: `INVALID_JSON`·`NOT_OBJECT`·`ENVELOPE_NOT_ALLOWED`·`MISSING_REQUIRED`·`TYPE_MISMATCH`·`INVALID_ENUM`·`OUT_OF_RANGE`·`ID_MISMATCH`·`RULE_VIOLATION`.
변경 reason: `DEFAULT_APPLIED`·`SERVER_OWNED_REMOVED`·`UNKNOWN_FIELD_REMOVED`·`MOVED_FROM_CONTENT`·`NOT_APPLICABLE_REMOVED`·`POPUP_ID_SET`·`VALUE_TRIMMED`.

오류 응답 예:

```json
{ "path": "$.content.videoEnabled", "code": "TYPE_MISMATCH", "expected": "boolean",
  "actual": "\"videoEnabled\"", "message": "videoEnabled 값이 올바르지 않습니다." }
```

유형별 기본값이 모두 채워진 전체 JSON(TEXT·IMAGE·VIDEO·SURVEY·QUIZ·영상 QUIZ): [examples/DTIY3117-register-defaults-full.txt](examples/DTIY3117-register-defaults-full.txt). 검증기 정규화 결과로 생성하며 `PopupJsonDefaultsExampleFileTest`가 코드 기본값과 대조한다(기본값 변경 시 `POPUP_REGEN_DEFAULTS_EXAMPLE=1`로 재생성).

### 10-3. 실제 등록 서비스 연결(교체 지점)

```java
// 기존 저장 메서드의 DB 쓰기 직전
PopupJsonValidationResult result = popupJsonValidator.validate(requestJson, popupId);
if (!result.valid()) return badRequest(result.errors());          // 쓰기·COMMIT 없음
mapper.save(popupId, objectMapper.writeValueAsString(result.normalized()));
return ok(result.changes());                                      // 기본값 적용 경고 표시
```

- 부분 수정(PATCH)이면 기존 저장 JSON과 병합한 **최종 객체**를 검증한다. 샘플 `update`는 전체 교체다.
- 여러 테이블에 쓰면 `@Transactional` 안에서 검증 → 쓰기 순서를 지킨다.
- 로그에는 오류 경로·코드만 남기고 값 원문을 남기지 않는다.
- [미확인] DTIY3117 감사 컬럼(`REG_USER_ID`·`REG_DTTM`·`CHNG_USER_ID`·`CHNG_DTTM`)과 DEFAULT 제약은 사진 판독 기준이다.

### 10-4. 옵션 추가·삭제

규칙·기본값은 §8과 같은 위치(`PopupFullJsonDefaults` 규칙 표 + YAML)를 쓰므로 한 번 바꾸면 등록 검증과 조회 샘플에 함께 적용된다. 바꾼 뒤 `PopupJsonValidator.POLICY_VERSION`을 올린다. 규칙 표 밖 본문 필드(TEXT `plainText`·`textBlocks`, `imageUrl`, `videoUrl`, 문항 `isRequired`·`isScored`·`questionScore`·`options[].isCorrect`)의 타입 검사는 `PopupJsonValidator`의 `checkContentValues`·`checkQuestions`에서 추가·삭제한다.

### 10-5. 범위와 남은 항목

- 3111: 컬럼 + content CLOB 구조라 전체 JSON 직조회가 불가하다. 저장 형식 결정 전까지 Assembler 제거는 보류(TODO §3).
- 3117 조회의 기본값 제거, 기존 행 이행, 관리자 화면 오류 표시, Demo JSON Validator(C#)와의 정책 대조 문서화는 후속.
- 검증: `PopupJsonValidatorTest` 16건(유형별 최소 JSON 6종 정상·멱등, 확정 기본값, false/0 유지·null 보완, IMAGE 크기, 문자열 boolean 거절 재현, ENUM·범위 코드, 오류 수집, 구조 오류, 서버 소유 값·popupId, 원본 불변, 푸터, SURVEY 정답 유지, 중첩 문항 오류, 등록 샘플 오류 시 쓰기 0건·수정 대상 없음), `PopupFullJsonRegisterSampleMapperXmlTest` 3건. 서버 전체 233건 실패 0·skip 11.
- 미실행: 실제 Oracle DTIY3117 INSERT/UPDATE(로컬·원격 개발 DB), 등록 → 조회 → WPF 표시 왕복.
