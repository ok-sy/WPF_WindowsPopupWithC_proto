import type { CLErrorMeta } from '@local/domain';
import { toggleTableRowSelectionByEventTarget } from '@local/ui';
import { TableCell, TableRow } from '@mui/material';
import React from 'react';

type Props = {
  seq: number;
  err: CLErrorMeta;
};

export default function ErrorCodeRow(props: Props) {
  const { seq } = props;
  const { errorName, errorKey, errorMessage } = props.err;

  const handleClickRow = (event: React.MouseEvent) => {
    toggleTableRowSelectionByEventTarget(event.target as HTMLElement);
  };

  return (
    <TableRow className="ErrorCodeRow-root" onClick={handleClickRow}>
      <TableCell>{seq}</TableCell>
      <TableCell>{errorName}</TableCell>
      <TableCell>{errorKey}</TableCell>
      <TableCell>{errorMessage}</TableCell>
    </TableRow>
  );
}
