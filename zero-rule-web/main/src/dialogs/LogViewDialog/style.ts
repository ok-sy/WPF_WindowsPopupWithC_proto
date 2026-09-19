import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  '& .LogViewDialog-dialogBody': {
    minHeight: 200,
  },
  '& .LogViewDialog-title': {
    lineHeight: 1.5,
    letterSpacing: 0.4,
    color: '#000',
  },

  '& .LogViewDialog-msg': {
    lineHeight: 1.3,
    letterSpacing: 0.2,
    color: '#666',
  },
};
