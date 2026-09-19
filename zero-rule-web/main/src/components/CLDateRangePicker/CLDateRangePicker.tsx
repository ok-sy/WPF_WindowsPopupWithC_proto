import { flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { rootSx, useStyles } from './style';

type Props = {
  sx?: SxProps;
  className?: string;
  startDate: Date;
  endDate: Date;
  onSubmitSrtDtEndDt: (srtDt: Date, endDt: Date) => void;
};

// 기간을 정하는 캘린더
export default function CLDateRangePicker(props: Props) {
  const { className, sx, startDate, endDate, onSubmitSrtDtEndDt } = props;
  const onSubmitSrtDtEndDtFnRef = useRef<Props['onSubmitSrtDtEndDt']>();
  onSubmitSrtDtEndDtFnRef.current = onSubmitSrtDtEndDt;
  const classes = useStyles();

  const [srtDt, setSrtDt] = useState<Date>(startDate);
  const [endDt, setEndDt] = useState<Date>(endDate);

  const handleSrtDtChange = (newValue: Date) => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 100000);
    today.setDate(today.getDate() - 1);
    // if (newValue <= today) {
    //   toast.error('오늘보다 이전 날자를 지정 할 수 없습니다.')
    // } else {
    if (newValue > maxDate) {
      toast.warn('지구 멸망날짜 입니다.');
      setSrtDt(srtDt);
    } else if (newValue.getTime() == endDt.getTime()) {
      setSrtDt(newValue);
      setEndDt(new Date(newValue.getTime() + 24 * 60 * 60 * 1000));
    } else {
      setSrtDt(newValue);
    }
    // }
  };

  const handleEndDtChange = (newValue: Date) => {
    if (newValue < srtDt) {
      toast.warn('이전에 선택한 일자보다 빠를 수 없습니다.');
      setEndDt(srtDt);
    } else if (newValue.getTime() == srtDt.getTime()) {
      toast.warn('당일 지정을 할 수 없습니다.');
      setEndDt(new Date(newValue.getTime() + 24 * 60 * 60 * 1000));
    } else {
      setEndDt(newValue);
    }
  };

  useEffect(() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 100000);
    if (endDt < srtDt) {
      setEndDt(srtDt);
    } else if (endDt == srtDt) {
      setEndDt(new Date(srtDt.getTime() + 24 * 60 * 60 * 1000));
    }
  }, [srtDt, endDt]);

  useEffect(() => {
    onSubmitSrtDtEndDtFnRef.current?.(srtDt, endDt);
  }, [srtDt, endDt]);

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLDateRangePicker', className)}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack>
            <DesktopDatePicker
              value={srtDt}
              onChange={(newValue) => {
                if (newValue === null) return;
                handleSrtDtChange(newValue);
              }}
              className={`${classes.root}`}
            />
          </Stack>
          <Typography>~</Typography>
          <Stack>
            <DesktopDatePicker
              value={endDt}
              onChange={(newValue) => {
                if (newValue === null) return;
                handleEndDtChange(newValue);
              }}
              className={`${classes.root}`}
            />
          </Stack>
        </LocalizationProvider>
      </Stack>
    </Box>
  );
}
