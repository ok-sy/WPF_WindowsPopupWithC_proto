import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, CLPage } from '@local/domain';
import { Portlet, PortletHeader, TitleWithReloadButton } from '@local/ui';
import { Box, CircularProgress, Grid2 } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import PageApiEdit from './components/PageApiEdit';
import PrivList from './components/PageList';

export default function PageApiRoleHome() {
  const [selectedRowData, setSelectedRowData] = useState<CLPage>();
  const [selectedPageId, setSelectedPageId] = useState<number>(0);
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [pageList, setPageList] = useState<CLPage[]>();
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!selectedRowData) return;
    setSelectedPageId(selectedRowData.pageId);
  }, [selectedRowData]);

  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clNav.pages({ ctx });
        const { pageList } = body;
        if (ctx.canceled) return;
        setPageList(pageList);
        setSelectedRowData(pageList[0]);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, refreshToken]);

  // 새로고침
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  return (
    <Box className="PageApiRoleHome-root" sx={{ ml: 1, my: 1, mr: 3 }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            width: '98%',
            height: '90vh',
            backgroundColor: 'rgba(0,0,0,0.05)',
            backdropFilter: 'blur(0.7px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress disableShrink color="primary" size="5rem" />
        </div>
      )}
      <Grid2 container columnSpacing={2}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Portlet>
            <PortletHeader>
              <TitleWithReloadButton title="페이지 목록" onClickRefresh={handleClickRefresh} />
            </PortletHeader>
            <PrivList
              selectedPageId={selectedPageId}
              pageList={pageList}
              onClickRow={(data) => setSelectedRowData(data)}
            />
          </Portlet>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 8 }}>
          {/* api 목록 */}
          <PageApiEdit
            loading={loading}
            onLoading={(loading) => setLoading(loading)}
            pageData={selectedRowData}
          />
        </Grid2>
      </Grid2>
    </Box>
  );
}
