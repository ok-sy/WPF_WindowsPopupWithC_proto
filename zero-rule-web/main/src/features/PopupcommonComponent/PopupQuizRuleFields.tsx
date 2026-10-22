import { MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { QUIZ_QUESTION_SCORE, QUIZ_RULES, type QuizRule } from './popupQuizRule';

type Props = {
  questionCount: number;
  rule: QuizRule;
  count: number;
  passingScore: number | null | undefined;
  onRuleChange: (rule: QuizRule) => void;
  onCountChange: (count: number) => void;
  /** 바깥 영역 class(퍼블리싱 클래스 연결용, 예: 'nConSectionDiv'). */
  className?: string;
  /** 제목 앞에 붙일 요소(예: 필수 표시). */
  titlePrefix?: ReactNode;
};

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈유형 입력
 * - in : questionCount(number) 문항 수 · rule(QuizRule) 선택한 유형 · count(number) 통과 기준 개수 · passingScore 계산된 통과 점수(안내용)
 *        · className?(string) 바깥 class · titlePrefix?(ReactNode) 제목 앞 표시
 * - out: onRuleChange(rule) 유형 선택 · onCountChange(count) 개수 입력 · 화면: 유형 선택·개수 입력·"문항 N개 × 1점 = 총점 · 통과 점수" 안내
 * - 문항 수와 현재 선택을 받아 만점 통과/커트라인 통과/통과·실패 제출을 고르게 하고, 통과 점수 계산 결과를 보여 준다.
 *   통과 점수 계산 자체는 popupQuizRule.withQuizRule이 한다(이 컴포넌트는 입력·표시만).
 */
export default function PopupQuizRuleFields({ questionCount, rule, count, passingScore, onRuleChange, onCountChange, className, titlePrefix }: Props) {
  const selected = QUIZ_RULES.find((item) => item.value === rule);
  return (
    <Stack className={className} direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      <Typography className="nConSectionTitle" fontWeight={700}>{titlePrefix}퀴즈유형</Typography>
      <Select size="small" value={rule} displayEmpty inputProps={{ 'aria-label': '퀴즈유형' }} onChange={(event) => onRuleChange(event.target.value as QuizRule)}>
        <MenuItem value="">선택하세요</MenuItem>
        {QUIZ_RULES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
      </Select>
      {selected?.suffix && <>
        <TextField size="small" type="number" sx={{ width: 72 }} value={count}
          slotProps={{ htmlInput: { 'aria-label': '통과 기준 개수', min: 1, max: questionCount } }}
          onChange={(event) => onCountChange(Number(event.target.value))} />
        <Typography component="span">{selected.suffix}</Typography>
      </>}
      <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }} data-testid="quiz-rule-score">
        문항 {questionCount}개 × {QUIZ_QUESTION_SCORE}점 = 총점 {questionCount * QUIZ_QUESTION_SCORE}점 · 통과 점수 {passingScore ?? '-'}점
      </Typography>
      {rule === 'PASS_FAIL' && (
        <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
          미달(실패)이면 제출되지 않고 점수 안내 후 다시 풀어 통과해야 제출됩니다.
        </Typography>
      )}
    </Stack>
  );
}
