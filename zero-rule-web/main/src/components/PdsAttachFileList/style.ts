import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  width: '100%',
  display: 'flex',
  flexWrap: 'wrap',
  mb: 1,

  '& .PdsAttachFileList-fileContainer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    py: 1,
    px: 0,
    width: '100%',
    '& > p': {
      margin: '0 8px',
      color: '#666',
    },
  },

  '& .PdsAttachFileList-fileImage': {
    backgroundColor: '#EEE',
    borderRadius: '3px',
    width: 36,
    height: 36,
  },

  '& .PdsAttachFileList-imageButton': {
    borderRadius: 1,
    padding: 0,
    overflow: 'hidden',
  },

  '& .PdsAttachFileList-image': {
    objectFit: 'cover',
    borderRadius: 0,
    width: 36,
    height: 36,
  },

  '& .PdsAttachFileList-fileName': {
    display: 'inline-flex',
    alignItems: 'center',
    '& span': {
      wordBreak: 'break-all',
    },
  },

  '& .PdsAttachFileList-downloadIcon': {
    fill: '#bbb',
    width: 16,
    height: 16,
    ml: 1,
  },
};
