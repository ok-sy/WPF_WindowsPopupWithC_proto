import BbsButton from '@/components/BbsButton';
import BbsClipboardButton from '@/components/BbsClipboardButton';
import PdsAttachFileList from '@/components/PdsAttachFileList';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import handleError, { matchError } from '@/lib/handle-error';
import { routerFullUrlOf } from '@/lib/urls';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { pstring } from '@cp949/pjs';
import type { Pds, UploadedFile } from '@local/domain';
import { CustomDialog, CustomDialogTitle, isValidFileName, MdOrUp, sanitize } from '@local/ui';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { rootSx } from './style';
import errorCustomHandle from '@/lib/error-custom-handle';

export type PdsViewDialogProps = {
  open: boolean;
  pdsId: number;
  onClose: () => void;
  onDeleted?: (pdsId: number) => void;
};

export default function PdsViewDialog(props: PdsViewDialogProps) {
  const { open, onClose, onDeleted, pdsId } = props;
  const [loading, setLoading] = useState(false);
  const [wide, setWide] = useState(false);
  const api = useApi();
  const [pds, setPds] = useState<Pds>();
  const [editingFile, setEditingFile] = useState<UploadedFile>();
  const theme = useTheme();
  const smOrDown = useMediaQuery(theme.breakpoints.down('md'));
  const { sceneManager } = useMainLayoutContext();
  const reload = useCallback(
    async (ctx: ApiRequestContext, pdsId: number) => {
      setLoading(true);
      try {
        const { body } = await api.pds.info({ ctx, pdsId });
        const { pds } = body;
        if (ctx.canceled) return;
        setPds(pds);
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
    const ctx = { canceled: false } as ApiRequestContext;
    reload(ctx, pdsId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [reload, pdsId]);

  const doRename = useCallback(
    async (fileId: string, fileName: string) => {
      setLoading(true);
      try {
        const { body } = await api.pds.renameFile({ fileId, fileName });
        const { file } = body;
        toast.success('파일명을 변경했습니다');
        setPds((pds) => {
          if (!pds) return undefined;
          const attachFiles = pds?.attachFiles ?? [];
          const idx = attachFiles.findIndex((f) => f.fileId === fileId);
          if (idx >= 0) {
            attachFiles.splice(idx, 1, file);
          }
          return { ...pds, attachFiles };
        });
        setEditingFile(undefined);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const handleClickRename = (file: UploadedFile) => {
    if (editingFile) {
      setEditingFile(undefined);
    } else {
      setEditingFile(file);
    }
  };

  const handleRenameFinished = (fileId: string, fileName: string | undefined) => {
    if (pstring.isNotBlank(fileName) && fileName) {
      if (!isValidFileName(fileName)) {
        toast.warn('올바른 파일이름을 입력해주세요');
        return;
      }
      doRename(fileId, fileName!);
    } else {
      setEditingFile(undefined);
    }
  };

  // alert 띄우고 다이얼로그 닫기
  const alertAndClose = useCallback(
    (msg: string) => {
      window.alert(msg);
      onClose?.();
    },
    [onClose],
  );

  // 게시물 삭제 -  삭제후 다이얼로그를 닫는다
  const doDelete = useCallback(
    async (pdsId: number) => {
      setLoading(true);
      try {
        await api.pds.delete({ pdsId });
        toast.success('삭제되었습니다', {
          autoClose: 1500,
        });
        return true;
      } catch (err) {
        if (matchError(err, 'E1_NOT_ARTICLE_OWNER')) {
          alertAndClose('작성자가 아닙니다');
          return;
        }
        if (matchError(err, 'E1_NO_SUCH_ARTICLE')) {
          alertAndClose(
            '해당 게시물이 존재하지 않습니다\n삭제되었을 수 있습니다\n다시 시도해주세요',
          );
          return;
        }
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [alertAndClose, api],
  );

  const _getUrlLink = () => {
    return routerFullUrlOf(`/pds/list?pdsId=${pdsId}`);
  };

  const handleClickEdit = () => {
    // routerPush(`/pds/edit/${pdsId}`)
    sceneManager.replaceScene('/pds/edit', { pdsId });
    onClose();
  };

  const handleClickDelete = () => {
    if (!confirm('삭제하시겠습니까?')) {
      return;
    }

    doDelete(pdsId).then((success) => {
      if (success) {
        onDeleted?.(pdsId);
        onClose();
      }
    });
  };

  const { title, substance, attachFiles = [] } = pds ?? {};
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
      className="PdsViewDialog-root"
      sx={rootSx}
      disableEscapeKeyDown={!!editingFile}
      fullWidth
      maxWidth={wide ? 'md' : 'sm'}
      aria-labelledby="pds-view-title"
      aria-describedby="pds-view-description"
    >
      <CustomDialogTitle onClose={onClose} style={{ paddingLeft: smOrDown ? 24 : 8 }}>
        <Stack direction="row" alignItems="center">
          <MdOrUp>
            {wide ? (
              <IconButton onClick={() => setWide(false)}>
                <FullscreenExitIcon />
              </IconButton>
            ) : (
              <IconButton onClick={() => setWide(true)}>
                <FullscreenIcon />
              </IconButton>
            )}
          </MdOrUp>
          <Typography variant="h5">자료실</Typography>
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers>
        <Box className="PdsViewDialog-dialogContent">
          <Box className="PdsViewDialog-title">{title}</Box>
          {substance && (
            <Box
              className="PdsViewDialog-substance lightbox-parent"
              dangerouslySetInnerHTML={{ __html: sanitize(substance) }}
            />
          )}

          {attachFiles.length > 0 && (
            <Box className="PdsViewDialog-attachFiles">
              <Box className="PdsViewDialog-attachFilesTitle">첨부 파일</Box>
              <PdsAttachFileList
                attachFiles={attachFiles}
                editingFileId={editingFile?.fileId}
                onClickRename={handleClickRename}
                onRenameFinished={handleRenameFinished}
              />
            </Box>
          )}
        </Box>

        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 30 }}>
            <LinearProgress color="secondary" />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1}>
          <BbsButton onClick={handleClickDelete} text="삭제" color="secondary" />
          <BbsClipboardButton textProviderFunc={_getUrlLink} />
          <BbsButton onClick={handleClickEdit} variant="outlined" size="small" text="수정" />
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
