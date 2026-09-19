import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'url(/images/login/loginBg_img.png) #162A56',
  '& .SignUpForm-titleBox': {
    width: '100%',
    position: 'relative',
    mb: 5,
    '& .SignUpForm-backBtn': {
      color: 'black',
      position: 'absolute',
      top: 0,
      left: -24,
    },
    '& .SignUpForm-titleText': {
      textAlign: 'center',
      fontWeight: 700,
    },
  },

  '& .SignUpForm-container': {
    width: '100%',
    maxWidth: 460,
    position: 'relative',
    backgroundColor: '#fff',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '50% 50%',
    borderRadius: '0.5rem',
  },

  '& .SignUpForm-formWrapper': {
    position: 'relative',
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    px: { xs: 3, sm: 4, md: 6 },
    py: 3,

    '& .SignUpForm-form': {
      width: '100%',
      mt: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',

      '& .SignUpForm-formControl': {
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        '& .SignUpForm-input': {
          flex: 1,
        },
      },
    },
  },

  '& .SignUpForm-submitBtn': {
    width: '50%',
    minWidth: 140,
  },

  '& .SignUpForm-extraButtons': {
    mt: 5,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    '& .MuiDivider-root': {
      height: 12,
      alignSelf: 'center',
      background: 'rgba(255, 255, 255, 0.1)',
      my: 0,
      mx: 1,
    },
  },
};
