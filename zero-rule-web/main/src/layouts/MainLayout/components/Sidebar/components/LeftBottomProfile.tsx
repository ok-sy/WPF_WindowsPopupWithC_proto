import { useLoginProfile } from '@/auth/useLoginProfile';
import type { ThemeDialogProps } from '@/dialogs/ThemeDialog';
import ThemeDialog from '@/dialogs/ThemeDialog';
import type { UserMgmtInfoDialogProps } from '@/dialogs/UserMgmtInfoDialog';
import UserMgmtInfoDialog from '@/dialogs/UserMgmtInfoDialog';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import type { SxProps, Theme } from '@mui/material';
import {
  Avatar,
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
const rootSx: SxProps<Theme> = {
  py: 1.5,
  borderTop: '1px solid #e0e0e0',
  px: 2,
};
type DialogId = 'ThemeDialog' | 'UserMgmtInfoDialog';
export default function LeftBottomProfile() {
  const [popOverHandle, setPopOverHandle] = useState<HTMLButtonElement | null>(null);
  const login = useLoginProfile();
  const router = useRouter();

  const [dialogId, setDialogId] = useState<DialogId>();
  const [themeDialogProps, setThemeDialogProps] = useState<ThemeDialogProps>();
  const [userMgmtInfoDialogProps, setUserMgmtInfoDialogProps] = useState<UserMgmtInfoDialogProps>();

  const closeDialog = () => {
    setDialogId(undefined);
    setThemeDialogProps(undefined);
  };

  const handleClickPop = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOverHandle(event.currentTarget);
  };
  const handleClosePop = () => {
    setPopOverHandle(null);
  };
  const onClickLogout = () => {
    router.push('/logout');
  };
  const handleClickThemeDialog = () => {
    setDialogId('ThemeDialog');
    setThemeDialogProps({
      open: true,
      onClose: closeDialog,
    });
  };

  // 기본정보 및 수정 다이어로그
  const userInfoDialogHandle = () => {
    if (!login?.profile?.userId) return;
    setDialogId('UserMgmtInfoDialog');
    setUserMgmtInfoDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
      },
      normalUserMode: true,
      userId: login?.profile?.userId,
    });
  };
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={rootSx}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ width: '2rem', height: '2rem', mr: 1 }} />
        <Typography sx={{ color: '#fff', mr: 2 }} variant="h5">
          {login?.profile?.userNm}님
        </Typography>
        <Typography sx={{ color: '#fff', mr: 2 }} variant="h5"></Typography>
      </Stack>
      <IconButton color="inherit" onClick={handleClickPop}>
        <MoreVertIcon />
      </IconButton>
      <Popover
        open={Boolean(popOverHandle)}
        anchorEl={popOverHandle}
        onClose={handleClosePop}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              userInfoDialogHandle();
              handleClosePop();
            }}
          >
            <ListItemIcon>
              <AccountCircleOutlinedIcon />
            </ListItemIcon>
            내 계정
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleClickThemeDialog();
              handleClosePop();
            }}
          >
            <ListItemIcon>
              <PaletteOutlinedIcon />
            </ListItemIcon>
            테마 설정
          </MenuItem>
          <MenuItem
            onClick={() => {
              onClickLogout();
              handleClosePop();
            }}
          >
            <ListItemIcon>
              <PowerSettingsNewIcon />
            </ListItemIcon>
            로그아웃
          </MenuItem>
        </MenuList>
      </Popover>
      {dialogId === 'ThemeDialog' && themeDialogProps && <ThemeDialog {...themeDialogProps} />}
      {dialogId === 'UserMgmtInfoDialog' && userMgmtInfoDialogProps && (
        <UserMgmtInfoDialog clientVersion {...userMgmtInfoDialogProps} />
      )}
    </Stack>
  );
}
