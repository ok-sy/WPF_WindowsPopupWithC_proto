import MailIcon from '@mui/icons-material/Mail';
import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import Badge from '@mui/material/Badge';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  '& .CmpMuiBadge-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiBadge() {
  return (
    <Box sx={rootSx} className="CmpMuiBadge-root">
      <Box className="CmpMuiBadge-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Badge
          </Typography>
          <Badge color="secondary" badgeContent={99}>
            <MailIcon />
          </Badge>
          <Badge color="secondary" badgeContent={100}>
            <MailIcon />
          </Badge>
          <Badge color="secondary" badgeContent={1000} max={999}>
            <MailIcon />
          </Badge>
        </Stack>
      </Box>
    </Box>
  );
}
