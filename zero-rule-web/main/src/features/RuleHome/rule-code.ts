export const hstChangeCode = (code: string) => {
  if (code === '0') {
    return '신규생성';
  } else if (code === '1') {
    return '룰 정보변경';
  } else if (code === '2') {
    return '룰 반환항목변경';
  } else if (code === '3') {
    return '룰 조건식변경';
  } else if (code === '4') {
    return '적용->미적용';
  } else if (code === '5') {
    return '미적용->적용';
  }
};
