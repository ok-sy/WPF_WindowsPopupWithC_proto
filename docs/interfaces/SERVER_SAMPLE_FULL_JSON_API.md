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

범위 제외: 등록/수정 API의 저장 경계, 관리자 상세조회 복원, 기존 3111 데이터 이관, WPF EXE 변경. WPF 응답 계약이 같으므로 WPF 파서·창은 바꾸지 않았다.

## 8. 옵션 추가·삭제 예시

- **기본값을 둘 옵션 추가**(예: TEXT `showTitle`): ① `PopupFullJsonDefaults.CONTENT_RULES`의 TEXT에 `"showTitle", bool()` 추가 → ② YAML `content.TEXT.showTitle: true` 추가. 한쪽만 바꾸면 기동이 실패한다.
- **기본값 변경**(예: VIDEO 탐색 허용): YAML `content.VIDEO.allowSeek: true`만 바꾼다. 3111 샘플·WPF 자체 기본값에는 영향이 없다.
- **옵션 삭제**: 규칙 표와 YAML에서 함께 지운다. 저장 JSON에 남은 같은 키는 content면 그대로 전달되고, 최상위면 계약 외 키로 제거된다.
- **최상위 응답 필드 추가**: `POPUP_RULES`(기본값 있음) 또는 `POPUP_VALUE_RULES`(검증만)에 추가하고 Service `OUTPUT_ORDER`에 위치를 넣는다. 넣지 않으면 계약 외 키로 제거된다.

## 9. 검증 상태 (2026-10-27)

- 실행: `PopupFullJsonSampleTest` 15건(파싱 실패 유형, popupId 기준, 서버 소유 값 제거, 계약 외 키 제거·키 순서, 기본값·false/0 유지, 타입 오류 거절, content 옵션 승격, 설정 원본 불변, IMAGE 크기, 푸터 규칙, 영상 QUIZ 상속, 필수 콘텐츠·문항 형식, 샘플 INSERT 6건 조립, 설정 파일 기동 검증 9종), `PopupFullJsonSampleMapperXmlTest` 3건(바인딩 SQL·CLOB 매핑·3111 매퍼와 공존), `PopupFullJsonSampleControllerTest` 4건(200/null·500·401·400). service/core·repo/core·web/api 전체 회귀 통과.
- 변이 확인: 기본값 `allowSeek` true 변경·SURVEY `isCorrect` 제거 생략 시 각각 실패.
- 미실행: 실제 Oracle DTIY3117 조회·DDL 대조, 서버 기동 후 HTTP 호출, API Demo·WPF 유형별 표시, 등록/수정·상세조회 왕복.
