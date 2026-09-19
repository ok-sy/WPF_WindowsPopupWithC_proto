import { Box, Typography } from '@mui/material';
import { rootSx } from './style';
import HorizontalBarGraph from '@/components/Chart/HorizontalBarGraph/HorizontalBarGraph';

export default function HorizontalBarChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="HorizontalBarChart-root">
      <Box className="HorizontalBarChart-container">
        <Typography variant="body2">
          HorizontalBarChart는 선호도 조사 결과, 국가별 지표 비교, 시간에 따른 데이터 추이를 <br />
          시각적으로 표현할 수 있습니다.
        </Typography>
        <HorizontalBarGraph time={props.time} />
      </Box>
    </Box>
  );
}
