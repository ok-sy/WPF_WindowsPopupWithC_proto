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
  refreshToken: number;
};
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export default function MinChart(props: Props) {
  const { data, refreshToken } = props;
  const api = useApi();
  const [hourLists, setHourLists] = useState<GetUrlRequestCntVo[]>([]);
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<ReturnType<typeof createMinListChartData>>(
    createMinListChartData(hourLists),
  );

  const minList = useCallback(
    async (params: { hour?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.layout.getMinuteUrlRequestCntList({ ctx, ...params });
        if (ctx.canceled) return;
        setHourLists(body.list);
        const data = createMinListChartData(body.list);
        setChartData(data);
      } catch (e) {}
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    minList({ hour: data?.label }, ctx);
    const interval = setInterval(() => {
      if (!data) return;
      const now = new Date();
      const seoulOffset = 9 * 60 * 60 * 1000;
      const seoulTime = now.getTime() + seoulOffset;
      const seoulDate = new Date(seoulTime);
      seoulDate.setMinutes(0);
      seoulDate.setSeconds(0);
      minList({ hour: data?.label }, ctx);
    }, 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [minList, refreshToken]);

  return (
    <Box sx={rootSx} className="MinChart-root">
      <Line
        style={{ width: '500px', height: '210px' }}
        ref={chartRef}
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
function createMinListChartData(RATE_RESULT: GetUrlRequestCntVo[]) {
  const labels: string[] = [];
  const cnt: number[] = [];

  for (let i = 0; i < RATE_RESULT.length; i++) {
    labels.push(RATE_RESULT[i].regDttm + '분');
    const class1 = RATE_RESULT[i].cnt;
    cnt.push(class1);
  }

  return {
    labels,
    datasets: [
      {
        label: '분당 URL 호출 갯수',
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
