import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCodeType } from '@local/domain';
import { matchErrorCode } from '@local/domain';
import { CustomDialog, CustomDialogTitle, sxDialogHeight } from '@local/ui';
import { Box, DialogContent, LinearProgress } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import CommonCodeEditForm from './components/CommonCodeEditForm';
import errorCustomHandle from '@/lib/error-custom-handle';

export type CommonCodeEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  codeType: string;
};

export default function CommonCodeEditDialog(props: CommonCodeEditDialogProps) {
  const { open, onClose, onSaved, codeType } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [codeTypeEntity, setCodeTypeEntity] = useState<CLCodeType>();

  const closeFnRef = useRef<CommonCodeEditDialogProps['onClose']>();
  closeFnRef.current = onClose;

  const handleCloseDialog = () => {
    onClose();
  };

  // 코드 유형 데이터 로드
  const doLoadCodeType = useCallback(
    async (ctx: ApiRequestContext, codeType: string) => {
      setLoading(true);
      try {
        const { body } = await api.clCodeType.info({
          ctx,
          codeType,
        });
        const { codeType: codeTypeEntity } = body;
        if (ctx.canceled) return;
        setCodeTypeEntity(codeTypeEntity);
      } catch (err) {
        if (matchErrorCode(err, 'E1_NO_SUCH_CODE_TYPE')) {
          alert('해당 코드 그룹이 존재하지 않습니다.');
          closeFnRef.current?.();
          return;
        }
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // 코드 유형 데이터 로드
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadCodeType(ctx, codeType);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doLoadCodeType, codeType]);

  // 저장 완료
  const handleSaved = () => {
    onSaved();
  };

  return (
    <CustomDialog
      open={open}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="md"
      className="CommonCodeEditDialog-root"
      sx={{
        ...sxDialogHeight('minHeight', 70),
      }}
    >
      <CustomDialogTitle title="공통코드 등록" onClose={handleCloseDialog} />
      {codeTypeEntity && (
        <CommonCodeEditForm
          onClose={handleCloseDialog}
          onSaved={handleSaved}
          codeTypeEntity={codeTypeEntity}
        />
      )}
      {!codeTypeEntity && (
        <DialogContent sx={{ overflowX: 'hidden', position: 'relative', py: 1.5, pl: 2 }} dividers>
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
      )}
    </CustomDialog>
  );
}
