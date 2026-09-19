import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import { msgPrntCdKorean } from '@/lib/common-code-data';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, MsgEnumList } from '@local/domain';
import {
  Portlet,
  PortletContent,
  PortletHeader,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import {
  Box,
  LinearProgress,
  Pagination,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { rootSx } from './style';

export default function MsgMngEnumHome() {
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [enumListData, setEnumListData] = useState<MsgEnumList[]>();
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const itemsPerPage = 20; // 페이지당 보여지는 항목 수

  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };
  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clMsgMngApi.msgEnumList({ ctx });
        const { enumList } = body;
        setEnumListData(enumList);
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
    doReload(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload]);

  // 페이지 변경 시 호출되는 함수
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 현재 페이지의 데이터 계산
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = enumListData
    ?.sort((a, b) => {
      // msgId 오름차순 앞2글자 정렬 후 8자리 숫자 정렬
      const alphaComparison = a.msgId.slice(0, 2).localeCompare(b.msgId.slice(0, 2));
      if (alphaComparison !== 0) {
        return alphaComparison;
      }

      return parseInt(a.msgId.slice(2), 10) - parseInt(b.msgId.slice(2), 10);
    })
    .slice(startIndex, endIndex);

  // 페이징 있고 없고
  const pagingTf = enumListData && enumListData.length > itemsPerPage;
  return (
    <Box sx={rootSx} className="MsgMngEnumHome-root">
      <Portlet>
        <PortletHeader>
          <TitleWithReloadButton
            title="메시지 코드 목록"
            onClickRefresh={handleClickRefresh}
          ></TitleWithReloadButton>
        </PortletHeader>
        <PortletContent noPadding>
          {loading && (
            <Box className="MsgMngHome-loading-box">
              <LinearProgress />
            </Box>
          )}
          {pagingTf && (
            <Stack justifyContent="center" direction="row" alignContent="center" py={1}>
              <Pagination
                count={Math.ceil((enumListData?.length || 0) / itemsPerPage)}
                page={currentPage}
                onChange={(_, newPage) => handlePageChange(newPage)}
              />
            </Stack>
          )}
          <TableContainer
            ref={setBodyElement}
            sx={{
              maxHeight: `calc(100vh - ${bodyTop}px - 124px)`,
              minHeight: `calc(100vh - ${bodyTop}px - 124px)`,
            }}
          >
            <CLStyledTable noMargin className="MsgMngEnumHome-table">
              <CLDocTableHead className="MsgMngEnumHome-table-head">
                <TableRow>
                  <TableCell>
                    <Typography sx={{ textAlign: 'center' }}>No</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ textAlign: 'center' }}>메시지 ID</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ textAlign: 'center' }}>메시지</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ textAlign: 'center' }}>메시지 구분</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ textAlign: 'center' }}>메시지 출력</Typography>
                  </TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody stripe>
                {currentData?.map((el, idx) => {
                  const { msgClsf, msgCn, msgId, msgPrntCd } = el;
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography sx={{ textAlign: 'center' }}>{startIndex + idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ textAlign: 'center' }}>{msgId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ ml: 2 }}>{msgCn}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ textAlign: 'center' }}>{msgClsf}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ textAlign: 'center' }}>
                          {msgPrntCdKorean(msgPrntCd)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        </PortletContent>
      </Portlet>
    </Box>
  );
}
