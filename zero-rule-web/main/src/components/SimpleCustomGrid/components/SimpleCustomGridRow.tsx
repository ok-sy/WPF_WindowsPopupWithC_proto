import { numberWithCommas } from '@/lib/common-validation';
import { Box, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useState } from 'react';
import TextOverField from '@/components/TextOverField';
import type { CustomGridColumnFilter } from '@/components/CustomGrid/grid-type';
import clsx from 'clsx';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox/CLStyledTableCheckBox';

type Props = {
  lineMode?: boolean;
  sequenceMode?: boolean;
  index: number;
  // multiRowCountView: number
  // finalArrays: {}[]
  columeFilter?: CustomGridColumnFilter[];
  row: any;
  rightClickEvent: (
    event: React.MouseEvent,
    data: any,
    rowData: any,
    idx: number,
    colume: CustomGridColumnFilter,
    id: string,
  ) => void;
  rightEventBodyMode: boolean;
  rowRef?: (node: HTMLTableRowElement | null) => void;
  isRowSelectionEvent: boolean;
  onClickRow: () => void;
  selected?: boolean;
  checkBoxMode?: boolean;
  checked: boolean;
  checkHandle: (value: any, checked: boolean) => void;
};
/**
 */
export default function SimpleCustomGridRow(props: Props) {
  const {
    row,
    index,
    rightClickEvent,
    rightEventBodyMode,
    lineMode,
    sequenceMode,
    columeFilter,
    rowRef,
    onClickRow,
    isRowSelectionEvent,
    selected,
    checkBoxMode,
    checkHandle,
    checked,
  } = props;

  return (
    <TableRow
      className={clsx('SimpleCustomGridRow-root', {
        x_selected: selected,
      })}
      ref={rowRef}
      onClick={() => {
        onClickRow();
      }}
      sx={{
        '& > .MuiTableCell-root + .MuiTableCell-root ': {
          borderLeft: lineMode ? '1px solid #e0e0e0' : '',
        },
        cursor: isRowSelectionEvent ? 'pointer' : 'inherit',
      }}
      key={index}
    >
      {sequenceMode && <TableCell sx={{ p: 0, textAlign: 'center' }}>{index + 1}</TableCell>}
      {checkBoxMode && (
        <TableCell>
          <CLStyledTableCheckBox
            onChange={(e, checked) => {
              checkHandle(row, checked);
            }}
            checked={checked}
          />
        </TableCell>
      )}

      {columeFilter &&
        columeFilter
          .filter((el) => el.isVisiable)
          .map((column) => {
            const isOnClickCell = column.onClickEvent !== undefined;
            return (
              <TableCell
                onContextMenu={(e) => {
                  if (!rightEventBodyMode) return;
                  const id = `clicked-id-${Date.now()}`;
                  e.currentTarget.id = 'clicked-cell-right';
                  e.currentTarget.classList.add(id);
                  rightClickEvent(e, row[column.columeId], row, index, column, id);
                }}
                key={column.columeId}
                onClick={() => {
                  if (column.onClickEvent !== undefined) {
                    column.onClickEvent(row[column.columeId], index, row, column.columeId);
                  }
                }}
                sx={{
                  maxWidth: column.maxWidth && column.maxWidth,
                  fontSize: '0.75rme',
                  p: column.columeType == 'component' ? 0.2 : 1,
                  textAlign:
                    column.textAlign === undefined
                      ? column.columeType === 'component'
                        ? 'center'
                        : column.columeType === 'string'
                          ? 'left'
                          : column.columeType === 'boolean'
                            ? 'center'
                            : 'right'
                      : column.textAlign,
                  '&:hover': isOnClickCell
                    ? {
                        cursor: 'pointer',
                        transition: '0.3s',
                        backgroundColor: '#f9fafd',
                      }
                    : {},
                }}
              >
                {
                  //@ts-ignore
                  // column.columeType == 'string' && row[column.columeId]
                  column.columeType == 'string' && (
                    <TextOverField
                      sx={
                        isOnClickCell
                          ? {
                              // cursor: 'pointer',
                              '&:hover': {
                                color: '#2c82d6',
                              },
                              textDecoration: 'underline',
                              textUnderlineOffset: 3,
                            }
                          : {}
                      }
                      text={row[column.columeId]}
                      textAlign={
                        column.textAlign === undefined
                          ? column.columeType === 'string'
                            ? 'left'
                            : column.columeType === 'boolean'
                              ? 'center'
                              : 'right'
                          : column.textAlign
                      }
                      maxWidth={column.maxWidth ? column.maxWidth - 20 : 150}
                      fontSize="0.8rem"
                    />
                  )
                }
                {
                  //@ts-ignore
                  column.columeType == 'number' && (
                    <Typography
                      sx={
                        isOnClickCell
                          ? {
                              // cursor: 'pointer',
                              '&:hover': {
                                color: '#2c82d6',
                              },
                              textDecoration: 'underline',
                              textUnderlineOffset: 3,
                            }
                          : {}
                      }
                      fontSize="0.8rem"
                    >
                      {numberWithCommas(row[column.columeId])}
                    </Typography>
                  )
                }
                {
                  //@ts-ignore
                  column.columeType == 'boolean' && String(row[column.columeId])
                }
                {
                  //@ts-ignore
                  column.columeType == 'component' && row[column.columeId]
                }
              </TableCell>
            );
          })}
    </TableRow>
  );
}
