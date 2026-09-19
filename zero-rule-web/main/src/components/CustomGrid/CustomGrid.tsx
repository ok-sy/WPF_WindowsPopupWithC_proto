import ExcelIcon from '@/icon/ExcelIcon';
import { numberWithCommas, trimAndStringLenght } from '@/lib/common-validation';
import { flatSx, sxTableRowSelection } from '@local/ui';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SxProps } from '@mui/material';
import {
  Box,
  Divider,
  IconButton,
  Popover,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomTableBody from '../CustomTableBody';
import { ExportToExcelWithButton } from '../ExportToExcelWithButton';
import ColumeFilterPopover from './components/ColumeFilterPopover';
import ColumnCommonStack from './components/ColumnCommonStack';
import CustomGridRow from './components/CustomGridRow';
import CustomGridSubTotalAll from './components/CustomGridSubTotalAll';
import ResizingTableCell from './components/ResizingTableCell';
import { createDividedArrays, createMultiRowCountView, sortingArr } from './grid-fn';
import type {
  CustomGridColumn,
  CustomGridColumnFilter,
  CustomGridFilterNumType,
  CustomGridFilterType,
  CustomGridSortingType,
  CustomGridSubtotal,
  CustomGridTotal,
} from './grid-type';
import { sortingOnAsc, sortingOnDesc } from '@/lib/nDepsSortingJsonArr';
import { toast } from 'react-toastify';
import RightClickEventPopover from './components/RightClickEventPopover';
import { switchingPalettes } from '@/lib/switching-palettes';
import { switchingPalettesGrid } from '@/lib/switching-palettes-gird';
import ColumnCommonStackOld from './components/ColumnCommonStackOld';

type RightClickId = {
  id: string;
  isFont?: boolean;
  color?: string;
};

type Props<T> = {
  sx?: SxProps;
  loading?: boolean;
  colums: CustomGridColumn[];
  rowData: any[];
  lineMode?: boolean;
  sortMode?: boolean;
  textFilterMode?: boolean;
  columeFilterMode?: boolean;
  stickyHeaderMode?: boolean;
  hideHeaderMode?: boolean;
  sequenceMode?: boolean;
  reSizeMode?: boolean;
  excelExportMode?: boolean;
  pageNationMode?: boolean;
  stripeMode?: boolean;
  onReloadEvent?: () => void;
  multiRowCount?: number; // head row의 갯수 컬럼의 개수만큼 받을수 있다
  subtotalMode?: CustomGridSubtotal;
  totalMode?: CustomGridTotal[];
  rightEventBodyMode?: (
    data: any,
    rowData: any,
    idx: number,
    colume: CustomGridColumnFilter,
    id: string,
  ) => React.ReactNode;
  containerRef?: (node: HTMLTableRowElement | null) => void;
  rowRef?: (node: HTMLTableRowElement | null) => void;
};
/**
 *
 * @param props 모드별 상세기능 추가형 커스텀 그리드
 * @returns <> 커스텀 그리드 컨테이너
 * @author sim jin woo
 */
export default function CustomGrid<T>(props: Props<T>) {
  const {
    sx,
    rowData,
    colums,
    loading,
    lineMode,
    sortMode,
    textFilterMode,
    columeFilterMode,
    stickyHeaderMode,
    hideHeaderMode,
    sequenceMode,
    reSizeMode,
    excelExportMode,
    pageNationMode,
    stripeMode,
    onReloadEvent,
    multiRowCount,
    subtotalMode,
    totalMode,
    rightEventBodyMode,
    containerRef,
    rowRef,
  } = props;

  const [rowMainData, setRowMainData] = useState<any[]>([]);
  const [sorting, setSorting] = useState<CustomGridSortingType>();

  const [filtering, setFiltering] = useState<CustomGridFilterType[]>([]);
  const [numFiltering, setNumFiltering] = useState<CustomGridFilterNumType[]>([]);
  const [columeFilter, setColumeFilter] = useState<CustomGridColumnFilter[]>();

  const [refreshToken, setRefreshToken] = useState(0);

  const [popOverHandle, setPopOverHandle] = useState<HTMLButtonElement | null>(null);

  const handleClickPop = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOverHandle(event.currentTarget);
  };
  const handleClosePop = () => {
    setPopOverHandle(null);
  };

  // 데이터 reload row
  useEffect(() => {
    setRowMainData(rowData);
  }, [rowData, refreshToken, subtotalMode]);

  // 데이터 reload column
  useEffect(() => {
    setColumeFilter(colums.map((el) => ({ ...el, isVisiable: true })));
  }, [colums, refreshToken]);

  // 데이저 정렬 변경될 시
  useEffect(() => {
    if (subtotalMode !== undefined) return;
    if (!sorting) return;
    if (sorting.order === 'basic') {
      setSorting(undefined);
      setRowMainData(rowData);
      return;
    }
    const tmpArr = [...rowMainData];
    const sortedArr = sortingArr(sorting, tmpArr);
    setRowMainData(sortedArr);
  }, [sorting, rowData, subtotalMode]);

  // 엑셀 다운 가능한 값으로 변경
  const excelDownDataReturn = () => {
    if (!columeFilter) return;
    const columeArr = columeFilter.filter((el) => el.isVisiable);
    const returnArr = rowMainData.map((el) => {
      const dataObj = {};
      columeArr.forEach((column) => {
        const columnName = column.columeName || column.columeId;
        if (Object.prototype.hasOwnProperty.call(el, column.columeId)) {
          //@ts-ignore
          dataObj[columnName] = el[column.columeId];
        }
      });
      return dataObj;
    });
    return returnArr;
  };

  // filter 수정시마다
  useEffect(() => {
    if (subtotalMode !== undefined) return;
    const rowArr = [...rowData];
    let resultArr = [] as any[];
    const filterCheck = filtering.length + numFiltering.length;
    // 필터배열 없을시 기존 배열
    if (filterCheck < 1) {
      resultArr = [...rowArr];
    } else {
      // 결과 배열 필터링
      resultArr = rowArr.filter((row, idx) => {
        let result = true;
        // string 컬럼 필터링
        filtering.forEach((col) => {
          if (col.operator === 'contain') {
            result = row[col.columeId]?.includes(col.keyword) ?? false;
          } else if (col.operator === 'equals') {
            result = row[col.columeId] === col.keyword;
          } else if (col.operator === 'notEquals') {
            result = row[col.columeId] !== col.keyword;
          }
        });
        // 숫자 컬럼 필터링
        if (!result) return false;
        numFiltering.forEach((numCol) => {
          if (numCol.numOperator === 'between') {
            if (numCol.minValue === undefined) {
              if (numCol.maxValue === undefined) return true;
              result = row[numCol.columeId] <= numCol.maxValue;
            } else if (numCol.maxValue === undefined) {
              if (numCol.minValue === undefined) return true;
              result = row[numCol.columeId] >= numCol.minValue;
            } else {
              result =
                row[numCol.columeId] >= numCol.minValue && row[numCol.columeId] <= numCol.maxValue;
            }
          } else if (numCol.numOperator === '=') {
            if (!numCol.operValue) return true;
            result = row[numCol.columeId] == numCol.operValue;
          } else if (numCol.numOperator === '!=') {
            if (!numCol.operValue) return true;
            result = row[numCol.columeId] != numCol.operValue;
          } else if (numCol.numOperator === '<') {
            if (!numCol.operValue) return true;
            result = row[numCol.columeId] < numCol.operValue;
          } else if (numCol.numOperator === '<=') {
            if (!numCol.operValue) return true;
            result = row[numCol.columeId] <= numCol.operValue;
          } else if (numCol.numOperator === '>') {
            if (!numCol.operValue) return true;
            result = row[numCol.columeId] > numCol.operValue;
          } else if (numCol.numOperator === '>=') {
            if (!numCol.operValue) return true;
            result = row[numCol.columeId] >= numCol.operValue;
          }
        });
        return result;
      });
    }
    setRowMainData(resultArr);
  }, [filtering, rowData, numFiltering, subtotalMode]);

  // filter 문자열 onChange handler
  const filterHandler = (data: CustomGridFilterType) => {
    if (trimAndStringLenght(data.keyword) < 1) {
      const asisFilter = filtering.findIndex((el) => el.columeId === data.columeId);
      if (asisFilter === -1) return;
      filtering.splice(asisFilter, 1);
      setFiltering([...filtering]);
      return;
    } else {
      const asisFilter = filtering.findIndex((el) => el.columeId === data.columeId);
      if (asisFilter === -1) {
        setFiltering(filtering.concat(data));
      } else {
        filtering.splice(asisFilter, 1, data);
        setFiltering([...filtering]);
      }
    }
  };

  // filter 넘버 onChange handler
  const filterNumHandler = (data: CustomGridFilterNumType, minMax: string) => {
    let asisFilter = [...numFiltering];
    const isHaveIndex = asisFilter.findIndex((el) => el.columeId === data.columeId);
    // 기존 컬럼아이디 없으면 생성 있으면 변경
    if (isHaveIndex === -1) {
      setNumFiltering([...asisFilter, data]);
    } else {
      // between 최솟값
      if (minMax === 'min') {
        const addObj: CustomGridFilterNumType = {
          ...asisFilter[isHaveIndex],
          minValue: data.minValue,
        };
        asisFilter.splice(isHaveIndex, 1, addObj);
        // between 최댓값
      } else if (minMax === 'max') {
        const addObj: CustomGridFilterNumType = {
          ...asisFilter[isHaveIndex],
          maxValue: data.maxValue,
        };
        asisFilter.splice(isHaveIndex, 1, addObj);
        // 나머지 연산자 처리로직
      } else {
        let addObj: CustomGridFilterNumType = {
          columeId: asisFilter[isHaveIndex].columeId,
          numOperator: asisFilter[isHaveIndex].numOperator,
        };
        // 기존 연산자가 들어오면 연산자만 변경, 데이터가 들어오면 데이터 변경
        if (data.operValue === undefined && data.numOperator !== addObj.numOperator) {
          addObj = {
            ...addObj,
            operValue: asisFilter[isHaveIndex].operValue,
            numOperator: data.numOperator,
          };
        } else {
          addObj = { ...addObj, operValue: data.operValue, numOperator: data.numOperator };
        }
        asisFilter.splice(isHaveIndex, 1, addObj);
      }
      asisFilter = asisFilter.filter((el) => {
        if (
          el.minValue === undefined &&
          el.maxValue === undefined &&
          el.operValue === undefined &&
          el.numOperator === undefined
        ) {
          return false;
        }
        return true;
      });
      setNumFiltering([...asisFilter]);
    }
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const startIdx = page * rowsPerPage;
  const endIndex = (page + 1) * rowsPerPage;

  const elements = pageNationMode ? rowMainData.slice(startIdx, endIndex) : rowMainData;

  const multiRowCountView = createMultiRowCountView(multiRowCount, columeFilter ?? []);

  const dividedArrays = createDividedArrays(multiRowCountView, columeFilter ?? []);

  const finalArrays = dividedArrays[0].map((_, index) => {
    const finalArray = {};
    dividedArrays.forEach((arr, i) => {
      if (index < arr.length) {
        //@ts-ignore
        finalArray[`array${i + 1}`] = arr[index];
      }
    });
    return finalArray;
  });

  const totalData =
    totalMode === undefined
      ? undefined
      : totalMode.map((tot) => {
          let resultTot = 0;
          let averageResult = 0;
          if (tot.sign === 'sum') {
            rowData.forEach((el) => {
              resultTot += el[tot.calculColumeId];
            });
          } else if (tot.sign === 'average') {
            rowData.forEach((el) => {
              resultTot += el[tot.calculColumeId];
            });
            averageResult = +(resultTot / rowData.length).toFixed(2);
          } else if (tot.sign === 'max') {
            rowData.forEach((el) => {
              if (resultTot < el[tot.calculColumeId]) {
                resultTot = el[tot.calculColumeId];
              }
            });
          } else if (tot.sign === 'min') {
            rowData.forEach((el) => {
              if (resultTot === 0) {
                resultTot = el[tot.calculColumeId];
              } else if (resultTot > el[tot.calculColumeId]) {
                resultTot = el[tot.calculColumeId];
              }
            });
          } else if (tot.sign === 'count') {
            rowData.forEach((el) => {
              resultTot++;
            });
          }

          return { ...tot, resultTot: tot.sign === 'average' ? averageResult : resultTot };
        });

  // ------------------------------------------------------------
  /**
   *  오른쪽 클릭 이벤트
   */

  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | undefined>(
    undefined,
  );
  const [xMouse, setXMouse] = useState<number>(0);
  const [yMouse, setYMouse] = useState<number>(0);
  const [clickMouseComponent, setClickMouseComponent] = useState<React.ReactNode>();
  const [rightClickedId, setRightClickedId] = useState<RightClickId[]>([]);

  const handleClickRightBodyEventCell = (
    event: React.MouseEvent,
    data: any,
    rowData: any,
    idx: number,
    colume: CustomGridColumnFilter,
    id: string,
  ) => {
    // 기본 동작을 막아 우클릭 메뉴가 나타나지 않도록 함
    if (!rightEventBodyMode) return;
    event.preventDefault();

    handleOpen(xMouse, yMouse);
    const components = rightEventBodyMode(data, rowData, idx, colume, id);
    setRightClickedId([...rightClickedId, { id }]);
    setClickMouseComponent(components);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!rightEventBodyMode) return;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    setXMouse(mouseX);
    setYMouse(mouseY);
  };

  const handleOpen = (x: number, y: number) => {
    setAnchorPosition({ top: y, left: x });
  };

  const handleClose = () => {
    setAnchorPosition(undefined);
    const cells = document.querySelectorAll('#clicked-cell-right');
    cells.forEach((cell) => {
      cell.id = '';
    });
  };
  const handleClickColor = (isFont: boolean, color: string) => {
    const lastEl = rightClickedId.length - 1;
    const tmpArr = rightClickedId.slice();
    tmpArr.splice(lastEl, 1, { id: rightClickedId[lastEl].id, color, isFont });
    setRightClickedId(tmpArr);
    handleClose();
  };

  const open = Boolean(anchorPosition);
  const id = open ? 'simple-popover' : undefined;

  const cssObj: any = {};
  const coloredList = rightClickedId.filter((el) => el.color !== undefined);

  coloredList.forEach((el) => {
    const keyVal = `.${el.id}`;
    let bcAndFont = '';
    let color = '';
    if (el.isFont) {
      bcAndFont = 'color';
      color = `${el.color}`;
    } else {
      bcAndFont = 'backgroundColor';
      color = `${el.color}90`;
    }
    cssObj[keyVal] = { [bcAndFont]: color };
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <IconButton
          color="primary"
          size="small"
          onClick={(e) => {
            setRefreshToken(Date.now);
            setFiltering([]);
            setColumeFilter(undefined);
            setNumFiltering([]);
            onReloadEvent!();
            setRightClickedId([]);
          }}
        >
          <RefreshIcon />
        </IconButton>

        <Stack direction="row" justifyContent="space-between" spacing={1} px={1} pb={0.5}>
          {excelExportMode && (
            <ExportToExcelWithButton
              data={excelDownDataReturn() ?? []}
              variant="outlined"
              fileName="export_data"
              btnTitle="excel export"
              startIcon={<ExcelIcon width={20} height={20} />}
              size="small"
              color="success"
            />
          )}
          {columeFilterMode && (
            <>
              <IconButton size="small" onClick={(e) => handleClickPop(e)}>
                <FilterAltOutlinedIcon />
              </IconButton>
              <Popover
                open={Boolean(popOverHandle)}
                anchorEl={popOverHandle}
                onClose={handleClosePop}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
              >
                <ColumeFilterPopover
                  columeFilter={columeFilter ?? []}
                  onColumeFilter={(value) => setColumeFilter(value)}
                  onClose={() => handleClosePop()}
                />
              </Popover>
            </>
          )}
        </Stack>
      </Stack>
      <TableContainer
        ref={containerRef}
        onMouseMove={handleMouseMove}
        sx={flatSx(
          { border: '1px solid #e0e0e0', whiteSpace: 'nowrap', borderRadius: 1 },
          sx,
          cssObj,
        )}
      >
        <Table stickyHeader={stickyHeaderMode}>
          {hideHeaderMode ? (
            <TableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-root': {
                    border: 'none',
                  },
                }}
              >
                {columeFilter &&
                  columeFilter
                    .filter((el) => el.isVisiable)
                    .map((el) => (
                      <TableCell
                        sx={{ p: 0, minWidth: el.maxWidth, maxWidth: el.maxWidth }}
                        key={el.columeId}
                      ></TableCell>
                    ))}
                {sequenceMode && <TableCell sx={{ p: 0 }}></TableCell>}
              </TableRow>
            </TableHead>
          ) : (
            <TableHead sx={{ borderBottom: '1px solid #d1d1d1' }}>
              {dividedArrays.map((el, idx) => {
                if (columeFilter === undefined) return;
                return (
                  <TableRow
                    key={idx}
                    sx={{
                      '& > .MuiTableCell-root + .MuiTableCell-root ': {
                        borderLeft: lineMode ? '1px solid #e0e0e0' : '',
                      },
                      '& .MuiTableCell-root': {
                        backgroundColor: '#fafafa',
                        borderBottom: '1px solid #d1d1d1',
                        borderTop: 'none',
                      },
                    }}
                  >
                    {sequenceMode && idx === 0 && (
                      <TableCell
                        rowSpan={multiRowCountView}
                        sx={{
                          px: 1.5,
                          py: 1,
                          fontWeight: 600,
                          borderTop: '1px solid #e0e0e0',
                          borderRight: '1px solid #e0e0e0',
                        }}
                      >
                        No
                      </TableCell>
                    )}
                    {el &&
                      el
                        .filter((el) => el.isVisiable)
                        .map((el) => {
                          if (reSizeMode) {
                            return (
                              <ResizingTableCell
                                key={el.columeId}
                                data={el}
                                sortMode={sortMode ?? false}
                                sorting={sorting}
                                textFilterMode={textFilterMode ?? false}
                                setFiltering={filterHandler}
                                setNumFiltering={filterNumHandler}
                                setSorting={(data: CustomGridSortingType) =>
                                  setSorting({ ...data })
                                }
                              />
                            );
                          }

                          return (
                            <TableCell
                              sx={{
                                fontWeight: 600,
                                p: 0,
                                borderTop: '1px solid #e0e0e0',
                                // minWidth: el.maxWidth,
                                // maxWidth: el.maxWidth,
                              }}
                              key={el.columeId}
                            >
                              <ColumnCommonStackOld
                                data={el}
                                sortMode={sortMode ?? false}
                                sorting={sorting}
                                textFilterMode={textFilterMode ?? false}
                                setFiltering={filterHandler}
                                setNumFiltering={filterNumHandler}
                                setSorting={(data: CustomGridSortingType) =>
                                  setSorting({ ...data })
                                }
                                onNumOperator={filterNumHandler}
                              />
                            </TableCell>
                          );
                        })}
                  </TableRow>
                );
              })}
            </TableHead>
          )}

          <CustomTableBody
            stripe={stripeMode}
            loading={loading}
            sx={{
              ...sxTableRowSelection,
              '#clicked-cell-right': {
                backgroundColor: rightEventBodyMode === undefined ? undefined : '#ebedf7',
              },
            }}
          >
            {subtotalMode === undefined ? (
              <>
                {elements.map((row, index) => (
                  <CustomGridRow
                    rowRef={rowRef}
                    key={index}
                    row={row}
                    lineMode={lineMode}
                    sequenceMode={sequenceMode}
                    index={index}
                    multiRowCountView={multiRowCountView}
                    finalArrays={finalArrays}
                    columeFilter={columeFilter}
                    rightClickEvent={handleClickRightBodyEventCell}
                    rightEventBodyMode={rightEventBodyMode === undefined ? false : true}
                  />
                ))}
              </>
            ) : (
              <>
                <CustomGridSubTotalAll
                  rowData={
                    subtotalMode.autoSorting === undefined
                      ? rowMainData
                      : subtotalMode.autoSorting === 'asc'
                        ? sortingOnAsc(rowMainData.slice(0), subtotalMode.columnIds)
                        : sortingOnDesc(rowMainData.slice(0), subtotalMode.columnIds)
                  }
                  pageData={pageNationMode ? { startIdx, endIndex } : undefined}
                  lineMode={lineMode}
                  sequenceMode={sequenceMode}
                  columeFilter={columeFilter}
                  subTotalData={subtotalMode}
                  rightClickEvent={handleClickRightBodyEventCell}
                  rightEventBodyMode={rightEventBodyMode === undefined ? false : true}
                />
              </>
            )}
          </CustomTableBody>
          {totalMode !== undefined && (
            <TableFooter
              sx={{
                position: 'sticky',
                bottom: -1,
                backgroundColor: '#fff',
                '& .MuiTableCell-root': {
                  borderTop: '1px solid #d1d1d1',
                  backgroundColor: '#aaaeeb',
                  color: '#000',
                  fontWeight: 500,
                },
              }}
            >
              <TableRow
                sx={{
                  '& > .MuiTableCell-root + .MuiTableCell-root ': {
                    borderLeft: lineMode ? '1px solid #fff' : '',
                  },
                }}
              >
                {sequenceMode && <TableCell sx={{ p: 0.1, textAlign: 'center' }}>총계</TableCell>}
                {columeFilter &&
                  columeFilter
                    .filter((el) => el.isVisiable)
                    .map((col, idx) => {
                      const totalData2 =
                        totalData && totalData.find((el) => el.calculColumeId === col.columeId);
                      return (
                        <TableCell sx={{ textAlign: 'right', px: 1, py: 0.7 }} key={col.columeId}>
                          {(totalMode.map((el) => el.calculColumeId).includes(col.columeId) &&
                            numberWithCommas(totalData2?.resultTot)) ??
                            0}
                        </TableCell>
                      );
                    })}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>{' '}
      <Stack
        sx={{
          borderLeft: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {pageNationMode && (
          <TablePagination
            component="div"
            count={rowMainData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={'페이지당 COUNT : '}
          />
        )}
      </Stack>
      <Popover
        id={id}
        open={open}
        onContextMenu={(e) => {
          e.preventDefault();
          if (open) {
            handleClose();
          }
        }}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        TransitionProps={{
          timeout: 0, // 트랜지션 지연 시간을 0으로 설정
        }}
        disableRestoreFocus
      >
        <RightClickEventPopover onClose={() => handleClose()}>
          <>
            {clickMouseComponent}
            <Divider></Divider>
            <Stack sx={{ p: 1 }}>
              <Stack direction="row" spacing={1}>
                <Typography>폰트 : </Typography>
                <Stack spacing={1} direction="row">
                  {switchingPalettesGrid.map((el, idx) => (
                    <Box
                      key={idx}
                      sx={{ cursor: 'pointer', backgroundColor: el.main, width: 20, height: 20 }}
                      onClick={() => {
                        handleClickColor(true, el.main);
                      }}
                    ></Box>
                  ))}
                </Stack>
              </Stack>
              <Stack pt={0.5}>
                <Stack direction="row" spacing={1}>
                  <Typography>배경 : </Typography>
                  <Stack spacing={1} direction="row">
                    {switchingPalettesGrid.map((el, idx) => (
                      <Box
                        key={idx}
                        sx={{ cursor: 'pointer', backgroundColor: el.main, width: 20, height: 20 }}
                        onClick={() => {
                          handleClickColor(false, el.light);
                        }}
                      ></Box>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </>
        </RightClickEventPopover>
      </Popover>
    </Box>
  );
}
