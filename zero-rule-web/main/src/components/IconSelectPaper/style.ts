import type { PaperProps, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
};

export const paperProps: Partial<PaperProps> = {
  sx: {
    position: 'absolute',
    bgcolor: '#fff',
    width: 170,
    zIndex: 9999,
    border: '0.3px solid #c4c4c4',
    maxHeight: 270,
    overflow: 'auto',
    p: 0.5,
  },
};
