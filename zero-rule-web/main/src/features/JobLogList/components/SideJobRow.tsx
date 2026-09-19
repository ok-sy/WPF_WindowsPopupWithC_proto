import JobStatusLabel from '@/components/JobStatusLabel';
import type { CLJob } from '@local/domain';
import { pdate } from '@local/util';
import { Box, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import TimeAgo from 'timeago-react';

type Props = {
  job: CLJob;
  className?: string;
  onSelected: (jobId: string) => void;
};

export default function SideJobRow(props: Props) {
  const { className, job, onSelected } = props;
  const lastJobTime = pdate.parser.epochSeconds(job.changedAt);
  const { jobId, jobTitle, jobDesc, jobStatus, enabled } = job;

  return (
    <TableRow onClick={() => onSelected(jobId)} className={clsx('SideJobRow-root', className)}>
      <TableCell sx={{ whiteSpace: 'normal', px: 1 }}>
        <Box sx={{ width: 150 }}>
          {job.enabled && (
            <Box display="flex" justifyContent="flex-start" alignItems="center">
              <JobStatusLabel status={jobStatus} hideLabel />
              {lastJobTime && (
                <Box>
                  <Typography variant="caption">
                    <TimeAgo datetime={lastJobTime} locale="ko" />
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          <Box>
            <Typography
              variant="body2"
              style={{ textDecoration: enabled ? 'none' : 'line-through' }}
            >
              {jobTitle}
            </Typography>
          </Box>
          <Box
            sx={{
              textDecoration: enabled ? 'none' : 'line-through',
              color: '#9ea5c0',
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
            }}
          >
            {jobDesc}
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
}
