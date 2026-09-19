import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { SearchParams } from '@/features/CodeHome/CodeTypeList/types';
import { DEFAULT_SEARCH_PARAMS } from '@/features/CodeHome/CodeTypeList/types';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCodeType, PagerData } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import { CustomDialog, CustomDialogTitle } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Button, DialogActions, DialogContent, TableContainer, TextField } from '@mui/material';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { CodeTypeAddType } from './code-type-add-schema';
import { commonCodeTypeAddSchema } from './code-type-add-schema';
import errorCustomHandle from '@/lib/error-custom-handle';

export const rootSx: SxProps = {
  '& .MuiTextField-root': {
    '& .MuiInputBase-root': { borderRadius: 0 },
    width: '100%',
  },
  overflow: 'hidden',
};

export type CommonCodeTypeFindDialogProps = {
  open: boolean;
  onClose: () => void;
  // onSave: (save: CLCodeType) => void
};
const DEFAULT_VALUES: Partial<CodeTypeAddType> = {
  codeType: '',
  codeTypeNm: '',
  dtlExpl: '',
};
export default function CommonCodeTypeFindDialog(props: CommonCodeTypeFindDialogProps) {
  const { open, onClose } = props;
  const api = useApi();
  const [pagerData, setPagerData] = useState<PagerData<CLCodeType>>();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);

  // 다이어로그 닫기
  const handleCloseDialog = () => {
    onClose();
  };

  // 등록
  const doSave = useCallback(
    async (params: {
      codeType: string; // pk1
      codeTypeNm: string;
      dtlExpl?: string;
    }) => {
      try {
        // 신규 등록
        const { body } = await api.clCodeType.create(params);
        const { codeType } = body;
        toast.success('저장되었습니다');
        return codeType;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
      }
      return null;
    },
    [api],
  );

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

  const onSubmitHandle = (data: CodeTypeAddType) => {
    doSave(data).then((result) => {
      if (result) {
        // onSave(result)
      }
    });
    onClose();
  };

  const {
    totalPages = 0,
    pageNumber = 0,
    elements = [],
    offset = 0,
    totalElements = 0,
  } = pagerData ?? {};
  const itemNumMax = totalElements - offset;

  return (
    <CustomDialog
      open={open}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="sm"
      sx={rootSx}
      className="CommonCodeTypeFindDialog-root"
    >
      <CustomDialogTitle title="코드 그룹 검색" onClose={handleCloseDialog} />
      <DialogContent dividers>
        <TextField />
        <TableContainer>
          <CLStyledTable>
            <CLDocTableHead></CLDocTableHead>
            <CLDocTableBody></CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="contained">
          추가
        </Button>
        <Button color="error" variant="outlined" onClick={handleCloseDialog}>
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
