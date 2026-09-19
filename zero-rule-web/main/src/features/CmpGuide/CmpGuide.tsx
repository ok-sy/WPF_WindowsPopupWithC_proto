import { Portlet, PortletContent } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import { useState } from 'react';
import CmpChartStyle from './components/CmpChartStyle/CmpChartStyle';
import CmpCloverStyle from './components/CmpCloverStyle/CmpCloverStyle';
import CmpMuiStyle from './components/CmpMuiStyle';
import CloverDataGridHome from './components/CloverDataGridHome';
import type { TabLabelValues } from '@/components/CLStyleTabsByTab';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';

const rootSx: SxProps = {
  pr: 3,
  py: 1,
  pl: 1,
};

type TabKind = 'mui' | 'clover' | 'chart' | 'grid';

const tabListItem: TabLabelValues[] = [
  {
    tabLabel: 'CLOVER',
    tabValue: 'clover',
  },
  {
    tabLabel: 'MUI',
    tabValue: 'mui',
  },
  {
    tabLabel: 'CHART',
    tabValue: 'chart',
  },
  {
    tabLabel: 'GRID',
    tabValue: 'grid',
  },
];
export default function CmpGuide() {
  const [tabKind, setTabKind] = useState<TabKind>('clover');

  return (
    <Box sx={rootSx} className="CmpGuide-root">
      <CLStyleTabsByTab
        onChange={(_, v) => {
          setTabKind(v as TabKind);
        }}
        value={tabKind}
        tabLabelValues={tabListItem}
      />
      <Portlet>
        <PortletContent noPadding>
          {tabKind === 'clover' && <CmpCloverStyle />}
          {tabKind === 'mui' && <CmpMuiStyle />}
          {tabKind === 'chart' && <CmpChartStyle />}
          {tabKind === 'grid' && <CloverDataGridHome />}
        </PortletContent>
      </Portlet>
    </Box>
  );
}
