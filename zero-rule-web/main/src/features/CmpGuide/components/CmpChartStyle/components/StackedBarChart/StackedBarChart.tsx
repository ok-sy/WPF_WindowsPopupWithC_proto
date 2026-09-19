import StackedBarGraph from '@/components/Chart/StackedBarGraph/StackedBarGraph';
import { Box, Typography } from '@mui/material';
import { rootSx } from './style';

export default function StackedBarChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="StackedBarChart-root">
      <Box className="StackedBarChart-container">
        <Typography variant="body2">
          StackedBarChart는 인구 구성 요소 비교, 매출 분석, 프로젝트 진행 상태를 시각적으로 <br />{' '}
          표현할 수 있습니다.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <StackedBarGraph time={props.time} />
        </Box>
      </Box>
    </Box>
  );
}
