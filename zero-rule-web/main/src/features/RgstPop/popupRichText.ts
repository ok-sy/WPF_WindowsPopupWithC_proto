/*
 * [설계 28] TEXT 본문 서식(content.textBlocks) 계약과 편집기 경계 변환.
 * 저장·전달 기준은 문단·Run JSON이며 HTML은 CKEditor 입출력에서만 다룬다.
 * 허용 값은 서버 PopupRichText.java, WPF PopupRichText.cs와 같아야 한다.
 */
export type RichAlignment = 'LEFT' | 'CENTER' | 'RIGHT';
export type RichFontId = 'MALGUN_GOTHIC' | 'GULIM' | 'DOTUM' | 'BATANG';
export interface RichRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  size?: number;
  font?: RichFontId;
}
export interface RichBlock {
  alignment: RichAlignment;
  runs: RichRun[];
}

export const RICH_COLORS = [
  { color: '#111827', label: '검정' }, { color: '#6B7280', label: '회색' },
  { color: '#DC2626', label: '빨강' }, { color: '#EA580C', label: '주황' },
  { color: '#CA8A04', label: '노랑' }, { color: '#16A34A', label: '초록' },
  { color: '#2563EB', label: '파랑' }, { color: '#7C3AED', label: '보라' },
];
export const RICH_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
/* CKEditor는 공백이 있는 글꼴명을 따옴표로 감싸지 않으면 오류 없이 무시한다(설계 28 §9.3). */
export const RICH_FONTS: { id: RichFontId; css: string; label: string }[] = [
  { id: 'MALGUN_GOTHIC', css: "'맑은 고딕', 'Malgun Gothic', sans-serif", label: '맑은 고딕' },
  { id: 'GULIM', css: "'굴림', Gulim, sans-serif", label: '굴림' },
  { id: 'DOTUM', css: "'돋움', Dotum, sans-serif", label: '돋움' },
  { id: 'BATANG', css: "'바탕', Batang, serif", label: '바탕' },
];
const ALIGN_FROM_CSS: Record<string, RichAlignment> = { left: 'LEFT', center: 'CENTER', right: 'RIGHT' };
const FLAG_KEYS = ['bold', 'italic', 'underline', 'color', 'size', 'font'] as const;
/* 글자는 보존하고 일반 문단으로 바꾸는 블록. 그 외 블록(표·이미지 등)은 제거한다. */
const TEXT_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'DIV', 'LI', 'PRE']);
const CONTAINER_TAGS = new Set(['UL', 'OL', 'FIGURE', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH']);
const REMOVED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IMG', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'VIDEO', 'AUDIO']);

/** CKEditor가 쓰는 툴바·허용 값 설정. 소스 편집·표·이미지 등은 툴바에 두지 않는다. */
export const richEditorConfig = {
  toolbar: { items: ['bold', 'italic', 'underline', '|', 'fontColor', 'fontSize', 'fontFamily', '|', 'alignment', '|', 'removeFormat', '|', 'undo', 'redo'] },
  fontColor: { colors: RICH_COLORS, columns: 4, documentColors: 0 },
  /* 'default'는 크기 서식 없음 = 본문 기본 크기(bodyFontSize). */
  fontSize: { options: ['default', ...RICH_SIZES], supportAllValues: false },
  fontFamily: { options: ['default', ...RICH_FONTS.map((font) => font.css)], supportAllValues: false },
  alignment: { options: ['left', 'center', 'right'] },
};

const normalizeFontCss = (value: string) => value.replace(/["']/g, '').replace(/\s*,\s*/g, ',').trim().toLowerCase();
function toHexColor(value: string): string {
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return `#${rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  return value.trim().toUpperCase();
}
const sameFormat = (a: RichRun, b: RichRun) => FLAG_KEYS.every((key) => (a[key] ?? null) === (b[key] ?? null));

/** 편집기 HTML을 허용 서식만 남긴 문단·Run JSON으로 바꾼다. 허용 밖 서식은 버리고 글자는 보존한다. */
export function htmlToBlocks(html: string): RichBlock[] {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const blocks: RichBlock[] = [];
  const addBlock = (element: Element) => {
    const align = ALIGN_FROM_CSS[((element as HTMLElement).style?.textAlign || 'left').toLowerCase()] ?? 'LEFT';
    const runs: RichRun[] = [];
    const push = (text: string, format: Omit<RichRun, 'text'>) => {
      const last = runs[runs.length - 1];
      if (last && sameFormat(last, format as RichRun)) last.text += text;
      else runs.push({ text, ...format });
    };
    const walk = (node: Node, format: Omit<RichRun, 'text'>) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node as Text).data.replace(/ /g, ' ').replace(/[\r\n]+/g, ' ');
        if (text) push(text, format);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as HTMLElement;
      const tag = element.tagName;
      if (REMOVED_TAGS.has(tag)) return;
      if (tag === 'BR') { push('\n', format); return; }
      const next = { ...format };
      if (tag === 'STRONG' || tag === 'B') next.bold = true;
      else if (tag === 'I' || tag === 'EM') next.italic = true;
      else if (tag === 'U') next.underline = true;
      if (element.style) {
        const color = element.style.color ? toHexColor(element.style.color) : '';
        if (color && RICH_COLORS.some((item) => item.color === color)) next.color = color;
        const size = element.style.fontSize;
        if (size.endsWith('px') && RICH_SIZES.includes(Number.parseFloat(size))) next.size = Number.parseFloat(size);
        const font = element.style.fontFamily ? RICH_FONTS.find((item) => normalizeFontCss(item.css) === normalizeFontCss(element.style.fontFamily)) : undefined;
        if (font) next.font = font.id;
      }
      element.childNodes.forEach((child) => walk(child, next));
    };
    element.childNodes.forEach((child) => walk(child, {}));
    // 편집기는 빈 문단을 <p>&nbsp;</p>로 내보낸다. 공백 하나뿐인 문단은 빈 문단으로 본다.
    if (runs.length === 1 && runs[0].text === ' ' && Object.keys(runs[0]).length === 1) runs.length = 0;
    blocks.push({ alignment: align, runs });
  };
  /* 안쪽에 블록이 있으면 안쪽 블록마다 문단을 만들고, 없으면(표 셀처럼 글자만 있으면) 그 요소를 한 문단으로 만든다. */
  const visit = (element: Element) => {
    if (REMOVED_TAGS.has(element.tagName)) return;
    const hasInnerBlocks = Array.from(element.children).some((child) => TEXT_BLOCK_TAGS.has(child.tagName) || CONTAINER_TAGS.has(child.tagName));
    if (hasInnerBlocks && (CONTAINER_TAGS.has(element.tagName) || TEXT_BLOCK_TAGS.has(element.tagName))) {
      Array.from(element.children).forEach(visit);
    } else if (CONTAINER_TAGS.has(element.tagName) && !element.textContent?.trim()) {
      // 글자 없는 표·목록 틀은 버린다.
    } else {
      addBlock(element);
    }
  };
  Array.from(doc.body.children).forEach(visit);
  return blocks;
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* 앞뒤·연속 공백은 HTML에서 접히므로 &nbsp;로 보존한다. */
function keepSpaces(value: string, atStart: boolean, atEnd: boolean): string {
  return value.replace(/ {2,}/g, (match) => ` ${'&nbsp;'.repeat(match.length - 1)}`)
    .replace(/^ /, atStart ? '&nbsp;' : ' ').replace(/ $/, atEnd ? '&nbsp;' : ' ');
}

/** 재편집용 HTML을 만든다. text는 항상 이스케이프한다. */
export function blocksToHtml(blocks: RichBlock[]): string {
  return blocks.map((block) => {
    const style = block.alignment === 'LEFT' ? '' : ` style="text-align:${block.alignment.toLowerCase()};"`;
    const inner = block.runs.map((run, index) => {
      let html = run.text.split('\n').map((line, lineIndex, lines) => keepSpaces(escapeHtml(line),
        index === 0 && lineIndex === 0, index === block.runs.length - 1 && lineIndex === lines.length - 1)).join('<br>');
      const font = RICH_FONTS.find((item) => item.id === run.font);
      const css = [run.color && `color:${run.color};`, run.size && `font-size:${run.size}px;`, font && `font-family:${font.css};`].filter(Boolean).join('');
      if (css) html = `<span style="${escapeHtml(css)}">${html}</span>`;
      if (run.underline) html = `<u>${html}</u>`;
      if (run.italic) html = `<i>${html}</i>`;
      if (run.bold) html = `<strong>${html}</strong>`;
      return html;
    }).join('');
    return `<p${style}>${inner || '&nbsp;'}</p>`;
  }).join('');
}

/** 서버 파생 규칙과 같은 일반 문자열(문단은 \n으로 구분). */
export const blocksToPlainText = (blocks: RichBlock[]) => blocks.map((block) => block.runs.map((run) => run.text).join('')).join('\n');

/** 서식 본문이 없는 기존 plainText를 서식 없는 문단으로 바꾼다. */
export const plainTextToBlocks = (plainText: string): RichBlock[] =>
  plainText === '' ? [] : plainText.split('\n').map((line) => ({ alignment: 'LEFT', runs: line ? [{ text: line }] : [] }));

/** 서버 계약 밖 값이 섞인 저장 데이터(구버전·직접 입력)를 표시 전에 걸러 낸다. */
export function readTextBlocks(value: unknown): RichBlock[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((block) => block && Array.isArray(block.runs)).map((block) => ({
    alignment: (['LEFT', 'CENTER', 'RIGHT'] as const).includes(block.alignment) ? block.alignment : 'LEFT',
    runs: block.runs.filter((run: RichRun) => run && typeof run.text === 'string' && run.text !== '').map((run: RichRun) => {
      const clean: RichRun = { text: run.text };
      if (run.bold === true) clean.bold = true;
      if (run.italic === true) clean.italic = true;
      if (run.underline === true) clean.underline = true;
      if (RICH_COLORS.some((item) => item.color === run.color)) clean.color = run.color;
      if (typeof run.size === 'number' && RICH_SIZES.includes(run.size)) clean.size = run.size;
      if (RICH_FONTS.some((item) => item.id === run.font)) clean.font = run.font;
      return clean;
    }),
  }));
}

export const richFontCss = (id?: RichFontId) => RICH_FONTS.find((font) => font.id === id)?.css;
