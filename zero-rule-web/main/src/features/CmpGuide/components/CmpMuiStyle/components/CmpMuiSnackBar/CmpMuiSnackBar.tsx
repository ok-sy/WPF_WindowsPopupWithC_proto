import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import type { AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import * as React from 'react';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 132,
  '& .CmpMuiSnackBar-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function CmpMuiSnackBar() {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };
  return (
    <Box sx={rootSx} className="CmpMuiSnackBar-root">
      <Box className="CmpMuiSnackBar-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Raiting
          </Typography>
          <Button variant="outlined" onClick={handleClick}>
            Open success snackbar
          </Button>
          <Snackbar
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
          >
            <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
              This is a success message!
            </Alert>
          </Snackbar>
        </Stack>
      </Box>
    </Box>
  );
}
