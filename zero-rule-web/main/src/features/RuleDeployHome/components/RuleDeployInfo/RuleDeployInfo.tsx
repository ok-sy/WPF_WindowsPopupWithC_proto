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
import type { DepInfoRuleUsedItemDialogProps } from '@/dialogs/DepInfoRuleUsedItemDialog';
import DepInfoRuleUsedItemDialog from '@/dialogs/DepInfoRuleUsedItemDialog';
import type { DepInfoRuleUsedRuleStateDialogProps } from '@/dialogs/DepInfoRuleUsedRuleStateDialog';
import DepInfoRuleUsedRuleStateDialog from '@/dialogs/DepInfoRuleUsedRuleStateDialog';
import { formatDate } from '@/features/EmailTransInfoHome/EmailTransInfoHome';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { useElementLeftTop } from '@local/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import type {
  ApiRequestContext,
  GridColumn,
  GridColumnInsert,
  GridFilterInsert,
  GridList,
  RuleDeployHistory,
} from '@local/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Zoom } from 'react-awesome-reveal';
import { toast } from 'react-toastify';
import { ruleDeployInfoSx } from '../../style';
import RuleDeployInfoSearch from './components/RuleDeployInfoSearch';
const COLUMN_DATA: CustomGridColumn[] = [
  {
    columeId: 'deployDatetime',
    columeName: '룰배포일시',
    columeType: 'string',
    textAlign: 'center',
  },
  {
    columeId: 'beforeDeployApplyYn',
    columeName: '룰배포전운영상태',
    columeType: 'string',
    textAlign: 'center',
  },
  {
    columeId: 'afterDeployApplyYn',
    columeName: '룰배포후상태',
    columeType: 'string',
    textAlign: 'center',
  },
  { columeId: 'ruleUpdateYn', columeName: '룰변경여부', columeType: 'string', textAlign: 'center' },
  { columeId: 'ifid', columeName: '인터페이스ID', columeType: 'string', textAlign: 'center' },
  { columeId: 'ruleid', columeName: '룰ID', columeType: 'string', textAlign: 'center' },
  {
    columeId: 'ruleNm',
    columeName: '룰명',
    columeType: 'string',
    textAlign: 'center',
  },
  { columeId: 'ruleCallD3', columeName: '룰호출건수D3', columeType: 'number', textAlign: 'right' },
  {
    columeId: 'ruleCheckD3',
    columeName: '점검건수D3',
    columeType: 'number',
    textAlign: 'right',
  },
  { columeId: 'deployUserid', columeName: '배포자', columeType: 'string', textAlign: 'center' },
  {
    columeId: 'usedItemCnt',
    columeName: '사용하는항목수',
    columeType: 'string',
    textAlign: 'right',
    maxWidth: 85,
  },
  {
    columeId: 'usedRuleCnt',
    columeName: '사용하는룰수',
    columeType: 'string',
    textAlign: 'right',
    maxWidth: 85,
  },
  { columeId: 'ruleVerno', columeName: '룰버전', columeType: 'number', textAlign: 'center' },
];
export type ParamDataType = {
  ifid?: string;
  ruleNm?: string;
  deployUserid?: string;
  fromDt: string;
  toDt: string;
};

const currentDate: Date = new Date();
const sevenDaysAgo: Date = new Date();
sevenDaysAgo.setDate(currentDate.getDate() - 7);
export const DEFAULT_PARAM_DATA: ParamDataType = {
  fromDt: formatDate(sevenDaysAgo),
  toDt: formatDate(currentDate),
};
type DialogIds = 'DepInfoRuleUsedItemDialog' | 'DepInfoRuleUsedRuleStateDialog';
export default function RuleDeployInfo() {
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [dataLists, setDataList] = useState<RuleDeployHistory[]>([]);
  const [paramData, setParamData] = useState<ParamDataType>({ ...DEFAULT_PARAM_DATA });
  const [dialogId, setDialogId] = useState<DialogIds>();

  const [gridFilter, setGridFilter] = useState<GridList[]>();
  const [selectGridFilter, setSelectGridFilter] = useState<GridList>();
  const [filterRefreshToken, setFilterRefreshToken] = useState(0);

  const login = useLoginProfile();

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

  // 룰에서 사용하는 항목리스트 팝업 props
  const [depInfoRuleUsedItemDialogProps, setDepInfoRuleUsedItemDialogProps] =
    useState<DepInfoRuleUsedItemDialogProps>();
  // 룰에서 사용하는 룰 현재상태 팝업 props
  const [depInfoRuleUsedRuleStateDialogProps, setDepInfoRuleUsedRuleStateDialogProps] =
    useState<DepInfoRuleUsedRuleStateDialogProps>();

  const closeDioalog = () => {
    setDialogId(undefined);
    setDepInfoRuleUsedItemDialogProps(undefined);
    setDepInfoRuleUsedRuleStateDialogProps(undefined);
  };
  const openDialog = (data: RuleDeployHistory, name: string) => {
    if (name === 'item') {
      setDialogId('DepInfoRuleUsedItemDialog');
      setDepInfoRuleUsedItemDialogProps({
        open: true,
        onClose: () => {
          closeDioalog();
          setRefreshToken(Date.now());
        },
        data,
      });
    } else if (name === 'rule') {
      setDialogId('DepInfoRuleUsedRuleStateDialog');
      setDepInfoRuleUsedRuleStateDialogProps({
        open: true,
        onClose: () => {
          closeDioalog();
          setRefreshToken(Date.now());
        },
        data,
      });
    }
  };
  // 목록조회 API
  const doReload = useCallback(
    async (params: ParamDataType, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.rule.ruleDeployHis({ ctx, ...params });
        setDataList(body.deployHis);
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
    const dataSet = {
      ifid: paramData.ifid,
      ruleNm: paramData.ruleNm,
      deployUserid: paramData.deployUserid,
      fromDt: paramData.fromDt,
      toDt: paramData.toDt,
    };
    doReload(dataSet, ctx);
  }, [paramData, doReload, refreshToken]);

  const onClickCellDialogHandle = (
    value: string | number | boolean,
    index: number,
    data: any,
    columeId: string,
  ) => {
    if (!data) return;
    let name = '';
    if (columeId === 'usedItemCnt') {
      name = 'item';
    } else {
      name = 'rule';
    }
    openDialog(data, name);
  };
  const columnData = useMemo(() => {
    return COLUMN_DATA.map((el) => ({
      ...el,
      onClickEvent:
        el.columeId === 'usedItemCnt'
          ? onClickCellDialogHandle
          : el.columeId === 'usedRuleCnt'
            ? onClickCellDialogHandle
            : undefined,
    }));
  }, []);
  const dataSet = dataLists.map((el) => {
    return {
      deployDatetime: el.deployDatetime,
      beforeDeployApplyYn:
        el.beforeDeployApplyYn === 'N' ? '미적용' : el.beforeDeployApplyYn === 'Y' ? '적용' : '-',
      afterDeployApplyYn:
        el.afterDeployApplyYn === 'N' ? '미적용' : el.afterDeployApplyYn === 'Y' ? '적용' : '-',
      ruleUpdateYn: el.ruleUpdateYn === 'N' ? '무' : '유',
      ifid: el.ifid,
      ruleid: el.ruleid,
      ruleNm: el.ruleNm,
      deployUserid: el.deployUserid,
      usedItemCnt: el.usedItemCnt,
      usedRuleCnt: el.usedRuleCnt,
      ruleVerno: Number(el.ruleVerno).toFixed(2),
      ruleCallD3: String(el.ruleCallD3),
      ruleCheckD3: String(el.ruleCheckD3),
    };
  });

  // 목록조회 API
  const doGridReLoad = useCallback(
    async (ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.grid.gridList({ ctx, pageCode: '02' });
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

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doGridReLoad(ctx);
  }, [doGridReLoad, filterRefreshToken]);

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
    <Box sx={ruleDeployInfoSx(bodyTop)} className="RuleDeployInfo-root">
      {loading && (
        <Box sx={{ position: 'absolute', top: -15, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
      {/* 검색 */}
      <RuleDeployInfoSearch
        onSubmit={(data) => {
          setParamData({ ...data });
          setRefreshToken(Date.now());
        }}
      />
      {/* 룰배포리스트 */}
      <Stack pt={1} direction="row" alignItems={'center'} justifyContent="space-between">
        <Stack direction="row" alignItems="center">
          <SubTitleAndIcon labelTitle="룰배포 리스트" sx={{ my: 1 }} />
          {!!dataSet && dataSet.length > 0 && (
            <Typography
              variant="body2"
              component="div"
              sx={{ display: 'flex', color: '#888', ml: 1 }}
            >
              <Zoom
                duration={700}
                style={{ color: 'Highlight' }}
                className="CodeTypeList-resultCount"
                key={dataSet.length}
              >
                {dataSet?.length}
              </Zoom>
              건
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
              setRefreshToken(Date.now);
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
              doFilterDel({ pageCode: '02', filterNm: selectGridFilter.filterNm }, ctx).then(() => {
                toast.success('필터삭제 완료');
                setFilterRefreshToken(Date.now);
              });
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
                    pageCode: '02',
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
      <SimpleCustomGrid<RuleDeployHistory>
        sx={{
          maxHeight: `calc(100vh - ${bodyTop}px - 64px)`,
          minHeight: `calc(100vh - ${bodyTop}px - 64px)`,
        }}
        colums={columnData}
        rowData={dataSet}
        sortMode
        columeFilterMode
        lineMode
        excelExportMode
        textFilterSelMode
        noDataTextMsg="조회결과가 없습니다."
        stickyHeaderMode
        containerRef={setBodyElement}
        refreshAllRowData={refreshToken}
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
            pageCode: '02',
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

            let filteringText: string | undefined;
            let filteringOperCode: string | undefined;
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

      {dialogId === 'DepInfoRuleUsedItemDialog' && depInfoRuleUsedItemDialogProps && (
        <DepInfoRuleUsedItemDialog {...depInfoRuleUsedItemDialogProps} />
      )}
      {dialogId === 'DepInfoRuleUsedRuleStateDialog' && depInfoRuleUsedRuleStateDialogProps && (
        <DepInfoRuleUsedRuleStateDialog {...depInfoRuleUsedRuleStateDialogProps} />
      )}
    </Box>
  );
}
