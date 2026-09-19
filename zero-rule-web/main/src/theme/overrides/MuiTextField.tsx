import type { Components } from '@mui/material/styles';

export const MuiTextField: Components['MuiTextField'] = {
  styleOverrides: {
    root: {
      '& .MuiInputBase-root': {
        borderRadius: 0,
      },
    },
  },
};
