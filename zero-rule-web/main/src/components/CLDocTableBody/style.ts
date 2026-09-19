import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  '&.CLDocTableBody-loading': {
    opacity: 0.5,
  },
  '&.CLDocTableBody-stripe': {
    '& .MuiTableRow-root:nth-of-type(even)': {
      backgroundColor: (theme) => theme.palette.action.hover,
    },
  },
};
