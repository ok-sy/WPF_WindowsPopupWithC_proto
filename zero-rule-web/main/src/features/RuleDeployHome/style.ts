import type { SxProps } from '@mui/material';

export const ruleDeploySx = (bodyTop: number): SxProps => ({
  '& .table-container': {
    position: 'relative',
    maxHeight: `calc(100vh - ${bodyTop}px - 64px)`,
    minHeight: `calc(100vh - ${bodyTop}px - 64px)`,
    border: '1px solid #e0e0e0',
    '& .MuiTableCell-root': {
      whiteSpace: 'nowrap',
      px: 0.5,
      border: '1px solid #ccc',
      ':nth-of-type(1)': {
        textAlign: 'center',
        width: 40,
        minWidth: 40,
        maxWidth: 40,
      },
      ':nth-of-type(2)': {
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      ':nth-of-type(3)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(4)': {
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      ':nth-of-type(5)': {
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      ':nth-of-type(6)': {
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      ':nth-of-type(7)': {
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
      ':nth-of-type(8)': {
        width: 200,
        minWidth: 200,
        maxWidth: 200,
      },
      ':nth-of-type(9)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(10)': {
        width: 150,
        minWidth: 150,
        maxWidth: 150,
      },
      ':nth-of-type(11)': {
        width: 150,
        minWidth: 150,
        maxWidth: 150,
      },
      ':nth-of-type(12)': {
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      ':nth-of-type(13)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(14)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(15)': {
        width: 150,
        minWidth: 150,
        maxWidth: 150,
      },
    },
  },
});
export const ruleDeployInfoSx = (bodyTop: number): SxProps => ({
  position: 'relative',
  // '& .table-container': {
  //   whiteSpace: 'nowrap',
  //   border: '1px solid #e0e0e0',
  //   '& .MuiTableCell-root': {
  //     whiteSpace: 'nowrap',
  //     px: 0.5,
  //     border: '1px solid #ccc',
  //     ':nth-of-type(1)': {
  //       textAlign: 'center',
  //       width: 150,
  //       minWidth: 150,
  //       maxWidth: 150,
  //     },
  //     ':nth-of-type(2)': {
  //       textAlign: 'center',
  //       width: 130,
  //       minWidth: 130,
  //       maxWidth: 130,
  //     },
  //     ':nth-of-type(3)': {
  //       textAlign: 'center',
  //       width: 120,
  //       minWidth: 120,
  //       maxWidth: 120,
  //     },
  //     ':nth-of-type(4)': {
  //       textAlign: 'center',
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(5)': {
  //       textAlign: 'center',
  //       width: 120,
  //       minWidth: 120,
  //       maxWidth: 120,
  //     },
  //     ':nth-of-type(6)': {
  //       textAlign: 'center',
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(7)': {
  //       width: 200,
  //       minWidth: 200,
  //       maxWidth: 200,
  //     },
  //     ':nth-of-type(8)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(9)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(10)': {
  //       textAlign: 'center',
  //       width: 110,
  //       minWidth: 110,
  //       maxWidth: 110,
  //     },
  //     ':nth-of-type(11)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(12)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(13)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //   },
  // },
});
