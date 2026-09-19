import { Box, Grid2, Stack, Typography } from '@mui/material';
import AreaChart from './components/AreaChart/AreaChart';
import BubbleChart from './components/BubbleChart/BubbleChart';
import ChartBanner from './components/ChartBanner/ChartBanner';
import DoughnutChart from './components/DoughnutChart/DoughnutChart';
import GroupedBarChart from './components/GroupedBarChart/GroupedBarChart';
import HorizontalBarChart from './components/HorizontalBarChart/HorizontalBarChart';
import LineChart from './components/LineChart/LineChart';
import MultiaxisLineChart from './components/MultiaxisLineChart/MultiaxisLineChart';
import MultitypeChart from './components/MultitypeChart/MultitypeChart';
import PieChart from './components/PieChart/PieChart';
import PolarAreaChart from './components/PolarAreaChart/PolarAreaChart';
import RadarChart from './components/RadarChart/RadarChart';
import ScatterChart from './components/ScatterChart/ScatterChart';
import StackedBarChart from './components/StackedBarChart/StackedBarChart';
import VerticalBarChart from './components/VerticalBarChart/VerticalBarChart';
import { rootSx } from './style';
import { useState } from 'react';

export default function CmpChartStyle() {
  const [time, setTime] = useState(2000);

  return (
    <Box sx={rootSx} className="CmpChartStyle-root">
      <ChartBanner
        time={time}
        setTime={(tf: number) => {
          console.log(tf);
          setTime(tf);
        }}
      />
      <Stack p={3} spacing={5}>
        <Grid2 container spacing={3}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Vertical Bar Chart
            </Typography>
            <VerticalBarChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Horizontal Bar Chart
            </Typography>
            <HorizontalBarChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Stacked Bar Chart
            </Typography>
            <StackedBarChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Grouped Bar Chart
            </Typography>
            <GroupedBarChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Area Chart
            </Typography>
            <AreaChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Line Chart
            </Typography>
            <LineChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Multiaxis Line Chart
            </Typography>
            <MultiaxisLineChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Polar Area Chart
            </Typography>
            <PolarAreaChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Radar Chart
            </Typography>
            <RadarChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Scatter Chart
            </Typography>
            <ScatterChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Bubble Chart
            </Typography>
            <BubbleChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Multitype Chart
            </Typography>
            <MultitypeChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Pie Chart
            </Typography>
            <PieChart time={time} />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpChartStyle-title" variant="h4">
              Doughnut Chart
            </Typography>
            <DoughnutChart time={time} />
          </Grid2>
        </Grid2>
      </Stack>
    </Box>
  );
}
