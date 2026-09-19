import { Box, Typography } from '@mui/material';
import { rootSx } from './style';
import AreaGraph from '@/components/Chart/AreaGraph';

export default function AreaChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="AreaChart-root">
      <Box className="AreaChart-container">
        <Typography variant="body2">
          AreaChart는 시간에 따른 판매 추이, 범주별 비교, 인구 통계, 재무 데이터 분석을 <br />
          시각적으로 표현할 수 있습니다.
        </Typography>
        <AreaGraph time={props.time} />
      </Box>
    </Box>
  );
}
