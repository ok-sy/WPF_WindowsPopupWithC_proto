import type { AdminPopupDetail } from '@local/domain';
import { useEffect, useState } from 'react';
import { QUIZ_RULE_TO_TYPE_CODE, quizRuleOfCode } from './popupQuestionCodes';

/** 퀴즈 통과 유형. '' = 아직 선택하지 않음. */
export type QuizRule = '' | 'FULL' | 'CUTOFF' | 'PARTICIPATION';

/** 퀴즈유형별 기준 개수 안내. 표시 이름은 공통코드 0090에서 받는다(popupQuestionCodes). */
export const QUIZ_RULES: { value: Exclude<QuizRule, ''>; suffix?: string }[] = [
  // 참여형: 기준 개수는 통계용 합격 기준이다. 정답 개수와 관계없이 제출하면 완료되고 passed(합격 여부)만 score >= N으로 기록한다.
  { value: 'PARTICIPATION', suffix: '개 이상 합격' },
  { value: 'FULL' },
  { value: 'CUTOFF', suffix: '개 이상 합격' },
];

/**
 * [호환] 퀴즈 유형 코드(quizTypeCode)가 없던 기존 데이터의 참여형 통과 점수. 0점 저장 = 참여형으로 복원할 때만 쓴다.
 * 2026-11-09부터 참여형도 기준 개수(1~문항 수)를 저장하므로 새로 저장하는 값으로는 쓰지 않는다.
 */
export const PARTICIPATION_PASSING_SCORE = 0;

/** [확정] 퀴즈 문항 배점. 모든 문항 1점이라 총점 = 문항 수다. */
export const QUIZ_QUESTION_SCORE = 1;

/** 퀴즈 규칙이 읽는 값. 등록 화면(AdminPopupDetail)과 미설정 기준 샘플 state(passingScore·quizTypeCode 생략 가능)를 함께 받는다. */
export type QuizRuleTarget = Pick<AdminPopupDetail, 'popupType' | 'questions'> & { passingScore?: number | null; quizTypeCode?: string | null };

/**
 * POL-06-02 : 선택·제출
 * ■ 합격 필요 여부(requiresPassing)
 * - in : popup(QuizRuleTarget) 편집값·미리보기 popup
 * - out: boolean | null true = 합격해야 제출(만점형·컷트라인형), false = 제출하면 완료(참여형), null = 퀴즈 유형 코드 없음(점수 기준 판정)
 * - WPF 조회 응답의 requiresPassing(서버가 quizTypeCode에서 파생)과 같은 값을 미리보기가 직접 계산한다. QUIZ가 아니면 null.
 */
export function quizRequiresPassing(popup: Pick<QuizRuleTarget, 'popupType' | 'quizTypeCode'>): boolean | null {
  const rule = popup.popupType === 'QUIZ' ? quizRuleOfCode(popup.quizTypeCode) : undefined;
  return rule ? rule !== 'PARTICIPATION' : null;
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈유형 복원
 * - in : popup(AdminPopupDetail) 불러온 편집값
 * - out: { rule: QuizRule, count: number } 퀴즈유형과 기준 개수
 * - 퀴즈 유형 코드(quizTypeCode, 공통코드 0090)가 있으면 그 유형으로 복원한다. 참여형·컷트라인형 기준 개수는 저장된 passingScore(1 미만·미설정이면 1).
 *   (코드가 있으면 만점 기준 컷트라인(N = 문항 수)도 컷트라인형으로 남는다.)
 * - [호환] 코드가 없는 기존 데이터는 통과 점수로 추정한다. 0이면 참여형, 문항 수 이상이면 만점형, 그 밖에는 컷트라인 N개.
 *   기존 참여형(0점)은 기준 개수 1로 보이며 다시 저장하면 passingScore 1·quizTypeCode '00'이 된다.
 */
export function readQuizRule(popup: QuizRuleTarget): { rule: QuizRule; count: number } {
  const total = popup.questions.length;
  const score = popup.passingScore;
  if (popup.popupType !== 'QUIZ') return { rule: '', count: 1 };
  const countOf = (value: number | null | undefined) => (typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.round(value) : 1);
  const coded = quizRuleOfCode(popup.quizTypeCode);
  if (coded) return { rule: coded, count: coded === 'FULL' ? Math.max(1, total) : countOf(score) };
  if (score == null) return { rule: '', count: 1 };
  if (score === PARTICIPATION_PASSING_SCORE) return { rule: 'PARTICIPATION', count: 1 };
  return score >= total && total > 0 ? { rule: 'FULL', count: total } : { rule: 'CUTOFF', count: countOf(score) };
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 점수 규칙 적용
 * - in : popup(AdminPopupDetail) 편집값 · rule(QuizRule) 퀴즈유형 · count(number) 기준 개수
 * - out: AdminPopupDetail 규칙을 적용한 새 객체(입력 객체는 바꾸지 않음). QUIZ가 아니면 입력 그대로
 * - 편집값을 받아 모든 문항을 1점·채점 대상으로 맞추고 통과 점수(만점형 = 문항 수, 참여형·컷트라인형 = N(문항 수 이하))와
 *   퀴즈 유형 코드(quizTypeCode: 참여형 '00', 만점형 '01', 컷트라인형 '02', 미선택 null)를 넣는다.
 *   미리보기와 저장 요청에 이 결과를 보낸다. 컷트라인형·만점형 미달이면 WPF가 제출하지 않고 다시 풀게 하고, 참여형은 미달이어도 제출·완료한다.
 */
export function withQuizRule<T extends QuizRuleTarget>(popup: T, rule: QuizRule, count: number): T {
  if (popup.popupType !== 'QUIZ') return popup;
  const questions = popup.questions.map((question) => ({ ...question, isScored: true, questionScore: QUIZ_QUESTION_SCORE }));
  const passingScore = rule === 'FULL' ? questions.length : rule ? Math.min(count, questions.length) : null;
  const quizTypeCode = rule ? QUIZ_RULE_TO_TYPE_CODE[rule] : null;
  return { ...popup, questions, passingScore, quizTypeCode };
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 규칙 저장 전 검사
 * - in : popup(AdminPopupDetail) · rule(QuizRule) · count(number)
 * - out: string | null 오류 문구(없으면 null)
 * - 퀴즈유형 선택 여부와 기준 개수(1~문항 수 정수)를 검사한다. 기준 개수는 참여형(통계용 합격 기준)·컷트라인형이 쓰고 만점형은 쓰지 않는다.
 *   QUIZ가 아니면 항상 null.
 */
export function validateQuizRule(popup: QuizRuleTarget, rule: QuizRule, count: number): string | null {
  if (popup.popupType !== 'QUIZ') return null;
  if (!rule) return '퀴즈유형을 선택해 주세요.';
  if (rule === 'CUTOFF' || rule === 'PARTICIPATION') {
    if (!Number.isInteger(count) || count < 1) return '통과 기준은 1개 이상의 정수로 입력해 주세요.';
    if (count > popup.questions.length) return rule === 'CUTOFF'
      ? '커트라인 점수보다 문항 수가 적습니다. 커트라인 점수를 확인해 주세요.'
      : '합격 기준 개수보다 문항 수가 적습니다. 합격 기준 개수를 확인해 주세요.';
  }
  return null;
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 규칙 상태 hook
 * - in : popup(AdminPopupDetail) 편집값 · resetKey(number) 편집값을 새로 채울 때 바꾸는 값(신규·불러오기·템플릿 적용)
 * - out: { rule, count, setRule, setCount, effective, error } effective = 규칙을 적용한 편집값(passingScore·quizTypeCode 포함), error = 검사 결과
 * - 편집값을 받아 퀴즈유형·기준 개수를 화면 상태로 관리한다. resetKey가 바뀌면 그때의 편집값에서 유형을 다시 읽는다.
 */
export function usePopupQuizRule<T extends QuizRuleTarget>(popup: T | null, resetKey: number) {
  const [rule, setRule] = useState<QuizRule>('');
  const [count, setCount] = useState(1);
  useEffect(() => {
    if (!popup) { setRule(''); setCount(1); return; }
    const restored = readQuizRule(popup);
    setRule(restored.rule); setCount(restored.count);
    // 편집 중 문항이 바뀔 때마다 다시 읽으면 사용자가 고른 유형이 덮이므로 resetKey가 바뀔 때만 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  const effective = popup ? withQuizRule(popup, rule, count) : null;
  const error = popup ? validateQuizRule(popup, rule, count) : null;
  return { rule, count, setRule, setCount, effective, error };
}
