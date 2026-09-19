import { Box, Stack, Typography, useTheme } from '@mui/material';
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
import { createTodayChartData } from './DailyStatusGraph/chart-data-making';
import DoughnutGraphDraw from './DailyStatusGraph/components/DoughnutGraphDraw/DoughnutGraphDraw';

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
export default function DoughnutGraph(props: Props) {
  const { totalData, todayData } = props;

  // 도넛(하루) 데이터, REF
  const [todayChartData, setTodayChartData] = useState<ReturnType<typeof createTodayChartData>>(
    createTodayChartData(todayData),
  );
  const [doughnutContainerRef, { width: doughnutWidth, height: doughnutheight }] = useMeasure();

  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        background: 'rgb(255, 255, 255)',
        borderRadius: '20px',
        boxShadow: 'rgba(0,0,0,0.04) 0px 5px 22px ,rgba(0,0,0,0.03) 0px 0px 0px 0.5px',
        py: 3,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ mb: 2, fontSize: '1.1rem' }} variant="h6">
          Traffic Source
        </Typography>
      </Stack>
      {todayChartData && (
        <Box
          ref={doughnutContainerRef}
          sx={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <DoughnutGraphDraw
            data={todayChartData}
            width={doughnutWidth - 8}
            height={doughnutheight - 8}
          />
        </Box>
      )}
    </Box>
  );
}
