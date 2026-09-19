import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  // display: 'flex',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  '& .PieChart-container': {
    my: 2,
    mx: 2,
  },
};
