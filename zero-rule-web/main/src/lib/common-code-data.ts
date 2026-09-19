// 메시지 관리 - 메시지 종류
export const msgKnKorean = (msgKn: string) => {
  if (msgKn === '1') return 'INFO';
  if (msgKn === '2') return 'WARNNING';
  if (msgKn === '3') return 'ERROR';
};

// 메시지 관리 - 업무구분
export const tskClsfCdKorean = (tskClsfCd: string) => {
  if (tskClsfCd === '000') return '공통';
  if (tskClsfCd === '001') return 'FDS';
  if (tskClsfCd === '002') return '회원';
  if (tskClsfCd === '003') return '승인';
  if (tskClsfCd) return '시스템 에러';
};

export const msgPrntCdKorean = (msgPrntCd: string) => {
  if (msgPrntCd === '1') return '하단';
  if (msgPrntCd === '2') return '팝업';
};

export const ruleStateKorean = (ruleState: string) => {
  if (ruleState === '1') return '저장완료';
  if (ruleState === '2') return '테스트완료';
  if (ruleState === '3') return '배포대기';
  if (ruleState === '4') return '배포대기취소';
  if (ruleState === '9') return '배포완료';
  if (ruleState === 'D') return '삭제';
};
