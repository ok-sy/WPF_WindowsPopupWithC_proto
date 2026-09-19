import { Parser } from './Parser';
import { Formatter } from './Formatter';

/**
 * Parser 클래스를 parser 변수에 대입
 * pdate.parser.yyyymmdd() 이런 형태로 사용
 */
export const parser = Parser;

/**
 * Formatter 클래스를 formatter 변수에 대입
 * pdate.formatter.format() 이런 형태로 사용
 */
export const formatter = Formatter;

/**
 * 주어진 epoch seconds를 파싱하고, 포맷한다
 * 자주 사용되어서 편의용으로 만들었다
 *
 * @param epochSeconds unix epoch seconds
 * @param fmtString 포맷 문자열
 * @returns 포맷 결과문자와 Date 객체를 리턴한다
 */
export function formatByEpochSeconds(
  epochSeconds: number,
  fmtString: string,
): [string | undefined, Date | undefined] {
  const date = parser.epochSeconds(epochSeconds);
  if (typeof date === 'undefined') return [undefined, undefined];

  const formattedStr = formatter.format(date, fmtString);
  return [formattedStr, date];
}

export function formatByEpochMillis(
  epochMillis: number,
  fmtString: string,
): [string | undefined, Date | undefined] {
  return formatByEpochSeconds(epochMillis / 1000, fmtString);
}
