import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  py: 1,
  pl: 1,
  pr: 3,
  '& .MsgMngEnumHome-table': {
    '& .MuiTableRow-root > .MuiTableCell-root': {
      border: '1px solid #ccc',
      px: 0,
    },
  },
  '& .MsgMngEnumHome-table-head': {
    '& .MuiTableRow-root > .MuiTableCell-root': {
      '&:nth-of-type(1)': {
        minWidth: 40,
        maxWidth: 40,
        width: 40,
      },
      '&:nth-of-type(2)': {
        minWidth: 100,
        maxWidth: 100,
        width: 100,
      },
      '&:nth-of-type(3)': {
        minWidth: 300,
        maxWidth: 300,
        width: 300,
      },
      '&:nth-of-type(4)': {
        minWidth: 80,
        maxWidth: 80,
        width: 80,
      },
      '&:nth-of-type(5)': {
        minWidth: 80,
        maxWidth: 80,
        width: 80,
      },

      textAlign: 'center',
      border: '1px solid #ccc',
    },
  },
};
