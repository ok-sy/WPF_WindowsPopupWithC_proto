import LogLevelChip from '@/components/LogLevelChip';
import LogMsg from '@/components/LogMsg';
import type { LogViewDialogProps } from '@/dialogs/LogViewDialog';
import LogViewDialog from '@/dialogs/LogViewDialog';
import type { CLJobLog } from '@local/domain';
import { pdate } from '@local/util';
import { toggleTableRowSelectionByEventTarget } from '@local/ui';
import { TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';
import TimeAgo from 'timeago-react';

type Props = {
  seq: number;
  jobLog: CLJobLog;
  onClick: () => void;
  className?: string;
};
type DialogId = 'LogViewDialog';

export default function JobLogTableRow(props: Props) {
  const { seq, jobLog, onClick, className } = props;
  const { jobId, logLevel, msg = '', nodeId, createdAt } = jobLog;
  const createTime = pdate.parser.epochSeconds(createdAt);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [logViewDialogProps, setLogViewDialogProps] = useState<LogViewDialogProps>();

  const openLogView = (jobLog: CLJobLog) => {
    const { msg, createdAt } = jobLog;

    setDialogId('LogViewDialog');
    setLogViewDialogProps({
      open: true,
      onClose: handleCloseDialog,
      msg: msg,
      logTimestamp: createdAt,
    });
  };
  const handleCloseDialog = () => {
    setDialogId(undefined);
    setLogViewDialogProps(undefined);
  };
  const handleClickRow = (event: React.MouseEvent) => {
    toggleTableRowSelectionByEventTarget(event.target as HTMLElement);
    openLogView(jobLog);
  };

  return (
    <>
      <TableRow className={clsx('JobLogTableRow-root', className)} onClick={handleClickRow}>
        <TableCell>{seq}</TableCell>
        <TableCell>
          <LogLevelChip logLevel={logLevel} />
        </TableCell>
        <TableCell>
          <LogMsg msg={msg} logLevel={logLevel} />
        </TableCell>
        <TableCell>
          {createTime && (
            <>
              <Typography>
                <TimeAgo datetime={createTime} locale="ko" />
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                {pdate.formatter.format(createTime, 'MM/dd HH시 mm분 ss초')}
              </Typography>
            </>
          )}
        </TableCell>
        <TableCell>
          {jobId}
          <Typography variant="body2" sx={{ color: '#888' }}>
            {nodeId}
          </Typography>
        </TableCell>
      </TableRow>
      {dialogId === 'LogViewDialog' && logViewDialogProps && (
        <LogViewDialog {...logViewDialogProps} />
      )}
    </>
  );
}
