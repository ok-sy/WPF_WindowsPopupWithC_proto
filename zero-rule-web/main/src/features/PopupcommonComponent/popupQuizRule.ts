import type { AdminPopupDetail } from '@local/domain';
import { useEffect, useState } from 'react';

/** 퀴즈 통과 유형. '' = 아직 선택하지 않음. */
export type QuizRule = '' | 'FULL' | 'CUTOFF' | 'PASS_FAIL';

/** [옵션] 퀴즈유형 선택지. 순서가 화면 순서다. */
export const QUIZ_RULES: { value: Exclude<QuizRule, ''>; label: string; suffix?: string }[] = [
  { value: 'FULL', label: '만점 통과' },
  { value: 'CUTOFF', label: '커트라인 통과', suffix: '개 이상 통과' },
  { value: 'PASS_FAIL', label: '통과/실패 제출', suffix: '개 이상 통과 / 미만 실패' },
];

/** [확정] 퀴즈 문항 배점. 모든 문항 1점이라 총점 = 문항 수다. */
export const QUIZ_QUESTION_SCORE = 1;

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈유형 복원
 * - in : popup(AdminPopupDetail) 불러온 편집값
 * - out: { rule: QuizRule, count: number } 퀴즈유형과 통과 기준 개수
 * - 저장된 통과 점수를 받아 퀴즈유형을 되살린다. 통과 점수가 문항 수 이상이면 만점 통과, 그 밖에는 커트라인 N개로 본다.
 *   (만점/커트라인/통과·실패는 저장 값이 passingScore 하나라 커트라인과 통과·실패 제출은 구분되지 않는다.)
 */
export function readQuizRule(popup: AdminPopupDetail): { rule: QuizRule; count: number } {
  const total = popup.questions.length;
  const score = popup.passingScore;
  if (popup.popupType !== 'QUIZ' || score == null) return { rule: '', count: 1 };
  return score >= total && total > 0 ? { rule: 'FULL', count: total } : { rule: 'CUTOFF', count: Math.max(1, Math.round(score)) };
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 점수 규칙 적용
 * - in : popup(AdminPopupDetail) 편집값 · rule(QuizRule) 퀴즈유형 · count(number) 통과 기준 개수
 * - out: AdminPopupDetail 규칙을 적용한 새 객체(입력 객체는 바꾸지 않음). QUIZ가 아니면 입력 그대로
 * - 편집값을 받아 모든 문항을 1점·채점 대상으로 맞추고 통과 점수(만점 = 문항 수, 커트라인·통과/실패 = N)를 넣는다.
 *   미리보기와 저장 요청에 이 결과를 보낸다. 미달(실패)이면 WPF가 제출하지 않고 다시 채점하게 하므로 별도 값은 없다.
 */
export function withQuizRule(popup: AdminPopupDetail, rule: QuizRule, count: number): AdminPopupDetail {
  if (popup.popupType !== 'QUIZ') return popup;
  const questions = popup.questions.map((question) => ({ ...question, isScored: true, questionScore: QUIZ_QUESTION_SCORE }));
  const passingScore = rule === 'FULL' ? questions.length : rule ? Math.min(count, questions.length) : null;
  return { ...popup, questions, passingScore };
}

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 규칙 저장 전 검사
 * - in : popup(AdminPopupDetail) · rule(QuizRule) · count(number)
 * - out: string | null 오류 문구(없으면 null)
 * - 퀴즈유형 선택 여부와 통과 기준 개수(1~문항 수 정수)를 검사한다. QUIZ가 아니면 항상 null.
 */
export function validateQuizRule(popup: AdminPopupDetail, rule: QuizRule, count: number): string | null {
  if (popup.popupType !== 'QUIZ') return null;
  if (!rule) return '퀴즈유형을 선택해 주세요.';
  if (rule !== 'FULL' && (!Number.isInteger(count) || count < 1 || count > popup.questions.length)) {
    return `통과 기준은 1~${popup.questions.length}개 사이의 정수로 입력해 주세요.`;
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
export function usePopupQuizRule(popup: AdminPopupDetail | null, resetKey: number) {
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
