import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import UserSelectBox from '@/components/UserSelectBox';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLUser } from '@local/domain';
import { CLPriv } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableRowSelection,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import { alpha, TableCell, TableContainer, TableRow, TextField } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

interface Props {
  onSelectedUser: (user: CLUser) => void;
  selectedId?: number;
}
export default function UserList(props: Props) {
  const { onSelectedUser, selectedId } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState<CLUser[]>([]);
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);

  const [keyword, setKeyword] = useState<string>();
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>();

  const onSelectedUserFnRef = useRef<Props['onSelectedUser']>();
  onSelectedUserFnRef.current = onSelectedUser;

  useDebounce(() => setDebouncedKeyword(keyword), 500, [keyword]);
  const doReload = useCallback(
    async (
      ctx: ApiRequestContext,
      searchOption: {
        keyword?: string;
        rowsPerPage: number;
        pageNumber: number;
      },
    ) => {
      try {
        setLoading(true);
        const { body } = await api.userManage.list({ ctx, ...searchOption });
        const { pagerData } = body;
        if (ctx.canceled) return;
        setUserList(pagerData.elements);
        onSelectedUserFnRef.current?.(pagerData.elements[0]);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api, onSelectedUserFnRef],
  );

  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    const searchOption = {
      keyword: debouncedKeyword,
      rowsPerPage: 999,
      pageNumber: 0,
    };
    doReload(ctx, searchOption);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, debouncedKeyword]);

  return (
    <Portlet>
      <PortletHeader sx={{ whiteSpace: 'nowrap' }}>
        <TitleWithReloadButton title="사용자" loading={loading} />
        <TextField
          type="search"
          label="이름 또는 ID로 검색"
          placeholder="이름 또는 ID"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          size="small"
        ></TextField>
      </PortletHeader>
      <PortletContent noPadding>
        <TableContainer
          ref={setBodyElement}
          sx={{
            height: `calc(100vh - ${bodyTop}px - 24px)`,
            whiteSpace: 'nowrap',
            // 스크롤바 영역
            '::-webkit-scrollbar': {
              width: 3,
            },
            // 스크롤바 움직이는 자체 그놈
            '::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.7),
              borderRadius: 7,
            },
            // 스크롤바 뒷배경
            '::-webkit-scrollbar-track': {},
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
                <TableCell>ID</TableCell>
                <TableCell>이름</TableCell>
              </TableRow>
            </CLDocTableHead>
            <CLDocTableBody
              sx={flatSx(
                {
                  overflow: 'auto',
                  cursor: 'default',
                },
                sxTableRowSelection,
              )}
            >
              {userList.map((el, idx) => (
                <TableRow
                  className={selectedId === el.userId ? 'x_selected' : ''}
                  key={el.userId}
                  onClick={() => onSelectedUser(el)}
                >
                  <TableCell>{el.lgonId}</TableCell>
                  <TableCell>{el.userNm}</TableCell>
                </TableRow>
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </PortletContent>
    </Portlet>
  );
}
