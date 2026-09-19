import type { TabLabelValues } from '@/components/CLStyleTabsByTab';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';
import { Box } from '@mui/material';
import { useState } from 'react';
import TeamListView from './components/TeamListView';
import UserListView from './components/UserListView';

type TabKind = 'user' | 'team';
const tabListItem: TabLabelValues[] = [
  {
    tabLabel: 'USER',
    tabValue: 'user',
  },
  {
    tabLabel: 'TEAM',
    tabValue: 'team',
  },
];

export default function UserMgmtHome() {
  const [tabKind, setTabKind] = useState<TabKind>('user');

  return (
    <Box
      sx={{
        py: 1,
        pl: 1,
        pr: 3,
        whiteSpace: 'nowrap',
        overflow: {
          xs: 'auto',
          md: 'hidden',
        },
      }}
      className="UserMgmtHome-root"
    >
      <Box>
        <CLStyleTabsByTab
          onChange={(_, v) => {
            setTabKind(v as TabKind);
          }}
          value={tabKind}
          tabLabelValues={tabListItem}
        />
        <Box
          sx={{ overflow: 'auto', border: '1px solid #e0e4ee', p: 1.5, backgroundColor: '#fafafe' }}
        >
          {tabKind === 'user' && <UserListView sx={{ flex: 1 }} />}
          {tabKind === 'team' && <TeamListView />}
        </Box>
      </Box>
    </Box>
  );
}
