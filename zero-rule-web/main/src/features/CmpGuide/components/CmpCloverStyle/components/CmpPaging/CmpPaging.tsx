import { Box, Pagination, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import BbsPagination from '@/components/BbsPagination';

export default function CmpPaging() {
  return (
    <Box sx={rootSx} className="CmpPaging-root">
      <Box className="CmpPaging-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Basic
          </Typography>
          <Box sx={{ flex: 1 }}>
            <BbsPagination onPageChange={() => {}} page={5} count={5} />
          </Box>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            secondary
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Pagination count={5} color="secondary" />
          </Box>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            outlined primary
          </Typography>
          <Pagination count={5} variant="outlined" color="primary" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            outlined rounded
          </Typography>
          <Pagination count={5} shape="rounded" variant="outlined" color="secondary" />
        </Stack>
      </Box>
    </Box>
  );
}
