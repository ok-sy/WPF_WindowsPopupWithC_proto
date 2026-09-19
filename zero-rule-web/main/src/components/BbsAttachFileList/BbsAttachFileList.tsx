/* eslint-disable @next/next/no-img-element */
import { routerUrlOf } from '@/lib/urls';
import { pstring } from '@cp949/pjs';
import type { UploadedFile } from '@local/domain';
import { isImageFile } from '@local/ui';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {
  Box,
  ButtonBase,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import clsx from 'clsx';
import { useRef } from 'react';
import urljoin from 'url-join';
import { rootSx } from './style';

type Props = {
  attachFiles?: UploadedFile[];
  onDeleteClick?: (fileId: string) => void;
};

export default function BbsAttachFileList(props: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { onDeleteClick, attachFiles = [] } = props;

  return (
    <TableContainer className="BbsAttachFileList-root" sx={rootSx} ref={rootRef}>
      <Table className="BbsAttachFileList-table">
        <TableBody>
          {attachFiles.map(({ fileId, fileName, downloadUrl, fileSize }, idx) => {
            const isImg = isImageFile(fileName);
            return (
              <TableRow key={fileId}>
                <TableCell align="center">{idx + 1}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Box className="BbsAttachFileList-fileImage">
                      {isImg && (
                        <ButtonBase className="BbsAttachFileList-imageButton">
                          <img
                            src={downloadUrl}
                            alt=""
                            className={clsx(
                              'BbsAttachFileList-imgLightbox',
                              'BbsAttachFileList-image',
                              'lightbox',
                            )}
                          />
                        </ButtonBase>
                      )}
                      {!isImg && (
                        <img
                          src={routerUrlOf('/images/img_file.png')}
                          alt=""
                          className="BbsAttachFileList-image"
                        />
                      )}
                    </Box>

                    <Box ml={2}>
                      <a
                        href={urljoin(downloadUrl, '?download=true')}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="BbsAttachFileList-fileName"
                      >
                        <span>{fileName}</span>
                      </a>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">{pstring.formatByteCount(fileSize)}</TableCell>
                {onDeleteClick && (
                  <TableCell align="center">
                    <IconButton onClick={() => onDeleteClick(fileId)} size="large">
                      <HighlightOffIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
