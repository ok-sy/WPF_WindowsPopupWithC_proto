import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  minHeight: 121,
  '& .CmpFileDropzone-fileBox': {
    p: 1,
    flexBasis: '100%',
    border: '2px solid #C6D0DF',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border .24s ease-in-out',
    background: '#F6F7FC',
    minWidth: 225,
  },
  '& .CmpFileDropzone-container': {
    justifyContent: 'space-evenly',
    mt: 1,
    pt: 2,
    alignItems: 'center',
  },
};
