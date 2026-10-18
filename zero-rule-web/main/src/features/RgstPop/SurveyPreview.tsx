import type { PopupQuestion } from '@local/domain';
import { Box, Stack, Typography } from '@mui/material';

// WPF SurveyStyles.xaml과 같은 색: 콘텐츠 배경 옅은 회색, 문항 카드·선택지 흰색, 선택 = 공통 강조 테두리 + 체크, 기본 글자 #222222.
export const surveyColors = {
  page: '#FFFFFF',
  content: '#F5F6F8',
  card: '#FFFFFF',
  border: '#E5E5E5',
  text: '#222222',
  choice: '#222222',
  muted: '#737373',
  placeholder: '#A3A3A3',
  check: '#D4D4D4',
  focus: '#737373',
  rowHover: '#F5F5F5',
  rowSelected: '#FFFFFF',
  chipHover: '#F1F1F1',
  chipSelected: '#FFFFFF',
  selectedBorder: '#171717',
  pressed: '#E2E2E2',
  button: '#4A4A4F',
  buttonHover: '#3D3D42',
  buttonPressed: '#303035',
};

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
        stroke={selected && !disabled ? surveyColors.selectedBorder : surveyColors.check}
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
                            ? '22px minmax(0, 1fr)'
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
                        {horizontal && <CheckMark selected={selected} disabled={disabled} align="start" />}
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
