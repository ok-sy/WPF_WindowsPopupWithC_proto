import BbsPagination from '@/components/BbsPagination';
import CustomTableBody from '@/components/CustomTableBody';
import type { PdsViewDialogProps } from '@/dialogs/PdsViewDialog';
import PdsViewDialog from '@/dialogs/PdsViewDialog';
import useElementOffsetInMainLayout from '@/hooks/useElementOffsetInMainLayout';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext, PagerData, PdsSimple } from '@local/domain';
import { Portlet, PortletContent } from '@local/ui';
import {
  Box,
  Button,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import PdsRow from './PdsRow';
import { rootSx } from './style';
import errorCustomHandle from '@/lib/error-custom-handle';

type SearchOption = {
  rowsPerPage: number;
  pageNumber: number;
  title?: string;
};

const DEFAULT_SEARCH_OPTIONS = {
  rowsPerPage: 50,
  pageNumber: 0,
};

type DialogId = 'PdsViewDialog';

type Props = {
  // postId 파라미터가 전달되면 시작할때 상세보기 다이얼로그 띄움
  pdsId?: number;
};

export default function PdsHome(props: Props) {
  const api = useApi();

  const { sceneManager } = useMainLayoutContext();

  // 로딩중 여부
  const [loading, setLoading] = useState(false);

  // 검색 조건
  const [searchOption, setSearchOption] = useState<SearchOption>(DEFAULT_SEARCH_OPTIONS);

  // 검색결과 페이지 데이터
  const [pdsPagerData, setPdsPagerData] = useState<PagerData<PdsSimple>>();

  // 마지막으로 선택한 행
  const [lastSelectedId, setLastSelectedId] = useState<string | number>();

  // 다이얼로그 ID
  const [dialogId, setDialogId] = useState<DialogId>();

  // 상세보기 다이얼로그 Props
  const [pdsViewDialogProps, setPdsViewDialogProps] = useState<PdsViewDialogProps>();

  // body content 위치 설정용
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);
  const { y: contentTop } = useElementOffsetInMainLayout(contentElement, []);

  // 새로고침 토큰
  const [refreshToken, setRefreshToken] = useState(0);

  // 다이얼로그 닫기
  const closeDialog = useCallback(() => {
    setDialogId(undefined);
    setPdsViewDialogProps(undefined);
  }, []);

  // PDS 게시물 상세보기 다이얼로그 띄우기
  const openPdsViewDialog = useCallback(
    (pdsId: number, resetUrl = false) => {
      setLastSelectedId(pdsId);
      setDialogId('PdsViewDialog');
      setPdsViewDialogProps({
        open: true,
        pdsId,
        onClose: () => {
          closeDialog();
          if (resetUrl) {
            // routerPush('/pds/list')
            sceneManager.replaceScene('/pds/list');
          }
        },
        onDeleted: (_pdsId) => {
          setRefreshToken(Date.now());
        },
      });
    },
    [closeDialog, sceneManager],
  );

  // 목록 조회
  const reload = useCallback(
    async (ctx: ApiRequestContext, searchOption: SearchOption) => {
      setLoading(true);
      try {
        const { body } = await api.pds.list({ ...searchOption, ctx });
        const { pagerData } = body;
        if (ctx.canceled) return;
        setPdsPagerData(pagerData);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // 검색 조건이 변경되면 목록 조회
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    reload(ctx, searchOption);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [searchOption, reload, refreshToken]);

  // pdsId가 전달되었으면 상세보기 다이얼로그 띄우기
  useEffect(() => {
    if (props.pdsId) {
      openPdsViewDialog(props.pdsId, true);
    }
  }, [props.pdsId, openPdsViewDialog]);

  // 테이블 행 클릭 - 상세보기 다이얼로그 띄우기
  const handleClickRow = (pds: PdsSimple) => {
    openPdsViewDialog(pds.pdsId);
  };

  const {
    totalPages = 0,
    pageNumber = 0,
    offset = 0,
    totalElements = 0,
    elements = [],
  } = pdsPagerData || {};
  const itemNumMax = totalElements - offset;

  // 하단의 페이지번호 영역 표시 : 2페이지 이상일때만 표시한다
  const showPageNumber = totalPages >= 2;

  return (
    <Box className="PdsHome-root" sx={rootSx}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          onClick={() => {
            // routerPush('/pds/edit')
            sceneManager.replaceScene('/pds/edit');
          }}
          size="small"
          variant="outlined"
        >
          신규
        </Button>
      </Stack>
      <Portlet sx={{ mt: 1 }} ref={setContentElement}>
        <PortletContent noPadding sx={{ flex: 1 }}>
          <TableContainer
            sx={{ height: `calc(100vh - ${contentTop}px - ${showPageNumber ? 64 : 8}px)` }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell width="40%">제목</TableCell>
                  <TableCell>수정일</TableCell>
                  <TableCell>등록일</TableCell>
                </TableRow>
              </TableHead>
              <CustomTableBody stripe loading={loading}>
                {elements.map((pds, i) => (
                  <PdsRow
                    key={pds.pdsId}
                    seq={itemNumMax - i}
                    pds={pds}
                    onClickRow={handleClickRow}
                    className={pds.pdsId === lastSelectedId ? 'PdsRow-highlight' : undefined}
                  />
                ))}
              </CustomTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
      </Portlet>
      {totalPages > 1 && (
        <Box
          sx={{
            py: 2,
            height: 64,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <BbsPagination
            page={pageNumber ?? 0}
            count={totalPages ?? 0}
            onPageChange={(pageNumber) => setSearchOption((p) => ({ ...p, pageNumber }))}
          />
        </Box>
      )}
      {dialogId === 'PdsViewDialog' && pdsViewDialogProps && (
        <PdsViewDialog {...pdsViewDialogProps} />
      )}
    </Box>
  );
}
