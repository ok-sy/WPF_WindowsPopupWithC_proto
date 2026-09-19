import type { TabLabelValues } from '@/components/CLStyleTabsByTab';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';
import { Box, Paper } from '@mui/material';
import { useState } from 'react';
import PrivHome from './PrivHome';
import RoleList from './RoleList';

type TabKind = 'roles' | 'privileges';

const tabListItem: TabLabelValues[] = [
  {
    tabLabel: 'ROLE 관리',
    tabValue: 'roles',
  },
  {
    tabLabel: '권한 관리',
    tabValue: 'privileges',
  },
];

export default function RoleSettingsHome() {
  const [tabKind, setTabKind] = useState<TabKind>('roles');

  return (
    <Box
      className="RoleSettingsHome-root"
      sx={{
        py: 1,
        pl: 1,
        pr: 3,
      }}
    >
      <CLStyleTabsByTab
        onChange={(_, v) => {
          setTabKind(v as TabKind);
        }}
        value={tabKind}
        tabLabelValues={tabListItem}
      />
      <Paper sx={{ p: 2 }}>
        {tabKind === 'roles' && <RoleList />}
        {tabKind === 'privileges' && <PrivHome />}
      </Paper>
    </Box>
  );
}
