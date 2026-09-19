import LogLevelChip from '@/components/LogLevelChip';
import LogMsg from '@/components/LogMsg';
import type { LogViewDialogProps } from '@/dialogs/LogViewDialog';
import LogViewDialog from '@/dialogs/LogViewDialog';
import type { AppLog } from '@local/domain';
import { pdate } from '@local/util';
import { toggleTableRowSelectionByEventTarget } from '@local/ui';
import { Box, TableCell, TableRow } from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
  seq: number;
  appLog: AppLog;
  className?: string;
};

type DialogId = 'LogViewDialog';

export default function AppLogTableRow(props: Props) {
  const { appLog, seq, className } = props;
  const [dialogId, setDialogId] = useState<DialogId>();
  const [logViewDialogProps, setLogViewDialogProps] = useState<LogViewDialogProps>();
  const {
    logLevel,
    title,
    msg,
    operatorName,
    userName,
    logTag,
    nodeId,
    hostIp,
    clientIp,
    browserName,
    createdAt,
  } = appLog;

  const createDate = pdate.parser.epochSeconds(createdAt);

  let textColor: string | undefined;
  if (logLevel === 'E') {
    textColor = 'success.dark';
  } else if (logLevel === 'W') {
    textColor = 'error.main';
  } else if (logLevel === 'I') {
    textColor = '#5048e5';
  }

  const openLogView = (appLog: AppLog) => {
    const { title, msg, createdAt } = appLog;
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
    openLogView(appLog);
  };

  return (
    <>
      <TableRow className={clsx('AppLogTableRow-root', className)} onClick={handleClickRow}>
        <TableCell component="td" scope="row" width={50}>
          {seq}
        </TableCell>
        <TableCell component="td" scope="row" width={150}>
          <LogLevelChip logLevel={logLevel} />
        </TableCell>
        <TableCell>
          <Box sx={{ maxWidth: 500, minWidth: 200 }}>
            <LogMsg msg={title} logLevel={logLevel} date={createDate} />
            {msg && (
              <Box
                sx={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-all',
                  ml: 1,
                  mt: 1,
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: 40,
                }}
              >
                {msg}
              </Box>
            )}
          </Box>
        </TableCell>
        <TableCell>{operatorName ?? '-'}</TableCell>
        <TableCell>{userName ?? '-'}</TableCell>
        <TableCell sx={{ color: textColor }}>{logTag ?? '-'}</TableCell>
        <TableCell>
          {clientIp}
          <br />
          {browserName}
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
