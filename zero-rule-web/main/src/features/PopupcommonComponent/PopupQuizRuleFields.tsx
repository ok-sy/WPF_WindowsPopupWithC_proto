import { MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { QUIZ_TYPE_CODE_TO_RULE, QUIZ_TYPE_CODE_TYPE, SAMPLE_QUIZ_TYPE_OPTIONS, type PopupCodeOption } from './popupQuestionCodes';
import { QUIZ_QUESTION_SCORE, QUIZ_RULES, type QuizRule } from './popupQuizRule';

type Props = {
  questionCount: number;
  rule: QuizRule;
  count: number;
  passingScore: number | null | undefined;
  onRuleChange: (rule: QuizRule) => void;
  onCountChange: (count: number) => void;
  /**
   * 공통코드 0090 조회 결과. 생략하면 서버 없는 샘플용 목록을 쓴다. 빈 배열이면 조회 전이거나 실패한 상태로 보고 선택을 막는다.
   */
  options?: PopupCodeOption[];
  /** 바깥 영역 class(퍼블리싱 클래스 연결용, 예: 'nConSectionDiv'). */
  className?: string;
  /** 제목 앞에 붙일 요소(예: 필수 표시). */
  titlePrefix?: ReactNode;
};

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈유형 입력
 * - in : questionCount(number) 문항 수 · rule(QuizRule) 선택한 유형 · count(number) 기준 개수(참여형·컷트라인형) · passingScore 계산된 통과 점수(안내용)
 *        · className?(string) 바깥 class · titlePrefix?(ReactNode) 제목 앞 표시
 * - out: onRuleChange(rule) 유형 선택 · onCountChange(count) 개수 입력 · 화면: 유형 선택·개수 입력·"문항 N개 × 1점 = 총점 · 통과 점수" 안내
 * - 문항 수와 현재 선택을 받아 공통코드 0090의 퀴즈유형(참여형/만점형/컷트라인형)을 고르게 하고, 통과 점수 계산 결과를 보여 준다.
 *   참여형·컷트라인형은 기준 개수(1~문항 수)를 입력한다. 참여형 기준은 통계용 합격 기준이라 미달이어도 제출하면 완료된다.
 *   통과 점수 계산 자체는 popupQuizRule.withQuizRule이 한다(이 컴포넌트는 입력·표시만).
 */
export default function PopupQuizRuleFields({ questionCount, rule, count, passingScore, onRuleChange, onCountChange, options = SAMPLE_QUIZ_TYPE_OPTIONS, className, titlePrefix }: Props) {
  const selected = QUIZ_RULES.find((item) => item.value === rule);
  const items = options.filter((item) => item.code in QUIZ_TYPE_CODE_TO_RULE).map((item) => ({ value: QUIZ_TYPE_CODE_TO_RULE[item.code], label: item.codeNm }));
  return (
    <Stack className={className} direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      <Typography className="nConSectionTitle" fontWeight={700}>{titlePrefix}퀴즈유형</Typography>
      <Select size="small" value={items.some((item) => item.value === rule) ? rule : ''} disabled={!items.length} displayEmpty inputProps={{ 'aria-label': '퀴즈유형' }} onChange={(event) => onRuleChange(event.target.value as QuizRule)}>
        <MenuItem value="">선택하세요</MenuItem>
        {items.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
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
      {!items.length && (
        <Typography variant="caption" color="error" sx={{ width: '100%' }}>공통코드 {QUIZ_TYPE_CODE_TYPE}을 불러오는 중이거나 불러오지 못했습니다.</Typography>
      )}
      {rule === 'PARTICIPATION' && (
        <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
          정답 개수와 관계없이 제출하면 완료됩니다. 기준 개수는 통계용 합격 기준이며 결과의 합격 여부(passed)만 정답 {count}개 이상인지로 기록합니다.
        </Typography>
      )}
      {rule === 'CUTOFF' && (
        <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
          미달이면 통과(passed=true)가 되지 않습니다. 제출되지 않고 다시 풀어 기준을 넘어야 제출됩니다.
        </Typography>
      )}
    </Stack>
  );
}
