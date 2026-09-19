import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 269.3,
  '& .AreaChart-container': {
    my: 2,
    ml: 2,
  },
};
