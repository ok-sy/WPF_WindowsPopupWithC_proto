import type { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs';
import { Authentication } from '@local/domain';
import type { UserProfile } from '@local/domain';
import { LoginProfileWrapper } from './LoginProfileWrapper';
import deepEqual from 'fast-deep-equal/es6';
import utf8enc from 'crypto-js/enc-utf8';
import AES from 'crypto-js/aes';

const secret = '836D96C9AA30DD58429D2751AC1BDBBC';

const enc = (plaintext: string): string => {
  const key = utf8enc.parse(secret);
  const iv = utf8enc.parse(secret.substring(0, 16));
  const encrypted = AES.encrypt(plaintext, key, {
    iv,
  });
  return encrypted.toString().toString();
};

const dec = (encoded: string): string => {
  const key = utf8enc.parse(secret);
  const iv = utf8enc.parse(secret.substring(0, 16));
  return AES.decrypt(encoded, key, { iv }).toString(utf8enc);
};

const serialize = <T>(value: T): string => {
  return enc(JSON.stringify(value));
};

const deserialize = <T>(value: string): T => {
  return JSON.parse(dec(value));
};

export const LoginProfileStorage = Authentication.createStorage<UserProfile>({
  storage: () => localStorage,
  storageKey: '_zero_rule_login_profile',
  serialize,
  deserialize,
});

export const LoginTokenStorage = Authentication.createStorage<string>({
  storage: () => localStorage,
  storageKey: '_zero_rule_login_token',
});

// 로그인 프로필을 갱신 이벤트
export const LoginProfileRefreshEvent = Authentication.createEventBus(0);

// 로드한 로그인 프로필 이벤트
export const LoginProfileEvent = Authentication.createEventBus<UserProfile>();

// 로그인 프로필을 랩핑한 객체로 제공하는 옵저버블
export const LoginProfileWrapper$: Observable<LoginProfileWrapper | null | undefined> =
  LoginProfileEvent.observe().pipe(
    distinctUntilChanged(deepEqual),
    map((it) => {
      if (!it) return it;
      return new LoginProfileWrapper(it);
    }),
    shareReplay(1),
  );
