import { Box, Stack, Tooltip as ToolTip, Typography } from '@mui/material';
import { Bar, Line, getElementAtEvent } from 'react-chartjs-2';
import type { ChartEvent } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  TooltipModel,
} from 'chart.js';
import type { ApiRequestContext, LayoutApiDataProcessingSpeedByUrl } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@/provider';
import errorCustomHandle from '@/lib/error-custom-handle';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProcessingSpeedByUrl() {
  const api = useApi();
  const chartRef = useRef<any>(null);

  const [processingSpeedByUrl, setprocessingSpeedByUrl] = useState<
    LayoutApiDataProcessingSpeedByUrl[]
  >([]);

  // 로딩중 여부
  const [loading, setLoading] = useState(false);
  const originLabel = processingSpeedByUrl.map((el) => el.apiUrlNm);

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
              label += ': ' + context.parsed.x + '건'; // 툴팁에 표시되는 값 소수점 첫 번째 자리까지 포맷팅
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

  const data = {
    labels: originLabel,
    datasets: [
      {
        // label: 'url별 수행속도',
        data: processingSpeedByUrl.map((el) => el.procTmMax),
        borderColor: '#27374D',
        backgroundColor: '#526D82',
        borderWidth: 1,
        hoverBackgroundColor: '#9DB2BF',
        hoverBorderColor: '#DDE6ED',
        barThickness: 11,
      },
    ],
  };

  // url별 수행 속도
  const prcsSpdbyUrl = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.layout.getProcessingSpeedByUrlRequestCntList({ ctx });
        setprocessingSpeedByUrl(body.list);
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
    prcsSpdbyUrl(ctx);
  }, [prcsSpdbyUrl]);

  return (
    <Box>
      <Typography variant="h5">자주쓰는 서비스 TOP10</Typography>
      <Stack direction="row" justifyContent="flex-end">
        <div style={{ width: '100%', height: '225px', overflow: 'hidden' }}>
          <Bar options={options} data={data} ref={chartRef} />
        </div>
      </Stack>
    </Box>
  );
}
