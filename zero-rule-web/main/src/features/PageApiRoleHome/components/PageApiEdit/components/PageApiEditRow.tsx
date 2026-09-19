import CLStyledTextField from '@/components/CLStyledTextField';
import type { CLPageApi } from '@local/domain';
import ClearIcon from '@mui/icons-material/Clear';
import {
  IconButton,
  TableCell,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

type Props = {
  data: CLPageApi;
  onClickDeleteBtn: () => void;
  onChangeUrlNm: (apiUrlNm?: string) => void;
  onChangeUrl: (apiUrl?: string) => void;
  onChangePId: (privId?: 'C' | 'R' | 'U' | 'D') => void;
};

export default function PageApiEditRow(props: Props) {
  const { data, onClickDeleteBtn } = props;
  const [values, setValues] = useState<'C' | 'R' | 'U' | 'D'>();

  const [apiUrlNm, setApiUrlNm] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');

  const onChangeUrlNmFnRef = useRef<Props['onChangeUrlNm']>();
  onChangeUrlNmFnRef.current = props.onChangeUrlNm;
  const onChangeUrlfnRef = useRef<Props['onChangeUrl']>();
  onChangeUrlfnRef.current = props.onChangeUrl;
  const onChangePIdFnRef = useRef<Props['onChangePId']>();
  onChangePIdFnRef.current = props.onChangePId;

  const handleChange = (event: React.MouseEvent<HTMLElement>, newValues: string) => {
    setValues(newValues as 'C' | 'R' | 'U' | 'D');
  };

  useEffect(() => {
    onChangeUrlNmFnRef.current?.(apiUrlNm);
  }, [apiUrlNm]);

  useEffect(() => {
    onChangeUrlfnRef.current?.(apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    onChangePIdFnRef.current?.(values);
  }, [values]);

  useEffect(() => {
    if (!data) return;
    setValues(data.privId as 'C' | 'R' | 'U' | 'D');
    setApiUrl(data.apiUrl);
    setApiUrlNm(data.apiUrlNm);
  }, [data]);

  return (
    <TableRow sx={{ '& .MuiTableCell-root': { px: 2 } }}>
      <TableCell>
        <CLStyledTextField
          size="small"
          autoFocus
          required
          value={apiUrlNm}
          onChange={(e) => setApiUrlNm(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <CLStyledTextField
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          autoFocus
          required
          size="small"
          fullWidth
        />
      </TableCell>

      <TableCell>
        <ToggleButtonGroup color="primary" exclusive value={values} onChange={handleChange}>
          <ToggleButton value="C" size="small" sx={{ px: 2 }}>
            C
          </ToggleButton>
          <ToggleButton value="R" size="small" sx={{ px: 2 }}>
            R
          </ToggleButton>
          <ToggleButton value="U" size="small" sx={{ px: 2 }}>
            U
          </ToggleButton>
          <ToggleButton value="D" size="small" sx={{ px: 2 }}>
            D
          </ToggleButton>
        </ToggleButtonGroup>
      </TableCell>
      <TableCell>
        <IconButton size="small">
          <ClearIcon onClick={onClickDeleteBtn} fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
