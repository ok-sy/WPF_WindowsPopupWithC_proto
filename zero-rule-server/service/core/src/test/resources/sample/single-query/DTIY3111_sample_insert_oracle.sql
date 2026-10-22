/*
  POL-13-03 : 적용·샘플 구분
  POL-14-03 : 서버 인계 예제
  ■ 단건 조회 샘플용 콘텐츠 INSERT (DTIY3111, Oracle 11g 호환)
  - in : 없음(고정 샘플 6건)
  - out: DTIY3111 콘텐츠 행 6건 — TEXT · IMAGE · VIDEO · SURVEY · QUIZ · 영상+퀴즈(QUIZ + videoEnabled)
  - PopupSingleQuerySampleMapper.selectNextCandidate가 읽는 컬럼만 넣어 유형별 응답 조립을 확인한다.

  사용
  - 확인할 행을 contentId로 지정해 호출한다(정렬이 POPU_CNTN_ID DESC라 지정하지 않으면 SMP-VQUIZ-001이 먼저 잡힌다).
      POST /p/api/sample/wpf/popups/single?contentId=SMP-TEXT-001   (유형만 지정: ?contentTypeCode=20)
  - 다시 넣을 때는 아래 DELETE부터 실행한다. SQL*Plus·SQL Developer 스크립트 실행 기준(SET DEFINE OFF 포함).

  [미확인] 교체 지점
  - DTIY3111 확정 정의 미보유. 이 스크립트는 매퍼가 읽는 컬럼만 넣는다. 등록자·등록일시·사용 여부 등 NOT NULL 컬럼이 더 있으면 추가한다.
  - ATCH_FILE_PATH / ATCH_FILE_NM 컬럼명, 코드값(POPU_CNTN_TP_CD 10~50, FTR_BTN_TP_CD 01~03)은 PopupCodeTable의 예시값이다. 확정 코드표로 함께 바꾼다.
  - POPU_CNTN_ID 형식(문자/숫자 채번)은 실제 규칙으로 바꾼다. 샘플은 'SMP-' 접두사로 정리 대상을 구분한다.

  컬럼 → 응답(상세는 docs/interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md §3)
  - POPU_CNTN_TP_CD → popupType, HDR_TITL → title, POPU_WDTH_SZ/POPU_LNTH_SZ → width/height(IMAGE는 NULL이면 생략)
  - AFTR_CNFM_OBJ_YN → showLater, FTR_BTN_TP_CD/FTR_URL → footerAction/footerLinkUrl(SURVEY·QUIZ는 항상 SUBMIT)
  - ATCH_FILE_PATH + ATCH_FILE_NM → content.imageUrl/videoUrl(IMAGE·VIDEO만, file-base-url 기준). 영상+퀴즈는 content.videoUrl을 쓴다.
  - CNTN_CN(CLOB) → content. 창 옵션(useBackgroundOverlay·backgroundOverlayOpacity·popupPosition·*FontSize)은 최상위로 옮겨진다.
    없는 옵션 키는 서버가 계약 기본값으로 채우므로 필요한 값만 넣는다.

  SURVEY·QUIZ 문항
  - 문항·선택지는 CNTN_CN이 아니라 QuestionPort(별도 문항 테이블 조회)로 붙는다. 기본 UnconnectedQuestionPort 상태에서는
    SMP-SURVEY-001·SMP-QUIZ-001·SMP-VQUIZ-001 조회가 QUESTIONS_NOT_CONNECTED(500)로 끝나는 것이 정상이다.
  - QuestionPort가 돌려줄 questions[] 형태: zero-rule-server/web/api/src/test/resources/sample/relay/survey.json·quiz.json·video-quiz.json.
  - hideDays·completionRatio·passingScore는 현재 컬럼이 없어 서버가 기본값(null, 영상 1.0)으로 보낸다.

  CLOB 리터럴은 4000바이트 이하로 유지한다(넘으면 TO_CLOB('...') || TO_CLOB('...')로 나눈다).
*/
SET DEFINE OFF;

DELETE FROM DTIY3111 WHERE POPU_CNTN_ID LIKE 'SMP-%';

-- 1) TEXT: 서식 본문(textBlocks)·강조 문구·링크 후 닫기, 배경 없음·우측 상단·본문 글자 크기 지정
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, ATCH_FILE_PATH, ATCH_FILE_NM, CNTN_CN)
VALUES
    ('SMP-TEXT-001', '10', '시스템 점검 안내', 560, 420, 'N',
     '02', 'https://intranet.example.com/notice/1', NULL, NULL,
     '{"plainText":"시스템 점검 안내\n02:00~06:00",'
     || '"textBlocks":[{"alignment":"LEFT","indent":0,"runs":[{"text":"시스템 점검 안내","bold":true,"italic":false}]},'
     || '{"alignment":"CENTER","runs":[{"text":"02:00~06:00","color":"#DC2626"}]}],'
     || '"showPlainText":true,"highlightText":"작업 중인 문서를 저장해 주세요.","showHighlight":true,'
     || '"bottomDescription":"자세히 보기","bottomDescriptionUrl":"https://intranet.example.com/notice/1","showBottomDescription":true,'
     || '"useBackgroundOverlay":false,"backgroundOverlayOpacity":0,"popupPosition":"TOP_RIGHT","bodyFontSize":16}');

-- 2) IMAGE: 파일 컬럼으로 imageUrl 생성, 크기 NULL(원본 기준), ADAPTIVE·비율 유지
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, ATCH_FILE_PATH, ATCH_FILE_NM, CNTN_CN)
VALUES
    ('SMP-IMAGE-001', '20', '이미지 공지', NULL, NULL, 'N',
     '01', NULL, 'popup/sample/image', 'notice.png',
     '{"imageTitle":"이미지 안내","description":"이미지 설명","showDescription":true,'
     || '"imageSizeMode":"ADAPTIVE","keepAspectRatio":true}');

-- 3) VIDEO: 파일 컬럼으로 videoUrl 생성, 나중에 보기 표시, 배속·탐색 금지
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, ATCH_FILE_PATH, ATCH_FILE_NM, CNTN_CN)
VALUES
    ('SMP-VIDEO-001', '30', '보안 교육 영상', 760, 560, 'Y',
     '01', NULL, 'popup/sample/video', 'training.mp4',
     '{"videoTitle":"보안 교육","description":"끝까지 시청해 주세요.","showDescription":true,'
     || '"showControls":true,"allowFullScreen":true,"allowPlaybackRateChange":false,"allowSeek":false,'
     || '"autoPlay":false,"isLoop":false,"defaultVolume":0.7}');

-- 4) SURVEY: 푸터 코드 NULL이어도 SUBMIT, 나중에 보기 표시(문항은 QuestionPort)
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, ATCH_FILE_PATH, ATCH_FILE_NM, CNTN_CN)
VALUES
    ('SMP-SURVEY-001', '40', '만족도 조사', 640, 560, 'Y',
     NULL, NULL, NULL, NULL,
     '{"surveyTitle":"서비스 만족도 조사","description":"문항에 응답해 주세요."}');

-- 5) QUIZ: 영상 없는 퀴즈(문항·정답 키는 QuestionPort)
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, ATCH_FILE_PATH, ATCH_FILE_NM, CNTN_CN)
VALUES
    ('SMP-QUIZ-001', '50', '보안 퀴즈', 640, 640, 'N',
     '03', NULL, NULL, NULL,
     '{"surveyTitle":"보안 퀴즈","description":"정답을 고르세요.","videoEnabled":false}');

-- 6) 영상+퀴즈: QUIZ + videoEnabled=true, 영상 URL은 content.videoUrl(파일 컬럼은 IMAGE·VIDEO 유형만 적용)
INSERT INTO DTIY3111
    (POPU_CNTN_ID, POPU_CNTN_TP_CD, HDR_TITL, POPU_WDTH_SZ, POPU_LNTH_SZ, AFTR_CNFM_OBJ_YN,
     FTR_BTN_TP_CD, FTR_URL, ATCH_FILE_PATH, ATCH_FILE_NM, CNTN_CN)
VALUES
    ('SMP-VQUIZ-001', '50', '영상 + 퀴즈', 760, 860, 'Y',
     '03', NULL, NULL, NULL,
     '{"surveyTitle":"영상 확인 퀴즈","description":"영상을 시청한 뒤 퀴즈에 응답하세요.","videoEnabled":true,'
     || '"videoTitle":"보안 수칙","videoUrl":"https://example.com/training.mp4","showDescription":true,'
     || '"showControls":true,"allowFullScreen":true,"allowPlaybackRateChange":true,"allowSeek":false,'
     || '"autoPlay":false,"isLoop":false,"defaultVolume":0.7}');

COMMIT;
