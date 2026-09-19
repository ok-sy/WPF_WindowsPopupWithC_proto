import type { SxProps } from '@mui/material';
import { Theme } from '@mui/material';

export const rootSx: SxProps = {
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  whiteSpace: 'nowrap',
  '& .CmpDragDialog-container': {
    mt: 1,
  },
};
