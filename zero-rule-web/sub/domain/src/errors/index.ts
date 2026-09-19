export * from './error-messages';

/**
 * 네트워크 에러 여부
 *
 * @param err 에러 객체
 * @returns
 */
export function isNetworkError(err: any) {
  return err?.msgId === 'NE00000000';
}

/**
 * 로그인 에러 여부
 *
 * @param err 에러 객체
 * @returns
 */
export function isLoginError(err: any) {
  const { errorCode } = err ?? {};
  return (
    // errorCode === 'E1_HTTP_401' ||
    // errorCode === 'E1_HTTP_403' ||
    errorCode === 'SY40100000' || errorCode === 'SY40300000'
    // errorCode === 'E1_HTTP_FORBIDDEN' ||
    // errorCode === 'E1_AUTH_EXPIRED' ||
    // errorCode === 'E1_INVALID_AUTH_TOKEN' ||
    // errorCode === 'E1_AUTH_INVALID_TOKEN1' ||
    // errorCode === 'E1_AUTH_INVALID_TOKEN2' ||
    // errorCode === 'E1_AUTH_INVALID_TOKEN3'
  );
}

/**
 * 비밀번호를 변경 필요 에러 여부
 *
 * @param err 에러 객체
 * @returns
 */
export function isPwMustChangeError(err: any) {
  const { errorCode } = err ?? {};
  return errorCode === 'E1_PWD_MUST_CHANGE';
}
