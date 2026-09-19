import type { PageListDialogProps } from '@/dialogs/PageListDialog';
import PageListDialog from '@/dialogs/PageListDialog';
import { mainLayoutConstants } from '@/lib/main-layout-constants';
import { isEnterKeyEvent } from '@local/ui';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { Box, IconButton, Stack, TextField, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MuiAppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useObservable } from 'react-use';
import { useMainLayoutContext } from '../../MainLayoutContext';
import SceneTabs from '../SceneTabs';
import CLStyledTextField from '@/components/CLStyledTextField/CLStyledTextField';
const { sidemenu, content } = mainLayoutConstants;
type DialogId = 'PageListDialog';

interface Props {
  isSidebarOpen: boolean;
  className?: string;
  onClickMenuButton: () => void;
}

// const drawerWidth = 300
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: useMediaQuery(theme.breakpoints.down('md'))
    ? theme.zIndex.drawer
    : theme.zIndex.drawer + 1,
  backgroundColor: '#fff',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: useMediaQuery(theme.breakpoints.down('md')) ? 0 : sidemenu.closeWidth,
  width: useMediaQuery(theme.breakpoints.down('md'))
    ? '100%'
    : `calc(100% - ${sidemenu.closeWidth}px)`,
  ...(open && {
    marginLeft: sidemenu.openWidth,
    width: `calc(100% - ${sidemenu.openWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: '0.2s',
    }),
  }),
}));

export default function Topbar(props: Props) {
  const { className, isSidebarOpen, onClickMenuButton } = props;
  const { sceneManager } = useMainLayoutContext();
  const theme = useTheme();
  const smOrDown = useMediaQuery(theme.breakpoints.down('md'));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shift = !!(isSidebarOpen && !smOrDown);
  const [inputPageKey, setInputPageKey] = useState('');
  const [dialogId, setDialogId] = useState<DialogId>();
  const [pageListDialogProps, setPageListDialogProps] = useState<PageListDialogProps>();
  const currentPage = useObservable(sceneManager.observeCurrentSceneOrNull(), null);

  // 페이지 번호입력 텍스트 필드 포커스
  useHotkeys('alt+shift+k', (event) => {
    const root = rootRef.current;
    if (!root) return;
    const input = root.querySelector<HTMLInputElement>('.Topbar-pageKeyTextField input');
    input?.focus();
  });

  // 현재 페이지 닫기
  useHotkeys('alt+shift+x', (event) => {
    if (!currentPage) return;
    sceneManager.deleteBySceneId(currentPage?.sceneId);
  });

  // 페이지 목록 다이얼로그 띄우기
  useHotkeys('alt+shift+l', () => {
    openPageListDialog.current();
  });

  const handleCloseDialog = () => {
    setDialogId(undefined);
    setPageListDialogProps(undefined);
  };

  const openPageListDialog = useRef(() => {
    setDialogId('PageListDialog');
    setPageListDialogProps({
      open: true,
      onClose: handleCloseDialog,
    });
  });

  const routeByPageKey = (pageKey: string) => {
    sceneManager.routeByPageKey(pageKey);
  };

  const handleClickPageList = () => {
    openPageListDialog.current();
  };

  return (
    <AppBar
      className={clsx('Topbar-root', className)}
      position="fixed"
      open={shift && !smOrDown}
      sx={{
        height: 40,
        backgroundColor: '#fff',
        boxShadow: 'none',
        borderBottom: '1px solid #e0e0e0',
      }}
      elevation={1}
      ref={rootRef}
    >
      <Toolbar
        sx={{
          whiteSpace: 'nowrap',
          '&.MuiToolbar-regular': {
            minHeight: 40,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          sx={{ width: '100%', height: '100%' }}
        >
          <IconButton
            onClick={onClickMenuButton}
            aria-label="open drawer"
            edge="start"
            size="small"
            sx={{
              flex: 0,
              color: '#000',
            }}
          >
            {isSidebarOpen ? (
              <MenuOpenIcon fontSize="small" htmlColor="#000" />
            ) : (
              <MenuIcon fontSize="small" htmlColor="#000" />
            )}
          </IconButton>
          <Box
            sx={{
              flex: 1,
              pl: 1,
              display: 'flex',
              height: '100%',
              alignItems: 'self-end',
            }}
          >
            {sceneManager.count() > 0 && <SceneTabs sx={{ flex: 1, width: 0 }} />}
          </Box>
          <CLStyledTextField
            className="Topbar-pageKeyTextField"
            value={inputPageKey ?? ''}
            onChange={(e) => setInputPageKey(e.target.value)}
            placeholder="페이지 번호"
            type="text"
            size="small"
            style={{
              flexBasis: 120,
              // flexShrink: 0,
              // flexGrow: 0,
            }}
            onKeyDown={(e) => {
              if (inputPageKey.length > 0 && isEnterKeyEvent(e)) {
                routeByPageKey(inputPageKey);
              }
            }}
          />
          <IconButton size="small" sx={{ flex: 0, ml: 1 }} onClick={handleClickPageList}>
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Toolbar>
      {dialogId === 'PageListDialog' && pageListDialogProps && (
        <PageListDialog {...pageListDialogProps} />
      )}
    </AppBar>
  );
}
