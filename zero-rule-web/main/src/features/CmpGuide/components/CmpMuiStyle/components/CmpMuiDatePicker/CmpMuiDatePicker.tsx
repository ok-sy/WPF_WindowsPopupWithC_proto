import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  '& .CmpMuiDatePicker-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiDatePicker() {
  return (
    <Box sx={rootSx} className="CmpMuiDatePicker-root">
      <Box className="CmpMuiDatePicker-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 3 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Date Picker
          </Typography>
          <TextField
            label="Next appointment"
            type="datetime-local"
            defaultValue="2017-05-24T10:30"
            sx={{ width: 250 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
