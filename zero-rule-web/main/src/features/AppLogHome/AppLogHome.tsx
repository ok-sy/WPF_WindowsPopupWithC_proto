import handleError from '@/lib/handle-error';
import { useApi } from '@/provider/ApiProvider';
import type { ApiRequestContext } from '@local/domain';
import type { AppLog, PagerData } from '@local/domain';
import { pdate } from '@local/util';
import { sleepAsync } from '@local/ui';
import { Box, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { SearchOptions } from './components/AppLogSearchBox';
import AppLogSearchBox from './components/AppLogSearchBox';
import AppLogTable from './components/AppLogTable';
import errorCustomHandle from '@/lib/error-custom-handle';

type SearchRequest = {
  rowsPerPage: number;
  pageNumber: number;
} & SearchOptions;
const ROWS_PER_PAGE = 20;

export default function AppLogHome() {
  const api = useApi();
  const [searchRequest, setSearchRequest] = useState<SearchRequest>({
    pageNumber: 0,
    rowsPerPage: ROWS_PER_PAGE,
  });
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [appLogPagerData, setAppLogPagerData] = useState<PagerData<AppLog>>();

  const reloadData = useCallback(
    async (ctx: ApiRequestContext, searchRequest: SearchRequest) => {
      setLoading(true);
      let logYyyymmdd: string | undefined = undefined;
      const { logDate, ...restParams } = searchRequest;
      if (logDate) {
        logYyyymmdd = pdate.formatter.yyyymmdd(logDate);
      }
      try {
        const startTime = Date.now();
        const { body } = await api.clSystemLog.appLogList({
          ctx,
          logYyyymmdd,
          ...restParams,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
          await sleepAsync(200);
        }
        setAppLogPagerData(pagerData);
      } catch (err: any) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    reloadData(ctx, searchRequest);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, searchRequest, reloadData]);

  const handleChangeSearchOptions = (options: SearchOptions) => {
    setSearchRequest((prev) => ({ ...prev, ...options }));
  };

  // 검색 버튼 클릭
  const handleClickSearchBtn = () => {
    setRefreshToken(Date.now());
  };

  // 페이지 번호 클릭
  const handleClickPageNum = (pageNumber: number) => {
    setSearchRequest({ ...searchRequest, pageNumber });
  };

  const {
    elements: appLogList = [],
    totalPages = 0,
    pageNumber = 0,
    totalElements = 0,
  } = appLogPagerData || {};

  return (
    <Box
      className="AppLogHome-root"
      sx={{
        pl: 1,
        pr: 3,
        py: 1,
      }}
    >
      <AppLogSearchBox
        onSearchOptionChange={handleChangeSearchOptions}
        loading={loading}
        onSearchClick={handleClickSearchBtn}
      />
      <Box>
        <Typography variant="caption">검색 결과 {totalElements ?? 0}건</Typography>
      </Box>
      <AppLogTable
        appLogList={appLogList}
        loading={loading}
        totalPages={totalPages ?? 0}
        pageNumber={pageNumber}
        onPageClick={handleClickPageNum}
      />
    </Box>
  );
}
