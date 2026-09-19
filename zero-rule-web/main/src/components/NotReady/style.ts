import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  position: 'relative',
  display: 'flex',
  flex: 1,
  width: '100%',
  minHeight: 'calc(100vh - 64px)',
  overflow: 'hidden',
  background: () => ({
    xs: '#6f9500',
    lg: 'linear-gradient(to right, #6f9500 50%, #e3eebb 50%)',
  }),
  '& .NotReady-wrapper': {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',

    '& .NotReady-details': {
      position: 'relative',
      flexBasis: {
        xs: '100%',
        lg: '50%',
      },
      display: 'flex',
      flexDirection: 'column',
      padding: '0 1rem',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    '& .NotReady-artBox': {
      alignSelf: 'center',
    },
  },
  '& .NotReady-systemNamePart': {
    mt: 2,
    fontWeight: 900,
  },
  '& .NotReady-systemNamePart::first-letter': {
    color: 'orange',
  },
};
