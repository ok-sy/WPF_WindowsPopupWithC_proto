import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  py: 1,
  pl: 1,
  pr: 3,
  '& .MsgMngHome-table': {
    '& .MuiTableRow-root > .MuiTableCell-root': {
      border: '1px solid #ccc',
      px: 0,
    },
  },
  '& .MsgMngHome-table-head': {
    '& .MuiTableRow-root > .MuiTableCell-root': {
      '&:nth-of-type(1)': {
        minWidth: 40,
        maxWidth: 40,
        width: 40,
      },
      '&:nth-of-type(2)': {
        minWidth: 40,
        maxWidth: 40,
        width: 40,
      },
      '&:nth-of-type(3)': {
        minWidth: 100,
        maxWidth: 100,
        width: 100,
      },
      '&:nth-of-type(4)': {
        minWidth: 300,
        maxWidth: 300,
        width: 300,
      },
      '&:nth-of-type(5)': {
        minWidth: 100,
        maxWidth: 100,
        width: 100,
      },
      '&:nth-of-type(6)': {
        minWidth: 100,
        maxWidth: 100,
        width: 100,
      },
      '&:nth-of-type(7)': {
        minWidth: 90,
        maxWidth: 90,
        width: 90,
      },
      '&:nth-of-type(8)': {
        minWidth: 100,
        maxWidth: 100,
        width: 100,
      },
      '&:nth-of-type(9)': {
        minWidth: 80,
        maxWidth: 80,
        width: 80,
      },
      '&:nth-of-type(10)': {
        minWidth: 60,
        maxWidth: 60,
        width: 60,
      },
      '&:nth-of-type(11)': {
        minWidth: 120,
        maxWidth: 120,
        width: 120,
      },
      '&:nth-of-type(12)': {
        minWidth: 120,
        maxWidth: 120,
        width: 120,
      },

      textAlign: 'center',
      border: '1px solid #ccc',
    },
  },

  '& .MsgMngHome-page-box': {
    pt: 1,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
  },

  '& .MsgMngHome-loading-box': { position: 'absolute', top: 0, width: '100%' },
  '& .MsgMngHome-xlsx-download': {
    backgroundColor: 'transparent',
    border: '1px solid rgba(63, 81, 181, 0.5)',
    textDecoration: 'none',
    px: 1,
    pt: 0.5,
    alignContent: 'center',
    borderRadius: '4px',
    color: '#3f51b5',
    fontSize: '0.8125rem',
    fontWeight: 500,
    WebkitTransition:
      'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    transition:
      'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    '&:hover': {
      backgroundColor: 'rgba(63, 81, 181, 0.04)',
      border: '1px solid #3f51b5',
      textDecoration: 'none',
    },
  },
};
