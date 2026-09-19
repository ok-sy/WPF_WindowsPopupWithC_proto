import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import { SAMPLE_TODAY, SAMPLE_TOTAL } from '@/features/CloverMainHome/todays-sample';
import DoughnutGraph from '@/components/Chart/DoughnutGraph/DoughnutGraph';

export default function DoughnutChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="DoughnutChart-root">
      <Box className="DoughnutChart-container">
        <Typography variant="body2">
          DoughnutChart는 매출 구성, 기술 스택 비율, 예산 할당, 인구 비율을 시각적으로 <br />
          표현할 수 있습니다.
        </Typography>
        {/* <DoughnutGraph totalData={SAMPLE_TOTAL} todayData={SAMPLE_TODAY} /> */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            height: 540,
          }}
        >
          <DoughnutGraph time={props.time} />
        </Box>
      </Box>
    </Box>
  );
}
