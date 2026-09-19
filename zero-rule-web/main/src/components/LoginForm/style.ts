import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  position: 'relative',
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  background: '#162A56',
  zIndex: 0,

  '& .LoginForm-rootContainer': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    px: 2,
    width: '100%',
    height: '100%',
    maxWidth: 1300,
    mx: 'auto',
    '& .LoginForm-bgImgBox': (theme) => ({
      position: 'absolute',
      bottom: -6,
      right: 50,
      zIndex: -1,
      height: 'auto',
      maxWidth: 700,
      minWidth: 600,

      // 작은 화면일 때 배경이미지 가운데 정렬
      [theme.breakpoints.down('lg')]: {
        right: 'unset',
        bottom: '-5%',
        left: '50%',
        transform: 'translateX(-50%)',
      },

      '& .LoginForm-bgImg': {
        width: '100%',
        objectFit: 'contain',
      },
    }),

    '& .LoginForm-formWrapper': (theme) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: {
        // 작은화면에서 제목,버튼 가로 정렬 가운데
        xs: 'center',
        lg: 'flex-start',
      },
      width: '100%',
      maxWidth: 420,
      mx: {
        xs: 'auto',
        lg: 2,
      },
      px: { xs: 3, sm: 4, md: 6 },
      pt: 3,
      pb: 2,

      // 큰 화면일때 세로정렬을 center
      alignSelf: 'center',
      mt: 0,

      [theme.breakpoints.down('lg')]: {
        // 작은 화면일때 로그인 박스의 세로정렬을 flex-start
        alignSelf: 'flex-start',
        mt: '10vh',

        // 작은 화면일때 반투명 배경
        background: 'linear-gradient(to bottom,rgba(255,255,255,0.05), transparent)',
        backdropFilter: 'blur(15px)',
        borderRadius: {
          xs: 1,
          md: 5,
        },
      },

      '& .LoginForm-title': {
        mb: 1,
        fontWeight: 700,
        fontSize: '1.5rem',
        color: '#fff',
      },
      '& .LoginForm-form': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        mt: 5,
        '& .LoginForm-loginInput': {
          width: '100%',
        },
        '& .LoginForm-passwd': {
          mt: 4,
        },
      },
    }),
  },

  '& .LogInForm-sloganBox': {
    position: 'relative',
    width: '100%',
    top: '15%',
    left: 0,
    right: 0,
    color: 'primary.main',
    textAlign: 'center',
    letterSpacing: 8,
    '& h3': {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.5,
      m: 0,
      p: 0,
      '& + h3': {
        mt: 1,
      },
    },
    '& h5': {
      mt: 5,
      p: 0,
      fontSize: '1.2rem',
      fontWeight: 500,
    },
  },

  '& .LoginForm-submitBtn': {
    width: '50%',
    minWidth: 140,
    mt: 1,
    background: 'primary.main',
    borderRadius: '20px / 50%',
  },

  '& .LoginForm-extraButtons': {
    mt: 5,
    color: '#363636',
    display: 'flex',
    alignItems: 'center',
    '& .MuiDivider-root': {
      height: 12,
      alignSelf: 'center',
      background: 'rgba(255, 255, 255, 0.1)',
      my: 0,
      mx: 1,
    },
    '& .MuiButton-root': {
      color: '#bbb',
    },
  },
};
