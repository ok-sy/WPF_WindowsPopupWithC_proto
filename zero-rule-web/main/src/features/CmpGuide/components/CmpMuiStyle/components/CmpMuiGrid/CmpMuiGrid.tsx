import type { SxProps, Theme } from '@mui/material';
import { Box, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 320,
  '& .CmpMuiGrid-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiGrid() {
  return (
    <Box sx={rootSx} className="CmpMuiGrid-root">
      <Box className="CmpMuiGrid-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{}}>
          {/* <DataGrid
            sx={{ height: '40vh' }}
            rows={sampleRows}
            columns={alertLookupListColumns}
            pageSize={10}
            rowsPerPageOptions={[5]}
            checkboxSelection
          /> */}
        </Stack>
      </Box>
    </Box>
  );
}
