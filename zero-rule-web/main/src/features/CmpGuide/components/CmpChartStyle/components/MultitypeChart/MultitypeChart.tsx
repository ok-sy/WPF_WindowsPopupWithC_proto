import MultitypeGraph from '@/components/Chart/MultitypeGraph/MultitypeGraph';
import { Box, Typography } from '@mui/material';
import { rootSx } from './style';

export default function MultitypeChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="MultitypeChart-root">
      <Box className="MultitypeChart-container">
        <Typography variant="body2">
          MultitypeChart는 금융 대시보드에서 다양한 지표를 시각화, 판매 성과 분석, 소셜 미디어
          <br /> 분석, 주식 시장 분석을 시각적으로 표현할 수 있습니다.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 300,
          }}
        >
          <MultitypeGraph time={props.time} />
        </Box>
      </Box>
    </Box>
  );
}
