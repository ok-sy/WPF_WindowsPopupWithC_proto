import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { CLRolePageDetail } from '@local/domain';
import { useTimeoutData } from '@local/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import CRUDButton from './CRUDButton';
import errorCustomHandle from '@/lib/error-custom-handle';

function crudStr(params: {
  c: boolean;
  r: boolean;
  u: boolean;
  d: boolean;
}): Array<'C' | 'R' | 'U' | 'D'> {
  const { c, r, u, d } = params;
  const arr = [] as Array<'C' | 'R' | 'U' | 'D'>;
  if (c) arr.push('C');
  if (r) arr.push('R');
  if (u) arr.push('U');
  if (d) arr.push('D');
  return arr;
}

interface Props {
  className?: string;
  seq: number;
  rolePage: CLRolePageDetail;
}

export default function RolePageRow(props: Props) {
  const { className, seq, rolePage } = props;
  const api = useApi();
  const { pageNm, pageId, roleId } = rolePage;
  const [values, setValues] = useState(() => crudStr(rolePage));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useTimeoutData<boolean>(1000);

  const doSave = useCallback(
    async (params: {
      roleId: string;
      pageId: number;
      c: boolean;
      r: boolean;
      u: boolean;
      d: boolean;
    }) => {
      setSaving(false);
      try {
        await api.clRole.saveRolePage(params);
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setSaving(false);
      }
      return false;
    },
    [api],
  );

  const handleClickSave = () => {
    doSave({
      roleId,
      pageId,
      c: values.includes('C'),
      r: values.includes('R'),
      u: values.includes('U'),
      d: values.includes('D'),
    }).then((success) => {
      if (success) {
        setSaved(true);
      }
    });
  };

  return (
    <TableRow className={clsx('RoleRow-root', className)}>
      <TableCell>{seq}</TableCell>
      <TableCell>
        <Tooltip title={pageNm}>
          <Typography>{pageNm}</Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          {values.length < 4 ? (
            <IconButton
              onClick={() => setValues(['C', 'R', 'U', 'D'])}
              sx={{ color: 'primary.light' }}
            >
              <RadioButtonUncheckedIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton onClick={() => setValues([])} sx={{ color: 'primary.light' }}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          )}

          <CRUDButton values={values} onChange={setValues} />
          {saving && <CircularProgress color="secondary" size="1rem" />}
          {!saving && (
            <Box sx={{ position: 'relative' }}>
              <Tooltip title="저장">
                <IconButton
                  disabled={!!saved}
                  onClick={handleClickSave}
                  sx={{
                    opacity: saved ? 0 : 1,
                  }}
                >
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              {saved && (
                <Typography
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(0deg)',
                    fontSize: '0.8rem',
                    color: 'success.main',
                  }}
                >
                  SAVED
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
