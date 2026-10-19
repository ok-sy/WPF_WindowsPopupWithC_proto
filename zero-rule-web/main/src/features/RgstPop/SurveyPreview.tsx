import type { PopupQuestion } from '@local/domain';
import { Box, Stack, Typography } from '@mui/material';
import PopupRichBlocks, { richBlocksOrNull } from './PopupRichBlocks';

/*
 * 문항 디자인 버전. WPF SurveyDesigns/SurveyStyles.Vn.xaml과 같은 값이다. WPF는 appsettings PopupApi.SurveyDesignVersion으로
 * 고르므로, 바꿀 때 SURVEY_DESIGN_VERSION도 같은 값으로 맞춘다.
 *   V1: 무채색 카드형(흰 콘텐츠, #F8F8F8 문항 카드, 회색 선택 배경·SemiBold, 세로형은 옅은 체크 상시 표시, 가로형 체크 없음)
 *   V2(TODO56): 흰 본문, 문항 카드 없이 간격·구분선(마지막 문항 제외), 선택지 라운드 6, 라디오·체크박스 표시 없음,
 *       선택 = #171717 2px 테두리(크기 불변) + 세로형만 오른쪽 체크, 선택해도 굵기·글자색 불변, 포커스 점선,
 *       제목 끝 "하나 선택"/"여러 개 선택 가능" 안내, 기본 글자 #222222.
 */
const commonSurveyColors = {
  page: '#FFFFFF',
  content: '#FFFFFF',
  border: '#E5E5E5',
  muted: '#737373',
  placeholder: '#A3A3A3',
  check: '#D4D4D4',
  rowHover: '#F5F5F5',
  chipHover: '#F1F1F1',
  pressed: '#E2E2E2',
  button: '#4A4A4F',
  buttonHover: '#3D3D42',
  buttonPressed: '#303035',
};

export const surveyDesigns = {
  V1: {
    flatQuestions: false,
    choiceRadius: 11,
    selectedBold: true,
    selectedRing: false,
    rowCheckAlways: true,
    choiceHint: false,
    colors: {
      ...commonSurveyColors,
      card: '#F8F8F8',
      text: '#18181B',
      choice: '#27272A',
      focus: '#737373',
      hoverBorder: '#D4D4D4',
      rowSelected: '#ECECEC',
      chipSelected: '#EAEAEA',
      selectedBorder: '#AFAFAF',
      selectedCheck: '#18181B',
    },
  },
  V2: {
    flatQuestions: true,
    choiceRadius: 6,
    selectedBold: false,
    selectedRing: true,
    rowCheckAlways: false,
    choiceHint: true,
    colors: {
      ...commonSurveyColors,
      card: 'transparent',
      text: '#222222',
      choice: '#222222',
      focus: '#171717',
      hoverBorder: '#8C8C8C',
      rowSelected: '#FFFFFF',
      chipSelected: '#FFFFFF',
      selectedBorder: '#171717',
      selectedCheck: '#171717',
    },
  },
} as const;

export type SurveyDesignVersion = keyof typeof surveyDesigns;
export const SURVEY_DESIGN_VERSION: SurveyDesignVersion = 'V2';
const surveyDesign = surveyDesigns[SURVEY_DESIGN_VERSION];
export const surveyColors = surveyDesign.colors;

export const surveySubmitSx = {
  minWidth: 132,
  height: 46,
  px: 3,
  borderRadius: '11px',
  border: 0,
  boxShadow: 'none',
  bgcolor: surveyColors.button,
  color: surveyColors.page,
  fontWeight: 600,
  '&:hover': { bgcolor: surveyColors.buttonHover, boxShadow: 'none' },
  '&:active': { bgcolor: surveyColors.buttonPressed },
  '&:focus-visible': { outline: `1px dashed ${surveyColors.focus}`, outlineOffset: 3 },
  '&.Mui-disabled': { bgcolor: surveyColors.border, color: surveyColors.placeholder },
};

export interface PreviewAnswer {
  optionIds: number[];
  text: string;
}
export interface SurveyPreviewProps {
  questions: PopupQuestion[];
  description: string;
  /** [TODO55] 콘텐츠 설명 서식(content.descriptionBlocks). 글자가 있으면 description 대신 표시한다. */
  descriptionBlocks?: unknown;
  answers: Record<number, PreviewAnswer>;
  onAnswer: (id: number, answer: PreviewAnswer) => void;
  disabled: boolean;
  namePrefix: string;
}

// 세로형 오른쪽 체크(28px 열 예약). V1은 선택 전에도 옅게 보이고, V2는 선택했을 때만 보인다.
function CheckMark({ selected, disabled }: { selected: boolean; disabled: boolean }) {
  if (!surveyDesign.rowCheckAlways && !selected) return <Box aria-hidden="true" />;
  return (
    <Box
      component="svg"
      viewBox="0 0 16 12"
      width={16}
      height={12}
      aria-hidden="true"
      focusable="false"
      sx={{ justifySelf: 'end', overflow: 'visible' }}
    >
      <path
        className="survey-check"
        d="M 1,5 L 5,9 L 13,1"
        fill="none"
        stroke={selected && !disabled ? surveyColors.selectedCheck : surveyColors.check}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

export default function SurveyPreview({
  questions,
  description,
  descriptionBlocks,
  answers,
  onAnswer,
  disabled,
  namePrefix,
}: SurveyPreviewProps) {
  const richDescription = richBlocksOrNull(descriptionBlocks);
  return (
    <Stack spacing={surveyDesign.flatQuestions ? 0 : 1.75} sx={{ maxWidth: 760, mx: 'auto', color: surveyColors.text }}>
      {(description || richDescription) && (
        <Typography component="div" sx={{ color: surveyColors.muted, fontSize: 14, mb: 0.5 }}>
          {richDescription ? <PopupRichBlocks blocks={richDescription} /> : description}
        </Typography>
      )}
      {!questions.length && (
        <Typography sx={{ color: surveyColors.muted, fontSize: 14 }}>
          문항을 추가하거나 예제 문항을 확인해주세요.
        </Typography>
      )}
      {questions.map((question, index) => {
        const horizontal = question.optionLayout === 'HORIZONTAL';
        const multiple = question.questionType === 'MULTIPLE_CHOICE';
        const answer = answers[question.questionId] ?? { optionIds: [], text: '' };
        const titleId = `${namePrefix}-question-${question.questionId}`;
        const hint = !surveyDesign.choiceHint || question.questionType === 'TEXT'
          ? null
          : multiple ? '여러 개 선택 가능' : '하나 선택';
        const last = index === questions.length - 1;
        // [TODO55] 서식이 있으면 서식으로 표시(WPF와 같이 필수 표시·선택 안내는 마지막 문단 끝).
        const richTitle = richBlocksOrNull(question.titleBlocks);
        const richQuestionDescription = richBlocksOrNull(question.descriptionBlocks);
        const titleSuffix = <>
          {question.isRequired ? ' *' : ''}
          {hint && (
            // 제목 끝 보조 안내(WPF와 같이 12·보통 굵기·보조색). 긴 제목이면 글자 흐름대로 다음 줄로 넘어간다.
            <Box
              component="span"
              id={`${titleId}-hint`}
              sx={{ ml: 1.5, fontSize: 12, fontWeight: 400, color: surveyColors.muted, whiteSpace: 'nowrap' }}
            >
              {hint}
            </Box>
          )}
        </>;
        return (
          <Box
            component="fieldset"
            key={question.questionId}
            disabled={disabled}
            aria-labelledby={titleId}
            aria-describedby={hint ? `${titleId}-hint` : undefined}
            sx={{
              minWidth: 0,
              m: 0,
              border: 0,
              bgcolor: surveyColors.card,
              // V2: 카드 표면 없이 간격과 문항 사이 구분선(마지막 문항 제외). V1: 둥근 회색 카드.
              ...(surveyDesign.flatQuestions
                ? { p: '20px 0 22px', borderRadius: 0, borderBottom: last ? 0 : `1px solid ${surveyColors.border}` }
                : { p: '20px 20px 18px', borderRadius: '11px' }),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography
                component="span"
                sx={{ fontSize: 12, fontWeight: 600, color: surveyColors.muted }}
              >
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Typography
                id={titleId}
                component="div"
                sx={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', minWidth: 0 }}
              >
                {richTitle ? <PopupRichBlocks blocks={richTitle} trailing={titleSuffix} /> : <>{question.title}{titleSuffix}</>}
              </Typography>
            </Stack>
            {(question.description || richQuestionDescription) && (
              <Typography component="div" sx={{ fontSize: 13, color: surveyColors.muted, mt: 0.75 }}>
                {richQuestionDescription ? <PopupRichBlocks blocks={richQuestionDescription} /> : question.description}
              </Typography>
            )}
            <Box
              sx={{
                mt: 1.75,
                display: 'flex',
                flexDirection: horizontal ? 'row' : 'column',
                flexWrap: 'wrap',
                gap: 1,
                minWidth: 0,
              }}
            >
              {question.questionType === 'TEXT' ? (
                <Box
                  component="textarea"
                  value={answer.text}
                  aria-labelledby={titleId}
                  placeholder="추가 의견이 있다면 자유롭게 작성해주세요."
                  disabled={disabled}
                  onChange={(event) =>
                    onAnswer(question.questionId, { ...answer, text: event.target.value })
                  }
                  sx={{
                    width: '100%',
                    minHeight: 96,
                    maxHeight: 180,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    border: `1px solid ${surveyColors.border}`,
                    borderRadius: '10px',
                    p: '14px 16px',
                    bgcolor: surveyColors.page,
                    color: surveyColors.text,
                    font: 'inherit',
                    lineHeight: '22px',
                    outline: 'none',
                    '&::placeholder': { color: surveyColors.placeholder },
                    '&:focus': { borderColor: surveyColors.focus },
                    '&:disabled': { opacity: 0.45 },
                  }}
                />
              ) : (
                question.options.map((option) => {
                  const selected = answer.optionIds.includes(option.optionId);
                  const richOption = richBlocksOrNull(option.textBlocks);
                  // 서식 선택지도 접근 가능한 이름은 일반 문구(text)다(WPF AutomationProperties.Name과 같음).
                  const optionLabel = richOption ? <PopupRichBlocks blocks={richOption} /> : option.text;
                  const select = () =>
                    onAnswer(question.questionId, {
                      text: '',
                      optionIds: multiple
                        ? selected
                          ? answer.optionIds.filter((id) => id !== option.optionId)
                          : [...answer.optionIds, option.optionId]
                        : [option.optionId],
                    });
                  return (
                    <Box
                      component="label"
                      key={option.optionId}
                      sx={{
                        position: 'relative',
                        display: 'block',
                        minWidth: 0,
                        maxWidth: '100%',
                        width: horizontal ? 'auto' : '100%',
                        cursor: disabled ? 'default' : 'pointer',
                        // V2 포커스는 선택 테두리를 덮지 않고 바깥 점선으로만 표시한다.
                        '& input:focus-visible + .survey-option': surveyDesign.selectedRing
                          ? { outline: `1.5px dashed ${surveyColors.focus}`, outlineOffset: 4 }
                          : { borderColor: surveyColors.focus, outline: `1px dashed ${surveyColors.focus}`, outlineOffset: 3 },
                        '&:hover .survey-option': !disabled
                          ? {
                              bgcolor: selected
                                ? horizontal
                                  ? surveyColors.chipSelected
                                  : surveyColors.rowSelected
                                : horizontal
                                  ? surveyColors.chipHover
                                  : surveyColors.rowHover,
                              borderColor: selected
                                ? surveyColors.selectedBorder
                                : surveyColors.hoverBorder,
                            }
                          : {},
                        '&:hover .survey-check':
                          !disabled && !selected ? { stroke: surveyColors.placeholder } : {},
                        '&:active .survey-option': !disabled
                          ? { bgcolor: surveyColors.pressed }
                          : {},
                      }}
                    >
                      <Box
                        component="input"
                        type={multiple ? 'checkbox' : 'radio'}
                        name={`${namePrefix}-${question.questionId}`}
                        checked={selected}
                        disabled={disabled}
                        aria-label={option.text}
                        onChange={select}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            select();
                          }
                        }}
                        sx={{ position: 'absolute', width: 1, height: 1, p: 0, m: 0, opacity: 0 }}
                      />
                      <Box
                        className="survey-option"
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: horizontal ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 28px',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          minHeight: horizontal ? 44 : 48,
                          p: horizontal ? '10px 14px' : '12px 16px',
                          border: '1px solid',
                          borderRadius: `${surveyDesign.choiceRadius}px`,
                          // V2 선택: 1px 테두리 안쪽에 1px를 더 그려 2px로 보이게 한다(크기 불변).
                          boxShadow: selected && surveyDesign.selectedRing
                            ? `inset 0 0 0 1px ${surveyColors.selectedBorder}`
                            : 'none',
                          bgcolor: selected
                            ? horizontal
                              ? surveyColors.chipSelected
                              : surveyColors.rowSelected
                            : surveyColors.page,
                          borderColor: selected ? surveyColors.selectedBorder : surveyColors.border,
                          color: selected && surveyDesign.selectedBold ? surveyColors.text : surveyColors.choice,
                          opacity: disabled ? 0.45 : 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'grid',
                            minWidth: 0,
                            lineHeight: '22px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {surveyDesign.selectedBold && (
                            // V1: 선택 시 굵게 바뀌어도 줄바꿈 높이가 변하지 않도록 굵은 글자 높이를 미리 확보한다.
                            <Box
                              component="span"
                              aria-hidden="true"
                              sx={{ gridArea: '1 / 1', fontWeight: 600, visibility: 'hidden' }}
                            >
                              {optionLabel}
                            </Box>
                          )}
                          <Box
                            component="span"
                            sx={{ gridArea: '1 / 1', fontWeight: selected && surveyDesign.selectedBold ? 600 : 400 }}
                          >
                            {optionLabel}
                          </Box>
                        </Box>
                        {!horizontal && <CheckMark selected={selected} disabled={disabled} />}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
