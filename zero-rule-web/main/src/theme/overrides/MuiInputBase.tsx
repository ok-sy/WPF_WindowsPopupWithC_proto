import type { Components } from '@mui/material/styles';

export const MuiInputBase: Components['MuiInputBase'] = {
  styleOverrides: {
    root: {
      '&.MuiInputBase-formControl': {
        borderRadius: 0,
      },
    },
  },
};
