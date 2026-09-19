import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import clsx from 'clsx';
import { useCallback } from 'react';
import type { DropEvent } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { rootSx } from './style';

type Props = {
  sx?: SxProps;
  onAcceptedFiles: (files: File[]) => void;
  disabled: boolean;
  imageUpload?: boolean;
  acceptedExtention?: string[];
};
const MAX_FILE_SIZE = 10000000; // 최대 10MB
const ACCEPT = ['.xls', '.xlsx'];
const imageACCEPT = ['.png', '.jpeg', '.jpg', '.jfif', '.svg'];

export default function FileDropzone(props: Props) {
  const { onAcceptedFiles, disabled, imageUpload, acceptedExtention, sx } = props;

  const onDropAccepted = useCallback(
    (acceptedFiles: File[], _event: DropEvent) => {
      onAcceptedFiles(acceptedFiles);
    },
    [onAcceptedFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    maxFiles: 20,
    maxSize: MAX_FILE_SIZE,
    minSize: 1,
    disabled,
  });

  return (
    <Box className="FileDropzone-root" sx={rootSx}>
      <Box
        {...getRootProps()}
        className={clsx({
          ['FileDropzone-dropzone']: true,
          ['FileDropzone-dropping']: isDragActive,
        })}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>여기에 파일을 놓으세요</p>
        ) : (
          <Box className="FileDropzone-field">
            <Box>파일 첨부</Box>
            <Box>파일 드래그, 클릭</Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
