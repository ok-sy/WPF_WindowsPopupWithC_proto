import { useLoginProfile } from '@/auth/useLoginProfile';
import CLStyledSelect from '@/components/CLStyledSelect/CLStyledSelect';
import {
  colTypeCodeChange,
  colTypeCodeReverseChange,
  numOperCodeChange,
  numOperCodeReverseChange,
  strOperCodeChange,
  strOperCodeReverseChange,
} from '@/components/CustomGrid/grid-fn';
import type {
  CustomGridColumn,
  CustomGridColumnsView,
  CustomGridFilterNumType,
  CustomGridFilterType,
  CustomGridSortingType,
} from '@/components/CustomGrid/grid-type';
import SimpleCustomGrid from '@/components/SimpleCustomGrid/SimpleCustomGrid';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type {
  ApiRequestContext,
  EmailTransInfo,
  GridColumn,
  GridColumnInsert,
  GridFilterInsert,
  GridList,
} from '@local/domain';
import { Portlet, PortletContent, useElementLeftTop } from '@local/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import EmailTransInfoSearch from './components/EmailTransInfoSearch';
import { rootSx } from './styls';
export type ParamData = {
  empId?: string;
  emailTransceiveTypeCd?: string;
  fromDt: string;
  toDt: string;
  // pageNumber: number
  // rowsPerPage: number
};
export const formatDate = (date: Date): string => {
  return date.toISOString().substr(0, 10).replace(/-/g, '');
};

const currentDate: Date = new Date();
const sevenDaysAgo: Date = new Date();
sevenDaysAgo.setDate(currentDate.getDate() - 7);
export const DEFAULT_PARAM_DATA: ParamData = {
  empId: '',
  emailTransceiveTypeCd: '',
  fromDt: formatDate(sevenDaysAgo),
  toDt: formatDate(currentDate),
  // pageNumber: 0,
  // rowsPerPage: 100000,
};
const COLUMN_DATA: CustomGridColumn[] = [
  {
    columeId: 'emailTransceiveTypeCd',
    columeName: '송수신코드',
    columeType: 'string',
    textAlign: 'center',
  },
  {
    columeId: 'emailTracsceiveDatetime',
    columeName: '이메일송수신시간',
    columeType: 'string',
    textAlign: 'center',
  },
  { columeId: 'empId', columeName: 'ID', columeType: 'string', textAlign: 'center', maxWidth: 140 },
  { columeId: 'departmentCd', columeName: '부서명', columeType: 'string', textAlign: 'center' },
  { columeId: 'opponentEmailDomainAddr', columeName: '대상이메일도메인', columeType: 'string' },
  { columeId: 'emailTitle', columeName: '메일제목', columeType: 'string', maxWidth: 300 },
  {
    columeId: 'fileAttachYn',
    columeName: '첨부파일여부',
    columeType: 'string',
    textAlign: 'center',
  },
  { columeId: 'fileAttachSize', columeName: '첨부파일용량(kb)', columeType: 'number' },
  {
    columeId: 'inspectionYn',
    columeName: '점검결과',
    columeType: 'string',
    textAlign: 'center',
    maxWidth: 120,
  },
  { columeId: 'callRuleResult', columeName: '룰호출결과', columeType: 'string' },
];

export default function EmailTransInfoHome() {
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [filterRefreshToken, setFilterRefreshToken] = useState(0);
  const [listData, setListData] = useState<EmailTransInfo[]>();
  const [paramData, setParamData] = useState<ParamData>({ ...DEFAULT_PARAM_DATA });
  const observer = useRef<IntersectionObserver | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const [gridFilter, setGridFilter] = useState<GridList[]>();
  const [selectGridFilter, setSelectGridFilter] = useState<GridList>();

  const login = useLoginProfile();

  // const {
  //   totalPages = 0,
  //   pageNumber = 0,
  //   elements = [],
  //   offset = 0,
  //   totalElements = 0,
  // } = listData ?? {}

  // 목록조회 API
  const doGridReLoad = useCallback(
    async (ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.grid.gridList({ ctx, pageCode: '01' });
        if (ctx.canceled) return;

        setGridFilter(body.list);
        setSelectGridFilter(body.list.find((el) => el.defaultYn === 'Y'));
        return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // 목록조회 API
  const doFilterDel = useCallback(
    async (
      params: {
        pageCode: string;
        filterNm: string;
      },
      ctx: ApiRequestContext,
    ) => {
      try {
        setLoading(true);
        const { body } = await api.grid.deleteGrid({ ...params, ctx });
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  // const loadMoreRef = useCallback(
  //   (node: HTMLTableRowElement | null) => {
  //     if (loading) return
  //     if (observer.current) observer.current.disconnect()
  //     observer.current = new IntersectionObserver((entries) => {
  //       if (entries[0].isIntersecting) {
  //         setParamData((prev) => {
  //           if (prev.rowsPerPage < totalElements) {
  //             return { ...prev, rowsPerPage: prev.rowsPerPage + 20 }
  //           } else {
  //             return prev
  //           }
  //         })
  //       }
  //     })
  //     if (node) observer.current.observe(node)
  //   },
  //   [loading, totalElements],
  // )

  // 목록조회 API
  const doReLoad = useCallback(
    async (params: ParamData, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.emailTransInfo.emailTransInfoList({ ctx, ...params });
        if (ctx.canceled) return;
        setListData(body.list);
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const emailTransceiveTypeCd =
      paramData.emailTransceiveTypeCd === 'A' ? '' : paramData.emailTransceiveTypeCd;
    const dataSet = {
      empId: paramData.empId,
      emailTransceiveTypeCd: emailTransceiveTypeCd,
      fromDt: paramData.fromDt,
      toDt: paramData.toDt,
      // pageNumber: paramData.pageNumber,
      // rowsPerPage: paramData.rowsPerPage,
    };
    doReLoad(dataSet, ctx);
  }, [doReLoad, refreshToken, paramData]);

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doGridReLoad(ctx);
  }, [doGridReLoad, filterRefreshToken]);

  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  };
  const dataSet = listData?.map((el, idx) => {
    return {
      emailTracsceiveDatetime: el.emailTracsceiveDatetime,
      emailTransceiveTypeCd: el.emailTransceiveTypeCd,
      empId: el.empId,
      opponentEmailDomainAddr: el.opponentEmailDomainAddr,
      fileAttachYn: el.fileAttachYn,
      fileAttachSize: el.fileAttachSize,
      emailTitle: el.emailTitle,
      departmentCd: el.departmentCd,
      regDatetime: el.regDatetime,
      inspectionYn: el.inspectionYn,
      callRuleResult:
        el.callRuleResult === null || el.callRuleResult === undefined ? '-' : el.callRuleResult,
    };
  });

  const doFilterSave = useCallback(
    async (params: { filter: GridFilterInsert; columns: GridColumnInsert[] }) => {
      try {
        setLoading(true);
        const { body } = await api.grid.gridInsert({ ...params });
        if (body === undefined) {
          return;
        }
        return params;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const doUpdateDefaultYn = useCallback(
    async (params: { pageCode: string; filterNm?: string; defaultYn: string }) => {
      try {
        setLoading(true);
        const { body } = await api.grid.updateDefaultYn({ ...params });
        return body;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const filterNmArr = gridFilter?.map((el) => el.filterNm);

  const defaultColFil: CustomGridColumnsView[] | undefined = selectGridFilter?.columns.map(
    (el) => ({
      columnId: el.columnId,
      isVisiable: el.visiableYn === 'Y' ? true : false,
    }),
  );

  const gridFilterType: CustomGridFilterType[] = selectGridFilter?.columns
    .filter((el) => el.columnTypeCode === 'str')
    .map((el) => ({
      columeId: el.columnId,
      keyword: el.filteringText,
      operator: strOperCodeReverseChange(el.filteringOperCode ?? ''),
    }))
    .filter((el) => !!el) as CustomGridFilterType[];

  const gridNumFilterType: CustomGridFilterNumType[] = selectGridFilter?.columns
    .filter((el) => el.columnTypeCode === 'num')
    .map((el) => {
      if (el.filteringText === undefined) return;
      if (el.filteringText === null) return;
      const valueInfo = el.filteringText.split(',');
      return {
        columeId: el.columnId,
        minValue: Number(valueInfo[0]),
        maxValue: Number(valueInfo[1]),
        operValue: Number(valueInfo[2]),
        numOperator: numOperCodeReverseChange(el.filteringOperCode ?? ''),
      } as CustomGridFilterNumType;
    })
    .filter((el) => !!el) as CustomGridFilterNumType[];

  const sortingCol = selectGridFilter?.columns.filter(
    (el) => el.sortingInfo === 'asc' || el.sortingInfo === 'basic' || el.sortingInfo === 'desc',
  );
  //@ts-ignore
  const sortingData: CustomGridSortingType | undefined =
    sortingCol === undefined
      ? undefined
      : sortingCol.length < 1
        ? undefined
        : {
            columeId: sortingCol[0].columnId,
            columeType: colTypeCodeReverseChange(sortingCol[0].columnTypeCode ?? ''),
            order: sortingCol[0].sortingInfo,
          };

  return (
    <Box sx={rootSx(bodyTop)} className="EmailTransInfoHome-root">
      <Portlet>
        <PortletContent>
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
              <LinearProgress />
            </Box>
          )}
          {/* 조회 */}
          <EmailTransInfoSearch
            data={paramData}
            onSubmitData={(data) => {
              setRefreshToken(Date.now);
              setParamData({ ...data });
            }}
            scrollToTop={scrollToTop}
          />
          <Divider sx={{ mb: 1.5 }} />
          {/* 조회결과 */}
          <Stack mb={0.5} direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center">
              <SubTitleAndIcon labelTitle="조회결과" sx={{}} />
              {!!listData && listData.length > 0 && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    display: 'flex',
                    color: '#888',
                    ml: 1,
                    em: {
                      fontStyle: 'normal',
                      color: 'blue',
                    },
                  }}
                >
                  <em>{listData?.length}</em>건
                </Typography>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography>내 필터목록 :</Typography>

              <CLStyledSelect
                sx={{ width: 150 }}
                MenuProps={{ sx: { maxHeight: 400 } }}
                onChange={(e) => {
                  if (!gridFilter) return;
                  // setRefreshToken(Date.now)
                  setSelectGridFilter(gridFilter.find((el) => el.filterNm === e.target.value));
                }}
                value={selectGridFilter?.filterNm ?? '선택'}
                fullWidth
                size="small"
              >
                <MenuItem value={'선택'} color="inherit">
                  선택
                </MenuItem>
                {filterNmArr?.map((el) => (
                  <MenuItem value={el} color="inherit" key={el}>
                    {el}
                  </MenuItem>
                ))}
              </CLStyledSelect>
              <IconButton
                onClick={() => {
                  if (!selectGridFilter) return;
                  if (!selectGridFilter.filterNm) return;
                  const ctx = { canceled: false } as ApiRequestContext;
                  doFilterDel({ pageCode: '01', filterNm: selectGridFilter.filterNm }, ctx).then(
                    () => {
                      toast.success('필터삭제 완료');
                      setFilterRefreshToken(Date.now);
                    },
                  );
                }}
                color="warning"
                disabled={selectGridFilter === undefined}
                size="small"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
              <FormControlLabel
                sx={{ pl: 1 }}
                control={
                  <Checkbox
                    size="small"
                    sx={{ width: 25, height: 25 }}
                    checked={selectGridFilter?.defaultYn === 'Y'}
                    onChange={(e, checked) => {
                      if (selectGridFilter === undefined) {
                        toast.warn('먼저 필터를 선택해주세요');
                        return;
                      }
                      doUpdateDefaultYn({
                        pageCode: '01',
                        filterNm: selectGridFilter.filterNm,
                        defaultYn: checked ? 'Y' : 'N',
                      }).then((result) => {
                        setFilterRefreshToken(Date.now);
                        if (result === 0) {
                          toast.success('해제 완료');
                        } else {
                          toast.success('저장 완료');
                        }
                      });
                    }}
                  />
                }
                label={'현재필터 계속 사용'}
              />
            </Stack>
          </Stack>
          <SimpleCustomGrid<EmailTransInfo>
            sx={{
              maxHeight: `calc(100vh - ${bodyTop}px - 52px)`,
              minHeight: `calc(100vh - ${bodyTop}px - 52px)`,
            }}
            rowData={dataSet ?? []}
            colums={COLUMN_DATA}
            sortMode
            columeFilterMode
            lineMode
            excelExportMode
            textFilterSelMode
            stickyHeaderMode
            containerRef={(el) => {
              setBodyElement(el);
              tableContainerRef.current = el;
            }}
            refreshAllRowData={refreshToken}
            noDataTextMsg="조회결과가 없습니다."
            strFilteringdata={gridFilterType}
            numFilteringdata={gridNumFilterType}
            columnsView={defaultColFil}
            setSortingData={sortingData}
            textFilterTf={selectGridFilter?.filterModeYn === 'Y' ? true : false}
            allFilteringdata={(
              filterNm,
              filtering,
              numFiltering,
              columeFilter,
              textFilterMode,
              sorting,
            ) => {
              if (!login?.profile?.userId) return;
              const filterInfo: GridFilterInsert = {
                filterNm: filterNm,
                pageCode: '01',
                filterModeYn: textFilterMode ? 'Y' : 'N',
                defaultYn: 'N',
              };
              const colummnsInfo: GridColumnInsert[] = columeFilter.map((el, idx) => {
                const numFilteringInfo: CustomGridFilterNumType | undefined = numFiltering.find(
                  (num) => el.columeId === num.columeId,
                );
                const filteringInfo: CustomGridFilterType | undefined = filtering.find(
                  (str) => el.columeId === str.columeId,
                );
                const sortingInfo: CustomGridSortingType | undefined =
                  sorting === undefined
                    ? undefined
                    : sorting.columeId === el.columeId
                      ? sorting
                      : undefined;

                let filteringText: string | undefined = undefined;
                let filteringOperCode: string | undefined = undefined;
                if (el.columeType === 'number') {
                  if (numFilteringInfo) {
                    filteringText = `${numFilteringInfo?.minValue ?? ' '},${
                      numFilteringInfo?.maxValue ?? ' '
                    },${numFilteringInfo?.operValue ?? ' '}`;
                    filteringOperCode = numOperCodeChange(numFilteringInfo.numOperator);
                  }
                } else {
                  if (filteringInfo) {
                    filteringText = filteringInfo.keyword;
                    filteringOperCode = strOperCodeChange(filteringInfo.operator);
                  }
                }
                return {
                  columnId: el.columeId,
                  visiableYn: el.isVisiable ? 'Y' : 'N',
                  filteringText: filteringText,
                  filteringOperCode: filteringOperCode,
                  columnSeq: idx + 1,
                  columnTypeCode: colTypeCodeChange(el.columeType),
                  sortingInfo: sortingInfo?.order ?? undefined,
                };
              });
              doFilterSave({ filter: filterInfo, columns: colummnsInfo }).then(
                (param: { filter: GridFilterInsert; columns: GridColumnInsert[] } | undefined) => {
                  setFilterRefreshToken(Date.now);
                  if (param !== undefined) {
                    toast.success('필터가 저장되었습니다.');
                    const gridCol: GridColumn[] = [...param.columns] as GridColumn[];
                    setSelectGridFilter({ columns: gridCol, ...param.filter });
                  }
                },
              );
            }}
          />
        </PortletContent>
      </Portlet>
    </Box>
  );
}
