import { mainLayoutConstants } from '@/lib/main-layout-constants';
import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

const { sidemenu } = mainLayoutConstants;

export const rootSx: SxProps<Theme> = {
  backgroundColor: '#242425',
  height: '100%',
  // color: (theme) => alpha(theme.palette.primary.main, 0.15),
  fontSize: sidemenu.fontSize,
  overflow: 'hidden',

  // 레이블은 현재 미사용중이라서
  // 추가한 경우 스타일 조정필요합니다
  '& .Sidebar-label': {
    // color: alpha(sidemenu.fgColor, 0.7),
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.2,
    pt: 3,
    pb: 1,
  },
  display: 'flex',
  flexDirection: 'column',

  '& .Sidebar-body': {
    // 스크롤바 영역
    '::-webkit-scrollbar': {
      width: 3,
    },
    // 스크롤바 움직이는 자체 그놈
    '::-webkit-scrollbar-thumb': {
      backgroundColor: '#00f3e4',
      borderRadius: 7,
    },
    // 스크롤바 뒷배경
    '::-webkit-scrollbar-track': {},
  },

  //   // IMenu의 스타일은 ./components/SectionMenu.tsx 에서 설정
  //   // ISection의 스타일은 ./components/SideMenuItem.tsx 에서 설정하세요.
};
