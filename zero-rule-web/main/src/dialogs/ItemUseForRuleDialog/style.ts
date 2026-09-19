import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  '& .MuiTableCell-root': {
    px: 0.5,
    border: '1px solid #ccc',
    ':nth-of-type(1)': {
      width: 100,
      minWidth: 100,
      maxWidth: 100,
    },
    ':nth-of-type(3)': {
      width: 100,
      minWidth: 100,
      maxWidth: 100,
    },
    ':nth-of-type(4)': {
      width: 100,
      minWidth: 100,
      maxWidth: 100,
    },
  },
};
