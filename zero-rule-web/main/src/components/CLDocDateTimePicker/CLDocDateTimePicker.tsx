import theme from '@/theme';
import { flatSx } from '@local/ui';
import { pdate } from '@local/util';
import EventIcon from '@mui/icons-material/Event';
import type { SxProps, Theme } from '@mui/material';
import {
  alpha,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import clsx from 'clsx';
import React, { useState } from 'react';
import { paperProps, rootSx } from './style';

const pad = (v: number): string => (v < 10 ? `0${v}` : v.toString());

const fixDate = (date: Date, hour: number, minute: number) => {
  date.setMinutes(minute);
  date.setHours(hour);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};
type Props = {
  sx?: SxProps<Theme>;
  className?: string;
  fulllWidth?: boolean;
  value?: Date;
  title?: string;
  newDateSubmit: (date: Date) => void;
};
const CLDocDateTimePicker = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { sx, className, newDateSubmit, value: initialDate = new Date(), ...restProps } = props;
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const smOrDown = useMediaQuery(theme.breakpoints.down('md'));
  const [date, setDate] = useState<Date>(initialDate);
  const [minute, setMinute] = useState(initialDate.getMinutes());
  const [hour, setHour] = useState(initialDate.getHours());

  // 텍스트필드에 들어갈 시간값 포멧
  const formatEventDateTime = (input: Date | number): string => {
    const date = typeof input === 'number' ? new Date(input * 1000) : input;
    const now = new Date();
    let fmt = '';
    if (date.getFullYear() === now.getFullYear()) {
      fmt = 'M월 d일 H시 m분';
    } else {
      fmt = 'yyyy년 M월 d일 H시 m분';
    }

    return pdate.formatter.format(date, fmt) ?? '';
  };
  // 달력아이콘 클릭
  const handleClickPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  // 팝오버 닫힘
  const handleClosePopover = () => {
    setAnchorEl(null);
    newDateSubmit(fixDate(date, hour, minute));
  };
  // 날자데이터 전송
  const _onClickSubmit = () => {
    newDateSubmit(fixDate(date, hour, minute));
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLDocDateTimePicker-root', className)}>
      <TextField
        value={formatEventDateTime(fixDate(date, hour, minute))}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClickPopover}>
                  <EventIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter') {
            _onClickSubmit();
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: paperProps,
        }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <Stack direction={smOrDown ? 'column' : 'row'} spacing={1} sx={{ bgcolor: '#fff' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={date}
                onChange={(newValue) => {
                  if (newValue) setDate(fixDate(newValue, hour, minute));
                }}
              />
            </LocalizationProvider>
            <Stack
              direction="row"
              sx={{
                maxWidth: {
                  xs: undefined,
                  md: 200,
                },
                borderLeft: '1px solid #e0e0e0',
              }}
            >
              <Box
                sx={{
                  maxHeight: 263,
                  maxWidth: 64.5,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webKit-scrollbar': {
                    display: 'none',
                  },
                }}
              >
                {Array.from({ length: 24 }).map((_, hh) => (
                  <Button
                    key={hh}
                    color={hh === hour ? 'primary' : 'inherit'}
                    size="small"
                    onClick={() => setHour(hh)}
                    sx={
                      hh === hour
                        ? {
                            backgroundColor: (theme: Theme) =>
                              alpha(theme.palette.primary.main, 0.09),
                          }
                        : {}
                    }
                  >
                    {pad(hh)}
                    <span className="CLDocDateTimePicker-suffix">시</span>
                  </Button>
                ))}
              </Box>
              <Divider />
              <Box sx={{ maxHeight: 370, maxWidth: 67, borderLeft: '1px solid #e0e0e0' }}>
                {[0, 10, 20, 30, 40, 50, 59].map((mm) => (
                  <Button
                    key={mm}
                    color={mm === minute ? 'primary' : 'inherit'}
                    size="small"
                    onClick={() => setMinute(mm)}
                    sx={
                      mm === minute
                        ? {
                            backgroundColor: (theme: Theme) =>
                              alpha(theme.palette.primary.main, 0.09),
                          }
                        : {}
                    }
                  >
                    {mm}
                    <span className="CLDocDateTimePicker-suffix">분</span>
                  </Button>
                ))}
              </Box>
            </Stack>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={_onClickSubmit} disabled={!date}>
            입력 완료
          </Button>
        </Box>
      </Popover>
    </Box>
  );
});

CLDocDateTimePicker.displayName = 'CLDocDateTimePicker';
export default CLDocDateTimePicker;
