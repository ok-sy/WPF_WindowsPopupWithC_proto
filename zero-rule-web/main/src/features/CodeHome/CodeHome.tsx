import type { TabLabelValues } from '@/components/CLStyleTabsByTab';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import { routerPush } from '@/lib/urls';
import { Box, Tab } from '@mui/material';
import { useState } from 'react';
import CodeList from './CodeList';
import CodeTypeList from './CodeTypeList';

type Props = {
  tab?: 'codes' | 'code-types';
};

const tabListItem: TabLabelValues[] = [
  {
    tabLabel: '공통 코드',
    tabValue: 'codes',
  },
  {
    tabLabel: '공통 코드 그룹',
    tabValue: 'code-types',
  },
];
export default function CodeHome(props: Props) {
  const [tab, setTab] = useState(() => props.tab ?? 'codes');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'code-types') {
      setTab('code-types');
    } else {
      setTab('codes');
    }
  };

  return (
    <Box className="CodeHome-root" sx={{ py: 1, pl: 1, pr: 3 }}>
      <CLStyleTabsByTab value={tab} onChange={handleTabChange} tabLabelValues={tabListItem}>
        <Tab value="codes" label="공통 코드" />
        <Tab value="code-types" label="공통 코드 그룹" />
      </CLStyleTabsByTab>
      <Box
        sx={{
          overflow: 'auto',
          border: '1px solid #e0e4ee',
          p: 1.5,
          backgroundColor: '#fafafe',
        }}
      >
        {tab === 'codes' && <CodeList />}
        {tab === 'code-types' && <CodeTypeList />}
      </Box>
    </Box>
  );
}
