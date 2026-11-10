import type { PopupOption, PopupQuestion } from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Radio, Stack, TextField, Typography, type TextFieldProps } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { acceptsByteLimitedChange, byteLimitMessage, QUIZ_OPTION_TEXT_MAX_BYTES, utf8ByteLength } from './popupByteLimit';
import { richBlocksOrNull } from './PopupRichBlocks';
import PopupRichTextEditor from './PopupRichTextEditor';
import { ANSWER_TYPE_CHOICE, ANSWER_TYPE_CODE_TYPE, ANSWER_TYPE_OX, isOxQuestion, SAMPLE_ANSWER_TYPE_OPTIONS, type PopupCodeOption } from './popupQuestionCodes';
import { blocksToPlainText, plainTextToBlocks, type RichBlock } from './popupRichText';

interface Props {
  /** 편집할 문항 목록 */
  questions: PopupQuestion[];
  /** true면 퀴즈(정답·배점·통과 점수 입력 표시), false면 설문 */
  quiz: boolean;
  /** 퀴즈 통과 점수 */
  passingScore?: number | null;
  /** 문항 목록이 바뀔 때마다 전체 목록을 돌려준다. */
  onChange: (questions: PopupQuestion[]) => void;
  /** 통과 점수 입력이 바뀔 때(비우면 null) */
  onPassingScoreChange: (score: number | null) => void;
  /**
   * 배점 고정(예: 1). 지정하면 문항별 배점 입력·'배점 모두 1점' 버튼을 숨기고 새 문항도 이 배점으로 만든다.
   * 부모가 모든 문항의 questionScore를 이 값으로 맞춘다(예: IS063M02 샘플은 문항 1점 고정, 총점 = 문항 수). 생략하면 문항별 배점을 입력한다.
   */
  fixedQuestionScore?: number;
  /** 통과 점수 입력을 숨긴다(부모가 퀴즈 유형 등 다른 입력으로 passingScore를 정할 때). */
  hidePassingScore?: boolean;
  /**
   * 퀴즈 답안 유형(공통코드 0089) 조회 결과. 생략하면 서버 없는 샘플용 목록을 쓴다. 빈 배열이면 조회 전이거나 실패한 상태로 보고 변경을 막는다.
   */
  answerTypeOptions?: PopupCodeOption[];
  /**
   * 문항 제목·선택지를 서식 편집기로 입력한다. 기본 false = 설문 문항 제목과 선택지는 일반 텍스트(여러 줄) 입력(TODO73-28).
   * 퀴즈 문항 제목은 이 값과 무관하게 항상 서식 편집기다(2026-11-10 QUIZ 제목 RichTextEditor 통일).
   * true면 설문 문항 제목과 모든 선택지도 서식 편집기(compact)로 입력하고 서식 블록(titleBlocks·textBlocks)을 저장한다. 퀴즈 OX 정답 선택 UI는 같다.
   */
  richQuestionText?: boolean;
  /** 최대 문항 수(1 이상 정수). 기본 QUESTION_MAX(30). 저장 전 확인도 같은 값을 validatePopupQuestions에 넘긴다. */
  maxQuestions?: number;
}

/**
 * POL-06-01 : 문항·서식
 * ■ 문항 글자 수 상한
 * - in : 없음
 * - out: QUESTION_TITLE_MAX(1000) 문항 제목 · QUESTION_DESCRIPTION_MAX(2000) 문항 설명 · OPTION_TEXT_MAX(1000) 선택지
 * - 서식 편집기는 글자 수 제한 입력을 둘 수 없어 저장 전에 서버(PopupSurveyRichText)와 같은 상한으로 확인한다.
 */
export const QUESTION_TITLE_MAX = 1000;
export const QUESTION_DESCRIPTION_MAX = 2000;
export const OPTION_TEXT_MAX = 1000;

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 기본 배점
 * - in : 없음
 * - out: number 1점
 * - 배점을 비운 문항에 쓰는 값이다. 서버(PopupQuestionRules.DEFAULT_QUESTION_SCORE)·WPF(QuizGrader)·미리보기와 같다. 모두 1점이면 총점 = 문항 수.
 */
export const DEFAULT_QUESTION_SCORE = 1;

/**
 * POL-06-02 : 선택·제출
 * ■ 설문·퀴즈 최대 문항 수
 * - in : 없음
 * - out: number 30
 * - 관리자 편집기 상한이다(TODO73-22). 넘는 데이터(템플릿·기존 자료)는 자르지 않고 표시만 하며 저장 전 확인에서 막는다.
 *   서버·WPF 제한은 계약 검토 후 별도로 정한다(TODO73-24).
 */
export const QUESTION_MAX = 30;

/**
 * POL-06-01 : 문항·서식
 * POL-06-02 : 선택·제출
 * ■ 설문·퀴즈 문항 저장 전 확인
 * - in : questions(PopupQuestion[]) 문항 목록 · quiz(boolean) 퀴즈 여부 · passingScore?(number | null) 통과 점수 · maxQuestions?(number) 최대 문항 수, 기본 QUESTION_MAX
 * - out: string | null 첫 번째 위반 안내 문구, 문제없으면 null
 * - 문항 목록을 받아 제목·글자 수·선택지·정답·배점·통과 점수(0~총점)를 서버와 같은 기준으로 확인한다.
 */
export function validatePopupQuestions(questions: PopupQuestion[], quiz: boolean, passingScore?: number | null, maxQuestions: number = QUESTION_MAX): string | null {
  if (!questions.length) return '문항을 한 개 이상 추가해 주세요.';
  if (questions.length > maxQuestions) return questionOverflowMessage(questions.length, maxQuestions);
  for (const [index, q] of questions.entries()) {
    const prefix = `${index + 1}번 문항: `;
    if (!q.title.trim()) return prefix + '제목을 입력해 주세요.';
    if (q.title.length > QUESTION_TITLE_MAX) return prefix + `제목은 ${QUESTION_TITLE_MAX}자 이하로 입력해 주세요.`;
    if ((q.description ?? '').length > QUESTION_DESCRIPTION_MAX) return prefix + `설명은 ${QUESTION_DESCRIPTION_MAX}자 이하로 입력해 주세요.`;
    // 배점을 비우면 기본 1점으로 저장한다(서버 PopupQuestionRules.withDefaultScores). 입력한 값은 양수여야 한다.
    if (quiz && q.questionScore != null && (!Number.isFinite(q.questionScore) || q.questionScore <= 0)) return prefix + '배점은 0보다 커야 합니다.';
    if (q.questionType === 'TEXT') {
      if (quiz && !q.correctAnswer?.trim()) return prefix + '주관식 정답을 입력해 주세요.';
    } else {
      if (q.options.length < 2 || q.options.some((o) => !o.text.trim())) return prefix + '선택지를 두 개 이상 입력해 주세요.';
      if (q.options.some((o) => o.text.length > OPTION_TEXT_MAX)) return prefix + `선택지는 ${OPTION_TEXT_MAX}자 이하로 입력해 주세요.`;
      // QUIZ 선택지는 DB 컬럼(VARCHAR2(300 BYTE)) 기준 UTF-8 300 Byte까지(TODO73-36·38). 입력칸에서 막지만 이전 데이터·직접 넘긴 값도 여기서 막는다.
      if (quiz) {
        const over = q.options.findIndex((o) => utf8ByteLength(o.text) > QUIZ_OPTION_TEXT_MAX_BYTES);
        if (over >= 0) return prefix + `${over + 1}번 선택지는 ${byteLimitMessage(QUIZ_OPTION_TEXT_MAX_BYTES, utf8ByteLength(q.options[over].text))}`;
      }
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (quiz && (!correct || (q.questionType === 'SINGLE_CHOICE' && correct !== 1))) return prefix + '정답 선택지를 확인해 주세요.';
    }
    const limitError = selectionLimitError(q, quiz);
    if (limitError) return prefix + limitError;
  }
  const total = questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? DEFAULT_QUESTION_SCORE) * 100), 0) / 100;
  if (quiz && (passingScore == null || !Number.isFinite(passingScore) || passingScore < 0 || passingScore > total)) return '통과 점수는 0~총점 사이로 입력해 주세요.';
  return null;
}

/**
 * POL-06-02 : 선택·제출
 * ■ 복수 선택 최소·최대 선택 수 확인
 * - in : q(PopupQuestion) 문항 · quiz(boolean) 퀴즈 여부
 * - out: string | null 위반 안내, 문제없으면 null
 * - 서버(PopupQuestionRules.validateSelectionLimits)와 같은 규칙: SURVEY 복수 선택만, 정수 1~선택지 수, 최소 ≤ 최대. 비우면(null) 제한 없음.
 */
export function selectionLimitError(q: PopupQuestion, quiz: boolean): string | null {
  const min = q.minSelections ?? null;
  const max = q.maxSelections ?? null;
  if (min == null && max == null) return null;
  if (quiz || q.questionType !== 'MULTIPLE_CHOICE') return '최소·최대 선택 수는 설문의 복수 선택 문항에서만 지정할 수 있습니다.';
  const count = q.options.length;
  const outOfRange = (value: number | null) => value != null && (!Number.isInteger(value) || value < 1 || value > count);
  if (outOfRange(min) || outOfRange(max)) return `최소·최대 선택 수는 1~선택지 수(${count}) 사이의 정수여야 합니다.`;
  if (min != null && max != null && min > max) return '최소 선택 수는 최대 선택 수보다 클 수 없습니다.';
  return null;
}

/* 30개 초과 안내. 편집기 경고와 저장 전 확인이 같은 문구를 쓴다. */
const questionOverflowMessage = (count: number, max: number) =>
  `문항은 최대 ${max}개까지 등록할 수 있습니다. 현재 ${count}개이므로 ${count - max}개를 삭제한 후 저장해 주세요.`;

/* 새 문항·선택지의 임시 ID(음수). 편집기 key로도 쓰므로 같은 시각에 여러 개를 만들어도 겹치지 않게 순번을 더한다. */
let temporaryIdSequence = 0;
const temporaryId = () => -(Date.now() * 1000 + (temporaryIdSequence++ % 1000));

/** 편집기 초기값: 서식이 있으면 서식, 없으면 기존 일반 문자열을 서식 없는 문단으로. */
const initialRich = (blocks: unknown, plain: string | null | undefined): RichBlock[] =>
  richBlocksOrNull(blocks) ?? plainTextToBlocks(plain ?? '');
/** 편집 결과: 글자가 없으면 서식을 보내지 않는다(null). 일반 문자열은 서버와 같은 규칙으로 서식에서 파생한다. */
const richValue = (blocks: RichBlock[], plain: string) => ({ blocks: richBlocksOrNull(blocks), plain });
/**
 * POL-06-01 : 문항·서식
 * ■ 일반 텍스트 입력 표시값(TODO73-29)
 * - in : plain(string | null | undefined) 저장된 일반 문자열 · blocks(unknown) 저장된 서식 블록
 * - out: string 입력칸에 보일 문자열
 * - 일반 문자열을 우선 쓰고, 비어 있으면 서식 블록의 글자를 줄바꿈으로 이어 복원한다. 열기만 하면 저장값(서식 포함)은 바꾸지 않는다.
 */
const plainInputValue = (plain: string | null | undefined, blocks: unknown): string => {
  if (plain) return plain;
  const rich = richBlocksOrNull(blocks);
  return rich ? blocksToPlainText(rich) : '';
};
/**
 * POL-06-01 : 문항·서식
 * ■ OX형 판별·선택지
 * - OX형은 단일 선택 문항에 O·X 선택지를 둔 형태다. 저장 형식은 일반 객관식과 같아 서버·WPF 계약 변경이 없다.
 * - 답안 유형은 저장하지 않으므로 다시 열 때 선택지가 O·X이면 OX형으로 복원한다.
 */
const OX_OPTION_TEXTS = ['O', 'X'];
/* 유형을 바꾸며 새로 만든 선택지는 새 임시 ID라 편집기가 이전 내용을 이어받지 않는다. */
const createOptions = (texts: string[]): PopupOption[] => texts.map((text, index) => ({
  optionId: temporaryId(), value: String(index + 1), text, sortOrder: index + 1, isCorrect: false,
}));
/* 기존 복수 선택·주관식 퀴즈 문항은 새로 만들 수 없지만 그대로 표시·유지한다(TODO73-5). */
const LEGACY_ANSWER_TYPE_LABELS: Record<string, string> = { MULTIPLE_CHOICE: '기존 유형: 복수 선택', TEXT: '기존 유형: 주관식' };

/* 문항 카드 안 짧은 입력을 한 행에 묶고 폭이 부족하면 줄바꿈한다. Stack spacing은 줄바꿈된 항목에 왼쪽 여백이 남아 gap을 쓴다. */
const FIELD_ROW_SX = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1 };
/* 선택지 한 줄의 라디오·삭제 칸. 일반 입력칸(size small) 첫 줄 높이 40px과 맞추고(서식 편집기 모드는 36px), 여러 줄로 늘어나도 첫 줄에 남긴다. */
const OPTION_SLOT_SX = { height: 40, display: 'flex', alignItems: 'center', flexShrink: 0 };
/* 작게 그려도 클릭 영역은 32px를 유지한다. */
const ICON_BUTTON_SX = { width: 32, height: 32 };

/**
 * POL-06-01 : 문항·서식
 * POL-06-02 : 선택·제출
 * ■ 설문·퀴즈 문항 편집기
 * - in : questions(PopupQuestion[]) 문항 목록 · quiz(boolean) 퀴즈 여부 · passingScore?(number | null) 통과 점수 · fixedQuestionScore?(number) 배점 고정값 · hidePassingScore?(boolean) 통과 점수 입력 숨김 · richQuestionText?(boolean) 제목·선택지 서식 편집기 사용 · maxQuestions?(number) 최대 문항 수
 * - out: onChange(questions: PopupQuestion[]) 바뀐 문항 전체 · onPassingScoreChange(score: number | null) 통과 점수 · 화면: 총점·문항별 서식 제목/설명·유형·배점·선택지·정답 입력
 * - 문항 목록을 받아 문항·선택지를 추가·삭제·편집하게 하고, 바뀔 때마다 전체 목록을 돌려준다.
 *   퀴즈 문항 제목은 OX 여부와 무관하게 서식 편집기(compact)로 입력한다. 설문 문항 제목과 선택지는 일반 텍스트 입력(여러 줄)이다(TODO73-28, 2026-11-10 QUIZ 제목 통일).
 *   선택지 입력칸 앞에 자동 번호를 붙이지 않는다. 저장 전 확인은 validatePopupQuestions로 한다.
 */
export default function PopupQuestionEditor({ questions, quiz, passingScore, onChange, onPassingScoreChange, fixedQuestionScore, hidePassingScore = false, answerTypeOptions = SAMPLE_ANSWER_TYPE_OPTIONS, richQuestionText = false, maxQuestions = QUESTION_MAX }: Props) {
  const update = (index: number, patch: Partial<PopupQuestion>) => onChange(questions.map((q, i) => i === index ? { ...q, ...patch } : q));
  const updateOption = (index: number, optionId: number, patch: Partial<PopupOption>) =>
    update(index, { options: questions[index].options.map((o) => o.optionId === optionId ? { ...o, ...patch } : o) });
  /* POL-06-02 : 선택·제출 — 퀴즈 답안 유형(공통코드 0089). 코드값은 저장하지 않고 questionType·options로 변환한다. */
  const answerTypeValue = (q: PopupQuestion) => q.questionType !== 'SINGLE_CHOICE' ? q.questionType : isOxQuestion(q) ? ANSWER_TYPE_OX : ANSWER_TYPE_CHOICE;
  const changeAnswerType = (index: number, code: string) => {
    const q = questions[index];
    const base = { questionType: 'SINGLE_CHOICE', minSelections: null, maxSelections: null, correctAnswer: '', answerMatchMode: 'EXACT' as const };
    if (code === ANSWER_TYPE_OX) {
      const typed = q.options.some((option) => option.text.trim());
      if (typed && !window.confirm('입력한 선택지가 O·X로 바뀝니다. 계속할까요?')) return;
      update(index, { ...base, optionLayout: 'HORIZONTAL', options: createOptions(OX_OPTION_TEXTS) });
    } else if (code === ANSWER_TYPE_CHOICE) {
      const keep = q.options.length > 0 && !isOxQuestion(q);
      update(index, { ...base, optionLayout: 'VERTICAL', options: keep ? q.options.map((option) => ({ ...option, isCorrect: false })) : createOptions(['', '']) });
    }
  };
  /* POL-06-02 : 선택·제출 — 설문 응답 유형(객관식/주관식). 선택 수는 복수 선택 전용이라 유형을 바꾸면 비운다. */
  const changeSurveyType = (index: number, questionType: string) => {
    const q = questions[index];
    update(index, { questionType, minSelections: null, maxSelections: null, correctAnswer: '', answerMatchMode: 'EXACT',
      options: questionType === 'TEXT' ? [] : q.options.length ? q.options : createOptions(['', '']) });
  };
  const total = questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? DEFAULT_QUESTION_SCORE) * 100), 0) / 100;
  const full = questions.length >= maxQuestions;
  /* 정답·삭제 칸을 입력칸 첫 줄과 맞춘다: 서식 편집기 36px, 일반 입력 40px. */
  const optionSlotSx = richQuestionText ? { ...OPTION_SLOT_SX, height: 36 } : OPTION_SLOT_SX;
  const add = () => !full && onChange([...questions, {
    questionId: temporaryId(), title: '', description: '', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL',
    // 퀴즈 기본 배점 1점(서버·WPF 기본값과 같음). 모두 1점이면 총점 = 문항 수.
    isRequired: quiz, isScored: quiz, questionScore: quiz ? fixedQuestionScore ?? DEFAULT_QUESTION_SCORE : null,
    sortOrder: questions.length + 1, answerMatchMode: 'EXACT', correctAnswer: '',
    options: [1, 2].map((n) => ({ optionId: -n, value: String(n), text: '', sortOrder: n, isCorrect: false })),
  }]);
  return <Stack spacing={1.5} sx={{ width: '100%', minWidth: 0 }}>
    <Typography fontWeight={700}>{quiz ? '퀴즈' : '설문'} 문항 {questions.length}/{maxQuestions}</Typography>
    {/* 템플릿·기존 자료로 30개를 넘게 들어온 경우 자르지 않고 사유를 보여 준다. 저장은 validatePopupQuestions가 막는다. */}
    {questions.length > maxQuestions && <Typography variant="body2" color="error" role="alert">{questionOverflowMessage(questions.length, maxQuestions)}</Typography>}
    {quiz && <Box sx={{ ...FIELD_ROW_SX, alignItems: 'center' }}>
      <Typography sx={{ flex: '1 1 160px', minWidth: 0 }} fontWeight={700}>
        총점 {total}점{questions.length > 0 && total === questions.length ? ` (문항 ${questions.length}개 × 1점)` : ''}
      </Typography>
      {fixedQuestionScore == null && <Button size="small" variant="outlined" disabled={!questions.length}
        onClick={() => onChange(questions.map((q) => ({ ...q, questionScore: DEFAULT_QUESTION_SCORE, isScored: true })))}>
        배점 모두 1점
      </Button>}
      {!hidePassingScore && <TextField size="small" label="통과 점수" type="number" value={passingScore ?? ''} slotProps={{ htmlInput: { min: 0, max: total, step: 0.01 } }} sx={{ width: 110 }}
        onChange={(e) => onPassingScoreChange(e.target.value === '' ? null : Number(e.target.value))} />}
    </Box>}
    {!questions.length && <Typography color="text.secondary">문항을 추가하거나 템플릿을 불러오세요.</Typography>}
    {questions.map((q, index) => { const oxQuestion = quiz && isOxQuestion(q); const richTitle = quiz || richQuestionText; return <Box key={q.questionId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minWidth: 0 }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography fontWeight={700} sx={{ flex: 1, minWidth: 0 }}>{index + 1}번 문항</Typography>
          <FormControlLabel label="필수문항" sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13 } }}
            control={<Checkbox size="small" checked={q.isRequired} onChange={(_, checked) => update(index, { isRequired: checked })} />} />
          <IconButton size="small" sx={ICON_BUTTON_SX} aria-label={`${index + 1}번 문항 삭제`} onClick={() => onChange(questions.filter((_, i) => i !== index))}><DeleteOutlineIcon fontSize="small" /></IconButton>
        </Stack>
        {/* 문항 설명 입력은 두지 않고, 기존 description·descriptionBlocks는 문항 객체에 그대로 남겨 저장한다(TODO73).
            POL-06-01 : 문항·서식 — 퀴즈 문항 제목은 OX 여부와 무관하게 서식 편집기(우클릭 펼침 팔레트)로 입력한다(2026-11-10 QUIZ 제목 통일).
            설문 문항 제목은 richQuestionText=true일 때만 서식 편집기, 기본은 일반 텍스트(여러 줄)로 입력한다(TODO73-28·34).
            일반 입력에서 고치면 titleBlocks를 비워(null) 서버가 title을 그대로 쓰게 한다. 이전 서식이 미리보기·저장에서 우선되지 않는다(TODO73-29). */}
        {richTitle ? <PopupRichTextEditor compact label={`문항 제목 *`} placeholder="문항 제목을 입력하세요."
          initialBlocks={initialRich(q.titleBlocks, q.title)}
          onChange={(blocks, plain) => { const value = richValue(blocks, plain); update(index, { title: value.plain, titleBlocks: value.blocks }); }} />
          : <TextField size="small" multiline minRows={1} fullWidth label="문항 제목" required placeholder="문항 제목을 입력하세요."
            slotProps={{ htmlInput: { 'aria-label': `${index + 1}번 문항 제목` } }}
            value={plainInputValue(q.title, q.titleBlocks)} onChange={(e) => update(index, { title: e.target.value, titleBlocks: null })} />}
        {quiz ? <Box sx={FIELD_ROW_SX}>
          {/* 답안 유형 표시 이름은 공통코드 0089. 기존 복수 선택·주관식은 항목을 하나 더 보여 값을 유지한다. */}
          <TextField select size="small" label="답안 유형" value={answerTypeValue(q)} sx={{ flex: '1 1 160px', minWidth: 140 }} disabled={!answerTypeOptions.length && q.questionType === 'SINGLE_CHOICE'}
            helperText={answerTypeOptions.length ? undefined : `공통코드 ${ANSWER_TYPE_CODE_TYPE}을 불러오는 중이거나 불러오지 못했습니다.`}
            slotProps={{ select: { inputProps: { 'aria-label': `${index + 1}번 문항 답안 유형` } } }}
            onChange={(e) => changeAnswerType(index, e.target.value)}>
            {answerTypeOptions.map((item) => <MenuItem key={item.code} value={item.code}>{item.codeNm}</MenuItem>)}
            {LEGACY_ANSWER_TYPE_LABELS[q.questionType] && <MenuItem value={q.questionType}>{LEGACY_ANSWER_TYPE_LABELS[q.questionType]}</MenuItem>}
            {/* 코드를 못 불러온 동안에도 현재 값을 표시한다. */}
            {!answerTypeOptions.some((item) => item.code === answerTypeValue(q)) && !LEGACY_ANSWER_TYPE_LABELS[q.questionType]
              && <MenuItem value={answerTypeValue(q)} sx={{ display: 'none' }}>{answerTypeValue(q) === ANSWER_TYPE_OX ? 'O·X' : '선택지'}</MenuItem>}
          </TextField>
          {fixedQuestionScore == null && <TextField size="small" label="배점" type="number" sx={{ flex: '0 1 100px', minWidth: 88 }} value={q.questionScore ?? ''} placeholder={`기본 ${DEFAULT_QUESTION_SCORE}`} slotProps={{ inputLabel: { shrink: true } }}
            onChange={(e) => update(index, { questionScore: e.target.value === '' ? null : Number(e.target.value), isScored: true })} />}
        </Box> : <Box sx={FIELD_ROW_SX}>
          <TextField select size="small" label="응답 유형" value={q.questionType === 'TEXT' ? 'TEXT' : 'CHOICE'} sx={{ flex: '1 1 112px', minWidth: 112 }}
            slotProps={{ select: { inputProps: { 'aria-label': `${index + 1}번 문항 응답 유형` } } }}
            onChange={(e) => changeSurveyType(index, e.target.value === 'TEXT' ? 'TEXT' : 'SINGLE_CHOICE')}>
            <MenuItem value="CHOICE">객관식</MenuItem>
            <MenuItem value="TEXT">주관식</MenuItem>
          </TextField>
          {q.questionType !== 'TEXT' && <>
            <TextField select size="small" label="레이아웃" value={q.optionLayout ?? 'VERTICAL'} sx={{ flex: '1 1 104px', minWidth: 104 }} onChange={(e) => update(index, { optionLayout: e.target.value as 'VERTICAL' | 'HORIZONTAL' })}>
              <MenuItem value="HORIZONTAL">가로형</MenuItem>
              <MenuItem value="VERTICAL">세로형</MenuItem>
            </TextField>
            <TextField select size="small" label="응답 수" value={q.questionType} sx={{ flex: '1 1 120px', minWidth: 120 }}
              slotProps={{ select: { inputProps: { 'aria-label': `${index + 1}번 문항 응답 수` } } }}
              onChange={(e) => changeSurveyType(index, e.target.value)}>
              <MenuItem value="SINGLE_CHOICE">단일 선택</MenuItem>
              <MenuItem value="MULTIPLE_CHOICE">복수 선택</MenuItem>
            </TextField>
            {q.questionType === 'MULTIPLE_CHOICE' && <Stack direction="row" spacing={0.5} alignItems="center">
              <TextField size="small" type="number" value={q.maxSelections ?? ''} placeholder="제한 없음" sx={{ width: 110 }}
                slotProps={{ htmlInput: { min: 1, max: q.options.length, step: 1, 'aria-label': `${index + 1}번 문항 선택 개수` } }}
                onChange={(e) => update(index, { maxSelections: e.target.value === '' ? null : Number(e.target.value), minSelections: null })} />
              <Typography component="span">개 선택</Typography>
            </Stack>}
          </>}
        </Box>}
        {q.questionType === 'TEXT' ? quiz && <Stack spacing={1}>
          <TextField size="small" label="주관식 정답" required value={q.correctAnswer ?? ''} onChange={(e) => update(index, { correctAnswer: e.target.value })} />
          <TextField select size="small" label="정답 비교 방식" value={q.answerMatchMode ?? 'EXACT'} onChange={(e) => update(index, { answerMatchMode: e.target.value as 'EXACT' | 'CONTAINS' })}
            helperText="앞뒤 공백은 제외하며, 대소문자와 문장 안의 공백은 구분합니다.">
            <MenuItem value="EXACT">정확히 일치</MenuItem><MenuItem value="CONTAINS">포함</MenuItem>
          </TextField>
        </Stack> : <Stack spacing={0.75}>
          {/* POL-06-02 : 선택·제출 — OX 정답은 폭을 나눈 칸 2개 중 하나만 고른다. 높이·글자는 낮게 두고, 큰 칸 표시는 미리보기·실제 팝업(SurveyPreview·WPF)에만 적용한다. 저장은 기존 SINGLE_CHOICE의 O·X 선택지와 isCorrect다.
              라디오 그룹 규칙대로 Tab은 그룹에 한 번만 들어오고, 화살표로 옮기면 정답도 함께 바뀐다. */}
          {oxQuestion ? <Stack spacing={0.75} role="radiogroup" aria-label={`${index + 1}번 문항 정답`} aria-required>
            <Typography variant="body2" fontWeight={600}>정답 선택 *</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
              {q.options.map((option, oi) => {
                const checked = Boolean(option.isCorrect);
                const choose = (target: number) => update(index, { options: q.options.map((o, i) => ({ ...o, isCorrect: i === target })) });
                const focusable = checked || (oi === 0 && !q.options.some((o) => o.isCorrect));
                return <Button key={option.optionId} role="radio" aria-checked={checked} aria-label={`${index + 1}번 문항 ${oi + 1}번 선택지 정답`}
                  tabIndex={focusable ? 0 : -1} variant="outlined" color="inherit" disableElevation
                  onClick={() => choose(oi)}
                  onKeyDown={(event) => {
                    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                    event.preventDefault();
                    const next = (oi + 1) % q.options.length;
                    choose(next);
                    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
                  }}
                  sx={{ minWidth: 0, height: 44, fontSize: 18, fontWeight: 600, borderRadius: '6px', borderColor: checked ? '#171717' : '#E5E5E5',
                    bgcolor: checked ? '#171717' : '#FFFFFF', color: checked ? '#FFFFFF' : '#222222',
                    '&:hover': { bgcolor: checked ? '#171717' : '#F5F5F5', borderColor: checked ? '#171717' : '#8C8C8C' },
                    '&.Mui-focusVisible': { outline: '2px solid #2563EB', outlineOffset: 2 } }}>{option.text}</Button>;
              })}
            </Box>
            {!q.options.some((option) => option.isCorrect) && <Typography variant="caption" color="text.secondary">정답을 선택해 주세요.</Typography>}
          </Stack> : <>
          {quiz && <Typography variant="caption" color="text.secondary">왼쪽 선택: 정답</Typography>}
          {/* 선택지 입력칸은 순서가 아니라 optionId로 구분해 삭제 후에도 다른 선택지의 내용·커서가 섞이지 않는다.
              정답·입력칸·삭제를 한 줄에 두고, 긴 내용은 입력칸만 아래로 늘어난다. */}
          {q.options.map((option, oi) => <Stack key={option.optionId} direction="row" spacing={0.5} alignItems="flex-start">
            {quiz && <Box sx={optionSlotSx}>{q.questionType === 'SINGLE_CHOICE' ? <Radio size="small" sx={{ p: 0.5 }} checked={Boolean(option.isCorrect)} inputProps={{ 'aria-label': `${index + 1}번 문항 ${oi + 1}번 선택지 정답` }} onChange={() => update(index, { options: q.options.map((o, i) => ({ ...o, isCorrect: i === oi })) })} /> : <Checkbox size="small" sx={{ p: 0.5 }} checked={Boolean(option.isCorrect)} inputProps={{ 'aria-label': `${index + 1}번 문항 ${oi + 1}번 선택지 정답` }} onChange={(_, checked) => update(index, { options: q.options.map((o, i) => ({ ...o, isCorrect: i === oi ? checked : q.questionType === 'SINGLE_CHOICE' && checked ? false : o.isCorrect })) })} />}</Box>}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* POL-06-01 : 문항·서식 — 선택지 문구는 기본 일반 텍스트(여러 줄). 고치면 textBlocks를 비워 이전 서식이 남지 않게 한다(TODO73-28·29).
                  입력칸 앞 자동 번호는 표시하지 않는다(2026-11-10). 문항·선택지 번호는 aria-label로만 남긴다.
                  richQuestionText=true면 서식 편집기로 입력하고 textBlocks를 저장한다(TODO73-34). 편집 중 다른 선택지가 바뀌었을 수 있으므로 ID로 찾아 바꾼다. */}
              {/* QUIZ 선택지는 UTF-8 300 Byte까지만 입력된다(TODO73-36). 설문 선택지는 제한하지 않는다. */}
              {richQuestionText ? <PopupRichTextEditor compact label={`선택지 ${oi + 1}`} inlineLabel={String(oi + 1)} placeholder="선택지 내용"
                initialBlocks={initialRich(option.textBlocks, option.text)} maxPlainBytes={quiz ? QUIZ_OPTION_TEXT_MAX_BYTES : undefined}
                onChange={(blocks, plain) => { const value = richValue(blocks, plain); updateOption(index, option.optionId, { text: value.plain, textBlocks: value.blocks }); }} />
                : quiz ? <ByteLimitedTextField size="small" multiline minRows={1} fullWidth placeholder="선택지 내용" maxBytes={QUIZ_OPTION_TEXT_MAX_BYTES}
                  value={plainInputValue(option.text, option.textBlocks)} slotProps={{ htmlInput: { 'aria-label': `${index + 1}번 문항 선택지 ${oi + 1}` } }}
                  onValueChange={(text) => updateOption(index, option.optionId, { text, textBlocks: null })} />
                : <TextField size="small" multiline minRows={1} fullWidth placeholder="선택지 내용" value={plainInputValue(option.text, option.textBlocks)}
                  slotProps={{ htmlInput: { 'aria-label': `${index + 1}번 문항 선택지 ${oi + 1}` } }}
                  onChange={(e) => updateOption(index, option.optionId, { text: e.target.value, textBlocks: null })} />}
            </Box>
            <Box sx={optionSlotSx}><IconButton size="small" sx={ICON_BUTTON_SX} aria-label={`선택지 ${oi + 1} 삭제`} onClick={() => update(index, { options: q.options.filter((_, i) => i !== oi) })}><DeleteOutlineIcon fontSize="small" /></IconButton></Box>
          </Stack>)}
          {/* QUIZ 복수 선택은 정답 수만큼만 응답자가 고를 수 있다(미리보기·WPF 동일). */}
          {quiz && q.questionType === 'MULTIPLE_CHOICE' && <Typography variant="caption" color="text.secondary">
            정답 {q.options.filter((o) => o.isCorrect).length}개 · 응답자는 정답 수만큼만 선택할 수 있습니다.
          </Typography>}
          {/* POL-06-02 : 선택·제출 — SURVEY 복수 선택 개수. 비우면 제한 없음, 선택지 수와 같으면 모두 선택 가능. */}
          {!quiz && q.questionType === 'MULTIPLE_CHOICE' && <Typography variant="caption" color={selectionLimitError(q, quiz) ? 'error' : 'text.secondary'}>
            {selectionLimitError(q, quiz) ?? `선택지 ${q.options.length}개 · 비우면 제한 없음`}
          </Typography>}
          <Button size="small" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => update(index, { options: [...q.options, { optionId: temporaryId(), value: String(q.options.length + 1), text: '', sortOrder: q.options.length + 1, isCorrect: false }] })}>선택지 추가</Button>
          </>}
        </Stack>}
      </Stack>
    </Box>; })}
    <Stack direction="row" alignItems="center" spacing={1} sx={{ alignSelf: 'flex-start' }}>
      <Button startIcon={<AddIcon />} onClick={add} disabled={full}>문항 추가</Button>
      {full && <Typography variant="caption" color="text.secondary">최대 {maxQuestions}개까지 추가할 수 있습니다.</Typography>}
    </Stack>
  </Stack>;
}

/**
 * POL-06-01 : 문항·서식
 * ■ UTF-8 바이트 제한 일반 입력칸(TODO73-36)
 * - in : value(string) 표시값 · maxBytes(number) 허용 바이트 수 · 그 밖의 TextField 속성
 * - out: onValueChange(value: string) 받아들인 값 · 화면: 막혔을 때·기존 값이 넘을 때 안내 문구
 * - 키보드·붙여넣기로 한도를 넘는 변경은 반영하지 않는다(넘는 부분을 잘라 넣지 않음, 직전 값 유지).
 *   한글 IME 조합 중에는 브라우저 조합을 깨지 않도록 값을 그대로 넘기고, 조합이 끝날 때 다시 확인해 넘으면 조합 전 값으로 되돌린다.
 *   이미 한도를 넘은 기존 값은 줄이는 변경만 받고 안내를 띄운다(저장 전 확인 validatePopupQuestions도 막음).
 */
function ByteLimitedTextField({ value, maxBytes, onValueChange, ...props }: Omit<TextFieldProps, 'value' | 'onChange'> & { value: string; maxBytes: number; onValueChange: (value: string) => void }) {
  /* 마지막으로 받아들인 값. 조합 중 부모에 잠시 넘긴 값은 여기에 넣지 않는다. */
  const lastValid = useRef(value);
  const composing = useRef(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    // 부모가 바꾼 값(문항 불러오기·유형 변경 등)을 기준값으로 받는다. 조합 중 임시 값은 제외한다.
    if (!composing.current) lastValid.current = value;
  }, [value]);
  const accept = (next: string, input: HTMLInputElement | HTMLTextAreaElement) => {
    const previous = lastValid.current;
    if (acceptsByteLimitedChange(previous, next, maxBytes)) {
      lastValid.current = next;
      setBlocked(false);
      onValueChange(next);
      return;
    }
    // 거부: 부모 값을 직전 유효 값으로 둔다(조합 중 넘긴 임시 값이 있으면 되돌린다).
    // 값을 되돌리면 커서가 끝으로 가므로 입력하려던 위치(삽입된 길이만큼 앞)로 옮긴다.
    const caret = Math.max(0, (input.selectionStart ?? next.length) - (next.length - previous.length));
    setBlocked(true);
    onValueChange(previous);
    requestAnimationFrame(() => { if (input.value === previous) input.setSelectionRange(caret, caret); });
  };
  const bytes = utf8ByteLength(value);
  const over = !composing.current && bytes > maxBytes;
  return <TextField {...props} value={value} error={over || props.error}
    helperText={over ? byteLimitMessage(maxBytes, bytes) + ' 줄여 주세요.' : blocked ? byteLimitMessage(maxBytes) + ' 넘는 입력은 반영되지 않습니다.' : props.helperText}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={(event) => { composing.current = false; const input = event.target as HTMLTextAreaElement; accept(input.value, input); }}
    onChange={(event) => {
      const next = event.target.value;
      if (composing.current || (event.nativeEvent as InputEvent).isComposing) { onValueChange(next); return; }
      accept(next, event.target);
    }} />;
}
