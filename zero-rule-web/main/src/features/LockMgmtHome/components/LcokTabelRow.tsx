import type { Lock } from '@local/domain';
import { CLErrorMeta } from '@local/domain';
import { formatEpochSeconds, toggleTableRowSelectionByEventTarget } from '@local/ui';
import { TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';
import CLCodeListLabel from '@/components/CLCodeListLabel';
import TimeAgo from 'timeago-react';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox/CLStyledTableCheckBox';

type Props = {
  seq: number;
  data: Lock;
  delList: string[];
  onDel: (key: string, check: boolean) => void;
};

export default function LcokTabelRow(props: Props) {
  const { seq, data, delList, onDel } = props;
  const { lockcode, lockdatetime, lockkey, locknote, locktypecode, userid, lgonId, userNm } = data;

  const [changeDateStr, changeDate] = formatEpochSeconds(lockdatetime);

  const handleClickRow = (event: React.MouseEvent) => {
    toggleTableRowSelectionByEventTarget(event.target as HTMLElement);
  };

  return (
    <TableRow className="LcokTabelRow-root" onClick={handleClickRow}>
      <TableCell sx={{ pl: 0.5, pr: 0 }}>
        <CLStyledTableCheckBox
          checked={delList.includes(lockkey)}
          onChange={(e, check) => {
            onDel(lockkey, check);
          }}
          size="small"
        />
      </TableCell>
      <TableCell>{changeDateStr}</TableCell>
      <TableCell>{lgonId}</TableCell>
      <TableCell>{userNm}</TableCell>
      <TableCell>
        <CLCodeListLabel code={lockcode} codeType="100" />
      </TableCell>
      <TableCell>
        <CLCodeListLabel code={locktypecode} codeType="101" />
      </TableCell>
      <TableCell>{locknote}</TableCell>
      <TableCell
        sx={{
          maxWidth: 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {lockkey}
      </TableCell>
    </TableRow>
  );
}
