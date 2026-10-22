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
| content `useBackgroundOverlay`·`backgroundOverlayOpacity`·`popupPosition`·`*FontSize` | 최상위 같은 이름 | 설계 31처럼 최상위로 옮기고 content에서 제거. 누락 시 true·0.45·CENTER·(폰트 생략). 명시적 false·0 유지, 범위 밖 값은 오류 |

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

정상(TEXT, 일부):

```json
{"pollingIntervalSeconds":1800,
 "popup":{"deliveryId":"(DeliveryPort 발급)","popupId":"C-001","popupType":"TEXT","title":"점검 안내",
  "displayMode":"SEQUENTIAL","sizeMode":"FIXED","width":560.0,"height":420.5,"widthRatio":0.7,"heightRatio":0.75,
  "minimumWidth":300.0,"minimumHeight":300.0,"maximumWidth":1200,"maximumHeight":900,
  "showHeader":true,"showFooterButton":true,"showFooter":true,
  "footerAction":"LINK_AND_CLOSE","footerLinkUrl":"https://intranet.example.com/notice/1",
  "useBackgroundOverlay":false,"backgroundOverlayOpacity":0.0,"popupPosition":"TOP_RIGHT","bodyFontSize":18.0,
  "showDoNotShowAgain":false,"showLater":true,"questions":[],
  "content":{"plainText":"점검 안내","showPlainText":false,"textBlocks":[{"alignment":"LEFT","indent":0,"runs":[{"text":"점검","bold":true,"italic":false}]}]}}}
```

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

## 7. 검증 상태

- DB 없이: repo/core `PopupSingleQuerySampleMapperXmlTest` 3건(XML 파싱, 정렬 후 ROWNUM 1, 바인딩 수, CLOB→String), service/core `PopupSingleQuerySampleTest` 6건(없음, 컬럼 매핑·중첩·false/0 보존·중복 키 제거, 기본값, IMAGE 파일 URL·크기 생략, SURVEY SUBMIT, 데이터 오류 11종·전달 건 미발급), web/api `PopupSingleQuerySampleControllerTest` 3건(200·null popup, 500, 401·400).
- 미실행: 실제 DTIY3111 테이블 대상 SQL 실행(테이블·확정 정의 미보유), 확정 코드표 대조, 전체 서버에서 `enabled=true` 기동 확인.
