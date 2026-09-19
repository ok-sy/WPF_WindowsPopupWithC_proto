import type { SxProps } from '@mui/material';
import { Theme } from '@mui/material';

export const rootSx: SxProps = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#ffead8',
  py: 4,
  px: 6,
  //   display: 'flex',
  position: 'relative',
  '& .ChartBanner-title1': {
    color: '#383f24',
    mb: 1,
  },
  '& .ChartBanner-title2': {
    fontSize: '2.68rem',
    color: '#ff7f00',
    mb: 3,
  },
};
