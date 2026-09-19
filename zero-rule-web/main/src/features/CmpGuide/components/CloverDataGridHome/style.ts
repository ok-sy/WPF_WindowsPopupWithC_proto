import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  '& .MuiFormControlLabel-root .MuiCheckbox-root': {
    width: 25,
    height: 25,
    mr: 0.5,
  },
};
