/*
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드 컴포넌트 탭의 코드 실행기 정의
 * - 컴포넌트 이름 → 입력 JSON 기본값 + 실제 컴포넌트를 그리는 함수. 콜백 값은 emit으로 OUTPUT에 남긴다.
 * - 미리보기 계열 입력은 화면 state(patch)만 받고 withPreviewFallback으로 표시용 값만 채운다(업무 기본값 없음).
 * - 새 공개 컴포넌트를 guideData.COMPONENTS에 추가하면 여기에도 실행기를 추가한다(없으면 실행기 영역에 안내만 표시).
 */
import type { AdminPopupDetail, PopupQuestion } from '@local/domain';
import { Button } from '@mui/material';
import { useState } from 'react';
import {
  InlinePopupPreview, PopupPreview, PopupPreviewDialog, PopupQuestionEditor, PopupQuizRuleFields, PopupRichBlocks, PopupRichTextEditor,
  PopupScheduleFields, createDefaultPopup, readTextBlocks, withPreviewFallback, validatePopupQuestions, validatePopupSchedule, withQuizRule,
  type QuizRule, type RichBlock,
} from '..';
import type { RunnerDefinition, RunnerEmit } from './GuideCodeRunner';

/* 실행기 입력이 매번 같은 결과를 내도록 기준 시각을 고정한다. */
const BASE_TIME = new Date('2026-11-02T00:00:00+09:00');
/** 실행기 입력(patch)을 화면 state로 보고 미리보기 fallback만 채운 값. 업무 기본값(createDefaultPopup)은 섞지 않는다(F-1). */
export const samplePopup = (patch: Partial<AdminPopupDetail> = {}): AdminPopupDetail =>
  withPreviewFallback({ popupId: 'RUN-001', title: '실행기 팝업', ...patch });
/** proto 저장 변환(toSaveRequestPopup) 비교용: createDefaultPopup() 위에 patch를 얹은 proto 편집값. */
export const protoPopup = (patch: Partial<AdminPopupDetail> = {}): AdminPopupDetail => {
  const base = { ...createDefaultPopup(BASE_TIME), popupId: 'RUN-001', title: '실행기 팝업' };
  return { ...base, ...patch, content: { ...base.content, ...(patch.content ?? {}) } };
};

const SAMPLE_BLOCKS: RichBlock[] = [
  { alignment: 'LEFT', runs: [{ text: '점검 안내', bold: true, size: 20 }] },
  { alignment: 'LEFT', indent: 1, runs: [{ text: '22:00~23:00 ', color: '#DC2626', bold: true }, { text: '서비스가 중단됩니다.' }] },
];
const TEXT_PATCH = { popupType: 'TEXT', title: '서비스 점검 안내',
  content: { textBlocks: SAMPLE_BLOCKS, plainText: '점검 안내\n22:00~23:00 서비스가 중단됩니다.', showBottomDescription: true, bottomDescription: '자세히 보기' } };
const SAMPLE_QUESTIONS: PopupQuestion[] = [
  { questionId: -1, title: '만족도를 골라 주세요.', questionType: 'SINGLE_CHOICE', isRequired: true, isScored: false, sortOrder: 1, optionLayout: 'VERTICAL',
    options: [{ optionId: -11, value: '1', text: '만족', sortOrder: 1 }, { optionId: -12, value: '2', text: '보통', sortOrder: 2 }] },
];

function QuestionHost({ input, emit }: { input: { questions: PopupQuestion[]; quiz: boolean; passingScore: number | null }; emit: RunnerEmit }) {
  const [questions, setQuestions] = useState(input.questions);
  const [passingScore, setPassingScore] = useState(input.passingScore);
  return (
    <PopupQuestionEditor questions={questions} quiz={input.quiz} passingScore={passingScore}
      onChange={(next) => { setQuestions(next); emit('onChange(questions)', next); emit('validatePopupQuestions', validatePopupQuestions(next, input.quiz, passingScore)); }}
      onPassingScoreChange={(score) => { setPassingScore(score); emit('onPassingScoreChange', score); }} />
  );
}

function QuizRuleHost({ input, emit }: { input: { questionCount: number; rule: QuizRule; count: number }; emit: RunnerEmit }) {
  const [rule, setRule] = useState<QuizRule>(input.rule);
  const [count, setCount] = useState(input.count);
  /* 통과 점수 계산은 withQuizRule이 한다. 문항 수만큼 1점 문항을 만든 편집값으로 계산 결과를 보여 준다. */
  const popup = samplePopup({ popupType: 'QUIZ', questions: Array.from({ length: input.questionCount }, (_, i) => ({ ...SAMPLE_QUESTIONS[0], questionId: -(i + 1), isScored: true, questionScore: 1 })) });
  const passingScore = withQuizRule(popup, rule, count).passingScore;
  return (
    <PopupQuizRuleFields questionCount={input.questionCount} rule={rule} count={count} passingScore={passingScore}
      onRuleChange={(next) => { setRule(next); emit('onRuleChange', next); emit('withQuizRule → passingScore', withQuizRule(popup, next, count).passingScore); }}
      onCountChange={(next) => { setCount(next); emit('onCountChange', next); emit('withQuizRule → passingScore', withQuizRule(popup, rule, next).passingScore); }} />
  );
}

type ScheduleValue = Pick<AdminPopupDetail, 'periodMode' | 'repeatDayOfWeek' | 'displayTimes'>;
function ScheduleHost({ input, emit }: { input: ScheduleValue; emit: RunnerEmit }) {
  const [value, setValue] = useState<ScheduleValue>(input);
  return (
    <PopupScheduleFields value={value} onChange={(patch) => {
      const next = { ...value, ...patch };
      setValue(next);
      emit('onChange(patch)', patch);
      emit('validatePopupSchedule', validatePopupSchedule(next));
    }} />
  );
}

function DialogHost({ popup, emit }: { popup: AdminPopupDetail; emit: RunnerEmit }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" size="small" onClick={() => setOpen(true)} sx={{ textTransform: 'none' }}>PopupPreviewDialog 열기</Button>
      <PopupPreviewDialog popup={popup} open={open} onClose={() => { setOpen(false); emit('onClose', '종료 버튼·Esc·팝업 안 닫기'); }} />
    </>
  );
}

export const COMPONENT_RUNNERS: Record<string, RunnerDefinition> = {
  PopupRichTextEditor: {
    input: { label: '본문', initialBlocks: SAMPLE_BLOCKS, compact: false, disabled: false, placeholder: '본문을 입력하세요' },
    hint: 'initialBlocks·compact·disabled를 바꿔 실행해 보세요. 편집기에 입력하면 onChange(blocks, plainText)가 OUTPUT에 나옵니다.',
    render: (input, emit) => (
      <PopupRichTextEditor label={input.label} initialBlocks={readTextBlocks(input.initialBlocks) ?? []} compact={input.compact}
        disabled={input.disabled} placeholder={input.placeholder} onChange={(blocks, plainText) => emit('onChange', { blocks, plainText })} />
    ),
  },
  PopupRichBlocks: {
    input: { blocks: SAMPLE_BLOCKS },
    hint: 'blocks의 alignment(LEFT·CENTER·RIGHT)·indent·runs 서식(bold·italic·underline·strikethrough·color·size·font)을 바꿔 보세요.',
    render: (input) => <PopupRichBlocks blocks={readTextBlocks(input.blocks) ?? []} />,
  },
  PopupQuestionEditor: {
    input: { quiz: false, passingScore: null, questions: SAMPLE_QUESTIONS },
    hint: 'quiz를 true로 바꾸면 정답·배점·통과 점수 입력이 나옵니다. 문항을 고치면 onChange(questions)와 검사 결과가 OUTPUT에 나옵니다.',
    render: (input, emit) => <QuestionHost input={input} emit={emit} />,
  },
  PopupQuizRuleFields: {
    input: { questionCount: 5, rule: 'CUTOFF', count: 3 },
    hint: "rule: 'FULL'(만점 통과) · 'CUTOFF'(커트라인) · 'PASS_FAIL'(통과/실패 제출). 문항 1점 기준으로 통과 점수를 계산합니다.",
    render: (input, emit) => <QuizRuleHost input={input} emit={emit} />,
  },
  PopupScheduleFields: {
    input: { periodMode: 'SCHEDULE', repeatDayOfWeek: '1,3,5', displayTimes: [{ startTime: '09:00', endTime: '12:00' }] },
    hint: "periodMode: 'FIXED'(상시) · 'SCHEDULE'(지정). repeatDayOfWeek는 ISO 요일(1=월) 쉼표 목록, 비우면 매일.",
    render: (input, emit) => <ScheduleHost input={input} emit={emit} />,
  },
  InlinePopupPreview: {
    input: TEXT_PATCH,
    hint: '화면 state 값입니다(미리보기 fallback만 채움). popupType·title·content를 바꿔 보세요("실제 크기로 보기"를 누르면 onOpenPreview).',
    render: (input, emit) => (
      <InlinePopupPreview popup={samplePopup(input)} onOpenPreview={() => emit('onOpenPreview', '호출됨')} onRecommendedSize={(size) => emit('onRecommendedSize', size)} />
    ),
  },
  PopupPreviewDialog: {
    input: { ...TEXT_PATCH, content: { ...TEXT_PATCH.content, popupPosition: 'TOP_RIGHT', backgroundOverlayOpacity: 0.3 } },
    hint: 'content.popupPosition(TOP_LEFT~BOTTOM_RIGHT 9방향)·useBackgroundOverlay·backgroundOverlayOpacity를 바꾸고 열어 보세요.',
    render: (input, emit) => <DialogHost popup={samplePopup(input)} emit={emit} />,
  },
  PopupPreview: {
    input: { popup: TEXT_PATCH, showBackground: false },
    hint: 'popup은 화면 state 값입니다(미리보기 fallback만 채움). 푸터 버튼을 누르면 onClose가 OUTPUT에 나옵니다.',
    render: (input, emit) => (
      <PopupPreview popup={samplePopup(input.popup)} showBackground={input.showBackground} onClose={() => emit('onClose', '호출됨')}
        onRecommendedSize={(size) => emit('onRecommendedSize', size)} />
    ),
  },
};

/** 실행기가 없는 컴포넌트의 안내 */
export const RUNNER_NOTES: Record<string, string> = {
  PopupRichTextMenu: 'CKEditor 인스턴스가 필요해 단독 실행기가 없습니다. PopupRichTextEditor 실행기에서 글자를 선택하고 우클릭(또는 서식 버튼)하면 이 패널이 열립니다.',
};
