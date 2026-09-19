import { useApi } from '@/provider';
import { Box } from '@mui/material';
import type { ApiRequestContext, GetDateServiceLateTimeVo } from '@local/domain';
import { GetDateServiceAvgResponeTimeVo } from '@local/domain';
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
import type { SubmitData } from '../DelayServiceMaxResTime';
import errorCustomHandle from '@/lib/error-custom-handle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
type Props = {
  refreshToken: number;
  onSubmit: (data: SubmitData) => void;
};
export default function DelayServiceMaxResTimeMonth(props: Props) {
  const { onSubmit, refreshToken } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [monthData, setMonthData] = useState<GetDateServiceLateTimeVo[]>([]);
  const [chartData, setChartData] = useState<ReturnType<typeof createMonthListChartData>>(
    createMonthListChartData(monthData),
  );
  const chartRef = useRef<any>(null);

  // 월별 데이터 건수 조회
  const monthDataApi = useCallback(
    async (ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getMonthServiceLateTime({ ctx });
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
    onSubmitFnRef.current?.({ data, label });
  };
  return (
    <Box>
      <Line
        style={{ width: '500px', height: '210px' }}
        ref={chartRef}
        onClick={handleClick}
        data={chartData}
        options={options}
      />
    </Box>
  );
}

function createMonthListChartData(RATE_RESULT: GetDateServiceLateTimeVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    const regDttm = RATE_RESULT[i].regDttm; // 예: '240627'
    const year = `${regDttm.substring(0, 4)}`; // '24' -> '2024'
    const month = regDttm.substring(4, 6); // '06'
    const formattedDate = `${year}년${month}월`;

    labels.push(formattedDate);
    const class1 = RATE_RESULT[i].lateTime;

    cnt.push(class1);
  }

  return {
    labels,

    datasets: [
      {
        label: '월별 URL 호출 갯수',
        data: cnt,
        fill: false,
        backgroundColor: 'white',
        borderColor: '#387ADF',
        borderWidth: 5, // 선 두께 설정
        pointRadius: 5, // 점의 반지름 설정
        hoverBackgroundColor: '#387ADF',
        hoverBorderColor: '#387ADF',
        hoverRadius: 8,
      },
    ],
  };
}
