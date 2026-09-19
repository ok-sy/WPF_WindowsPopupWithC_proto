import CustomGrid from '@/components/CustomGrid/CustomGrid';
import type { CustomGridSubtotal, CustomGridTotal } from '@/components/CustomGrid/grid-type';
import { Portlet, PortletContent, flatSx } from '@local/ui';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import 'react-resizable/css/styles.css';
import { toast } from 'react-toastify';
import ExcelImportExport from './components/ExcelImportExport/ExcelImportExport';
import GridOption from './components/GridOption';
import { DEFAULT_COLUME, DEFAULT_SAMPLE_DATA } from './grid-sample-data';
import { SUBTOTAL_COLUME, SUBTOTAL_SAMPLE_DATA } from './grid-sample-subTotal';
import { rootSx } from './style';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
export type SubTotalKey = {
  col?: string[];
  calCol?: string;
  sign: 'sum' | 'average' | 'max' | 'min' | 'count';
};
export default function CloverDataGridHome() {
  const [refresh, setRefresh] = useState(0);

  const [sort, setSort] = useState(true);
  const [textFilter, setTextFilter] = useState(true);
  const [colFilter, setColumeFilter] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [hideHead, setHideHead] = useState(false);
  const [seq, setSeq] = useState(true);
  const [checkBoxArr, setCheckBoxArr] = useState<number[]>([]);

  const [isBasicData, setIsBasicData] = useState(true);
  const [excelExport, setExcelExport] = useState(true);
  const [stripe, setStripe] = useState(true);
  const [page, setPage] = useState(true);

  const [resize, setResize] = useState(false);

  const [multiRow, setMuiltRow] = useState<number>(0);

  const [subTotal, setSubTotal] = useState<SubTotalKey>({ sign: 'sum' });
  const [total, setTotal] = useState<CustomGridTotal[]>();
  const [autoSorting, setAutoSorting] = useState<'asc' | 'desc'>();

  const [optionRefresh, setOptionRefresh] = useState(0);

  const [rightClickEvent, setRightClickEvent] = useState(false);

  useEffect(() => {
    if (sticky && multiRow > 1) {
      setSticky(false);
      toast.warn('Multi Row가 지정되어있을때는 sticky Head 불가');
    }
  }, [sticky]);

  useEffect(() => {
    setSort(true);
    setTextFilter(true);
    setColumeFilter(true);
    setSticky(false);
    setHideHead(false);
    setSeq(true);
    setCheckBoxArr([]);
    setExcelExport(true);
    setStripe(true);
    setPage(true);
    setResize(false);
    setMuiltRow(0);
    setSubTotal({ sign: 'sum' });
    setTotal(undefined);
    setAutoSorting(undefined);
  }, [optionRefresh]);

  const checkBoxHandle = useCallback(
    (checked: boolean, idx: number) => {
      if (checked) {
        checkBoxArr.push(idx);
        setCheckBoxArr([...checkBoxArr]);
      } else {
        setCheckBoxArr(checkBoxArr.filter((el) => el !== idx));
      }
    },
    [checkBoxArr],
  );
  const data = useMemo(() => {
    return DEFAULT_SAMPLE_DATA.map((el, idx) => {
      return {
        ...el,
        checkBox: (
          <CLStyledTableCheckBox
            checked={checkBoxArr.includes(idx)}
            onChange={(e) => {
              checkBoxHandle(e.target.checked, idx);
            }}
            size="small"
            sx={{}}
          ></CLStyledTableCheckBox>
        ),
      };
    });
  }, [checkBoxArr, checkBoxHandle]);

  let subTotalModeVali: CustomGridSubtotal | undefined = undefined;

  if (subTotal === undefined) {
    subTotalModeVali = undefined;
  } else if (subTotal.calCol === undefined) {
    subTotalModeVali = undefined;
  } else if (subTotal.col === undefined) {
    subTotalModeVali = undefined;
  } else {
    subTotalModeVali = {
      sign: subTotal.sign,
      columnIds: subTotal.col,
      calculColumeId: subTotal.calCol,
      autoSorting: autoSorting,
    };
  }

  useEffect(() => {
    if (subTotal.calCol !== undefined || subTotal.col !== undefined) {
      setSort(false);
      setTextFilter(false);
      setPage(false);
      return;
    }
    if (total !== undefined) {
      setSort(false);
      setTextFilter(false);
      setPage(false);
      return;
    }
  }, [sort, textFilter, page, total, subTotal]);

  return (
    <Stack spacing={2} className="CloverDataGridHome-root" sx={flatSx(rootSx, { p: 3 })}>
      <Portlet>
        <Stack
          direction="row"
          px={3}
          py={1}
          justifyContent="space-between"
          sx={{ borderBottom: '1px solid #e0e4ee' }}
        >
          <Stack flex={1} direction="row" alignItems="center" justifyContent="space-between">
            <Stack
              flex={1}
              spacing={3}
              direction="row"
              justifyContent="flex-start"
              alignItems="center"
            >
              <Typography variant="h5">SORT & FILTER</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setRefresh(Date.now);
                  setIsBasicData(!isBasicData);
                }}
              >
                {isBasicData ? '소계, 총계 데이터로 변경' : '기존 데이터로 변경'}
              </Button>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              size="small"
              onClick={() => setOptionRefresh(Date.now)}
            >
              옵션 초기화
            </Button>
          </Stack>
        </Stack>
        <PortletContent>
          <GridOption
            sort={sort}
            setSort={setSort}
            textFilter={textFilter}
            setTextFilter={setTextFilter}
            colFilter={colFilter}
            setColumeFilter={setColumeFilter}
            sticky={sticky}
            setSticky={setSticky}
            hideHead={hideHead}
            setHideHead={setHideHead}
            seq={seq}
            setSeq={setSeq}
            isBasicData={isBasicData}
            excelExport={excelExport}
            setExcelExport={setExcelExport}
            stripe={stripe}
            setStripe={setStripe}
            page={page}
            setPage={setPage}
            resize={resize}
            setResize={setResize}
            multiRow={multiRow}
            setMuiltRow={setMuiltRow}
            subTotal={subTotal}
            setSubTotal={setSubTotal}
            autoSorting={autoSorting}
            setAutoSorting={setAutoSorting}
            rightClickEvent={rightClickEvent}
            setRightClickEvent={setRightClickEvent}
            total={total}
            optionRefresh={optionRefresh}
            setTotal={(isBasic, nonBasic) => {
              let totalTmp = [...(total ?? [])];
              // 소계 총계데이터일때
              if (isBasic !== undefined) {
                if (isBasic.age) {
                  const obj = totalTmp.findIndex((el) => el.calculColumeId === 'age');
                  if (obj === -1) {
                    totalTmp.push({ calculColumeId: 'age', sign: isBasic.sign });
                  } else {
                    totalTmp.splice(obj, 1, { calculColumeId: 'age', sign: isBasic.sign });
                  }
                } else {
                  totalTmp = totalTmp.filter((el) => el.calculColumeId !== 'age');
                }
                if (isBasic.dollar) {
                  const obj = totalTmp.findIndex((el) => el.calculColumeId === 'dollar');
                  if (obj === -1) {
                    totalTmp.push({ calculColumeId: 'dollar', sign: isBasic.sign });
                  } else {
                    totalTmp.splice(obj, 1, { calculColumeId: 'dollar', sign: isBasic.sign });
                  }
                } else {
                  totalTmp = totalTmp.filter((el) => el.calculColumeId !== 'dollar');
                }
              } else {
                // 소계 총계데이터가 아닐대(기본일때)
                if (!nonBasic) return;
                if (nonBasic.age) {
                  const obj = totalTmp.findIndex((el) => el.calculColumeId === 'age');
                  if (obj === -1) {
                    totalTmp.push({ calculColumeId: 'age', sign: nonBasic.sign });
                  } else {
                    totalTmp.splice(obj, 1, { calculColumeId: 'age', sign: nonBasic.sign });
                  }
                } else {
                  totalTmp = totalTmp.filter((el) => el.calculColumeId !== 'age');
                }
                if (nonBasic.visits) {
                  const obj = totalTmp.findIndex((el) => el.calculColumeId === 'visits');
                  if (obj === -1) {
                    totalTmp.push({ calculColumeId: 'visits', sign: nonBasic.sign });
                  } else {
                    totalTmp.splice(obj, 1, { calculColumeId: 'visits', sign: nonBasic.sign });
                  }
                } else {
                  totalTmp = totalTmp.filter((el) => el.calculColumeId !== 'visits');
                }
              }

              setTotal(totalTmp.length < 1 ? undefined : totalTmp);
            }}
          />
          {isBasicData ? (
            <CustomGrid
              key={refresh}
              sx={{ height: 400 }}
              rowData={data}
              colums={DEFAULT_COLUME}
              lineMode
              sortMode={sort}
              textFilterMode={textFilter}
              columeFilterMode={colFilter}
              stickyHeaderMode={sticky}
              hideHeaderMode={hideHead}
              sequenceMode={seq}
              reSizeMode={resize}
              excelExportMode={excelExport}
              pageNationMode={page}
              stripeMode={stripe}
              multiRowCount={multiRow}
              onReloadEvent={() => {
                setCheckBoxArr([]);
              }}
              totalMode={total}
              subtotalMode={subTotalModeVali}
              rightEventBodyMode={
                rightClickEvent
                  ? (data, rowData, idx, column) => {
                      return (
                        // 우클릭 이벤트 출력되는1 메뉴 코딩
                        <Stack p={1}>
                          <Stack direction="row" spacing={1}>
                            <Typography>(1) 값 :</Typography>
                            <Typography color="primary">{String(data)}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Typography>(2) 행 :</Typography>
                            <Typography color="primary">{rowData + ''}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Typography>(3) index :</Typography>
                            <Typography color="primary">{idx}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Typography>(4) 컬럼 :</Typography>
                            <Typography color="primary">{column.columeName}</Typography>
                          </Stack>
                        </Stack>
                      );
                    }
                  : undefined
              }
            />
          ) : (
            <CustomGrid
              key={refresh}
              sx={{ height: 500 }}
              rowData={SUBTOTAL_SAMPLE_DATA}
              colums={SUBTOTAL_COLUME}
              lineMode
              hideHeaderMode={hideHead}
              columeFilterMode={colFilter}
              stickyHeaderMode={sticky}
              sequenceMode={seq}
              reSizeMode={resize}
              onReloadEvent={() => {
                setCheckBoxArr([]);
              }}
              stripeMode={stripe}
              subtotalMode={subTotalModeVali}
              totalMode={total}
              excelExportMode={excelExport}
              // pageNationMode={page}
              pageNationMode={false}
              sortMode={false}
              textFilterMode={false}
              rightEventBodyMode={
                rightClickEvent
                  ? (data, rowData, idx, column) => {
                      return (
                        <Stack p={1}>
                          <Stack direction="row" spacing={1}>
                            <Typography>가져온 값(1) :</Typography>
                            <Typography color="primary">{String(data)}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Typography>가져온 행(2) :</Typography>
                            <Typography color="primary">{rowData + ''}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Typography>가져온 index(3) :</Typography>
                            <Typography color="primary">{idx}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Typography>가져온 컬럼(4) :</Typography>
                            <Typography color="primary">{column.columeName}</Typography>
                          </Stack>
                        </Stack>
                      );
                    }
                  : undefined
              }
            />
          )}

          {isBasicData && (
            <>
              <Stack py={1} direction="row" alignItems="center">
                <Stack direction="row">
                  checkList (체크된 순서) :{' '}
                  <Stack direction="row">
                    {checkBoxArr.map((el) => (
                      <Typography sx={{ px: 0.5 }} key={el}>
                        {el + 1}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </Stack>

              <Stack py={1} direction="row" alignItems="center">
                <Stack direction="row">
                  checkList (기본 순서) :{' '}
                  <Stack direction="row">
                    {' '}
                    {checkBoxArr
                      .slice()
                      .sort((a, b) => a - b)
                      .map((el) => (
                        <Typography sx={{ px: 0.5 }} key={el}>
                          {el + 1}
                        </Typography>
                      ))}
                  </Stack>
                </Stack>
              </Stack>
            </>
          )}
        </PortletContent>
      </Portlet>
      <Paper sx={{ px: 3, pt: 1.5, pb: 3, minHeight: 400 }}>
        <ExcelImportExport />
      </Paper>
    </Stack>
  );
}
