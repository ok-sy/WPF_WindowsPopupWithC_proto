import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import { flatSx } from '@local/ui';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { SxProps, Theme } from '@mui/material';
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material';
import type { PageListItemInfo } from '../types';
const rootSx: SxProps<Theme> = {
  overflow: 'auto',
  '& .MuiListItemButton-root': {
    py: 0.3,
    px: 0,
  },
  '& .MuiListItemIcon-root': { pl: 2, '& .MuiBox-root': { height: 24 } },
};

interface Props {
  pageList: PageListItemInfo[];
  onClickPage: (pageInfo: PageListItemInfo) => void;
}
export default function PageSelectList(props: Props) {
  const { pageList, onClickPage } = props;
  return (
    <Stack
      sx={flatSx(rootSx, { height: '100%', border: '1px solid #c4c4c4' })}
      className="PageSelectList-root"
    >
      <List
        sx={{
          py: 0,
          width: '100%',
          bgcolor: 'background.paper',
          '& .MuiSvgIcon-root': {
            width: 22,
            p: 0,
          },
        }}
      >
        {pageList?.map((el) => (
          <ListItem
            onClick={() => onClickPage(el)}
            sx={{
              borderBottom: '1px solid #e0e4ee', //
              backgroundColor: el.visible ? '' : '#f0f0f0',
              color: el.visible ? '' : '#b0b0b0',
              '& .MuiListItemIcon-root': { color: el.visible ? '' : '#a0a0a0' },
            }}
            secondaryAction={
              <IconButton size="small">
                {el.visible ? (
                  <VisibilityIcon fontSize="small" />
                ) : (
                  <VisibilityOffIcon fontSize="small" />
                )}
              </IconButton>
            }
            key={el.pageId}
            disablePadding
          >
            <ListItemButton>
              <ListItemIcon>
                <StringToMuiIcon iconName={el.icon ?? ''} />
              </ListItemIcon>
              <ListItemText primary={el.pageNm} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
