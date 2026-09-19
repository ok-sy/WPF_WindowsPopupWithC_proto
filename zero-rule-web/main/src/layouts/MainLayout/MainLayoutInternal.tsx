import type { CustomBreadcrumbsProps } from '@/components/CustomBreadcrumbs';
import CustomBreadcrumbs from '@/components/CustomBreadcrumbs';
import { mainLayoutConstants } from '@/lib/main-layout-constants';
import { useNav } from '@/provider/NavProvider';
import SceneContainer from '@/scene/SceneContainer';
import useStore from '@/store/useStore';
import { useElementOffset } from '@local/ui';
import { alpha, Box, Divider, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useState } from 'react';
import { SceneManager } from '../../scene/SceneManager';
import CloseSidebar from './components/CloseSidebar';
import { DrawerHeader } from './components/DrawerHeader';
import Sidebar from './components/Sidebar';
import SidebarAutoOpenCheck from './components/SidebarAutoOpenCheck';
import Topbar from './components/Topbar';
import type { IMainLayoutContext } from './MainLayoutContext';
import { MainLayoutContext } from './MainLayoutContext';
import { rootSx } from './style';
import BottomErrorObserveProvider from '@/components/BottomObserverProvider/BottomObserverProvider';

const { sidemenu, content } = mainLayoutConstants;

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'contentShift',
})<{
  contentShift: number;
}>(({ theme, contentShift }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: alpha(theme.palette.primary.light, 0.04),
  flexGrow: 1,
  padding: 0,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: '0.2s',
  }),
  marginLeft: contentShift,
  ...(contentShift !== 0 && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: '0.2s',
    }),
  }),
  ...(contentShift === 0 && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: '0.2s',
    }),
  }),
}));

type Props = {
  title?: React.ReactNode;
  breadcrumbProps?: CustomBreadcrumbsProps;
  contentPaddingBottom?: number;
  noTopMargin?: boolean;

  children?: React.ReactElement;
};

function MainLayoutInternal(props: Props) {
  const {
    title,
    breadcrumbProps,
    contentPaddingBottom = 20,
    children,
    noTopMargin = false,
  } = props;
  const defaultTheme = useTheme();
  const smOrDown = useMediaQuery(defaultTheme.breakpoints.down('md'));
  const { mainLayoutStore } = useStore();
  const navManager = useNav();

  const sceneManager = useMemo(() => new SceneManager(navManager), [navManager]);

  // 왼쪽메뉴 가로길이
  const [sidemenuWidth, setSidemenuWidth] = useState<number>(sidemenu.openWidth);
  // 왼쪽 메뉴가 열리고 닫힐때마다 왼쪽메뉴 길이 변경
  useEffect(() => {
    setSidemenuWidth(mainLayoutStore.opened ? sidemenu.openWidth : sidemenu.closeWidth);
  }, [mainLayoutStore.opened]);

  const isSidebarOpen = mainLayoutStore.opened;
  const contentShift = smOrDown ? 0 : isSidebarOpen ? sidemenu.openWidth : sidemenu.closeWidth;

  // ref 대신 state로 한 것은 의도한 것
  // nextjs에서 페이지가 변경되면 body의 위치 체크를 다시하는 용도
  const [bodyElement, setBodyElement] = useState<HTMLElement | null>(null);

  // bodyElement의 좌측 상단의 위치
  const bodyPosition = useElementOffset(bodyElement, [contentShift]);

  const contextData: IMainLayoutContext = useMemo(
    () => ({
      layoutBodyPosition: bodyPosition,
      sceneManager,
    }),
    [bodyPosition, sceneManager],
  );

  useEffect(() => {
    const s1 = sceneManager.observeCurrentSceneOrNull().subscribe();
    return () => {
      s1.unsubscribe();
    };
  }, [sceneManager]);

  return (
    <MainLayoutContext.Provider value={contextData}>
      <Box className="MainLayout-root" sx={rootSx}>
        <SidebarAutoOpenCheck />
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onClickMenuButton={() => mainLayoutStore.toggleOpen()}
        />
        <Drawer
          open={isSidebarOpen}
          sx={{
            width: sidemenuWidth,
            '& .MuiDrawer-paper': {
              width: sidemenuWidth,
              boxSizing: 'border-box',
              backgroundColor: sidemenu.bgColor,
              color: 'white',
            },
          }}
          variant={smOrDown ? 'temporary' : 'permanent'}
          anchor="left"
          onClose={() => mainLayoutStore.setOpened(false)}
        >
          <Divider />
          {isSidebarOpen ? <Sidebar /> : <CloseSidebar />}
        </Drawer>
        <Main
          contentShift={contentShift}
          className="MainLayout-bodyContainer"
          style={{
            paddingBottom: `${contentPaddingBottom}px`,
          }}
        >
          <DrawerHeader sx={{ minHeight: 40 }} />
          {breadcrumbProps && <CustomBreadcrumbs {...breadcrumbProps} />}
          <Box
            className="MainLayout-body"
            ref={setBodyElement}
            sx={{
              mt: breadcrumbProps && !noTopMargin ? 2 : 0,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minHeight: `calc(91vh - ${bodyPosition.y}px)`,
              maxWidth: `calc(100vw - ${bodyPosition.x}px)`,
            }}
          >
            <SceneContainer />
            {children}
          </Box>
        </Main>

        <BottomErrorObserveProvider isSidebarOpen={isSidebarOpen} />
      </Box>
    </MainLayoutContext.Provider>
  );
}

export default observer(MainLayoutInternal);
