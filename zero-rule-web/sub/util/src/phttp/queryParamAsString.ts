import { queryParam } from './queryParam';

export default function queryParamAsString(
  value: string | string[] | null | undefined,
  defaultValue: string,
): string {
  const v = queryParam(value);
  // 문자열의 길이가 0인 경우는 값이 없음으로 간주하고 기본값을 리턴한다
  return typeof v === 'undefined' || v.length === 0 ? defaultValue : v;
}
