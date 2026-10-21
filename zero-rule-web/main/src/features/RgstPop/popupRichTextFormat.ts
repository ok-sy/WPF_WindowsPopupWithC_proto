/*
 * [설계 28 §11] 서식 패널(우클릭·'서식' 버튼)의 상태 읽기와 적용. React와 분리해 실제 편집기로 검증할 수 있게 둔다.
 * 선택 구간이 있으면 그 구간에만, 없으면(커서만 있으면) 이후 입력할 글자에 적용한다(CKEditor 선택 속성).
 */
import { RICH_FONTS, RICH_INDENT_STEP, isIndentLevel, type RichFontId } from './popupRichText';

type FormatKey = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'fontColor' | 'fontSize' | 'fontFamily';
const FORMAT_KEYS: FormatKey[] = ['bold', 'italic', 'underline', 'strikethrough', 'fontColor', 'fontSize', 'fontFamily'];

/** value는 선택 전체가 같을 때의 값, mixed는 선택 안에 서로 다른 값이 섞였는지. */
export type FormatState = Record<FormatKey, { value: string | boolean | null; mixed: boolean }> & {
  paragraph: {
    alignment: { value: string | null; mixed: boolean };
    indent: { value: number | null; mixed: boolean };
    canIndent: boolean;
    canOutdent: boolean;
    canAlign: boolean;
  };
};

export type FormatAction =
  | { type: 'toggle'; key: 'bold' | 'italic' | 'underline' | 'strikethrough' }
  | { type: 'color'; value: string | null }
  | { type: 'size'; value: number | null }
  | { type: 'font'; value: RichFontId | null }
  | { type: 'alignment'; value: 'left' | 'center' | 'right' }
  | { type: 'indent'; direction: 'in' | 'out' }
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
  // 문단 서식은 글자 속성이 아니라 선택 범위에 걸친 문단에서 읽는다. 빈 문단·커서만 있는 경우도 포함한다.
  const blocks = Array.from(selection.getSelectedBlocks()) as any[];
  const alignments = new Set(blocks.map((block) => block.getAttribute('alignment') ?? 'left'));
  const indents = new Set(blocks.map((block) => (Number.parseFloat(block.getAttribute('blockIndent') ?? '0') || 0) / RICH_INDENT_STEP));
  state.paragraph = {
    alignment: { value: alignments.size === 1 ? [...alignments][0] : null, mixed: alignments.size > 1 },
    indent: { value: indents.size === 1 ? [...indents][0] : null, mixed: indents.size > 1 },
    canIndent: editor.commands.get('indent')?.isEnabled === true,
    canOutdent: editor.commands.get('outdent')?.isEnabled === true,
    canAlign: editor.commands.get('alignment')?.isEnabled === true,
  };
  return state;
}

/** 모델 값 '20px' → 20. */
export const sizeFromModel = (value: unknown) => (typeof value === 'string' && value.endsWith('px') ? Number.parseFloat(value) : null);
/** 모델 값(CSS 글꼴 목록) → 글꼴 ID. */
export const fontIdFromModel = (value: unknown) =>
  typeof value === 'string' ? RICH_FONTS.find((font) => normalizeFontCss(font.css) === normalizeFontCss(value))?.id ?? null : null;

/** 편집기로 포커스를 옮기지 않는다(열린 서식 패널에서 키보드로 연속 적용할 수 있게). */
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
    case 'alignment':
      editor.execute('alignment', { value: action.value });
      break;
    case 'indent':
      editor.execute(action.direction === 'in' ? 'indent' : 'outdent');
      break;
    case 'clear':
      // 글자는 보존하고 서식만 기본값으로 되돌린다.
      editor.execute('removeFormat');
      break;
  }
}

/*
 * [설계 49·TODO63] 문단 들여쓰기 정규화. CKEditor IndentBlock은 40px씩 누적하며 단계 수 제한은 두지 않는다.
 *  - 붙여넣기 등으로 들어온 값은 모델에서 40px 배수로 맞추고 px 외 단위·숫자 범위를 넘는 값은 지운다.
 * 들여쓰기·내어쓰기(0에서 멈춤)·실행 취소는 CKEditor 기본 동작을 그대로 쓴다. 서식 초기화(removeFormat)는 글자 서식만 지우고 문단 들여쓰기·정렬은 유지한다.
 */
export function normalizeIndent(editor: any): void {
  // IndentBlock은 blockIndent를 서식 속성(isFormatting)으로 등록해 removeFormat이 들여쓰기까지 지우므로 문단 속성으로 되돌린다.
  editor.model.schema.setAttributeProperties('blockIndent', { isFormatting: false });
  // [TODO62] Alignment도 기본 빌드에서는 지워지는 서식이다. 글자 서식 초기화가 문단 정렬을 바꾸지 않도록 제외한다.
  editor.model.schema.setAttributeProperties('alignment', { isFormatting: false });
  const px = (value: unknown) => (typeof value === 'string' && /^\d+(\.\d+)?px$/.test(value) ? Number.parseFloat(value) : null);
  editor.model.document.registerPostFixer((writer: any) => {
    let changed = false;
    for (const rootName of editor.model.document.getRootNames()) {
      for (const block of editor.model.document.getRoot(rootName).getChildren()) {
        if (!block.hasAttribute?.('blockIndent')) continue;
        const value = px(block.getAttribute('blockIndent'));
        const level = value === null ? 0 : Math.round(value / RICH_INDENT_STEP);
        const normalized = isIndentLevel(level) && level > 0 ? `${level * RICH_INDENT_STEP}px` : null;
        if (normalized === block.getAttribute('blockIndent')) continue;
        if (normalized) writer.setAttribute('blockIndent', normalized, block);
        else writer.removeAttribute('blockIndent', block);
        changed = true;
      }
    }
    return changed;
  });
}
