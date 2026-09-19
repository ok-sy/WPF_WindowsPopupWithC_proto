import BbsButton from '@/components/BbsButton';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { yupResolver } from '@hookform/resolvers/yup';
import type { CLNav } from '@local/domain';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Grid2,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { NavEdit } from './nav-edit-schema';
import { navEditSchema } from './nav-edit-schema';

export type NavEditDialogProps = {
  open: boolean;
  onClose: () => void;
  navData?: CLNav;
};

export default function NavEditDialog(props: NavEditDialogProps) {
  const { open, onClose, navData } = props;
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLElement>();
  const [updateHandle, setUpdateHandle] = useState(false);
  const api = useApi();
  useEffect(() => {
    if (!navData) setUpdateHandle(true);
  }, [navData]);

  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);
  // 유효성
  const formConfig = useForm<NavEdit>({
    resolver: yupResolver(navEditSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: navData,
  });

  // 저장하기
  const doSave = useCallback(
    async (params: { navNm: string; expl?: string }) => {
      setLoading(true);
      try {
        if (!navData) await api.clNav.createNav(params);
        else {
          await api.clNav.updateNav({ navId: navData.navId, ...params });
        }

        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api, navData],
  );
  // 온서밋 핸들러(그룹페이지, 페이지)
  const onSubmitHandle = (data: NavEdit) => {
    if (data.expl === null) data.expl = undefined;
    const insertData = {
      navNm: data.navNm,
      expl: data.expl,
    };
    doSave(insertData).then((success) => {
      if (success) {
        toast.success('저장되었습니다');
        onClose();
      }
    });
  };

  const doDelete = useCallback(
    async (params: { navId: number }): Promise<boolean> => {
      try {
        // 삭제
        await api.clNav.deleteNav(params);
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
    if (!navData) return;
    doDelete({ navId: navData.navId }).then((success) => {
      if (success) {
        onClose();
        toast.success('삭제되었습니다');
      }
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;
  const canSubmit = isValid && !isSubmitting;
  const canEdit = !isSubmitting;

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
      className="NavEditDialog-root"
      fullWidth
      maxWidth="xs"
    >
      <CustomDialogTitle sx={{ pl: 0 }} onClose={onClose}>
        {navData && updateHandle && (
          <Tooltip sx={{ mr: 1 }} arrow title="뒤로">
            <IconButton onClick={(_) => setUpdateHandle(false)} size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Stack direction="row" alignItems="center">
          <Typography
            variant="h5"
            sx={{
              em: {
                color: 'secondary.main',
                fontStyle: 'normal',
              },
            }}
          >
            {!navData ? (
              '신규'
            ) : (
              <>
                <em>{navData.navNm}</em> 정보
              </>
            )}
          </Typography>
          {navData && !updateHandle && (
            <Tooltip sx={{ ml: 1 }} arrow title="수정">
              <IconButton onClick={(_) => setUpdateHandle(true)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers>
        <Grid2 rowSpacing={2.5} container>
          {!updateHandle ? (
            <>
              <Grid2 size={{ xs: 12 }}>
                <Stack alignItems="center" direction="row">
                  <Typography sx={{ fontWeight: 500 }} variant="subtitle1">
                    이름
                  </Typography>
                  <Typography ml={5} variant="body1">
                    {navData?.navNm}
                  </Typography>
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <Stack direction="row">
                  <Typography variant="subtitle1">설명</Typography>
                  <Typography
                    sx={{
                      p: 1,
                      width: 300,
                      overflow: 'auto',
                      height: 150,
                      border: '1px solid #e0e0e0',
                    }}
                    ml={5}
                  >
                    {navData?.expl ?? '-'}
                  </Typography>
                </Stack>
              </Grid2>
            </>
          ) : (
            <>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  {...register('navNm')}
                  autoFocus
                  fullWidth
                  label="이름"
                  disabled={!canEdit}
                  error={!!errors.navNm}
                  helperText={errors.navNm?.message}
                  placeholder="이름 예) EAI팀메뉴"
                  onKeyDown={(e) => {
                    if (isEnterOrTabKeyEvent(e)) {
                      focus('input[name=expl]');
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  {...register('expl')}
                  fullWidth
                  multiline
                  maxRows={5}
                  minRows={5}
                  label="설명"
                  disabled={!canEdit}
                  error={!!errors.expl}
                  helperText={errors.expl?.message}
                  placeholder="설명을 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterOrTabKeyEvent(e)) {
                      focus('input[name=pageNm]');
                    }
                  }}
                />
              </Grid2>
            </>
          )}
        </Grid2>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        {navData && <BbsButton onClick={handleClickDeleteBtn} color="warning" text="삭제" />}
        <div />
        <Box>
          {updateHandle && (
            <Button onClick={handleSubmit(onSubmitHandle)}>{navData ? '수정' : '등록'}</Button>
          )}
          <Button variant="outlined" onClick={onClose}>
            닫기
          </Button>
        </Box>
      </DialogActions>
    </CustomDialog>
  );
}
