import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  Grid2,
} from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { PrivForm } from './priv-insert-schema';
import { privFormSchema } from './priv-insert-schema';
import errorCustomHandle from '@/lib/error-custom-handle';

export type PrivInsertDialogProps = {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

export default function PrivInsertDialog(props: PrivInsertDialogProps) {
  const { open, onClose, onRefresh } = props;
  const [loading, setLoading] = useState(false);

  const api = useApi();
  const rootRef = useRef<HTMLElement>();
  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);
  // 유효성
  const formConfig = useForm<PrivForm>({
    resolver: yupResolver(privFormSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  // 저장하기
  const doSave = useCallback(
    async (params: { privId: string; privNm: string; dtlExpl?: string }) => {
      setLoading(true);
      try {
        await api.clPriv.createPriv(params);
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );
  // 온서밋 핸들러(그룹페이지, 페이지)
  const onSubmitHandle = (data: PrivForm) => {
    doSave(data).then((success) => {
      if (success) {
        onRefresh();
        toast.success('저장되었습니다');
        onClose();
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
        onClose();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
      className="PrivInsertDialog-root"
      fullWidth
      maxWidth="sm"
    >
      <CustomDialogTitle onClose={onClose}>
        <Stack direction="row" alignItems="center">
          <Typography variant="h5">새 권한</Typography>
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers ref={rootRef}>
        <Grid2 rowSpacing={2} columnSpacing={1} container>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              {...register('privId')}
              onChange={(e) => e.target.value.toUpperCase()}
              autoFocus
              fullWidth
              error={!!errors.privId}
              helperText={errors.privId?.message}
              label="권한 ID"
              placeholder="권한 ID를 입력해주세요"
              onKeyDown={(e) => {
                if (isEnterOrTabKeyEvent(e)) {
                  focus('input[name=privNm]');
                }
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              {...register('privNm')}
              fullWidth
              label="권한 이름"
              error={!!errors.privNm}
              helperText={errors.privNm?.message}
              placeholder="권한 이름를 입력해주세요"
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
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1}>
          <Button
            className="x-addBtn"
            color="secondary"
            onClick={handleSubmit(onSubmitHandle)}
            size="small"
            variant="contained"
          >
            등록
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} variant="outlined" size="small">
            닫기
          </Button>
        </Stack>
      </DialogActions>
    </CustomDialog>
  );
}
