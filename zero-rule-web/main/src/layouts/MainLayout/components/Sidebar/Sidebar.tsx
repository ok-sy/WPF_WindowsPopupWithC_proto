import { mainLayoutConstants } from '@/lib/main-layout-constants';
import { useNav } from '@/provider/NavProvider';
import useStore from '@/store/useStore';
import { Link, navigation } from '@local/ui';
import ArrowBackIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListSubheader,
  Stack,
  TextField,
} from '@mui/material';
import { observer } from 'mobx-react';
import React, { useRef } from 'react';
import { useObservable } from 'react-use';
import { useMainLayoutContext } from '../../MainLayoutContext';
import LeftBottomProfile from './components/LeftBottomProfile';
import SectionMenu from './components/SectionMenu';
import SideMenuItem from './components/SideMenuItem';
import { rootSx } from './style';

const { appbarHeight, sidemenu } = mainLayoutConstants;

const EMPTY_MENU_MANAGER = new navigation.MenuManager([]);

function Sidebar() {
  const { sceneManager } = useMainLayoutContext();
  const { mainLayoutStore } = useStore();

  const scene = useObservable(sceneManager.observeCurrentSceneOrNull(), null);
  const currentUrl = scene?.url;

  const controlKeyDownRef = useRef(false);

  React.useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      // console.log(e)
      controlKeyDownRef.current = e.ctrlKey && !e.altKey && !e.shiftKey;
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleDown);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleDown);
    };
  }, []);

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

    // next router는 사용불가, sceneManager를 사용
    // router.push(href)

    // 컨트롤 키를 누르면 무조건 새탭으로
    if (controlKeyDownRef.current) {
      sceneManager.addScene(menu.href);
      return;
    }

    // 기존 탭을 선택할 수 있다면 선택한다
    const scene = sceneManager.findSceneByUrl(menu.href);
    if (scene) {
      sceneManager.selectBySceneId(scene.sceneId);
    } else {
      sceneManager.addScene(menu.href);
    }
  };

  // 섹션 클릭
  const handleClickSection = (section: navigation.ISection) => (_e: React.MouseEvent) => {
    mainLayoutStore.toggleExpandSection(section.sectionId);
  };

  return (
    <Box sx={rootSx} className="Sidebar-root">
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          height: appbarHeight,
          width: '100%',
          pl: 2,
          pr: 1,
        }}
      >
        <Link
          href="/"
          sx={{
            flex: 1,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            color: '#000',
            '&:hover': {
              color: (theme) => theme.palette.primary.dark,
            },
            '&:hover .MuiSvgIcon-root': {
              color: (theme) => theme.palette.primary.dark,
            },
          }}
        >
          <Stack direction="row">
            <img
              src={'/images/clover-logo.png'}
              srcSet={'/images/clover-logo.png'}
              alt={'CLOVER 로코'}
              loading="lazy"
              style={{ height: '35px' }}
            />
            <Box
              sx={{
                position: 'relative',
                width: '150px',
                height: '35px',
                overflow: 'hidden',
              }}
            >
              <img
                src={'/images/negative01.png'}
                srcSet={'/images/negative01.png'}
                alt={'CLOVER 로코'}
                loading="lazy"
                style={{ position: 'relative', top: 0, left: 0, height: '35px', marginLeft: -35 }}
              />
            </Box>
          </Stack>
        </Link>
        <IconButton onClick={() => mainLayoutStore.toggleOpen()} sx={{ ml: 'auto', color: '#fff' }}>
          <ArrowBackIcon />
        </IconButton>
      </Stack>
      <Divider color={sidemenu.dividerColor} />
      <Box flex={1} sx={{ overflow: 'auto' }} className="Sidebar-body">
        <List component="nav">
          {menuItems.map((item) => {
            if (item.type === 'menu') {
              return (
                <SideMenuItem
                  className="Sidebar-sideMenuItem"
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  active={menuManager.isMenuPathMatched(item, currentUrl)}
                  onClick={handleClickMenu(item)}
                  depth1
                />
              );
            }
            if (item.type === 'divider') {
              return <Divider key={item.id} color={sidemenu.dividerColor} />;
            }
            if (item.type === 'label') {
              return (
                <ListSubheader key={item.id} className="Sidebar-label">
                  {item.title}
                </ListSubheader>
              );
            }
            if (item.type === 'section') {
              const section = item as navigation.ISection;
              return (
                <SectionMenu
                  key={item.id}
                  section={section}
                  menuManager={menuManager}
                  currentHref={currentUrl}
                  expanded={mainLayoutStore.expandedSectionIds.includes(section.sectionId)}
                  onClickMenu={handleClickMenu}
                  onClickSection={handleClickSection(section)}
                />
              );
            }
            return <div key={item}>{JSON.stringify(item)}</div>;
          })}
        </List>
      </Box>
      <LeftBottomProfile />
    </Box>
  );
}

export default observer(Sidebar);
