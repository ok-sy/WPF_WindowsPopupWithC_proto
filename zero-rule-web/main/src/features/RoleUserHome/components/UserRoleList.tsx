import CLDocTableBody from '@/components/CLDocTableBody';
import { motion } from 'framer-motion';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLRole } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableRowSelection,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import { TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import RoleRow from './RoleRow';
import errorCustomHandle from '@/lib/error-custom-handle';

interface Props {
  userId: number;
  userNm: string;
}

export default function UserRoleList(props: Props) {
  const { userId, userNm } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [roleList, setRoleList] = useState<CLRole[]>([]);
  const [grantedRoleIds, setGrantedRoleIds] = useState<Set<string>>(() => new Set());
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const doReload = useCallback(
    async (ctx: ApiRequestContext, userId: number) => {
      try {
        setLoading(true);
        const { body } = await api.clRoleUser.roleList({ ctx, userId });
        const { grantedRoleIds, roleList } = body;
        if (ctx.canceled) return;
        setRoleList(roleList);
        setGrantedRoleIds(new Set(grantedRoleIds));
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
    doReload(ctx, userId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, userId]);

  const handleGrantUpdated = (roleId: string, granted: boolean) => {
    const newIds = new Set(Array.from(grantedRoleIds));
    if (granted) {
      newIds.add(roleId);
    } else {
      newIds.delete(roleId);
    }
    setGrantedRoleIds(newIds);
  };

  // 새로고침 버튼 클릭
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  return (
    <Portlet sx={{ flex: 1 }}>
      <PortletHeader>
        <TitleWithReloadButton
          title="ROLE 목록"
          loading={loading}
          onClickRefresh={handleClickRefresh}
        />

        <Typography
          component={motion.div}
          key={userNm}
          sx={{
            color: 'primary.main',
          }}
          animate={{
            // scale: [0.5, 1],
            y: [4, -2, 0],
          }}
          transition={{
            duration: 0.3,
          }}
        >
          {userNm}
        </Typography>
      </PortletHeader>
      <PortletContent noPadding>
        <TableContainer
          ref={setBodyElement}
          sx={{
            height: `calc(100vh - ${bodyTop}px - 24px)`,
            whiteSpace: 'nowrap',
          }}
        >
          <CLStyledTable
            noMargin
            sx={{
              border: '1px solid #e5e5e5',
            }}
          >
            <CLDocTableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>ROLE ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </CLDocTableHead>
            <CLDocTableBody
              sx={flatSx(
                {
                  cursor: 'default',
                },
                sxTableRowSelection,
              )}
            >
              {roleList.map((role, i) => (
                <RoleRow
                  key={role.roleId}
                  seq={i + 1}
                  role={role}
                  userId={userId}
                  granted={grantedRoleIds.has(role.roleId)}
                  onGrantUpdated={handleGrantUpdated}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </PortletContent>
    </Portlet>
  );
}
