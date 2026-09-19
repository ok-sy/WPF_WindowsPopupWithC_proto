import type { SxProps, Theme } from '@mui/material';
import { Box, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material';
import type { CircularProgressProps } from '@mui/material/CircularProgress';
import * as React from 'react';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 320,
  '& .CmpMuiLoading-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}
export default function CmpMuiLoading() {
  const [progress, setProgress] = React.useState(10);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 10));
    }, 800);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={rootSx} className="CmpMuiLoading-root">
      <Box className="CmpMuiLoading-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Circle Progress
          </Typography>
          <CircularProgress />
          <CircularProgress color="secondary" />
          <CircularProgress color="success" />
          <CircularProgress color="inherit" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Linear Progress
          </Typography>
          <Stack spacing={2} sx={{ width: '50%' }}>
            <LinearProgress />
            <LinearProgress color="secondary" />
            <LinearProgress color="success" />
            <LinearProgress color="error" />
          </Stack>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Circle Progress
          </Typography>
          <CircularProgressWithLabel value={progress} />
        </Stack>
      </Box>
    </Box>
  );
}
