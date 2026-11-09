import type { AdminPopupDetail, PopupOption, PopupQuestion } from '@local/domain';

/*
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드 시작 탭의 PopupAdmin 타입 예시(TODO73-31·32)
 * - 화면에 보여 줄 예시를 실제 타입으로 선언해 웹 타입 검사(tsc)가 예시와 모델(sub/domain/src/model/PopupAdmin.ts)의 차이를 잡게 한다.
 *   모델 필드가 바뀌면 이 파일이 먼저 타입 오류를 낸다. 가이드 화면은 이 값을 코드 문자열로 바꿔 보여 준다.
 * - 새 문항·선택지 ID는 편집기와 같이 음수 임시값이며 저장 시 서버가 정한다.
 */

/** 화면 초기 상태 예시: 입력한 값만 가진다(Partial). */
export const MINIMAL_POPUP_INPUT: Partial<AdminPopupDetail> = {
  popupType: 'TEXT',
  title: '점검 안내',
  content: { plainText: '22:00~23:00 서비스가 중단됩니다.' },
};

/** OX 문항의 선택지: 답안 유형 OX형은 별도 필드 없이 SINGLE_CHOICE + O·X 선택지 두 개로 표현한다. */
export const OX_OPTIONS_EXAMPLE: PopupOption[] = [
  { optionId: -1, value: '1', text: 'O', sortOrder: 1, isCorrect: true },
  { optionId: -2, value: '2', text: 'X', sortOrder: 2, isCorrect: false },
];

/** 퀴즈 문항 예시: OX형 1개 + 선다형 1개. title·text는 일반 문자열이며 서식 블록(titleBlocks·textBlocks)은 생략할 수 있다. */
export const QUIZ_QUESTIONS_EXAMPLE: PopupQuestion[] = [
  {
    questionId: -1, title: '보안 점검은 매월 진행한다.', questionType: 'SINGLE_CHOICE', optionLayout: 'HORIZONTAL',
    isRequired: true, isScored: true, questionScore: 1, sortOrder: 1, options: OX_OPTIONS_EXAMPLE,
  },
  {
    questionId: -2, title: '비밀번호 변경 주기는?', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL',
    isRequired: true, isScored: true, questionScore: 1, sortOrder: 2,
    options: [
      { optionId: -3, value: '1', text: '1개월', sortOrder: 1, isCorrect: false },
      { optionId: -4, value: '2', text: '3개월', sortOrder: 2, isCorrect: true },
    ],
  },
];

/**
 * 퀴즈 팝업 입력 예시: 문항은 content가 아니라 최상위 questions에, 안내 문구는 content.description에 둔다.
 * 퀴즈 유형은 최상위 quizTypeCode(공통코드 0090: '00' 참여형·'01' 만점형·'02' 컷트라인형), 기준 점수는 passingScore다.
 */
export const QUIZ_POPUP_INPUT: Partial<AdminPopupDetail> = {
  popupType: 'QUIZ',
  title: '보안 퀴즈',
  passingScore: 2,
  quizTypeCode: '01',
  questions: QUIZ_QUESTIONS_EXAMPLE,
  content: { description: '두 문항을 모두 맞히면 통과입니다.' },
};

/* 값을 TypeScript 선언 코드로 보여 준다. 키 따옴표만 걷어 내고 값은 JSON 표기 그대로 둔다. */
export const typedExampleCode = (declaration: string, value: unknown): string =>
  `${declaration} = ${JSON.stringify(value, null, 2).replace(/^(\s*)"(\w+)":/gm, '$1$2:')};`;
