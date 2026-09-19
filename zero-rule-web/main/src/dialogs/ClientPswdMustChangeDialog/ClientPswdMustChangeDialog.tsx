import { useLoginProfile } from '@/auth/useLoginProfile';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import type { CLUser, UserProfile } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  flatSx,
  isEnterKeyEvent,
  isEnterOrTabKeyEvent,
  PasswordTextField,
  requestFocusSelector,
} from '@local/ui';
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
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { NewPswd, newPswdSchema } from './pswd-new-schema';
import errorCustomHandle from '@/lib/error-custom-handle';
import type { PwdForm } from '@/components/PwdChangeForm/pwd-change-schema';
import { pwdSchema } from '@/components/PwdChangeForm/pwd-change-schema';
import { LoginProfileEvent } from '@/auth/authentication';
import { routerPush } from '@/lib/urls';

const rootSx: SxProps<Theme> = (theme) => ({});

export type ClientPswdMustChangeDialogProps = {
  sx?: SxProps;
  className?: string;
  open: boolean;
  onClose: () => void;
  data: CLUser;
  // onSubmit
  clientVersion?: boolean;
};

export default function ClientPswdMustChangeDialog(props: ClientPswdMustChangeDialogProps) {
  const { sx, className, open, onClose, data, clientVersion } = props;
  const rootRef = useRef<HTMLElement>();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const login = useLoginProfile();

  const formConfig = useForm<PwdForm>({
    resolver: yupResolver(pwdSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  const handleCloseDialog = () => {
    onClose();
  };
  const doSaveNewPassword = useCallback(
    async (oldPassword: string, password: string): Promise<UserProfile | null> => {
      try {
        setSaving(true);
        const { body } = await api.user.updatePassword({ oldPswd: oldPassword, pswd: password });
        const { profile } = body;
        return profile;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setSaving(false);
      }
      return null;
    },
    [api],
  );

  const handleClickSaveBtn = (data: PwdForm) => {
    doSaveNewPassword(data.oldPwd, data.pwdCheck).then((profile) => {
      if (profile) {
        LoginProfileEvent.send(profile);
        routerPush('/logout');
      }
    });
  };

  const canEdit = !isSubmitting && !loading && !saving;

  return (
    <CustomDialog
      maxWidth="xs"
      fullWidth
      className={clsx('ClientPswdMustChangeDialog-root', className)}
      sx={flatSx(rootSx, sx)}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleCloseDialog();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
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
      <DialogContent sx={{ overflow: 'hidden', px: 1, pt: 4, pb: 0 }} ref={rootRef}>
        <Stack spacing={2.5} pb={1}>
          <PasswordTextField
            {...register('oldPwd')}
            autoFocus
            required
            size="small"
            label="기존 비밀번호"
            disabled={!canEdit}
            error={!!errors.oldPwd}
            helperText={errors.oldPwd?.message}
            onKeyDown={(e) => {
              if (isEnterOrTabKeyEvent(e)) {
                const value = (e.target as HTMLInputElement).value;
                if (pstring.isNotBlank(value)) {
                  e.preventDefault();
                  focus('input[name=newPwd]');
                }
              }
            }}
          />
          <PasswordTextField
            {...register('newPwd')}
            required
            size="small"
            label="새 비밀번호"
            disabled={!canEdit}
            error={!!errors.newPwd}
            helperText={errors.newPwd?.message}
            onKeyDown={(e) => {
              if (isEnterOrTabKeyEvent(e)) {
                const value = (e.target as HTMLInputElement).value;
                if (pstring.isNotBlank(value)) {
                  e.preventDefault();
                  focus('input[name=pwdCheck]');
                }
              }
            }}
          />
          <PasswordTextField
            {...register('pwdCheck')}
            disabled={!canEdit}
            error={!!errors.pwdCheck}
            helperText={errors.pwdCheck?.message}
            required
            size="small"
            label="비밀번호 확인"
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
          <li>
            비밀번호 변경시 로그아웃되어 <em>재로그인</em> 해야합니다.
          </li>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit(handleClickSaveBtn)} color="secondary">
          저장
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
