import { MenuEditManager } from '@/features/NavMenusHome/components/MenuEdit/MenuEditManager';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import { Box, Button, DialogActions, DialogContent, TextField, Grid2 } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { SectionInsert } from './section-insert-schema';
import { sectionInsertFormSchema } from './section-insert-schema';
import type { CLPageSection } from '@local/domain';
import BbsButton from '@/components/BbsButton';
import { IconSelectPaper } from '@/components/IconSelectPaper/IconSelectPaper';
import errorCustomHandle from '@/lib/error-custom-handle';

// 섹션이 들어오면 수정, 아니면 신규
export type NavSectionEditDialogProps = {
  open: boolean;
  onClose: () => void;
  navId: number;
  sectionId?: number;
  onSaved: (section: CLPageSection) => void;
  onDel: (sectionId: number) => void;
};

export default function NavSectionEditDialog(props: NavSectionEditDialogProps) {
  const { open, onClose, navId, sectionId, onSaved, onDel } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [sectionData, setSectionData] = useState<CLPageSection>();
  const menuEditMgr = useMemo(() => new MenuEditManager(), []);
  const rootRef = useRef<HTMLElement>();
  // TextField lable의 표시 오류: form을 리마운트 하기 위한 key값
  const [formResetToken, setFormResetToken] = useState(0);

  const [selectedIcon, setSelectedIcon] = useState<string>();

  // 유효성
  const formConfig = useForm<SectionInsert>({
    resolver: yupResolver(sectionInsertFormSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  const handleCloseDialog = () => {
    onClose();
  };

  // 단건조회
  const doLoadInfo = useCallback(
    async (ctx: ApiRequestContext, sectionId: number) => {
      try {
        setLoading(true);
        const { body } = await api.clNav.sectionInfo({ ctx, sectionId });
        const { section } = body;
        if (ctx.canceled) return;
        setSectionData(section);
        reset(section);
        setSelectedIcon(section.icon);
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
  useEffect(() => {
    if (!sectionId) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadInfo(ctx, sectionId);
    return () => {
      ctx.cancel?.();
      ctx.canceled = true;
    };
  }, [doLoadInfo, sectionId]);

  // 포커싱
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  // 저장하기
  const doSave = useCallback(
    async (params: {
      sectionId?: number;
      sectionNm: string;
      icon?: string;
    }): Promise<CLPageSection | null> => {
      const { sectionId, ...rest } = params;
      setLoading(true);
      try {
        if (!sectionId) {
          // 섹션 신규 등록
          const { body } = await api.clNav.createSection(rest);
          const { section } = body;
          return section;
        }

        // 섹션 수정
        const { body } = await api.clNav.updateSection({
          sectionId,
          ...rest,
        });
        const { section } = body;
        return section;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );

  // 온서밋 핸들러(그룹페이지, 페이지)
  const onSubmitHandle = (data: SectionInsert) => {
    const insertData = {
      sectionId,
      sectionNm: data.sectionNm,
      icon: selectedIcon,
    };

    doSave(insertData).then((savedSection) => {
      if (savedSection !== null) {
        onSaved(savedSection);
      }
      onClose();
    });
  };

  // 삭제
  const doDelete = useCallback(
    async (params: { navId: number; sectionId: number }): Promise<number> => {
      try {
        // 삭제
        await api.clNav.deleteSection(params);
        if (!sectionId) return 0;
        return sectionId;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
      }
      return 0;
    },
    [api, sectionId],
  );
  // 삭제 버튼 클릭
  const handleClickDeleteBtn = () => {
    if (!sectionId) return;
    doDelete({
      navId,
      sectionId,
    }).then((success) => {
      if (success !== 0) {
        onClose();
        onDel(success);
      }
    });
  };

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
      maxWidth="xs"
      className="NavSectionEditDialog-root"
      sx={{ '& .MuiPaper-root': { position: 'inherit' } }}
    >
      <CustomDialogTitle
        title={sectionId ? `그룹 수정` : '새 그룹 추가'}
        onClose={handleCloseDialog}
      />
      <Box ref={rootRef}>
        <DialogContent dividers>
          <FormProvider {...formConfig}>
            <Grid2 my={1} rowSpacing={3} columnSpacing={1} container key={formResetToken}>
              <Grid2 size={{ xs: 12 }} display="flex" alignItems="center">
                <IconSelectPaper
                  buttonTitle="그룹 아이콘"
                  iconValue={selectedIcon}
                  onSubmitIcon={(selectedIcon) => {
                    if (selectedIcon) focus('input[name=sectionNm]');
                    setSelectedIcon(selectedIcon);
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  {...register('sectionNm')}
                  label="그룹 이름"
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.sectionNm}
                  helperText={errors.sectionNm?.message}
                  placeholder="그룹명을 입력해주세요"
                  onKeyDown={(e) => {
                    if (isEnterOrTabKeyEvent(e)) {
                      focus('.NavSectionEditDialog-addBtn');
                    }
                  }}
                />
              </Grid2>
            </Grid2>
          </FormProvider>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          {sectionData && (
            <BbsButton sx={{ ml: 1 }} onClick={handleClickDeleteBtn} color="warning" text="삭제" />
          )}
          <div></div>
          <Box>
            <Button
              onClick={handleSubmit(onSubmitHandle)}
              className="NavSectionEditDialog-addBtn"
              color="primary"
              variant="contained"
            >
              {sectionData ? '수정' : '생성'}
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
