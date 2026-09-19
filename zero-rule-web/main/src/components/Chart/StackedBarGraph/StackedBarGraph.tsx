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
import { createStackedBarData } from './stacked-sample';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const options: ChartOptions<'bar'> = {
  plugins: {
    title: {
      display: true,
      text: 'Stacked Bar Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  responsive: true,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      max: 20000,
      stacked: true,
    },
  },
};
let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}
type Props = {
  time: number;
};
export default function StackedBarGraph(props: Props) {
  // 그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createStackedBarData>>(
    createStackedBarData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        firstData: nextNum(),
        secondData: 584 + nextNum(),
        // thirthData: nextNum() - 684,
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      seq = 0;
      setChartData(
        createStackedBarData(
          new Array(5).fill(0).map((it) => ({
            labels: labels[nextdata()],
            firstData: nextNum(),
            secondData: 584 + nextNum(),
          })),
        ),
      );
    }, props.time);

    return () => clearInterval(timer);
  }, [props.time]);
  return <Bar options={options} data={chartData} />;
}
