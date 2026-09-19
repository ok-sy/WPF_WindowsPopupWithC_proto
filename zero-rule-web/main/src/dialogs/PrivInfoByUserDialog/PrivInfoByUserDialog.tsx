import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import { useApi } from '@/provider';
import { CustomDialog, CustomDialogTitle, requestFocusSelector } from '@local/ui';
import type { ApiRequestContext } from '@local/domain';
import {
  Button,
  DialogActions,
  DialogContent,
  LinearProgress,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { async } from 'rxjs';
import type { CLRoleUser } from '@local/domain';
import handleError from '@/lib/handle-error';
import errorCustomHandle from '@/lib/error-custom-handle';

export type PrivInfoByUserDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedPrivId: string;
  onRefresh: () => void;
  teamVersion: boolean;
};

export default function PrivInfoByUserDialog(props: PrivInfoByUserDialogProps) {
  const { open, onClose, selectedPrivId, onRefresh, teamVersion } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLElement>();
  const [refreshToken, setRefreshToken] = useState(0);
  //사용자 정보
  const [roleByUserList, setRoleByUserList] = useState<CLRoleUser[]>();

  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  const handleCloseDialog = () => {
    onClose();
  };
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  const doReload = useCallback(
    async (ctx: ApiRequestContext, privId: string) => {
      setLoading(true);
      try {
        const { body } = await api.clRoleUser.userListByPriv({ ctx, privId });
        const { userList } = body;
        if (ctx.canceled) return;
        setRoleByUserList(userList);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    doReload(ctx, selectedPrivId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, selectedPrivId]);
  return (
    <CustomDialog
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
      className="PrivInfoByUserDialog-root"
      fullWidth
      maxWidth="xs"
      sx={{}}
    >
      <CustomDialogTitle onClose={handleCloseDialog}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5" color="chocolate">
            {selectedPrivId}
          </Typography>
          {teamVersion ? (
            <Typography variant="subtitle2">부여된 TEAM 목록 </Typography>
          ) : (
            <Typography variant="subtitle2">부여된 사용자 목록 </Typography>
          )}
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers sx={{ p: 0, minHeight: 250 }}>
        <TableContainer>
          <CLStyledTable noMargin>
            <CLDocTableHead yPadding="small">
              {teamVersion ? (
                <TableRow>
                  <TableCell>TEAM 아이디</TableCell>
                  <TableCell>TEAM 이름</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell>사용자 아이디</TableCell>
                  <TableCell>사용자 이름</TableCell>
                  <TableCell>소속 TEAM</TableCell>
                </TableRow>
              )}
            </CLDocTableHead>
            <CLDocTableBody>
              {roleByUserList?.map((el) => (
                <>
                  {teamVersion && (
                    <TableRow>
                      <TableCell>{el.teamId}</TableCell>
                      <TableCell>{el.teamNm}</TableCell>
                    </TableRow>
                  )}
                  {!teamVersion && (
                    <TableRow>
                      <TableCell>{el.lgonId}</TableCell>
                      <TableCell>{el.userNm}</TableCell>
                      <TableCell>{el.teamNm}</TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 30 }}>
            <LinearProgress color="secondary" />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
