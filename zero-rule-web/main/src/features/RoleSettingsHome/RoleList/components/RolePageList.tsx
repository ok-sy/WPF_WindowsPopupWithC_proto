import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLRolePageDetail } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableRowSelection,
  TitleWithReloadButton,
} from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import {
  Box,
  IconButton,
  LinearProgress,
  ListItemIcon,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  TableContainer,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RolePageRow from './RolePageRow';
import errorCustomHandle from '@/lib/error-custom-handle';

function crudStr(params: {
  c: boolean;
  r: boolean;
  u: boolean;
  d: boolean;
}): Array<'C' | 'R' | 'U' | 'D'> {
  const { c, r, u, d } = params;
  const arr = [] as Array<'C' | 'R' | 'U' | 'D'>;
  if (c) arr.push('C');
  if (r) arr.push('R');
  if (u) arr.push('U');
  if (d) arr.push('D');
  return arr;
}

interface CLRolePageDetailWithKey extends CLRolePageDetail {
  _key: any;
}

interface Props {
  roleId: string;
}

export default function RolePageList(props: Props) {
  const { roleId } = props;
  const api = useApi();
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rolePageList, setRolePageList] = useState<CLRolePageDetailWithKey[]>([]);
  const [popOverHandle, setPopOverHandle] = useState<HTMLButtonElement | null>(null);

  const handleClickPop = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOverHandle(event.currentTarget);
  };
  const handleClosePop = () => {
    setPopOverHandle(null);
  };

  const doReload = useCallback(
    async (ctx: ApiRequestContext, roleId: string) => {
      setLoading(true);
      try {
        const { body } = await api.clRole.rolePages({ ctx, roleId });
        const { rolePageList } = body;
        if (ctx.canceled) return;
        setRolePageList(
          rolePageList.map((it) => ({ ...it, _key: it.pageId + crudStr(it).join('') })),
        );
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
    const ctx: ApiRequestContext = { canceled: false };
    doReload(ctx, roleId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, roleId]);

  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };
  // 전체 권한 적용
  const doGrantAll = useCallback(
    async (params: { roleId: string }) => {
      setLoading(true);
      try {
        await api.clRole.grantAllRolePage(params);
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );
  // 전체 권한 제거
  const doRevokeAll = useCallback(
    async (params: { roleId: string }) => {
      setLoading(true);
      try {
        await api.clRole.revokeAllRolePage(params);
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );
  const revokeAllBtnClick = () => {
    doRevokeAll({ roleId }).then((success) => {
      if (success) {
        toast.success('전체 권한 삭제완료');
        handleClickRefresh();
      }
    });
  };
  const grantAllBtnClick = () => {
    doGrantAll({ roleId }).then((success) => {
      if (success) {
        toast.success('전체 권한 적용완료');
        handleClickRefresh();
      }
    });
  };

  return (
    <>
      <Portlet sx={{ position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
        <PortletHeader>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" color="primary">
              {roleId}
            </Typography>
            <TitleWithReloadButton title={`페이지별 권한`} onClickRefresh={handleClickRefresh} />
          </Stack>
          <IconButton color="default" onClick={handleClickPop}>
            <MoreVertIcon />
          </IconButton>

          <Popover
            open={Boolean(popOverHandle)}
            anchorEl={popOverHandle}
            onClose={handleClosePop}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <MenuList>
              <MenuItem
                onClick={() => {
                  grantAllBtnClick();
                  handleClosePop();
                }}
              >
                <ListItemIcon>
                  <AddCircleOutlineIcon />
                </ListItemIcon>
                전체권한 등록
              </MenuItem>
              <MenuItem
                onClick={() => {
                  revokeAllBtnClick();
                  handleClosePop();
                }}
              >
                <ListItemIcon>
                  <RemoveCircleOutlineIcon />
                </ListItemIcon>
                전체권한 해제
              </MenuItem>
            </MenuList>
          </Popover>
        </PortletHeader>
        <PortletContent noPadding>
          <TableContainer>
            <CLStyledTable noMargin>
              <CLDocTableBody
                sx={flatSx(
                  {
                    cursor: 'default',
                  },
                  sxTableRowSelection,
                )}
              >
                {rolePageList.map((rolePage, i) => (
                  <RolePageRow key={rolePage._key} rolePage={rolePage} seq={i + 1} />
                ))}
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        </PortletContent>
      </Portlet>
    </>
  );
}
