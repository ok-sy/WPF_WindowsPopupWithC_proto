import { TableCell, TableRow } from '@mui/material';
import type { CustomGridColumnFilter, CustomGridSubtotal } from '../grid-type';
import CustomSubTotGridRow from './CustomSubTotGridRow';
import { numberWithCommas } from '@/lib/common-validation';

export type SubTotalInfo = {
  colId: string | number;
  info: { firstIdx: number; sameCnt: number; calCulResult: number }[];
};

type PageData = {
  startIdx: number;
  endIndex: number;
};

type Props = {
  lineMode?: boolean;
  sequenceMode?: boolean;
  columeFilter?: CustomGridColumnFilter[];
  rowData: any[];
  subTotalData: CustomGridSubtotal;
  pageData?: PageData;
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
export default function CustomGridSubTotalAll(props: Props) {
  const {
    subTotalData,
    pageData,
    rowData,
    columeFilter,
    lineMode,
    sequenceMode,
    rightEventBodyMode,
    rightClickEvent,
  } = props;

  // 서브토탈 정보 전체가 들어있는 배열 생성
  const subTotalInfo: SubTotalInfo[] = subTotalData.columnIds.map((col, idx, arrs) => {
    let sameCnt = 1;
    const info: {
      firstIdx: number;
      sameCnt: number;
      calCulResult: number;
    }[] = [];

    const subSign = subTotalData.sign;
    const subCalCulCol = subTotalData.calculColumeId;
    let subCalCulResult = 0;
    let subAverageCnt = 0;
    rowData.forEach((row, rowIdx) => {
      const nextRow = rowData[rowIdx + 1];
      const calRowInt = row[subCalCulCol];
      let averageResult = 0;

      if (subSign === 'sum') {
        subCalCulResult += calRowInt;
      } else if (subSign === 'average') {
        subCalCulResult += calRowInt;
        subAverageCnt++;
      } else if (subSign === 'count') {
        subCalCulResult++;
      } else if (subSign === 'max') {
        if (subCalCulResult < calRowInt) {
          subCalCulResult = calRowInt;
        }
      } else if (subSign === 'min') {
        if (subCalCulResult === 0) {
          subCalCulResult = calRowInt;
        } else if (subCalCulResult > calRowInt) {
          subCalCulResult = calRowInt;
        }
      }

      if (!nextRow) {
        if (subSign === 'average') {
          averageResult = +(subCalCulResult / subAverageCnt).toFixed(2);
        }
        info.push({
          sameCnt,
          firstIdx: rowIdx - sameCnt + 1,
          calCulResult: subSign === 'average' ? averageResult : subCalCulResult,
        });
        subCalCulResult = 0;
        subAverageCnt = 0;
        sameCnt = 1;
      } else {
        if (subSign === 'average') {
          averageResult = +(subCalCulResult / subAverageCnt).toFixed(2);
        }
        if (nextRow[col] === row[col]) {
          sameCnt = sameCnt + 1;
        } else {
          info.push({
            sameCnt,
            firstIdx: rowIdx - sameCnt + 1,
            calCulResult: subSign === 'average' ? averageResult : subCalCulResult,
          });
          subCalCulResult = 0;
          subAverageCnt = 0;
          sameCnt = 1;
        }
      }
    });

    return { colId: col, info };
  });

  const totViewRowData = [...rowData];
  const colIndexArr: {
    colId: string | number;
    firstIndex: number;
    lastIndex: number;
    calCulResult: number;
  }[] = [];
  const subList = subTotalInfo.map((el) => el.colId);
  subTotalInfo.forEach((el) => {
    const colId = el.colId;
    el.info.forEach((el2) => {
      colIndexArr.push({
        colId,
        firstIndex: el2.firstIdx,
        lastIndex: el2.firstIdx + el2.sameCnt - 1,
        calCulResult: el2.calCulResult,
      });
    });
  });
  colIndexArr.sort((a, b) => a.firstIndex - b.firstIndex);
  colIndexArr.forEach((el) => {
    const asisLastData = totViewRowData[el.lastIndex];
    let isLastRowInfo = [] as any[];
    if (!columeFilter) return;
    const indexNum = subList.findIndex((el2) => el2 === el.colId);
    const sliceArr = subList.slice(indexNum);
    const columeFilterCol = columeFilter.map((el) => el.columeId);
    const filteringCol = columeFilterCol.filter((el2) => {
      if (sliceArr.includes(el2)) {
        return true;
      } else {
        if (subList.includes(el2)) {
          return false;
        }
        return true;
      }
    });

    const lastInfoData = {
      colId: el.colId,
      totalInt: el.calCulResult,
      filteringCol,
    };

    if (asisLastData.isLastRowInfo === undefined) {
      isLastRowInfo = [lastInfoData];
    } else {
      isLastRowInfo = [...asisLastData.isLastRowInfo, lastInfoData];
    }
    totViewRowData.splice(el.lastIndex, 1, {
      ...asisLastData,
      subColId: el.colId,
      isLastRowInfo: isLastRowInfo,
    });
  });

  const totAddSortingRowList = totViewRowData.map((row) => {
    if (row.isLastRowInfo === undefined) {
      return row;
    } else {
      const tempArr = [...row.isLastRowInfo];
      tempArr.sort((a: any, b: any) => subList.indexOf(b.colId) - subList.indexOf(a.colId));
      return { ...row, isLastRowInfo: tempArr };
    }
  });

  const subTotalAllInfo = subTotalInfo.map((infoCol, colIdx, infoColArr) => {
    const pushAddView = infoCol.info.map((info, infoIdx, sorce) => {
      if (sorce[infoIdx + 1] === undefined) {
        const nowRowfirstIdx = info.firstIdx;
        let viewCount = 0;
        infoColArr.slice(colIdx + 1).forEach((el) => {
          el.info.forEach((el2) => {
            if (el2.firstIdx === 0) {
              // empty
            } else if (nowRowfirstIdx <= el2.firstIdx) {
              viewCount = viewCount + 1;
            }
          });
        });
        return { ...info, addViewCnt: viewCount };
      } else {
        const nowRowfirstIdx = info.firstIdx;
        const nextRowfirstIdx = sorce[infoIdx + 1].firstIdx;
        let viewCount = 0;
        infoColArr.slice(colIdx + 1).forEach((el) => {
          el.info.forEach((el2) => {
            if (el2.firstIdx === 0) {
              // empty
            } else if (nowRowfirstIdx < el2.firstIdx && el2.firstIdx <= nextRowfirstIdx) {
              viewCount = viewCount + 1;
            }
          });
        });
        return { ...info, addViewCnt: viewCount };
      }
    });

    return { ...infoCol, info: pushAddView };
  });

  return (
    <>
      {totAddSortingRowList.map((row: any, idx: number) => {
        return (
          <>
            <CustomSubTotGridRow
              key={idx}
              row={row}
              lineMode={lineMode}
              sequenceMode={sequenceMode}
              resultArr={subTotalAllInfo}
              index={idx}
              columeFilter={columeFilter}
              rightClickEvent={rightClickEvent}
              rightEventBodyMode={rightEventBodyMode}
            />
            {row.isLastRowInfo !== undefined &&
              row.isLastRowInfo.map((row2: any, idx2: number) => (
                <TableRow
                  key={idx2}
                  sx={{
                    '& .MuiTableCell-root': {
                      backgroundColor: '#cce6ff',
                      borderTop: '1px solid #fff',
                      borderLeft: lineMode ? '1px solid #c1c1c1' : '',
                    },
                  }}
                >
                  {sequenceMode && <TableCell sx={{ p: 0, textAlign: 'center' }}></TableCell>}
                  {columeFilter &&
                    columeFilter
                      .filter((el) => el.isVisiable)
                      .filter((el) => {
                        if (row2.filteringCol === undefined) {
                          return true;
                        } else {
                          return row2.filteringCol.includes(el.columeId);
                        }
                      })
                      .map((col, idx) => {
                        return (
                          <TableCell
                            sx={{
                              py: 0.7,
                              px: 1,
                              textAlign:
                                col.textAlign === undefined
                                  ? col.columeType === 'component'
                                    ? 'center'
                                    : col.columeType === 'string'
                                      ? 'left'
                                      : col.columeType === 'boolean'
                                        ? 'center'
                                        : 'right'
                                  : col.textAlign,
                            }}
                            key={idx}
                          >
                            {col.columeId === row2.colId && row[col.columeId]}
                            {col.columeId === subTotalData.calculColumeId &&
                              numberWithCommas(row2.totalInt)}
                          </TableCell>
                        );
                      })}
                </TableRow>
              ))}
          </>
        );
      })}
    </>
  );
}
