import type { SxProps } from '@mui/material';
import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import ServiceAvgResTimeMonth from './components/ServiceAvgResTimeMonth';
import ServiceAvgResTimeDay from './components/ServiceAvgResTimeDay';
import ServiceAvgResTimeMin from './components/ServiceAvgResTimeMin';
import ServiceAvgResTimeHour from './components/ServiceAvgResTimeHour';
type ChartMgmt = 'month' | 'day' | 'time' | 'min';

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
/**
 * 서비스 평균 응답시간 컴포넌트
 * @returns
 */
export default function ServiceAvgResTime() {
  const [dataChartSel, setDataChartSel] = useState<ChartMgmt>('month');
  const [submitData, setSubmitData] = useState<SubmitData>();
  const [refreshToken, setRefreshToken] = useState(0);
  const [inTransition, setInTransition] = useState<boolean>(false);

  const handleSubmit = (chart: ChartMgmt) => {
    setInTransition(true);
    setTimeout(() => {
      setDataChartSel(chart);
      setInTransition(false);
    }, 300);
  };

  return (
    <Box sx={rootSx} className="ApiDataCntArea-root">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">서비스 평균응답 시간</Typography>
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
                setSubmitData({ data: undefined, label: nowYymm });
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
                setSubmitData({ data: undefined, label: nowYymmdd });
              }}
            ></Chip>
            <Chip
              label="분당"
              color={dataChartSel === 'min' ? 'secondary' : 'default'}
              size="small"
              onClick={() => {
                setDataChartSel('min');
                const nowDate = new Date(Date.now());
                const year = nowDate.getFullYear();
                const month = (nowDate.getMonth() + 1).toString().padStart(2, '0');
                const day = nowDate.getDate().toString().padStart(2, '0');
                const hour = nowDate.getHours().toString().padStart(2, '0');
                const nowYymmddHH24 = `${year}${month}${day}${hour}`;
                setSubmitData({ data: undefined, label: nowYymmddHH24 });
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
          <ServiceAvgResTimeMonth
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
          <ServiceAvgResTimeDay
            data={submitData}
            refreshToken={refreshToken}
            onSubmit={(data) => {
              handleSubmit('time');
              setSubmitData(data);
            }}
          />
        </Box>
      ) : dataChartSel === 'time' ? (
        <Box
          className={`fade-enter ${!inTransition ? 'fade-enter-active' : ''}`}
          sx={{ display: dataChartSel === 'time' ? 'block' : 'none' }}
        >
          <ServiceAvgResTimeHour
            data={submitData}
            refreshToken={refreshToken}
            onSubmit={(data) => {
              handleSubmit('min');
              setSubmitData(data);
            }}
          />
        </Box>
      ) : (
        <Box
          className={`fade-enter ${!inTransition ? 'fade-enter-active' : ''}`}
          sx={{ display: dataChartSel === 'min' ? 'block' : 'none' }}
        >
          <ServiceAvgResTimeMin
            refreshToken={refreshToken}
            onSubmit={(data) => {
              handleSubmit('min');
              setSubmitData(data);
            }}
          />
        </Box>
      )}
    </Box>
  );
}
