import { flatSx } from '@local/ui';
import type { TreeItemProps } from '@mui/x-tree-view';
import type { SxProps, Theme } from '@mui/material';
import { alpha, Box } from '@mui/material';
import { TreeItem } from '@mui/x-tree-view';
import React from 'react';
type Props = {
  labelIcon?: React.ReactNode;
} & TreeItemProps;

const rootSx: SxProps<Theme> = {
  '& .MuiTreeItem-content': {
    py: 1,
  },

  '& .Mui-selected': {
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
  },
  '& .Mui-selected .Mui-focused': {
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
  },
  '& .MuiTreeItem-label': {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
};

const CLStyledTreeItem = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { labelIcon,itemId, children, sx, ...rest } = props;

  return (
    <Box ref={ref} sx={flatSx(rootSx, sx)}>
      {labelIcon ? (
        <TreeItem itemId={itemId} {...rest}>
          {children}
        </TreeItem>
      ) : (
        <TreeItem itemId={itemId} sx={flatSx(rootSx, sx)} {...rest}>
          {children}
        </TreeItem>
      )}
    </Box>
  );
});

CLStyledTreeItem.displayName = 'CLStyledTreeItem';
export default CLStyledTreeItem;
