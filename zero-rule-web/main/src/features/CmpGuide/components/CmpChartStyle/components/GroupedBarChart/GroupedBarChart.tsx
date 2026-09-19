import GroupedBarGraph from '@/components/Chart/GroupedBarGraph/GroupedBarGraph';
import { Box, Typography } from '@mui/material';
import { rootSx } from './style';

export default function GroupedBarChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="GroupedBarChart-root">
      <Box className="GroupedBarChart-container">
        <Typography variant="body2">
          StackedBarChart는 판매 비교, 인구 비율 비교, 제품 특성 비교를 시각적으로 <br />
          표현할 수 있습니다.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <GroupedBarGraph time={props.time} />
        </Box>
      </Box>
    </Box>
  );
}
