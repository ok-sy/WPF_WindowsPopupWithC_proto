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
| service/core(test) | `src/test/resources/sample/single-query/DTIY3111_sample_insert_oracle.sql` | 유형별 샘플 콘텐츠 INSERT 6건(§4.1). 테스트가 같은 파일로 응답 조립을 확인 |

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
| IMG_FILE_PATH_CN / IMG_FILE_NM | IMAGE `content.imageUrl` | `file-base-url` + 세그먼트별 URL 인코딩. 만들어지면 content 값보다 우선 |
| VDO_FILE_PATH_CN / VDO_FILE_NM | VIDEO·영상+퀴즈 `content.videoUrl` | 같은 규칙. 영상 없는 QUIZ에는 적용하지 않음 |
| APND_FILE_ID | 응답 필드 없음 | VO `attachFileId`로 조회만 하고 URL 생성에는 미사용. 첨부 ID 방식이면 `FileUrlResolver` 교체(§6) |
| POPU_CNTN_NM | 응답 필드 없음 | 관리용 콘텐츠명. 샘플 SQL은 읽지 않음 |
| DEL_YN | 응답 필드 없음 | 삭제 코드·NULL 의미 미확정. 후보 SQL에 주석으로만 위치 표시(§4) |
| REG_USER_ID / REG_DTTM | 응답 필드 없음 | 사진 NULLABLE=N. 샘플 INSERT는 `'SAMPLE'`·`SYSDATE` 명시(§4.1) |
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

파일 URL 규칙(`FileUrlResolver`): 파일명이 있어야 URL을 만든다. 경로만 있으면 null(content URL 유지), 경로 없이 파일명만 있으면 `file-base-url` 바로 아래로 만든다.

기본값의 역할: 저장하지 않은 선택 옵션의 기본값은 **서버 응답 조립기**(`CONTENT_DEFAULTS`·`applyQuestionDefaults`)가 채운다. 관리자 웹(프론트)의 기본값은 신규 입력·미리보기 초기값일 뿐 응답 기본값의 원본이 아니다. 누락·null만 채우고 명시적 false·유효한 0은 유지한다. 샘플이 옵션 키를 모두 싣는 것은 인계용 표시이며, 실제 API의 필수 필드 범위는 인터페이스 명세의 필수 표기를 따른다.

### 3.2 DTIY3111 사진 정의 기준 길이·숫자

컬럼 정의는 [DTIY3111 사진 OCR](DTIY3111_SCHEMA_OCR.md)이다(확정 DDL 아님).

- `POPU_CNTN_ID` VARCHAR2(10): 샘플 ID는 10자(`SMP-TXT-01` 등).
- `POPU_WDTH_SZ`/`POPU_LNTH_SZ` NUMBER(5): 정밀도·스케일 미확인. NUMBER(5,0)이면 소수는 저장 시 반올림되므로 이 테이블 기준 예시·테스트는 정수로 둔다. 공통 WPF/API의 소수 입력은 막지 않는다.
- VARCHAR2 길이의 BYTE/CHAR 기준·DB 문자셋 미확인. 예: AL32UTF8에서 VARCHAR2(200 BYTE)는 일반 한글 약 66자. 샘플 값은 BYTE·AL32UTF8 가정으로도 들어가는 길이로 두고 테스트로 확인한다(실제 정의 확인 전 길이 제한을 코드에 강제하지 않음).

## 4. SQL (65-2)

`PopupSingleQuerySampleMapper.xml` 요약:

```sql
SELECT *
  FROM (SELECT NULL AS POST_ID, C.POPU_CNTN_ID, C.POPU_CNTN_TP_CD, C.HDR_TITL, C.POPU_WDTH_SZ, C.POPU_LNTH_SZ,
               C.AFTR_CNFM_OBJ_YN, C.FTR_BTN_TP_CD, C.FTR_URL, C.IMG_FILE_PATH_CN, C.IMG_FILE_NM,
               C.VDO_FILE_PATH_CN, C.VDO_FILE_NM, C.APND_FILE_ID, C.CNTN_CN
          FROM DTIY3111 C
         WHERE 1 = 1
           /* [담당 구현] 게시·대상자·일정·완료·숨김·나중에 보기 조건 */
           /* [샘플 조건·담당 확인] 삭제 코드와 NULL 의미 확인 후 적용: AND NVL(C.DEL_YN, 'N') = 'N' */
           AND C.POPU_CNTN_ID = ?      -- [샘플 조건] contentId 있을 때만
           AND C.POPU_CNTN_TP_CD = ?   -- [샘플 조건] contentTypeCode 있을 때만
         ORDER BY /* [담당 확인] 우선순위 컬럼 */ C.POPU_CNTN_ID DESC)   -- 동순위 보조 키(PK)
 WHERE ROWNUM = 1
```

- 정렬은 내부 쿼리, `ROWNUM = 1`은 바깥에만 둔다(안에 두면 정렬 전에 잘린다). `FETCH FIRST`는 11g에 없어 쓰지 않는다.
- 값은 `#{}` 바인딩만 쓴다. **SQL 주석 안에도 `#{}`를 쓰면 바인딩으로 잡혀 파라미터 수가 어긋난다**(검증 중 확인해 제거).
- 0건이면 매퍼가 null → 200 `{"pollingIntervalSeconds":1800,"popup":null}`.

### 4.1 유형별 샘플 INSERT

`zero-rule-server/service/core/src/test/resources/sample/single-query/DTIY3111_sample_insert_oracle.sql`에 DTIY3111 사진 정의 기준 콘텐츠 6건이 있다(콘텐츠명·파일 컬럼·등록자 `'SAMPLE'`·등록일시 `SYSDATE` 포함, `DEL_YN`·`APND_FILE_ID`는 미입력). 다시 넣을 때는 스크립트 첫 `DELETE`부터 실행한다. DELETE는 샘플 ID 6건만 `IN`으로 지정한다.

| POPU_CNTN_ID | 유형 코드 | 확인 포인트 |
|---|---|---|
| SMP-TXT-01 | 10 TEXT | textBlocks 서식 본문·강조 문구·하단 설명, 푸터 02 링크 후 닫기, content의 창 옵션(배경 없음·TOP_RIGHT·bodyFontSize)이 최상위로 이동 |
| SMP-IMG-01 | 20 IMAGE | 이미지 컬럼 → `file-base-url/popup/sample/image/notice.png`, 크기 NULL이면 width/height 생략 |
| SMP-VDO-01 | 30 VIDEO | 영상 컬럼 → videoUrl, 나중에 보기(AFTR_CNFM_OBJ_YN=Y), 배속·탐색 금지 |
| SMP-SVY-01 | 40 SURVEY | 푸터 코드 NULL이어도 SUBMIT. 문항은 QuestionPort |
| SMP-QIZ-01 | 50 QUIZ | 영상 없는 퀴즈. 문항·정답 키는 QuestionPort |
| SMP-VQZ-01 | 50 QUIZ | `videoEnabled=true` 영상+퀴즈. 영상 컬럼 URL이 content.videoUrl보다 우선, completionRatio 1.0 |

- 확인할 행은 `?contentId=SMP-TXT-01`처럼 지정한다. 정렬이 `POPU_CNTN_ID DESC`라 지정하지 않으면 SMP-VQZ-01이 먼저 잡힌다.
- 기본 `UnconnectedQuestionPort` 상태에서 SURVEY·QUIZ 3건은 `QUESTIONS_NOT_CONNECTED`(500)가 정상이다. 문항 형태는 `web/api/src/test/resources/sample/relay/survey.json`·`quiz.json`·`video-quiz.json`의 `questions`를 따른다.
- [미확인] 사진 정의는 확정 DDL이 아니다. `DEL_YN` 코드·DEFAULT, `REG_DTTM` DEFAULT 제약, ID 채번 규칙, 코드값(PopupCodeTable 예시)은 실제 정의로 바꾼다. CLOB 리터럴은 4000바이트 이하로 둔다.

## 5. 응답 예시 (65-7)

정상(TEXT, 전체 키). CNTN_CN에는 `plainText`·`showPlainText`·`textBlocks`와 창 옵션만 있었고 나머지는 기본값으로 채운 결과다:

```json
{"pollingIntervalSeconds":1800,
 "popup":{"deliveryId":"(DeliveryPort 발급)","popupId":"C-001","popupType":"TEXT","title":"점검 안내",
  "displayMode":"SEQUENTIAL","sizeMode":"FIXED","width":560.0,"height":420.0,"widthRatio":0.7,"heightRatio":0.75,
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
| 파일 URL | `file-base-url` + 유형별 경로·파일명(`FileUrlResolver`) | 실제 파일 서버·영상 Range API(`samples/popup-video-range`) 규칙. 첨부 ID(`APND_FILE_ID`) 방식이면 `FileUrlResolver`를 교체하고 `row.getAttachFileId()`를 쓴다(기존 서버 규칙 `FileIdToUrlImpl.urlWithFileName` → `p/file/download2/{fileId}/{fileName}`) |

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

- DB 없이: repo/core `PopupSingleQuerySampleMapperXmlTest` 4건(XML 파싱, 정렬 후 ROWNUM 1, 바인딩 수, CLOB→String, 사진 정의 파일 컬럼·DEL_YN 미적용), service/core `PopupSingleQuerySampleTest` 10건(없음, 컬럼 매핑·중첩·false/0 보존·중복 키 제거, 기본값, 전체 옵션 키, IMAGE 파일 URL·크기 생략, SURVEY SUBMIT, 데이터 오류 11종·전달 건 미발급, §4.1 INSERT SQL 6건 유형별 조립·CLOB 4000바이트 이하, 사진 정의 범위(20개 컬럼·길이 BYTE 가정·ID 10자·등록자/일시·NUMBER(5) 정수·DELETE 대상), 유형별 파일 컬럼·경로만/파일명만), web/api `PopupSingleQuerySampleControllerTest` 3건(200·null popup, 500, 401·400).
- 미실행: 실제 DTIY3111 테이블 대상 SQL·샘플 INSERT 실행(확정 DDL·대상 DB 미보유, 사진 정의 기준까지만 확인), 확정 코드표 대조, 전체 서버에서 `enabled=true` 기동 확인.
