const serverErrorMessages: Record<string, string> = {
  // E1_CUSTOM: '커스텀 메시지 에러',
  // E1_ABUSE: '부적절한 API 사용입니다',
  // E1_ACCESS_DENIED: '접근이 차단되었습니다',
  // E1_CANCELED: '취소되었습니다',
  // E1_HTTP_400: '올바른 요청이 아닙니다',
  // E1_HTTP_401: '로그인이 필요합니다',
  // E1_HTTP_404: '해당 주소를 찾을 수 없습니다',
  // E1_HTTP_500: '서버 오류가 발생했습니다',
  // E1_HTTP_502: '서버 연결이 불안정합니다',
  // E1_HTTP_FORBIDDEN: '로그아웃 되었습니다',
  // E1_INVALID_PARAM: '올바르지 않은 파라미터입니다',
  // E1_INVALID_PW_TOKEN: '비밀번호 변경 토큰이 올바르지 않습니다(또는 토큰만료)',
  // E1_LOGIN_FAIL: '로그인 정보가 올바르지 않습니다',
  // E1_NO_SUCH_ARTICLE: '해당 게시물이 존재하지 않습니다',
  // E1_NO_SUCH_DATA: '관련 자료가 없습니다',
  // E1_NO_SUCH_FAQ: '해당 FAQ가 없습니다',
  // E1_NO_SUCH_USER: '해당 사용자가 없습니다',
  // E1_UNKNOWN: '오류가 발생했습니다',
  // E1_USER_ID_DUP: '사용자ID가 중복됩니다',
  // E1_NO_PERM: '접근 권한이 없습니다',
  // E1_BLOCKED_USER: '접근이 차단된 사용자입니다',
  // E1_LOGIN_BLOCKED_IP: '로그인이 차단되었습니다.',
  // E1_BLACK_USER_ID: '사용할 수 없는 사용자 ID입니다',
  // E1_DELETED_USER: '탈퇴한 사용자입니다',
  // E1_STOPPED_USER: '계정 사용이 중지된 사용자입니다',
  // E1_DORMANT_USER: '휴면 상태의 사용자입니다',

  // E1_WEAK_PW: '취약한 비밀번호입니다',
  // E1_PW_MISMATCH: '패스워드가 올바르지 않습니다',
  // E1_OLD_PW_MISMATCH: '기존 패스워드가 올바르지 않습니다',
  // E1_INVALID_CSV: 'CSV 포맷이 올바르지 않습니다',
  // E1_NO_SUCH_DATA_FILE: '해당 데이터 파일이 존재하지 않습니다',
  // E1_COLUMN_COUNT_INVALID: '컬럼의 개수가 맞지 않습니다',
  // E1_DUP_USER_ID: '사용자 ID가 중복됩니다',

  // E1_BLOCKED_ATTACH_FILE: '허용되지 않는 첨부파일입니다.',
  // E1_DENY_RECENT_PW: '최근에 사용했던 비밀번호로 변경할 수 없습니다.',
  // E1_NO_SUCH_META_WORD: '메타 용어를 찾을 수 없습니다',
  // E1_DUP_META_WORD: '단어명이 중복됩니다.',
  // E1_NO_SUCH_CODE_TYPE: '해당 코드 그룹이 존재하지 않습니다.',
  // E1_PW_MUST_CHANGE: '비밀번호 재설정이 필요합니다',

  // E1_DUP_TEAM_ID: '팀 ID가 중복됩니다',

  // E1_NO_UPDATE_ERR: '수정 된 정보가 존재하지 않습니다.',
  // E1_NO_DELETE_ERR: '삭제 된 정보가 존재하지 않습니다.',
  // E1_PERM_DENIED: '접근 권한이 없습니다',

  SY50000000: '서버 오류가 발생했습니다',
  SY40500000: '해당 주소를 찾을 수 없습니다',
  SY40000000: '올바른 요청이 아닙니다',
  SY40100000: '로그인이 필요합니다',
  SY40400000: '해당 주소를 찾을 수 없습니다',
  SY40300000: '토큰 없거나 유효하지 않습니다',
  SY50200000: '서버 연결이 불안정합니다',
  NE00000000: '네트워크 연결이 불안정합니다',
  TE00000000: '데이터 요청시간이 초과했습니다',
  FW00000011: '접근 권한이 없습니다.',
};

const localErrorMessage: Record<string, string> = {
  // E0_GEN_FILE_INVALID: 'GEN 파일 형식이 올바르지 않습니다',
};

export const errorMessages = { ...serverErrorMessages, ...localErrorMessage };

export const errorToMessage = (errorCode: string, errCn?: string): string => {
  const msg = errorMessages[errorCode];
  if (msg) {
    return msg;
  }

  if (errorCode.startsWith('SY')) {
    return msg;
  }

  return msg ? msg : (errCn ?? '');
};

export const matchErrorCode = (err: any, errorCode: string) => {
  if (typeof err === 'string') return errorCode === err;
  return err['errorCode'] === errorCode;
};
