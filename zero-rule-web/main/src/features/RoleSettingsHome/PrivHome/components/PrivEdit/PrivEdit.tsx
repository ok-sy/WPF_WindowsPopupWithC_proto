import CLDocLabelInput from '@/components/CLDocLabelInput';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { CLPriv } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  isEnterOrTabKeyEvent,
  Portlet,
  PortletContent,
  PortletHeader,
  requestFocusSelector,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LoopIcon from '@mui/icons-material/Loop';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, Stack, Typography, Grid2 } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { PrivEditForm } from './priv-edit-schema';
import { privFormSchema } from './priv-edit-schema';
import errorCustomHandle from '@/lib/error-custom-handle';

const rootSx: SxProps<Theme> = (theme) => ({});

type Props = {
  privData?: CLPriv;
  onRefresh: () => void;
  onSelectedRefresh: () => void;
};

export default function PrivEdit(props: Props) {
  const { privData, onRefresh, onSelectedRefresh } = props;
  const rootRef = useRef<HTMLDivElement>();
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);

  const api = useApi();
  // 유효성
  const formConfig = useForm<PrivEditForm>({
    resolver: yupResolver(privFormSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  useEffect(() => {
    if (!privData) return;
    reset({ dtlExpl: privData.dtlExpl, privNm: privData.privNm });
  }, [privData, reset]);

  // 저장하기
  const doSave = useCallback(
    async (params: { privId: string; privNm: string; dtlExpl?: string }) => {
      try {
        await api.clPriv.updatePriv(params);
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
  // 온서밋 핸들러(그룹페이지, 페이지)
  const onSubmitHandle = (data: PrivEditForm) => {
    if (!privData) return;
    const updateData: CLPriv = { ...data, privId: privData.privId };
    doSave(updateData).then((success) => {
      if (success) {
        onRefresh();
        toast.success('수정 완료');
      }
    });
  };

  const doDelete = useCallback(
    async (params: { privId: string }): Promise<boolean> => {
      try {
        await api.clPriv.deletePriv(params);
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
    if (!privData) return;
    doDelete({ privId: privData.privId }).then((result) => {
      if (result) {
        onRefresh();
        onSelectedRefresh();
        toast.success('삭제되었습니다.');
      }
    });
  };

  return (
    <Box sx={rootSx} className="PrivEdit-root" ref={rootRef}>
      <Portlet>
        <PortletHeader>
          <TitleWithReloadButton title="상세 및 수정" />
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<LoopIcon />}
              variant="outlined"
              size="small"
              onClick={handleSubmit(onSubmitHandle)}
            >
              수정
            </Button>
            <Button
              variant="outlined"
              onClick={handleClickDeleteBtn}
              color="warning"
              size="small"
              startIcon={<DeleteOutlineIcon />}
            >
              삭제
            </Button>
          </Stack>
        </PortletHeader>
        <PortletContent
          noPadding
          ref={setBodyElement}
          className="PrivEdit-body"
          sx={{
            height: `calc(100vh - ${bodyTop}px - 35px)`,
            py: 3,
            px: 2,
          }}
        >
          {privData ? (
            <>
              <Stack px={1} direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="subtitle2">PRIV ID :</Typography>
                <Typography color="primary" fontSize="1rem" variant="h6">
                  {privData.privId}
                </Typography>
              </Stack>
              <Grid2 container>
                <Grid2 size={{ xs: 12 }}>
                  <CLDocLabelInput
                    {...register('privNm')}
                    error={!!errors.privNm}
                    helperText={errors.privNm?.message}
                    title="권한 이름"
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        focus('textarea[name=dtlExpl]');
                      }
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                  <CLDocLabelInput
                    {...register('dtlExpl')}
                    error={!!errors.dtlExpl}
                    helperText={errors.dtlExpl?.message}
                    title="PRIV 설명"
                    multiline
                    minRows={7}
                    maxRows={7}
                  />
                </Grid2>
              </Grid2>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#eeeef0',
              }}
            >
              <Typography sx={{ fontSize: '2.5rem', color: '#5f5f60' }}>
                데이터를 선택해주세요
              </Typography>
            </Box>
          )}
        </PortletContent>
      </Portlet>
    </Box>
  );
}
