import theme from '@/theme';
import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';

const rootSx: SxProps<Theme> = (theme) => ({});

export default function TeamMgmtUpdateForm() {
  return (
    <Box sx={rootSx} className="TeamMgmtUpdateForm-root">
      업데이트
    </Box>
  );
}
