import PieGraph from '@/components/Chart/PieGraph/PieGraph';
import { Box, Typography } from '@mui/material';
import { rootSx } from './style';

export default function PieChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="PieChart-root">
      <Box className="PieChart-container">
        <Typography variant="body2">
          PieChart는 판매 비중, 인구 구성, 예산 분배를 시각적으로 표현할 수 있습니다.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          height: 550,
        }}
      >
        <PieGraph time={props.time} />
      </Box>
    </Box>
  );
}
