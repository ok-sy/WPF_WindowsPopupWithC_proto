import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  '& .RuleInfoHstDialog-returnitem-table': {
    mt: 0.5,
    height: 200,
    border: '1px solid #e0e0e0',
    '& .MuiTableCell-root': {
      px: 1,

      '&:nth-of-type(1)': {
        whiteSpace: 'nowrap',
        width: 80,
        maxWidth: 80,
        textAlign: 'center',
      },

      '&:nth-of-type(2)': {
        whiteSpace: 'nowrap',
        width: 300,
        maxWidth: 300,
        textAlign: 'center',
      },
      '&:nth-of-type(3)': {
        whiteSpace: 'nowrap',
        textAlign: 'center',
      },
      '&:nth-of-type(4)': {
        whiteSpace: 'nowrap',
        width: 90,
        maxWidth: 90,
        textAlign: 'center',
      },
    },
  },
  '& .RuleInfoHstDialog-condition-table': {
    mt: 0.5,
    height: 300,
    border: '1px solid #e0e0e0',
    '& .MuiTableCell-root': {
      px: 1,
      '&:nth-of-type(1)': {
        whiteSpace: 'nowrap',
        width: 70,
        maxWidth: 70,
        textAlign: 'center',
      },
      '&:nth-of-type(2)': {
        whiteSpace: 'nowrap',
        width: 500,
        textAlign: 'center',
      },
      '&:nth-of-type(3)': {
        width: 500,
      },
      '&:nth-of-type(4)': {
        width: 500,
      },
    },
  },
};
