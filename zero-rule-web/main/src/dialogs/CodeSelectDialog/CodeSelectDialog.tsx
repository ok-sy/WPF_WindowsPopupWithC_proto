import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import { DEFAULT_SEARCH_PARAMS } from '@/features/CodeHome/CodeList/types';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCode, PagerData } from '@local/domain';
import { CustomDialog, CustomDialogTitle, Portlet, PortletContent, PortletFooter } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Pagination,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'react-use';
import CodeSelectRow from './components/CodeSelectRow';
import type { SearchParams } from './types';
import errorCustomHandle from '@/lib/error-custom-handle';

export const rootSx: SxProps = {
  '& .MuiTextField-root': {
    '& .MuiInputBase-root': { borderRadius: 0 },
    width: '100%',
  },
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export type CodeSelectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CLCode) => void;
};

export default function CodeSelectDialog(props: CodeSelectDialogProps) {
  const { open, onClose, onSubmit } = props;
  const api = useApi();
  const [searchParams, setSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pagerData, setPagerData] = useState<PagerData<CLCode>>();

  const [keyword, setKeyword] = useState<string>();
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>();

  const tableRowRef = useRef<HTMLTableRowElement>(null);

  useDebounce(() => setDebouncedKeyword(keyword), 300, [keyword]);

  const handleChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value ?? '';
    setKeyword(keyword);
  };

  useEffect(() => {
    setSearchParams((p) => ({ ...p, code: debouncedKeyword, pageNumber: 0 }));
  }, [debouncedKeyword]);

  const handleCloseDialog = () => {
    onClose();
  };

  // 목록조회
  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: SearchParams) => {
      setLoading(true);
      try {
        const { body } = await api.clCode.search({
          ctx,
          ...params,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        setPagerData(pagerData);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  // 새로 불러오기
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, searchParams);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, searchParams]);

  const rootRef = useRef<HTMLDivElement>();

  // 현재 선택된 행 강조 - class 추가
  const updateLastSelection = (code: string) => {
    const root = rootRef.current;
    if (!root) return;

    // 기존 선택 제거
    let elem = root.querySelector(`.CodeSelectRow-selected`);
    if (elem) {
      elem.classList.remove('CodeSelectRow-selected');
    }

    // 신규 선택 강조
    elem = root.querySelector(`.CodeSelectRow-root[data-word-id="${code}"]`);
    if (elem) {
      elem.classList.add('CodeSelectRow-selected');
    }
  };

  const onClickRowHandler = (data: CLCode) => {
    updateLastSelection(data.code);
    onSubmit(data);
  };

  const {
    totalPages = 0,
    pageNumber = 0,
    elements = [],
    offset = 0,
    totalElements = 0,
  } = pagerData ?? {};

  return (
    <CustomDialog
      open={open}
      maxWidth="xs"
      fullWidth
      sx={rootSx}
      className="CodeSelectDialog-root"
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleCloseDialog();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
    >
      <CustomDialogTitle title="코드" onClose={handleCloseDialog}>
        <TextField
          sx={{ m: 1.5 }}
          onChange={handleChangeKeyword}
          fullWidth
          size="small"
          label="검색"
          placeholder="코드 이름으로 검색"
        />
      </CustomDialogTitle>
      <DialogContent sx={{ p: 0 }} dividers ref={rootRef}>
        <Portlet>
          <PortletContent noPadding>
            <TableContainer sx={{ height: '50vh' }}>
              <CLStyledTable noMargin>
                <CLDocTableHead yPadding="small">
                  <TableRow>
                    <TableCell>코드</TableCell>
                    <TableCell>코드 이름</TableCell>
                  </TableRow>
                </CLDocTableHead>
                <CLDocTableBody loading={loading}>
                  {elements.map((el) => (
                    <CodeSelectRow
                      onClickRow={onClickRowHandler} //
                      key={el.code}
                      data={el}
                    />
                  ))}
                </CLDocTableBody>
              </CLStyledTable>
            </TableContainer>
          </PortletContent>
          <PortletFooter sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box>
              <Pagination
                page={pageNumber + 1}
                count={totalPages}
                onChange={(_, page) => setSearchParams((p) => ({ ...p, pageNumber: page - 1 }))}
              />
            </Box>
          </PortletFooter>
        </Portlet>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="error" onClick={handleCloseDialog}>
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
