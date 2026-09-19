import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLNavItem } from '@local/domain';
import { flatSx, Portlet, PortletContent } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Box,
  LinearProgress,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import NavPageRow from './NavPageRow';
import NavSectionRow from './NavSectionRow';
import errorCustomHandle from '@/lib/error-custom-handle';

type Props = {
  sx?: SxProps;
  navId: number;
  onClickPageKey: (pageKey: string) => void;
  searchKeyword?: string;
};

export default function MenuList(props: Props) {
  const { sx, navId, onClickPageKey, searchKeyword } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [navItemList, setNavItemList] = useState<CLNavItem[]>([]);

  useEffect(() => {
    if (!searchKeyword) return setRefreshToken(Date.now());
    setNavItemList(
      (p) =>
        p
          .map((el) => {
            if (el.itemType === 'SECTION') {
              const subitems = el.subitems.filter((sub) => {
                return sub.pageNm.includes(searchKeyword);
              });
              if (subitems.length < 1) return;
              return { ...el, subitems };
            } else {
              if (el.pageNm.includes(searchKeyword)) {
                return el;
              } else {
                return;
              }
            }
          })
          .filter((el) => !!el) as CLNavItem[],
    );
  }, [searchKeyword]);

  // 네비 정보와 네비아이템 목록을 불러온다
  const doReload = useCallback(
    async (ctx: ApiRequestContext, navId: number) => {
      try {
        setLoading(true);
        const { body } = await api.clNav.items({ ctx, navId, withHidden: false });
        const { nav, navItemList } = body;
        if (ctx.canceled) return;
        setNavItemList(navItemList);
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
    doReload(ctx, navId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, refreshToken, navId]);

  const noData = navItemList.length < 1;

  return (
    <Portlet
      sx={flatSx(
        {
          flex: 1,
          position: 'relative',
          '& .MuiSvgIcon-root': {
            height: 20,
          },
          '& .MuiTableCell-root': {
            py: 0,
          },
        },
        sx,
      )}
    >
      <PortletContent noPadding sx={{ minHeight: 500 }}>
        {!noData && (
          <TableContainer
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            <Table>
              <CLDocTableHead yPadding="small">
                <TableRow>
                  <TableCell>메뉴</TableCell>
                  <TableCell>링크</TableCell>
                  <TableCell>페이지 번호</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody yPadding="medium">
                {navItemList.map((el) => {
                  if (el.itemType === 'PAGE')
                    return (
                      <NavPageRow
                        keyword={searchKeyword}
                        onClickPageKey={onClickPageKey}
                        key={el.pageId}
                        page={el}
                      />
                    );
                  else {
                    return (
                      <NavSectionRow
                        key={el.sectionId}
                        keyword={searchKeyword}
                        section={el}
                        onClickPageKey={onClickPageKey}
                      />
                    );
                  }
                })}
              </CLDocTableBody>
            </Table>
          </TableContainer>
        )}
        {noData && (
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ backgroundColor: '#f0f0f0' }}
            height={'100%'}
          >
            <Typography color="GrayText" variant="h4">
              추가된 메뉴 없음
            </Typography>
          </Stack>
        )}
      </PortletContent>
      {loading && (
        <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
    </Portlet>
  );
}
