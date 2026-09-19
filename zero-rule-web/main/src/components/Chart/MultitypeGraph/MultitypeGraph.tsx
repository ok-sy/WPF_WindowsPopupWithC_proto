import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { createMultitypeData } from './multitype-sample';
const rootSx: SxProps = {};

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
);

const options = {
  plugins: {
    title: {
      display: true,
      text: 'Multitype Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  scales: {
    y: {
      max: 13000,
    },
  },
};
export function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}
const labels = ['January', 'February', 'March', 'April', 'May', 'June'];
type Props = {
  time: number;
};
export default function MultitypeGraph(props: Props) {
  // 라인그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createMultitypeData>>(
    createMultitypeData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        firstData: 584 + nextNum(),
        secondData: 164 + nextNum(),
        thirthData: 291 + nextNum(),
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      setChartData(
        createMultitypeData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            firstData: 584 + nextNum(),
            secondData: 164 + nextNum(),
            thirthData: 291 + nextNum(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return <Chart type="bar" data={chartData} options={options} />;
}
