import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CustomTableBody from '@/components/CustomTableBody';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLErrorMeta } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableCellNowrap,
  sxTableRowSelection,
  TitleWithReloadButton,
} from '@local/ui';
import { Box, Table, TableCell, TableContainer, TableRow } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import ErrorCodeRow from './components/ErrorCodeRow';
import errorCustomHandle from '@/lib/error-custom-handle';

export default function ErrorCodesHome() {
  const api = useApi();
  const [errorMetas, setErrorMetas] = useState<CLErrorMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clEtc.errorMetas({ ctx });
        const { errorMetaList } = body;
        if (ctx.canceled) return;
        setErrorMetas(errorMetaList);
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
  }, [refreshToken, doReload]);

  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  return (
    <Box className="ErrorCodesHome-root" sx={{ p: 2 }}>
      <Portlet>
        <PortletHeader>
          <TitleWithReloadButton title="에러 코드 목록" onClickRefresh={handleClickRefresh} />
        </PortletHeader>
        <PortletContent noPadding>
          <TableContainer>
            <Table>
              <CustomColoredTableHead sx={sxTableCellNowrap}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>에러명</TableCell>
                  <TableCell>에러키</TableCell>
                  <TableCell>설명</TableCell>
                </TableRow>
              </CustomColoredTableHead>
              <CustomTableBody
                stripe
                loading={loading}
                sx={flatSx(sxTableCellNowrap, sxTableRowSelection)}
              >
                {errorMetas.map((errorMeta, i) => (
                  <ErrorCodeRow key={errorMeta.errorName} seq={i + 1} err={errorMeta} />
                ))}
              </CustomTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
      </Portlet>
    </Box>
  );
}
