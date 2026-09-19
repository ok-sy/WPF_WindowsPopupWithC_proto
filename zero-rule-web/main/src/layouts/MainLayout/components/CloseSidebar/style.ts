import { mainLayoutConstants } from '@/lib/main-layout-constants';
import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = {
  backgroundColor: mainLayoutConstants.sidemenu.bgColor,
  height: '100%',
  overflow: 'hidden',
  '& .CloseSidebar-body': {
    height: '100%',
    overflow: 'auto',
    // 스크롤바 영역
    '::-webkit-scrollbar': {
      width: 3,
    },
    // 스크롤바 움직이는 자체 그놈
    '::-webkit-scrollbar-thumb': {
      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.3),
      borderRadius: 7,
    },
    // 스크롤바 뒷배경
    '::-webkit-scrollbar-track': {},
  },
};
