import { trimAndStringLenght } from '@/lib/common-validation';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { IconButton, TableCell, TableRow, TextField } from '@mui/material';
import { add } from 'date-fns';
import { useState } from 'react';
import type { EXCEL_GRID } from '../../../grid-sample-data';

interface Props {
  idx: number;
  onSubmitRow: (add: EXCEL_GRID, idx: number) => void;
}

export default function AddRowGrid(props: Props) {
  const { idx, onSubmitRow } = props;

  const [addRow, setAddRow] = useState<EXCEL_GRID>();
  const disabled =
    addRow === undefined ||
    trimAndStringLenght(addRow.costomer) < 1 ||
    trimAndStringLenght(addRow.date) < 1 ||
    trimAndStringLenght(addRow.expl) < 1 ||
    trimAndStringLenght(addRow.status) < 1;
  return (
    <TableRow
      sx={{
        backgroundColor: '#eafafe70',
        '& .MuiTableCell-root': {
          p: 0,
        },
      }}
    >
      <TableCell sx={{ p: 0, textAlign: 'center' }}>
        <IconButton
          disabled={disabled}
          color="success"
          onClick={() => {
            if (!addRow) return;
            onSubmitRow(addRow, idx);
          }}
          size="small"
        >
          <CheckCircleOutlineIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell></TableCell>
      <TableCell>
        <TextField
          placeholder="값을 입력하세요"
          value={addRow?.expl}
          onChange={(e) => {
            setAddRow((p) => {
              if (!p) {
                return { expl: e.target.value };
              }
              return { ...p, expl: e.target.value };
            });
          }}
          fullWidth
          size="small"
        />
      </TableCell>
      <TableCell>
        <TextField
          placeholder="값을 입력하세요"
          value={addRow?.costomer}
          onChange={(e) => {
            setAddRow((p) => {
              if (!p) {
                return { costomer: e.target.value };
              }
              return { ...p, costomer: e.target.value };
            });
          }}
          fullWidth
          size="small"
        />
      </TableCell>
      <TableCell>
        <TextField
          placeholder="값을 입력하세요"
          value={addRow?.date}
          onChange={(e) => {
            setAddRow((p) => {
              if (!p) {
                return { date: e.target.value };
              }
              return { ...p, date: e.target.value };
            });
          }}
          fullWidth
          size="small"
        />
      </TableCell>
      <TableCell>
        <TextField
          placeholder="값을 입력하세요"
          value={addRow?.status}
          onChange={(e) => {
            setAddRow((p) => {
              if (!p) {
                return { status: e.target.value };
              }
              return { ...p, status: e.target.value };
            });
          }}
          fullWidth
          size="small"
        />
      </TableCell>
    </TableRow>
  );
}
