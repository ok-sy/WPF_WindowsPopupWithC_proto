import TextOverField from '@/components/TextOverField';
import { numberWithCommas } from '@/lib/common-validation';
import { Box, Stack, TableCell, TableRow, Typography } from '@mui/material';
import type { CustomGridColumnFilter } from '../grid-type';

type Props = {
  lineMode?: boolean;
  sequenceMode?: boolean;
  index: number;
  multiRowCountView: number;
  finalArrays: {}[];
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
};
/**
 */
export default function CustomGridRow(props: Props) {
  const {
    row,
    finalArrays,
    index,
    rightClickEvent,
    multiRowCountView,
    rightEventBodyMode,
    lineMode,
    sequenceMode,
    columeFilter,
    rowRef,
  } = props;

  return (
    <TableRow
      ref={rowRef}
      sx={{
        '& > .MuiTableCell-root + .MuiTableCell-root ': {
          borderLeft: lineMode ? '1px solid #e0e0e0' : '',
        },
      }}
      key={index}
    >
      {sequenceMode && <TableCell sx={{ p: 0, textAlign: 'center' }}>{index + 1}</TableCell>}

      {multiRowCountView > 1
        ? finalArrays.map((cnt, idx) => {
            if (!cnt) return;
            const arrayFromObj = Object.values(cnt) as CustomGridColumnFilter[];
            return (
              <TableCell sx={{ py: 0, px: 0, height: multiRowCountView * 50 }} key={idx}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    '& > .element-tableCell + .element-tableCell': {
                      borderTop: '1px solid #eee',
                    },
                  }}
                >
                  {arrayFromObj.map((column) => (
                    <Stack
                      onContextMenu={(e) => {
                        if (!rightEventBodyMode) return;
                        const id = `clicked-id-${Date.now()}`;
                        e.currentTarget.id = 'clicked-cell-right';
                        e.currentTarget.classList.add(id);
                        rightClickEvent(e, row[column.columeId], row, index, column, id);
                      }}
                      className="element-tableCell"
                      key={column.columeId}
                      sx={{
                        flex: 1,
                        px: 0.5,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                      }}
                    >
                      {
                        //@ts-ignore
                        column.columeType == 'string' && row[column.columeId]
                      }
                      {
                        //@ts-ignore
                        column.columeType == 'number' && numberWithCommas(row[column.columeId])
                      }
                      {
                        //@ts-ignore
                        column.columeType == 'boolean' && String(row[column.columeId])
                      }
                      {
                        //@ts-ignore
                        column.columeType == 'component' && row[column.columeId]
                      }
                    </Stack>
                  ))}
                </Box>
              </TableCell>
            );
          })
        : columeFilter &&
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
                          transition: '1s',
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
                      <Typography fontSize="0.8rem">
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
