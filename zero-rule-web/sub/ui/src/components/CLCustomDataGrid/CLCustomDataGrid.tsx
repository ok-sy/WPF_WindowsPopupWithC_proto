import {
  Box,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  ColumnDef,
  ColumnResizeMode,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React from 'react';
import { rootSx } from './style';
import { flatSx } from '../../lib/sx-props';

interface Props<T> {
  defaultData: T[];
  defaultColumns: ColumnDef<T>[];
  tableCellMinWidth?: number | string;
  fullWidth?: boolean;
  sx?: SxProps;
}

export default function CLCustomDataGrid<T>(props: Props<T>) {
  const { tableCellMinWidth, defaultColumns, defaultData, fullWidth, sx } = props;
  // const [data, setData] = React.useState(() => [...defaultData])
  const [columns] = React.useState<Props<T>['defaultColumns']>(() => [...defaultColumns]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnResizeMode, setColumnResizeMode] = React.useState<ColumnResizeMode>('onChange');
  const rerender = React.useReducer(() => ({}), {})[1];
  const table = useReactTable({
    data: defaultData,
    columns,
    columnResizeMode,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  return (
    <TableContainer
      sx={flatSx(rootSx, sx, {
        width: '100%',
      })}
      className="CLCustomDataGrid-root"
    >
      <Table
        sx={{
          '& .MuiTableCell-root': {
            minWidth: tableCellMinWidth,
          },
        }}
      >
        <TableHead sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  {...{
                    key: header.id,
                    colSpan: header.colSpan,
                    style: {
                      width: header.getSize(),
                    },
                  }}
                >
                  <Box
                    {...{
                      onMouseDown: header.getResizeHandler(),
                      onTouchStart: header.getResizeHandler(),
                      className: `resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`,
                      style: {
                        transform:
                          columnResizeMode === 'onEnd' && header.column.getIsResizing()
                            ? `translateX(${table.getState().columnSizingInfo.deltaOffset}px)`
                            : '',
                      },
                    }}
                  />
                  <Box
                    {...{
                      className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      // asc: " 🔼",
                      // desc: " 🔽",
                      asc: ' ⬆',
                      desc: ' ⬇',
                    }[header.column.getIsSorted() as string] ?? null}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <>
                  {String(cell.getValue()).length > 20 ? (
                    <Tooltip arrow title={String(cell.getValue())}>
                      <TableCell
                        {...{
                          key: cell.id,
                          style: {
                            width: cell.column.getSize(),
                          },
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    </Tooltip>
                  ) : (
                    <TableCell
                      {...{
                        key: cell.id,
                        style: {
                          width: cell.column.getSize(),
                        },
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )}
                </>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
