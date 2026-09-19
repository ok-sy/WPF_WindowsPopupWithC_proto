import type { TabLabelValues } from '@/components/CLStyleTabsByTab';
import CLStyleTabsByTab from '@/components/CLStyleTabsByTab';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import { Portlet, PortletContent } from '@local/ui';
import { Box, LinearProgress } from '@mui/material';
import { useState } from 'react';
import InterfaceMapMgmt from './components/InterfaceMapMgmt/InterfaceMapMgmt';
import InterfaceMgmt from './components/InterfaceMgmt';
import InterfaceSearch from './components/InterfaceSearch';
import { rootSx } from './style';

type TabKind = 'interface-mgmt' | 'interface-column-mgmt';
const tabListItem: TabLabelValues[] = [
  {
    tabLabel: '인터페이스 정보',
    tabValue: 'interface-mgmt',
  },
  {
    tabLabel: '인터페이스 필드정보',
    tabValue: 'interface-column-mgmt',
  },
];
export type InterfaceInfoParams = {
  ifid: string;
  ifNm: string;
};
export const INTERFACE_INFO_DEFAULT_PARAMS: InterfaceInfoParams = {
  ifid: '',
  ifNm: '',
};
export default function InterfaceMgmtHome() {
  const [tabKind, setTabKind] = useState<TabKind>('interface-mgmt');
  const [loading, setLoading] = useState(false);

  const [interfaceInfoParams, setInterfaceInfoParams] = useState<InterfaceInfoParams>({
    ...INTERFACE_INFO_DEFAULT_PARAMS,
  });
  const [doubleClickId, setDoubleClickId] = useState<{ ifid: string; ifNm: string }>();

  return (
    <Box sx={rootSx} className="InterfaceMgmtHome-root">
      {loading && (
        <Box className="loading-box">
          <LinearProgress />
        </Box>
      )}
      <Portlet>
        <PortletContent>
          <SubTitleAndIcon labelTitle="조회" />
          <InterfaceSearch
            isInterfaceInfo={tabKind === 'interface-mgmt'}
            doubleClickId={doubleClickId}
            onSubmit={(data) => {
              setDoubleClickId(undefined);
              setInterfaceInfoParams({ ...data });
            }}
            onSubmitTabVal={(val) => setTabKind(val as TabKind)}
          />
          <CLStyleTabsByTab
            size="medium"
            onChange={(_, v) => {
              if (tabKind === 'interface-mgmt') {
                return;
              }
              setTabKind(v as TabKind);
            }}
            value={tabKind}
            tabLabelValues={tabListItem}
          />
          <Box className="tab-content">
            {tabKind === 'interface-mgmt' && (
              <InterfaceMgmt
                searchOption={interfaceInfoParams}
                onSubmitDoubleClick={(ifid, ifNm) => {
                  setDoubleClickId({ ifid, ifNm });
                  setTabKind('interface-column-mgmt');
                }}
                loading={loading}
                setLoading={(loading) => setLoading(loading)}
              />
            )}
            {tabKind === 'interface-column-mgmt' && (
              <InterfaceMapMgmt doubleClickId={doubleClickId ?? { ifid: '', ifNm: '' }} />
            )}
          </Box>
        </PortletContent>
      </Portlet>
    </Box>
  );
}
