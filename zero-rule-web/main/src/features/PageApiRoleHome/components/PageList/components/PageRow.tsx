import type { CLPage } from '@local/domain';
import { TableCell, TableRow } from '@mui/material';
import clsx from 'clsx';
import { useEffect } from 'react';

type Props = {
  seq: number;
  data: CLPage;
  onClickRow: (selectedData: CLPage) => void;
  selected?: boolean;
};

export default function PageRow(props: Props) {
  const { data, onClickRow, selected, seq } = props;
  const { pageNm, pageKey } = data;

  return (
    <TableRow
      className={clsx('PageRow-root', {
        x_selected: selected,
      })}
      onClick={(e) => {
        onClickRow(data);
      }}
    >
      <TableCell>{pageKey}</TableCell>

      <TableCell>{pageNm}</TableCell>
    </TableRow>
  );
}
