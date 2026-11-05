import type { QuizRule } from './popupQuizRule';

/*
 * POL-06-02 : 선택·제출
 * ■ 답안 유형·퀴즈 유형 공통코드
 * - 답안 유형은 코드 그룹 0089, 퀴즈 유형은 코드 그룹 0090이다(CLOVER_CODE_TYPE·CLOVER_CODE).
 * - 표시 이름은 코드 조회 결과를 쓴다. 코드값은 저장하지 않고 기존 계약(questionType·options·passingScore)으로 변환한다.
 * - 이 폴더는 관리자 API를 참조하지 않으므로 조회 함수는 부모가 넘긴다(loadPopupQuestionCodes).
 */
export const ANSWER_TYPE_CODE_TYPE = '0089';
export const QUIZ_TYPE_CODE_TYPE = '0090';

/** 공통코드 1건 중 화면에 필요한 값 */
export interface PopupCodeOption {
  code: string;
  codeNm: string;
}

/** 답안 유형 코드값. 01 = OX형, 02 = 선다형. */
export const ANSWER_TYPE_OX = '01';
export const ANSWER_TYPE_CHOICE = '02';

/** 퀴즈 유형 코드값 → 내부 규칙. 00 = 참여형, 01 = 만점형, 02 = 컷트라인형. */
export const QUIZ_TYPE_CODE_TO_RULE: Record<string, Exclude<QuizRule, ''>> = {
  '00': 'PARTICIPATION',
  '01': 'FULL',
  '02': 'CUTOFF',
};

/* [실연동] 서버 없는 샘플·가이드 전용 목록이다. 실제 화면은 loadPopupQuestionCodes 결과를 prop으로 넘긴다. */
export const SAMPLE_ANSWER_TYPE_OPTIONS: PopupCodeOption[] = [
  { code: ANSWER_TYPE_OX, codeNm: 'OX형' },
  { code: ANSWER_TYPE_CHOICE, codeNm: '선다형' },
];
export const SAMPLE_QUIZ_TYPE_OPTIONS: PopupCodeOption[] = [
  { code: '00', codeNm: '참여형' },
  { code: '01', codeNm: '만점형' },
  { code: '02', codeNm: '컷트라인형' },
];

/**
 * POL-06-01 : 문항·서식
 * ■ OX 문항 판별
 * - 단일 선택 문항의 선택지가 O·X 두 개이면 OX 문항이다. 답안 유형은 저장하지 않으므로 다시 열 때도 이 기준으로 복원한다.
 * - 편집기·미리보기·WPF(SurveyPopupView.IsOxQuestion)가 같은 기준을 쓴다.
 */
export const isOxQuestion = (question: { questionType: string; options: { text: string }[] }): boolean =>
  question.questionType === 'SINGLE_CHOICE' && question.options.length === 2
  && question.options[0].text === 'O' && question.options[1].text === 'X';

/** 코드 조회 함수 형태. `api.clCode.search`를 그대로 넘길 수 있다. */
export type PopupCodeSearch = (params: { codeType: string; rowsPerPage: number; pageNumber: number }) => Promise<{
  body: { pagerData: { elements: PopupCodeOption[] } };
}>;

export interface PopupQuestionCodes {
  answerTypes: PopupCodeOption[];
  quizTypes: PopupCodeOption[];
}

/**
 * POL-06-02 : 선택·제출
 * ■ 답안 유형·퀴즈 유형 코드 조회
 * - in : search(PopupCodeSearch) 코드 조회 함수
 * - out: PopupQuestionCodes 조회 순서를 유지한 코드 목록. 매핑이 없는 코드값은 뺀다. 조회에 실패한 그룹은 빈 배열이다.
 */
export async function loadPopupQuestionCodes(search: PopupCodeSearch): Promise<PopupQuestionCodes> {
  const load = async (codeType: string, known: (code: string) => boolean) => {
    try {
      const { body } = await search({ codeType, rowsPerPage: 9999, pageNumber: 0 });
      return body.pagerData.elements.filter((item) => known(item.code));
    } catch {
      return [];
    }
  };
  const [answerTypes, quizTypes] = await Promise.all([
    load(ANSWER_TYPE_CODE_TYPE, (code) => code === ANSWER_TYPE_OX || code === ANSWER_TYPE_CHOICE),
    load(QUIZ_TYPE_CODE_TYPE, (code) => code in QUIZ_TYPE_CODE_TO_RULE),
  ]);
  return { answerTypes, quizTypes };
}
