import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  '& .BbsAttachFileList-table': {
    width: '100%',
    '& .MuiTableCell-root': {
      p: 1,
    },
    borderTop: '1px solid #ddd',
  },

  '& .BbsAttachFileList-fileImage': {
    backgroundColor: '#EEE',
    borderRadius: '3px',
    width: 32,
    height: 32,
  },

  '& .BbsAttachFileList-imageButton': {
    borderRadius: '8px',
    p: 0,
    overflow: 'hidden',
  },

  '& .BbsAttachFileList-fileName': {
    display: 'inline-flex',
    alignItems: 'center',
    '& span': {
      wordBreak: 'break-all',
    },
  },

  '& .BbsAttachFileList-image': {
    objectFit: 'cover',
    borderRadius: 0,
    width: 32,
    height: 32,
  },
};
