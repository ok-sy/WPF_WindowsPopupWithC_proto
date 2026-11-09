/*
 * POL-06-02 : 선택·제출
 * ■ QUIZ 결과 안내 문구(커트라인형·만점형·참여형, PU001 Q3 / 기획서 106·109)
 * - in : QuizResultInput 채점 결과(점수·통과 점수·정답 수·채점 문항 수·만점·전 문항 1점 여부·틀린 문항 번호) · quizName 팝업 제목 · auxCloseVisible 보조 닫기 표시 여부
 * - out: QuizResultNotice { kind, passed, message, buttonText } passed = 채점 합격 여부(참여형은 미달이어도 완료 안내)
 * - WPF `Managers/QuizResultNotice.cs`와 같은 유형 판별·문구다. 미리보기가 WPF 결과 창과 같은 본문을 보여 주도록 맞춘다(창 제목 없음).
 *     참여형   : requiresPassing=false(quizTypeCode '00') → 기준 미달이어도 항상 완료. "퀴즈를 완료하여 {이름}을 종료합니다." + N/M개
 *               requiresPassing이 없으면(기존 데이터) passingScore 0 이하·미설정·채점 문항 없음을 참여형으로 본다.
 *     만점형   : (합격 필요) passingScore ≥ 만점 → 성공 "퀴즈를 모두 맞추셨습니다. {이름}을 종료합니다." / 실패 "문제를 모두 맞춰야 퀴즈를 종료할 수 있습니다. 다시 풀어주세요."
 *     커트라인형: (합격 필요) 그 밖 → 성공 "퀴즈를 통과하여 {이름}을 종료합니다." + N/M개 / 실패 "퀴즈를 통과하지 못하였습니다. 문제를 다시 풀어주세요. (통과 기준: N개 이상)" + N/M개
 *   N/M개 = 정답 채점 문항 수/채점 문항 수. 통과 기준은 모든 채점 문항이 1점이면 개수, 아니면 점수.
 * - 한쪽 문구를 바꾸면 다른 쪽도 같이 바꾼다(WPF PopupWindowTests CheckQuizResultNoticeQ3, 웹 verify-completion-ux-43).
 */

/** SURVEY 제출 완료 안내(WPF PopupManager.SurveyCompletedMessage와 같음). */
export const SURVEY_COMPLETED_MESSAGE = '설문조사가 완료되었습니다.';

export type QuizResultKind = 'CUTOFF' | 'FULL_SCORE' | 'PARTICIPATION';

export interface QuizResultInput {
  passed: boolean;
  passingScore: number | null | undefined;
  correctCount: number;
  scoredCount: number;
  maxScore: number;
  unitScored: boolean;
  incorrectQuestionNumbers: number[];
  /** 합격해야 제출하는지(WPF 조회 응답 requiresPassing). false = 참여형, true = 만점형·컷트라인형, 생략·null = passingScore로 판정. */
  requiresPassing?: boolean | null;
}

export interface QuizResultNotice {
  kind: QuizResultKind;
  passed: boolean;
  message: string;
  buttonText: string;
}

/**
 * 결과 안내 유형을 정한다. requiresPassing=false면 기준 점수와 관계없이 참여형이다.
 * 그 밖에는 passingScore·만점으로 정한다. 0 이하(미설정 포함)·채점 문항 없음은 참여형, 만점 이상은 만점형.
 */
export function classifyQuizResult(passingScore: number | null | undefined, maxScore: number, requiresPassing?: boolean | null): QuizResultKind {
  if (requiresPassing === false) return 'PARTICIPATION';
  const passing = typeof passingScore === 'number' && Number.isFinite(passingScore) ? passingScore : 0;
  if (passing <= 0 || maxScore <= 0) return 'PARTICIPATION';
  return passing >= maxScore ? 'FULL_SCORE' : 'CUTOFF';
}

/** 목적격 조사. 마지막 글자가 한글이면 받침으로 을/를, 그 밖(영문·숫자 등)은 "을(를)". */
export function objectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '을(를)';
  return (code - 0xac00) % 28 === 0 ? '를' : '을';
}

export function buildQuizResultNotice(input: QuizResultInput, quizName: string | null | undefined, auxCloseVisible: boolean): QuizResultNotice {
  const kind = classifyQuizResult(input.passingScore, input.maxScore, input.requiresPassing);
  const name = quizName?.trim() ? quizName.trim() : '퀴즈';
  const ending = `${name}${objectParticle(name)} 종료합니다.`;
  const count = `${input.correctCount}/${input.scoredCount}개`;

  // 참여형은 합격 여부(passed)와 관계없이 완료 안내다. passed는 채점 결과 그대로 돌려준다(통계용).
  if (kind === 'PARTICIPATION')
    return { kind, passed: input.passed, message: `퀴즈를 완료하여 ${ending}\n\n${count}`, buttonText: '확인' };
  if (input.passed) {
    const message = kind === 'FULL_SCORE' ? `퀴즈를 모두 맞추셨습니다.\n${ending}`
        : `퀴즈를 통과하여 ${ending}\n\n${count}`;
    return { kind, passed: true, message, buttonText: '확인' };
  }

  let incorrect = '';
  // [옵션] 틀린 문항 번호(설계 43, 기획서 화면에는 없는 추가 정보). 빼려면 아래 두 줄만 주석 처리한다(WPF QuizResultNotice와 함께).
  if (input.incorrectQuestionNumbers.length > 0)
    incorrect = `\n틀린 문항: ${input.incorrectQuestionNumbers.join(', ')}번`;
  const close = auxCloseVisible ? "\n다시 제출하지 않으려면 하단 '닫기'로 닫을 수 있습니다." : '';
  const passing = typeof input.passingScore === 'number' && Number.isFinite(input.passingScore) ? input.passingScore : 0;
  const criterion = input.unitScored ? `${Math.ceil(passing)}개 이상` : `${Math.round(passing * 100) / 100}점 이상`;
  const message = kind === 'FULL_SCORE'
    ? `문제를 모두 맞춰야 퀴즈를 종료할 수 있습니다.\n다시 풀어주세요.${incorrect + close ? '\n' + incorrect + close : ''}`
    : `퀴즈를 통과하지 못하였습니다.\n문제를 다시 풀어주세요.\n(통과 기준: ${criterion})\n\n${count}${incorrect}${close}`;
  return { kind, passed: false, message, buttonText: '다시 풀기' };
}
