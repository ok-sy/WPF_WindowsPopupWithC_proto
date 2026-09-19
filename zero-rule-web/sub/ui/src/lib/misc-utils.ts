import { lightFormat } from 'date-fns';

export function matchesOrClosest<T extends HTMLElement>(
  target: Element,
  selector: string,
): T | undefined {
  const found = target.matches(selector) ? target : target.closest(selector);
  if (found) {
    return found as T;
  }
  return undefined;
}

export function toggleTableRowSelectionByEventTarget(eventTarget: HTMLElement) {
  const tableRow = matchesOrClosest<HTMLTableRowElement>(eventTarget, 'tr');
  if (!tableRow) return;

  const table = tableRow.closest<HTMLTableElement>('table');
  if (!table) return;
  table.querySelectorAll<HTMLElement>('.x_selected').forEach((el) => {
    el.classList.remove('x_selected');
  });
  tableRow.classList.add('x_selected');
}

export function sleepAsync(milli: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milli);
  });
}

export const isTabKeyEvent = (e: React.KeyboardEvent): boolean => {
  return !e.shiftKey && e.key === 'Tab';
};

export const isEnterOrTabKeyEvent = (e: React.KeyboardEvent): boolean => {
  return e.key === 'Enter' || (!e.shiftKey && e.key === 'Tab');
};

export const isEnterKeyEvent = (e: React.KeyboardEvent): boolean => {
  return e.key === 'Enter';
};

export const isEscapeKeyEvent = (e: React.KeyboardEvent): boolean => {
  return e.key === 'Escape';
};

export function isValidURL(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  if (str.length === 0) return false;
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  return !!pattern.test(str);
}

export const requestEditorFocusSelector = (
  parent: HTMLElement | Document | null | undefined,
  editorSelector: string,
) => {
  if (!parent) return;
  const editor = parent.querySelector(editorSelector);
  if (editor) {
    const ql = editor.getElementsByClassName('ql-editor')?.[0];
    if (ql) {
      // @ts-ignore
      ql.focus();
    }
  }
};

const setCustomTimeout = (callback: () => any, timeout: number) => {
  if (timeout < 0) {
    callback();
  } else {
    setTimeout(() => {
      callback();
    }, timeout);
  }
};
const queryElement = (el: HTMLElement | Document | null | undefined, selector: string) => {
  if (!el) return null;
  return el.querySelector(selector) as HTMLElement | null;
};

export const requestFocusSelector = (
  parent: HTMLElement | Document | undefined | null,
  selector: string,
  timeout = -1,
) => {
  if (!parent) return;
  setCustomTimeout(() => {
    const elem = parent.querySelector(selector) as HTMLElement | null;
    elem?.focus();
  }, timeout);
};

export const requestSelector = (
  el: HTMLElement | Document | null | undefined,
  selector: string,
  callback: (elemnt: HTMLElement) => any,
  timeout = -1,
) => {
  setCustomTimeout(() => {
    const element = queryElement(el, selector);
    if (element) {
      callback(element);
    }
  }, timeout);
};

export function getScreenLeftTop(elem: HTMLElement) {
  let x = elem.offsetLeft;
  let y = elem.offsetTop;
  let cur = elem;
  while (cur.offsetParent) {
    const parent = cur.offsetParent as HTMLElement;
    x += parent.offsetLeft;
    y += parent.offsetTop;
    cur = parent;
  }
  return { x, y };
}

// 표시가능한 이미지 파일
export const isImageFile = (fileName: string | null | undefined): boolean => {
  if (!fileName) return false;
  return /.(jpg|jpeg|png|gif|jfif|bmp|svg|webp)$/i.test(fileName);
};

function filenameReservedRegex() {
  // eslint-disable-next-line no-control-regex
  return /[<>:"/\\|?*\u0000-\u001F]/g;
}

function windowsReservedNameRegex() {
  return /^(con|prn|aux|nul|com\d|lpt\d)$/i;
}

export const isValidFileName = (fileName: string): boolean => {
  if (!fileName || fileName.length > 255) {
    return false;
  }

  if (filenameReservedRegex().test(fileName) || windowsReservedNameRegex().test(fileName)) {
    return false;
  }

  if (fileName === '.' || fileName === '..') {
    return false;
  }

  return true;
};

export function formatDateOrNull(date: Date | number, format: string): string | null {
  try {
    return lightFormat(date, format);
  } catch (ignore) {}
  return null;
}

/**
 * 게시물의 시간 포매팅 함수
 * @param epochSeconds epoch seconds
 * @returns
 */
export const formatEpochSeconds = (epochSeconds: number): [string, Date] => {
  const date = new Date(epochSeconds * 1000);
  const now = new Date();
  let fmt = '';
  if (date.getFullYear() === now.getFullYear()) {
    fmt = 'MM/dd HH:mm';
  } else {
    fmt = 'yyyy/MM/dd HH:mm';
  }

  const formattedStr = formatDateOrNull(date, fmt);
  if (formattedStr) {
    return [formattedStr, date];
  }
  return ['', date];
};

export const formatStrEpochSeconds = (epochSeconds: number): string => {
  const date = new Date(epochSeconds * 1000);
  const now = new Date();
  let fmt = '';
  if (date.getFullYear() === now.getFullYear()) {
    fmt = 'MM/dd HH:mm';
  } else {
    fmt = 'yyyy/MM/dd HH:mm';
  }

  const formattedStr = formatDateOrNull(date, fmt);
  if (formattedStr) {
    return formattedStr;
  }
  return '';
};
