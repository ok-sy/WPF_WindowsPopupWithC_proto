import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import type { NavPageInsertDialogProps } from '@/dialogs/NavPageInsertDialog';
import NavPageInsertDialog from '@/dialogs/NavPageInsertDialog';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLPage } from '@local/domain';
import {
  Portlet,
  PortletContent,
  PortletHeader,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  LinearProgress,
  Table,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import PageRow from './components/PageRow';
import errorCustomHandle from '@/lib/error-custom-handle';

const rootSx: SxProps<Theme> = {};

type DialogId = 'NavPageInsertDialog';
export default function NavPagesHome() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [pageList, setPageList] = useState<CLPage[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [navPageInsertDialogProps, setNavPageInsertDialogProps] =
    useState<NavPageInsertDialogProps>();

  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clNav.pages({ ctx });
        const { pageList } = body;
        if (ctx.canceled) return;
        setPageList(pageList);
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

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setNavPageInsertDialogProps(undefined);
    setRefreshToken(Date.now());
  };
  // 페이지 추가 다이얼로그
  const handleClickPageInsert = (pageData?: CLPage) => {
    setDialogId('NavPageInsertDialog');
    setNavPageInsertDialogProps({
      open: true,
      onClose: closeDialog,
      updateData: pageData,
    });
  };

  return (
    <Box className="NavPagesHome-root" sx={{ pt: 1, pl: 1, pr: 3 }}>
      <Portlet sx={{ position: 'relative' }}>
        <PortletHeader>
          <TitleWithReloadButton
            title="페이지 목록"
            onClickRefresh={() => setRefreshToken(Date.now())}
          />
          <Button
            onClick={(_) => handleClickPageInsert()}
            startIcon={<PostAddOutlinedIcon />}
            color="success"
            variant="contained"
            size="small"
          >
            새 페이지
          </Button>
        </PortletHeader>
        <PortletContent noPadding sx={{ minHeight: 500 }}>
          <TableContainer
            ref={setBodyElement}
            sx={{
              height: `calc(100vh - ${bodyTop}px - 30px)`,
              whiteSpace: 'nowrap',
            }}
          >
            <Table>
              <CLDocTableHead yPadding="small">
                <TableRow>
                  <TableCell>PAGE 번호</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>아이콘</TableCell>
                  <TableCell>링크</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody yPadding="large">
                {pageList
                  .sort((a, b) => {
                    const pageKeyA = Number(a.pageKey) ?? 0;
                    const pageKeyB = Number(b.pageKey) ?? 1;
                    return pageKeyA - pageKeyB;
                  })
                  .map((el, idx) => (
                    <PageRow
                      onClickRow={handleClickPageInsert}
                      seq={idx + 1}
                      key={el.pageId}
                      data={el}
                    />
                  ))}
              </CLDocTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
      </Portlet>
      {dialogId === 'NavPageInsertDialog' && navPageInsertDialogProps && (
        <NavPageInsertDialog {...navPageInsertDialogProps} />
      )}
    </Box>
  );
}
