import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  pr: 3,
  overflow: 'auto',
  '& .CmpDocInput-container': {
    mt: 1,
  },
};
