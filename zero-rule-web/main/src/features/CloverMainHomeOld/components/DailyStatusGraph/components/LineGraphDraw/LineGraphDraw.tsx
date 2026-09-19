import { Box } from '@mui/material';
import type { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { createTotalChartData } from '../../chart-data-making';
import { rootSx } from './style';

const lineOptions: ChartOptions<'bar'> = {
  responsive: false,
  maintainAspectRatio: false, // 가로세로 비율 펄스로 설정해주기
  scales: {
    y: {
      grid: {
        color: '#f5f7f9',
        drawTicks: false,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};
type Props = {
  data: ReturnType<typeof createTotalChartData>;
  width: number;
  height: number;
};
export default function LineGraphDraw(props: Props) {
  const { data, width, height } = props;

  return (
    <Box sx={rootSx} className="LineGraphDraw-root">
      <Bar
        options={lineOptions}
        data={data}
        width={width}
        height={height}
        key={`${width}x${height}`}
      />
    </Box>
  );
}
