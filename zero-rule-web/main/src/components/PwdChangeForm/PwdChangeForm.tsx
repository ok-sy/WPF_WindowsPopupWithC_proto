import { pstring } from '@cp949/pjs';
import { yupResolver } from '@hookform/resolvers/yup';
import { isEnterOrTabKeyEvent, PasswordTextField, requestFocusSelector } from '@local/ui';
import { Box, Stack } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { PwdForm } from './pwd-change-schema';
import { pwdSchema } from './pwd-change-schema';
type Props = {
  onSubmit: (oldPassword: string, newPassword: string) => void;
  onValid: (isValid: boolean) => void;
};
export default function PwdChangeForm(props: Props) {
  const rootRef = useRef<HTMLElement>();
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

  useEffect(() => {
    props.onValid(isValid);
    props.onSubmit(watch().oldPwd, watch().pwdCheck);
  }, [watch, props, isValid]);

  const canSubmit = isValid && !isSubmitting;
  const canEdit = !isSubmitting;
  return (
    <Box ref={rootRef}>
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
          mt: 4,
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
      </Box>
    </Box>
  );
}
