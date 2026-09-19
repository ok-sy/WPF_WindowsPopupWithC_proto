import JobStatusLabel from '@/components/JobStatusLabel';
import type { LogViewDialogProps } from '@/dialogs/LogViewDialog';
import LogViewDialog from '@/dialogs/LogViewDialog';
import { pstring } from '@cp949/pjs';
import type { CLJob } from '@local/domain';
import { pdate } from '@local/util';
import { toggleTableRowSelectionByEventTarget } from '@local/ui';
import { Box, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';
import TimeAgo from 'timeago-react';

const DateTypography = (props: { date: Date }) => {
  const { date } = props;
  const fmt = 'MM/dd HH시 mm분 ss초';

  return (
    <Box>
      <Typography variant="caption" style={{ whiteSpace: 'nowrap' }}>
        <TimeAgo datetime={date} locale="ko" />
      </Typography>
      <Typography variant="body2" style={{ whiteSpace: 'nowrap' }}>
        {pdate.formatter.format(date, fmt)}
      </Typography>
    </Box>
  );
};

type Props = {
  seq: number;
  job: CLJob;
  onClick?: () => void;
  className?: string;
};

type DialogId = 'LogViewDialog';

export default function JobTableRow(props: Props) {
  const { seq, job, onClick, className } = props;
  const { jobTitle, jobDesc, nodeId, jobStatus, jobStartedAt, jobFinishedAt, enabled } = job;
  const [dialogId, setDialogId] = useState<DialogId>();
  const [logViewDialogProps, setLogViewDialogProps] = useState<LogViewDialogProps>();

  const jobStartDate = pdate.parser.epochSeconds(jobStartedAt);
  const jobFinishDate = pdate.parser.epochSeconds(jobFinishedAt);

  let jobRunningDuration: number | undefined;
  if (jobStartDate && jobFinishDate) {
    jobRunningDuration = (jobFinishDate.getTime() - jobStartDate.getTime()) / 1000;
  }

  const openLogView = (job: CLJob) => {
    const { jobTitle, jobDesc, jobStartedAt } = job;

    setDialogId('LogViewDialog');
    setLogViewDialogProps({
      open: true,
      onClose: handleCloseDialog,
      title: jobTitle,
      msg: jobDesc,
      logTimestamp: jobStartedAt,
    });
  };
  const handleCloseDialog = () => {
    setDialogId(undefined);
    setLogViewDialogProps(undefined);
  };
  const handleClickRow = (event: React.MouseEvent) => {
    toggleTableRowSelectionByEventTarget(event.target as HTMLElement);
    openLogView(job);
  };

  return (
    <>
      <TableRow className={clsx('JobTableRow-root', className)} onClick={handleClickRow}>
        <TableCell>{seq}</TableCell>
        <TableCell>
          <Typography
            style={{
              whiteSpace: 'nowrap',
              textDecoration: enabled ? 'none' : 'line-through',
            }}
          >
            {jobTitle}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography
            style={{
              whiteSpace: 'nowrap',
              textDecoration: enabled ? 'none' : 'line-through',
            }}
          >
            {jobDesc}
          </Typography>
        </TableCell>
        <TableCell>
          {!enabled && (
            <Box display="flex" justifyContent="flex-start" alignItems="center">
              비활성
            </Box>
          )}
          {enabled && <JobStatusLabel status={jobStatus} />}
        </TableCell>
        <TableCell>
          {enabled && pstring.isNotBlank(nodeId) && (
            <Typography variant="body2">{nodeId}</Typography>
          )}
          {enabled && jobRunningDuration !== undefined && <Box>{jobRunningDuration} 초</Box>}
        </TableCell>
        <TableCell>{enabled && jobStartDate && <DateTypography date={jobStartDate} />}</TableCell>
        <TableCell>{enabled && jobFinishDate && <DateTypography date={jobFinishDate} />}</TableCell>
      </TableRow>
      {dialogId === 'LogViewDialog' && logViewDialogProps && (
        <LogViewDialog {...logViewDialogProps} />
      )}
    </>
  );
}
