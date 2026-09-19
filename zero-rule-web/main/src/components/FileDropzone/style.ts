import type { SxProps } from '@mui/material/styles';

export const rootSx: SxProps = {
  '& .FileDropzone-root': {
    width: '100%',
    height: '100%',
    color: 'black',
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  '& .FileDropzone-dropzone': {
    py: 1,
    flexBasis: '100%',
    border: '2px dashed #C6D0DF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    color: '#888',
    transition: 'border .24s ease-in-out',
    background: '#F6F7FC',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#2196f3',
    },
    '& .FileDropzone-dropping': {
      // 드롭존에 떨굴때 테두리 컬러
      borderColor: '#4F566F',
    },
    '&:active': {
      // 드롭존 클릭시 테두리 컬러
      borderColor: '#2196f3',
    },
  },

  '& .FileDropzone-field': {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
};
