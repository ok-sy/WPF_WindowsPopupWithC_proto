import type { TabLabelValues } from '@/components/CLStyleTabsByTab';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import { useState } from 'react';
import RuleDeploy from './components/RuleDeploy';
import RuleDeployInfo from './components/RuleDeployInfo';
import { Portlet, PortletContent } from '@local/ui';

const rootSx: SxProps = { py: 1, pl: 1, pr: 3 };

type TabKind = 'rule-deploy' | 'rule-deploy-info';
const tabListItem: TabLabelValues[] = [
  {
    tabLabel: '룰배포',
    tabValue: 'rule-deploy',
  },
  {
    tabLabel: '룰배포 내역',
    tabValue: 'rule-deploy-info',
  },
];
export default function RuleDeployHome() {
  const [tabKind, setTabKind] = useState<TabKind>('rule-deploy');

  return (
    <Box sx={rootSx} className="RuleDeployHome-root">
      <Portlet>
        <PortletContent>
          <CLStyleTabsByTab
            size="medium"
            onChange={(_, v) => {
              setTabKind(v as TabKind);
            }}
            value={tabKind}
            tabLabelValues={tabListItem}
          />
          <Box sx={{ border: '1px solid #e0e0e0', p: 1 }}>
            {tabKind === 'rule-deploy' ? <RuleDeploy /> : <RuleDeployInfo />}
          </Box>
        </PortletContent>
      </Portlet>
    </Box>
  );
}
