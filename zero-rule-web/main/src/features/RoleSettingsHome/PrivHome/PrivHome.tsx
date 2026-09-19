import type { PrivInsertDialogProps } from '@/dialogs/PrivInsertDialog';
import PrivInsertDialog from '@/dialogs/PrivInsertDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, CLPriv } from '@local/domain';
import { Portlet, PortletHeader, TitleWithReloadButton } from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Box, Button, CircularProgress, Grid2 } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import PrivEdit from './components/PrivEdit';
import PrivList from './components/PrivList';

type DialogId = 'PrivInsertDialog' | 'PrivMgmtInfoDialog';

export default function PrivilegeMgmt() {
  const [dialogId, setDialogId] = useState<DialogId>();
  const [privInsertDialogProps, setPrivInsertDialogProps] = useState<PrivInsertDialogProps>();
  const [selectedRowData, setSelectedRowData] = useState<CLPriv>();
  const [selectedPrivId, setSelectedPrivId] = useState<string>('');
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [privList, setPrivList] = useState<CLPriv[]>();
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!selectedRowData) return;
    setSelectedPrivId(selectedRowData.privId);
  }, [selectedRowData]);

  // 다이어로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setPrivInsertDialogProps(undefined);
  };

  // PRIV 생성 다이어로그
  const handleClickInsertDialog = () => {
    setDialogId('PrivInsertDialog');
    setPrivInsertDialogProps({
      open: true,
      onClose: closeDialog,
      onRefresh: () => {
        console.log('리프레시 하냐???????????????');
        setRefreshToken(Date.now);
      },
    });
  };

  // 롤 목록 로드
  const doLoadRoleList = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clPriv.privPList({ ctx });
        const { privList } = body;
        if (ctx.canceled) return;
        setPrivList(privList);
        if (privList.length > 0) {
          setSelectedPrivId((prev) => {
            if (!prev) {
              return privList[0].privId;
            }
            return prev;
          });
          setSelectedRowData((prev) => {
            // 기본으로 한개 자동 선택
            if (!prev) {
              return privList[0];
            }
            return prev;
          });
        }
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
    doLoadRoleList(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doLoadRoleList]);
  // 새로고침
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };
  return (
    <Box className="PrivilegeMgmt-root">
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
              <TitleWithReloadButton title="권한 목록" onClickRefresh={handleClickRefresh} />
              <Button
                startIcon={<AddCircleOutlineIcon />}
                variant="outlined"
                size="small"
                onClick={handleClickInsertDialog}
              >
                신규
              </Button>
            </PortletHeader>
            <PrivList
              selectedPrivId={selectedPrivId}
              privData={privList}
              onClickRow={(data) => setSelectedRowData(data)}
            />
          </Portlet>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 8 }}>
          {/* 상세정보 */}
          <PrivEdit
            privData={selectedRowData}
            onRefresh={() => {
              setRefreshToken(Date.now());
            }}
            onSelectedRefresh={() => {
              if (!privList) return;
              setSelectedRowData(privList[0]);
            }}
          />
        </Grid2>
      </Grid2>
      {dialogId === 'PrivInsertDialog' && privInsertDialogProps && (
        <PrivInsertDialog {...privInsertDialogProps} />
      )}
    </Box>
  );
}
