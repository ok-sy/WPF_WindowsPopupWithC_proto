import { Portlet, PortletContent, PortletFooter, PortletHeader } from '@local/ui';
import { Check } from '@mui/icons-material';
import { Box, Stack } from '@mui/material';
import { useState } from 'react';
import { rootSx } from './style';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import BbsClipboardButton from '@/components/BbsClipboardButton';
import CLStyledButton from '@/components/CLStyledButton';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';
export default function CmpPortlet() {
  const [tabKind, setTabKind] = useState('basicInfo');
  return (
    <Box sx={rootSx} className="CmpPortlet-root">
      <Box className="CmpPortlet-container">
        <Portlet>
          <PortletHeader>헤더</PortletHeader>
          <PortletContent>콘텐트</PortletContent>
          <PortletFooter>바텀</PortletFooter>
        </Portlet>
        <Box>
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
          <Portlet>
            <PortletContent>
              <CLDocLabelInput title="CLDocLabelInput" />

              <CLDocLabelSelect title="CLDocLabelSelect" arr={['sel1', 'sel2', 'sel3']} />
            </PortletContent>
            <PortletFooter>
              <Stack direction="row" justifyContent="space-between">
                <BbsClipboardButton textProviderFunc={() => 'outlined 주소복사'} />
                <CLStyledButton startIcon={<Check />}>CLOVER</CLStyledButton>
              </Stack>
            </PortletFooter>
          </Portlet>
        </Box>
      </Box>
    </Box>
  );
}
