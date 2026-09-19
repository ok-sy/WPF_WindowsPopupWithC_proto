import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import MultiaxisLineGraph from '@/components/Chart/MultiaxisLineGraph/MultiaxisLineGraph';

export default function MultiaxisLineChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="MultiaxisLineChart-root">
      <Box className="MultiaxisLineChart-container">
        <Typography variant="body2">
          MultiaxisLineChart는 매출과 광고 비용 비교, 온도와 습도 변화, 주가와 거래량 비교를
          시각적으로 표현할 수 있습니다.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          height: 300,
        }}
      >
        <MultiaxisLineGraph time={props.time} />
      </Box>
    </Box>
  );
}
