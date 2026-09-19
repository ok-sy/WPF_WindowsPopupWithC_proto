import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLPriv } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableRowSelection,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import { TableCell, TableContainer, TableRow } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import PrivRow from './PrivRow';
import errorCustomHandle from '@/lib/error-custom-handle';

interface Props {
  userId: number;
}

export default function UserPrivList(props: Props) {
  const { userId } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [privList, setPrivList] = useState<CLPriv[]>([]);
  const [grantedPrivIds, setGrantedPrivIds] = useState<Set<string>>(() => new Set());
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const doReload = useCallback(
    async (ctx: ApiRequestContext, userId: number) => {
      try {
        setLoading(true);
        const { body } = await api.clRoleUser.privList({ ctx, userId });
        const { grantedPrivIds, privList } = body;
        if (ctx.canceled) return;
        setPrivList(privList);
        setGrantedPrivIds(new Set(grantedPrivIds));
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

  const handleGrantUpdated = (privId: string, granted: boolean) => {
    const newIds = new Set(Array.from(grantedPrivIds));
    if (granted) {
      newIds.add(privId);
    } else {
      newIds.delete(privId);
    }
    setGrantedPrivIds(newIds);
  };

  // 새로고침 버튼 클릭
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  return (
    <Portlet sx={{ flex: 1 }}>
      <PortletHeader>
        <TitleWithReloadButton
          title="개인에게 부여된 권한"
          loading={loading}
          onClickRefresh={handleClickRefresh}
        />
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
                <TableCell>권한 ID</TableCell>
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
              {privList.map((priv, i) => (
                <PrivRow
                  key={priv.privId}
                  seq={i + 1}
                  priv={priv}
                  userId={userId}
                  onGrantUpdated={handleGrantUpdated}
                  granted={grantedPrivIds.has(priv.privId)}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </PortletContent>
    </Portlet>
  );
}
