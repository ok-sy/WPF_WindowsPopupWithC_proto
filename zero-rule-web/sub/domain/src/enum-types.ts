export type CLUserStateKey = 'ACTIVE' | 'DELETED' | 'STOPPED' | 'DORMANT' | 'PW_LOCKED';

export const CLUserState: Record<CLUserStateKey, string> = {
  ACTIVE: '정상',
  DELETED: '삭제 또는 회원탈퇴',
  STOPPED: '계정 사용 일시 중지',
  DORMANT: '휴면',
  PW_LOCKED: '계정 잠금',
};

export type CLLogLevelKey = 'D' | 'I' | 'W' | 'E';
export const CLLogLevel: Record<CLLogLevelKey, string> = {
  D: '디버그',
  I: '정보',
  W: '경고',
  E: '에러',
};

export type CLJobStatusKey = 'FIRST' | 'RUNNING' | 'SUCCESS' | 'ERROR';
export const CLJobStatus: Record<CLJobStatusKey, string> = {
  FIRST: '최초',
  RUNNING: '실행중',
  SUCCESS: '실행 완료',
  ERROR: '에러',
};

export type CLAuditLogKindKey = 'AUTH' | 'PRIV' | 'ROLE' | 'ETC';
export const CLAuditLogKind: Record<CLAuditLogKindKey, string> = {
  AUTH: '인증 관련',
  PRIV: '개인정보처리',
  ROLE: '권한 관리',
  ETC: '기타',
};

export type CLNavItemTypeKey = 'PAGE' | 'SECTION';
export const CLNavItemType: Record<CLNavItemTypeKey, string> = {
  PAGE: '페이지',
  SECTION: '섹션',
};

export type CLPrivTypeKey = 'S' | 'P';
export const CLPrivType: Record<CLPrivTypeKey, string> = {
  S: '스크린',
  P: '기능',
};
