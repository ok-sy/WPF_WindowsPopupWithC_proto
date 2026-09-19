import type { PopupQuestion } from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';

interface Props {
  questions: PopupQuestion[];
  quiz: boolean;
  passingScore?: number | null;
  onChange: (questions: PopupQuestion[]) => void;
  onPassingScoreChange: (score: number | null) => void;
}

export function validatePopupQuestions(questions: PopupQuestion[], quiz: boolean, passingScore?: number | null): string | null {
  if (!questions.length) return '문항을 한 개 이상 추가해 주세요.';
  for (const [index, q] of questions.entries()) {
    const prefix = `${index + 1}번 문항: `;
    if (!q.title.trim()) return prefix + '제목을 입력해 주세요.';
    if (quiz && (!Number.isFinite(q.questionScore) || (q.questionScore ?? 0) <= 0)) return prefix + '배점을 입력해 주세요.';
    if (q.questionType === 'TEXT') {
      if (quiz && !q.correctAnswer?.trim()) return prefix + '주관식 정답을 입력해 주세요.';
    } else {
      if (q.options.length < 2 || q.options.some((o) => !o.text.trim())) return prefix + '선택지를 두 개 이상 입력해 주세요.';
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (quiz && (!correct || (q.questionType === 'SINGLE_CHOICE' && correct !== 1))) return prefix + '정답 선택지를 확인해 주세요.';
    }
  }
  const total = questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? 0) * 100), 0) / 100;
  if (quiz && (passingScore == null || !Number.isFinite(passingScore) || passingScore < 0 || passingScore > total)) return '통과 점수는 0~총점 사이로 입력해 주세요.';
  return null;
}

export default function PopupQuestionEditor({ questions, quiz, passingScore, onChange, onPassingScoreChange }: Props) {
  const update = (index: number, patch: Partial<PopupQuestion>) => onChange(questions.map((q, i) => i === index ? { ...q, ...patch } : q));
  const total = questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? 0) * 100), 0) / 100;
  const add = () => onChange([...questions, {
    questionId: -Date.now(), title: '', description: '', questionType: 'SINGLE_CHOICE',
    isRequired: quiz, isScored: quiz, questionScore: quiz ? 10 : null,
    sortOrder: questions.length + 1, answerMatchMode: 'EXACT', correctAnswer: '',
    options: [1, 2].map((n) => ({ optionId: -n, value: String(n), text: '', sortOrder: n, isCorrect: false })),
  }]);
  return <Stack spacing={2}>
    <Typography fontWeight={700}>{quiz ? '퀴즈' : '설문'} 문항 ({questions.length})</Typography>
    {quiz && <Stack direction="row" spacing={2} alignItems="center">
      <Typography sx={{ flex: 1 }} fontWeight={700}>총점 {total}점</Typography>
      <TextField label="통과 점수" type="number" value={passingScore ?? ''} inputProps={{ min: 0, max: total, step: 0.01 }}
        onChange={(e) => onPassingScoreChange(e.target.value === '' ? null : Number(e.target.value))} />
    </Stack>}
    {!questions.length && <Typography color="text.secondary">문항을 추가하거나 템플릿을 불러오세요.</Typography>}
    {questions.map((q, index) => <Box key={q.questionId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={700} sx={{ flex: 1 }}>{index + 1}번 문항</Typography>
          <FormControlLabel label="필수문항" control={<Checkbox checked={q.isRequired} onChange={(_, checked) => update(index, { isRequired: checked })} />} />
          <IconButton aria-label={`${index + 1}번 문항 삭제`} onClick={() => onChange(questions.filter((_, i) => i !== index))}><DeleteOutlineIcon /></IconButton>
        </Stack>
        <TextField label="문항 제목" required value={q.title} inputProps={{ maxLength: 1000 }} onChange={(e) => update(index, { title: e.target.value })} />
        <TextField label="문항 설명" value={q.description ?? ''} multiline inputProps={{ maxLength: 2000 }} onChange={(e) => update(index, { description: e.target.value })} />
        <Stack direction="row" spacing={1}>
          <TextField select fullWidth label="문항 유형" value={q.questionType} onChange={(e) => update(index, {
            questionType: e.target.value,
            options: e.target.value === 'TEXT' ? [] : (q.options.length ? q.options.map((o) => ({ ...o, isCorrect: false })) : [1, 2].map((n) => ({ optionId: -n, value: String(n), text: '', sortOrder: n, isCorrect: false }))),
            correctAnswer: '', answerMatchMode: 'EXACT',
          })}>
            <MenuItem value="SINGLE_CHOICE">객관식 · 단일 선택</MenuItem>
            <MenuItem value="MULTIPLE_CHOICE">객관식 · 복수 선택</MenuItem>
            <MenuItem value="TEXT">주관식</MenuItem>
          </TextField>
          {quiz && <TextField label="배점" type="number" value={q.questionScore ?? ''} inputProps={{ min: 0.01, step: 0.01, max: 99999999.99 }}
            onChange={(e) => update(index, { questionScore: e.target.value === '' ? null : Number(e.target.value), isScored: true })} />}
        </Stack>
        {q.questionType === 'TEXT' ? quiz && <Stack spacing={1.5}>
          <TextField label="주관식 정답" required value={q.correctAnswer ?? ''} onChange={(e) => update(index, { correctAnswer: e.target.value })} />
          <TextField select label="정답 비교 방식" value={q.answerMatchMode ?? 'EXACT'} onChange={(e) => update(index, { answerMatchMode: e.target.value as 'EXACT' | 'CONTAINS' })}
            helperText="앞뒤 공백은 제외하며, 대소문자와 문장 안의 공백은 구분합니다.">
            <MenuItem value="EXACT">정확히 일치</MenuItem><MenuItem value="CONTAINS">포함</MenuItem>
          </TextField>
        </Stack> : <Stack spacing={1}>
          {q.options.map((option, oi) => <Stack key={oi} direction="row" spacing={1} alignItems="center">
            {quiz && <Checkbox checked={Boolean(option.isCorrect)} inputProps={{ 'aria-label': `${index + 1}번 문항 ${oi + 1}번 선택지 정답` }} onChange={(_, checked) => update(index, { options: q.options.map((o, i) => ({ ...o, isCorrect: i === oi ? checked : q.questionType === 'SINGLE_CHOICE' && checked ? false : o.isCorrect })) })} />}
            <TextField fullWidth size="small" label={`선택지 ${oi + 1}${quiz ? ' (왼쪽 체크: 정답)' : ''}`} value={option.text} inputProps={{ maxLength: 1000 }} onChange={(e) => update(index, { options: q.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o) })} />
            <IconButton aria-label={`선택지 ${oi + 1} 삭제`} onClick={() => update(index, { options: q.options.filter((_, i) => i !== oi) })}><DeleteOutlineIcon /></IconButton>
          </Stack>)}
          <Button startIcon={<AddIcon />} onClick={() => update(index, { options: [...q.options, { optionId: -Date.now(), value: String(q.options.length + 1), text: '', sortOrder: q.options.length + 1, isCorrect: false }] })}>선택지 추가</Button>
        </Stack>}
      </Stack>
    </Box>)}
    <Button startIcon={<AddIcon />} onClick={add} sx={{ alignSelf: 'flex-start' }}>문항 추가</Button>
  </Stack>;
}
