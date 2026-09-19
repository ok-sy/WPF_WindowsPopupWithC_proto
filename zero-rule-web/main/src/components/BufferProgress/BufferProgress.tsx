import type { SxProps } from '@mui/material';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';

const rootSx: SxProps = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 9999,
  display: 'flex',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
};
type Props = {
  text?: string;
};
export default function BufferProgress(props: Props) {
  const { text = '저장중' } = props;
  return (
    <Box sx={rootSx} className="BufferProgress-root">
      <Box
        sx={{
          display: 'fixed',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          width: '20%',
          height: '30%',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          borderRadius: 10,
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Typography color="#fff" variant="h3">
            {text}
          </Typography>
          <CircularProgress
            sx={{ fontWeight: 600, color: '#fff', '& .MuiCircularProgress-svg': {} }}
            size="4rem"
          />
        </Stack>
      </Box>
    </Box>
  );
}
