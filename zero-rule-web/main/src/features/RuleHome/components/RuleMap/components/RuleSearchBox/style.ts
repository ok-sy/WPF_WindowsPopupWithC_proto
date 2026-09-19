import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material';

export const rootSx: SxProps<Theme> = (theme) => ({
  '& .RuleSearchBox-paper': {
    width: 400,
    // height: 400,
    boxShadow: '5px 5px 9px #a8a8a8',
    backgroundColor: '#fafafe',
    border: '1px solid #b6b6b6',
    position: 'absolute',
    left: 352,
    top: 0,
    zIndex: 3,
    overflow: 'hidden',
  },
  '& .RuleSearchBox-top': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'move',
    px: 1,
  },
  '& .RuleSearchBox-tableRow': {
    cursor: 'pointer',
  },
  '& .RuleSearchBox-selected': {
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
  },
});
