import handleError from '@/lib/handle-error';
import { isEnterKeyEvent, requestFocusSelector } from '@local/ui';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { pstring } from '@cp949/pjs';
import type { UserProfile } from '@local/domain';
import { PasswordTextField } from '@local/ui';
import { yupResolver } from '@hookform/resolvers/yup';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { SignUpFormDataType } from './signup-form-schema';
import { signUpFormSchema } from './signup-form-schema';

import { rootSx } from './style';
import errorCustomHandle from '@/lib/error-custom-handle';

const DEFAULT_VALUES: Partial<SignUpFormDataType> = {
  lgonId: '',
  userNm: '',
  passwd: '',
  passwdRepeat: '',
  // userEmail: 'abcd1234@gmail.com',
  // userPhone: '010-1111-2222',
};

type Props = {
  onClickLoginLink: () => void;
  onSignUpSuccess: (profile: UserProfile) => void;
};

export default function SignUpForm(props: Props) {
  const { onClickLoginLink: onClickLogin, onSignUpSuccess } = props;
  const rootRef = useRef<HTMLElement>();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 현재 중복 체크중인 사용자ID
  const [checkingLgonId, setCheckingLgonId] = useState<string>();

  // 중복 체크한 사용자 ID 캐시
  const [checkedLgonIdCache, setCheckedLgonIds] = useState<Record<string, boolean>>({});

  const formConfig = useForm<SignUpFormDataType>({
    resolver: yupResolver(signUpFormSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { touchedFields, errors, isValid, isSubmitting },
  } = formConfig;

  const lgonId = watch('lgonId');

  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  // 사용자ID가 이용가능한지 체크
  const doCheckAvailabeLgonId = useCallback(
    async (ctx: ApiRequestContext, lgonId: string): Promise<boolean | undefined> => {
      try {
        setCheckingLgonId(lgonId);
        const isAvail = await (await api.auth.isAvailableUserId({ ctx, lgonId })).body;
        if (ctx.canceled) return undefined;
        setCheckedLgonIds((p) => ({ ...p, [lgonId]: isAvail }));
        if (isAvail) {
          toast.success('이용 가능한 ID입니다');
        } else {
          toast.warn('이용할 수 없는 ID입니다');
        }
        return isAvail;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setCheckingLgonId(undefined);
      }
      return undefined;
    },
    [api],
  );

  // 체크할 사용자ID가 변경되면, check 실행
  useEffect(() => {
    if (!checkingLgonId) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doCheckAvailabeLgonId(ctx, checkingLgonId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [checkingLgonId, doCheckAvailabeLgonId]);

  // 회원가입
  const doSignUp = useCallback(
    async (params: {
      lgonId: string;
      userNm: string;
      passwd: string;
    }): Promise<UserProfile | null> => {
      const { lgonId, userNm, passwd } = params;
      setSaving(true);
      try {
        const { body } = await api.auth.signUp({ lgonId, userNm, passwd });
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

  const onSubmit = (data: SignUpFormDataType) => {
    const { lgonId, userNm, passwd } = data;

    doSignUp({ lgonId, userNm, passwd }).then((profile: UserProfile | null) => {
      if (profile) {
        toast.success('회원가입이 정상 처리되었습니다');
        onSignUpSuccess(profile);
      }
    });
  };

  //
  const handleClickDupCheck = (lgonId?: string) => {
    if (!lgonId) return;
    setCheckingLgonId(lgonId);
  };

  const canSubmit = isValid && !isSubmitting && !loading && !saving;
  const canEdit = !isSubmitting && !loading && !saving;

  const lgonIdChecked = lgonId ? typeof checkedLgonIdCache[lgonId] === 'boolean' : false;
  const lgonIdErrorMsg =
    checkedLgonIdCache[lgonId] === false ? '사용할 수 없는 ID입니다' : errors.lgonId?.message;

  return (
    <Box className="SignUpForm-root" sx={rootSx} ref={rootRef}>
      <Box className="SignUpForm-container">
        <FormProvider {...formConfig}>
          <form autoComplete="off">
            <Box className="SignUpForm-formWrapper">
              <Box className="SignUpForm-titleBox">
                <IconButton
                  className="SignUpForm-backBtn"
                  disabled={!canEdit}
                  onClick={onClickLogin}
                >
                  <ArrowBackIosIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="h5" className="SignUpForm-titleText">
                  ZERO RULE 회원가입
                </Typography>
              </Box>
              <Stack direction="column" className="SignUpForm-form" spacing={3}>
                <Box className="SignUpForm-formControl">
                  <TextField
                    {...register('lgonId')}
                    label="아이디"
                    required
                    variant="outlined"
                    disabled={!canEdit}
                    autoComplete="new-password"
                    className="SignUpForm-input SignUpForm-lgonId"
                    error={!!errors.lgonId || !!lgonIdErrorMsg}
                    helperText={lgonIdErrorMsg}
                    onKeyDown={(e) => {
                      if (isEnterKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=userNm]');
                        }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            variant="outlined"
                            className="SignUpForm-userIdDupCheck"
                            disabled={!lgonId || lgonIdChecked}
                            onClick={() => handleClickDupCheck(lgonId)}
                          >
                            중복확인
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box className="SignUpForm-formControl">
                  <TextField
                    {...register('userNm')}
                    label="이름"
                    required
                    variant="outlined"
                    autoComplete="new-password"
                    disabled={!canEdit}
                    className="SignUpForm-input SignUpForm-userNm"
                    error={!!errors.userNm}
                    helperText={errors.userNm?.message}
                    onKeyDown={(e) => {
                      if (isEnterKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=passwd]');
                        }
                      }
                    }}
                  />
                </Box>
                <Stack spacing={2} direction={'column'} sx={{ width: '100%' }}>
                  <PasswordTextField
                    fullWidth
                    {...register('passwd')}
                    label="비밀번호"
                    required
                    className="SignUpForm-input SignUpForm-passwd"
                    autoComplete="new-password"
                    error={!!errors.passwd}
                    helperText={errors.passwd?.message}
                    disabled={!canEdit}
                    onKeyDown={(e) => {
                      if (isEnterKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=passwdRepeat]');
                        }
                      } else {
                        if (touchedFields.passwdRepeat) {
                          trigger('passwdRepeat');
                        }
                      }
                    }}
                  />
                  <PasswordTextField
                    fullWidth
                    {...register('passwdRepeat')}
                    label="비밀번호 확인"
                    required
                    className="SignUpForm-input SignUpForm-passwdRepeat"
                    error={!!errors.passwdRepeat}
                    helperText={errors.passwdRepeat?.message}
                    disabled={!canEdit}
                    onKeyDown={(e) => {
                      if (isEnterKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('.SignUpForm-submitBtn');
                        }
                      }
                    }}
                  />
                </Stack>

                {/* <Box className="SignUpForm-formControl">
                                    <TextField
                                        {...register('userEmail')}
                                        label="이메일"
                                        required
                                        variant="outlined"
                                        autoComplete="new-password"
                                        disabled={!canEdit}
                                        className="SignUpForm-input SignUpForm-userEmail"
                                        error={!!errors.userEmail}
                                        helperText={errors.userEmail?.message}
                                        onKeyDown={(e) => {
                                            if (isEnterKeyEvent(e)) {
                                                const value = (e.target as HTMLInputElement).value
                                                if (pstring.isNotBlank(value)) {
                                                    e.preventDefault()
                                                    focus('input[name=passwd]')
                                                }
                                            }
                                        }}
                                    />
                                </Box> */}
              </Stack>
              <Box mt={6}>
                <Button
                  className="SignUpForm-submitBtn"
                  variant="contained"
                  size="large"
                  color="primary"
                  disabled={!canSubmit}
                  onClick={handleSubmit(onSubmit)}
                >
                  가입하기
                </Button>
              </Box>
            </Box>
          </form>
        </FormProvider>
      </Box>
    </Box>
  );
}
