import { flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { Layout } from 'react-grid-layout';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useMeasure } from 'react-use';

import ApiDataCntArea from './components/ApiDataCntArea/ApiDataCntArea';

import AmountOfUseByBusiness from './components/AmountOfUseByBusiness/AmountOfUseByBusiness';
import DelayServiceMaxResTime from './components/DelayServiceMaxResTime/DelayServiceMaxResTime';
import FrequentlyCalledUrl from './components/FrequentlyCalledUrl/FrequentlyCalledUrl';
import ProcessingSpeedByUrl from './components/ProcessingSpeedByUrl/ProcessingSpeedByUrl';
import ServiceAvgResTime from './components/ServiceAvgResTime/ServiceAvgResTime';

const rootSx: SxProps = { '& >.MuiBox-root': { border: '1px solid red' } };
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function CloverMainHome() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [rootRef, { width: rootWidth }] = useMeasure<HTMLDivElement>();
  const gridLayoutRef = useRef<any>();
  const [refreshToken, setRefreshToken] = useState(0);
  const theme = useTheme();
  const xsOrDown = useMediaQuery(theme.breakpoints.down('sm'));
  const mdOrDown = useMediaQuery(theme.breakpoints.down('md'));
  const lgOrDown = useMediaQuery(theme.breakpoints.down('lg'));
  const lgOrUp = useMediaQuery(theme.breakpoints.up('lg'));
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState(false);
  const [draggedElement, setDraggedElement] = useState<null | HTMLElement>(null);
  useEffect(() => {
    setRefreshToken(Date.now());
  }, [xsOrDown, mdOrDown, lgOrDown, lgOrUp]);
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [rootWidth, refreshToken]);

  const onLayoutChange = (newLayout: Layout[]) => {
    setLayouts(newLayout);
  };
  const handleDragStart = (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    e: MouseEvent,
    element: HTMLElement,
  ) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedElement(element);
  };
  const handleDragStop = (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    e: MouseEvent,
    element: HTMLElement,
  ) => {
    setIsDragging(false);
    setDraggedElement(null);
  };
  return (
    <Box
      className="CloverMainHome-root"
      ref={rootRef}
      key={refreshToken}
      sx={flatSx(rootSx, {
        pt: 3,
        pb: 7,
        px: 4,
      })}
    >
      <ResponsiveGridLayout
        ref={gridLayoutRef}
        style={{
          overflow: 'hidden',
        }}
        measureBeforeMount={false}
        margin={[20, 20]}
        className="layout"
        cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
        onLayoutChange={onLayoutChange}
        isResizable={false} // 크기 변경 불가능 설정
        isDraggable={!xsOrDown}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
      >
        <Paper
          data-grid={{ x: 0, y: 0, w: 2, h: 1.7, key: 'apiCallCnt1' }}
          key="apiCallCnt1"
          sx={{ p: 2 }}
        >
          <ApiDataCntArea />
        </Paper>
        <Paper
          data-grid={{ x: 2, y: 0, w: 2, h: 1.7, key: 'amountBusiness' }}
          key="amountBusiness"
          sx={{ p: 2 }}
        >
          <AmountOfUseByBusiness />
        </Paper>
        <Paper
          data-grid={{ x: 0, y: 1, w: 2, h: 1.7, key: 'ServiceAvgResTime' }}
          key="ServiceAvgResTime"
          sx={{ p: 2 }}
        >
          <ServiceAvgResTime />
        </Paper>
        <Paper data-grid={{ x: 2, y: 1, w: 2, h: 1.7, key: 'top10-1' }} key="top10-1" sx={{ p: 2 }}>
          <Box>
            <ProcessingSpeedByUrl />
          </Box>
        </Paper>
        <Paper
          data-grid={{ x: 0, y: 2, w: 2, h: 1.7, key: 'deayTime' }}
          key="deayTime"
          sx={{ p: 2 }}
        >
          <DelayServiceMaxResTime />
        </Paper>
        <Paper data-grid={{ x: 2, y: 2, w: 2, h: 1.7, key: 'top10-2' }} key="top10-2" sx={{ p: 2 }}>
          <FrequentlyCalledUrl />
        </Paper>
      </ResponsiveGridLayout>
    </Box>
  );
}
