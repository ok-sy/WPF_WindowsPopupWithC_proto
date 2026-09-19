import {
  LoginProfileEvent,
  LoginProfileRefreshEvent,
  LoginProfileStorage,
  LoginTokenStorage,
} from '@/auth/authentication';
import config from '@/config';
import log from '@/log';
import type { AppError } from '@local/domain';
import { isLoginError } from '@local/domain';
import type { AxiosResponse } from 'axios';

const DEBUG = config.debug;

const HTTP_TOKEN_HEADER = config.httpHeaderKeys.token;
const HTTP_TOKEN_CLEAR_HEADER = config.httpHeaderKeys.tokenClear;

/**
 * Axios Response 인터셉터
 * HTTP 헤더에서 인증 토큰을 추출하여 로컬 저장소에 보관한다
 * 또는 인증 토큰을 제거한다
 */
export const apiResponseInterceptor = (
  response: AxiosResponse,
): AxiosResponse | Promise<AxiosResponse> => {
  if (DEBUG) log.debug('apiResponseInterceptor()', { response });
  if (!response.headers) return response;

  // log.debug('response.headers', { ...response.headers })
  const token = response.headers[HTTP_TOKEN_HEADER];

  if (token && token.length > 0) {
    LoginTokenStorage.save(token);
    if (DEBUG) log.debug('SAVE AUTH HEADER: ' + token);
    if (DEBUG) log.debug(`SAVE AUTH HEADER: ${token}`);
    LoginProfileRefreshEvent.send(Date.now());
    return response;
  }

  const clearAuth = response.headers[HTTP_TOKEN_CLEAR_HEADER];
  if (clearAuth && clearAuth.length > 0) {
    LoginTokenStorage.clear();
    LoginProfileEvent.send(null);
    LoginProfileStorage.clear();
    LoginProfileRefreshEvent.send(Date.now());
    if (DEBUG) log.debug('REMOVE AUTH HEADER');
  }
  return response;
};

export const errorResponseInterceptor = (error: AppError): void => {
  if (DEBUG) log.debug('errorResponseInterceptor()', { error });
  if (isLoginError(error)) {
    LoginTokenStorage.clear();
    LoginProfileStorage.clear();
    LoginProfileEvent.send(null);
  } else {
    log.debug('errorResponseInterceptor notLoginError', error);
  }
};
