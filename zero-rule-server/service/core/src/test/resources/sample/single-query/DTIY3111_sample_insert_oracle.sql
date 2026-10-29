/*
  POL-13-03 : 적용·샘플 구분
  POL-14-03 : 서버 인계 예제
  ■ 단건 조회 샘플용 콘텐츠 INSERT (DTIY3111, Oracle 11g 호환)
  - in : 없음(고정 샘플 6건)
  - out: DTIY3111 콘텐츠 행 6건 — TEXT · IMAGE · VIDEO · SURVEY · QUIZ · 영상+퀴즈(QUIZ + videoEnabled)
  - 컬럼은 DTIY3111 사진 정의(docs/interfaces/DTIY3111_SCHEMA_OCR.md)를 따른다. 사진 판독이며 확정 DDL이 아니다.

  사용
  - 확인할 행을 contentId로 지정해 호출한다(정렬이 POPU_CNTN_ID DESC라 지정하지 않으면 SMP-VQZ-01이 먼저 잡힌다).
      POST /p/api/sample/wpf/popups/single?contentId=SMP-TXT-01   (유형만 지정: ?contentTypeCode=20)
  - 다시 넣을 때는 아래 DELETE부터 실행한다. DELETE는 이 스크립트의 샘플 ID 6건만 지운다.
  - SQL*Plus·SQL Developer 스크립트 실행 기준(SET DEFINE OFF 포함).

  사진 정의 기준 값
  - POPU_CNTN_ID VARCHAR2(10): 샘플 ID는 10자(SMP-xxx-01).
  - REG_USER_ID VARCHAR2(6)·REG_DTTM DATE는 NULLABLE=N이라 'SAMPLE'·SYSDATE를 명시한다(비고의 Sysdate가 DEFAULT 제약인지는 미확인).
  - POPU_WDTH_SZ / POPU_LNTH_SZ NUMBER(5): 정밀도·스케일 미확인. NUMBER(5,0)이면 소수는 저장 시 반올림되므로 샘플 크기는 정수로 둔다.
  - VARCHAR2 길이의 BYTE/CHAR 기준과 DB 문자셋은 미확인. 샘플 값은 AL32UTF8·BYTE 기준(한글 3바이트)으로도 들어가는 길이로 둔다.

  [미확인] 교체 지점
  - 코드값(POPU_CNTN_TP_CD 10~50, FTR_BTN_TP_CD 01~03)은 PopupCodeTable의 예시값이다(사진의 코드 설명이 잘려 있음). 확정 코드표로 함께 바꾼다.
  - DEL_YN은 코드·NULL 의미가 미확정이라 넣지 않는다(DEFAULT·NOT NULL이면 실제 정의에 맞춰 추가). 후보 SQL의 삭제 조건도 주석으로만 표시돼 있다.
  - APND_FILE_ID는 현재 파일 URL 생성에 쓰지 않아 넣지 않는다. 첨부 ID 방식이면 FileUrlResolver 교체와 함께 값을 넣는다.
  - POPU_CNTN_ID 채번 규칙은 실제 규칙으로 바꾼다.

  컬럼 → 응답(상세는 docs/interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md §3)
  - POPU_CNTN_TP_CD → popupType, HDR_TITL → title, POPU_WDTH_SZ/POPU_LNTH_SZ → width/height(IMAGE는 NULL이면 생략)
  - AFTR_CNFM_OBJ_YN → showLater, FTR_BTN_TP_CD/FTR_URL → footerAction/footerLinkUrl(SURVEY·QUIZ는 항상 SUBMIT)
  - IMG_FILE_PATH_CN + IMG_FILE_NM → IMAGE content.imageUrl, VDO_FILE_PATH_CN + VDO_FILE_NM → VIDEO·영상+퀴즈 content.videoUrl
    (file-base-url 기준, 파일명이 있을 때만 만들고 content URL보다 우선)
  - POPU_CNTN_NM은 응답 필드가 아니다(관리용 콘텐츠명).
  - CNTN_CN(CLOB) → content. 창 옵션(useBackgroundOverlay·backgroundOverlayOpacity·popupPosition·*FontSize)은 최상위로 옮겨진다.
    없는 옵션 키는 서버가 계약 기본값으로 채우므로 필요한 값만 넣는다.

  SURVEY·QUIZ 문항
  - 문항·선택지는 CNTN_CN이 아니라 QuestionPort(별도 문항 테이블 조회)로 붙는다. 기본 UnconnectedQuestionPort 상태에서는
    SMP-SVY-01·SMP-QIZ-01·SMP-VQZ-01 조회가 QUESTIONS_NOT_CONNECTED(500)로 끝나는 것이 정상이다.
  - QuestionPort가 돌려줄 questions[] 형태: zero-rule-server/web/api/src/test/resources/sample/relay/survey.json·quiz.json·video-quiz.json.
  - hideDays·completionRatio·passingScore는 현재 컬럼이 없어 서버가 기본값(null, 영상 1.0)으로 보낸다.

  CLOB 리터럴은 4000바이트 이하로 유지한다(넘으면 TO_CLOB('...') || TO_CLOB('...')로 나눈다).
*/
SET DEFINE OFF;

DELETE FROM DTIY3111
 WHERE POPU_CNTN_ID IN ('SMP-TXT-01', 'SMP-IMG-01', 'SMP-VDO-01', 'SMP-SVY-01', 'SMP-QIZ-01', 'SMP-VQZ-01');

-- 1) TEXT: 서식 본문(textBlocks)·링크 후 닫기, 배경 없음·우측 상단·본문 글자 크기 지정
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, POPU_CNTN_NM, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, IMG_FILE_PATH_CN, IMG_FILE_NM, VDO_FILE_PATH_CN, VDO_FILE_NM,
     CNTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('SMP-TXT-01', '10', '샘플 TEXT', '시스템 점검 안내', 560, 420, 'N',
     '02', 'https://intranet.example.com/notice/1', NULL, NULL, NULL, NULL,
     '{"plainText":"시스템 점검 안내\n02:00~06:00",'
     || '"textBlocks":[{"alignment":"LEFT","indent":0,"runs":[{"text":"시스템 점검 안내","bold":true,"italic":false}]},'
     || '{"alignment":"CENTER","runs":[{"text":"02:00~06:00","color":"#DC2626"}]}],'
     || '"showPlainText":true,'
     || '"bottomDescription":"자세히 보기","bottomDescriptionUrl":"https://intranet.example.com/notice/1","showBottomDescription":true,'
     || '"useBackgroundOverlay":false,"backgroundOverlayOpacity":0,"popupPosition":"TOP_RIGHT","bodyFontSize":16}',
     'SAMPLE', SYSDATE);

-- 2) IMAGE: 이미지 컬럼으로 imageUrl 생성, 크기 NULL(원본 기준), ADAPTIVE·비율 유지
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, POPU_CNTN_NM, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, IMG_FILE_PATH_CN, IMG_FILE_NM, VDO_FILE_PATH_CN, VDO_FILE_NM,
     CNTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('SMP-IMG-01', '20', '샘플 IMAGE', '이미지 공지', NULL, NULL, 'N',
     '01', NULL, 'popup/sample/image', 'notice.png', NULL, NULL,
     '{"imageTitle":"이미지 안내","description":"이미지 설명","showDescription":true,'
     || '"imageSizeMode":"ADAPTIVE","keepAspectRatio":true}',
     'SAMPLE', SYSDATE);

-- 3) VIDEO: 영상 컬럼으로 videoUrl 생성, 나중에 보기 표시, 배속·탐색 금지
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, POPU_CNTN_NM, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, IMG_FILE_PATH_CN, IMG_FILE_NM, VDO_FILE_PATH_CN, VDO_FILE_NM,
     CNTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('SMP-VDO-01', '30', '샘플 VIDEO', '보안 교육 영상', 760, 560, 'Y',
     '01', NULL, NULL, NULL, 'popup/sample/video', 'training.mp4',
     '{"videoTitle":"보안 교육","description":"끝까지 시청해 주세요.","showDescription":true,'
     || '"showControls":true,"allowFullScreen":true,"allowPlaybackRateChange":false,"allowSeek":false,'
     || '"autoPlay":false,"isLoop":false,"defaultVolume":0.7}',
     'SAMPLE', SYSDATE);

-- 4) SURVEY: 푸터 코드 NULL이어도 SUBMIT, 나중에 보기 표시(문항은 QuestionPort)
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, POPU_CNTN_NM, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, IMG_FILE_PATH_CN, IMG_FILE_NM, VDO_FILE_PATH_CN, VDO_FILE_NM,
     CNTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('SMP-SVY-01', '40', '샘플 SURVEY', '만족도 조사', 640, 560, 'Y',
     NULL, NULL, NULL, NULL, NULL, NULL,
     '{"surveyTitle":"서비스 만족도 조사","description":"문항에 응답해 주세요."}',
     'SAMPLE', SYSDATE);

-- 5) QUIZ: 영상 없는 퀴즈(문항·정답 키는 QuestionPort)
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, POPU_CNTN_NM, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, IMG_FILE_PATH_CN, IMG_FILE_NM, VDO_FILE_PATH_CN, VDO_FILE_NM,
     CNTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('SMP-QIZ-01', '50', '샘플 QUIZ', '보안 퀴즈', 640, 640, 'N',
     '03', NULL, NULL, NULL, NULL, NULL,
     '{"surveyTitle":"보안 퀴즈","description":"정답을 고르세요.","videoEnabled":false}',
     'SAMPLE', SYSDATE);

-- 6) 영상+퀴즈: QUIZ + videoEnabled=true, 영상 컬럼 URL이 content.videoUrl보다 우선(VIDEO와 같은 규칙)
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, POPU_CNTN_NM, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, IMG_FILE_PATH_CN, IMG_FILE_NM, VDO_FILE_PATH_CN, VDO_FILE_NM,
     CNTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('SMP-VQZ-01', '50', '샘플 영상+퀴즈', '영상 + 퀴즈', 760, 860, 'Y',
     '03', NULL, NULL, NULL, 'popup/sample/video', 'training.mp4',
     '{"surveyTitle":"영상 확인 퀴즈","description":"영상을 시청한 뒤 퀴즈에 응답하세요.","videoEnabled":true,'
     || '"videoTitle":"보안 수칙","videoUrl":"https://example.com/training.mp4","showDescription":true,'
     || '"showControls":true,"allowFullScreen":true,"allowPlaybackRateChange":true,"allowSeek":false,'
     || '"autoPlay":false,"isLoop":false,"defaultVolume":0.7}',
     'SAMPLE', SYSDATE);

COMMIT;
