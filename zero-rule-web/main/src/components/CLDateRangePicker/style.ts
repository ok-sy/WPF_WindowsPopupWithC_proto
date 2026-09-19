import type { SxProps } from '@mui/material';
import { makeStyles } from '@mui/styles';

export const rootSx: SxProps = {};

export const useStyles = makeStyles({
  root: {
    '& .MuiInputBase-root': {
      fontSize: '0.8rem',
      fontWeight: 'bold',
      color: '#333',
      paddingTop: 1.5,
      paddingBottom: 1.5,
    },

    '& .MuiPickersDesktopRoot': {
      backgroundColor: '#f5f5f5',
      // borderRadius: '5px',
      border: '1px solid #ccc',
      padding: '10px',
    },
  },
});
