import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCodeType } from '@local/domain';
import {
  CustomDialog,
  CustomDialogTitle,
  Portlet,
  PortletContent,
  sxTableRowSelection,
} from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import CodeTypeTableRow from './components/CodeTypeTableRow';
import errorCustomHandle from '@/lib/error-custom-handle';

export type CodeTypePickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelected: (data: CLCodeType) => void;
  initialKeyword?: string;
};

export default function CodeTypePickerDialog(props: CodeTypePickerDialogProps) {
  const { open, onClose, onSelected } = props;
  const api = useApi();
  const [keyword, setKeyword] = useState<string | undefined>(() => props.initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState<string | undefined>(
    () => props.initialKeyword,
  );

  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [codeTypeList, setCodeTypeList] = useState<CLCodeType[]>([]);

  useDebounce(() => setDebouncedKeyword(keyword), 300, [keyword]);

  const handleChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value ?? '';
    setKeyword(keyword);
  };

  const handleCloseDialog = () => {
    onClose();
  };

  // 목록조회
  const doReload = useCallback(
    async (ctx: ApiRequestContext, keyword?: string) => {
      setLoading(true);
      try {
        const { body } = await api.clCodeType.search({
          ctx,
          keyword,
          pageNumber: 0,
          rowsPerPage: 100,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        setCodeTypeList(pagerData.elements);
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
    doReload(ctx, debouncedKeyword);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, debouncedKeyword]);

  const handleClickTableRow = (data: CLCodeType) => {
    onSelected(data);
  };

  return (
    <CustomDialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiTextField-root': {
          '& .MuiInputBase-root': { borderRadius: 0 },
          width: '100%',
        },
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
      className="CodeTypeSelectDialog-root"
    >
      <CustomDialogTitle onClose={handleCloseDialog}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">코드 그룹</Typography>
          <TextField
            value={keyword ?? ''}
            onChange={handleChangeKeyword}
            fullWidth
            type="search"
            size="small"
            margin="none"
            label="그룹 코드 또는 이름"
          />
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers>
        <Portlet>
          <PortletContent noPadding>
            <TableContainer sx={{ minHeight: '70vh' }}>
              <CLStyledTable noMargin>
                <CLDocTableHead yPadding="small">
                  <TableRow>
                    <TableCell>코드 그룹</TableCell>
                    <TableCell>코드 그룹 이름</TableCell>
                  </TableRow>
                </CLDocTableHead>
                <CLDocTableBody loading={loading} sx={sxTableRowSelection}>
                  {codeTypeList.map((el) => (
                    <CodeTypeTableRow
                      key={el.codeType}
                      onClickRow={handleClickTableRow}
                      data={el}
                      keyword={keyword}
                    />
                  ))}
                </CLDocTableBody>
              </CLStyledTable>
            </TableContainer>
          </PortletContent>
        </Portlet>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCloseDialog}>
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
