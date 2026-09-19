import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { CLRole } from '@local/domain';
import { sleepAsync, useTimeoutData } from '@local/ui';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Box, CircularProgress, IconButton, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

interface Props {
  className?: string;
  seq: number;
  userId: number;
  role: CLRole;
  granted: boolean;
  onGrantUpdated: (roleId: string, granted: boolean) => void;
}

export default function RoleRow(props: Props) {
  const { userId, className, seq, role, granted, onGrantUpdated } = props;
  const api = useApi();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useTimeoutData<boolean>(500);
  const { roleId, roleNm } = role;

  const doUpdateGrant = useCallback(
    async (userId: number, roleId: string, granted: boolean): Promise<boolean> => {
      setSaving(true);
      try {
        if (granted) {
          await api.clRoleUser.grantRole({ userId, roleId });
        } else {
          await api.clRoleUser.revokeRole({ userId, roleId });
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
    doUpdateGrant(userId, roleId, newGranted).then((success) => {
      if (success) {
        setSaved(true);
        onGrantUpdated(roleId, newGranted);
      }
    });
  };

  return (
    <TableRow className={clsx('RoleRow-root', className)}>
      <TableCell>{seq}</TableCell>
      <TableCell>
        <Typography color={granted ? 'primary' : 'inherit'}>{roleId}</Typography>
      </TableCell>
      <TableCell>
        <Typography color={granted ? 'primary' : 'inherit'}>{roleNm}</Typography>
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
