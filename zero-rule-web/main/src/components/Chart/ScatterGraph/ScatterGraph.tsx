import type { SxProps } from '@mui/material';
import type { ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import { createScatterData } from './scatter-sample';
const rootSx: SxProps = {};

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const options: ChartOptions<'scatter'> = {
  plugins: {
    title: {
      display: true,
      text: 'Scatter Chart',
    },
    legend: {
      display: false,
    },
    // datalabels: {
    //   display: false,
    // },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

export function nextNum() {
  let requestId = Math.round(Math.random() * 500);
  return ++requestId;
}
function getRandomNumber() {
  return Math.floor(Math.random() * 12) + 1;
}
type Props = {
  time: number;
};
export default function ScatterGraph(props: Props) {
  // 라인그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createScatterData>>(
    createScatterData(
      new Array(5).fill(0).map((it, idx) => ({
        xData: 127 + nextNum(),
        yData: nextNum() - 574,
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경

      setChartData(
        createScatterData(
          new Array(5).fill(0).map((it, idx) => ({
            xData: 127 + nextNum(),
            yData: nextNum() - 574,
          })),
          new Array(20).fill(0).map((el) => ({
            x: getRandomNumber(),
            y: getRandomNumber(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return <Scatter data={chartData} options={options} height="100%" />;
}
