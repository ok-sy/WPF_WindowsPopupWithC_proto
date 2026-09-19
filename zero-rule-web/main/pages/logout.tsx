import { LoginProfileEvent, LoginTokenStorage } from '@/auth/authentication';
import { useLoginProfile } from '@/auth/useLoginProfile';
import { routerPush } from '@/lib/urls';
import { useApi } from '@/provider';
import type { NextPage } from 'next';
import { useCallback, useEffect } from 'react';

const LogoutPage: NextPage = () => {
  const api = useApi();

  const doLogout = useCallback(async () => {
    try {
      await api.auth.signOut({});
    } catch (err) {
      // ignore
    }
  }, [api]);

  useEffect(() => {
    LoginProfileEvent.send(null);
    if (LoginTokenStorage.exists()) {
      doLogout();
    }
    routerPush('/login');
  }, [doLogout]);

  return null;
};

export default LogoutPage;
