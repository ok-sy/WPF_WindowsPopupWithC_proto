import LineGraph from '@/components/Chart/LineGraph/LineGraph';
import { Box, Typography } from '@mui/material';
import { rootSx } from './style';

export default function LineChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="LineChart-root">
      <Box className="LineChart-container">
        <Typography variant="body2">
          LineChart는 주식 가격 변동, 기온 변화, 판매 추이, 인구 변화에 따른 데이터 추이를 <br />
          시각적으로 표현할 수 있습니다.
        </Typography>
        <LineGraph time={props.time} />
      </Box>
    </Box>
  );
}
