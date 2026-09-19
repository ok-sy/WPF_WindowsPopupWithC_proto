import { flatSx } from '@local/ui';
import type { TableProps } from '@mui/material';
import { Table } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { rootSx } from './style';

type Props = {
  noMargin?: boolean;
} & TableProps;

// const CLStyledTable = React.forwardRef<HTMLTableElement, Props>((props: Props, ref) => {
const CLStyledTable: React.FC<Props> = (props) => {
  const { sx, noMargin = false, className, children, ...restProps } = props;
  return (
    <Table
      sx={flatSx(rootSx, sx, noMargin ? { m: 0 } : {})}
      className={clsx('CLStyledTable-root', className)}
      // ref={ref}
      {...restProps}
    >
      {children}
    </Table>
  );
  // })
};

CLStyledTable.displayName = 'CLStyledTable';
export default CLStyledTable;
