import useStore from '@/store/useStore';
import { useMediaQuery, useTheme } from '@mui/material';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';

/**
 * Large 화면에서 왼쪽 메뉴가 기본으로 열리도록 체크하는 컴포넌트
 */
function SidebarAutoOpenCheck() {
  const { mainLayoutStore } = useStore();
  const theme = useTheme();
  const smOrDown = useMediaQuery(theme.breakpoints.down('md'));
  const isAutoOpenChecked = mainLayoutStore.isAutoOpenChecked;
  const isSidebarOpen = mainLayoutStore.opened;
  const [prepared, setPrepared] = useState(false);

  useEffect(() => {
    setPrepared(true);
  }, []);

  useEffect(() => {
    if (!prepared) return;
    if (isAutoOpenChecked) return;

    if (!smOrDown && !isSidebarOpen) {
      mainLayoutStore.setOpened(true);
    }
    mainLayoutStore.setAutoOpenChecked(true);
  }, [prepared, smOrDown, isAutoOpenChecked, mainLayoutStore, isSidebarOpen]);

  return null;
}

export default observer(SidebarAutoOpenCheck);
