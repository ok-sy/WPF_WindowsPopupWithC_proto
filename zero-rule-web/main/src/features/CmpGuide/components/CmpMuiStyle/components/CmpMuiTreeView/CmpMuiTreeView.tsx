import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  '& .CmpMuiTreeView-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiTreeView() {
  return (
    <Box sx={rootSx} className="CmpMuiTreeView-root">
      <Box className="CmpMuiTreeView-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 2.8 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Tree View
          </Typography>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            sx={{ height: 130, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
          >
            <TreeItem nodeId="1" label="Applications">
              <TreeItem nodeId="2" label="Calendar" />
            </TreeItem>
            <TreeItem nodeId="5" label="Documents">
              <TreeItem nodeId="10" label="OSS" />
              <TreeItem nodeId="6" label="MUI">
                <TreeItem nodeId="8" label="index.js" />
              </TreeItem>
            </TreeItem>
          </TreeView>
        </Stack>
      </Box>
    </Box>
  );
}
