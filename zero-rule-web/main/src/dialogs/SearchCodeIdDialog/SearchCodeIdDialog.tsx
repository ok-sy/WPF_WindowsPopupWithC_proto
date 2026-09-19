import BbsPagination from '@/components/BbsPagination';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import { DEFAULT_SEARCH_PARAMS } from '@/features/CodeHome/CodeTypeList/types';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { CustomDialog, CustomDialogTitle } from '@local/ui';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import type { ApiRequestContext, CLCodeType, PagerData } from '@local/domain';
import { useCallback, useEffect, useState } from 'react';
import type { SearchParams } from '../CodeSelectDialog/types';
import CodeTypeSearchBox from './components/CodeTypeSearchBox/CodeTypeSearchBox';
import SearchCodeIdTableRow from './components/SearchCodeIdTableRow';

const rootSx: SxProps<Theme> = (theme) => ({});

export type SearchCodeIdDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (codeType: string, codeTypeNm: string) => void;
};

export default function SearchCodeIdDialog(props: SearchCodeIdDialogProps) {
  const { open, onClose, onSubmit } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);
  const [pagerData, setPagerData] = useState<PagerData<CLCodeType>>();

  // 목록조회
  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: SearchParams) => {
      setLoading(true);
      try {
        const { body } = await api.clCodeType.search({
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
  }, [doReload, searchParams]);

  const {
    totalPages = 0,
    pageNumber = 0,
    elements = [],
    offset = 0,
    totalElements = 0,
  } = pagerData ?? {};
  const itemNumMax = totalElements - offset;

  const handleClickRow = (codeType: string, codeTypeNm: string) => {
    onSubmit(codeType, codeTypeNm);
  };
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      className="SearchCodeIdDialog-root"
      sx={rootSx}
      fullWidth
      maxWidth="xs"
    >
      <CustomDialogTitle title={`코드 선택`} onClose={onClose}>
        <CodeTypeSearchBox
          yPadding={2}
          loading={loading}
          onSubmit={(values) => {
            setSearchParams((p) => ({ ...p, pageNumber: 0, ...values }));
          }}
        />
      </CustomDialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <TableContainer sx={{ height: 400, maxHeight: 400 }}>
          <CLStyledTable
            noMargin
            sx={{
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
              },
            }}
          >
            <CLDocTableHead yPadding="small">
              <TableRow>
                <TableCell>그룹코드</TableCell>
                <TableCell>이름</TableCell>
              </TableRow>
            </CLDocTableHead>
            <CLDocTableBody yPadding="medium">
              {elements.map((it, i) => (
                <SearchCodeIdTableRow
                  key={it.codeType}
                  codeType={it}
                  onClickRow={handleClickRow}
                  onClose={onClose}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" flex={1} justifyContent="space-between">
          <Stack direction="row" />
          <Stack direction="row" alignSelf="center">
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
                  onPageChange={(pageNumber) => setSearchParams((p) => ({ ...p, pageNumber }))}
                />
              </Box>
            )}
          </Stack>

          <Stack direction="row">
            <Button variant="contained" onClick={onClose} color="primary" size="small">
              닫기
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </CustomDialog>
  );
}
