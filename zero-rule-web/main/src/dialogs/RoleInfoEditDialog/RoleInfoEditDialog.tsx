import BbsButton from '@/components/BbsButton';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLRole } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import { FamilyRestroomTwoTone } from '@mui/icons-material';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  Grid2,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { async } from 'rxjs';
import type { RoleEditForm } from './role-edit-schema';
import { roleFormSchema } from './role-edit-schema';
import errorCustomHandle from '@/lib/error-custom-handle';

export type RoleInfoEditDialogProps = {
  open: boolean;
  onClose: () => void;
  roleId?: string;
  onRefresh: () => void;
};

export default function RoleInfoEditDialog(props: RoleInfoEditDialogProps) {
  const { open, onClose, roleId, onRefresh } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLElement>();

  const [formResetToken, setFormResetToken] = useState(0);

  const [roleInfo, setRoleInfo] = useState<CLRole>();

  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  // 유효성
  const formConfig = useForm<RoleEditForm>({
    resolver: yupResolver(roleFormSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
    defaultValues: roleInfo,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  // 편집 모드일때만 호출
  const doReloadInfo = useCallback(
    async (ctx: ApiRequestContext, roleId: string) => {
      setLoading(true);
      try {
        const { body } = await api.clRole.roleInfo({ ctx, roleId });
        const { role } = body;
        if (ctx.canceled) return;
        setFormResetToken(Date.now());
        setRoleInfo(role);
        reset(role);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api, reset],
  );
  // 온서밋 핸들러(그룹페이지, 페이지)
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    if (!roleId) return;
    doReloadInfo(ctx, roleId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReloadInfo, roleId]);

  const doSave = useCallback(
    async (
      editing: boolean,
      params: {
        roleId: string;
        roleNm: string;
      },
    ) => {
      setLoading(true);
      try {
        if (!editing) {
          await api.clRole.updateRole(params);
          return true;
        } else {
          await api.clRole.createRole(params);
          return true;
        }
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return FamilyRestroomTwoTone;
    },
    [api],
  );
  // 온서밋 핸들러(그룹페이지, 페이지)
  const onSubmitHandle = (data: RoleEditForm) => {
    const editing = !roleId;
    doSave(editing, data).then((success) => {
      if (success) {
        toast.success('저장되었습니다');
        onRefresh();
        onClose();
      }
    });
  };
  const handleCloseDialog = () => {
    onClose();
  };

  // 삭제
  const doDelete = useCallback(
    async (params: { roleId: string }): Promise<boolean> => {
      try {
        await api.clRole.deleteRole(params);
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
      }
      return false;
    },
    [api],
  );
  // 삭제 버튼 클릭
  const handleClickDeleteBtn = () => {
    if (!roleId) return;
    doDelete({ roleId: roleId }).then((result) => {
      if (result) {
        onClose();
        onRefresh();
        toast.success('삭제되었습니다.');
      }
    });
  };
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
      className="RoleInfoEditDialog-root"
      fullWidth
      maxWidth="xs"
    >
      <CustomDialogTitle onClose={handleCloseDialog}>
        <Stack direction="row" alignItems="center">
          <Typography variant="h5">{roleId ? 'ROLE 수정' : 'ROLE 신규등록'}</Typography>
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers>
        <Box ref={rootRef}>
          <Grid2 sx={{ py: 1 }} rowSpacing={2.5} container key={formResetToken}>
            <Grid2 size={{ xs: 12 }}>
              {roleId ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography>Rule ID : </Typography>
                  <Typography variant="subtitle2" color="secondary">
                    {roleId}
                  </Typography>
                </Stack>
              ) : (
                <TextField
                  {...register('roleId')}
                  autoFocus
                  fullWidth
                  error={!!errors.roleId}
                  helperText={errors.roleId?.message}
                  label="롤 ID"
                  placeholder="롤 ID를 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterOrTabKeyEvent(e)) {
                      focus('input[name=roleNm]');
                    }
                  }}
                />
              )}
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                {...register('roleNm')}
                fullWidth
                label="롤 이름"
                error={!!errors.roleNm}
                helperText={errors.roleNm?.message}
                placeholder="롤 이름를 입력해주세요"
                onKeyDown={(e) => {
                  if (isEnterOrTabKeyEvent(e)) {
                    focus('textarea[name=dtlExpl]');
                  }
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                {...register('dtlExpl')}
                fullWidth
                label="권한 설명"
                className="NavPageInsertDialog-title"
                error={!!errors.dtlExpl}
                multiline
                minRows={5}
                maxRows={5}
                helperText={errors.dtlExpl?.message}
                placeholder="권한 설명 입력해주세요"
              />
            </Grid2>
          </Grid2>
          {loading && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 30 }}>
              <LinearProgress color="secondary" />
            </div>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" justifyContent="space-between" flex={1}>
          <Box>
            <Button size="small" color="warning" onClick={handleClickDeleteBtn}>
              삭제
            </Button>
          </Box>
          <Box>
            <Button className="x-addBtn" color="secondary" onClick={handleSubmit(onSubmitHandle)}>
              {roleId ? '수정' : '등록'}
            </Button>

            <Button onClick={handleCloseDialog} variant="outlined">
              닫기
            </Button>
          </Box>
        </Stack>
      </DialogActions>
    </CustomDialog>
  );
}
