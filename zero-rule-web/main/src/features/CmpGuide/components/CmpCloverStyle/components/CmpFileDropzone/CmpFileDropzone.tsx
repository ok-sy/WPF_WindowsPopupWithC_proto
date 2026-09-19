import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { rootSx } from './style';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CloseIcon from '@mui/icons-material/Close';
import FileDropzone from '@/components/FileDropzone';
/**
 * 파일업로드 드래그앤 드롭
 * todo. 다건도 가능하게 변경
 * @returns
 */

interface AcceptedFile {
  fileName: string;
  file: File;
}
export default function CmpFileDropzone() {
  const [acceptFiles, setAcceptFiles] = useState<AcceptedFile[]>([]);

  /*
   *버튼 삭제
   */
  const handleDelete = (idx: number) => {
    if (!acceptFiles) return;
    const copyArr = [...acceptFiles];
    copyArr.splice(idx, 1);
    setAcceptFiles(copyArr);
  };

  /*
   *Drag & Drop 시
   */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const fileList: AcceptedFile[] = acceptedFiles.map((el) => ({ fileName: el.name, file: el }));
      setAcceptFiles(fileList);
    },
    [setAcceptFiles],
  );
  return (
    <Box sx={rootSx} className="CmpFileDropzone-root">
      <Box className="CmpFileDropzone-container">
        {acceptFiles.length !== 0 ? (
          <Box className="CmpFileDropzone-fileBox">
            {acceptFiles.map((el, idx) => (
              <Stack
                key={el.fileName}
                alignItems="center"
                justifyContent="space-between"
                direction="row"
              >
                <Stack sx={{ overflow: 'hidden' }} direction="row" spacing={1}>
                  <Typography>{idx + 1}.</Typography>
                  <Typography
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {el.fileName}
                  </Typography>
                </Stack>
                <IconButton onClick={() => handleDelete(idx)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Box>
        ) : (
          <FileDropzone onAcceptedFiles={onDrop} disabled={false} />
        )}
      </Box>
    </Box>
  );
}
