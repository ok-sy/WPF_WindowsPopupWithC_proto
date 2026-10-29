/*
  POL-13-03 : 적용·샘플 구분
  POL-14-03 : 서버 인계 예제
  ■ DTIY3117 전체 JSON 조회 샘플용 INSERT (Oracle 11g 호환)
  - in : 없음(고정 샘플 6건)
  - out: DTIY3117 행 6건 — TEXT · IMAGE · VIDEO · SURVEY · QUIZ · 영상+퀴즈(QUIZ + videoEnabled)
  - 컬럼은 DTIY3117 사진 판독(POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)이며 확정 DDL이 아니다. 실제 정의와 철자·길이를 대조한다.
  - 기존 DTIY3111 샘플(sample/single-query/DTIY3111_sample_insert_oracle.sql)은 그대로 둔다.

  사용
  - 확인할 행을 popupId로 지정해 호출한다.
      POST /p/api/sample/wpf/popups/full-json/single?popupId=S17-TXT-01
  - 다시 넣을 때는 아래 DELETE부터 실행한다. DELETE는 이 스크립트의 샘플 ID 6건만 지운다.
  - SQL*Plus·SQL Developer 스크립트 실행 기준(SET DEFINE OFF 포함).

  사진 정의 기준 값
  - POPU_ID VARCHAR2(10): 샘플 ID는 10자(S17-xxx-01).
  - REG_USER_ID VARCHAR2(6)·REG_DTTM DATE는 NOT NULL이라 'SAMPLE'·SYSDATE를 명시한다(비고의 Sysdate가 DEFAULT 제약인지는 미확인).
  - CHNG_USER_ID·CHNG_DTTM은 NULL 허용이라 넣지 않는다.

  POPU_BLTN_CN 저장 형식 = popup 객체 본체
  - {popupType, title, 창·푸터 옵션, content{...}, questions[...]}. 응답 envelope(pollingIntervalSeconds)·deliveryId는 넣지 않는다(서버가 설정).
  - popupId는 넣지 않아도 된다(DB POPU_ID 기준). 넣으면 POPU_ID와 같아야 한다(다르면 500).
  - 없는 옵션은 서버가 3117 기본값(popup-full-json-defaults.yml)으로 채우므로 필요한 값만 넣는다.
  - 문항·정답은 원본 그대로 저장한다. SURVEY 응답에서는 서버가 정답 키를 제거한다.

  CLOB 리터럴은 한 문장 4000바이트 이하로 유지한다(넘으면 TO_CLOB('...') || TO_CLOB('...')로 나누거나 바인딩으로 넣는다).
*/
SET DEFINE OFF;

DELETE FROM DTIY3117
 WHERE POPU_ID IN ('S17-TXT-01', 'S17-IMG-01', 'S17-VDO-01', 'S17-SVY-01', 'S17-QIZ-01', 'S17-VQZ-01');

-- 1) TEXT: 서식 본문·링크 후 닫기, 배경 없음·우측 상단·본문 글자 크기 지정(명시 false 유지 확인)
INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('S17-TXT-01',
     '{"popupType":"TEXT","title":"시스템 점검 안내","width":560,"height":420,'
     || '"footerAction":"LINK_AND_CLOSE","footerLinkUrl":"https://intranet.example.com/notice/1",'
     || '"useBackgroundOverlay":false,"popupPosition":"TOP_RIGHT","bodyFontSize":16,'
     || '"content":{"plainText":"시스템 점검 안내\n02:00~06:00",'
     || '"textBlocks":[{"alignment":"LEFT","indent":0,"runs":[{"text":"시스템 점검 안내","bold":true}]},'
     || '{"alignment":"CENTER","runs":[{"text":"02:00~06:00","color":"#DC2626"}]}]},'
     || '"questions":[]}',
     'SAMPLE', SYSDATE);

-- 2) IMAGE: 크기 미지정(원본 기준) — width/height를 넣지 않는다. showDescription은 3117 기본값 false
INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('S17-IMG-01',
     '{"popupType":"IMAGE","title":"이벤트 안내",'
     || '"content":{"imageTitle":"가을 이벤트","imageUrl":"https://files.example.com/popup/sample/image/event.png",'
     || '"description":"자세한 내용은 게시판을 확인하세요."}}',
     'SAMPLE', SYSDATE);

-- 3) VIDEO: 재생 옵션 생략(3117 기본값: 배속·탐색 불가, 설명 숨김), 완료 비율 0.9 명시
INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('S17-VDO-01',
     '{"popupType":"VIDEO","title":"보안 교육 영상","width":960,"height":640,"completionRatio":0.9,'
     || '"content":{"videoTitle":"정보보호 기본 수칙","videoUrl":"https://files.example.com/popup/sample/video/security.mp4",'
     || '"defaultVolume":0}}',
     'SAMPLE', SYSDATE);

-- 4) SURVEY: 정답 키가 원본에 있어도 응답에서는 제거된다
INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('S17-SVY-01',
     '{"popupType":"SURVEY","title":"만족도 조사","width":640,"height":560,"showLater":true,'
     || '"content":{"surveyTitle":"사내 시스템 만족도","description":"1분이면 끝납니다."},'
     || '"questions":[{"questionId":101,"title":"전반적으로 만족하십니까?","questionType":"SINGLE_CHOICE","isRequired":true,"sortOrder":1,'
     || '"options":[{"optionId":1001,"value":"5","text":"매우 만족","sortOrder":1,"isCorrect":false},'
     || '{"optionId":1002,"value":"3","text":"보통","sortOrder":2},{"optionId":1003,"value":"1","text":"불만족","sortOrder":3}]},'
     || '{"questionId":102,"title":"개선 의견","questionType":"TEXT","isRequired":false,"sortOrder":2,"options":[],'
     || '"correctAnswer":"(관리용)","answerMatchMode":"EXACT"}]}',
     'SAMPLE', SYSDATE);

-- 5) QUIZ: 채점 문항·통과 점수, 정답 키 유지
INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('S17-QIZ-01',
     '{"popupType":"QUIZ","title":"보안 퀴즈","width":640,"height":640,"passingScore":2,'
     || '"content":{"surveyTitle":"보안 상식 퀴즈"},'
     || '"questions":[{"questionId":201,"title":"비밀번호는 주기적으로 변경해야 한다.","questionType":"SINGLE_CHOICE","isRequired":true,'
     || '"isScored":true,"questionScore":1,"sortOrder":1,"optionLayout":"HORIZONTAL",'
     || '"options":[{"optionId":2001,"value":"O","text":"O","isCorrect":true,"sortOrder":1},'
     || '{"optionId":2002,"value":"X","text":"X","isCorrect":false,"sortOrder":2}]},'
     || '{"questionId":202,"title":"보안 담당 부서 이름을 입력하세요.","questionType":"TEXT","isRequired":true,'
     || '"isScored":true,"questionScore":1,"sortOrder":2,"options":[],"correctAnswer":"정보보호팀","answerMatchMode":"EXACT"}]}',
     'SAMPLE', SYSDATE);

-- 6) 영상+퀴즈: videoEnabled=true → VIDEO 기본값 상속, 명시한 allowSeek=true는 유지
INSERT INTO DTIY3117 (POPU_ID, POPU_BLTN_CN, REG_USER_ID, REG_DTTM)
VALUES
    ('S17-VQZ-01',
     '{"popupType":"QUIZ","title":"영상 시청 후 퀴즈","width":1000,"height":720,"passingScore":1,'
     || '"content":{"surveyTitle":"영상 내용 확인","videoEnabled":true,"videoTitle":"개인정보 처리 절차",'
     || '"videoUrl":"https://files.example.com/popup/sample/video/privacy.mp4","allowSeek":true},'
     || '"questions":[{"questionId":301,"title":"개인정보 파기 시 확인할 것은?","questionType":"SINGLE_CHOICE","isRequired":true,'
     || '"isScored":true,"questionScore":1,"sortOrder":1,'
     || '"options":[{"optionId":3001,"value":"A","text":"복구 불가 여부","isCorrect":true,"sortOrder":1},'
     || '{"optionId":3002,"value":"B","text":"파일 이름","isCorrect":false,"sortOrder":2}]}]}',
     'SAMPLE', SYSDATE);

COMMIT;
