import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { yupResolver } from '@hookform/resolvers/yup';
import type { ApiRequestContext, CLCodeType } from '@local/domain';
import { CustomDialog, CustomDialogTitle } from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  Grid2,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { CommonCodeTypeFormValues } from './code-type-edit-schema';
import { CommonCodeTypeFormSchema } from './code-type-edit-schema';

export type CommonCodeTypeEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onUpdated?: (newValue: CLCodeType) => void;
  onDeleted?: () => void;
  codeType?: string;
};

export default function CommonCodeTypeEditDialog(props: CommonCodeTypeEditDialogProps) {
  const { open, onClose, codeType } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);

  // 편집모드인 경우 서버에서 로드안 코드 타입 정보
  const [orgCommonCodeType, setOrgCommonCodeType] = useState<CLCodeType>();

  const onDeletedFnRef = useRef<CommonCodeTypeEditDialogProps['onDeleted']>();
  onDeletedFnRef.current = props.onDeleted;

  const onUpdatedFnRef = useRef<CommonCodeTypeEditDialogProps['onUpdated']>();
  onUpdatedFnRef.current = props.onUpdated;

  // TextField lable의 표시 오류: form을 리마운트 하기 위한 key값
  const [formResetToken, setFormResetToken] = useState(0);

  const handleCloseDialog = () => {
    onClose();
  };

  const formConfig = useForm<CommonCodeTypeFormValues>({
    resolver: yupResolver(CommonCodeTypeFormSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
  });

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  const doLoadInfo = useCallback(
    async (ctx: ApiRequestContext, codeType: string) => {
      try {
        setLoading(true);
        const { body } = await api.clCodeType.info({ ctx, codeType });
        if (ctx.canceled) return;
        const { codeType: codeTypeEntity } = body;
        setOrgCommonCodeType(codeTypeEntity);
        reset(codeTypeEntity);
        setFormResetToken(Date.now());
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api, reset],
  );

  // 편집 모드인 경우 서버에서 코드타입 정보 로드
  useEffect(() => {
    if (!codeType) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadInfo(ctx, codeType);
    return () => {
      ctx.cancel?.();
      ctx.canceled = true;
    };
  }, [codeType, doLoadInfo]);

  const doSave = useCallback(
    async (params: {
      isEditing: boolean;
      codeType: string; // pk1
      codeTypeNm: string;
      dtlExpl?: string;
    }): Promise<CLCodeType | null> => {
      try {
        const { isEditing, ...rest } = params;
        // 업데이트 또는 신규 등록
        if (isEditing) {
          const { body } = await api.clCodeType.update(rest);
          const { codeType } = body;
          toast.success('수정되었습니다');
          return codeType;
        } else {
          const { body } = await api.clCodeType.create(rest);
          const { codeType: codeTypeEntity } = body;
          toast.success('저장되었습니다');
          return codeTypeEntity;
        }
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      }
      return null;
    },
    [api],
  );

  const onSubmitHandle = (data: CommonCodeTypeFormValues) => {
    const isEditing = !!props.codeType;
    doSave({ isEditing, ...data }).then((result) => {
      if (result) {
        onUpdatedFnRef.current?.(result);
        handleCloseDialog();
      }
    });
    onClose();
  };

  const doDelete = useCallback(
    async (params: { codeType: string }): Promise<boolean> => {
      try {
        // 삭제
        await api.clCodeType.deleteWithCodes(params);
        toast.success('삭제되었습니다');
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
    const codeType = orgCommonCodeType?.codeType;
    if (!codeType) return;
    doDelete({ codeType }).then((success) => {
      if (success) {
        onDeletedFnRef.current?.();
        handleCloseDialog();
      }
    });
  };

  const canSubmit = isValid && !isSubmitting;
  const canEdit = !isSubmitting;
  const isEditing = !!props.codeType;
  return (
    <CustomDialog
      open={open}
      onClose={handleCloseDialog}
      fullWidth
      className="CommonCodeTypeDialog-root"
    >
      <CustomDialogTitle
        title={`공통코드 그룹 ${isEditing ? '수정' : '등록'}`}
        onClose={handleCloseDialog}
      />
      <DialogContent dividers>
        <Grid2 container rowSpacing={2.5} columnSpacing={2} key={formResetToken}>
          <Grid2 size={{ xs: 12 }}>
            {isEditing ? (
              <Stack direction="column" alignItems="center" justifyContent="center">
                <Typography variant="body2">그룹 코드</Typography>
                <Typography color="primary" variant="subtitle1" sx={{}}>
                  {orgCommonCodeType?.codeType}
                </Typography>
              </Stack>
            ) : (
              <TextField
                {...register('codeType')}
                autoFocus
                fullWidth
                label="그룹 코드"
                disabled={!canEdit}
                required
                size="small"
                error={!!errors.codeType}
                helperText={errors.codeType?.message}
              />
            )}
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <TextField
              {...register('codeTypeNm')}
              label="그룹명"
              required
              fullWidth
              disabled={!canEdit}
              size="small"
              error={!!errors.codeTypeNm}
              helperText={errors.codeTypeNm?.message}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              {...register('dtlExpl')}
              disabled={!canEdit}
              label="설명"
              size="small"
              fullWidth
            />
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions sx={{ justifyContent: isEditing ? 'space-between' : 'flex-end' }}>
        {isEditing && (
          <Button color="secondary" onClick={handleClickDeleteBtn}>
            삭제
          </Button>
        )}

        <Stack spacing={1} direction="row" alignItems="center">
          <Button onClick={handleSubmit(onSubmitHandle)} disabled={!canSubmit}>
            저장
          </Button>
          <Button variant="outlined" onClick={handleCloseDialog}>
            닫기
          </Button>
        </Stack>
      </DialogActions>
    </CustomDialog>
  );
}
