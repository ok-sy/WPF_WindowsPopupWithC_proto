import { mainLayoutConstants } from '@/lib/main-layout-constants';
import type { AppBarProps as MuiAppBarProps } from '@mui/material';
import { AppBar as MuiAppBar } from '@mui/material';
import { styled } from '@mui/material/styles';

const { sidemenu } = mainLayoutConstants;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

interface AppBarProps extends MuiAppBarProps {
  shift: boolean;
}

export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'shift',
})<AppBarProps>(({ theme, shift }) => ({
  boxShadow: 'none',
  minHeight: 'unset',
  maxWidth: '100%',

  zIndex: theme.zIndex.drawer + (shift ? 1 : -1),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: '0.2s',
  }),
  background: sidemenu.bgColor,
  color: '#000',
  ...(shift && {
    width: `calc(100% - ${sidemenu.openWidth}px)`,
    marginLeft: sidemenu.openWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: '0.2s',
    }),
  }),
  ...(!shift && {
    '& .MuiToolbar-root': {
      paddingLeft: theme.spacing(3.5),
      [theme.breakpoints.down('xs')]: {
        paddingLeft: theme.spacing(3),
      },
    },
  }),
}));
