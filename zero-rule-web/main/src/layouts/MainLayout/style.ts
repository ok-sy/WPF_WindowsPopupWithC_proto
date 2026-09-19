import type { Theme, SxProps } from '@mui/material';

export const rootSx: SxProps<Theme> = (theme) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflowX: 'hidden',
  '& .MainLayout-bodyContainer': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    flex: 1,
  },
});
