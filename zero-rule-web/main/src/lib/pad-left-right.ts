export function padRight(str: string, length: number, sep: string) {
  // 문자열 길이가 지정된 길이보다 크면 그대로 반환
  if (str.length >= length) {
    return str;
  }
  // 공백 문자열을 반복하여 필요한 길이의 공백을 생성
  const padding = sep.repeat(length - str.length);
  console.log(padding.length);
  // 문자열에 공백을 추가하여 반환
  return str + padding;
}

export function padLeft(str: string, length: number, sep: string) {
  // 문자열 길이가 지정된 길이보다 크면 그대로 반환
  if (str.length >= length) {
    return str;
  }
  // 공백 문자열을 반복하여 필요한 길이의 공백을 생성
  const padding = sep.repeat(length - str.length);
  // 공백 문자열에 문자열을 추가하여 반환
  return padding + str;
}

export function padRightBlank(str: string, length: number): string {
  // 문자열 길이가 지정된 길이보다 작을 때만 패딩을 추가
  while (str.length < length) {
    // 문자열 뒤에 공백을 추가
    str += ' ';
  }
  return str;
}
