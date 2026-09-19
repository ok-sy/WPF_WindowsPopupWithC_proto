import type { SxProps } from '@mui/material';
import type { ChartOptions } from 'chart.js';
import { Chart as ChartJS, Legend, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { Bubble } from 'react-chartjs-2';
import { SAMPLE_TOTAL, createBubbleData } from './bubble-sample';
const rootSx: SxProps = {};

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const options: ChartOptions<'bubble'> = {
  plugins: {
    title: {
      display: true,
      text: 'Bubble Chart',
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
function getRandomMultipleOfFive() {
  // 주어진 범위 내에서 랜덤한 정수를 생성
  const randomNumber = Math.floor(Math.random() * (50 - 10 + 1)) + 10;

  return randomNumber;
}

function getRandomNumber() {
  return Math.floor(Math.random() * (20 - 5 + 1)) + 5;
}
type Props = {
  time: number;
};
export default function BubbleGraph(props: Props) {
  // 라인그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createBubbleData>>(
    createBubbleData(
      new Array(20).fill(0).map((it, idx) => ({
        x: getRandomMultipleOfFive(),
        y: getRandomMultipleOfFive(),
        r: getRandomNumber(),
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      setChartData(
        createBubbleData(
          new Array(20).fill(0).map((it, idx) => ({
            x: getRandomMultipleOfFive(),
            y: getRandomMultipleOfFive(),
            r: getRandomNumber(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return <Bubble data={chartData} options={options} height="100%" />;
}
