import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  minHeight: 121,
  '& .CmpCLStyleTabsByTab-container': {
    justifyContent: 'space-evenly',
    display: 'flex',
    mt: 1,
    alignItems: 'center',
  },
};
