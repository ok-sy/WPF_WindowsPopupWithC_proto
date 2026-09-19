import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#FAFAFA',

  '& .mui-style-1sgps37-MuiTableCell-root': {
    borderBottom: 'none',
  },
  '& .ManagerSignUp-tableInput': {
    py: 1,
  },
  '& .ManagerSignUp-text': {
    width: 300,
  },
};
