import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import type { ChartOptions } from 'chart.js';
import { ArcElement, Chart as ChartJS, Legend, RadialLinearScale, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { PolarArea } from 'react-chartjs-2';
import { createPolarAreaData } from './polar-area-sample';
const rootSx: SxProps = {};

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const options: ChartOptions<'polarArea'> = {
  plugins: {
    title: {
      display: true,
      text: 'PolarArea Chart',
    },
    // datalabels: {
    //   display: false,
    // },
  },
};
const labels = ['January', 'February', 'March', 'April', 'May', 'June'];

export function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}

type Props = {
  time: number;
};
export default function PolarAreaGraph(props: Props) {
  const [chartData, setChartData] = useState<ReturnType<typeof createPolarAreaData>>(
    createPolarAreaData(
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
        createPolarAreaData(
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
    <Box sx={{ width: 275 }}>
      <PolarArea data={chartData} options={options} />
    </Box>
  );
}
