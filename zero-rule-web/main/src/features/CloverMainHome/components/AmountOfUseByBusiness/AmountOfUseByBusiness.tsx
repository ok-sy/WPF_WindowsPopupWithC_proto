import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, UsedTaskVo } from '@local/domain';
import { Box, Stack, Typography } from '@mui/material';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AmountOfUseByBusiness() {
  const api = useApi();
  const chartRef = useRef<any>(null);
  const [processingSpeedByUrl, setprocessingSpeedByUrl] = useState<UsedTaskVo[]>([]);
  const [loading, setLoading] = useState(false);
  const originLabel = processingSpeedByUrl.map((el) => el.task);

  const options = {
    indexAxis: 'x' as const,
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
            if (context.parsed.y !== null) {
              label += ': ' + context.parsed.y + '건';
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
            size: 11,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const data = {
    labels: originLabel,
    datasets: [
      {
        data: processingSpeedByUrl.map((el) => el.cnt),
        borderColor: '#27374D',
        backgroundColor: '#526D82',
        borderWidth: 1,
        hoverBackgroundColor: '#9DB2BF',
        hoverBorderColor: '#DDE6ED',
        barThickness: 35,
      },
    ],
  };

  const prcsSpdbyUrl = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.layout.usedTask({ ctx });
        setprocessingSpeedByUrl(body.list);
      } catch (err) {
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
      <Typography variant="h5">업무별 사용량</Typography>
      <Stack direction="row" justifyContent="flex-end">
        <div style={{ width: '100%', height: '225px', overflow: 'hidden' }}>
          <Bar options={options} data={data} ref={chartRef} />
        </div>
      </Stack>
    </Box>
  );
}
