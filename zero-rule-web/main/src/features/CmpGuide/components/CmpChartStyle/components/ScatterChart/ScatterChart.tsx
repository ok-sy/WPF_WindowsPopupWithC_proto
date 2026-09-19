import ScatterGraph from '@/components/Chart/ScatterGraph/ScatterGraph';
import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';

export default function ScatterChart(props: { time: number }) {
  return (
    <Stack sx={rootSx} className="ScatterChart-root" flex={1} alignItems="stretch">
      <Box className="ScatterChart-container">
        <Typography variant="body2">
          ScatterChart는 상관 관계 분석, 데이터 클러스터 시각화, 이상치를 탐지, 성능 분석을 <br />
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
        <ScatterGraph time={props.time} />
      </Box>
    </Stack>
  );
}
