import type { CLUserCreateParam } from '@local/domain';
import { ChangeEvent } from 'react';

// 빈값 체크 유효성
export const isEmptyString = (value: string | undefined | null): boolean => {
  return value === undefined || value === null || value.trim() === '';
};

// 4자리 체크 유효성
export const isPhoneNumber = (value: string | undefined | null): boolean => {
  return value === undefined || value === null || value.trim() === '' || value.length !== 4;
};
// 3자리거나 4자리 체크 유효성
export const isHomeNumber = (value: string | undefined | null): boolean => {
  return (
    value === undefined ||
    value === null ||
    value.trim() === '' ||
    !(value.length === 3 || value.length === 4)
  );
};

export const maxTypingLength = (target: string, maxLength: number) => {
  const value = target.replace(/\D/g, ''); // 숫자가 아닌 문자를 제거
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength); // 최대 길이를 초과하면 자름
};

// 생년월일 6자리 유효성
export const birthCheck = /^([0-9][0-9]|20\d{2})(0[0-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$/;

// 저장버튼 disable 유효성
export const saveCheck = (
  data: CLUserCreateParam,
  userExno: { area: string; middle?: string; end?: string },
) => {
  // 로그인 아이디 비었는지
  if (isEmptyString(data.lgonId)) {
    return '로그인ID는 필수입력입니다.';
  }
  // 성명 비어있는지
  if (isEmptyString(data.userName)) {
    return '성명은 필수입력입니다.';
  }
  // 생년월일 비어있는지
  if (isEmptyString(data.bryyMndy)) {
    return '생년월일은 필수입력입니다.';
  }
  // 생년월일 입력방식 아닌경우
  if (data.bryyMndy !== undefined && !birthCheck.test(data.bryyMndy)) {
    return '생년월일 입력 형식이 올바르지 않습니다. ex) 6자리';
  }
  // 핸드폰 번호 유효성 체크
  const phoneRegex = /^01[016789]-?\d{4}-?\d{4}$/;
  if (data.userTno !== undefined && !phoneRegex.test(data.userTno)) {
    return '올바른 전화번호가 아닙니다.';
  }
  // 내선번호 유효성 체크
  const middle = /^\d{3,4}$/;
  const end = /^\d{4}$/;
  const homePhoneRegex = /^(02\d{0,1}\d{3,4}\d{4}|0[3-9]\d{1}\d{3,4}\d{4})$/;
  if (data.userExno !== undefined && !homePhoneRegex.test(data.userExno)) {
    return '올바른 내선번호가 아닙니다.';
  }
  if (userExno.middle !== undefined && userExno.end !== undefined) {
    if (!middle.test(userExno.middle) || !end.test(userExno.end)) {
      return '올바른 내선번호가 아닙니다.';
    }
  }
  if (data.userGd === undefined || isEmptyString(data.userGd)) {
    return '사용자 등급을 지정해주세요.';
  }
  return '';
};
