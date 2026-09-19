import { numberWithCommas } from '@/lib/common-validation';
import { TableCell, TableRow } from '@mui/material';
import type { CustomGridColumnFilter } from '../grid-type';
import { SubTotalInfo } from './CustomGridSubTotalAll';

type Props = {
  lineMode?: boolean;
  sequenceMode?: boolean;
  index: number;
  columeFilter?: CustomGridColumnFilter[];
  row: any;
  resultArr: any[];
  rightClickEvent: (
    event: React.MouseEvent,
    data: any,
    rowData: any,
    idx: number,
    colume: CustomGridColumnFilter,
    id: string,
  ) => void;
  rightEventBodyMode: boolean;
};
/**
 */
export default function CustomSubTotGridRow(props: Props) {
  const {
    row,
    index: rowIdx,
    lineMode,
    rightEventBodyMode,
    sequenceMode,
    rightClickEvent,
    columeFilter,
    resultArr,
  } = props;

  return (
    <TableRow
      sx={{
        '& > .MuiTableCell-root ': {
          borderLeft: lineMode ? '1px solid #e0e0e0' : '',
        },
      }}
      key={rowIdx}
    >
      {sequenceMode && <TableCell sx={{ p: 0, textAlign: 'center' }}>{rowIdx + 1}</TableCell>}
      {columeFilter &&
        columeFilter
          .filter((el) => el.isVisiable)
          .map((column, colIdx) => {
            const subTotCal = resultArr.find((subCol) => subCol.colId === column.columeId);

            if (subTotCal === undefined) {
              // 서브 토탈 컬럼이 아닐 시
              return (
                <TableCell
                  onContextMenu={(e) => {
                    if (!rightEventBodyMode) return;
                    const id = `clicked-id-${Date.now()}`;
                    e.currentTarget.id = 'clicked-cell-right';
                    e.currentTarget.classList.add(id);
                    rightClickEvent(e, row[column.columeId], row, rowIdx, column, id);
                  }}
                  key={column.columeId}
                  sx={{
                    p: column.columeType == 'component' ? 0.2 : 1,
                    textAlign:
                      column.columeType === 'component'
                        ? 'center'
                        : column.columeType === 'string'
                          ? 'left'
                          : column.columeType === 'boolean'
                            ? 'center'
                            : 'right',
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
                </TableCell>
              );
            } else {
              // 서브토탈 컬럼일시
              const indexSubTotInfo = subTotCal.info.find((el: any) => el.firstIdx === rowIdx);
              const rowSpanViewCnt = indexSubTotInfo?.addViewCnt ?? 0;
              if (!indexSubTotInfo) return <></>;
              return (
                <TableCell
                  onContextMenu={(e) => {
                    const id = `clicked-id-${Date.now()}`;
                    e.currentTarget.id = 'clicked-cell-right';
                    e.currentTarget.classList.add(id);
                    rightClickEvent(e, row[column.columeId], row, rowIdx, column, id);
                  }}
                  key={column.columeId}
                  sx={{
                    p: column.columeType == 'component' ? 0.2 : 1,
                    textAlign:
                      column.columeType === 'component'
                        ? 'center'
                        : column.columeType === 'string'
                          ? 'left'
                          : column.columeType === 'boolean'
                            ? 'center'
                            : 'right',
                  }}
                  rowSpan={indexSubTotInfo.sameCnt + rowSpanViewCnt}
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
                </TableCell>
              );
            }
          })}
    </TableRow>
  );
}
