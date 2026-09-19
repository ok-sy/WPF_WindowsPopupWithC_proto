import { useLoginProfile } from '@/auth/useLoginProfile';
import handleError from '@/lib/handle-error';
import type { ApiRequestContext } from '@local/domain';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useApi } from './ApiProvider';
import { NavManager } from './NavManager';
import errorCustomHandle from '@/lib/error-custom-handle';
import { toast } from 'react-toastify';

const navManager = new NavManager();

export const NavContext = createContext(navManager);

export const useNav = () => useContext(NavContext);

type Props = {
  children?: React.ReactNode;
};

/**
 * nav provider
 */
export default function NavProvider(props: Props) {
  const { children } = props;
  const api = useApi();
  const loginProfile = useLoginProfile();
  const isLoggedIn = !!loginProfile;
  const [loading, setLoading] = useState(false);

  const doLoad = useCallback(
    async (ctx: ApiRequestContext, navId: number) => {
      try {
        setLoading(true);

        const { body } = await api.clNav.items({
          ctx,
          navId,
          withHidden: false,
        });
        const { nav, navItemList } = body;
        if (ctx.canceled) return;
        navManager.setNavItems(navItemList);
      } catch (err) {
        // api.auth.signOut({})
        // toast.error('접근권한이 없어 로그아웃됩니다.')
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      navManager.clear();
      return;
    }
    const navId = Number(loginProfile.profile.navId);
    const ctx: ApiRequestContext = { canceled: false };
    doLoad(ctx, navId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doLoad, isLoggedIn, loginProfile]);

  if (!isLoggedIn) return null;

  const menuManager = navManager.getMenuManager();
  if (menuManager.isEmpty()) {
    return <div>loading...</div>;
  }

  return <NavContext.Provider value={navManager}>{children}</NavContext.Provider>;
}
