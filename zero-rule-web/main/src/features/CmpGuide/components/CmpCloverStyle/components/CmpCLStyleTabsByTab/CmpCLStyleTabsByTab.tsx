import { Box } from '@mui/material';
import { useState } from 'react';
import { rootSx } from './style';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';

export default function CmpCLStyleTabsByTab() {
  // CL 탭
  const [tabKind, setTabKind] = useState('basicInfo');
  return (
    <Box sx={rootSx} className="CmpCLStyleTabsByTab-root">
      <Box className="CmpCLStyleTabsByTab-container">
        <CLStyleTabsByTab
          onChange={(_, v) => {
            setTabKind(v);
          }}
          value={tabKind}
          tabLabelValues={[
            { tabLabel: 'tab1', tabValue: 'tab1' },
            { tabLabel: 'tab2', tabValue: 'tab2' },
          ]}
        />
      </Box>
    </Box>
  );
}
