import { useApi } from '@/provider';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import type { ApiRequestContext, GetDateServiceLateTimeVo } from '@local/domain';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
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
import type { SubmitData } from '../DelayServiceMaxResTime';
import errorCustomHandle from '@/lib/error-custom-handle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const rootSx: SxProps = {};
type Props = {
  data?: SubmitData;
  onSubmit: (data: SubmitData) => void;
  refreshToken: number;
};
export default function DelayServiceMaxResTimeHour(props: Props) {
  const { data, onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [hourLists, setHourLists] = useState<GetDateServiceLateTimeVo[]>([]);
  const [chartData, setChartData] = useState<ReturnType<typeof createTimeListChartData>>(
    createTimeListChartData(hourLists),
  );
  const chartRef = useRef<any>(null);

  const hourList = useCallback(
    async (params: { day?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getHourServiceLateTime({ ctx, ...params });
        if (ctx.canceled) return;
        setHourLists(body.list);
        const data = createTimeListChartData(body.list);
        setChartData(data);
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
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

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (context.parsed.y !== null) {
              label += ': ' + (+context.parsed.y).toFixed(3) + '초';
            }
            return label;
          },
        },
      },
    },
    onHover: (event: ChartEvent, chartElement: any) => {
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
  };
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
        data={chartData}
        options={options}
        onClick={handleClick}
      />
    </Box>
  );
}

function createTimeListChartData(RATE_RESULT: GetDateServiceLateTimeVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    labels.push(RATE_RESULT[i].regDttm + '시');
    const class1 = RATE_RESULT[i].lateTime;

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
        borderColor: '#387ADF',
        borderWidth: 5,
        pointRadius: 5,
        hoverBackgroundColor: '#387ADF',
        hoverBorderColor: '#387ADF',
        hoverRadius: 8,
      },
    ],
  };
}
