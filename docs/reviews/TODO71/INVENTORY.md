# TODO01~70 원본 매핑표

대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. 최초/최종 날짜는 작성일이 아닌 Git 경로 이력의 최초·최종 author timestamp다. 원문의 작성일/상태는 원문을 보존한다. 누락 6개는 삭제 커밋에서 경로를 복원해 기록했다.

정적 검토 범위: 파일·후속 대체·대표 구현/계약 경계. 전 동작 실행·전 DB 적용 여부를 전수 검증한 표가 아니다. 세부 소스·계약·시간·판정은 [inventory.json](inventory.json)에 있다.

| 번호 | 원본/존재 | 원문 체크 완료/미완료 | 주 정책 / 연관 | 판정·처리 | 후속 근거 |
|---|---|---|---|---|---|
| 01 | [01 현행분석](../../design/01_현행분석.md) | 0/0 | [POL-16](../../policies/POL-16.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 02 | [02 목표아키텍처](../../design/02_목표아키텍처.md) | 0/0 | [POL-09](../../policies/POL-09.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 03 | [03 WPF_API_설계](../../design/03_WPF_API_설계.md) | 0/0 | [POL-09](../../policies/POL-09.md) / — | 후속 대체; 원본 보존 | 12·18·29~35: 최초 목록/일괄 API 대체 |
| 04 | [04 인증설계](../../design/04_인증설계.md) | 0/0 | [POL-15](../../policies/POL-15.md) / POL-09 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 05 | [05 Oracle_DB_설계](../../design/05_Oracle_DB_설계.md) | 0/0 | [POL-13](../../policies/POL-13.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 06 | [06 서버_변경설계](../../design/06_서버_변경설계.md) | 0/0 | [POL-13](../../policies/POL-13.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 07 | [07 WPF_변경설계](../../design/07_WPF_변경설계.md) | 0/0 | [POL-02](../../policies/POL-02.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 08 | `docs/design/08_관리자웹_변경설계.md` (현재 없음) | None/None | [POL-07](../../policies/POL-07.md) / — | 후속 대체; 원본 보존 | e65f88c: 설계09 단계7 흡수; 관리자 기능 유지 |
| 09 | [09 전환계획_및_미결사항](../../design/09_전환계획_및_미결사항.md) | 0/0 | [POL-16](../../policies/POL-16.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 10 | [10 WPF_SSO_토큰_프로토타입_계획](../../design/10_WPF_SSO_토큰_프로토타입_계획.md) | 0/0 | [POL-15](../../policies/POL-15.md) / POL-09 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 11 | [11 WPF_FIXED_화면초과_방어_수정계획](../../design/11_WPF_FIXED_화면초과_방어_수정계획.md) | 0/0 | [POL-02](../../policies/POL-02.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 12 | [12 WPF_결과제출_UX_및_로컬판정_수정계획](../../design/12_WPF_결과제출_UX_및_로컬판정_수정계획.md) | 0/0 | [POL-10](../../policies/POL-10.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 13 | [13 WPF_클라이언트_버전_서버검증_계획](../../design/13_WPF_클라이언트_버전_서버검증_계획.md) | 0/0 | [POL-15](../../policies/POL-15.md) / POL-09, POL-12 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 14 | [14 폐쇄망_반입_및_UI_보완_TODO](../../design/14_폐쇄망_반입_및_UI_보완_TODO.md) | 29/34 | [POL-15](../../policies/POL-15.md) / POL-01, POL-14 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 15 | [15 IMAGE_팝업_크기모드_정리](../../design/15_IMAGE_팝업_크기모드_정리.md) | 0/0 | [POL-04](../../policies/POL-04.md) / — | 후속 대체; 원본 보존 | 23→58: IMAGE 크기 계약 대체 |
| 16 | `docs/design/16_popup_position.md` (현재 없음) | None/None | [POL-02](../../policies/POL-02.md) / — | 후속 대체; 원본 보존 | e65f88c: popupPosition 공통 옵션으로 유지 |
| 17 | [17 WPF_단일_EXE_자동업데이트_TODO](../../design/17_WPF_단일_EXE_자동업데이트_TODO.md) | 0/15 | [POL-15](../../policies/POL-15.md) / — | 폐기; 원본 보존 | 자동 업데이트 폐기; 수동 교체 유지 |
| 18 | [18 팝업_구버전_분기_및_미사용_소스_정리_TODO](../../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md) | 34/5 | [POL-16](../../policies/POL-16.md) / POL-13, POL-15 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 19 | [19 WPF_운영_조회_및_VIDEO_UI_TODO](../../design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md) | 80/12 | [POL-11](../../policies/POL-11.md) / POL-05 | 부분 유지; 원본 보존 | 35: 목록 큐/주기 대체; 영상 UI는 유지 |
| 20 | [20 SURVEY_QUIZ_UI_개선_TODO](../../design/20_SURVEY_QUIZ_UI_개선_TODO.md) | 43/3 | [POL-06](../../policies/POL-06.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 21 | `docs/design/21_DEMO_SURVEY_QUIZ_QA.md` (현재 없음) | None/None | [POL-06](../../policies/POL-06.md) / POL-14 | 후속 대체; 원본 보존 | e65f88c: TODO20 §6 통합; DEMO QA 유지 |
| 22 | [22 WEB_SURVEY_QUIZ_UI](../../design/22_WEB_SURVEY_QUIZ_UI.md) | 17/1 | [POL-08](../../policies/POL-08.md) / POL-06 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 23 | [23 IMAGE_크기모드_단순화_TODO](../../design/23_IMAGE_크기모드_단순화_TODO.md) | 26/1 | [POL-04](../../policies/POL-04.md) / — | 후속 대체; 원본 보존 | 58: 최상위 크기·FIT_TO_IMAGE 영역 기준 대체 |
| 24 | [24 VIDEO_저사양_PC_CPU_개선_TODO](../../design/24_VIDEO_저사양_PC_CPU_개선_TODO.md) | 19/14 | [POL-05](../../policies/POL-05.md) / POL-15 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 25 | [25 WPF_팝업_Header_외곽_UI_개선_TODO](../../design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md) | 30/11 | [POL-02](../../policies/POL-02.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 26 | [26 VIDEO_팝업_HWND_구조_개선_TODO](../../design/26_VIDEO_팝업_HWND_구조_개선_TODO.md) | 0/56 | [POL-02](../../policies/POL-02.md) / — | 폐기; 원본 보존 | Header/Footer 분리안 폐기; 기존 DPI·드래그 보완 유지 |
| 27 | [27 VIDEO_SEEK_ON_OFF_TODO](../../design/27_VIDEO_SEEK_ON_OFF_TODO.md) | 20/0 | [POL-05](../../policies/POL-05.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 28 | [28 TEXT_FONT_EDITING_TODO](../../design/28_TEXT_FONT_EDITING_TODO.md) | 39/16 | [POL-03](../../policies/POL-03.md) / — | 부분 유지; 원본 보존 | 37 본문 통합·48 표시 방어·49/62/63/66 편집 확장 |
| 29 | [29 WPF_목록_API_응답_계약_정리_TODO](../../design/29_WPF_목록_API_응답_계약_정리_TODO.md) | 17/1 | [POL-09](../../policies/POL-09.md) / POL-11 | 부분 유지; 원본 보존 | 35: ROOT userId/serverTime/popups[] 제거; 노출 판단 서버 소유 유지 |
| 30 | [30 Footer_Action_최상위_계약_TODO](../../design/30_Footer_Action_최상위_계약_TODO.md) | 25/1 | [POL-01](../../policies/POL-01.md) / POL-02, POL-09 | 부분 유지; 원본 보존 | 35: popups[]→popup; 푸터 역할 유지 |
| 31 | [31 PopupWindow_공통_UI_옵션_최상위_계약_TODO](../../design/31_PopupWindow_공통_UI_옵션_최상위_계약_TODO.md) | 21/2 | [POL-01](../../policies/POL-01.md) / POL-09 | 부분 유지; 원본 보존 | 35 단건화·57 폐기 옵션·68 최소 크기 후속 반영 |
| 32 | [32 RESULT_responseStartedAt_제거_TODO](../../design/32_RESULT_responseStartedAt_제거_TODO.md) | 9/0 | [POL-09](../../policies/POL-09.md) / POL-13 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 33 | [33 RESULT_응답_score판정값_제거_TODO](../../design/33_RESULT_응답_score판정값_제거_TODO.md) | 11/0 | [POL-10](../../policies/POL-10.md) / POL-09 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 34 | [34 RESULT_계약_및_공통옵션_정합성_보완_TODO](../../design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md) | 45/2 | [POL-09](../../policies/POL-09.md) / POL-01, POL-12 | 부분 유지; 원본 보존 | 35 단건 결과; 복구 최종값은45 보류 |
| 35 | [35 WPF_단건_팝업_조회_결과_API_흐름_TODO](../../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md) | 20/6 | [POL-10](../../policies/POL-10.md) / POL-09, POL-11, POL-12, POL-13 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 36 | [36 TEXT_서식변환_타입검사_중복검토_TODO](../../design/36_TEXT_서식변환_타입검사_중복검토_TODO.md) | 8/0 | [POL-03](../../policies/POL-03.md) / — | 후속 대체; 원본 보존 | 48: 중복 정책 검사 유지 결론 대체 |
| 37 | [37 TEXT_EDITOR_BODY_통합검토_TODO](../../design/37_TEXT_EDITOR_BODY_통합검토_TODO.md) | 8/0 | [POL-03](../../policies/POL-03.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 38 | [38 WPF_TEXT_기울임_우측잘림_TODO](../../design/38_WPF_TEXT_기울임_우측잘림_TODO.md) | 4/1 | [POL-03](../../policies/POL-03.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 39 | [39 단건_API_복구_동시성_TEXT_정합성_보완_TODO](../../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md) | 21/1 | [POL-12](../../policies/POL-12.md) / POL-10, POL-16 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 40 | `docs/design/40_나중에보기_1시간_연기_TODO.md` (현재 없음) | None/None | [POL-11](../../policies/POL-11.md) / — | 판정 보류; 원본 보존 | b2626d7: 고정 1시간안; 확정 LATER는 TODO52-2 |
| 41 | `docs/design/41_나중에보기_횟수제한_안내_TODO.md` (현재 없음) | None/None | [POL-11](../../policies/POL-11.md) / — | 판정 보류; 원본 보존 | b2626d7: 횟수 제한 미확정; LATER에 자동 적용 금지 |
| 42 | `docs/design/42_상시팝업_응답률대상로그_분리검토_TODO.md` (현재 없음) | None/None | [POL-11](../../policies/POL-11.md) / — | 판정 보류; 원본 보존 | b2626d7: 상시 재노출안; 게시 반복 일정과 별개 |
| 43 | [43 완료조건_버튼활성화_UX_TODO](../../design/43_완료조건_버튼활성화_UX_TODO.md) | 6/0 | [POL-06](../../policies/POL-06.md) / POL-05 | 부분 유지; 원본 보존 | 57: allowCloseBeforeComplete 폐기; 완료 조건 UX 유지 |
| 44 | [44 BackgroundOverlay_키보드종료_동작검토_TODO](../../design/44_BackgroundOverlay_키보드종료_동작검토_TODO.md) | 4/2 | [POL-02](../../policies/POL-02.md) / — | 부분 유지; 원본 보존 | 57: 외부 닫기 Overlay 책임 확정 |
| 45 | [45 단건_RESULT_재전송오류_정책검증_TODO](../../design/45_단건_RESULT_재전송오류_정책검증_TODO.md) | 3/4 | [POL-12](../../policies/POL-12.md) / POL-10 | 부분 유지 / 판정 보류; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 46 | [46 API_WPF_관리자웹_계약통합검증_TODO](../../design/46_API_WPF_관리자웹_계약통합검증_TODO.md) | 7/1 | [POL-16](../../policies/POL-16.md) / POL-09 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 47 | [47 팝업유효성_게시중단_전달상태_정책검증_TODO](../../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md) | 5/3 | [POL-10](../../policies/POL-10.md) / POL-11, POL-12, POL-13 | 부분 유지 / 판정 보류; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 48 | [48 TEXT_서버정책_CSharp_표시방어_분리_TODO](../../design/48_TEXT_서버정책_CSharp_표시방어_분리_TODO.md) | 7/0 | [POL-03](../../policies/POL-03.md) / POL-16 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 49 | [49 TEXT_들여쓰기_우클릭팔레트_TODO](../../design/49_TEXT_들여쓰기_우클릭팔레트_TODO.md) | 19/2 | [POL-03](../../policies/POL-03.md) / POL-16 | 부분 유지; 원본 보존 | 62 서식 확장·63 5단계 해제·66 초기화 삭제 |
| 50 | [50 구조정합성_전수점검_정리_TODO](../../design/50_구조정합성_전수점검_정리_TODO.md) | 17/0 | [POL-16](../../policies/POL-16.md) / — | 부분 유지; 원본 보존 | 53-16에서 D3/D4 수정; D5는 미결 |
| 51 | [51 DEMO_API_수동호출_팝업검증_TODO](../../design/51_DEMO_API_수동호출_팝업검증_TODO.md) | 9/1 | [POL-14](../../policies/POL-14.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 52 | [52 회의확정요건_게시반복_나중에보기_공통동작_TODO](../../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md) | 4/4 | [POL-11](../../policies/POL-11.md) / POL-02, POL-06, POL-07, POL-10, POL-13 | 부분 유지 / 미구현·계약 대기 혼재; 원본 보존 | 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기 |
| 53 | [53 프로젝트검증_후속구현_문서정합_통합검증_TODO](../../design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md) | 7/11 | [POL-16](../../policies/POL-16.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 54 | [54 Demo_UI_UX_상세옵션_정리_TODO](../../design/54_Demo_UI_UX_상세옵션_정리_TODO.md) | 10/1 | [POL-14](../../policies/POL-14.md) / — | 유지 / 문서 상태 충돌; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 55 | [55 SURVEY_QUIZ_FONT_EDIT_확장_TODO](../../design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md) | 9/1 | [POL-06](../../policies/POL-06.md) / POL-13 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 56 | [56 SURVEY_QUIZ_선택상태_응답안내_UX_TODO](../../design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md) | 0/60 | [POL-06](../../policies/POL-06.md) / — | 유지 / 문서 상태 충돌; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 57 | [57 완료전닫기옵션_폐기_역할분리_TODO](../../design/57_완료전닫기옵션_폐기_역할분리_TODO.md) | 32/4 | [POL-02](../../policies/POL-02.md) / POL-01, POL-05 | 부분 유지 / 문서 상태 충돌; 원본 보존 | 기존 옵션 폐기 구현; 완료/Overlay/LATER 분리 |
| 58 | [58 IMAGE_공통크기필드_모드별기준_TODO](../../design/58_IMAGE_공통크기필드_모드별기준_TODO.md) | 30/6 | [POL-04](../../policies/POL-04.md) / — | 부분 유지 / 문서 상태 충돌; 원본 보존 | 68: 최소 300 추가; 모드별 크기 의미 유지 |
| 59 | [59 VIDEO_QUIZ_중간안내제거_TODO](../../design/59_VIDEO_QUIZ_중간안내제거_TODO.md) | 6/1 | [POL-05](../../policies/POL-05.md) / — | 유지 / 문서 상태 충돌; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 60 | [60 VIDEO_QUIZ_원본비율_영역할당_TODO](../../design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md) | 10/2 | [POL-05](../../policies/POL-05.md) / POL-08 | 유지 / 문서 상태 충돌; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 61 | [61 관리자_미리보기_컴포넌트화_TODO](../../design/61_관리자_미리보기_컴포넌트화_TODO.md) | 11/0 | [POL-08](../../policies/POL-08.md) / POL-14 | 부분 유지; 원본 보존 | 69: 공통 폴더 이동; 두 미리보기 API 유지 |
| 62 | [62 취소선_문단서식_편집메뉴_TODO](../../design/62_취소선_문단서식_편집메뉴_TODO.md) | 5/5 | [POL-03](../../policies/POL-03.md) / — | 부분 유지; 원본 보존 | 63 횟수 제한 제거·66 초기화 삭제; 서식 기능 유지 |
| 63 | [63 문단들여쓰기_5회제한해제_TODO](../../design/63_문단들여쓰기_5회제한해제_TODO.md) | 12/1 | [POL-03](../../policies/POL-03.md) / — | 부분 유지; 원본 보존 | 66: 초기화 방어 주석/설정은 후속 삭제 |
| 64 | [64 팝업데이터변환_함수분리_이식가이드_TODO](../../design/64_팝업데이터변환_함수분리_이식가이드_TODO.md) | 13/0 | [POL-07](../../policies/POL-07.md) / POL-14 | 부분 유지; 원본 보존 | 69: 공통 폴더 이동; 변환 역할 유지 |
| 65 | [65 단건조회_공통매핑_CLOB파싱_샘플API_TODO](../../design/65_단건조회_공통매핑_CLOB파싱_샘플API_TODO.md) | 13/1 | [POL-13](../../policies/POL-13.md) / POL-14 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 66 | [66 서식초기화_버튼삭제_TODO](../../design/66_서식초기화_버튼삭제_TODO.md) | 10/0 | [POL-03](../../policies/POL-03.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 67 | [67 MUIdeprecated속성_미리보기호환검증_TODO](../../design/67_MUIdeprecated속성_미리보기호환검증_TODO.md) | 13/1 | [POL-08](../../policies/POL-08.md) / POL-16 | 부분 유지; 원본 보존 | 69: 공통 폴더 이동; slotProps 전환 유지 |
| 68 | [68 팝업최소크기_300x300_공통화_TODO](../../design/68_팝업최소크기_300x300_공통화_TODO.md) | 8/3 | [POL-01](../../policies/POL-01.md) / POL-04, POL-08 | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 69 | [69 PopupcommonComponent_공통화_샘플페이지_TODO](../../design/69_PopupcommonComponent_공통화_샘플페이지_TODO.md) | 16/1 | [POL-14](../../policies/POL-14.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |
| 70 | [70 DB없는_백엔드통신_Java조회API_TODO](../../design/70_DB없는_백엔드통신_Java조회API_TODO.md) | 12/1 | [POL-14](../../policies/POL-14.md) / — | 유지; 원본 보존 | 대체 근거 없음; 원본 유지 |

## 번호 없는 설계 문서

- [기준0.1.txt](../../design/기준0.1.txt): 초기 참고 기준. 현행 계약을 대체하지 않으며 POL-16 관리.

## 조사·판정 방식

- 주 정책은 문서의 주 책임 기준이다. 관련 정책은 중복 참조하며 원본을 여러 개 복제하지 않는다.
- 체크 개수는 원문 그대로 집계했다. 구현/검증 완료 판정과 같지 않다(TODO56처럼 본문 상태와 체크가 다른 경우 포함).
- 세부 요건은 [requirements.csv](requirements.csv)에서 각 제목·체크 항목으로 분해한다. 문서의 주/연관 정책을 상속한 탐색 색인이며 각 행을 독립적인 최종 정책으로 확정한 표가 아니다.
- 실제 소스 경로 변경은 TODO69 공통 폴더 이동을 반영했다. 과거 소스 줄 번호는 재사용하지 않는다.
- 역사적 문서의 잘못된 상대 링크를 일괄 바꾸지 않는다. 새 정책은 현재 경로로 연결하며 기존 오류는 링크 보고서에 남긴다.
