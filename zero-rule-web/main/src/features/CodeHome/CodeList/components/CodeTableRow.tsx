import type { CLCode } from '@local/domain';
import { formatEpochSeconds } from '@local/ui';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import TimeAgo from 'timeago-react';

type Props = {
  seq: number;
  code: CLCode;
  onClickEditBtn: (codeType: string, codeTypeNm: string) => void;
  rowSpan?: number;
  firstRow: boolean;
};

export default function CodeTableRow(props: Props) {
  const { firstRow, rowSpan = 1, seq, onClickEditBtn } = props;
  const { codeType, code, codeTypeNm, codeNm, dtlExpl, chngDttm } = props.code;
  const [changeDateStr, changeDate] = formatEpochSeconds(chngDttm);

  return (
    <TableRow className="CodeTableRow-root" hover>
      <TableCell>{seq}</TableCell>
      {firstRow && (
        <TableCell
          rowSpan={rowSpan}
          sx={{
            verticalAlign: rowSpan > 1 ? 'top' : undefined,
            pr: 0,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row">
              <Typography>{codeTypeNm}</Typography>
              <Typography sx={{ color: '#888' }}>( {codeType} )</Typography>
            </Stack>
            <IconButton onClick={(e) => onClickEditBtn(codeType, codeTypeNm)}>
              <EditOutlinedIcon />
            </IconButton>
          </Stack>
        </TableCell>
      )}

      <TableCell>
        <Stack direction="row" spacing={2}>
          <Typography
            sx={{ flexShrink: 0, color: 'primary.main', fontWeight: 700 }}
            variant="subtitle1"
          >
            {code}
          </Typography>
          <Typography>{codeNm}</Typography>
        </Stack>
      </TableCell>
      <TableCell>{dtlExpl ?? '-'}</TableCell>

      <TableCell>
        {changeDate && (
          <Typography variant="caption">
            <TimeAgo datetime={changeDate} locale="ko" />
          </Typography>
        )}

        <div>{changeDateStr}</div>
      </TableCell>
    </TableRow>
  );
}
