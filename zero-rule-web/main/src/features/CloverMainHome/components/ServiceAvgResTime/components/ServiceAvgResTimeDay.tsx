import { useApi } from '@/provider';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import type { ApiRequestContext, GetDateServiceAvgResponeTimeVo } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { SubmitData } from '../ServiceAvgResTime';
import errorCustomHandle from '@/lib/error-custom-handle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const rootSx: SxProps = {};
type Props = {
  refreshToken: number;
  data?: SubmitData;
  onSubmit: (data: SubmitData) => void;
};
export default function ServiceAvgResTimeDay(props: Props) {
  const { data, onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [dayLists, setDayLists] = useState<GetDateServiceAvgResponeTimeVo[]>([]);
  const [chartData, setChartData] = useState<ReturnType<typeof createDayListChartData>>(
    createDayListChartData(dayLists),
  );
  const chartRef = useRef<any>(null);

  // 월별 데이터 건수 조회
  const dayList = useCallback(
    async (params: { month?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getDayServiceAvgResponseTime({ ctx, ...params });
        if (ctx.canceled) return;
        setDayLists(body.list);
        const data = createDayListChartData(body.list);
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
    const dataSet = {
      month: data?.label.replace(/년|월/g, ''),
    };
    dayList(dataSet, ctx);
  }, [dayList, refreshToken]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
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
              label += ': ' + (+context.parsed.y).toFixed(3) + '초'; // 툴팁에 표시되는 값 소수점 첫 번째 자리까지 포맷팅
            }
            return label;
          },
        },
      },
    },
    tooltips: {
      enabled: true,
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
    const label = chart.data.labels[index] as string; // label 데이터 가져오기

    onSubmitFnRef.current?.({ data, label });
  };
  return (
    <Box sx={rootSx} className="DayChart-root">
      <Line
        style={{ width: '500px', height: '210px' }}
        ref={chartRef}
        data={chartData}
        onClick={handleClick}
        options={options}
      />
    </Box>
  );
}

function createDayListChartData(RATE_RESULT: GetDateServiceAvgResponeTimeVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    console.log('dddddddddddddddddddddddddddddddddfd');
    console.log(RATE_RESULT[i].regDttm);
    labels.push(RATE_RESULT[i].regDttm);
    const class1 = RATE_RESULT[i].avgTime;

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
        borderColor: '#F3B95F',
        borderWidth: 5, // 선 두께 설정
        pointRadius: 5, // 점의 반지름 설정
        hoverBackgroundColor: '#F3B95F',
        hoverBorderColor: '#F3B95F',
        hoverRadius: 8,
      },
    ],
  };
}
