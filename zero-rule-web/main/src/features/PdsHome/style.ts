import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  px: 3,
  pt: 3,
  '& .PdsRow-highlight': {
    '& .PdsRow-title': {
      color: 'secondary.main',
    },
  },
};
