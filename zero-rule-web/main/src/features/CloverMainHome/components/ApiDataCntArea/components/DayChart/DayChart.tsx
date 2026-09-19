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
  refreshToken: number;
  data?: SubmitData;
  onSubmit: (data: SubmitData) => void;
};
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export default function DayChart(props: Props) {
  const { data, onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [dayLists, setDayLists] = useState<GetUrlRequestCntVo[]>([]);
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<ReturnType<typeof createDayListChartData>>(
    createDayListChartData(dayLists),
  );
  const dayList = useCallback(
    async (params: { month?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getDayUrlRequestCntList({ ctx, ...params });
        if (ctx.canceled) return;
        setDayLists(body.list);
        const data = createDayListChartData(body.list);
        setChartData(data);
      } catch (e) {}
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const dataSet = {
      month: data?.label.replace(/년|월/g, ''),
    };
    dayList(dataSet, ctx);
  }, [dayList, data, refreshToken]);

  // 차트 클릭 이벤트
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
    <Box sx={rootSx} className="DayChart-root">
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
function createDayListChartData(RATE_RESULT: GetUrlRequestCntVo[]) {
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
        label: '일별 URL 호출 갯수',
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
