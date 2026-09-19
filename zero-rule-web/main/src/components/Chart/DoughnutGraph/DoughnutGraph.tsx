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
import { Doughnut } from 'react-chartjs-2';
import { createDoughnutData } from './doughnut-sample';
import ChartDataLabels from 'chartjs-plugin-datalabels-4';
const rootSx: SxProps = {};

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options: ChartOptions<'doughnut'> = {
  plugins: {
    title: {
      display: true,
      text: 'Doughnut Chart',
    },
    datalabels: {
      display: true,
      //@ts-ignore
      formatter: function (value, context) {
        let total = 0;
        //@ts-ignore
        context.dataset.data.forEach((el) => {
          total = total + Number(el);
        });

        // 출력 텍스트
        return Math.round((value / total) * 100) + '%';
      },
      font: { size: 15 },
      align: 'end',
    },
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
export default function DoughnutGraph(props: Props) {
  const [chartData, setChartData] = useState<ReturnType<typeof createDoughnutData>>(
    createDoughnutData(
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
        createDoughnutData(
          new Array(5).fill(0).map((it, idx) => ({
            labels: labels[idx],
            afterData: 584 + nextNum(),
          })),
        ),
      );
    }, props.time);
    return () => clearInterval(timer);
  }, [props.time]);
  //@ts-ignore
  return <Doughnut plugins={[ChartDataLabels]} data={chartData} options={options} />;
}
