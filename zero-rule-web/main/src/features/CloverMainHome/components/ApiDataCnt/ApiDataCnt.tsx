import RefreshIcon from '@mui/icons-material/Refresh';
import type { SxProps } from '@mui/material';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import DayChart from './components/DayChart/DayChart';
import MonthChart from './components/MonthChart/MonthChart';
import TimeChart from './components/TimeChart/TimeChart';

type ChartMgmt = 'month' | 'day' | 'time';
const rootSx: SxProps = {
  '& .fade-enter': {
    opacity: 0,
    transition: 'opacity 300ms',
  },

  '& .fade-enter-active': {
    opacity: 1,
  },

  '& .fade-exit': {
    opacity: 1,
    transition: 'opacity 300ms',
  },

  '& .fade-exit-active': {
    opacity: 0,
  },
};
export type SubmitData = {
  data?: string;
  label: string;
};
export default function ApiDataCnt() {
  const [dataChartSel, setDataChartSel] = useState<ChartMgmt>('month');
  const [inTransition, setInTransition] = useState<boolean>(false);
  const [submitData, setSubmitData] = useState<SubmitData>();
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSubmit = (chart: ChartMgmt) => {
    setInTransition(true);
    setTimeout(() => {
      setDataChartSel(chart);
      setInTransition(false);
    }, 300);
  };
  return (
    <Box sx={rootSx} className="ApiDataCnt-root">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">데이터 조회 건수(bar chart)</Typography>
          <Stack alignSelf="flex-start" direction="row" spacing={1}>
            <Chip
              label="월별"
              color={dataChartSel === 'month' ? 'secondary' : 'default'}
              size="small"
              onClick={() => {
                setDataChartSel('month');
              }}
            />
            <Chip
              label="일별"
              size="small"
              color={dataChartSel === 'day' ? 'secondary' : 'default'}
              onClick={() => {
                setDataChartSel('day');
                const nowDate = new Date(Date.now());
                const year = nowDate.getFullYear();
                const month = (nowDate.getMonth() + 1).toString().padStart(2, '0');
                const nowYymm = `${year}${month}`;
                setSubmitData({ data: '', label: nowYymm });
              }}
            ></Chip>
            <Chip
              label="시간별"
              color={dataChartSel === 'time' ? 'secondary' : 'default'}
              size="small"
              onClick={() => {
                setDataChartSel('time');
                const nowDate = new Date(Date.now());
                const year = nowDate.getFullYear();
                const month = (nowDate.getMonth() + 1).toString().padStart(2, '0');
                const day = nowDate.getDate().toString().padStart(2, '0');
                const nowYymmdd = `${year}${month}${day}`;
                setSubmitData({ data: '', label: nowYymmdd });
              }}
            ></Chip>
          </Stack>
        </Stack>
        <IconButton size="small" onClick={() => setRefreshToken(Date.now())}>
          <RefreshIcon />
        </IconButton>
      </Stack>
      {dataChartSel === 'month' ? (
        <Box
          className={`fade-enter ${!inTransition ? 'fade-enter-active' : ''}`}
          sx={{ display: dataChartSel === 'month' ? 'block' : 'none' }}
        >
          <MonthChart
            refreshToken={refreshToken}
            onSubmit={(data) => {
              handleSubmit('day');
              setSubmitData(data);
            }}
          />
        </Box>
      ) : dataChartSel === 'day' ? (
        <Box
          className={`fade-enter ${!inTransition ? 'fade-enter-active' : ''}`}
          sx={{ display: dataChartSel === 'day' ? 'block' : 'none' }}
        >
          <DayChart
            refreshToken={refreshToken}
            data={submitData}
            onSubmit={(data) => {
              handleSubmit('time');
              setSubmitData(data);
            }}
          />
        </Box>
      ) : (
        <Box
          className={`fade-enter ${!inTransition ? 'fade-enter-active' : ''}`}
          sx={{ display: dataChartSel === 'time' ? 'block' : 'none' }}
        >
          <TimeChart
            refreshToken={refreshToken}
            data={submitData}
            onSubmit={(data) => {
              handleSubmit('time');
              setSubmitData(data);
            }}
          />
        </Box>
      )}
    </Box>
  );
}
