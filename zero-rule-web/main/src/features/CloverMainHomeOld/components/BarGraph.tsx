import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, IconButton, Stack, Typography, useTheme } from '@mui/material';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useState } from 'react';
import { useMeasure } from 'react-use';
import type { ItemType, SampleTotDataType } from '../todays-sample';
import { createTotalChartData } from './DailyStatusGraph/chart-data-making';
import LineGraphDraw from './DailyStatusGraph/components/LineGraphDraw/LineGraphDraw';

/**
 * 차트 JS 레지트터
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type Props = {
  totalData: SampleTotDataType[];
  todayData: ItemType[];
};
export default function BarGraph(props: Props) {
  const { totalData, todayData } = props;

  // 라인그래프 데이터, REF
  const [chartData, setChartData] = useState<ReturnType<typeof createTotalChartData>>(
    createTotalChartData(totalData),
  );
  const [graphContainerRef, { width: graphWidth, height: graphHeight }] = useMeasure();

  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        background: 'rgb(255, 255, 255)',
        borderRadius: '20px',
        boxShadow: 'rgba(0,0,0,0.04) 0px 5px 22px ,rgba(0,0,0,0.03) 0px 0px 0px 0.5px',
        py: 3,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ mb: 2, fontSize: '1.1rem' }} variant="h6">
          Sales
        </Typography>
        <IconButton>
          <RefreshIcon />
        </IconButton>
      </Stack>
      {chartData && (
        <Box
          ref={graphContainerRef}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            flex: 1,
          }}
        >
          <LineGraphDraw data={chartData} width={graphWidth - 8} height={graphHeight - 8} />
        </Box>
      )}
    </Box>
  );
}
