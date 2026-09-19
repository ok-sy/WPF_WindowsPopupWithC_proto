import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { AuditLog, PagerData } from '@local/domain';
import { sleepAsync } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { SearchOption } from './common-data';
import { DEFAULT_SEARCH_OPTION } from './common-data';
import AuditLogList from './components/AuditLogList';
import AuditLogSearchBox from './components/AuditLogSearchBox';
import errorCustomHandle from '@/lib/error-custom-handle';

const rootSx: SxProps = {
  width: '100%',
  pl: 1,
  pr: 3,
  pb: 1,
};

export default function AuditLogHome() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [pagerData, setPagerData] = useState<PagerData<AuditLog>>();
  const [refreshToken, setRefreshToken] = useState(0);
  const [searchOption, setSearchOption] = useState<SearchOption>({
    ...DEFAULT_SEARCH_OPTION,
  });

  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: SearchOption) => {
      setLoading(true);
      try {
        const startTime = Date.now();
        const { body } = await api.clSystemLog.auditLogList({
          ctx,
          ...params,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
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

  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    doReload(ctx, searchOption);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, searchOption, doReload]);

  return (
    <Box className="AuditLogHome-root" sx={rootSx}>
      <AuditLogSearchBox
        loading={loading}
        onSubmit={(values) => {
          setSearchOption((p) => ({ ...p, pageNumber: 0, ...values }));
        }}
      />
      <AuditLogList
        pagerData={pagerData}
        onChangePageNumber={(page) => {
          setSearchOption((p) => ({ ...p, pageNumber: page - 1 }));
        }}
        loading={loading}
      />
    </Box>
  );
}
