import type { PrivInfoByUserDialogProps } from '@/dialogs/PrivInfoByUserDialog';
import PrivInfoByUserDialog from '@/dialogs/PrivInfoByUserDialog';
import type { CLPriv } from '@local/domain';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import {
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Popover,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
  seq: number;
  data: CLPriv;
  onClickRow: (selectedData: CLPriv) => void;
  // onDelete: (privId: number) => void
  selected?: boolean;
};

type DialogId = 'PrivInfoByUserDialog';

export default function PrivRow(props: Props) {
  const { data, onClickRow, selected, seq } = props;
  const { privId, privNm, dtlExpl } = data;
  const [dialogId, setDialogId] = useState<DialogId>();
  const [privInfoByUserDialogProps, setPrivInfoByUserDialogProps] =
    useState<PrivInfoByUserDialogProps>();

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
    setPrivInfoByUserDialogProps(undefined);
  };

  // Priv 에 소속된 사용자 리스트 다이어로그
  const openPrivByUserDialog = (selectedPrivId: string, teamVersion: boolean) => {
    setDialogId('PrivInfoByUserDialog');
    setPrivInfoByUserDialogProps({
      open: true,
      onClose: closeDialog,
      onRefresh: () => setRefreshToken(Date.now),
      selectedPrivId,
      teamVersion,
    });
  };
  return (
    <TableRow
      className={clsx('PrivRow-root', {
        x_selected: selected,
      })}
      onClick={(e) => {
        onClickRow(data);
      }}
    >
      <TableCell>{selected ? <CheckIcon fontSize="small" /> : seq}</TableCell>
      <TableCell>
        <Typography my={0.5}>{privId}</Typography>
      </TableCell>
      <TableCell>{privNm}</TableCell>
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
                openPrivByUserDialog(privId, true);
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
                openPrivByUserDialog(privId, false);
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
      {dialogId === 'PrivInfoByUserDialog' && privInfoByUserDialogProps && (
        <PrivInfoByUserDialog {...privInfoByUserDialogProps} />
      )}
    </TableRow>
  );
}
