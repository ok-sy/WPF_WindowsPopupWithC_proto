import { Box } from '@mui/material';
import type { ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { createTodayChartData } from '../../chart-data-making';
import { rootSx } from './style';

/**
 * 오늘 날짜 구하기
 */
const todayData = () => {
  const today = new Date();
  const year = today.getFullYear(); // 년도
  const month = today.getMonth() + 1; // 월
  const date = today.getDate(); // 날짜
  return `${year}-${month}-${date}`;
};

const doughnutOption: ChartOptions<'doughnut'> = {
  elements: {
    arc: {
      borderWidth: 0, // 외곽선 제거
    },
  },
  cutout: '65%',
  responsive: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
  },
};

type Props = {
  data: ReturnType<typeof createTodayChartData>;
  width: number;
  height: number;
};
export default function DoughnutGraphDraw(props: Props) {
  const { data, width, height } = props;
  return (
    <Box sx={rootSx} className="DoughnutGraphDraw-root">
      <Doughnut
        options={doughnutOption}
        data={data}
        width={width}
        height={height}
        key={`${width}x${height}`}
      />
    </Box>
  );
}
