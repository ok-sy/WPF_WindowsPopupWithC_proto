import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  pl: 1,
  pr: 3,
  py: 1,
  '& .JobLogList-noDataContainer': {
    py: 5,
    '& .JobLogList-noDataImgBox': {
      width: 400,
      height: 400,
      mx: 'auto',
      '& img': {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      },
    },
    '& .JobLogList-noDataTitle': {
      fontSize: '2rem',
      lineHeight: 1,
      color: '#888',
      textAlign: 'center',
      opacity: 0.8,
    },
  },
};
