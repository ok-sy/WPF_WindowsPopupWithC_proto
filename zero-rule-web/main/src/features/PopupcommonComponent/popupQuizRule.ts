import type { AdminPopupDetail } from '@local/domain';
import { useEffect, useState } from 'react';

/** 퀴즈 통과 유형. '' = 아직 선택하지 않음. */
export type QuizRule = '' | 'FULL' | 'CUTOFF' | 'PARTICIPATION';

/** 퀴즈유형별 기준 개수 안내. 표시 이름은 공통코드 0090에서 받는다(popupQuestionCodes). */
export const QUIZ_RULES: { value: Exclude<QuizRule, ''>; suffix?: string }[] = [
  // 참여형: 정답 개수와 관계없이 통과. 통과 점수 0이라 WPF 채점이 항상 passed=true로 판정한다.
  { value: 'PARTICIPATION' },
  { value: 'FULL' },
  { value: 'CUTOFF', suffix: '개 이상 합격' },
];

/** [확정] 참여형의 통과 점수. 0점이라 WPF 로컬 채점이 항상 통과(passed=true)로 판정하고 실제 점수는 그대로 보낸다. */
export const PARTICIPATION_PASSING_SCORE = 0;

/** [확정] 퀴즈 문항 배점. 모든 문항 1점이라 총점 = 문항 수다. */
export const QUIZ_QUESTION_SCORE = 1;

/** 퀴즈 규칙이 읽는 값. 등록 화면(AdminPopupDetail)과 미설정 기준 샘플 state(passingScore 생략 가능)를 함께 받는다. */
export type QuizRuleTarget = Pick<AdminPopupDetail, 'popupType' | 'questions'> & { passingScore?: number | null };

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈유형 복원
 * - in : popup(AdminPopupDetail) 불러온 편집값
 * - out: { rule: QuizRule, count: number } 퀴즈유형과 통과 기준 개수
 * - 저장된 통과 점수를 받아 퀴즈유형을 되살린다. 0이면 참여형, 문항 수 이상이면 만점 통과, 그 밖에는 커트라인 N개로 본다.
 *   (0을 커트라인 1개로 읽으면 다시 저장할 때 1로 바뀌므로 참여형으로 복원한다.)
 *   (커트라인과 과거 통과·실패 제출은 저장 값이 같아 구분되지 않는다.)
 */
export function readQuizRule(popup: QuizRuleTarget): { rule: QuizRule; count: number } {
  const total = popup.questions.length;
  const score = popup.passingScore;
  if (popup.popupType !== 'QUIZ' || score == null) return { rule: '', count: 1 };
  if (score === PARTICIPATION_PASSING_SCORE) return { rule: 'PARTICIPATION', count: 1 };
  return score >= total && total > 0 ? { rule: 'FULL', count: total } : { rule: 'CUTOFF', count: Math.max(1, Math.round(score)) };
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 점수 규칙 적용
 * - in : popup(AdminPopupDetail) 편집값 · rule(QuizRule) 퀴즈유형 · count(number) 통과 기준 개수
 * - out: AdminPopupDetail 규칙을 적용한 새 객체(입력 객체는 바꾸지 않음). QUIZ가 아니면 입력 그대로
 * - 편집값을 받아 모든 문항을 1점·채점 대상으로 맞추고 통과 점수(만점 = 문항 수, 커트라인·통과/실패 = N, 참여형 = 0)를 넣는다.
 *   미리보기와 저장 요청에 이 결과를 보낸다. 미달(실패)이면 WPF가 제출하지 않고 다시 채점하게 하므로 별도 값은 없다.
 */
export function withQuizRule<T extends QuizRuleTarget>(popup: T, rule: QuizRule, count: number): T {
  if (popup.popupType !== 'QUIZ') return popup;
  const questions = popup.questions.map((question) => ({ ...question, isScored: true, questionScore: QUIZ_QUESTION_SCORE }));
  const passingScore = rule === 'FULL' ? questions.length
    : rule === 'PARTICIPATION' ? PARTICIPATION_PASSING_SCORE
    : rule ? Math.min(count, questions.length) : null;
  return { ...popup, questions, passingScore };
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 규칙 저장 전 검사
 * - in : popup(AdminPopupDetail) · rule(QuizRule) · count(number)
 * - out: string | null 오류 문구(없으면 null)
 * - 퀴즈유형 선택 여부와 통과 기준 개수(1~문항 수 정수)를 검사한다. 만점 통과·참여형은 기준 개수를 쓰지 않는다. QUIZ가 아니면 항상 null.
 */
export function validateQuizRule(popup: QuizRuleTarget, rule: QuizRule, count: number): string | null {
  if (popup.popupType !== 'QUIZ') return null;
  if (!rule) return '퀴즈유형을 선택해 주세요.';
  if (rule === 'CUTOFF') {
    if (!Number.isInteger(count) || count < 1) return '통과 기준은 1개 이상의 정수로 입력해 주세요.';
    if (count > popup.questions.length) return '커트라인 점수보다 문항 수가 적습니다. 커트라인 점수를 확인해 주세요.';
  }
  return null;
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 규칙 상태 hook
 * - in : popup(AdminPopupDetail) 편집값 · resetKey(number) 편집값을 새로 채울 때 바꾸는 값(신규·불러오기·템플릿 적용)
 * - out: { rule, count, setRule, setCount, effective, error } effective = 규칙을 적용한 편집값, error = 검사 결과
 * - 편집값을 받아 퀴즈유형·통과 기준 개수를 화면 상태로 관리한다. resetKey가 바뀌면 그때의 편집값에서 유형을 다시 읽는다.
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
