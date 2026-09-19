import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, TextField, Typography } from '@mui/material';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 395,
  '& .CmpMuiInput-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiButton() {
  return (
    <Box sx={rootSx} className="CmpMuiButton-root">
      <Box className="CmpMuiButton-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            outLined
          </Typography>
          <TextField />
          <TextField placeholder="placeholder" />
          <TextField label="label" />
          <TextField color="error" label="error" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            filled
          </Typography>
          <TextField variant="filled" />
          <TextField variant="filled" placeholder="placeholder" />
          <TextField variant="filled" label="label" />
          <TextField variant="filled" color="error" label="error" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            standard
          </Typography>
          <TextField variant="standard" />
          <TextField variant="standard" placeholder="placeholder" />
          <TextField variant="standard" label="label" />
          <TextField variant="standard" color="error" label="error" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            fullWidth
          </Typography>
          <TextField fullWidth />
        </Stack>
      </Box>
    </Box>
  );
}
