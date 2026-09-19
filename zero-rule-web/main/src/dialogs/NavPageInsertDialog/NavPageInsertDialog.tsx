import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterKeyEvent,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import { Box, Button, DialogActions, DialogContent, Grid2, TextField } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { PageInsert } from './page-insert-schema';
import { pageInsertFormSchema } from './page-insert-schema';
import BbsButton from '@/components/BbsButton';
import type { CLPage } from '@local/domain';
import { IconSelectPaper } from '@/components/IconSelectPaper/IconSelectPaper';
import errorCustomHandle from '@/lib/error-custom-handle';

export type NavPageInsertDialogProps = {
  open: boolean;
  onClose: () => void;
  updateData?: CLPage;
};

export default function NavPageInsertDialog(props: NavPageInsertDialogProps) {
  const { open, onClose, updateData } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLElement>();

  const [selectedIcon, setSelectedIcon] = useState<string>();

  useEffect(() => {
    if (!updateData) return;
    setSelectedIcon(updateData.icon);
  }, [updateData]);

  // 유효성
  const formConfig = useForm<PageInsert>({
    resolver: yupResolver(pageInsertFormSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: updateData,
  });
  const handleCloseDialog = () => {
    onClose();
  };

  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);
  // 저장하기
  const doSave = useCallback(
    async (params: {
      pageNm: string;
      pageKey?: string;
      url: string;
      icon?: string;
      dtlExpl?: string;
    }) => {
      setLoading(true);
      try {
        if (!updateData) await api.clNav.createPage(params);
        else {
          await api.clNav.updatePage({ pageId: updateData.pageId, ...params });
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
    [api, updateData],
  );
  // 온서밋 핸들러(그룹페이지, 페이지)
  const onSubmitHandle = (data: PageInsert) => {
    if (data.dtlExpl === null) data.dtlExpl = undefined;
    const insertData = {
      pageNm: data.pageNm,
      pageKey: data.pageKey,
      url: data.url,
      icon: selectedIcon,
      dtlExpl: data.dtlExpl,
    };
    doSave(insertData).then((success) => {
      if (success) {
        toast.success('저장되었습니다');
        onClose();
      }
    });
  };
  const doDelete = useCallback(
    async (params: { pageId: number }): Promise<boolean> => {
      try {
        // 삭제
        await api.clNav.deletePage(params);

        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      }
      return false;
    },
    [api],
  );
  // 삭제 버튼 클릭
  const handleClickDeleteBtn = () => {
    if (!updateData) return;
    doDelete({ pageId: updateData.pageId }).then((success) => {
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
        handleCloseDialog();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
      fullWidth
      className="NavPageInsertDialog-root"
    >
      <CustomDialogTitle
        title={updateData ? '페이지 수정' : '신규 페이지'}
        onClose={handleCloseDialog}
      />
      <Box ref={rootRef}>
        <DialogContent dividers>
          <FormProvider {...formConfig}>
            <Grid2 rowSpacing={2} columnSpacing={1} container>
              <Grid2 size={{ xs: 6 }}>
                <TextField
                  {...register('pageKey')}
                  autoFocus
                  fullWidth
                  label="페이지 KEY"
                  disabled={!canEdit}
                  error={!!errors.pageKey}
                  helperText={errors.pageKey?.message}
                  placeholder="Page KEY를 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterOrTabKeyEvent(e)) {
                      focus('input[name=pageNm]');
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 6 }} display="flex" alignItems="center">
                <IconSelectPaper
                  buttonTitle="메뉴 아이콘"
                  iconValue={selectedIcon}
                  onSubmitIcon={(selectedIcon) => setSelectedIcon(selectedIcon)}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  {...register('pageNm')}
                  fullWidth
                  label="페이지 이름"
                  required
                  disabled={!canEdit}
                  error={!!errors.pageNm}
                  helperText={errors.pageNm?.message}
                  placeholder="Page 이름을 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterKeyEvent(e)) {
                      const value = (e.target as HTMLInputElement).value;
                      if (pstring.isNotBlank(value)) {
                        e.preventDefault();
                        focus('input[name=url]');
                      }
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  {...register('url')}
                  fullWidth
                  label="페이지 URL"
                  disabled={!canEdit}
                  required
                  error={!!errors.url}
                  helperText={errors.url?.message}
                  placeholder="Page URL을 정확히 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterKeyEvent(e)) {
                      const value = (e.target as HTMLInputElement).value;
                      if (pstring.isNotBlank(value)) {
                        e.preventDefault();
                        focus('textarea[name=dtlExpl]');
                      }
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  {...register('dtlExpl')}
                  fullWidth
                  label="페이지 설명"
                  disabled={!canEdit}
                  className="NavPageInsertDialog-title"
                  error={!!errors.dtlExpl}
                  multiline
                  minRows={5}
                  maxRows={5}
                  helperText={errors.dtlExpl?.message}
                  placeholder="Page 설명 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterKeyEvent(e)) {
                      const value = (e.target as HTMLInputElement).value;
                      if (pstring.isNotBlank(value)) {
                        e.preventDefault();
                        focus('.NavPageInsertDialog-addBtn');
                      }
                    }
                  }}
                />
              </Grid2>
            </Grid2>
          </FormProvider>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          {updateData && <BbsButton onClick={handleClickDeleteBtn} color="warning" text="삭제" />}
          <div></div>
          <Box>
            <Button
              onClick={handleSubmit(onSubmitHandle)}
              className="NavPageInsertDialog-addBtn"
              color="primary"
              variant="contained"
            >
              {updateData ? '수정' : '생성'}
            </Button>
            <Button onClick={handleCloseDialog} variant="outlined">
              닫기
            </Button>
          </Box>
        </DialogActions>
      </Box>
    </CustomDialog>
  );
}
