import log from '@/log';
import type { UserProfile } from '@local/domain';
import type { ApiRequestContext } from '@local/domain';
import { useCallback, useEffect } from 'react';
import { debounceTime, distinctUntilChanged, from, NEVER, switchMap } from 'rxjs';
import { useApi } from '../provider/ApiProvider';
import {
  LoginProfileEvent,
  LoginProfileRefreshEvent,
  LoginProfileStorage,
  LoginTokenStorage,
} from './authentication';

/**
 * LoginProfileRefreshEvent를 감시하여 로그인 사용자 프로필을 갱신
 * 최초에는 브라우저 스토리지로부터 사용자 프로필을 로드하여 로그인 상태로 변경
 */
export default function LoginProfileLoader() {
  const api = useApi();

  const reloadData = useCallback(
    async (ctx: ApiRequestContext): Promise<UserProfile | null> => {
      try {
        const { body } = await api.profile.profileMe({ ctx });
        const { profile } = body;
        if (ctx.canceled) return null;
        return profile;
      } catch (e) {
        log.debug('LoginProfileLoader: profile load fail', e);
      }
      return null;
    },
    [api],
  );

  // LoginProfileRefreshEvent를 관찰하여
  // LoginProfileEvent에 null 또는 Profile 객체를 보낸다
  useEffect(() => {
    let lastCtx: ApiRequestContext | null = null;
    const cancelLastCtx = () => {
      if (lastCtx) {
        lastCtx.cancel?.();
        lastCtx.canceled = true;
      }
    };

    const s1 = LoginProfileRefreshEvent.observe()
      .pipe(
        debounceTime(100),
        switchMap(() => {
          cancelLastCtx();
          if (!LoginTokenStorage.exists()) {
            LoginProfileEvent.send(null);
            return NEVER;
          }

          const ctx_: ApiRequestContext = { canceled: false };
          lastCtx = ctx_;
          return from(
            reloadData(ctx_)
              .then(LoginProfileEvent.send)
              .finally(() => {
                ctx_.cancel?.();
                ctx_.canceled = true;
              }),
          );
        }),
      )
      .subscribe();

    return () => {
      s1.unsubscribe();
      if (lastCtx) {
        lastCtx.canceled = true;
        lastCtx?.cancel?.();
      }
    };
  }, [reloadData]);

  useEffect(() => {
    const profile = LoginProfileStorage.get();
    if (LoginTokenStorage.exists() && profile) {
      // 스토리지 정보로부터 로그인
      LoginProfileEvent.send(profile);
    }

    const s1 = LoginProfileEvent.observe()
      .pipe(distinctUntilChanged())
      .subscribe(LoginProfileStorage.save);

    return () => {
      s1.unsubscribe();
    };
  }, []);

  return null;
}
