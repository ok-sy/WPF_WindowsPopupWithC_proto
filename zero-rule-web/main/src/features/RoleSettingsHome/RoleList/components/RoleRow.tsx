import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { CLRole } from '@local/domain';
import { toggleTableRowSelectionByEventTarget } from '@local/ui';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps, Theme } from '@mui/material';
import {
  IconButton,
  Popover,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  MenuList,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import clsx from 'clsx';
import type { RoleInfoByUserDialogProps } from '@/dialogs/RoleInfoByUserDialog';
import RoleInfoByUserDialog from '@/dialogs/RoleInfoByUserDialog';
import { useState } from 'react';

const rootSx: SxProps<Theme> = {};

interface Props {
  className?: string;
  seq: number;
  role: CLRole;
  onClickRow: (role: CLRole) => void;
  onClickEdit: (role: CLRole) => void;
  selected?: boolean;
}

type DialogId = 'RoleInfoByUserDialog';

export default function RoleRow(props: Props) {
  const { className, seq, role, selected = false, onClickRow, onClickEdit } = props;
  const { roleId, roleNm } = role;
  const [dialogId, setDialogId] = useState<DialogId>();
  const [roleInfoByUserDialogProps, setRoleInfoByUserDialogProps] =
    useState<RoleInfoByUserDialogProps>();

  const [refreshToken, setRefreshToken] = useState(0);
  const [popOverHandle, setPopOverHandle] = useState<HTMLButtonElement | null>(null);

  const handleClickPop = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOverHandle(event.currentTarget);
  };
  const handleClosePop = () => {
    setPopOverHandle(null);
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setRoleInfoByUserDialogProps(undefined);
  };

  const handleClickEditBtn = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClickEdit(role);
  };

  const handleClickRow = (event: React.MouseEvent) => {
    toggleTableRowSelectionByEventTarget(event.target as HTMLElement);
    onClickRow(role);
  };

  // 롤에 소속된 사용자 리스트 다이어로그
  const openRoleByUserDialog = (selectedRoleId: string, teamVersion: boolean) => {
    setDialogId('RoleInfoByUserDialog');
    setRoleInfoByUserDialogProps({
      open: true,
      onClose: closeDialog,
      onRefresh: () => setRefreshToken(Date.now),
      selectedRoleId,
      teamVersion,
    });
  };

  return (
    <TableRow
      sx={rootSx}
      className={clsx('RoleRow-root', className, {
        x_selected: selected,
      })}
      onClick={handleClickRow}
    >
      <TableCell>{selected ? <CheckIcon fontSize="small" /> : seq}</TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center">
          <Typography>{roleId}</Typography>
          <IconButton onClick={handleClickEditBtn} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
      <TableCell>{roleNm}</TableCell>
      <TableCell>
        <IconButton color="default" onClick={handleClickPop}>
          <MoreVertIcon />
        </IconButton>
        <Popover
          open={Boolean(popOverHandle)}
          anchorEl={popOverHandle}
          onClose={handleClosePop}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                openRoleByUserDialog(roleId, true);
                handleClosePop();
              }}
            >
              <ListItemIcon>
                <PeopleAltIcon />
              </ListItemIcon>
              부여된 TEAM
            </MenuItem>
          </MenuList>
          <MenuList>
            <MenuItem
              onClick={() => {
                openRoleByUserDialog(roleId, false);
                handleClosePop();
              }}
            >
              <ListItemIcon>
                <PeopleAltIcon />
              </ListItemIcon>
              부여된 사용자
            </MenuItem>
          </MenuList>
        </Popover>
      </TableCell>
      {dialogId === 'RoleInfoByUserDialog' && roleInfoByUserDialogProps && (
        <RoleInfoByUserDialog {...roleInfoByUserDialogProps} />
      )}
    </TableRow>
  );
}
