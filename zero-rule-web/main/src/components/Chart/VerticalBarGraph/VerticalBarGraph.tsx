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
import { createVerticalBarData } from './vertical-sample';
const rootSx: SxProps = {};

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options: ChartOptions<'bar'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Vertical Bar Chart',
    },
  },
  scales: {
    y: {
      max: 13000,
    },
  },
};
let seq = 0;
const nextdata = () => {
  return ++seq;
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}
type Props = {
  time: number;
};
export default function VerticalBarGraph(props: Props) {
  // 라인그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createVerticalBarData>>(
    createVerticalBarData(
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
      seq = 0;
      setChartData(
        createVerticalBarData(
          new Array(5).fill(0).map((it) => ({
            labels: labels[nextdata()],
            beforeData: nextNum(),
            afterData: 584 + nextNum(),
          })),
        ),
      );
    }, props.time);

    // 컴포넌트가 unmount 되거나 상태가 변경될 때 clearInterval을 통해 타이머를 해제
    return () => clearInterval(timer);
  }, [props.time]);
  return (
    <>
      <Bar options={options} data={chartData} />
    </>
  );
}
