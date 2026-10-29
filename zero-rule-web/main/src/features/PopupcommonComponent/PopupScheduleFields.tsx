import type { PopupDateValue, PopupDisplayTime } from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, FormControlLabel, IconButton, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { WEEKDAYS, describeSchedule, parseWeekdays, toDateTimeLocal } from './popupEditorTransform';

/**
 * POL-11-03 : 시간 경계
 * ■ 노출 일정 값(일정 전용 입력)
 * - in : 없음(타입)
 * - out: periodMode(FIXED | SCHEDULE) · repeatDayOfWeek?(ISO 요일 '1,3,5', 비우면 매일) · displayTimes?(시간대, 비우면 하루 종일)
 *        · displayStartAt?/displayEndAt?(게시 기간, showPeriod일 때만 입력)
 * - AdminPopupDetail 전체가 아니라 일정에 필요한 필드만 담는다. AdminPopupDetail도 이 모양을 포함하므로 그대로 넘길 수 있다.
 */
export interface PopupScheduleValue {
  periodMode: string;
  repeatDayOfWeek?: string | null;
  displayTimes?: PopupDisplayTime[];
  displayStartAt?: PopupDateValue;
  displayEndAt?: PopupDateValue;
}
type ScheduleFields = PopupScheduleValue;

/**
 * POL-11-02 : 반복의 의미
 * POL-11-03 : 시간 경계
 * ■ 노출 일정 저장 전 확인
 * - in : popup(ScheduleFields) periodMode·repeatDayOfWeek·displayTimes
 * - out: string | null 첫 번째 위반 안내 문구, 문제없으면 null(SCHEDULE이 아니면 항상 null)
 * - 게시 기간 안 노출 시간대를 받아 서버(PopupDisplaySchedule)와 같은 규칙(HH:mm 형식, 시작≠종료, 중복 없음)으로 확인한다.
 *   시간대 개수·자정 초과는 제한하지 않는다(종료가 시작보다 이르면 다음 날까지).
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
 * POL-11-02 : 반복의 의미
 * POL-11-03 : 시간 경계
 * ■ 노출 요일·시간대 입력
 * - in : value(PopupScheduleValue) periodMode·repeatDayOfWeek·displayTimes(·게시 기간) 현재 값 — 기존 popup prop도 받는다 · showPeriod?(boolean) 게시 기간 입력 표시
 * - out: onChange(patch: Partial<PopupScheduleValue>) 바뀐 항목만 담은 부분 값 · 화면: (게시 기간)·지정 스위치·일정 요약·요일 버튼·시간대 목록
 * - 노출 일정 값을 받아 게시 기간 안 요일·시간대를 입력하게 한다. 스위치를 끄면 FIXED(게시 기간 내 상시), 켜면 SCHEDULE.
 *   요일을 고르지 않으면 매일, 시간대가 없으면 하루 종일이다. 노출 판단은 서버가 KST로 하며 조회 주기(30~60분) 때문에
 *   짧은 시간대나 다른 팝업 표시 중에 지나간 시간대는 놓칠 수 있다(서버 정책. 화면 문구는 안내용).
 */
export default function PopupScheduleFields({ value, popup: legacyValue, onChange, showPeriod = false }: {
  /** 일정 값(권장). AdminPopupDetail 전체가 필요 없다. */
  value?: ScheduleFields;
  /** @deprecated value를 쓴다. 기존 호출부 호환용(같은 값). */
  popup?: ScheduleFields;
  /** 바뀐 항목만 담은 부분 값. 게시 기간은 입력란 문자열(YYYY-MM-DDTHH:mm) 그대로이며 날짜 직렬화는 부모(업무 경계)가 한다. */
  onChange: (patch: Partial<ScheduleFields>) => void;
  /** true면 게시 기간(시작·종료) 입력도 함께 보여 준다. 기본 false(기존 등록 화면은 게시 기간 입력을 따로 둔다). */
  showPeriod?: boolean;
}) {
  const popup: ScheduleFields = value ?? legacyValue ?? { periodMode: 'FIXED' };
  const scheduled = popup.periodMode === 'SCHEDULE';
  const days = parseWeekdays(popup.repeatDayOfWeek);
  const times = popup.displayTimes ?? [];
  const setTime = (index: number, patch: Partial<PopupDisplayTime>) =>
    onChange({ displayTimes: times.map((time, i) => (i === index ? { ...time, ...patch } : time)) });
  return (
    <Stack spacing={1.25}>
      {showPeriod && (
        <Stack direction="row" spacing={1.5}>
          <TextField size="small" type="datetime-local" label="게시 시작" value={popup.displayStartAt != null ? toDateTimeLocal(popup.displayStartAt) : ''}
            InputLabelProps={{ shrink: true }} onChange={(event) => onChange({ displayStartAt: event.target.value })} sx={{ flex: 1 }} />
          <TextField size="small" type="datetime-local" label="게시 종료" value={popup.displayEndAt != null ? toDateTimeLocal(popup.displayEndAt) : ''}
            InputLabelProps={{ shrink: true }} onChange={(event) => onChange({ displayEndAt: event.target.value })} sx={{ flex: 1 }} />
        </Stack>
      )}
      <FormControlLabel
        control={<Switch checked={scheduled} onChange={(_, checked) => onChange({ periodMode: checked ? 'SCHEDULE' : 'FIXED' })} />}
        label="노출 요일·시간대 지정" />
      <Typography variant="caption" color="text.secondary" aria-live="polite">
        노출 일정: {describeSchedule(popup.periodMode, popup.repeatDayOfWeek, times)} (게시 기간 안 · 안내용 요약이며 최종 노출은 서버가 한국 시간으로 판단)
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
