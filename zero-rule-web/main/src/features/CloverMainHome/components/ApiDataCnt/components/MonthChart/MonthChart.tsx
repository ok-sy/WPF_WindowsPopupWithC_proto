import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, GetUrlRequestCntVo } from '@local/domain';
import { Box } from '@mui/material';
import type { ChartEvent } from 'chart.js';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { SubmitData } from '../../ApiDataCnt';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
type Props = {
  refreshToken: number;
  onSubmit: (data: SubmitData) => void;
};
export default function MonthChart(props: Props) {
  const { onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [monthData, setMonthData] = useState<GetUrlRequestCntVo[]>([]);
  const [chartData, setChartData] = useState<ReturnType<typeof createMonthListChartData>>(
    createMonthListChartData(monthData),
  );
  const chartRef = useRef<any>(null);

  const monthDataApi = useCallback(
    async (ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getMonthlyUrlRequestCntList({ ctx });
        setMonthData(body.list);
        const data = createMonthListChartData(body.list);
        setChartData(data);
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    monthDataApi(ctx);
  }, [monthDataApi, refreshToken]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    const elements = chart.getElementsAtEventForMode(
      event as unknown as ChartEvent,
      'nearest',
      { intersect: true },
      false,
    );
    if (elements.length === 0) {
      return;
    }

    const { datasetIndex, index } = elements[0];
    const dataset = chart.data.datasets[datasetIndex];
    const data = dataset.data[index] as string;
    const label = chart.data.labels[index] as string;

    onSubmitFnRef.current?.({ data, label });
  };
  return (
    <Box>
      <Bar
        ref={chartRef}
        onClick={handleClick}
        style={{ width: '500px', height: '180px' }}
        options={{
          maintainAspectRatio: false,

          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => (+value).toFixed(0),
              },
            },
          },
          plugins: {
            legend: {
              position: 'top' as const,
              display: true,
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';

                  if (context.parsed.y !== null) {
                    label += ': ' + (+context.parsed.y).toFixed(0) + '건';
                  }

                  return label;
                },
              },
            },
          },
          onHover: (event: ChartEvent, chartElement) => {
            const nativeEvent = event.native as MouseEvent;
            if (nativeEvent && nativeEvent.target) {
              const target = nativeEvent.target as HTMLElement;
              if (chartElement.length) {
                target.style.cursor = 'pointer';
              } else {
                target.style.cursor = 'default';
              }
            }
          },
        }}
        data={chartData}
      ></Bar>
    </Box>
  );
}

function createMonthListChartData(RATE_RESULT: GetUrlRequestCntVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    labels.push(RATE_RESULT[i].regDttm);
    const class1 = RATE_RESULT[i].cnt;
    cnt.push(class1);
  }
  return {
    labels,

    datasets: [
      {
        label: '시간별 URL 호출 갯수',
        data: cnt,
        fill: false,
        backgroundColor: '#5980bb',
        maxBarThickness: 40,
      },
    ],
  };
}
