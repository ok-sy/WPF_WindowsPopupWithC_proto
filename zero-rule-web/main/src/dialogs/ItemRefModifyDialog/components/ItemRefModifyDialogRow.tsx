import { trimAndStringLenght } from '@/lib/common-validation';
import { IconButton, Stack, TableCell, TableRow } from '@mui/material';
import type { ItemRef } from '@local/domain';
// CLDocTableBody, CLDocTableHead
import CLStyledTextField from '@/components/CLStyledTextField/CLStyledTextField';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import { useEffect, useState } from 'react';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
// CLDocTableBody, CLDocTableHead
// CLDocTableBody, CLDocTableHead
// CLDocTableBody, CLDocTableHead
type Props = {
  data: ItemRef;
  idx: number;
  onSave: (data: ItemRef, asisInputItemrefCd: string) => void;
  onDelete: (data: ItemRef) => void;
};

export default function ItemRefModifyDialogRow(props: Props) {
  const { data, idx, onDelete, onSave } = props;
  const {
    itemid,
    itemrefCd,
    itemrefNm,
    itemrefaliasNm,
    itemrefexprDesc,
    updateDatetime,
    updateUserid,
  } = data;

  const [modifyMode, setModifyMode] = useState(false);

  const [inputItemrefCd, setInputItemrefCd] = useState('');
  const [inputItemrefNm, setInputItemrefNm] = useState('');
  const [inputItemrefaliasNm, setInputItemrefaliasNm] = useState('');
  const [inputItemrefexprDesc, setInputItemrefexprDesc] = useState('');

  useEffect(() => {
    setInputItemrefCd(data.itemrefCd);
    setInputItemrefNm(data.itemrefNm);
    setInputItemrefaliasNm(data.itemrefaliasNm);
    setInputItemrefexprDesc(data.itemrefexprDesc);
  }, [data]);

  if (!modifyMode) {
    return (
      <TableRow sx={{ '& .MuiTableCell-root': { px: 0.7, border: '1px solid #e0e0e0' } }}>
        <TableCell>{itemrefCd}</TableCell>
        <TableCell>{itemrefNm}</TableCell>
        <TableCell>{itemrefaliasNm}</TableCell>
        <TableCell>{itemrefexprDesc}</TableCell>
        <TableCell sx={{ p: 0 }}>
          <Stack direction="row" width={'100%'} justifyContent="center" alignItems="center">
            <IconButton
              color="primary"
              onClick={() => {
                setModifyMode(true);
              }}
              size="small"
            >
              <ModeIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => {
                onDelete(data);
              }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
    );
  } else {
    return (
      <TableRow sx={{ '& .MuiTableCell-root': { px: 0.7, border: '1px solid #e0e0e0' } }}>
        <TableCell>
          <CLStyledTextField
            onChange={(e) => {
              setInputItemrefCd(e.target.value);
            }}
            value={inputItemrefCd}
            fullWidth
          />
        </TableCell>
        <TableCell>
          <CLStyledTextField
            onChange={(e) => {
              setInputItemrefNm(e.target.value);
            }}
            value={inputItemrefNm}
            fullWidth
          />
        </TableCell>
        <TableCell>
          <CLStyledTextField
            onChange={(e) => {
              setInputItemrefaliasNm(e.target.value);
            }}
            value={inputItemrefaliasNm}
            fullWidth
          />
        </TableCell>
        <TableCell>
          <CLStyledTextField
            onChange={(e) => {
              setInputItemrefexprDesc(e.target.value);
            }}
            value={inputItemrefexprDesc}
            fullWidth
          />
        </TableCell>
        <TableCell>
          <Stack direction="row" width={'100%'} justifyContent="center" alignItems="center">
            <IconButton
              onClick={() => {
                if (trimAndStringLenght(inputItemrefCd) > 2) {
                  toast.warn('참조코드는 2자리 입니다.');
                  return;
                }
                onSave(
                  {
                    ...data,
                    itemrefCd: inputItemrefCd,
                    itemrefNm: inputItemrefNm,
                    itemrefaliasNm: inputItemrefaliasNm,
                    itemrefexprDesc: inputItemrefexprDesc,
                  },
                  data.itemrefCd,
                );
                setModifyMode(false);
              }}
              color="primary"
              disabled={
                trimAndStringLenght(itemrefCd) < 1 ||
                trimAndStringLenght(itemrefNm) < 1 ||
                trimAndStringLenght(itemrefaliasNm) < 1
              }
              size="small"
            >
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => {
                setModifyMode(false);
              }}
              size="small"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
    );
  }
}
