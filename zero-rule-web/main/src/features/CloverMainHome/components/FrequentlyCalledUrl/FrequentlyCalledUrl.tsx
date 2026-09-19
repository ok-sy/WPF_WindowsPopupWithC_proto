import { Box, Stack, Tooltip as ToolTip, Typography } from '@mui/material';
import { Bar, Line, getElementAtEvent } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  ChartEvent,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  TooltipModel,
} from 'chart.js';
import type { ApiRequestContext, LayoutApiDataFrequentlyCalledUrl } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@/provider';
import errorCustomHandle from '@/lib/error-custom-handle';

export default function FrequentlyCalledUrl() {
  const api = useApi();
  const chartRef = useRef<any>(null);

  const [frequentlyCalledUrl, setfrequentlyCalledUrl] = useState<
    LayoutApiDataFrequentlyCalledUrl[]
  >([]);
  // 로딩중 여부

  const [loading, setLoading] = useState(false);
  // url별 호출 빈도

  const callsByUrl = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.layout.getFrequentlyCalledUrlRequestCntList({ ctx });
        setfrequentlyCalledUrl(body.list);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    callsByUrl(ctx);
  }, [callsByUrl]);

  useEffect(() => {
    console.log('frequentlyCalledUrlfrequentlyCalledUrlfrequentlyCalledUrl');
    console.log(frequentlyCalledUrl);
  }, []);

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      bar: {
        borderWidth: 1,
      },
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
            if (context.parsed.x !== null) {
              label += ': ' + (+context.parsed.x).toFixed(3) + '초'; // 툴팁에 표시되는 값 소수점 첫 번째 자리까지 포맷팅
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          font: {
            size: 11, // y축 레이블 글자 크기 조정
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11, // x축 레이블 글자 크기 기본값
          },
        },
      },
    },
  };

  const originLabel = frequentlyCalledUrl.map((el) => el.apiUrlNm);

  const data = {
    labels: originLabel,
    datasets: [
      {
        // label: 'url별 수행속도',
        data: frequentlyCalledUrl.map((el) => el.cnt),
        borderColor: '#365E32',
        backgroundColor: '#81A263',
        borderWidth: 1,
        hoverBackgroundColor: '#E7D37F',
        hoverBorderColor: '#FD9B63',
        barThickness: 11,
      },
    ],
  };
  return (
    <Box>
      <Typography variant="h5">지연 서비스 TOP10</Typography>
      <Stack direction="row" justifyContent="flex-end">
        <div style={{ width: '100%', height: '225px', overflow: 'hidden' }}>
          <Bar options={options} data={data} ref={chartRef} />
        </div>
      </Stack>
    </Box>
  );
}
