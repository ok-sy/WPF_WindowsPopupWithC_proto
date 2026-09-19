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
import { Bar } from 'react-chartjs-2';
import { createGroupedBarData } from './grouped-sample';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const options: ChartOptions<'bar'> = {
  plugins: {
    title: {
      display: true,
      text: 'Grouped Bar Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      max: 10000,
      min: -4000,
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
export default function GroupedBarGraph(props: Props) {
  // 그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createGroupedBarData>>(
    createGroupedBarData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        firstData: nextNum(),
        secondData: 200 + nextNum(),
        thirthData: nextNum() - 3670,
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      setChartData(
        createGroupedBarData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            firstData: nextNum(),
            secondData: 200 + nextNum(),
            thirthData: nextNum() - 3670,
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return <Bar options={options} data={chartData} />;
}
