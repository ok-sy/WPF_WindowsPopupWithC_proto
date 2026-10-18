import type { PopupQuestion } from '@local/domain';
import { Box, Stack, Typography } from '@mui/material';

/*
 * 문항 디자인 버전. WPF SurveyDesigns/SurveyStyles.Vn.xaml과 같은 값이며, 지난 버전은 고치지 않고 새 버전을 추가한다.
 *   V1: 무채색(흰 콘텐츠, #F8F8F8 문항 카드, 회색 선택 배경, 가로형 체크 없음)
 *   V2: 콘텐츠 #F5F6F8, 문항·선택지 흰색, 선택 = 공통 강조 #171717 테두리 + 체크(가로형 포함), 기본 글자 #222222
 * WPF는 appsettings PopupApi.SurveyDesignVersion으로 고르므로, 바꿀 때 SURVEY_DESIGN_VERSION도 같은 값으로 맞춘다.
 */
const commonSurveyColors = {
  page: '#FFFFFF',
  border: '#E5E5E5',
  muted: '#737373',
  placeholder: '#A3A3A3',
  check: '#D4D4D4',
  focus: '#737373',
  rowHover: '#F5F5F5',
  chipHover: '#F1F1F1',
  pressed: '#E2E2E2',
  button: '#4A4A4F',
  buttonHover: '#3D3D42',
  buttonPressed: '#303035',
};

export const surveyDesigns = {
  V1: {
    chipCheck: false,
    colors: {
      ...commonSurveyColors,
      content: '#FFFFFF',
      card: '#F8F8F8',
      text: '#18181B',
      choice: '#27272A',
      rowSelected: '#ECECEC',
      chipSelected: '#EAEAEA',
      selectedBorder: '#AFAFAF',
      selectedCheck: '#18181B',
    },
  },
  V2: {
    chipCheck: true,
    colors: {
      ...commonSurveyColors,
      content: '#F5F6F8',
      card: '#FFFFFF',
      text: '#222222',
      choice: '#222222',
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
  answers: Record<number, PreviewAnswer>;
  onAnswer: (id: number, answer: PreviewAnswer) => void;
  disabled: boolean;
  namePrefix: string;
}

// 체크 표시는 선택 전에도 자리를 차지해(옅은 색) 선택 시 선택지 폭이 바뀌지 않는다. 세로형은 오른쪽, 가로형은 왼쪽.
function CheckMark({ selected, disabled, align }: { selected: boolean; disabled: boolean; align: 'start' | 'end' }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 16 12"
      width={16}
      height={12}
      aria-hidden="true"
      focusable="false"
      sx={{ justifySelf: align, overflow: 'visible' }}
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
  answers,
  onAnswer,
  disabled,
  namePrefix,
}: SurveyPreviewProps) {
  return (
    <Stack spacing={1.75} sx={{ maxWidth: 760, mx: 'auto', color: surveyColors.text }}>
      {description && (
        <Typography sx={{ color: surveyColors.muted, fontSize: 14, mb: 0.5 }}>
          {description}
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
        return (
          <Box
            component="fieldset"
            key={question.questionId}
            disabled={disabled}
            aria-labelledby={titleId}
            sx={{
              minWidth: 0,
              m: 0,
              p: '20px 20px 18px',
              border: 0,
              borderRadius: '11px',
              bgcolor: surveyColors.card,
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
                sx={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', minWidth: 0 }}
              >
                {question.title}
                {question.isRequired ? ' *' : ''}
              </Typography>
            </Stack>
            {question.description && (
              <Typography sx={{ fontSize: 13, color: surveyColors.muted, mt: 0.75 }}>
                {question.description}
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
                        '& input:focus-visible + .survey-option': {
                          borderColor: surveyColors.focus,
                          outline: `1px dashed ${surveyColors.focus}`,
                          outlineOffset: 3,
                        },
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
                                : surveyColors.check,
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
                          gridTemplateColumns: horizontal
                            ? surveyDesign.chipCheck
                              ? '22px minmax(0, 1fr)'
                              : 'minmax(0, 1fr)'
                            : 'minmax(0, 1fr) 28px',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          minHeight: horizontal ? 44 : 48,
                          p: horizontal ? '10px 14px' : '12px 16px',
                          border: '1px solid',
                          borderRadius: '11px',
                          bgcolor: selected
                            ? horizontal
                              ? surveyColors.chipSelected
                              : surveyColors.rowSelected
                            : surveyColors.page,
                          borderColor: selected ? surveyColors.selectedBorder : surveyColors.border,
                          color: selected ? surveyColors.text : surveyColors.choice,
                          opacity: disabled ? 0.45 : 1,
                        }}
                      >
                        {horizontal && surveyDesign.chipCheck && (
                          <CheckMark selected={selected} disabled={disabled} align="start" />
                        )}
                        <Box
                          sx={{
                            display: 'grid',
                            minWidth: 0,
                            lineHeight: '22px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          <Box
                            component="span"
                            aria-hidden="true"
                            sx={{ gridArea: '1 / 1', fontWeight: 600, visibility: 'hidden' }}
                          >
                            {option.text}
                          </Box>
                          <Box
                            component="span"
                            sx={{ gridArea: '1 / 1', fontWeight: selected ? 600 : 400 }}
                          >
                            {option.text}
                          </Box>
                        </Box>
                        {!horizontal && <CheckMark selected={selected} disabled={disabled} align="end" />}
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
