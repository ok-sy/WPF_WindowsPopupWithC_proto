import { flatSx } from '@local/ui';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import type { SxProps, Theme } from '@mui/material';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { SimpleTreeView, type SimpleTreeViewProps } from '@mui/x-tree-view';
import NextImage from 'next/image';

type Props = {
  collapseClick?: () => void;
  treeTitle?: string;
} & SimpleTreeViewProps<true>;

const rootSx: SxProps<Theme> = {
  '& .MuiTreeItem-iconContainer': {
    width: 18,
  },
};

function CollapseIcon() {
  return <NextImage width={15} height={11} src="/images/rullIcon/folder-open.png" alt="" />;
}
function ExpandIcon() {
  return <NextImage width={15} height={11} src="/images/rullIcon/folder-close.png" alt="" />;
}

export default function CLStyledTreeView(props: Props) {
  const { treeTitle, collapseClick, children, sx, ...rest } = props;

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {treeTitle && (
          <Typography sx={{ m: 1 }} variant="subtitle2">
            {treeTitle}
          </Typography>
        )}
        {collapseClick && (
          <Tooltip arrow title="전체 닫기">
            <IconButton
              sx={{ mr: 1, '& .MuiSvgIcon-root': { width: '1.2rem' } }}
              size="small"
              onClick={collapseClick}
            >
              <IndeterminateCheckBoxOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <SimpleTreeView
        slots={{
          collapseIcon: CollapseIcon,
          expandIcon: ExpandIcon,
          // endIcon
        }}
        sx={flatSx(rootSx, sx)}
        {...rest}
      >
        {children}
      </SimpleTreeView>
    </>
  );
}
