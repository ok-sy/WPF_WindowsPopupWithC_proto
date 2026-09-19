import { LoginProfileEvent, LoginTokenStorage } from '@/auth/authentication';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';
import { routerPush } from '@/lib/urls';
import theme from '@/theme';
import type { UserProfile } from '@local/domain';
import { Box, createTheme, ThemeProvider } from '@mui/material';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { rootSx } from './style';

const loginTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#00cba4',
    },
    error: {
      main: '#ffa000',
    },
  },
});

const signUpTheme = createTheme({
  ...theme,
  palette: {
    mode: 'light',
    primary: {
      main: '#5d64d4',
    },
    error: {
      main: '#c2185b',
    },
  },
});

type Props = {
  kind?: 'login' | 'sign-up' | 'forgot';
};

export default function LoginHome(props: Props) {
  const { kind = 'login' } = props;

  const handleLoginSuccess = (profile: UserProfile) => {
    LoginProfileEvent.send(profile);
    routerPush('/');
  };

  // 비밀번호 찾기 버튼 클릭
  const handleClickPwFindLink = () => {
    toast.warn('지원 예정');
  };

  // 회원가입 버튼 클릭
  const handleClickSignUpLink = () => {
    routerPush('/sign-up');
  };

  // 로그인 버튼 클릭
  const handleClickLoginLink = () => {
    routerPush('/login');
  };

  // 만약 로그인이 된 상태로 Login 화면에 진입하면, 로그아웃 시킨다
  useEffect(() => {
    LoginTokenStorage.clear();
  }, []);

  return (
    <Box className="LoginHome-root" sx={rootSx}>
      {kind === 'login' && (
        <ThemeProvider theme={loginTheme}>
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onClickPasswdFindLink={handleClickPwFindLink}
            onClickSignUpLink={handleClickSignUpLink}
          />
        </ThemeProvider>
      )}
      {kind === 'sign-up' && (
        <ThemeProvider theme={signUpTheme}>
          <SignUpForm
            onClickLoginLink={handleClickLoginLink}
            onSignUpSuccess={handleLoginSuccess}
          />
        </ThemeProvider>
      )}
    </Box>
  );
}
