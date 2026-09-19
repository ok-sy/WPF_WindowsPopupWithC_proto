import { alpha } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  alignItems: 'stretch',
  my: 0.2,
  '& .CLDocLabelAny-titleBox': {
    minWidth: 130,
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
    display: 'flex',
    alignItems: 'center',
    pl: 1,
  },

  '& .CLDocLabelAny-children': {
    ml: 0.5,
    mr: 0,
    py: 0,
    flex: 1,
  },
  '& .PrivateSwitchBase-input': {
    py: 0,
  },
};
