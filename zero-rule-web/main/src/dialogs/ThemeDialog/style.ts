import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  '& .ThemeDialog-myBoxs': {
    display: 'flex',
    flex: 1,
    flexFlow: 'row wrap',
    '& .ThemeDialog-myBox': {
      m: 0.1,
      minHeight: 55,
      flexBasis: '21%',
    },
  },
  '& .ThemeDialog-mainColor': {
    p: 1,
    height: '60%',
    color: '#fff',
    transition: '0.5s',
  },
  '& .ThemeDialog-dark': {
    p: 1,
    flex: 1,
    transition: '0.5s',
  },
  '& .ThemeDialog-light': {
    p: 1,
    flex: 1,
    transition: '0.5s',
  },
  '& .ThemeDialog-topbar': {
    transition: '0.5s',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '1px solid red',
    color: '#fff',
  },
};
