import type { ChartOptions } from 'chart.js';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { createAreaData } from './area-sample';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

export const options: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Area Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  scales: {
    y: {
      max: 12000,
      min: 0,
    },
  },
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}

type Props = {
  time: number;
};
export default function AreaGraph(props: Props) {
  // 라인그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createAreaData>>(
    createAreaData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        data: nextNum(),
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      setChartData(
        createAreaData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            data: nextNum(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);

  return <Line options={options} data={chartData} />;
}
