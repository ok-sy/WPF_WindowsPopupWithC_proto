function isUndefinedOrEmpty(value?: string): boolean {
  return value === undefined || value.trim() === '';
}

export const msgUploadValid = (el: string[]) => {
  if (
    isUndefinedOrEmpty(el[0]) ||
    isUndefinedOrEmpty(el[1]) ||
    isUndefinedOrEmpty(el[2]) ||
    isUndefinedOrEmpty(el[3]) ||
    isUndefinedOrEmpty(el[4]) ||
    isUndefinedOrEmpty(el[5])
  ) {
    return '빈 값이 있음';
  }

  return undefined;
};
