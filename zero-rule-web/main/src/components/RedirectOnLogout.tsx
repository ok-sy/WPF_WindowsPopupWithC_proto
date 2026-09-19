import { LoginProfileEvent } from '@/auth/authentication';
import { LOGIN_PAGE } from '@/constants';
import { routerPush } from '@/lib/urls';
import React, { useEffect, useState } from 'react';
import { filter, tap } from 'rxjs';

type Props = {
  forwardRouterUrl?: string;
  children?: React.ReactNode;
};

/**
 * 로그인이 되어 있는 경우에만 자식 노드를 표시한다
 * 로그아웃이 되면, 자동으로 루트(/) 페이지로 이동한다
 * 예를 들어 본인의 회원 정보를 조회하는 화면은 반드시 로그인이 되어 있어야 하는데
 * 이 상태에서 로그아웃을 하면 , 루트(/) 페이지로 이동해야 한다.
 *
 * @example
 * <RedirectOnLogout>
 *     <MyInfo/>
 * </RedirectOnLogout>
 */

type LoginState = 'first' | 'login' | 'logout';

export default function RedirectOnLogout(props: Props) {
  const { children, forwardRouterUrl = LOGIN_PAGE } = props;
  const [loginState, setLoginState] = useState<LoginState>('first');

  useEffect(() => {
    if (loginState !== 'logout') {
      return;
    }
    console.log('RedirectOnLogout: 로그아웃되어 로그인 페이지로 리다이렉트');
    const timerId = setTimeout(() => {
      routerPush(forwardRouterUrl);
    }, 100);

    return () => {
      clearTimeout(timerId);
    };
  }, [forwardRouterUrl, loginState]);

  // 로그인,로그아웃 이벤트 발생시 store에 저장된 profile을 변경한다
  useEffect(() => {
    const s1 = LoginProfileEvent.observe()
      .pipe(
        tap((it) => {
          console.log('LoginProfileEvent.observe():', it);
        }),
      )
      .pipe(filter((it) => it !== undefined)) // profile이 undefined인 것은 최초상태,무시
      .subscribe((profile) => {
        console.log('RedirectOnLogout: LoginProfileEvent.observe() ', profile);
        setLoginState(profile ? 'login' : 'logout');
      });

    return () => {
      s1.unsubscribe();
    };
  }, [forwardRouterUrl]);

  if (loginState === 'login') {
    return <>{children}</>;
  }

  return null;
}
