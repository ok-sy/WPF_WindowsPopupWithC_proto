import BbsPagination from '@/components/BbsPagination';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import type { UserMgmtInfoDialogProps } from '@/dialogs/UserMgmtInfoDialog';
import UserMgmtInfoDialog from '@/dialogs/UserMgmtInfoDialog';
import type { UserMgmtInputDialogProps } from '@/dialogs/UserMgmtInputDialog';
import UserListViewCreateDialog from '@/dialogs/UserMgmtInputDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, CLUser, PagerData } from '@local/domain';
import { Portlet, PortletContent, PortletHeader, TitleWithReloadButton } from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  LinearProgress,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import UserSearchBar from './components/UserSearchBar';
import UserTableRow from './components/UserTableRow';

type Props = {
  sx?: SxProps;
  className?: string;
};

type SearchOption = {
  lgonId?: string;
  userName?: string;
  rowsPerPage: number;
  pageNumber: number;
};
const DEFAULT_SEARCH_OPTIONS: SearchOption = {
  rowsPerPage: 10,
  pageNumber: 0,
};
type DialogId = 'UserListViewCreateDialog' | 'UserMgmtInfoDialog' | 'UserPermInfoDialog';

export default function UserListView(props: Props) {
  const api = useApi();
  const { sx, className } = props;
  const [dialogId, setDialogId] = useState<DialogId>();
  const [UserMgmtInputDialogProps, setUserMgmtInputDialogProps] =
    useState<UserMgmtInputDialogProps>();
  const [userMgmtInfoDialogProps, setUserMgmtInfoDialogProps] = useState<UserMgmtInfoDialogProps>();
  const [loading, setLoading] = useState(false);
  const [refershToken, setRefreshToken] = useState(0);
  const [pagerData, setPagerData] = useState<PagerData<CLUser>>();

  // 검색 조건
  const [searchOption, setSearchOption] = useState<SearchOption>(DEFAULT_SEARCH_OPTIONS);

  const closeDialog = () => {
    setDialogId(undefined);
    setUserMgmtInputDialogProps(undefined);
    setUserMgmtInfoDialogProps(undefined);
  };

  // 신규등록 다이어로그
  const newUserHandle = (users?: number) => {
    setDialogId('UserListViewCreateDialog');
    setUserMgmtInputDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
        setRefreshToken(Date.now());
      },
      users,
    });
  };

  const handleClickNewBtn = () => {
    newUserHandle();
  };

  // 기본정보 및 수정 다이어로그
  const userInfoDialogHandle = (userId: number) => {
    setDialogId('UserMgmtInfoDialog');
    setUserMgmtInfoDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
        setRefreshToken(Date.now());
      },
      userId,
    });
  };

  // 목록 조회
  const reload = useCallback(
    async (ctx: ApiRequestContext, searchOption: SearchOption) => {
      setLoading(true);
      try {
        const { body } = await api.userManage.list({ ...searchOption, ctx });
        const { pagerData } = body;
        if (ctx.canceled) return false;
        setPagerData(pagerData);
        return !!pagerData;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );

  const handleClickSearchBtn = () => {
    const ctx = { canceled: false } as ApiRequestContext;
    reload(ctx, searchOption);
  };
  const resetBtn = () => {
    const ctx = { canceled: false } as ApiRequestContext;
    reload(ctx, DEFAULT_SEARCH_OPTIONS);
  };

  //새로고침
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  // search box에서 검색 옵션이 변경된 경우
  const handleChangeSearchBox = (lgonId?: string, userNm?: string) => {
    setSearchOption((p) => ({ ...p, userName: userNm, lgonId }));
  };

  const {
    totalPages = 0,
    pageNumber = 0,
    offset = 0,
    totalElements = 0,
    elements = [],
  } = pagerData || {};
  const itemNumMax = totalElements - offset;

  return (
    <Box sx={sx} className={clsx('UserListView-root', className)}>
      <UserSearchBar
        onSubmit={handleChangeSearchBox}
        loading={loading}
        handleClickSearchBtn={handleClickSearchBtn}
        resetBtn={resetBtn}
      />

      <Portlet sx={{ position: 'relative' }}>
        <PortletHeader>
          <TitleWithReloadButton title="사용자 목록" onClickRefresh={handleClickRefresh} />

          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<AddCircleOutlineIcon />}
              color="success"
              onClick={handleClickNewBtn}
            >
              신규
            </Button>
          </Stack>
        </PortletHeader>
        <PortletContent noPadding sx={{ minHeight: 500 }}>
          <TableContainer>
            <Table>
              <CLDocTableHead yPadding="medium">
                <TableRow>
                  <TableCell>로그인 ID</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>최종 로그인</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody yPadding="medium" stripe>
                {elements.map((user, i) => (
                  <UserTableRow onClickRow={userInfoDialogHandle} key={user.userId} user={user} />
                ))}
              </CLDocTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
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
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
      </Portlet>

      {dialogId === 'UserListViewCreateDialog' && UserMgmtInputDialogProps && (
        <UserListViewCreateDialog {...UserMgmtInputDialogProps} />
      )}
      {dialogId === 'UserMgmtInfoDialog' && userMgmtInfoDialogProps && (
        <UserMgmtInfoDialog {...userMgmtInfoDialogProps} />
      )}
    </Box>
  );
}
