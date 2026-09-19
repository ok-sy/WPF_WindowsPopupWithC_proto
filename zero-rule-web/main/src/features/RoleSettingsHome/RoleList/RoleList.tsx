import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { RoleInfoEditDialogProps } from '@/dialogs/RoleInfoEditDialog';
import RoleInfoEditDialog from '@/dialogs/RoleInfoEditDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, CLRole } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableRowSelection,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, Grid2, TableCell, TableContainer, TableRow } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import RolePageList from './components/RolePageList';
import RoleRow from './components/RoleRow';

const rootSx: SxProps<Theme> = {};

type DialogId = 'RoleInfoEditDialog';

export default function RoleList() {
  const api = useApi();
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const rootRef = useRef<HTMLDivElement>();
  const [roleList, setRoleList] = useState<CLRole[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState<string>();

  const [dialogId, setDialogId] = useState<DialogId>();
  const [roleInfoEditDialogProps, setRoleInfoEditDialogProps] = useState<RoleInfoEditDialogProps>();

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setRoleInfoEditDialogProps(undefined);
  };

  // 롤 정보 수정/등록 다이얼로그
  const openRoleEditDialog = (roleId: string | undefined) => {
    setDialogId('RoleInfoEditDialog');
    setRoleInfoEditDialogProps({
      open: true,
      onClose: closeDialog,
      roleId,
      onRefresh: () => setRefreshToken(Date.now),
    });
  };

  // 롤 목록 로드
  const doLoadRoleList = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clRole.roles({ ctx });
        const { roleList } = body;
        if (ctx.canceled) return;
        setRoleList(roleList);
        if (roleList.length > 0) {
          setSelectedRoleId((prev) => {
            // 기본으로 한개 자동 선택
            if (!prev) {
              return roleList[0].roleId;
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

  // 새로고침 버튼 클릭
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  // 신규 ROLE 등록 버튼 클릭
  const handleClickNewRoleBtn = () => {
    setRefreshToken(Date.now());
    openRoleEditDialog(undefined);
  };

  // 신규 ROLE 편집 버튼 클릭
  const handleClickRoleEditBtn = (role: CLRole) => {
    openRoleEditDialog(role.roleId);
  };

  const handleClickRoleRow = (role: CLRole) => {
    setSelectedRoleId(role.roleId);
  };

  return (
    <Box className="RoleList-root" ref={rootRef} sx={rootSx}>
      <Grid2 container columnSpacing={2}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Portlet>
            <PortletHeader>
              <TitleWithReloadButton title="ROLE 목록" onClickRefresh={handleClickRefresh} />

              <Button
                startIcon={<AddCircleOutlineIcon />}
                variant="outlined"
                size="small"
                onClick={handleClickNewRoleBtn}
              >
                신규
              </Button>
            </PortletHeader>
            <PortletContent noPadding>
              <TableContainer
                ref={setBodyElement}
                sx={{
                  whiteSpace: 'nowrap',
                  height: `calc(100vh - ${bodyTop}px - 24px)`,
                  '& .MuiTableRow-root > .MuiTableCell-root': {
                    '&:nth-of-type(1)': {
                      minWidth: 40,
                      maxWidth: 40,
                      width: 40,
                    },
                    '&:nth-of-type(2)': {
                      maxWidth: 100,
                      minWidth: 100,
                      width: 100,
                    },
                    '&:nth-of-type(3)': {
                      maxWidth: 100,
                      minWidth: 100,
                      width: 100,
                    },
                    '&:nth-of-type(4)': {
                      minWidth: 40,
                      maxWidth: 40,
                      width: 40,
                    },
                  },
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
                        role={role}
                        seq={i + 1}
                        onClickEdit={handleClickRoleEditBtn}
                        onClickRow={handleClickRoleRow}
                        selected={selectedRoleId === role.roleId}
                      />
                    ))}
                  </CLDocTableBody>
                </CLStyledTable>
              </TableContainer>
            </PortletContent>
          </Portlet>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 8 }}>
          {selectedRoleId && <RolePageList roleId={selectedRoleId} />}
        </Grid2>
      </Grid2>
      {dialogId === 'RoleInfoEditDialog' && roleInfoEditDialogProps && (
        <RoleInfoEditDialog {...roleInfoEditDialogProps} />
      )}
    </Box>
  );
}
