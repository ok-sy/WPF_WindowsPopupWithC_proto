/*
 * [설계 28 §11] 서식 메뉴(우클릭·'서식' 버튼)의 상태 읽기와 적용. React와 분리해 실제 편집기로 검증할 수 있게 둔다.
 * 선택 구간이 있으면 그 구간에만, 없으면(커서만 있으면) 이후 입력할 글자에 적용한다(CKEditor 선택 속성).
 */
import { RICH_FONTS, type RichFontId } from './popupRichText';

export type FormatKey = 'bold' | 'italic' | 'underline' | 'fontColor' | 'fontSize' | 'fontFamily';
export const FORMAT_KEYS: FormatKey[] = ['bold', 'italic', 'underline', 'fontColor', 'fontSize', 'fontFamily'];

/** value는 선택 전체가 같을 때의 값, mixed는 선택 안에 서로 다른 값이 섞였는지. */
export type FormatState = Record<FormatKey, { value: string | boolean | null; mixed: boolean }>;

export type FormatAction =
  | { type: 'toggle'; key: 'bold' | 'italic' | 'underline' }
  | { type: 'color'; value: string | null }
  | { type: 'size'; value: number | null }
  | { type: 'font'; value: RichFontId | null }
  | { type: 'clear' };

const normalizeFontCss = (value: string) => value.replace(/["']/g, '').replace(/\s*,\s*/g, ',').trim().toLowerCase();

export function readFormatState(editor: any): FormatState {
  const selection = editor.model.document.selection;
  const state = {} as FormatState;
  for (const key of FORMAT_KEYS) {
    if (selection.isCollapsed) {
      state[key] = { value: selection.getAttribute(key) ?? null, mixed: false };
      continue;
    }
    const values = new Set<string | boolean | null>();
    for (const range of selection.getRanges()) {
      for (const item of range.getItems()) {
        if (item.is('$textProxy') || item.is('$text')) values.add(item.getAttribute(key) ?? null);
      }
    }
    const [first] = values;
    state[key] = { value: values.size === 1 ? first ?? null : null, mixed: values.size > 1 };
  }
  return state;
}

/** 모델 값 '20px' → 20. */
export const sizeFromModel = (value: unknown) => (typeof value === 'string' && value.endsWith('px') ? Number.parseFloat(value) : null);
/** 모델 값(CSS 글꼴 목록) → 글꼴 ID. */
export const fontIdFromModel = (value: unknown) =>
  typeof value === 'string' ? RICH_FONTS.find((font) => normalizeFontCss(font.css) === normalizeFontCss(value))?.id ?? null : null;

export function applyFormat(editor: any, action: FormatAction): void {
  switch (action.type) {
    case 'toggle': {
      // 섞여 있거나 꺼져 있으면 모두 켜고, 모두 켜져 있을 때만 끈다.
      const current = readFormatState(editor)[action.key];
      editor.execute(action.key, { forceValue: current.mixed || current.value !== true });
      break;
    }
    case 'color':
      editor.execute('fontColor', action.value ? { value: action.value } : {});
      break;
    case 'size':
      editor.execute('fontSize', action.value ? { value: `${action.value}px` } : {});
      break;
    case 'font': {
      const font = RICH_FONTS.find((item) => item.id === action.value);
      editor.execute('fontFamily', font ? { value: font.css } : {});
      break;
    }
    case 'clear':
      // 글자는 보존하고 서식만 기본값으로 되돌린다.
      editor.execute('removeFormat');
      break;
  }
  editor.editing.view.focus();
}
