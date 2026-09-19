import ExcelIcon from '@/icon/ExcelIcon';
import { trimAndStringLenght } from '@/lib/common-validation';
import { flatSx, sxTableRowSelection } from '@local/ui';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SxProps } from '@mui/material';
import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Popover,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import CustomTableBody from '../CustomTableBody';
import { ExportToExcelWithButton } from '../ExportToExcelWithButton';

import SaveIcon from '@mui/icons-material/Save';
import ColumnCommonStack from '../CustomGrid/components/ColumnCommonStack';
import { sortingArr } from '../CustomGrid/grid-fn';

import { switchingPalettesGrid } from '@/lib/switching-palettes-gird';
import { toast } from 'react-toastify';
import CLStyledTableCheckBox from '../CLStyledTableCheckBox/CLStyledTableCheckBox';
import ColumeFilterPopover from '../CustomGrid/components/ColumeFilterPopover';
import RightClickEventPopover from '../CustomGrid/components/RightClickEventPopover';
import type {
  CustomGridColumn,
  CustomGridColumnFilter,
  CustomGridColumnsView,
  CustomGridFilterNumType,
  CustomGridFilterType,
  CustomGridSortingType,
} from '../CustomGrid/grid-type';
import SimpleCustomGridRow from './components/SimpleCustomGridRow';

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
  textFilterSelMode?: boolean;
  columeFilterMode?: boolean;
  stickyHeaderMode?: boolean;
  sequenceMode?: boolean;
  reSizeMode?: boolean;
  excelExportMode?: boolean;
  pageNationMode?: boolean;
  stripeMode?: boolean;
  rightEventBodyMode?: (
    data: any,
    rowData: any,
    idx: number,
    colume: CustomGridColumnFilter,
    id: string,
  ) => React.ReactNode;
  containerRef?: (node: HTMLTableRowElement | null) => void;
  rowRef?: (node: HTMLTableRowElement | null) => void;
  rowSelectionEvent?: (row: any) => void;
  noDataTextMsg?: string;
  checkBoxMode?: boolean;
  checkedData?: (data: any[]) => void;
  refreshAllRowData?: number;
  strFilteringdata?: CustomGridFilterType[];
  numFilteringdata?: CustomGridFilterNumType[];
  columnsView?: CustomGridColumnsView[];
  allFilteringdata?: (
    filterNm: string,
    filtering: CustomGridFilterType[],
    numFiltering: CustomGridFilterNumType[],
    columeFilter: CustomGridColumnFilter[],
    textFilterMode: boolean,
    sorting?: CustomGridSortingType,
  ) => void;
  topElement?: React.ReactNode;
  textFilterTf?: boolean;
  setSortingData?: CustomGridSortingType;
};
/**
 *
 * @param props 소계 총계 부분합계 ndeps 정렬 등의 기능이 빠진 버젼이다
 * @returns <> 커스텀 그리드 컨테이너의 간단한 사용 버전
 * @author coding sang bin //
 * @author2 SIM JIN WOO //
 * @author3 LEE JUNG SEO //
 */
export default function SimpleCustomGrid<T>(props: Props<T>) {
  const {
    sx,
    rowData,
    colums,
    loading,
    lineMode,
    sortMode,
    textFilterSelMode,
    columeFilterMode,
    stickyHeaderMode,
    sequenceMode,
    reSizeMode,
    excelExportMode,
    pageNationMode,
    stripeMode,
    rightEventBodyMode,
    containerRef,
    rowRef,
    rowSelectionEvent,
    noDataTextMsg,
    checkBoxMode,
    checkedData,
    refreshAllRowData: refreshAllData,
    strFilteringdata,
    numFilteringdata,
    columnsView,
    allFilteringdata,
    topElement,
    textFilterTf,
    setSortingData,
  } = props;

  const [rowMainData, setRowMainData] = useState<any[]>([]);
  const [sorting, setSorting] = useState<CustomGridSortingType>();
  const [filtering, setFiltering] = useState<CustomGridFilterType[]>([]);
  const [numFiltering, setNumFiltering] = useState<CustomGridFilterNumType[]>([]);
  const [columeFilter, setColumeFilter] = useState<CustomGridColumnFilter[]>();
  const [textFilterMode, setTextFilterMode] = useState(false);
  const [popOverHandle, setPopOverHandle] = useState<HTMLButtonElement | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number>();

  const [selectChecked, setSelectChecked] = useState<any[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [savedFilterNm, setSavedFilterNm] = useState<string>();

  useEffect(() => {
    setTextFilterMode(textFilterTf ?? false);
  }, [textFilterTf]);

  useEffect(() => {
    setSorting(setSortingData);
  }, [setSortingData]);

  const handleClickPop = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOverHandle(event.currentTarget);
  };
  const handleClosePop = () => {
    setPopOverHandle(null);
  };
  // 데이터 reload row
  useEffect(() => {
    setRowMainData(rowData);
  }, [rowData, refreshToken]);

  // 데이터 reload column
  useEffect(() => {
    if (columnsView === undefined) {
      setColumeFilter(colums.map((el) => ({ ...el, isVisiable: true })));
    } else {
      setColumeFilter(
        //@ts-ignore
        columnsView.map((el) => {
          const data = colums.find((col) => col.columeId === el.columnId);
          return { ...data, isVisiable: el.isVisiable };
        }),
      );
    }
  }, [colums, refreshToken, columnsView]);

  const refreshGridAll = useCallback(async () => {
    setSorting(undefined);
    setRefreshToken(Date.now);
    setFiltering([]);
    setColumeFilter(undefined);
    setNumFiltering([]);
    setRightClickedId([]);
    setTextFilterMode(textFilterTf ?? false);
    setSavedFilterNm('');
  }, [textFilterTf]);

  const refreshRowDataAll = useCallback(async () => {
    setSorting(undefined);
    setRefreshToken(Date.now);
    setFiltering([]);
    setNumFiltering([]);
    setRightClickedId([]);
    setTextFilterMode(textFilterTf ?? false);
    setSavedFilterNm('');
  }, [textFilterTf]);

  useEffect(() => {
    refreshRowDataAll();
  }, [refreshAllData]);

  // 데이저 정렬 변경될 시
  useEffect(() => {
    if (!sorting) return;
    if (sorting.order === 'basic') {
      setSorting(undefined);
      setRowMainData(rowData);
      return;
    }
    const tmpArr = [...rowMainData];
    const sortedArr = sortingArr(sorting, tmpArr);
    setRowMainData(sortedArr);
  }, [sorting, rowData]);

  // 엑셀 다운 가능한 값으로 변경
  const excelDownDataReturn = () => {
    if (!columeFilter) return;
    const columeArr = columeFilter.filter((el) => el.isVisiable);
    const returnArr = rowMainData.map((el) => {
      const dataObj = {};
      columeArr.forEach((column) => {
        const columnName = column.columeName || column.columeId;
        if (el.hasOwnProperty(column.columeId)) {
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
    const rowArr = [...rowData];
    let resultArr = [...rowData];

    const filterCheck = filtering.length + numFiltering.length;

    // 필터배열 없을시 기존 배열
    if (filterCheck < 1) {
      resultArr = [...rowArr];
    } else {
      filtering.forEach((cond) => {
        resultArr = resultArr.filter((row, idx) => {
          let result = true;
          if (cond.operator === 'contain') {
            result = row[cond.columeId]?.includes(cond.keyword) ?? false;
          } else if (cond.operator === 'equals') {
            result = row[cond.columeId] === cond.keyword;
          } else if (cond.operator === 'notEquals') {
            result = row[cond.columeId] !== cond.keyword;
          }
          return result;
        });
      });
      numFiltering.forEach((cond) => {
        resultArr = resultArr.filter((row, idx) => {
          let result = true;
          if (cond.numOperator === 'between') {
            if (cond.minValue === undefined) {
              if (cond.maxValue === undefined) return true;
              result = row[cond.columeId] <= cond.maxValue;
            } else if (cond.maxValue === undefined) {
              if (cond.minValue === undefined) return true;
              result = row[cond.columeId] >= cond.minValue;
            } else {
              result = row[cond.columeId] >= cond.minValue && row[cond.columeId] <= cond.maxValue;
            }
          } else if (cond.numOperator === '=') {
            if (!cond.operValue) return true;
            result = row[cond.columeId] == cond.operValue;
          } else if (cond.numOperator === '!=') {
            if (!cond.operValue) return true;
            result = row[cond.columeId] != cond.operValue;
          } else if (cond.numOperator === '<') {
            if (!cond.operValue) return true;
            result = row[cond.columeId] < cond.operValue;
          } else if (cond.numOperator === '<=') {
            if (!cond.operValue) return true;
            result = row[cond.columeId] <= cond.operValue;
          } else if (cond.numOperator === '>') {
            if (!cond.operValue) return true;
            result = row[cond.columeId] > cond.operValue;
          } else if (cond.numOperator === '>=') {
            if (!cond.operValue) return true;
            result = row[cond.columeId] >= cond.operValue;
          }
          return result;
        });
      });
    }
    setRowMainData(resultArr);
  }, [filtering, rowData, numFiltering]);

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

  // 체크박스 영역
  const allRowCheckHandler = (checked: boolean) => {
    if (checked) {
      setSelectChecked(elements);
    } else {
      setSelectChecked([]);
    }
  };

  const checkHandle = (ruleid: string, checked: boolean) => {
    if (checked) {
      setSelectChecked((p) => [...p, ruleid]);
    } else {
      setSelectChecked((prevState) => prevState.filter((item) => item !== ruleid));
    }
  };
  useEffect(() => {
    if (checkBoxMode === false) return;
    if (!checkedData) return;
    checkedData(selectChecked ?? []);
  }, [selectChecked]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" justifyContent="center" alignItems="center">
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              refreshGridAll();
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
          {textFilterSelMode && (
            <FormControlLabel
              sx={{ pl: 1 }}
              control={
                <Checkbox
                  checked={textFilterMode}
                  onChange={(e, checked) => setTextFilterMode(checked)}
                  size="small"
                />
              }
              label={'FILTER'}
            />
          )}
          {allFilteringdata && (
            <FormControl size="small" sx={{ m: 1, width: '25ch' }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">필터명</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={'text'}
                size="small"
                value={savedFilterNm}
                onChange={(e) => setSavedFilterNm(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="toggle password visibility"
                      onClick={() => {
                        if (trimAndStringLenght(savedFilterNm) < 1) {
                          toast.warn('필터명을 입력해주세요');
                          return;
                        }
                        if (!savedFilterNm) return;
                        allFilteringdata(
                          savedFilterNm,
                          filtering,
                          numFiltering,
                          columeFilter ?? [],
                          textFilterMode ?? false,
                          sorting,
                        );
                        setSavedFilterNm('');
                      }}
                      edge="end"
                    >
                      {/* {trimAndStringLenght(savedFilterNm) > 1 && ( */}
                      <SaveIcon color="primary" fontSize="small" />
                      {/* )} */}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>
          )}
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          px={1}
          pb={0.5}
        >
          {topElement}

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
        className="table-container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        sx={flatSx(
          { border: '1px solid #e0e0e0', whiteSpace: 'nowrap', borderRadius: 1 },
          sx,
          cssObj,
        )}
      >
        <Table stickyHeader={stickyHeaderMode}>
          <TableHead sx={{ borderBottom: '1px solid #d1d1d1' }}>
            <TableRow
              sx={{
                '& > .MuiTableCell-root + .MuiTableCell-root ': {
                  borderLeft: lineMode ? '1px solid #cccccc' : '',
                },
                '& .MuiTableCell-root': {
                  backgroundColor: '#e2e5f4',
                  borderBottom: '1px solid #d1d1d1',
                  borderTop: 'none',
                  minWidth: textFilterMode ? 180 : 'inherit',
                },
              }}
            >
              {checkBoxMode && (
                <TableCell
                  sx={{
                    px: 1.5,
                    py: 1,
                    fontWeight: 600,
                    borderTop: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0',
                  }}
                >
                  <CLStyledTableCheckBox
                    checked={elements.length === selectChecked.length && elements.length !== 0}
                    onChange={(_, checked) => {
                      allRowCheckHandler(checked);
                    }}
                  />
                </TableCell>
              )}
              {columeFilter &&
                columeFilter
                  .filter((el) => el.isVisiable)
                  .map((el, idx) => {
                    if (columeFilter === undefined) return;
                    return (
                      <>
                        {sequenceMode && idx === 0 && (
                          <TableCell
                            key={el.columeId}
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
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            p: 0,
                            borderTop: '1px solid #e0e0e0',
                          }}
                          key={el.columeId}
                        >
                          <ColumnCommonStack
                            data={el}
                            sortMode={sortMode ?? false}
                            sorting={sorting}
                            textFilterMode={textFilterMode ?? false}
                            setFiltering={filterHandler}
                            setNumFiltering={filterNumHandler}
                            setSorting={(data: CustomGridSortingType) => setSorting({ ...data })}
                            onNumOperator={filterNumHandler}
                            filtering={strFilteringdata?.find(
                              (el2) => el2.columeId === el.columeId,
                            )}
                            numFiltering={numFilteringdata?.find(
                              (el2) => el2.columeId === el.columeId,
                            )}
                            setSortingData={setSortingData}
                          />
                        </TableCell>
                      </>
                    );
                  })}
            </TableRow>
          </TableHead>

          <CustomTableBody
            stripe={stripeMode}
            loading={loading}
            sx={flatSx(
              {
                '#clicked-cell-right': {
                  backgroundColor: rightEventBodyMode === undefined ? undefined : '#ebedf7',
                },
              },
              rowSelectionEvent !== undefined && sxTableRowSelection,
            )}
          >
            {elements.map((row, index) => (
              <SimpleCustomGridRow
                rowRef={rowRef}
                key={index}
                row={row}
                lineMode={lineMode}
                sequenceMode={sequenceMode}
                index={index}
                columeFilter={columeFilter}
                rightClickEvent={handleClickRightBodyEventCell}
                rightEventBodyMode={rightEventBodyMode === undefined ? false : true}
                isRowSelectionEvent={rowSelectionEvent === undefined ? false : true}
                selected={selectedIdx === index}
                checkBoxMode={checkBoxMode}
                onClickRow={() => {
                  if (!rowSelectionEvent) return;
                  setSelectedIdx(index);
                  rowSelectionEvent(row);
                }}
                checked={selectChecked.includes(row)}
                checkHandle={checkHandle}
              />
            ))}
            {selectedIdx}
          </CustomTableBody>
        </Table>
        {elements?.length === 0 && (
          <Stack
            height={250}
            sx={{ backgroundColor: '#fafafe', opacity: 0.5 }}
            justifyContent="center"
            alignItems="center"
          >
            <Typography variant="h5">{noDataTextMsg}</Typography>
          </Stack>
        )}
      </TableContainer>
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
