import type { SxProps } from '@mui/material';
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
import { createHorizontalBarData } from './horizontal-sample';

const rootSx: SxProps = {};

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options: ChartOptions<'bar'> = {
  indexAxis: 'x' as const,
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const,
    },
    title: {
      display: true,
      text: 'Horizontal Bar Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  scales: {
    y: {
      max: 12000,
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
export default function HorizontalBarGraph(props: Props) {
  // 그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createHorizontalBarData>>(
    createHorizontalBarData(
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
      // 매 2초마다 count 상태를 변경
      setChartData(
        createHorizontalBarData(
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
  return <Bar options={options} data={chartData} />;
}
