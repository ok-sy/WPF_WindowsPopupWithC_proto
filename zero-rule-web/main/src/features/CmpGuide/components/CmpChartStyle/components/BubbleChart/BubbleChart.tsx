import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import BubbleGraph from '@/components/Chart/BubbleGraph/BubbleGraph';

export default function BubbleChart(props: { time: number }) {
  return (
    <Box sx={rootSx} className="BubbleChart-root">
      <Box className="BubbleChart-container">
        <Typography variant="body2">
          BubbleChart는 인구 통계, 경제 지표 비교, 프로젝트 관리에서 작업의 우선순위와 <br /> 시간
          대비 리소스 할당을 시각화, 제품의 특성 비교를 시각적으로 표현할 수 있습니다.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <BubbleGraph time={props.time} />
        </Box>
      </Box>
    </Box>
  );
}
