import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
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
import { Radar } from 'react-chartjs-2';
import { createRadarData } from './radar-sample';
const rootSx: SxProps = {};

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const options: ChartOptions<'radar'> = {
  plugins: {
    title: {
      display: true,
      text: 'Radar Chart',
    },
    legend: {
      display: false,
    },
    // datalabels: {
    //   display: false,
    // },
  },
};
let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June'];

export function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}
type Props = {
  time: number;
};
export default function RadarGraph(props: Props) {
  // 라인그래프 데이터
  const [chartData, setChartData] = useState<ReturnType<typeof createRadarData>>(
    createRadarData(
      new Array(5).fill(0).map((it, idx) => ({
        labels: labels[idx],
        afterData: 584 + nextNum(),
      })),
    ),
  );
  useEffect(() => {
    if (props.time === 7575) return;
    const timer = setInterval(() => {
      // 매 2초마다 count 상태를 변경
      setChartData(
        createRadarData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            afterData: 584 + nextNum(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  return (
    <Box sx={{ width: 300 }}>
      <Radar data={chartData} options={options} />
    </Box>
  );
}
