import { Box, Typography } from '@mui/material';
import { rootSx } from './style';
import PolarAreaGraph from '@/components/Chart/PolarAreaGraph/PolarAreaGraph';

export default function PolarAreaChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="PolarAreaChart-root">
      <Box className="PolarAreaChart-container">
        <Typography variant="body2">
          PolarAreaChart는 판매 데이터 분석, 설문 조사 결과, 시간에 따른 데이터 추이를 <br />
          시각적으로 표현할 수 있습니다.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <PolarAreaGraph time={props.time} />
        </Box>
      </Box>
    </Box>
  );
}
