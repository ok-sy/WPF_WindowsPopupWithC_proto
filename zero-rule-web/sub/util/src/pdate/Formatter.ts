import { lightFormat } from 'date-fns';
function pad(num: number, len: number): string {
  let str = '' + num;
  while (str.length < len) {
    str = '0' + str;
  }

  return str;
}

export class Formatter {
  static format(date: Date | number, fmtString: string): string | undefined {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        return undefined;
      }
    }

    return lightFormat(date, fmtString);
  }

  static yyyymmddhhmiss(date: Date): string | undefined {
    if (isNaN(date.getTime())) {
      return undefined;
    }

    try {
      const yyyy = date.getFullYear().toString();
      const MM = pad(date.getMonth() + 1, 2);
      const dd = pad(date.getDate(), 2);
      const hh = pad(date.getHours(), 2);
      const mi = pad(date.getMinutes(), 2);
      const ss = pad(date.getSeconds(), 2);
      return yyyy + MM + dd + hh + mi + ss;
    } catch (e) {
      console.log('Date format error', date, e);
      return undefined;
    }
  }

  static yyyymmdd(date: Date): string | undefined {
    if (isNaN(date.getTime())) {
      return undefined;
    }

    try {
      const yyyy = date.getFullYear().toString();
      const MM = pad(date.getMonth() + 1, 2);
      const dd = pad(date.getDate(), 2);
      return yyyy + MM + dd;
    } catch (e) {
      console.log('Date format error', date, e);
      return undefined;
    }
  }

  static hhmiss(date: Date): string | undefined {
    if (isNaN(date.getTime())) {
      return undefined;
    }

    try {
      const hh = pad(date.getHours(), 2);
      const mi = pad(date.getMinutes(), 2);
      const ss = pad(date.getSeconds(), 2);
      return hh + mi + ss;
    } catch (e) {
      console.log('Date format error', date, e);
      return undefined;
    }
  }

  static hhmi(date: Date): string | undefined {
    if (isNaN(date.getTime())) {
      return undefined;
    }

    try {
      const hh = pad(date.getHours(), 2);
      const mi = pad(date.getMinutes(), 2);
      return hh + mi;
    } catch (e) {
      console.log('Date format error', date, e);
      return undefined;
    }
  }
}
