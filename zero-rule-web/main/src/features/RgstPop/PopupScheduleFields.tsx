import type { AdminPopupDetail, PopupDisplayTime } from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, FormControlLabel, IconButton, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { WEEKDAYS, describeSchedule, parseWeekdays } from './popupEditorTransform';

type ScheduleFields = Pick<AdminPopupDetail, 'periodMode' | 'repeatDayOfWeek' | 'displayTimes'>;

/**
 * [TODO52-1] 게시 기간 안 노출 일정 저장 전 확인. 서버(PopupDisplaySchedule)와 같은 규칙이며 위반 시 안내 문구를 돌려준다.
 * 시간대 개수·자정 초과는 제한하지 않는다(종료가 시작보다 이르면 다음 날까지).
 */
export function validatePopupSchedule(popup: ScheduleFields): string | null {
  if (popup.periodMode !== 'SCHEDULE') return null;
  const seen = new Set<string>();
  for (const [index, time] of (popup.displayTimes ?? []).entries()) {
    const label = `노출 시간대 ${index + 1}: `;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time.endTime)) return label + '시작·종료 시각을 입력해 주세요.';
    if (time.startTime === time.endTime) return label + '시작과 종료가 같을 수 없습니다.';
    const key = `${time.startTime}-${time.endTime}`;
    if (seen.has(key)) return label + '같은 시간대가 이미 있습니다.';
    seen.add(key);
  }
  return null;
}

/**
 * [TODO52-1] 게시 기간 안 요일·시간대 입력. 끄면 FIXED(게시 기간 내 상시), 켜면 SCHEDULE.
 * 요일을 고르지 않으면 매일, 시간대가 없으면 하루 종일이다. 노출 판단은 서버가 KST로 하며 조회 주기(30~60분) 때문에
 * 짧은 시간대나 다른 팝업 표시 중에 지나간 시간대는 놓칠 수 있다(확정 정책).
 */
export default function PopupScheduleFields({ popup, onChange }: {
  popup: ScheduleFields;
  onChange: (patch: Partial<ScheduleFields>) => void;
}) {
  const scheduled = popup.periodMode === 'SCHEDULE';
  const days = parseWeekdays(popup.repeatDayOfWeek);
  const times = popup.displayTimes ?? [];
  const setTime = (index: number, patch: Partial<PopupDisplayTime>) =>
    onChange({ displayTimes: times.map((time, i) => (i === index ? { ...time, ...patch } : time)) });
  return (
    <Stack spacing={1.25}>
      <FormControlLabel
        control={<Switch checked={scheduled} onChange={(_, checked) => onChange({ periodMode: checked ? 'SCHEDULE' : 'FIXED' })} />}
        label="노출 요일·시간대 지정" />
      <Typography variant="caption" color="text.secondary" aria-live="polite">
        노출 일정: {describeSchedule(popup.periodMode, popup.repeatDayOfWeek, times)} (게시 기간 안, 서버 한국 시간 기준)
      </Typography>
      {scheduled && <>
        <Box>
          <ToggleButtonGroup size="small" value={days} aria-label="노출 요일"
            onChange={(_, value: number[]) => onChange({ repeatDayOfWeek: value.length ? [...value].sort().join(',') : null })}>
            {WEEKDAYS.map((day) => <ToggleButton key={day.value} value={day.value} aria-label={`${day.label}요일`} sx={{ px: 1.5 }}>{day.label}</ToggleButton>)}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>요일을 선택하지 않으면 매일 노출합니다.</Typography>
        </Box>
        {times.map((time, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <TextField size="small" type="time" label={`시작 ${index + 1}`} value={time.startTime} InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }} onChange={(event) => setTime(index, { startTime: event.target.value })} />
            <Typography color="text.secondary">~</Typography>
            <TextField size="small" type="time" label={`종료 ${index + 1}`} value={time.endTime} InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }} onChange={(event) => setTime(index, { endTime: event.target.value })}
              helperText={time.endTime && time.startTime && time.endTime < time.startTime ? '다음 날까지(자정 초과)' : ' '} />
            <IconButton aria-label={`노출 시간대 ${index + 1} 삭제`} onClick={() => onChange({ displayTimes: times.filter((_, i) => i !== index) })}>
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => onChange({ displayTimes: [...times, { startTime: '09:00', endTime: '18:00' }] })}>
            시간대 추가
          </Button>
          <Typography variant="caption" color="text.secondary" component="p">
            시간대가 없으면 하루 종일 노출합니다. 종료가 시작보다 이르면 다음 날까지 이어집니다(요일은 시작 기준).
            조회 주기(30~60분) 때문에 짧은 시간대나 다른 팝업을 보는 동안 지나간 시간대는 표시되지 않을 수 있습니다.
          </Typography>
        </Box>
      </>}
    </Stack>
  );
}
