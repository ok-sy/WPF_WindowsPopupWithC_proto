import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const LoginHome = dynamic(() => import('@/features/LoginHome'));

const LoginPage: NextPage = () => {
  return <LoginHome kind="login" />;
};

export default LoginPage;
