import { useLoginProfile } from '@/auth/useLoginProfile';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import type { CLUser } from '@local/domain';
import { UserProfile } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import { CustomDialog, flatSx, isEnterKeyEvent, PasswordTextField } from '@local/ui';
import CloseIcon from '@mui/icons-material/Close';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { NewPswd } from './pswd-new-schema';
import { newPswdSchema } from './pswd-new-schema';
import errorCustomHandle from '@/lib/error-custom-handle';

const rootSx: SxProps<Theme> = (theme) => ({});

export type PswdMustChangeDialogProps = {
  sx?: SxProps;
  className?: string;
  open: boolean;
  onClose: () => void;
  data: CLUser;
  // onSubmit
  clientVersion?: boolean;
};

export default function PswdMustChangeDialog(props: PswdMustChangeDialogProps) {
  const { sx, className, open, onClose, data, clientVersion } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const login = useLoginProfile();

  const formConfig = useForm<NewPswd>({
    resolver: yupResolver(newPswdSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formConfig;

  const handleCloseDialog = () => {
    onClose();
  };

  const doUpdate = useCallback(
    async (params: { userId: number; pswd: string }): Promise<CLUser | null> => {
      setLoading(true);
      try {
        const { body } = await api.userManage.updatePassword(params);
        const { user } = body;
        toast.success('비밀번호 변경 완료');

        return user;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );

  const onPswdInitHandle = (pswdObj: NewPswd) => {
    doUpdate({ userId: data.userId, pswd: pswdObj.pswd });
    handleCloseDialog();
  };

  const canEdit = !isSubmitting && !loading && !saving;

  return (
    <CustomDialog
      maxWidth="xs"
      fullWidth
      className={clsx('PswdMustChangeDialog-root', className)}
      sx={flatSx(rootSx, sx)}
      open={open}
      onClose={handleCloseDialog}
    >
      <Stack direction="row" justifyContent="center" mt={2.5} mx={1.5} alignItems="center">
        <Stack flex={1} />
        {clientVersion ? (
          <Typography
            sx={{
              em: {
                color: 'secondary.main',
                fontStyle: 'normal',
              },
            }}
            variant="h5"
          >
            <em>{data.lgonId}</em>의 비밀번호 변경
          </Typography>
        ) : (
          <Typography
            sx={{
              em: {
                color: 'secondary.main',
                fontStyle: 'normal',
              },
            }}
            variant="h5"
          >
            <em>{data.lgonId}</em>의 비밀번호 초기화
          </Typography>
        )}
        <Stack direction="row" justifyContent="flex-end" flex={1}>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>
      <DialogContent sx={{ overflow: 'hidden', px: 1, pt: 4, pb: 0 }}>
        <Stack px={2.5}>
          <PasswordTextField
            {...register('pswd')}
            autoFocus
            disabled={!canEdit}
            error={!!errors.pswd}
            helperText={errors.pswd?.message}
            label={clientVersion ? '변경할 비밀번호' : '초기화 비밀번호'}
            size="small"
            placeholder=" 비밀번호를 입력하세요"
            fullWidth
            onKeyDown={(e) => {
              if (isEnterKeyEvent(e)) {
                const value = (e.target as HTMLInputElement).value;
                if (pstring.isNotBlank(value)) {
                  e.preventDefault();
                  onPswdInitHandle({ pswd: value });
                }
              }
            }}
          />
        </Stack>
        <Box
          component="ul"
          sx={{
            mt: 5,
            em: {
              color: 'secondary.main',
              fontStyle: 'normal',
            },
          }}
        >
          <li>
            비밀번호는 <em>영문대소문자, 특수문자, 숫자를</em> 포함해야 합니다.
          </li>
          <li>
            총 <em>8글자</em> 이상이여야 합니다.
          </li>
          {!clientVersion && (
            <li>
              사용자 최초 로그인시 반드시 비밀번호를 <em>변경</em>해야 합니다
            </li>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit(onPswdInitHandle)} color="secondary">
          저장
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
