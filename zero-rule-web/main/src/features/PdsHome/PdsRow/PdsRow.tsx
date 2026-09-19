import type { PdsSimple } from '@local/domain';
import { formatEpochSeconds } from '@local/ui';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Box, Stack, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import TimeAgo from 'timeago-react';
import { rootSx } from './style';

type Props = {
  seq: number;
  pds: PdsSimple;
  className?: string;
  onClickRow: (pds: PdsSimple) => void;
};

export default function PdsRow(props: Props) {
  const { seq, className, pds, onClickRow } = props;

  const { title, attachFileCount, changedAt, createdAt } = pds;
  const [changeDateStr, changeDate] = formatEpochSeconds(changedAt);
  const [createDateStr, createDate] = formatEpochSeconds(createdAt);

  return (
    <TableRow
      className={clsx('PdsRow-root', className)}
      sx={rootSx}
      onClick={() => onClickRow(pds)}
    >
      <TableCell>{seq}</TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center">
          <Typography className="PdsRow-title" sx={{ color: '#000' }}>
            {title}
          </Typography>
          {attachFileCount > 0 && (
            <>
              <AttachFileIcon
                sx={{
                  ml: 2,
                  fontSize: '1rem',
                  color: 'primary.main',
                }}
              />
              <Typography variant="caption" sx={{ color: '#888' }}>
                {attachFileCount}
              </Typography>
            </>
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Box>
          {changeDateStr && (
            <Typography variant="body2">
              <TimeAgo datetime={changeDate} locale="ko" />
            </Typography>
          )}
          <Typography variant="caption">{changeDateStr}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box className="PdsRow-noWrap">
          {createDate && (
            <Typography variant="body2">
              <TimeAgo datetime={createDate} locale="ko" />
            </Typography>
          )}
          <Typography variant="caption">{createDateStr}</Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
