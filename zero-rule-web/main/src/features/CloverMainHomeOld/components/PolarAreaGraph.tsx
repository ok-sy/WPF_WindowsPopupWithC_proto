import { Box, Stack, Typography } from '@mui/material';
import type { ChartOptions } from 'chart.js';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useState } from 'react';
import { Line, PolarArea } from 'react-chartjs-2';
import { SAMPLE_TOTAL } from '../todays-sample';
import {
  createAreaChartData,
  createPolarChartData,
  createTotalChartData,
} from './DailyStatusGraph/chart-data-making';

/**
 * 차트 JS 레지트터
 */
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);
const lineOptions: ChartOptions<'polarArea'> = {
  responsive: true,
  maintainAspectRatio: false, // 가로세로 비율 펄스로 설정해주기
  // scales: {
  //   y: {
  //     grid: {
  //       color: '#f5f7f9',
  //       drawTicks: false,
  //     },
  //   },
  //   x: {
  //     grid: {
  //       display: false,
  //     },
  //   },
  // },
  plugins: {
    legend: {
      display: false, // 범례 표시 안 함
    },
  },
};
export default function PolarAreaGraph() {
  const [chartData, setChartData] = useState<ReturnType<typeof createPolarChartData>>(
    createPolarChartData(SAMPLE_TOTAL),
  );

  return (
    <Box
      sx={{
        background: 'rgb(255, 255, 255)',
        borderRadius: '20px',
        boxShadow: 'rgba(0,0,0,0.04) 0px 5px 22px ,rgba(0,0,0,0.03) 0px 0px 0px 0.5px',
        py: 2,
        px: 3,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: 'rgb(108, 115, 127)',
          }}
        >
          Polar chart
        </Typography>
        <Typography
          sx={{
            m: 0,
            mb: 0.5,
            fontSize: '0.5rem',
            fontWeight: 300,
            letterSpacing: '0.02857em',
            color: 'rgb(123, 128, 154)',
          }}
        >
          Analyics insights
        </Typography>
      </Stack>
      {chartData && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: {
              xs: 1,
              md: 2,
            },
          }}
        >
          <Box className="LineGraphDraw-root">
            <PolarArea
              options={lineOptions}
              data={chartData}
              width={200}
              height={200}
              key={`${200}x${200}`}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
