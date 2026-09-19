import { fromUnixTime } from 'date-fns';

export class Parser {
  /**
   * Unix epoch seconds 를 파싱하여 Date 객체로 리턴
   *
   * @param seconds Unix epoch seconds
   * @returns 파싱 결과 Date 객체
   */
  static epochSeconds(seconds: number | undefined | null): Date | undefined {
    if (typeof seconds === 'undefined' || seconds === null) return undefined;
    return fromUnixTime(seconds);
  }

  /**
   * yyyymmddhhmiss 형태의 문자열을 파싱하여 Date 객체로 리턴
   *
   * @param dateStr yyyymmddhhmiss 문자열
   * @returns 파싱 결과 Date 객체
   */
  static yyyymmddhhmiss(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr || dateStr.length < 14) return undefined;
    try {
      const yyyy = +dateStr.substring(0, 4);
      const mm = +dateStr.substring(4, 6) - 1;
      const dd = +dateStr.substring(6, 8);
      const hh = +dateStr.substring(8, 10);
      const mi = +dateStr.substring(10, 12);
      const ss = +dateStr.substring(12, 14);
      return new Date(yyyy, mm, dd, hh, mi, ss);
    } catch (e) {
      console.log(`Date parsing error: ${dateStr}`, e);
      return undefined;
    }
  }

  /**
   * yyyymmdd 형태의 문자열을 파싱하여 Date 객체로 리턴
   *
   * @param dateStr yyyymmdd 형태의 문자열
   * @returns 파싱 결과 Date 객체
   */
  static yyyymmdd(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr || dateStr.length < 8) return undefined;
    try {
      const yyyy = +dateStr.substring(0, 4);
      const mm = +dateStr.substring(4, 6) - 1;
      const dd = +dateStr.substring(6, 8);

      return new Date(yyyy, mm, dd, 0, 0, 0);
    } catch (e) {
      console.log(`Date parsing error: ${dateStr}`, e);
      return undefined;
    }
  }
}
