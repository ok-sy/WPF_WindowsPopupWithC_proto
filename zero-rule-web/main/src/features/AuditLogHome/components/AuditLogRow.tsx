import LogLevelChip from '@/components/LogLevelChip';
import type { LogViewDialogProps } from '@/dialogs/LogViewDialog';
import LogViewDialog from '@/dialogs/LogViewDialog';
import type { AuditLog } from '@local/domain';
import { CLAuditLogKind } from '@local/domain';
import { formatEpochSeconds, toggleTableRowSelectionByEventTarget } from '@local/ui';
import { Box, Stack, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';
import TimeAgo from 'timeago-react';

const getBrowserNameByLogText = (text: string) => {
  if (text.startsWith('Edge') || text.startsWith('edge')) return 'edge';
  if (text.startsWith('Chrome') || text.startsWith('chrome')) return 'chrome';
  return 'unknown';
};

type Props = {
  seq: number;
  auditLog: AuditLog;
  className?: string;
};
type DialogId = 'LogViewDialog';

export default function AuditLogRow(props: Props) {
  const { seq, auditLog, className } = props;
  const [dialogId, setDialogId] = useState<DialogId>();
  const [logViewDialogProps, setLogViewDialogProps] = useState<LogViewDialogProps>();
  const {
    logLevel,
    logKind,
    title,
    msg,
    jobId,
    pageId,
    operatorName,
    logTag,
    nodeId,
    hostIp,
    clientIp,
    browserName,
    createdAt,
  } = auditLog;
  const [createDateStr, createDate] = formatEpochSeconds(createdAt);
  const browserNameCn = browserName ? getBrowserNameByLogText(browserName) : undefined;

  const openLogView = (auditLog: AuditLog) => {
    const { title, msg, createdAt } = auditLog;
    setDialogId('LogViewDialog');
    setLogViewDialogProps({
      open: true,
      onClose: handleCloseDialog,
      title,
      msg,
      logTimestamp: createdAt,
    });
  };

  const handleCloseDialog = () => {
    setDialogId(undefined);
    setLogViewDialogProps(undefined);
  };

  const handleClickRow = (event: React.MouseEvent) => {
    toggleTableRowSelectionByEventTarget(event.target as HTMLElement);
    openLogView(auditLog);
  };

  return (
    <>
      <TableRow
        sx={{
          '& .AuditLogRow-logContent': {
            maxWidth: 500,
          },
        }}
        className={clsx('AuditLogRow-root', className)}
        onClick={handleClickRow}
      >
        <TableCell>{seq}</TableCell>
        <TableCell>
          <LogLevelChip logLevel={logLevel} />
        </TableCell>
        <TableCell>{CLAuditLogKind[logKind]}</TableCell>
        <TableCell>{operatorName ?? '-'}</TableCell>
        <TableCell>
          {createDate && (
            <Box mb={1}>
              <Typography variant="caption">
                <TimeAgo datetime={createDate} locale="ko" />
              </Typography>
            </Box>
          )}
          {createDateStr && <div>{createDateStr}</div>}
        </TableCell>
        <TableCell>
          <Typography className="AuditLogRow-logContent">
            {title}
            {msg && (
              <>
                <br />
                {msg}
              </>
            )}
          </Typography>
        </TableCell>
        <TableCell>{jobId ?? '-'}</TableCell>
        <TableCell>{pageId ?? '-'}</TableCell>
        <TableCell>{logTag ?? '-'}</TableCell>
        <TableCell>
          <Box sx={{ mb: 1 }}>{clientIp}</Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {browserNameCn && (
              <Box
                component="img"
                src={`/images/log/${browserNameCn}.png`}
                alt=""
                sx={{ width: 18, height: 18 }}
              />
            )}
            <Box>{browserName}</Box>
          </Stack>
        </TableCell>
        <TableCell>
          {nodeId}
          <br />
          {hostIp}
        </TableCell>
      </TableRow>
      {dialogId === 'LogViewDialog' && logViewDialogProps && (
        <LogViewDialog {...logViewDialogProps} />
      )}
    </>
  );
}
