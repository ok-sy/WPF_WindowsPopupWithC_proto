import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = {
  height: '100%',
  ml: 1,
  '& .rstcustom__collapseButton, .rstcustom__expandButton': {
    pt: 2,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    color: '#696a6f',
  },
};
