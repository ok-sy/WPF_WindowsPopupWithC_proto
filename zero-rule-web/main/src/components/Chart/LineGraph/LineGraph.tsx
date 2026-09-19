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
import { createLineData } from './line-sample';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
  scales: {
    y: {
      max: 7000,
      min: -7000,
    },
  },
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export function nextNum() {
  let requestId = Math.round(Math.random() * 5000);
  return ++requestId;
}
function test() {
  let addMin = Math.round(Math.random() * 2);
  if (addMin === 1) {
    return nextNum();
  } else if (addMin == 2) {
    return nextNum() - nextNum() * 2;
  }
  return ++addMin;
}

type Props = {
  time: number;
};
export default function LineGraph(props: Props) {
  const [chartData, setChartData] = useState<ReturnType<typeof createLineData>>(
    createLineData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        beforeData: test(),
        afterData: 584 + test(),
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      setChartData(
        createLineData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            beforeData: test(),
            afterData: 584 + test(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return <Line options={options} data={chartData} />;
}
