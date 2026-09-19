import type { SxProps } from '@mui/material';

export const TreeMapLeftBorder = '1px solid #E0E0E0';
export const rootSx: SxProps = {
  '& .CLStyleTreeMapHandler-sectionList': {
    borderLeft: TreeMapLeftBorder,
  },
  '& .MuiListItemButton-root': {
    my: 0,
    py: 0,
  },
  '& .MuiListItemIcon-root': {
    minWidth: 0,
    fontSize: 21,
  },
  '& .CLStyleTreeMapHandler-folderIcon': {
    mr: 1,
  },
};
