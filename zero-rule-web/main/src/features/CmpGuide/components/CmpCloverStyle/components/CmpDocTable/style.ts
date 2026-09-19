import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  pr: 5,
  '& .CmpDocTable-container': {
    my: 2,
    ml: 2,
  },
};
