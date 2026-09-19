import VerticalBarGraph from '@/components/Chart/VerticalBarGraph/VerticalBarGraph';
import { Box, Typography } from '@mui/material';
import { rootSx } from './style';

export default function VerticalBarChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="VerticalBarChart-root">
      <Box className="VerticalBarChart-container">
        <Typography variant="body2">
          VerticalBarChart는 판매 데이터 분석, 설문 조사 결과, 시간에 따른 데이터 추이를 <br />
          시각적으로 표현할 수 있습니다.
        </Typography>
        <VerticalBarGraph time={props.time} />
      </Box>
    </Box>
  );
}
