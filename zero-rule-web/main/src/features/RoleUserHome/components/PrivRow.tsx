import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { CLPriv } from '@local/domain';
import { useTimeoutData } from '@local/ui';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Box, CircularProgress, IconButton, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

interface Props {
  className?: string;
  seq: number;
  userId: number;
  priv: CLPriv;
  granted: boolean;
  onGrantUpdated: (privId: string, granted: boolean) => void;
}

export default function PrivRow(props: Props) {
  const { userId, className, seq, priv, granted, onGrantUpdated } = props;
  const api = useApi();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useTimeoutData<boolean>(500);
  const { privId, privNm } = priv;

  const doUpdateGrant = useCallback(
    async (userId: number, privId: string, granted: boolean): Promise<boolean> => {
      setSaving(true);
      try {
        if (granted) {
          await api.clRoleUser.grantPriv({ userId, privId });
        } else {
          await api.clRoleUser.revokePriv({ userId, privId });
        }
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

  // 체크박스 클릭, 부여된 권한을 토글한다
  const handleClickRoleCheckbox = () => {
    const newGranted = !granted;
    doUpdateGrant(userId, privId, newGranted).then((success) => {
      if (success) {
        setSaved(true);
        onGrantUpdated(privId, newGranted);
      }
    });
  };

  return (
    <TableRow className={clsx('RoleRow-root', className)}>
      <TableCell>{seq}</TableCell>
      <TableCell>
        <Typography color={granted ? 'primary' : 'inherit'}>{privId}</Typography>
      </TableCell>
      <TableCell>
        <Typography color={granted ? 'primary' : 'inherit'}>{privNm}</Typography>
      </TableCell>
      <TableCell>
        {saving && (
          <Box sx={{ p: 1 }}>
            <CircularProgress color="secondary" size="1.1rem" />
          </Box>
        )}
        {!saving && (
          <Box sx={{ position: 'relative' }}>
            <IconButton
              disabled={!!saved}
              onClick={handleClickRoleCheckbox}
              sx={{
                opacity: saved ? 0 : 1,
              }}
            >
              {!granted && <CheckBoxOutlineBlankIcon fontSize="small" />}
              {granted && <CheckBoxIcon fontSize="small" color="primary" />}
            </IconButton>
            {saved && (
              <Typography
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  transform: 'translateY(-50%)',
                  fontSize: '0.8rem',
                  color: 'success.main',
                }}
              >
                SAVED
              </Typography>
            )}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}
