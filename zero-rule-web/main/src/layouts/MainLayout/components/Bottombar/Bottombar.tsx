import AnimatedText from '@/components/AnimationText';
import type { ErrorViewDialogProps } from '@/components/BottomObserverProvider/components/ErrorViewDialog';
import ErrorViewDialog from '@/components/BottomObserverProvider/components/ErrorViewDialog';
import { mainLayoutConstants } from '@/lib/main-layout-constants';
import theme from '@/theme';
import type { ErrorType } from '@local/domain/src/ErrorHandleStore';
import { formatEpochSeconds, formatStrEpochSeconds } from '@local/ui';
import {
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
  alpha,
  styled,
  useMediaQuery,
} from '@mui/material';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MuiAppBar from '@mui/material/AppBar';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import TimeAgo from 'timeago-react';
const { sidemenu, content } = mainLayoutConstants;
interface Props {
  isSidebarOpen: boolean;
  className?: string;
  error: ErrorType | null;
  clearError: () => void;
  pId?: string;
}
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
  top: 'auto',
  position: 'fixed',
  bottom: 0,
  height: 30,
  borderTop: '1px solid #e0e0e0',
}));
type DialogId = 'ErrorViewDialog';
export default function Bottombar(props: Props) {
  const { className, isSidebarOpen, error, clearError, pId } = props;
  const pIdFnRef = useRef<Props['pId']>();
  pIdFnRef.current = pId;
  const smOrDown = useMediaQuery(theme.breakpoints.down('md'));
  const shift = !!(isSidebarOpen && !smOrDown);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [errorViewDialogProps, setErrorViewDialogProps] = useState<ErrorViewDialogProps>();
  const [dialogId, setDialogId] = useState<DialogId>();

  const handleCloseDialog = useCallback(() => {
    setDialogId(undefined);
    setErrorViewDialogProps(undefined);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!error) return;
    if (error.msgPrntCd === '2') {
      setDialogId('ErrorViewDialog');
      setErrorViewDialogProps({
        errorMsg: error,
        open: true,
        onClose: handleCloseDialog,
        pId: pIdFnRef.current ?? '',
      });
    }
  }, [handleCloseDialog, error, pIdFnRef]);

  const newDate = new Date(Date.now());
  const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
  const day = newDate.getDate().toString().padStart(2, '0');
  const hours = newDate.getHours().toString().padStart(2, '0');
  const minutes = newDate.getMinutes().toString().padStart(2, '0');

  const dateStr = `${month}/${day} ${hours}:${minutes}`;
  const [backgroundColor, setBackgroundColor] = useState<string>('#eee');

  useEffect(() => {
    if (error) {
      setBackgroundColor('#cce7f6');

      const timeoutId = setTimeout(() => {
        setBackgroundColor('#fff'); // 일정 시간 후에 원래 배경색으로 변경
      }, 1500); // 2초 후에 변경

      return () => clearTimeout(timeoutId); // cleanup 함수
    }
  }, [error]);
  return (
    <AppBar
      className={clsx('Bottombar-root', className)}
      position="fixed"
      open={shift && !smOrDown}
      elevation={1}
      ref={rootRef}
      sx={{ backgroundColor: backgroundColor }}
    >
      <Toolbar
        sx={{
          whiteSpace: 'nowrap',
          '&.MuiToolbar-regular': {
            minHeight: 30,
          },
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Stack
          width="100%"
          justifyContent="space-between"
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Typography variant="subtitle2" color="#000">
            {error && error.msgPrntCd === '1' ? error.msgCn : 'NONE'}{' '}
          </Typography>
          <Typography variant="subtitle2" color="#000"></Typography>
          <Typography variant="subtitle2" color="#000">
            {error && error.msgPrntCd === '1' ? dateStr : 'NONE'}
          </Typography>
        </Stack>
      </Toolbar>
      {dialogId === 'ErrorViewDialog' && errorViewDialogProps && (
        <ErrorViewDialog {...errorViewDialogProps} />
      )}
    </AppBar>
  );
}
