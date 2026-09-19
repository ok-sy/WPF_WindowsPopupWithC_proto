import type { CLLogLevelKey } from '@local/domain';
import { pdate } from '@local/util';
import { Box } from '@mui/material';
import TimeAgo from 'timeago-react';

type Props = {
  msg: string;
  date?: Date;
  logLevel: CLLogLevelKey;
};

export default function LogMsg({ msg, logLevel, date }: Props) {
  let textColor = '#222';
  let bgColor: string | undefined;

  if (logLevel === 'E') {
    bgColor = 'error.main';
    textColor = 'error.contrastText';
  } else if (logLevel === 'W') {
    textColor = 'warning.dark';
    bgColor = undefined;
  } else if (logLevel === 'I') {
    textColor = 'info.dark';
    bgColor = undefined;
  } else if (logLevel === 'D') {
    textColor = 'success.dark';
    bgColor = undefined;
  }

  return (
    <>
      {date && (
        <Box p={1} color="text.secondary" display="inline">
          <TimeAgo datetime={date} locale="ko" />
        </Box>
      )}
      {date && (
        <Box p={1} color="#666" display="inline">
          {pdate.formatter.format(date, 'MM/dd HH시 mm분 ss초')}
        </Box>
      )}
      <Box
        bgcolor={bgColor}
        color={textColor}
        p={1}
        fontSize=".85rem"
        fontWeight="500"
        whiteSpace="pre-line"
      >
        {msg}
      </Box>
    </>
  );
}
