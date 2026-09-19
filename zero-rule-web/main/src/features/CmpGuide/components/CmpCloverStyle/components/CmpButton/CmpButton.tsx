import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import BbsButton from '@/components/BbsButton';

export default function CmpButton() {
  return (
    <Box sx={rootSx} className="CmpButton-root">
      <Box className="CmpButton-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            outlined :
          </Typography>
          <BbsButton text="SMALL" />
          <BbsButton color="error" text="SMALL" />
          <BbsButton color="success" text="SMALL" />
          <BbsButton color="warning" text="SMALL" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            text :
          </Typography>
          <BbsButton text="SMALL" variant="text" />
          <BbsButton color="error" text="SMALL" variant="text" />
          <BbsButton color="success" text="SMALL" variant="text" />
          <BbsButton color="warning" text="SMALL" variant="text" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            contained :
          </Typography>
          <BbsButton text="SMALL" variant="contained" />
          <BbsButton color="error" text="SMALL" variant="contained" />
          <BbsButton color="success" text="SMALL" variant="contained" />
          <BbsButton color="warning" text="SMALL" variant="contained" />
        </Stack>
      </Box>
    </Box>
  );
}
