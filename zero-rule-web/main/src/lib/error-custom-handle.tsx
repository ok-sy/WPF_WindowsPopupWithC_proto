import { LOGOUT_PAGE, PW_MUST_CHANGE } from '@/constants';
import { routerPush } from '@/lib/urls';
import {
  ApiCanceledError,
  errorToMessage,
  isLoginError,
  isNetworkError,
  isPwMustChangeError,
} from '@local/domain';
import errorHandleStore from '@local/domain/src/ErrorHandleStore';
import type { ToastOptions } from 'react-toastify';
import { toast } from 'react-toastify';

const defaultToastOptions: ToastOptions = {
  autoClose: 3500,
  position: toast.POSITION.TOP_CENTER,
};
/**
 * 에러 처리 함수
 *
 * @param { Error | Object } err
 */
export default function errorCustomHandle(err: any) {
  if (err instanceof ApiCanceledError || err?.errorCode === 'E1_CANCELED') {
    return;
  }

  if (isLoginError(err)) {
    toast.warn('로그인이 필요합니다', defaultToastOptions);
    routerPush(LOGOUT_PAGE);
    return;
  }

  if (isPwMustChangeError(err)) {
    toast.warn('비밀번호 재설정이 필요합니다', defaultToastOptions);
    routerPush(PW_MUST_CHANGE);
    return;
  }
  const errorCode = err['msgId'];
  const message = err.message;

  if (errorCode === 'BE00000057') {
    // setTimeout(() => {
    //   routerPush(LOGOUT_PAGE)
    // }, 500)
    toast.warn(message, defaultToastOptions);
    return;
  }

  if (errorCode === 'E1_LOGIN_FAIL') {
    toast.warn(
      '아이디나 비밀번호가 정확하지 않습니다. 다시 확인하고 로그인해주세요. 비밀번호 5회이상 오류시 로그인이 제한되며, 비밀번호 찾기 후 로그인이 가능합니다.',
      defaultToastOptions,
    );
    return;
  }

  if (errorCode === 'E1_BBS_POST_BLOCKED') {
    setTimeout(() => {
      routerPush(LOGOUT_PAGE);
    }, 500);
    toast.warn('게시물 연속 작성으로 일시적으로 로그인이 차단됩니다.', defaultToastOptions);
    return;
  }

  if (errorCode === 'E1_BBS_REPLY_BLOCKED') {
    setTimeout(() => {
      routerPush(LOGOUT_PAGE);
    }, 500);
    toast.warn('댓글 연속 작성으로 일시적으로 로그인이 차단됩니다.', defaultToastOptions);
    return;
  }

  // 네트워크 오류 발생 asis -> tobe 변경
  if (isNetworkError(err)) {
    toast.warn('네트워크 오류가 발생했습니다', defaultToastOptions);
    return;
  }

  if (errorCode === 'E1_HTTP_404') {
    toast.warn('해당 주소를 찾을 수가 없습니다', defaultToastOptions);
    return;
  }

  if (errorCode) {
    const errMsg = errorToMessage(errorCode, message);
    errorHandleStore.setError(
      errorCode,
      errMsg,
      err.msgClsf,
      err.msgPrntCd,
      err.occrPrgNm,
      err.occrMethodNm,
      err.url,
    );
    return;
  }

  return;
}
