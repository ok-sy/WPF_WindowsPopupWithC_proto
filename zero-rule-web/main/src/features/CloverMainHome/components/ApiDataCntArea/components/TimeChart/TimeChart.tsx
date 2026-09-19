import { useApi } from '@/provider';
import type { ApiRequestContext, GetUrlRequestCntVo } from '@local/domain';
import type { SxProps } from '@mui/material';
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
import { Line } from 'react-chartjs-2';
import type { SubmitData } from '../../ApiDataCntArea';

const rootSx: SxProps = {};
type Props = {
  data?: SubmitData;
  onSubmit: (data: SubmitData) => void;
  refreshToken: number;
};
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export default function TimeChart(props: Props) {
  const { data, onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [hourLists, setHourLists] = useState<GetUrlRequestCntVo[]>([]);
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<ReturnType<typeof createTimeListChartData>>(
    createTimeListChartData(hourLists),
  );

  const hourList = useCallback(
    async (params: { day?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getHourUrlRequestCntList({ ctx, ...params });
        if (ctx.canceled) return;
        setHourLists(body.list);
        const data = createTimeListChartData(body.list);
        setChartData(data);
      } catch (e) {}
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    hourList({ day: data?.label.replace(/년|월|일/g, '') }, ctx);
    const interval = setInterval(
      () => {
        if (!data) return;
        const now = new Date();
        const seoulOffset = 9 * 60 * 60 * 1000;
        const seoulTime = now.getTime() + seoulOffset;
        const seoulDate = new Date(seoulTime);
        seoulDate.setMinutes(0);
        seoulDate.setSeconds(0);
        hourList({ day: data.label.replace(/년|월|일/g, '') }, ctx);
      },
      60 * 60 * 1000,
    );
    return () => {
      clearInterval(interval);
    };
  }, [hourList, refreshToken]);

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
    <Box sx={rootSx} className="TimeChart-root">
      <Line
        style={{ width: '500px', height: '210px' }}
        ref={chartRef}
        onClick={handleClick}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
              display: false,
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
      />
    </Box>
  );
}
function createTimeListChartData(RATE_RESULT: GetUrlRequestCntVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    labels.push(RATE_RESULT[i].regDttm + '시');
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
        backgroundColor: 'white',
        borderColor: '#D04848',
        borderWidth: 5,
        pointRadius: 5,
        hoverBackgroundColor: '#D04848',
        hoverBorderColor: '#D04848',
        hoverRadius: 8,
      },
    ],
  };
}
