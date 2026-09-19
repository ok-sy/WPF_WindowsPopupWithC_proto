import { mainLayoutConstants } from '@/lib/main-layout-constants';
import { useNav } from '@/provider/NavProvider';
import useStore from '@/store/useStore';
import { navigation } from '@local/ui';
import { Box, Divider, IconButton, List, Stack, Tooltip } from '@mui/material';
import { observer } from 'mobx-react';
import * as React from 'react';
import { useObservable } from 'react-use';
import { useMainLayoutContext } from '../../MainLayoutContext';
import { rootSx } from './style';
import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
const { appbarHeight, sidemenu } = mainLayoutConstants;

const EMPTY_MENU_MANAGER = new navigation.MenuManager([]);

function CloseSidebar() {
  const { sceneManager } = useMainLayoutContext();
  const { mainLayoutStore } = useStore();

  const scene = useObservable(sceneManager.observeCurrentSceneOrNull(), null);
  const currentUrl = scene?.url;

  const navManager = useNav();
  const menuManager = useObservable(navManager.observeMenuManager(), EMPTY_MENU_MANAGER);
  const menuItems = menuManager?.menuItems ?? [];

  // 링크이동
  const handleClickMenu = (menu: navigation.IMenu) => (e: React.MouseEvent) => {
    e.preventDefault();
    const { href, sectionId } = menu;
    if (sectionId) {
      mainLayoutStore.expandSection(sectionId);
    }
    sceneManager.addScene(menu.href);
  };

  // 섹션 클릭
  const handleClickSection = (section: navigation.ISection) => (_e: React.MouseEvent) => {
    mainLayoutStore.toggleOpen();
    mainLayoutStore.toggleExpandSection(section.sectionId);
  };

  return (
    <Box sx={rootSx} className="CloseSidebar-root">
      <Stack
        justifyContent="center"
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          height: appbarHeight,
          width: '100%',
        }}
      >
        <img
          src={'/images/clover-logo.png'}
          srcSet={'/images/clover-logo.png'}
          alt={'CLOVER 로코'}
          loading="lazy"
          style={{ width: '30px', height: '30px' }}
        />
      </Stack>

      <Divider color={sidemenu.dividerColor} />
      <Box flex={1} className="CloseSidebar-body">
        <List component="nav">
          {menuItems.map((item) => {
            if (item.type === 'menu') {
              return (
                <Tooltip key={item.id} arrow placement="right" title={item.title}>
                  <IconButton
                    sx={{
                      color: menuManager.isMenuPathMatched(item, currentUrl)
                        ? sidemenu.sectionSelectColor
                        : sidemenu.fgColor,
                    }}
                    onClick={handleClickMenu(item)}
                  >
                    <StringToMuiIcon iconName={typeof item.icon === 'string' ? item.icon : ''} />
                  </IconButton>
                </Tooltip>
              );
            }
            if (item.type === 'section') {
              return (
                <Tooltip key={item.id} arrow placement="right" title={item.title}>
                  <IconButton
                    sx={{
                      color: menuManager.isSectionPathMatched(item, currentUrl)
                        ? sidemenu.sectionSelectColor
                        : sidemenu.fgColor,
                    }}
                    onClick={handleClickSection(item)}
                  >
                    <StringToMuiIcon iconName={typeof item.icon === 'string' ? item.icon : ''} />
                  </IconButton>
                </Tooltip>
              );
            }
            return <div key={item.id}>{JSON.stringify(item)}</div>;
          })}
        </List>
      </Box>
    </Box>
  );
}

export default observer(CloseSidebar);
