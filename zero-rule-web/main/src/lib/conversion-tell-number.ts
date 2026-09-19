/**
 * @Author simjinu
 * 유선전화번호, 휴대폰 전화번호를 받아서 지역번호가 세글자이거나 두글자임을 판별해
 * 하이픈이 추가된 형태로 리턴합니다.
 * @param tellNumber
 * @returns conversionTellNumber
 */
export const tellFormat = (tellNumber: number | string) => {
  if (typeof tellNumber === 'number') {
    const strValue = String(tellNumber);
    tellNumber = strValue;
  }
  const value = tellNumber.replace(/[^0-9]/g, '');

  // 00 OR 000 지정
  const firstLength = value.length > 9 ? 3 : 2;

  // ({2,3}) - ({3,4}) - ({4})
  return [
    // 첫번째 구간 (00 or 000)
    value.slice(0, firstLength),
    // 두번째 구간 (000 or 0000)
    value.slice(firstLength, value.length - 4),
    // 남은 마지막 모든 숫자
    value.slice(value.length - 4),
  ].join('-');
};
