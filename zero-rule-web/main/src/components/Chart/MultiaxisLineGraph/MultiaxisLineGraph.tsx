import type { ChartOptions } from 'chart.js';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { createMultiaxisLineGraphData } from './multiaxis-line-sample';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options: ChartOptions<'line'> = {
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    title: {
      display: true,
      text: 'MultiaxisLine Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      max: 7000,
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,

      grid: {
        drawOnChartArea: false,
      },
    },
  },
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export function nextNum() {
  let requestId = Math.round(Math.random() * 5000);
  return ++requestId;
}
type Props = {
  time: number;
};
export default function MultiaxisLineGraph(props: Props) {
  const [chartData, setChartData] = useState<ReturnType<typeof createMultiaxisLineGraphData>>(
    createMultiaxisLineGraphData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        beforeData: nextNum(),
        afterData: 584 + nextNum(),
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      setChartData(
        createMultiaxisLineGraphData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            beforeData: nextNum(),
            afterData: 584 + nextNum(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return <Line options={options} data={chartData} />;
}
