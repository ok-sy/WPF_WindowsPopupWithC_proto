import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  whiteSpace: 'nowrap',
  overflow: 'auto',
  minHeight: 295,
  '& .CmpAdressCopy-container': {
    mt: 1,
  },
};
