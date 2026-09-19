import { LoginTokenStorage } from '@/auth/authentication';

/**
 * 인증 토큰 HTTP 헤더를 생성한다
 */
const createApiHeader = (): Record<string, string> => {
  const headers = {} as Record<string, string>;
  const token = LoginTokenStorage.get();
  if (token && token.length > 0) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('createApiHeader', { headers });
  return headers;
};

export default createApiHeader;
