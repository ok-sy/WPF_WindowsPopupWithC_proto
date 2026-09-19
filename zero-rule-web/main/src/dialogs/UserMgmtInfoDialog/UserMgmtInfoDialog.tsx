import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLUser } from '@local/domain';
import { Team } from '@local/domain';
import { CustomDialog, CustomDialogTitle } from '@local/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps, Theme } from '@mui/material';
import {
  alpha,
  Box,
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import UserMgmtInfoForm from './components/UserMgmtInfoForm';
import UserMgmtUpdateForm from './components/UserMgmtUpdateForm';
import errorCustomHandle from '@/lib/error-custom-handle';
const rootSx: SxProps<Theme> = (theme) => ({
  '& .UserMgmtInfoDialog-content': {
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
  },
  em: {
    color: 'secondary.main',
    fontStyle: 'normal',
  },
});

export type UserMgmtInfoDialogProps = {
  open: boolean;
  onClose: () => void;
  userId: number;
  normalUserMode?: boolean;
  clientVersion?: boolean;
};

export default function UserMgmtInfoDialog(props: UserMgmtInfoDialogProps) {
  const { userId, open, onClose, normalUserMode = false, clientVersion } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  //편집모드 핸들러
  const [editHandler, setEditHandler] = useState(false);

  // 서버에서 불러와진 사용자 상세정보
  const [userInfo, setUserInfo] = useState<CLUser>();
  //수정

  // TextField lable의 표시 오류: form을 리마운트 하기 위한 key값
  const [formResetToken, setFormResetToken] = useState(0);

  const handleCloseDialog = () => {
    onClose();
  };

  const doLoadInfo = useCallback(
    async (ctx: ApiRequestContext, userId: number) => {
      try {
        setLoading(true);
        const { body } = await api.userManage.info({ ctx, userId });
        const { user } = body;
        setUserInfo(user);
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadInfo(ctx, userId);
    return () => {
      ctx.cancel?.();
      ctx.canceled = true;
    };
  }, [userId, doLoadInfo, editHandler, formResetToken]);

  return (
    <CustomDialog
      maxWidth="md"
      fullWidth
      className="UserMgmtInfoDialog-root"
      sx={rootSx}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleCloseDialog();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
    >
      {editHandler ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Tooltip arrow title="돌아가기">
            <IconButton
              sx={{ width: 50, height: 50 }}
              onClick={(e) => setEditHandler(!editHandler)}
              size="small"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="h5">사용자 정보 수정</Typography>
          <Stack flex={1}>
            <CustomDialogTitle onClose={handleCloseDialog}></CustomDialogTitle>
          </Stack>
        </Box>
      ) : (
        <Box
          sx={{
            pl: 3,
            pr: 1,
            py: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" alignItems="center">
            <Typography variant="h5">
              <em>{userInfo?.userNm}</em>님의 정보
            </Typography>
            {!normalUserMode && (
              <Tooltip title={normalUserMode ? '내 정보 수정' : '수정'} arrow>
                <IconButton onClick={(e) => setEditHandler(!editHandler)} sx={{ ml: 1 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          <IconButton onClick={onClose} color="inherit">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {userInfo &&
        (editHandler ? (
          // 업데이트 form
          <UserMgmtUpdateForm
            onClose={() => {
              setFormResetToken(Date.now());
              setEditHandler(false);
            }}
            userData={userInfo}
          />
        ) : (
          // 상세정보 form
          <>
            <DialogContent dividers className="UserMgmtInfoDialog-content">
              <UserMgmtInfoForm
                normalUserMode={normalUserMode}
                userData={userInfo}
                clientVersion={clientVersion}
              />
            </DialogContent>
            <DialogActions>
              <Stack direction="row" flex={1} justifyContent="flex-end">
                <Button size="small" variant="outlined" onClick={handleCloseDialog}>
                  닫기
                </Button>
              </Stack>
            </DialogActions>
          </>
        ))}
      {loading && (
        <Box sx={{ position: 'absolute', top: 50, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
    </CustomDialog>
  );
}
