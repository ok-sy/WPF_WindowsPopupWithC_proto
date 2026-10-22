# 서버 샘플 — 실테이블 연계 단건 조회 API (TODO65)

기준일: 2026-10-22 (KST) · 관련: `docs/design/65_단건조회_공통매핑_CLOB파싱_샘플API_TODO.md`

서버 개발 담당자가 실제 조회 API를 구현할 때 참고하는 SQL·매핑·CLOB 파싱·기본값·응답 조립 샘플이다.
기존 `WpfPopupService`(POPUP 스키마 조회·전달 건 처리)를 대체하지 않으며 **기본 비활성**이다.

## 1. 흐름과 파일

```text
POST /p/api/sample/wpf/popups/single  (본문 {}, 사용자 = WpfUserResolver)
 → PopupSingleQuerySampleController (web/api)
 → PopupSingleQuerySampleService (service/core)
    1) PopupSingleQuerySampleMapper.selectNextCandidate   SQL: 정렬 후 ROWNUM = 1 → PopupContentRow
    2) PopupContentJsonParser.parse                        CNTN_CN(CLOB→String) → ObjectNode
    3) PopupCodeTable                                      공통 코드 → popupType / footerAction, Y/N → boolean
    4) QuestionPort                                        SURVEY·QUIZ 문항(교체 지점)
    5) PopupSingleResponseAssembler                        공통 헤더/옵션 + content 창 옵션 승격 + 기본값 + 필수 콘텐츠 검증
    6) DeliveryPort                                        deliveryId·pollingIntervalSeconds(교체 지점)
 → {pollingIntervalSeconds, popup}  (기존 WPF 단건 조회 계약과 같은 필드·위치)
```

| 모듈 | 경로 | 내용 |
|---|---|---|
| domain | `server/domain/popup/sample/PopupContentRow.java` | 조회 결과 VO(컬럼 매핑표 Javadoc) |
| repo/core | `server/repo/core/mapper/popup/sample/PopupSingleQuerySampleMapper.java` | 매퍼 인터페이스(기존 `@MapperScan(server.repo)`로 자동 등록) |
| repo/core | `resources/mappers/popup/sample/PopupSingleQuerySampleMapper.xml` | Oracle 11g 단건 SQL·resultMap(기존 `mappers/**/*.xml`로 자동 로드) |
| service/core | `server/service/core/popup/sample/` | `PopupSingleQuerySampleConfig`(조건부 Bean)·Service·Parser·Assembler·CodeTable·Ports·Exception |
| web/api | `server/web/api/popup/sample/PopupSingleQuerySampleController.java`·`...ExceptionHandler.java` | API·샘플 한정 오류 응답 |

## 2. 실행 설정

```yaml
popup:
  sample:
    single-query:
      enabled: true                                   # 기본 false(등록 안 됨)
      file-base-url: http://localhost:8080/zero-rule-server/p/api/popups/files   # [교체] 파일 URL 규칙
      polling-interval-seconds: 1800                  # [교체] 기존 폴링 설정
```

기존 서버의 DataSource(Oracle)·인증 설정을 그대로 쓴다. 샘플 SQL의 `DTIY3111`은 스키마 한정자 없이 접속 계정 기준이다.

```powershell
Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/zero-rule-server/p/api/sample/wpf/popups/single?contentId=C-001' `
  -ContentType 'application/json' -Body '{}' -Headers @{ 'X-Dev-User' = 'E1001' }   # 개발 헤더 이름은 custom.wpf-popup.dev-user-header
```

## 3. 컬럼 → 응답 매핑 (65-1)

| 컬럼 | 응답 | 변환·기본값 |
|---|---|---|
| POPU_CNTN_ID | `popupId` | 콘텐츠 ID = 결과 집계 식별자 |
| (미확인) 게시 테이블 ID | 응답 필드 없음 | `DeliveryPort` 입력. 게시 ID와 콘텐츠 ID를 섞지 않음 |
| POPU_CNTN_TP_CD | `popupType` | **예시 코드** 10 TEXT·20 IMAGE·30 VIDEO·40 SURVEY·50 QUIZ. 모르는 코드는 오류 |
| HDR_TITL | `title` | null → `""` |
| POPU_WDTH_SZ / POPU_LNTH_SZ | `width` / `height` | null → 900 / 620, IMAGE는 생략(원본 기준). 0 이하 오류 |
| AFTR_CNFM_OBJ_YN | `showLater` | Y/N → true/false, null → false, 그 밖의 값 오류 |
| FTR_BTN_TP_CD | `footerAction` | **예시 코드** 01 CLOSE·02 LINK_AND_CLOSE·03 SUBMIT. null → CLOSE, SURVEY·QUIZ는 항상 SUBMIT |
| FTR_URL | `footerLinkUrl` | LINK_AND_CLOSE일 때만, 절대 http/https 필수 |
| (미확인) ATCH_FILE_PATH / ATCH_FILE_NM | `content.imageUrl` / `content.videoUrl` | `file-base-url` + 세그먼트별 URL 인코딩. 컬럼 값이 content 값보다 우선 |
| CNTN_CN (CLOB) | `content` | JSON 객체만 허용. 객체 그대로(이중 직렬화 없음) |
| (컬럼 없음) | `displayMode`·`sizeMode`·`widthRatio`·`heightRatio`·`minimum*`·`maximum*`·`showHeader`·`showFooter`·`showFooterButton`·`showDoNotShowAgain` | SEQUENTIAL·FIXED·0.7·0.75·300·300·1200·900·true·true·true·false |
| content `useBackgroundOverlay`·`backgroundOverlayOpacity`·`popupPosition`·`*FontSize` | 최상위 같은 이름 | 설계 31처럼 최상위로 옮기고 content에서 제거. 누락 시 true·0.45·CENTER·폰트 `null`(키 포함, WPF 기본 크기). 명시적 false·0 유지, 범위 밖 값은 오류 |
| (컬럼 없음) | `hideDays` / `completionRatio` / `passingScore` | `null` / VIDEO·영상+퀴즈 `1.0`, 그 밖 `null` / QUIZ만 키 포함 `null`. 컬럼이 확정되면 row 값으로 교체 |

### 3.1 샘플 응답은 가능한 옵션 키를 모두 싣는다

인계용 샘플이므로 응답 하나에서 쓸 수 있는 옵션 전체가 보이도록, 저장된 JSON에 없던 키도 계약 기본값으로 채워 싣는다(값이 있으면 그대로 유지). 기본값이므로 WPF 표시 결과는 키를 생략했을 때와 같다. 표는 `PopupSingleResponseAssembler.CONTENT_DEFAULTS`·`applyQuestionDefaults`와 같다.

| 유형 | content 옵션(기본값) |
|---|---|
| TEXT | `plainText` "", `textBlocks` null, `showPlainText` true, `highlightText` "", `showHighlight` false, `bottomDescription` "", `bottomDescriptionUrl` "", `showBottomDescription` false |
| IMAGE | `imageTitle` "", `imageUrl`(필수), `description` "", `showDescription` true, `imageSizeMode` ADAPTIVE, `keepAspectRatio` true |
| VIDEO | `videoTitle` "", `videoUrl`(필수), `description` "", `showDescription` true, `showControls` true, `allowFullScreen` true, `allowPlaybackRateChange` true, `allowSeek` true, `autoPlay` false, `isLoop` false, `defaultVolume` 0.7 |
| SURVEY | `surveyTitle` "", `surveyTitleBlocks` null, `description` "", `descriptionBlocks` null |
| QUIZ | SURVEY 항목 + `videoEnabled` false. `videoEnabled=true`(영상+퀴즈)면 VIDEO 재생 옵션 전체도 채움 |
| questions[] | `description` "", `titleBlocks`·`descriptionBlocks` null, `optionLayout` VERTICAL, `isRequired`·`isScored` false, `questionScore`(QUIZ 채점 문항 1, 그 밖 null), QUIZ만 `correctAnswer` null·`answerMatchMode`(TEXT 문항 EXACT) |
| options[] | `value` "", `textBlocks` null, QUIZ만 `isCorrect` false |

예외(계약 유지): `footerLinkUrl`은 LINK_AND_CLOSE일 때만 보낸다. SURVEY는 정답 키(`isCorrect`·`correctAnswer`·`answerMatchMode`)를 지운다. 필수 콘텐츠 검증은 기본값을 채우기 **전** 원본으로 하므로 빈 기본값("")이 필수 누락을 가리지 않는다.
옵션을 추가·삭제할 때는 `CONTENT_DEFAULTS` 표와 명세 §8·WPF 콘텐츠 DTO 기본값을 함께 맞춘다.

중복 값 우선순위: 제목·창 크기·나중에 보기·푸터 동작/URL은 **컬럼 기준**이며 content의 같은 키는 응답에서 제거한다.
코드표·미확인 컬럼명은 확정본을 받으면 `PopupCodeTable`과 매퍼 XML만 교체한다.

## 4. SQL (65-2)

`PopupSingleQuerySampleMapper.xml` 요약:

```sql
SELECT *
  FROM (SELECT NULL AS POST_ID, C.POPU_CNTN_ID, C.POPU_CNTN_TP_CD, C.HDR_TITL, C.POPU_WDTH_SZ, C.POPU_LNTH_SZ,
               C.AFTR_CNFM_OBJ_YN, C.FTR_BTN_TP_CD, C.FTR_URL, C.ATCH_FILE_PATH, C.ATCH_FILE_NM, C.CNTN_CN
          FROM DTIY3111 C
         WHERE 1 = 1
           /* [담당 구현] 게시·대상자·일정·완료·숨김·나중에 보기 조건 */
           AND C.POPU_CNTN_ID = ?      -- [샘플 조건] contentId 있을 때만
           AND C.POPU_CNTN_TP_CD = ?   -- [샘플 조건] contentTypeCode 있을 때만
         ORDER BY /* [담당 확인] 우선순위 컬럼 */ C.POPU_CNTN_ID DESC)   -- 동순위 보조 키(PK)
 WHERE ROWNUM = 1
```

- 정렬은 내부 쿼리, `ROWNUM = 1`은 바깥에만 둔다(안에 두면 정렬 전에 잘린다). `FETCH FIRST`는 11g에 없어 쓰지 않는다.
- 값은 `#{}` 바인딩만 쓴다. **SQL 주석 안에도 `#{}`를 쓰면 바인딩으로 잡혀 파라미터 수가 어긋난다**(검증 중 확인해 제거).
- 0건이면 매퍼가 null → 200 `{"pollingIntervalSeconds":1800,"popup":null}`.

## 5. 응답 예시 (65-7)

정상(TEXT, 전체 키). CNTN_CN에는 `plainText`·`showPlainText`·`textBlocks`와 창 옵션만 있었고 나머지는 기본값으로 채운 결과다:

```json
{"pollingIntervalSeconds":1800,
 "popup":{"deliveryId":"(DeliveryPort 발급)","popupId":"C-001","popupType":"TEXT","title":"점검 안내",
  "displayMode":"SEQUENTIAL","sizeMode":"FIXED","width":560.0,"height":420.5,"widthRatio":0.7,"heightRatio":0.75,
  "minimumWidth":300.0,"minimumHeight":300.0,"maximumWidth":1200,"maximumHeight":900,
  "showHeader":true,"showFooterButton":true,"showFooter":true,
  "footerAction":"LINK_AND_CLOSE","footerLinkUrl":"https://intranet.example.com/notice/1",
  "useBackgroundOverlay":false,"backgroundOverlayOpacity":0.0,"popupPosition":"TOP_RIGHT",
  "headerFontSize":null,"bodyFontSize":18.0,"footerFontSize":null,
  "showDoNotShowAgain":false,"showLater":true,"hideDays":null,"completionRatio":null,"questions":[],
  "content":{"plainText":"점검 안내","showPlainText":false,
   "textBlocks":[{"alignment":"LEFT","indent":0,"runs":[{"text":"점검","bold":true,"italic":false}]}],
   "highlightText":"","showHighlight":false,"bottomDescription":"","bottomDescriptionUrl":"","showBottomDescription":false}}}
```

유형별 전체 옵션 예시 JSON(IMAGE·VIDEO·SURVEY·QUIZ·영상+퀴즈 포함)은 `zero-rule-server/web/api/src/test/resources/sample/relay/*.json`에 있고, WPF 조회 DTO로 역직렬화되는지 `scripts/PopupWindowTests`가 확인한다.

없음: `{"pollingIntervalSeconds":1800,"popup":null}`

오류(잘못된 JSON·객체가 아닌 JSON·필수 콘텐츠 누락·모르는 코드·잘못된 Y/N·URL·문항 미연결): HTTP 500

```json
{"code":"WPF_INTERNAL","message":"서버 처리 중 오류가 발생했습니다.","timestamp":"2026-10-22T19:40:00+09:00"}
```

원인은 서버 로그 `contentId=... reason=INVALID_CONTENT_JSON|CONTENT_NOT_OBJECT|MISSING_REQUIRED_CONTENT|UNKNOWN_CODE|INVALID_COLUMN|QUESTIONS_NOT_CONNECTED`로 남긴다.
빈 content·기본값으로 덮어 정상처럼 반환하지 않으며, 오류 응답에는 전달 건을 발급하지 않는다. 인증 없음 401 `WPF_UNAUTHORIZED`, 본문이 객체가 아니면 400 `WPF_BAD_REQUEST`.

유형별 필수 콘텐츠: TEXT `plainText` 또는 비어 있지 않은 `textBlocks`, IMAGE `imageUrl`, VIDEO `videoUrl`, SURVEY·QUIZ 문항 1개 이상.

## 6. 교체 지점과 책임 범위

| 지점 | 샘플 구현 | 실제 서버 담당 |
|---|---|---|
| SQL 후보 조건·우선순위 | 확인용 contentId·유형 조건, PK 정렬 | 대상자·게시 일정·완료·숨김·나중에 보기 판단 |
| `DeliveryPort` | 무작위 UUID(업무 전달 건 아님), 설정 폴링 주기 | 전달 건 생성/재사용·소유권·중복 처리(기존 WpfPopupService 규칙) |
| `QuestionPort` | 미연결(SURVEY·QUIZ는 오류) | 문항·선택지 테이블 조회, QUIZ만 정답 키 포함 |
| `PopupCodeTable` | 예시 코드 | 확정 공통 코드표 |
| 파일 URL | `file-base-url` + 경로 | 실제 파일 서버·영상 Range API(`samples/popup-video-range`) 규칙 |

실제 대상/일정/완료/숨김/전달 건 정책의 일괄 검증은 담당 서버 개발 범위다. 포트는 `@ConditionalOnMissingBean`이라 실제 구현 Bean을 등록하면 샘플 구현 대신 쓰인다.

## 6-1. 클래스별 선언 이유

| 클래스 | 선언 이유 |
|---|---|
| `PopupContentRow`(domain) | SQL 컬럼명과 응답 필드명이 달라 resultMap으로 한 번 받아 두는 중간 VO. 컬럼이 바뀌면 이 VO와 XML만 고친다 |
| `PopupSingleQuerySampleMapper`(+XML) | 기존 서버 규칙(`@MapperScan(server.repo)`·`mappers/**/*.xml`)대로 자동 등록되도록 repo/core에 둔다. SQL만 담당하고 변환은 하지 않는다 |
| `PopupContentJsonParser` | CLOB 문자열 → JSON 객체 변환과 "객체가 아닌 JSON" 거절을 한 곳에 모은다(이중 직렬화 방지) |
| `PopupCodeTable` | 공통 코드 → ENUM 변환을 한 클래스에 모아, 확정 코드표를 받으면 이 파일만 교체하게 한다 |
| `PopupSingleResponseAssembler` | 컬럼 매핑·창 옵션 승격·기본값·필수 콘텐츠 검증 규칙을 응답 조립 한 곳에 모은다(규칙 변경 시 이 클래스만 수정) |
| `PopupPorts`(DeliveryPort·QuestionPort·FileUrlResolver) | 샘플이 구현하면 안 되는 업무(전달 건·문항 조회·파일 URL 규칙)를 인터페이스로 분리해 실제 구현으로 갈아 끼우게 한다 |
| `PopupSingleQuerySampleConfig` | 기본 비활성. 켰을 때만 Bean을 만들고, 포트는 `@ConditionalOnMissingBean`이라 실제 구현 Bean이 있으면 그것을 쓴다 |
| `PopupSingleQuerySampleController`·`...ExceptionHandler`(web/api) | 기존 WPF API를 건드리지 않는 별도 경로·별도 오류 처리(이 컨트롤러 한정). 사용자는 기존 `WpfUserResolver`로 정한다 |

## 6-2. 조절 가능한 옵션과 추가·삭제 예시

설정 키: `popup.sample.single-query.enabled`(기본 false), `file-base-url`, `polling-interval-seconds`(§2).

응답 필드 추가 예 — 콘텐츠 테이블에 `USE_DO_NOT_SHOW_YN`(다시 보지 않기) 컬럼이 생긴 경우:

```xml
<!-- PopupSingleQuerySampleMapper.xml: resultMap과 SELECT에 추가 -->
<result property="doNotShowYn" column="USE_DO_NOT_SHOW_YN"/>
     , C.USE_DO_NOT_SHOW_YN
```

```java
// PopupContentRow: 필드·getter/setter 추가
private String doNotShowYn;
// PopupSingleResponseAssembler.assemble: 고정값 대신 컬럼 사용(null이면 기본 false)
Boolean doNotShow = PopupCodeTable.yn(row.getDoNotShowYn(), "USE_DO_NOT_SHOW_YN", id);
popup.put("showDoNotShowAgain", doNotShow != null && doNotShow);
```

필드 빼기 예 — 푸터 URL 컬럼을 쓰지 않게 된 경우: `putFooter`에서 `LINK_AND_CLOSE` 분기를 지우고 `PopupCodeTable.FOOTER_BUTTON`에서 `02`를 지운다. 응답 계약에서 필드를 없애는 것은 WPF·인터페이스 명세 변경이 함께 필요하다.

코드값 바꾸기: `PopupCodeTable.CONTENT_TYPE`·`FOOTER_BUTTON`의 예시 코드를 확정 코드로 교체한다. 모르는 코드는 기본값이 아니라 오류가 되므로 누락 코드가 바로 드러난다.

기본값 바꾸기: `PopupSingleResponseAssembler`의 `DEFAULT_WIDTH`/`DEFAULT_HEIGHT`·고정값(`displayMode`·`minimumWidth` 300 등). 최소 300은 WPF·관리자 웹 하한(TODO68)과 같아야 한다.

## 7. 검증 상태

- DB 없이: repo/core `PopupSingleQuerySampleMapperXmlTest` 3건(XML 파싱, 정렬 후 ROWNUM 1, 바인딩 수, CLOB→String), service/core `PopupSingleQuerySampleTest` 6건(없음, 컬럼 매핑·중첩·false/0 보존·중복 키 제거, 기본값, IMAGE 파일 URL·크기 생략, SURVEY SUBMIT, 데이터 오류 11종·전달 건 미발급), web/api `PopupSingleQuerySampleControllerTest` 3건(200·null popup, 500, 401·400).
- 미실행: 실제 DTIY3111 테이블 대상 SQL 실행(테이블·확정 정의 미보유), 확정 코드표 대조, 전체 서버에서 `enabled=true` 기동 확인.
