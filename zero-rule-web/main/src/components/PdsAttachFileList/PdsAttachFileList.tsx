/* eslint-disable @next/next/no-img-element */
import { isEnterKeyEvent, isEscapeKeyEvent, isImageFile } from '@local/ui';
import { pstring } from '@cp949/pjs';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import { Box, ButtonBase, IconButton, InputBase, Tooltip, Typography } from '@mui/material';
import fileIcon from '@public/images/bbs/ic_file.png';
import type { UploadedFile } from '@local/domain';
import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ClipboardButton from '../ClipboardButton';
import { rootSx } from './style';

type Props = {
  onImageViewerOpened?: (opened: boolean) => void;
  attachFiles?: UploadedFile[];
  onClickRename: (file: UploadedFile) => void;
  editingFileId?: string;
  onRenameFinished: (fileId: string, fileName: string | undefined) => void;
};

export default function PdsAttachFileList(props: Props) {
  const rootRef = useRef<HTMLDivElement>();
  const { editingFileId, attachFiles = [], onRenameFinished, onClickRename } = props;
  const [editingText, setEditingText] = useState<string>();
  const onRenameFinishedFn = useRef<Props['onRenameFinished']>();
  onRenameFinishedFn.current = onRenameFinished;

  useEffect(() => {
    setEditingText(undefined);
  }, [editingFileId]);

  const _handleClickAway = () => {
    if (editingFileId) {
      onRenameFinishedFn.current?.(editingFileId, undefined);

      if (pstring.isNotBlank(editingText)) {
        onRenameFinishedFn.current?.(editingFileId, editingText ?? '');
      } else {
        onRenameFinishedFn.current?.(editingFileId, undefined);
      }
    }
  };

  const _handleFinishEditing = (text: string) => {
    if (editingFileId) {
      onRenameFinishedFn.current?.(editingFileId, text ?? '');
    }
  };

  const _handleCancel = () => {
    if (editingFileId) {
      onRenameFinishedFn.current?.(editingFileId, undefined);
    }
  };

  return (
    <>
      <Box className="PdsAttachFileList-root" sx={rootSx} ref={rootRef}>
        {attachFiles.map((file, idx) => {
          const { fileId, fileName, downloadUrl, fileSize } = file;
          const isImg = isImageFile(fileName);
          return (
            <Box className="PdsAttachFileList-fileContainer" key={fileId}>
              <p>{idx + 1}</p>

              <Box className="PdsAttachFileList-fileImage">
                {isImg && (
                  <ButtonBase className="PdsAttachFileList-imageButton">
                    <img
                      src={downloadUrl}
                      className={clsx('lightbox', 'PdsAttachFileList-image')}
                      alt=""
                    />
                  </ButtonBase>
                )}
                {!isImg && <Image src={fileIcon} alt="" className="PdsAttachFileList-image" />}
              </Box>

              <Box ml={2} flex="1" width="100%">
                {editingFileId !== fileId && (
                  <>
                    <Box
                      component="a"
                      sx={{ textDecoration: 'none' }}
                      href={downloadUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="PdsAttachFileList-fileName"
                    >
                      <span>{fileName}</span>
                    </Box>
                    <Typography variant="caption" style={{ display: 'block' }}>
                      {pstring.formatByteCount(fileSize)}
                    </Typography>
                  </>
                )}
                {editingFileId === fileId && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InputBase
                        type="text"
                        value={editingText ?? fileName}
                        autoFocus
                        className="EditableLabel-input"
                        sx={{ flex: 1, border: '1px solid #ddd', pl: 1, width: '100%' }}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (isEnterKeyEvent(e)) {
                            e.preventDefault();
                            if (pstring.isNotBlank(editingText) && editingText) {
                              _handleFinishEditing(editingText);
                            } else {
                              _handleCancel();
                            }
                          } else if (isEscapeKeyEvent(e)) {
                            // esc 키를 누르면 취소
                            e.preventDefault();
                            _handleCancel();
                          }
                        }}
                      />
                      <Tooltip title="취소">
                        <IconButton size="small" onClick={() => onClickRename(file)}>
                          <CancelIcon sx={{ fontSize: '1rem', color: '#888' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ color: 'secondary.main', ml: 0.5, fontSize: '0.75rem' }}>
                      입력한 후에 엔터키를 누르세요.
                    </Box>
                  </Box>
                )}
              </Box>
              {!editingFileId && (
                <>
                  <Tooltip title="이름 변경">
                    <IconButton size="small" onClick={() => onClickRename(file)}>
                      <EditIcon sx={{ fontSize: '1rem', color: '#888' }} />
                    </IconButton>
                  </Tooltip>

                  <ClipboardButton sx={{ color: '#888' }} textProviderFunc={() => downloadUrl} />
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </>
  );
}
