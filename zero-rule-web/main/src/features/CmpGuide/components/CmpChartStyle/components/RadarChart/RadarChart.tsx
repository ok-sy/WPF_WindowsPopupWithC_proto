import RadarGraph from '@/components/Chart/RadarGraph/RadarGraph';
import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';

export default function RadarChart(props: { time: number }) {
  return (
    <Stack sx={rootSx} className="RadarChart-root">
      <Stack className="RadarChart-container">
        <Typography variant="body2">
          Radar Chart는 스킬 평가, 제품 특성 비교, 스포츠 선수 비교, 비즈니스 지표 분석을 <br />
          시각적으로 표현할 수 있습니다.
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          height: 300,
        }}
      >
        <RadarGraph time={props.time} />
      </Box>
    </Stack>
  );
}
