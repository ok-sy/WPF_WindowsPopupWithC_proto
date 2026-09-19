import { LOGOUT_PAGE, PW_MUST_CHANGE } from '@/constants';
import { ApiCanceledError } from '@local/domain';
import { errorToMessage, isLoginError, isNetworkError, isPwMustChangeError } from '@local/domain';
import type { ToastOptions } from 'react-toastify';
import { toast } from 'react-toastify';
import { routerPush } from './urls';

/**
 * 에러를 사용자에게 표시할 메시지로 만들어서 리턴
 *
 * @param { Error | Object } err 에러 객체
 * @param { boolean } ignoreCanceled E1_CANCELED 에러는 무시할지 여부
 * @returns { string | undefined } 에러 메시지
 */
export const errorMessage = (err: any, ignoreCanceled = true): string | undefined => {
  if (err instanceof ApiCanceledError || err?.errorCode === 'E1_CANCELED') {
    return ignoreCanceled ? undefined : '요청이 취소되었습니다';
  }

  if (isLoginError(err)) {
    return '로그인이 필요합니다';
  }

  if (isNetworkError(err)) {
    return '네트워크 오류가 발생했습니다';
  }

  const errorCode = err.errorCode;

  if (errorCode && typeof errorCode === 'string') {
    if (errorCode === 'E1_HTTP_404') {
      return '해당 주소를 찾을 수가 없습니다';
    }
    if (errorCode.startsWith('E1_HTTP_5')) {
      return '서버 오류가 발생했습니다';
    }

    if (errorCode === 'E1_CUSTOM' && err.message && err.message.length > 0) {
      return err.message;
    }

    return errorToMessage(errorCode);
  }

  // err.errorMessage 는 잘못된 것, err.message가 맞다
  const msg = err.errorMessage ?? err.message;
  return msg ?? 'unknown error';
};

const defaultToastOptions: ToastOptions = {
  autoClose: 3500,
  position: toast.POSITION.TOP_CENTER,
};

/**
 * 에러 처리 함수
 *
 * @param { Error | Object } err
 */
const handleError = (err: any) => {
  // log.info('ERROR=', { ...err })

  // if (err instanceof ApiCanceledError || err?.errorCode === 'E1_CANCELED') {
  //   return
  // }

  // if (isLoginError(err)) {
  //   toast.warn('로그인이 필요합니다', defaultToastOptions)
  //   routerPush(LOGOUT_PAGE)
  //   return
  // }

  // if (isPwMustChangeError(err)) {
  //   toast.warn('비밀번호 재설정이 필요합니다', defaultToastOptions)
  //   routerPush(PW_MUST_CHANGE)
  //   return
  // }
  // const errorCode = err['errorCode']
  // if (errorCode === 'E1_LOGIN_FAIL') {
  //   toast.warn(
  //     '아이디나 비밀번호가 정확하지 않습니다. 다시 확인하고 로그인해주세요. 비밀번호 5회이상 오류시 로그인이 제한되며, 비밀번호 찾기 후 로그인이 가능합니다.',
  //     defaultToastOptions,
  //   )
  //   return
  // }

  // if (errorCode === 'E1_BBS_POST_BLOCKED') {
  //   setTimeout(() => {
  //     routerPush(LOGOUT_PAGE)
  //   }, 500)
  //   toast.warn('게시물 연속 작성으로 일시적으로 로그인이 차단됩니다.', defaultToastOptions)
  //   return
  // }

  // if (errorCode === 'E1_BBS_REPLY_BLOCKED') {
  //   setTimeout(() => {
  //     routerPush(LOGOUT_PAGE)
  //   }, 500)
  //   toast.warn('댓글 연속 작성으로 일시적으로 로그인이 차단됩니다.', defaultToastOptions)
  //   return
  // }

  // if (isNetworkError(err)) {
  //   toast.warn('네트워크 오류가 발생했습니다', defaultToastOptions)
  //   return
  // }

  // if (errorCode === 'E1_HTTP_404') {
  //   toast.warn('해당 주소를 찾을 수가 없습니다', defaultToastOptions)
  //   return
  // }

  // if (errorCode) {
  //   toast.warn(errorToMessage(err.errorCode), defaultToastOptions)
  //   return
  // }

  // // err.errorMessage 는 잘못된 것, err.message가 맞다
  // const msg = err.errorMessage ?? err.message
  // toast.warn(msg ?? 'unknown error', defaultToastOptions)
  const errorCode = err['msgId'];
  const errorMsg = err.message;
  // if (errorCode === 'SY50000000') {
  //   toast.warn('서버 오류가 발생했습니다', defaultToastOptions)
  // }
  // if (errorCode === 'SY40500000') {
  //   toast.warn('해당 주소를 찾을 수 없습니다', defaultToastOptions)
  // }
  // if (errorCode === 'SY40000000') {
  //   toast.warn('올바른 요청이 아닙니다', defaultToastOptions)
  // }
  // if (errorCode === 'SY40400000') {
  //   toast.warn('해당 주소를 찾을 수 없습니다', defaultToastOptions)
  // }

  // if (errorCode === 'BE00000057') {
  //   toast.warn('다른곳에서 로그인 하다.', defaultToastOptions)
  // }
  if (errorCode) {
    toast.warn(errorToMessage(errorCode, errorMsg), defaultToastOptions);
  }
  return;
};

export const matchError = (err: any, errorCode: string): boolean => {
  if (!err) return false;
  if (typeof err === 'string') {
    return err === errorCode;
  }
  return err['errorCode'] === errorCode;
};

export const errorToString = (err: any) => {
  // log.info('ERROR=', { ...err })

  if (err instanceof ApiCanceledError || err?.errorCode === 'E1_CANCELED') {
    return;
  }

  if (isLoginError(err)) {
    return '로그인이 필요합니다';
  }
  const errorCode = err['errorCode'];
  if (errorCode === 'E1_LOGIN_FAIL') {
    return '아이디나 비밀번호가 정확하지 않습니다. 다시 확인하고 로그인해주세요. 비밀번호 5회이상 오류시 로그인이 제한되며, 비밀번호 찾기 후 로그인이 가능합니다.';
  }

  if (errorCode === 'E1_BBS_POST_BLOCKED') {
    return '게시물 연속 작성으로 일시적으로 로그인이 차단됩니다.';
  }

  if (errorCode === 'E1_BBS_REPLY_BLOCKED') {
    return '댓글 연속 작성으로 일시적으로 로그인이 차단됩니다.';
  }

  if (isNetworkError(err)) {
    return '네트워크 오류가 발생했습니다';
  }

  if (errorCode === 'E1_HTTP_404') {
    return '해당 주소를 찾을 수가 없습니다';
  }

  if (errorCode) {
    return errorToMessage(err.errorCode);
  }

  // err.errorMessage 는 잘못된 것, err.message가 맞다
  const msg = err.errorMessage ?? err.message;
  return msg ?? 'unknown error';
};

export default handleError;
