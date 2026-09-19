import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLNav, CLNavItem } from '@local/domain';
import { flatSx, Portlet, PortletContent, PortletHeader, TitleWithReloadButton } from '@local/ui';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  IconButton,
  LinearProgress,
  Stack,
  SxProps,
  Table,
  TableCell,
  TableContainer,
  TableRow,
  Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import NavPageRow from './components/NavPageRow';
import NavSectionRow from './components/NavSectionRow';
import errorCustomHandle from '@/lib/error-custom-handle';

type Props = {
  navId: number;
  onEditMode: () => void;
};

export default function MenuList(props: Props) {
  const { navId, onEditMode } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [navItemList, setNavItemList] = useState<CLNavItem[]>([]);
  const [navInfo, setNanInfo] = useState<CLNav>();
  // 네비 정보와 네비아이템 목록을 불러온다
  const doReload = useCallback(
    async (ctx: ApiRequestContext, navId: number) => {
      try {
        setLoading(true);
        const { body } = await api.clNav.items({ ctx, navId, withHidden: false });
        const { nav, navItemList } = body;
        if (ctx.canceled) return;
        setNavItemList(navItemList);
        setNanInfo(nav);
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
      sx={flatSx({
        flex: 1,
        position: 'relative',
        '& .MuiSvgIcon-root': {
          height: 20,
        },
        '& .MuiTableCell-root': {
          py: 0,
        },
      })}
    >
      <PortletHeader>
        <Stack direction="row" alignItems="center">
          <TitleWithReloadButton
            title={`${navInfo?.navNm}`}
            onClickRefresh={() => setRefreshToken(Date.now())}
          />

          <Tooltip arrow title={`${navInfo?.navNm} 편집`}>
            <IconButton size="small" color="primary" onClick={onEditMode}>
              <EditOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </PortletHeader>
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
                  <TableCell width={'10%'}>아이콘</TableCell>
                  <TableCell>메뉴</TableCell>
                  <TableCell>링크</TableCell>
                  <TableCell>Id</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody yPadding="medium">
                {navItemList.map((el, idx) => {
                  if (el.itemType === 'PAGE')
                    return <NavPageRow seq={idx + 1} key={el.pageId} data={el} />;
                  else {
                    return <NavSectionRow seq={idx + 1} key={el.sectionId} data={el} />;
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
