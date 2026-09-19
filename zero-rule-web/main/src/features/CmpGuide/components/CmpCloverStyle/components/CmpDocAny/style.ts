import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  display: 'flex',
  flexDirection: 'row',
  overflow: 'auto',
  '& .CmpDocAny-container': {
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
  },
};
