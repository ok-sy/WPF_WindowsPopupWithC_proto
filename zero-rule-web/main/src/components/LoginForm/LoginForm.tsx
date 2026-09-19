import { LoginProfileEvent, LoginTokenStorage } from '@/auth/authentication';
import handleError from '@/lib/handle-error';
import { routerPush } from '@/lib/urls';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import type { UserProfile } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  flatSx,
  isEnterKeyEvent,
  isEnterOrTabKeyEvent,
  LgOrUp,
  PasswordTextField,
  requestFocusSelector,
} from '@local/ui';
import { Box, Button, Divider, TextField, Typography } from '@mui/material';
import { observer } from 'mobx-react';
import { useCallback, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { loginFormSchema } from './login-form-schema';
import { rootSx } from './style';
import errorCustomHandle from '@/lib/error-custom-handle';

type Props = {
  /**
   * 로그인 성공
   */
  onLoginSuccess: (profile: UserProfile) => void;

  /**
   * 비밀번호 찾기 클릭
   */
  onClickPasswdFindLink: () => void;

  /**
   * 회원가입 클릭
   */
  onClickSignUpLink: () => void;
};

type InputData = {
  lgonId: string;
  passwd: string;
};

const DEFAULT_VALUES: Partial<InputData> = {
  lgonId: 'master',
  passwd: '1111',
};

function LoginForm(props: Props) {
  const { onLoginSuccess, onClickPasswdFindLink, onClickSignUpLink } = props;
  const rootRef = useRef<HTMLElement>();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const formConfig = useForm<InputData>({
    resolver: yupResolver(loginFormSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    // defaultValues: DEFAULT_VALUES,
  });

  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  // 비밀번호 찾기 클릭
  const handleClickPasswdFind = () => {
    onClickPasswdFindLink?.();
  };

  // 서버 로그인 실행
  const doLogin = useCallback(
    async (lgonId: string, passwd: string): Promise<UserProfile | 'needPwdChange' | null> => {
      setLoading(true);
      try {
        const { body } = await api.auth.signIn({
          lgonId,
          passwd,
        });
        const { needPwdChange, profile, isLock, currentTime } = body;
        if (isLock > 0) {
          if (window.confirm('현재 세션정보가 있습니다. 기존 세션 삭제 후 로그인 하시겠습니까?')) {
            await api.lock.delete({ delList: [String(profile.userId)] });
            await api.lock.insert({
              lockcode: '001',
              lockkey: String(profile.userId),
              locktypecode: '1',
              locknote: `${profile.userNm}[${profile.lgonId}]로그인`,
              // currentTime: currentTime,
            });
          } else {
            routerPush('/logout');
          }
        } else {
        }
        if (needPwdChange) {
          toast.warn(`비밀번호 재설정이 필요합니다`);
          return 'needPwdChange';
        }
        toast.success('로그인 되었습니다', {
          autoClose: 1500,
          position: 'top-center',
        });
        LoginProfileEvent.send(profile);
        return profile;
      } catch (err) {
        handleError(err);
        // errorCustomHandle(err) 로그인에서는 메시지를 표시할 하단 및 팝업이 불필요!!!
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );

  const onSubmit = (data: InputData) => {
    // console.log('onSubmit=', { data })
    const lgonId = pstring.trim(data.lgonId);
    const passwd = pstring.trim(data.passwd);

    doLogin(lgonId, passwd).then((result) => {
      if (result === 'needPwdChange') {
        routerPush('/pwd-must-change');
      } else if (result) {
        onLoginSuccess(result);
      }
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  const canSubmit = isValid && !isSubmitting && !loading;
  const canEdit = !isSubmitting && !loading;

  // enter 시 바로 로그인 기능
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isEnterKeyEvent(e)) {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      if (pstring.isNotBlank(value)) {
        setTimeout(() => {
          submitBtnRef.current?.focus();
        }, 0);
        handleSubmit(onSubmit)();
      }
    }
  };
  return (
    <Box className="LoginForm-root" sx={flatSx(rootSx)} ref={rootRef}>
      <Box className="LoginForm-rootContainer">
        <Box className="LoginForm-bgImgBox">
          <Box
            className="LoginForm-bgImg"
            component="img"
            src="/images/login/Mask group2.png"
            alt="로그인 로고"
          />
        </Box>
        <FormProvider {...formConfig}>
          <Box className="LoginForm-formWrapper">
            <Typography variant="h4" className="LoginForm-title">
              ZERO RULE 관리자 로그인
            </Typography>

            <Box className="LoginForm-form">
              <TextField
                {...register('lgonId')}
                label="아이디"
                required
                variant="outlined"
                autoFocus
                disabled={!canEdit}
                className="LoginForm-loginInput LoginForm-userId"
                error={!!errors.lgonId}
                helperText={errors.lgonId?.message}
                onKeyDown={(e) => {
                  if (isEnterOrTabKeyEvent(e)) {
                    const value = (e.target as HTMLInputElement).value;
                    if (pstring.isNotBlank(value)) {
                      e.preventDefault();
                      focus('input[name=passwd]');
                    }
                  }
                }}
              />
              <PasswordTextField
                {...register('passwd')}
                label="비밀번호"
                required
                autoComplete="new-password"
                className="LoginForm-loginInput LoginForm-passwd"
                error={!!errors.passwd}
                helperText={errors.passwd?.message}
                disabled={!canEdit}
                onKeyDown={handleEnterKeyPress}
              />
            </Box>
            <Box mt={4}>
              <Button
                className="LoginForm-submitBtn"
                variant="contained"
                size="large"
                color="primary"
                disabled={!canSubmit}
                onClick={handleSubmit(onSubmit)}
              >
                로그인
              </Button>
            </Box>

            <Box className="LoginForm-extraButtons">
              <Button disabled={loading} onClick={handleClickPasswdFind}>
                비밀번호 찾기
              </Button>
              <Divider orientation="vertical" flexItem />
              <Button disabled={loading} onClick={onClickSignUpLink}>
                회원가입
              </Button>
            </Box>
          </Box>
        </FormProvider>
        <LgOrUp>
          <Box className="LogInForm-sloganBox">
            <h3>WORLD CLASS</h3>
            <h3>IT SOLUTION PROVIDER</h3>
            <h5>CLOVER</h5>
          </Box>
        </LgOrUp>
      </Box>
    </Box>
  );
}

export default observer(LoginForm);
