import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import { CLStyledInputTableCell, CLStyledInputTextField } from '@/components/TableCellInputText';
import { CLStyleInputSelect } from '@/components/TableCellInputText/CLStyleInputSelect';
import { MenuItem, TableCell, TableRow, Typography } from '@mui/material';
import type { RuleInterfaceMapVo } from '@local/domain';
import clsx from 'clsx';

type Props = {
  data: RuleInterfaceMapVo;
  onClickRow: (data: RuleInterfaceMapVo, idx: number) => void;
  selected: boolean;
  idx: number;
  onChangeValue: (data: RuleInterfaceMapVo, idx: number) => void;
  onClickChecked: (data: number) => void;
  isChecked: boolean;
};
export default function InterfaceMapRow(props: Props) {
  const { data, onClickRow, selected, onChangeValue, idx, onClickChecked, isChecked } = props;
  const {
    characterset,
    crudGubun,
    datatypeCd,
    ifNm,
    fieldCodeType,
    fieldEngNm,
    fieldKorNm,
    fieldLength,
    fieldOrder,
    fieldScale,
    fieldStartNo,
    firstregDatetime,
    firstregUserid,
    ifid,
    trimYn,
    updateDatetime,
    updateUserid,
  } = data;
  if (crudGubun === 'C') {
    return (
      <TableRow
        className={clsx('InterfaceMapRow-root', {
          x_selected: selected,
        })}
        onClick={() => {
          onClickRow(data, idx);
        }}
        sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}
      >
        <TableCell></TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.75rem' }}>
            {crudGubun ?? 'R'}
          </Typography>
        </TableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            fullWidth
            variant="outlined"
            value={fieldEngNm ?? ''}
            onChange={(e) => onChangeValue({ ...data, fieldEngNm: e.target.value }, idx)}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            fullWidth
            variant="outlined"
            value={fieldKorNm ?? ''}
            onChange={(e) => onChangeValue({ ...data, fieldKorNm: e.target.value }, idx)}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            type="number"
            fullWidth
            variant="outlined"
            value={fieldOrder ?? ''}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (e.target.value.length > 5) {
                value = value.slice(0, 5);
              }
              onChangeValue({ ...data, fieldOrder: Number(value) }, idx);
            }}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            type="number"
            fullWidth
            variant="outlined"
            value={fieldLength ?? ''}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (e.target.value.length > 5) {
                value = value.slice(0, 5);
              }
              onChangeValue({ ...data, fieldLength: Number(value) }, idx);
            }}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            fullWidth
            variant="outlined"
            type="number"
            value={fieldStartNo ?? ''}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (e.target.value.length > 5) {
                value = value.slice(0, 5);
              }
              onChangeValue({ ...data, fieldStartNo: Number(value) }, idx);
            }}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            fullWidth
            variant="outlined"
            value={fieldCodeType ?? ''}
            onChange={(e) => onChangeValue({ ...data, fieldCodeType: e.target.value }, idx)}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyleInputSelect
            fullWidth
            value={datatypeCd ?? 'number'}
            onChange={(e) => onChangeValue({ ...data, datatypeCd: e.target.value as string }, idx)}
          >
            <MenuItem value="number">number</MenuItem>
            <MenuItem value="string">string</MenuItem>
          </CLStyleInputSelect>
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            type="number"
            fullWidth
            variant="outlined"
            value={fieldScale ?? ''}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (e.target.value.length > 2) {
                value = value.slice(0, 2);
              }
              onChangeValue({ ...data, fieldScale: Number(value) }, idx);
            }}
          />
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyleInputSelect
            fullWidth
            value={trimYn ?? 'Y'}
            onChange={(e) => onChangeValue({ ...data, trimYn: e.target.value as string }, idx)}
          >
            <MenuItem value="Y" sx={{ textAlign: 'center' }}>
              Y
            </MenuItem>
            <MenuItem value="N" sx={{ textAlign: 'center' }}>
              N
            </MenuItem>
          </CLStyleInputSelect>
        </CLStyledInputTableCell>
        <CLStyledInputTableCell>
          <CLStyledInputTextField
            size="small"
            fullWidth
            variant="outlined"
            value={characterset ?? ''}
            onChange={(e) => onChangeValue({ ...data, characterset: e.target.value }, idx)}
          />
        </CLStyledInputTableCell>
      </TableRow>
    );
  }
  return (
    <TableRow
      className={clsx('InterfaceMapRow-root', {
        x_selected: selected,
      })}
      onClick={() => {
        onClickRow(data, idx);
      }}
      sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}
    >
      <TableCell>
        <CLStyledTableCheckBox
          checked={isChecked}
          onChange={() => {
            onClickChecked(idx);
          }}
        />
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Typography sx={{ textAlign: 'center', fontSize: '0.75rem' }}>
          {crudGubun ?? 'R'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'left' }}>{fieldEngNm}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'left' }}>{fieldKorNm}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'right' }}>{fieldOrder}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'right' }}>{fieldLength}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'right' }}>{fieldStartNo}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'center' }}>{fieldCodeType}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'left' }}>{datatypeCd}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'right' }}>{fieldScale}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'center' }}>{trimYn}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ textAlign: 'center' }}>{characterset}</Typography>
      </TableCell>
    </TableRow>
  );
}
