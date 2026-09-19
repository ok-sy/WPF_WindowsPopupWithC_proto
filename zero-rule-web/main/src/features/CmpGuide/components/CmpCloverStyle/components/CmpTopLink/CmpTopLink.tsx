import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import CustomBreadcrumbs from '@/components/CustomBreadcrumbs';

export default function CmpTopLink() {
  return (
    <Box sx={rootSx} className="CmpTopLink-root">
      <Box className="CmpTopLink-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Top Link
          </Typography>
          <Stack spacing={2}>
            <CustomBreadcrumbs currentTitle={'title'} />
            <CustomBreadcrumbs currentTitle={'title'} section={'test'} />
            <CustomBreadcrumbs
              currentTitle={'title'}
              linkParts={[{ href: '', title: '이전경로' }]}
            />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
