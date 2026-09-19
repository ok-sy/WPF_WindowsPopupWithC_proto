import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  alignItems: 'stretch',
  my: 0.2,
  '& .CLDocLabelSelect-titleBox': {
    minWidth: 130,
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
    display: 'flex',
    alignItems: 'center',
    pl: 1,
  },
  '& .MuiInputBase-root': {
    fontSize: '0.7rem',
    borderRadius: 0,
    minWidth: '100%',
    '& .MuiInputBase-input': {
      pl: 0.8,
      width: '100%',
      minWidth: 50,
    },
  },
  '& .CLDocLabelSelect-input': {
    ml: 0.5,
    mr: 0,
    flex: 1,
    py: 0,
  },
};
