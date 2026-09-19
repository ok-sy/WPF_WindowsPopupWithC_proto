import BbsAttachFileList from '@/components/BbsAttachFileList';
import BbsCKEditor from '@/components/BbsCKEditor';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { pstring } from '@cp949/pjs';
import type { UploadedFile } from '@local/domain';
import { isEnterOrTabKeyEvent, useElementOffset } from '@local/ui';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SaveIcon from '@mui/icons-material/Save';
import { Box, Button, CircularProgress, Stack, TextField, Typography, Grid2 } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Scrollbars from 'react-custom-scrollbars-2';
import { toast } from 'react-toastify';
import { rootSx } from './style';
import errorCustomHandle from '@/lib/error-custom-handle';

type Props = {
  pdsId?: number;
};

type InputData = {
  title: string;
  substance: string;
};

export default function PdsEdit(props: Props) {
  const api = useApi();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorBoxRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>();
  const { sceneManager } = useMainLayoutContext();
  const [uploading, setUploading] = useState(false);
  const { pdsId } = props;
  const [loading, setLoading] = useState(false);
  const [inputData, setInputData] = useState<Partial<InputData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachFiles, setAttachFiles] = useState<UploadedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const { y: editorTopOffset } = useElementOffset(editorBoxRef.current, []);

  const updateInput = useCallback((partialData: Partial<InputData>) => {
    setInputData((p) => ({ ...p, ...partialData }));
  }, []);

  // 첨부 파일 업로드
  const uploadAttachFile = useCallback(
    async (file: File) => {
      const ctx: ApiRequestContext = {
        canceled: false,
        config: {
          timeout: 0, // 0 is no timeout
        },
      };
      setUploading(true);
      try {
        const { body } = await api.pds.uploadTempFile({
          ctx,
          file,
          fileName: file.name,
        });
        const { file: attachedFile } = body;
        setAttachFiles((prev) => [...prev, attachedFile]);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setUploading(false);
      }
    },
    [api],
  );

  // 첨부파일 클릭
  const handleChangeFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target?.files ?? [];
    if (files.length === 0) return;
    uploadAttachFile(files[0]);
  };

  // 첨부파일 삭제 클릭
  const handleClickFileDelete = (fileId: string) => {
    setAttachFiles((prev) => prev.filter((it) => it.fileId !== fileId));
  };

  // 저장하기 - 서버 전송
  const doSave = useCallback(
    async (params: { pdsId?: number; title: string; substance: string; fileIds: string[] }) => {
      const { title, substance, fileIds } = params;
      let pdsId = params.pdsId;
      setSaving(true);
      try {
        if (pdsId) {
          await api.pds.update({ pdsId, title, substance, fileIds });
        } else {
          const { body } = await api.pds.create({ title, substance, fileIds });
          const { pds } = body;
          pdsId = pds.pdsId;
        }
        toast.success('저장되었습니다', {
          autoClose: 1500,
        });
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setSaving(false);
      }
      return false;
    },
    [api],
  );

  const handleClickSave = () => {
    const title = pstring.trim(inputData.title);
    const substance = pstring.trim(inputData.substance);
    if (title.length === 0) {
      toast.warn('제목을 입력해주세요');
      return;
    }
    const fileIds = attachFiles.map((it) => it.fileId);
    doSave({ pdsId, title, substance, fileIds }).then((success) => {
      if (success) {
        setTimeout(() => {
          // routerPush(`/pds/list?pdsId=${pdsId}`)
          sceneManager.replaceScene(`/pds/list`, { pdsId });
        }, 700);
      }
    });
  };

  const loadPds = useCallback(
    async (ctx: ApiRequestContext, pdsId: number) => {
      setLoading(true);
      try {
        const { body } = await api.pds.info({ ctx, pdsId });
        const { pds } = body;
        setInputData({
          title: pds.title,
          substance: pds.substance,
        });
        setAttachFiles(pds.attachFiles ?? []);
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
    if (!pdsId) return;
    const ctx = { canceled: false } as ApiRequestContext;

    loadPds(ctx, pdsId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [pdsId, loadPds]);

  return (
    <Box className="PdsEdit-root" ref={rootRef} sx={rootSx}>
      <Box sx={{ mb: 1 }}>
        <Stack direction="row" justifyContent="space-between">
          <Button
            onClick={() => {
              sceneManager.replaceScene('/pds/list');
            }}
          >
            목록
          </Button>
        </Stack>
      </Box>

      <Box sx={{ background: '#fff', p: 2 }}>
        <Grid2 container columnSpacing={2}>
          <Grid2 size={{ xs: 12 }}>
            <Box className="PdsEdit-formControl">
              <TextField
                required
                fullWidth
                label="제목"
                size="medium"
                margin="dense"
                disabled={saving}
                className="PdsEdit-title"
                variant="outlined"
                value={inputData.title ?? ''}
                onChange={(e) => updateInput({ title: e.target.value })}
                onKeyDown={(e) => {
                  if (isEnterOrTabKeyEvent(e)) {
                    e.preventDefault();
                    if (pstring.isBlank(inputData.title)) {
                      return;
                    }
                    const editor = editorRef.current;
                    if (editor && editor.elementRef?.nativeElement) {
                      editor.elementRef?.nativeElement.focus();
                    }
                  }
                }}
              />
            </Box>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box
              className="PdsEdit-editorBox"
              ref={editorBoxRef}
              sx={{
                height: `calc(100vh - ${editorTopOffset}px - 16px)`,
              }}
            >
              <BbsCKEditor
                content={inputData.substance}
                onContentChange={(content) => updateInput({ substance: content ?? '' })}
              />
            </Box>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Scrollbars
              style={{
                height: `calc(100vh - ${editorTopOffset}px - 16px)`,
              }}
            >
              <Box className="PdsEdit-attachFiles">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*"
                  // accept="image/png, image/jpeg"
                  style={{ display: 'none' }}
                  onChange={handleChangeFileInput}
                />
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleClickSave}
                  size="large"
                  variant="contained"
                >
                  저장
                </Button>
                {attachFiles.length > 0 && (
                  <Box sx={{ backgroundColor: '#fff', pl: 2, borderRadius: 2 }}>
                    <Typography variant="body2" className="PdsEdit-attachFilesTitle">
                      ※ 파일 첨부
                    </Typography>
                    <Box sx={{ height: '100%' }}>
                      <BbsAttachFileList
                        attachFiles={attachFiles}
                        onDeleteClick={handleClickFileDelete}
                      />
                    </Box>
                  </Box>
                )}

                <Box className="PdsEdit-attachFileBtn">
                  {!uploading && (
                    <Button
                      variant="outlined"
                      color="primary"
                      disabled={uploading || saving}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      startIcon={<AttachFileIcon />}
                    >
                      파일 첨부
                    </Button>
                  )}
                  {uploading && <CircularProgress size="1.5rem" />}
                </Box>
              </Box>
            </Scrollbars>
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
}
