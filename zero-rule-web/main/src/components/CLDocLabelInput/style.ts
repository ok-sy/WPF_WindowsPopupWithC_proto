import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  alignItems: 'stretch',
  my: 0.2,
  '& .CLDocLabelInput-titleBox': {
    minWidth: 130,
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
    // backgroundColor: 'primary.main',
    pl: 1,
    display: 'flex',
    alignItems: 'center',
  },

  '& .CLDocLabelInput-inputBox': {
    ml: 0.5,
    mr: 0,
    py: 0,
    flex: 1,

    '& .MuiInputBase-multiline': {
      p: 0,
      '& .MuiInputBase-input': {
        p: 0.8,
      },
    },
  },
};
