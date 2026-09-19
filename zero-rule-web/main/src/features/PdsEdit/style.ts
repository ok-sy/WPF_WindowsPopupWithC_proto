import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  px: 3,
  pt: 3,
  '& .PdsEdit-title': {
    width: {
      xs: '100%',
      md: '50%',
    },
  },
  '& .PdsEdit-editorBox': {
    display: 'flex',
    background: '#fff',
    alignItems: 'stretch',
    '& .BbsCKEditor-root': {
      border: '1px solid #ddd',
      width: '100%',
      overflowY: 'scroll',
    },
  },

  '& .PdsEdit-attachFiles': {
    flex: 1,
    pt: 0,
    pb: 4,
    pl: 0,
    pr: 1,
    '& .PdsEdit-attachFilesTitle': {
      fontSize: '0.85rem',
      color: '#444',
      lineHeight: 1.5,
      m: 0,
      py: 2,
    },
    '& .PdsEdit-attachFileBtn': {
      mt: 3,
      pl: 0,
    },
  },
};
