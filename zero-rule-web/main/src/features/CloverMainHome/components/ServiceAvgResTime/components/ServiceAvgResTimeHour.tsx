import { useApi } from '@/provider';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import type { ApiRequestContext, GetDateServiceAvgResponeTimeVo } from '@local/domain';
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
import type { SubmitData } from '../ServiceAvgResTime';
import errorCustomHandle from '@/lib/error-custom-handle';
import { RateReview } from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const rootSx: SxProps = {};
type Props = {
  data?: SubmitData;
  onSubmit: (data: SubmitData) => void;
  refreshToken: number;
};
export default function ServiceAvgResTimeHour(props: Props) {
  const { data, onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [hourLists, setHourLists] = useState<GetDateServiceAvgResponeTimeVo[]>([]);
  const [chartData, setChartData] = useState<ReturnType<typeof createTimeListChartData>>(
    createTimeListChartData(hourLists),
  );
  const chartRef = useRef<any>(null);

  // 월별 데이터 건수 조회
  const hourList = useCallback(
    async (params: { day?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getHourServiceAvgResponseTime({ ctx, ...params });
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
    console.log('hourListshourLists');
    console.log(hourLists);
  }, [hourList]);
  // 매 한시간 마다 hourList 호출
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    hourList({ day: data?.label.replace(/년|월|일/g, '') }, ctx);
    const interval = setInterval(
      () => {
        if (!data) return;
        const now = new Date();
        const seoulOffset = 9 * 60 * 60 * 1000; // 서울의 UTC offset (GMT+9)
        const seoulTime = now.getTime() + seoulOffset; // 서울 시간을 계산
        const seoulDate = new Date(seoulTime);

        // 시간을 정각으로 설정하기 위해 분과 초를 0으로 설정합니다.
        seoulDate.setMinutes(0);
        seoulDate.setSeconds(0);
        hourList({ day: data.label.replace(/년|월|일/g, '') }, ctx);
      },
      60 * 60 * 1000,
    ); // 1시간 (60분 * 60초 * 1000밀리초)
    return () => {
      clearInterval(interval);
    };
  }, [hourList, refreshToken]);

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
    // 추가된 부분: onHover 콜백
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
    const label = chart.data.labels[index] as string; // label 데이터 가져오기
    console.log(data, label);
    console.log('데이터 뭐가 가는거야 도대체', label);
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

function createTimeListChartData(RATE_RESULT: GetDateServiceAvgResponeTimeVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    labels.push(RATE_RESULT[i].regDttm + '시');
    const class1 = RATE_RESULT[i].avgTime;

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
