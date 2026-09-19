import { palette } from '../palette';
import type { Components } from '@mui/material/styles';

export const MuiTableCell: Components['MuiTableCell'] = {
  styleOverrides: {
    root: {
      borderBottom: `1px solid ${palette.divider}`,
      padding: '14px 40px 14px 24px',
      fontSize: '0.9rem',
    },
    head: {
      fontSize: '14px',
    },
  },
};
