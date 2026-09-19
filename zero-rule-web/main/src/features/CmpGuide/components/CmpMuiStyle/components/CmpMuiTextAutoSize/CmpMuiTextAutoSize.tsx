import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, TextareaAutosize, Typography } from '@mui/material';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  '& .CmpMuiTextAutoSize-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiTextAutoSize() {
  return (
    <Box sx={rootSx} className="CmpMuiTextAutoSize-root">
      <Box className="CmpMuiTextAutoSize-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            TextAutoSize
          </Typography>
          <TextareaAutosize
            aria-label="empty textarea"
            placeholder="Empty"
            style={{ width: 400, height: 100 }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
