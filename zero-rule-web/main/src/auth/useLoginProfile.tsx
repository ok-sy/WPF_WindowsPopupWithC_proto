import { LoginProfileWrapper$ } from '@/auth/authentication';
import type { LoginProfileWrapper } from '@/auth/LoginProfileWrapper';
import { useObservable } from 'react-use';

export const useLoginProfile = (): LoginProfileWrapper | null | undefined => {
  const loginProfile = useObservable(LoginProfileWrapper$);
  return loginProfile;
};
