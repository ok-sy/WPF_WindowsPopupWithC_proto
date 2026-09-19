import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CustomTableBody from '@/components/CustomTableBody';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { parray, pstring } from '@cp949/pjs';
import type { CLJob, CLJobLog, CLLogLevelKey, PagerData } from '@local/domain';
import { pdate } from '@local/util';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sleepAsync,
  sxTableCellNowrap,
  sxTableRowSelection,
} from '@local/ui';
import {
  Box,
  Pagination,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableRow,
  Grid2,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import JobLogSearchBox from './components/JobLogSearchBox';
import JobLogTableRow from './components/JobLogTableRow';
import JobListSideTable from './components/SideJobList';
import { rootSx } from './style';
import errorCustomHandle from '@/lib/error-custom-handle';

const ROWS_PER_PAGE = 50;

type SearchRequest = {
  pageNumber: number;
  rowsPerPage: number;
  jobId?: string;
  logYyyymmdd?: string;
  logLevels: CLLogLevelKey[];
};

export default function JobLogList() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [pagerData, setPagerData] = useState<PagerData<CLJobLog>>();
  const [searchRequest, setSearchRequest] = useState<SearchRequest>({
    pageNumber: 0,
    rowsPerPage: ROWS_PER_PAGE,
    logLevels: [],
  });
  const [jobConfigList, setJobConfigList] = useState<CLJob[]>([]);

  // job목록 조회
  const doReloadJobData = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clJob.list({ ctx });
        const { jobList } = body;
        if (ctx.canceled) return;
        setJobConfigList(jobList);
      } catch (err: any) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // api
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    doReloadJobData(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReloadJobData]);

  // joblog 목록 조회
  const doReloadData = useCallback(
    async (ctx: ApiRequestContext, searchRequest: SearchRequest) => {
      setLoading(true);
      try {
        const startTime = Date.now();
        const { body } = await api.clSystemLog.jobLogList({ ctx, ...searchRequest });
        const { pagerData } = body;
        if (ctx.canceled) return;
        const elapsed = Date.now() - startTime;
        if (elapsed < 200) {
          await sleepAsync(200);
        }
        setPagerData(pagerData);
      } catch (err: any) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // api
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    doReloadData(ctx, searchRequest);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [searchRequest, doReloadData]);

  // LogLevel 체크박스 클릭
  const handleChangeLogLevel = (name: CLLogLevelKey, checked: boolean) => {
    let logLevels = searchRequest.logLevels ?? [];
    if (checked) {
      logLevels = [...logLevels, name];
    } else {
      logLevels = logLevels.filter((v) => v !== name);
    }

    // LogLevel은 체크하자마자, 검색버튼 안눌러도 바로 조회
    setSearchRequest((p) => ({ ...p, logLevels, pageNumber: 0 }));
  };

  // 검색 버튼 클릭
  const handleClickSearchBtn = () => {
    setSearchRequest((p) => ({ ...p, pageNumber: 0 }));
  };

  // 검색조건: 로그 일자 수정
  const handleChangeLogYyyymmdd = (pickedDate: Date | null) => {
    if (pickedDate) {
      const logYyyymmdd = pdate.formatter.yyyymmdd(pickedDate);

      // 날짜를 정상적으로 입력하자마자, 검색버튼 안눌러도 바로 조회
      if (logYyyymmdd && pstring.isNotBlank(logYyyymmdd)) {
        setSearchRequest((p) => ({ ...p, logYyyymmdd, pageNumber: 0 }));
      }
    } else {
      setSearchRequest((p) => ({ ...p, logYyyymmdd: undefined, pageNumber: 0 }));
    }
  };

  const {
    totalPages = 0,
    pageNumber = 0,
    elements = [],
    offset = 0,
    totalElements = 0,
  } = pagerData ?? {};
  const itemNumMax = totalElements - offset;

  const { jobId, logLevels, logYyyymmdd } = searchRequest;
  const logDate = pdate.parser.yyyymmdd(logYyyymmdd);

  const [lastSelectedId, setLastSelectedId] = useState<number>();
  const updateSelectedId = (id: number) => {
    setLastSelectedId(id);
  };

  return (
    <Grid2 container columnSpacing={1} className="JobLogList-root" sx={rootSx}>
      <Grid2 size={{ xs: 12, md: 2 }}>
        <JobListSideTable
          jobList={jobConfigList}
          onSelected={(jobId) => setSearchRequest((prev) => ({ ...prev, jobId, pageNumber: 0 }))}
          selectedJobId={jobId}
        />
      </Grid2>
      <Grid2 size={{ xs: 12, md: 10 }}>
        <JobLogSearchBox
          logLevels={logLevels}
          logDate={logDate}
          loading={loading}
          totalElements={totalElements}
          onCheckBoxChange={handleChangeLogLevel}
          onDateChange={handleChangeLogYyyymmdd}
          onClick={handleClickSearchBtn}
        />
        {parray.isEmpty(elements) && !loading && (
          <Paper className="JobLogList-noDataContainer">
            <Box className="JobLogList-noDataImgBox">
              <Box component="img" src="/images/log/no_data_image.jpg" alt="" />
            </Box>
            <Box className="JobLogList-noDataTitle">NO DATA FOUND</Box>
          </Paper>
        )}
        {parray.isNotEmpty(elements) && (
          <Portlet>
            {totalPages > 1 && (
              <PortletHeader>
                <Pagination
                  page={pageNumber + 1}
                  count={totalPages}
                  onChange={(e, page) =>
                    setSearchRequest((prev) => ({ ...prev, pageNumber: page - 1 }))
                  }
                />
              </PortletHeader>
            )}
            <PortletContent noPadding>
              <TableContainer>
                <Table>
                  <CustomColoredTableHead sx={sxTableCellNowrap}>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Msg</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>JobId/Server</TableCell>
                    </TableRow>
                  </CustomColoredTableHead>
                  <CustomTableBody
                    loading={loading}
                    sx={flatSx(sxTableCellNowrap, sxTableRowSelection)}
                  >
                    {elements.map((jobLog, idx) => (
                      <JobLogTableRow
                        key={jobLog.logId}
                        seq={itemNumMax - idx}
                        jobLog={jobLog}
                        onClick={() => updateSelectedId(jobLog.logId)}
                        className={clsx({
                          x_selected: jobLog.logId === lastSelectedId,
                        })}
                      />
                    ))}
                  </CustomTableBody>
                </Table>
              </TableContainer>
            </PortletContent>
          </Portlet>
        )}
      </Grid2>
    </Grid2>
  );
}
