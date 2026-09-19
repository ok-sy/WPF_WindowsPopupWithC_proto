import type { SxProps } from '@mui/material';
import { Theme } from '@mui/material';

/**
 * EmailTransInfoHome-root
 */
export const rootSx = (bodyTop: number): SxProps => ({
  py: 1,
  pl: 1,
  pr: 3,
  // '& .table-container': {
  //   border: '1px solid #ccc',
  //   maxHeight: `calc(100vh - ${bodyTop}px - 52px)`,
  //   minHeight: `calc(100vh - ${bodyTop}px - 52px)`,
  //   '& .MuiTableCell-root': {
  //     whiteSpace: 'nowrap',
  //     px: 0.5,
  //     border: '1px solid #ccc',
  //     ':nth-of-type(1)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(2)': {
  //       width: 150,
  //       minWidth: 150,
  //       maxWidth: 150,
  //     },
  //     ':nth-of-type(3)': {
  //       width: 130,
  //       minWidth: 130,
  //       maxWidth: 130,
  //     },
  //     ':nth-of-type(4)': {
  //       width: 130,
  //       minWidth: 130,
  //       maxWidth: 130,
  //     },
  //     ':nth-of-type(5)': {
  //       width: 200,
  //       minWidth: 200,
  //       maxWidth: 200,
  //     },
  //     ':nth-of-type(6)': {
  //       width: 250,
  //       minWidth: 250,
  //       maxWidth: 250,
  //     },
  //     ':nth-of-type(7)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(8)': {
  //       width: 100,
  //       minWidth: 100,
  //       maxWidth: 100,
  //     },
  //     ':nth-of-type(9)': {
  //       width: 80,
  //       minWidth: 80,
  //       maxWidth: 80,
  //     },
  //     ':nth-of-type(10)': {
  //       width: 120,
  //       minWidth: 120,
  //       maxWidth: 120,
  //     },
  //   },
  // },
});

/**
 * EmailTransInfoRow-root
 */
export const infoRowSx: SxProps = {
  '& .MuiTypography-root': { fontSize: '0.75rem' },
};

/**
 * EmailTransInfoSearch-root
 */
export const searchSx: SxProps = {
  mb: 1,
  '& .empId-label': {
    '& .CLDocLabelInput-titleBox': { minWidth: 80 },
    maxWidth: 200,
  },
  '& .emailTransceiveTypeCd-select': {
    '& .CLDocLabelSelect-titleBox': { minWidth: 100 },
    maxWidth: 200,
  },
};
