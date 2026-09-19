import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CLStyledTextField from '@/components/CLStyledTextField/CLStyledTextField';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import type { SxProps, Theme } from '@mui/material';
import {
  Button,
  DialogContent,
  IconButton,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import type { ItemMgmt, ItemRef } from '@local/domain';
// CLDocTableBody, CLDocTableHead
import { trimAndStringLenght } from '@/lib/common-validation';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import type { ApiRequestContext } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
// CLDocTableBody, CLDocTableHead
import ItemHomeRow from './components/ItemRefModifyDialogRow';
import ItemRefModifyDialogRow from './components/ItemRefModifyDialogRow';

const rootSx: SxProps<Theme> = (theme) => ({
  '& .CLDocLabelInput-root': {
    '& .CLDocLabelInput-titleBox': {
      minWidth: 80,
      maxWidth: 80,
    },
  },
});

type InsertData = {
  itemrefCd?: string;
  itemrefNm?: string;
  itemrefaliasNm?: string;
  itemrefexprDesc?: string;
};
export type ItemRefModifyDialogProps = {
  open: boolean;
  onClose: () => void;
  item: ItemMgmt;
  refreshItem: () => void;
};
export default function ItemRefModifyDialog(props: ItemRefModifyDialogProps) {
  const { open, onClose, item, refreshItem } = props;
  const refreshItemFnRef = useRef<ItemRefModifyDialogProps['refreshItem']>();
  refreshItemFnRef.current = refreshItem;
  const [inputRef, setInputRef] = useState<InsertData[]>([]);
  const [itemRef, setItemRef] = useState<ItemRef[]>();
  const api = useApi();
  const [refreshToken, setRefreshToken] = useState(0);
  const doSave = useCallback(
    async (
      params: InsertData,
      itemid: string,
      isModify: boolean,
      asisInputItemrefCd?: string,
    ): Promise<number | null> => {
      try {
        if (isModify) {
          if (!asisInputItemrefCd) return 0;
          const body = await api.itemMgmt.itemRefModify({ ...params, asisInputItemrefCd });
          if (body.body.insertCnt > 0) {
            toast.success('수정 되었습니다.');
            refreshItemFnRef.current?.();
            setRefreshToken(Date.now);
            return body.body.insertCnt;
          }
        } else {
          const body = await api.itemMgmt.itemRefInsert({ ...params, itemid: itemid });
          if (body.body.insertCnt > 0) {
            toast.success('정상 등록 되었습니다.');
            refreshItemFnRef.current?.();
            setRefreshToken(Date.now);
            return body.body.insertCnt;
          }
        }
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
      return null;
    },
    [api, refreshItemFnRef],
  );
  const onSubmit = (data: InsertData, index: number) => {
    doSave({ ...data }, item.itemid, false).then((result) => {
      const tmpArr = inputRef.slice();
      tmpArr.splice(index, 1);
      setInputRef(tmpArr);
    });
  };

  const doDelete = useCallback(
    async (itemid: string, itemrefCd: string): Promise<number | null> => {
      try {
        const body = await api.itemMgmt.itemRefDel({ itemid: itemid, itemrefCd: itemrefCd });
        if (body.body.insertCnt > 0) {
          refreshItemFnRef.current?.();
          setRefreshToken(Date.now);
          return body.body.insertCnt;
        }
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
      return null;
    },
    [api, refreshItemFnRef],
  );

  const doReload = useCallback(
    async (ctx: ApiRequestContext, itemid: string) => {
      try {
        const { body } = await api.itemMgmt.itemRefList({ ctx, itemid });
        setItemRef(body.itemRefs);
        if (ctx.canceled) return false;
      } catch (err) {
        handleError(err);
      } finally {
      }
      return false;
    },
    [api],
  );

  useEffect(() => {
    if (item.itemid === undefined) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, item.itemid);
  }, [doReload, item.itemid, refreshToken]);

  return (
    <CustomDragableDialog
      maxWidth="md"
      fullWidth
      className="ItemRefModifyDialog-root"
      sx={rootSx}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        onClose();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
    >
      <CustomDialogTitle title={`항목참조 목록 `} onClose={onClose}></CustomDialogTitle>

      <DialogContent dividers className="ItemRefModifyDialog-content" sx={{ p: 1 }}>
        <Stack pr={1} direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontSize={'0.75rem'}>{`[${item?.itemid ?? ''}] ${
            item?.itemNm ?? ''
          }`}</Typography>
          <Button
            onClick={() => {
              setInputRef(
                inputRef.concat({
                  itemrefCd: '',
                  itemrefNm: '',
                  itemrefaliasNm: '',
                  itemrefexprDesc: '',
                }),
              );
            }}
            startIcon={<AddCircleOutlineIcon />}
            color="success"
          >
            신규
          </Button>
        </Stack>
        <TableContainer
          sx={{ minHeight: 400, maxHeight: 400, border: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}
        >
          <CLStyledTable noMargin>
            <CustomColoredTableHead yPadding="small">
              <TableRow
                sx={{
                  '& .MuiTableCell-root': {
                    px: 0.7,
                    border: '1px solid #e0e0e0',
                    textAlign: 'center',
                  },
                }}
              >
                <TableCell width={'5%'}>참조코드</TableCell>
                <TableCell width={'10%'}>참조코드명</TableCell>
                <TableCell width={'10%'}>참조코드 별칭</TableCell>
                <TableCell width={'20%'}>설명</TableCell>
                <TableCell width={'5%'} sx={{ p: 0 }}>
                  수정/삭제
                </TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody>
              {inputRef.map((el, idx) => (
                <TableRow
                  key={idx}
                  sx={{ '& .MuiTableCell-root': { px: 0.7, border: '1px solid #e0e0e0' } }}
                >
                  <TableCell>
                    <CLStyledTextField
                      onChange={(e) => {
                        const tmpRef = inputRef.slice();
                        tmpRef.splice(idx, 1, { ...el, itemrefCd: e.target.value });
                        setInputRef(tmpRef);
                      }}
                      value={el.itemrefCd}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <CLStyledTextField
                      onChange={(e) => {
                        const tmpRef = inputRef.slice();
                        tmpRef.splice(idx, 1, { ...el, itemrefNm: e.target.value });
                        setInputRef(tmpRef);
                      }}
                      value={el.itemrefNm}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <CLStyledTextField
                      onChange={(e) => {
                        const tmpRef = inputRef.slice();
                        tmpRef.splice(idx, 1, { ...el, itemrefaliasNm: e.target.value });
                        setInputRef(tmpRef);
                      }}
                      value={el.itemrefaliasNm}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <CLStyledTextField
                      onChange={(e) => {
                        const tmpRef = inputRef.slice();
                        tmpRef.splice(idx, 1, { ...el, itemrefexprDesc: e.target.value });
                        setInputRef(tmpRef);
                      }}
                      value={el.itemrefexprDesc}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Stack
                      direction="row"
                      width={'100%'}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <IconButton
                        color="primary"
                        disabled={
                          trimAndStringLenght(el.itemrefCd) < 1 ||
                          trimAndStringLenght(el.itemrefNm) < 1 ||
                          trimAndStringLenght(el.itemrefaliasNm) < 1
                        }
                        onClick={() => onSubmit(el, idx)}
                        size="small"
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          const tmpArr = inputRef.slice();
                          tmpArr.splice(idx, 1);
                          setInputRef(tmpArr);
                        }}
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {itemRef?.map((el, idx) => (
                <ItemRefModifyDialogRow
                  key={idx}
                  onDelete={(data) => {
                    doDelete(data.itemid, data.itemrefCd);
                  }}
                  onSave={(data, asisInputItemrefCd) => {
                    doSave({ ...data }, item.itemid, true, asisInputItemrefCd);
                  }}
                  data={el}
                  idx={idx}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
          <Button size="small" variant="outlined" startIcon={<CheckIcon />} onClick={onClose}>
            닫기
          </Button>
        </Stack>
      </DialogContent>
    </CustomDragableDialog>
  );
}
