import { useApi } from '@/provider';
import type { CLCodeType } from '@local/domain';
import { formatEpochSeconds } from '@local/ui';
import { alpha, Box, TableCell, TableRow, Typography } from '@mui/material';
import TimeAgo from 'timeago-react';

type Props = {
  seq: number;
  codeType: CLCodeType;
  onClickRow: (codeTypeData: CLCodeType) => void;
};

export default function CodeTypeTableRow(props: Props) {
  const { seq, onClickRow } = props;
  const api = useApi();
  const { codeType, codeTypeNm, dtlExpl, regrId, chgrId, chngDttm, regDttm } = props.codeType;
  const [createDateStr, createDate] = formatEpochSeconds(regDttm);
  const [changeDateStr, changeDate] = formatEpochSeconds(chngDttm);

  return (
    <TableRow
      sx={{
        '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) },
        cursor: 'pointer',
      }}
      className="CodeTypeTableRow-root"
      onClick={(e) => onClickRow(props.codeType)}
    >
      <TableCell>{seq}</TableCell>
      <TableCell>
        <Typography variant="subtitle1">{codeType}</Typography>
      </TableCell>
      <TableCell>{codeTypeNm}</TableCell>
      <TableCell>{dtlExpl ?? '-'}</TableCell>
      <TableCell>
        <Box mb={1}>
          <Typography variant="caption">
            <TimeAgo datetime={changeDate} locale="ko" />
          </Typography>
          <div>{changeDateStr}</div>
        </Box>
      </TableCell>
      <TableCell>
        <Box mb={1}>
          <Typography variant="caption">
            <TimeAgo datetime={createDate} locale="ko" />
          </Typography>
          <div>{createDateStr}</div>
        </Box>
      </TableCell>
    </TableRow>
  );
}
