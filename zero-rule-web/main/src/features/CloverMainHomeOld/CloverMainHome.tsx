import { flatSx } from '@local/ui';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { Layout } from 'react-grid-layout';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useMeasure } from 'react-use';
import AreaGraph from './components/AreaGraph';
import BarGraph from './components/BarGraph';
import BubbleGraph from './components/BubbleGraph';
import DoughnutGraph from './components/DoughnutGraph';
import LatestList from './components/LatestList/LatestList';
import LatestNotice from './components/LatestNotice/LatestNotice';
import MyBox from './components/MyBox/MyBox';
import PolarAreaGraph from './components/PolarAreaGraph';
import ScatterGraph from './components/ScatterGraph';
import { rootSx } from './style';
import { SAMPLE_TODAY, SAMPLE_TOTAL } from './todays-sample';

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
  useEffect(() => {
    setRefreshToken(Date.now());
  }, [xsOrDown, mdOrDown, lgOrDown, lgOrUp]);
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [rootWidth, refreshToken]);

  const onLayoutChange = (newLayout: Layout[]) => {
    setLayouts(newLayout);
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
      >
        {SAMPLE_TODAY.map((it, i) => (
          <div data-grid={{ x: i, y: 1, w: 1, h: 1.12, key: `a ${i}` }} key={`a ${i}`}>
            <MyBox key={it.title} item={it} className={i > 0 ? 'MyBox-border' : undefined} />
          </div>
        ))}
        <div data-grid={{ x: 0, y: 0, w: 1, h: 1.67, key: 'e1' }} key="e1">
          <AreaGraph />
        </div>
        <div data-grid={{ x: 1, y: 0, w: 1, h: 1.67, key: 'e2' }} key="e2">
          <PolarAreaGraph />
        </div>
        <div data-grid={{ x: 2, y: 0, w: 1, h: 1.67, key: 'e3' }} key="e3">
          <ScatterGraph />
        </div>
        <div data-grid={{ x: 3, y: 0, w: 1, h: 1.67, key: 'e4' }} key="e4">
          <BubbleGraph />
        </div>

        <div data-grid={{ x: 0, y: 2, w: 2.5, h: 3.13, key: 'b1' }} key="b1">
          <BarGraph totalData={SAMPLE_TOTAL} todayData={SAMPLE_TODAY} />
        </div>
        <div data-grid={{ x: 7, y: 2, w: 1.5, h: 3.13, key: 'b2' }} key="b2">
          <DoughnutGraph totalData={SAMPLE_TOTAL} todayData={SAMPLE_TODAY} />
        </div>
        <div data-grid={{ x: 0, y: 3, w: 1.5, h: 3.1, key: 'c' }} key="c">
          <LatestList />
        </div>
        <div data-grid={{ x: 6, y: 3, w: 2.5, h: 3.1, key: 'd' }} key="d">
          <LatestNotice />
        </div>
      </ResponsiveGridLayout>
    </Box>
  );
}
