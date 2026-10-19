import type { PopupOption, PopupQuestion } from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { richBlocksOrNull } from './PopupRichBlocks';
import PopupRichTextEditor from './PopupRichTextEditor';
import { plainTextToBlocks, type RichBlock } from './popupRichText';

interface Props {
  questions: PopupQuestion[];
  quiz: boolean;
  passingScore?: number | null;
  onChange: (questions: PopupQuestion[]) => void;
  onPassingScoreChange: (score: number | null) => void;
}

/* [TODO55] 서식 편집기는 글자 수 제한 입력을 둘 수 없어 저장 전에 서버(PopupSurveyRichText)와 같은 상한을 확인한다. */
export const QUESTION_TITLE_MAX = 1000;
export const QUESTION_DESCRIPTION_MAX = 2000;
export const OPTION_TEXT_MAX = 1000;

export function validatePopupQuestions(questions: PopupQuestion[], quiz: boolean, passingScore?: number | null): string | null {
  if (!questions.length) return '문항을 한 개 이상 추가해 주세요.';
  for (const [index, q] of questions.entries()) {
    const prefix = `${index + 1}번 문항: `;
    if (!q.title.trim()) return prefix + '제목을 입력해 주세요.';
    if (q.title.length > QUESTION_TITLE_MAX) return prefix + `제목은 ${QUESTION_TITLE_MAX}자 이하로 입력해 주세요.`;
    if ((q.description ?? '').length > QUESTION_DESCRIPTION_MAX) return prefix + `설명은 ${QUESTION_DESCRIPTION_MAX}자 이하로 입력해 주세요.`;
    if (quiz && (!Number.isFinite(q.questionScore) || (q.questionScore ?? 0) <= 0)) return prefix + '배점을 입력해 주세요.';
    if (q.questionType === 'TEXT') {
      if (quiz && !q.correctAnswer?.trim()) return prefix + '주관식 정답을 입력해 주세요.';
    } else {
      if (q.options.length < 2 || q.options.some((o) => !o.text.trim())) return prefix + '선택지를 두 개 이상 입력해 주세요.';
      if (q.options.some((o) => o.text.length > OPTION_TEXT_MAX)) return prefix + `선택지는 ${OPTION_TEXT_MAX}자 이하로 입력해 주세요.`;
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (quiz && (!correct || (q.questionType === 'SINGLE_CHOICE' && correct !== 1))) return prefix + '정답 선택지를 확인해 주세요.';
    }
  }
  const total = questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? 0) * 100), 0) / 100;
  if (quiz && (passingScore == null || !Number.isFinite(passingScore) || passingScore < 0 || passingScore > total)) return '통과 점수는 0~총점 사이로 입력해 주세요.';
  return null;
}

/**
 * 주관식 문항의 비어 있는 정답 비교 방식을 실제 값 'EXACT'로 채운다.
 * 서버(PopupQuestionRules)는 QUIZ 주관식에 answerMatchMode를 요구하므로 화면 표시(?? 'EXACT')만으로는 저장이 거절된다.
 * 서버 응답·문항 템플릿·SURVEY→QUIZ 전환처럼 값이 null로 들어오는 경로에서 사용한다.
 */
export function withDefaultAnswerMatchMode(questions: PopupQuestion[]): PopupQuestion[] {
  if (!questions.some((q) => q.questionType === 'TEXT' && !q.answerMatchMode)) return questions;
  return questions.map((q) => q.questionType === 'TEXT' && !q.answerMatchMode ? { ...q, answerMatchMode: 'EXACT' } : q);
}

/* 새 문항·선택지의 임시 ID(음수). 편집기 key로도 쓰므로 같은 시각에 여러 개를 만들어도 겹치지 않게 순번을 더한다. */
let temporaryIdSequence = 0;
const temporaryId = () => -(Date.now() * 1000 + (temporaryIdSequence++ % 1000));

/** [TODO55] 편집기 초기값: 서식이 있으면 서식, 없으면 기존 일반 문자열을 서식 없는 문단으로. */
const initialRich = (blocks: unknown, plain: string | null | undefined): RichBlock[] =>
  richBlocksOrNull(blocks) ?? plainTextToBlocks(plain ?? '');
/** [TODO55] 편집 결과: 글자가 없으면 서식을 보내지 않는다(null). 일반 문자열은 서버와 같은 규칙으로 서식에서 파생한다. */
const richValue = (blocks: RichBlock[], plain: string) => ({ blocks: richBlocksOrNull(blocks), plain });

export default function PopupQuestionEditor({ questions, quiz, passingScore, onChange, onPassingScoreChange }: Props) {
  const update = (index: number, patch: Partial<PopupQuestion>) => onChange(questions.map((q, i) => i === index ? { ...q, ...patch } : q));
  const updateOption = (index: number, optionId: number, patch: Partial<PopupOption>) =>
    update(index, { options: questions[index].options.map((o) => o.optionId === optionId ? { ...o, ...patch } : o) });
  const total = questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? 0) * 100), 0) / 100;
  const add = () => onChange([...questions, {
    questionId: temporaryId(), title: '', description: '', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL',
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
        {/* [TODO55-3] 문항 제목·설명은 TEXT와 같은 서식 편집기(우클릭 펼침 팔레트). 편집기마다 선택 범위·패널 상태가 따로다. */}
        <PopupRichTextEditor compact label={`문항 제목 *`} placeholder="문항 제목을 입력하세요."
          initialBlocks={initialRich(q.titleBlocks, q.title)}
          onChange={(blocks, plain) => { const value = richValue(blocks, plain); update(index, { title: value.plain, titleBlocks: value.blocks }); }} />
        <PopupRichTextEditor compact label="문항 설명" placeholder="문항 설명(선택)"
          initialBlocks={initialRich(q.descriptionBlocks, q.description)}
          onChange={(blocks, plain) => { const value = richValue(blocks, plain); update(index, { description: value.plain, descriptionBlocks: value.blocks }); }} />
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
        {q.questionType !== 'TEXT' && <TextField select label="선택지 배치" value={q.optionLayout ?? 'VERTICAL'} onChange={(e) => update(index, { optionLayout: e.target.value as 'VERTICAL' | 'HORIZONTAL' })}>
          <MenuItem value="VERTICAL">세로형</MenuItem>
          <MenuItem value="HORIZONTAL">가로형</MenuItem>
        </TextField>}
        {q.questionType === 'TEXT' ? quiz && <Stack spacing={1.5}>
          <TextField label="주관식 정답" required value={q.correctAnswer ?? ''} onChange={(e) => update(index, { correctAnswer: e.target.value })} />
          <TextField select label="정답 비교 방식" value={q.answerMatchMode ?? 'EXACT'} onChange={(e) => update(index, { answerMatchMode: e.target.value as 'EXACT' | 'CONTAINS' })}
            helperText="앞뒤 공백은 제외하며, 대소문자와 문장 안의 공백은 구분합니다.">
            <MenuItem value="EXACT">정확히 일치</MenuItem><MenuItem value="CONTAINS">포함</MenuItem>
          </TextField>
        </Stack> : <Stack spacing={1}>
          {/* 선택지 편집기는 순서가 아니라 optionId로 구분해 삭제 후에도 다른 선택지의 내용·커서가 섞이지 않는다. */}
          {q.options.map((option, oi) => <Stack key={option.optionId} direction="row" spacing={1} alignItems="center">
            {quiz && <Checkbox checked={Boolean(option.isCorrect)} inputProps={{ 'aria-label': `${index + 1}번 문항 ${oi + 1}번 선택지 정답` }} onChange={(_, checked) => update(index, { options: q.options.map((o, i) => ({ ...o, isCorrect: i === oi ? checked : q.questionType === 'SINGLE_CHOICE' && checked ? false : o.isCorrect })) })} />}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <PopupRichTextEditor compact label={`선택지 ${oi + 1}${quiz ? ' (왼쪽 체크: 정답)' : ''}`} placeholder="선택지 내용"
                initialBlocks={initialRich(option.textBlocks, option.text)}
                onChange={(blocks, plain) => {
                  const value = richValue(blocks, plain);
                  // 편집 중 다른 선택지가 바뀌었을 수 있으므로 ID로 찾아 바꾼다.
                  updateOption(index, option.optionId, { text: value.plain, textBlocks: value.blocks });
                }} />
            </Box>
            <IconButton aria-label={`선택지 ${oi + 1} 삭제`} onClick={() => update(index, { options: q.options.filter((_, i) => i !== oi) })}><DeleteOutlineIcon /></IconButton>
          </Stack>)}
          <Button startIcon={<AddIcon />} onClick={() => update(index, { options: [...q.options, { optionId: temporaryId(), value: String(q.options.length + 1), text: '', sortOrder: q.options.length + 1, isCorrect: false }] })}>선택지 추가</Button>
        </Stack>}
      </Stack>
    </Box>)}
    <Button startIcon={<AddIcon />} onClick={add} sx={{ alignSelf: 'flex-start' }}>문항 추가</Button>
  </Stack>;
}
