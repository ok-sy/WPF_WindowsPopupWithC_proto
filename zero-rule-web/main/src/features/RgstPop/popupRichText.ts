/*
 * [설계 28] TEXT 본문 서식(content.textBlocks) 계약과 편집기 경계 변환.
 * 저장·전달 기준은 문단·Run JSON이며 HTML은 CKEditor 입출력에서만 다룬다.
 * 크기·글꼴·정렬 허용 값과 색 규칙은 서버 PopupRichText.java와 같아야 한다. WPF PopupRichText.cs는 목록을 복제하지 않고
 * 표시 방어만 한다(설계 48). 글꼴 ID를 추가하면 WPF 글꼴 매핑도 추가한다.
 * 글자 색은 팔레트로 제한하지 않고 #RRGGBB(대문자) 형식만 확인한다. 팔레트는 편집기 선택지일 뿐이며 가독성은 작성자가 판단한다.
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
  /** [설계 49] 문단 왼쪽 들여쓰기 단계(1~RICH_MAX_INDENT). 0이면 키를 생략한다. */
  indent?: number;
  runs: RichRun[];
}

/* [설계 49] 들여쓰기 1단계 = 40px(CKEditor IndentBlock offset과 같음), 최대 5단계. 서버 PopupRichText.MAX_INDENT와 같아야 한다. */
export const RICH_INDENT_STEP = 40;
export const RICH_MAX_INDENT = 5;

/*
 * [설계 49] 편집기 색 팔레트. 8계열(열) × 밝기 5단계(행, 밝음 → 어두움)를 펼친 격자로 보여 준다.
 * 기존 8색(검정·회색·빨강·주황·노랑·초록·파랑·보라)은 모두 포함하며 이름도 유지한다.
 * 저장 규칙은 팔레트가 아니라 #RRGGBB 형식이므로 팔레트를 바꿔도 서버·WPF 계약은 바뀌지 않는다.
 */
const PALETTE_FAMILIES: { name: string; shades: string[] }[] = [
  { name: '회색', shades: ['#9CA3AF', '#6B7280', '#4B5563', '#374151', '#111827'] },
  { name: '빨강', shades: ['#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B'] },
  { name: '주황', shades: ['#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412'] },
  { name: '노랑', shades: ['#FACC15', '#EAB308', '#CA8A04', '#A16207', '#854D0E'] },
  { name: '초록', shades: ['#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534'] },
  { name: '청록', shades: ['#22D3EE', '#06B6D4', '#0891B2', '#0E7490', '#155E75'] },
  { name: '파랑', shades: ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'] },
  { name: '보라', shades: ['#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'] },
];
const SHADE_NAMES = ['아주 밝은', '밝은', '', '어두운', '아주 어두운'];
/* 기존 선택지 이름을 유지한다(회색 계열의 #6B7280 = 회색, #111827 = 검정). */
const FIXED_COLOR_LABELS: Record<string, string> = { '#6B7280': '회색', '#111827': '검정' };
export const RICH_COLOR_COLUMNS = PALETTE_FAMILIES.length;
/** 행 우선 순서(밝기 행마다 8계열). CKEditor 색 드롭다운도 같은 순서·열 수를 쓴다. */
export const RICH_COLORS: { color: string; label: string }[] = SHADE_NAMES.flatMap((shade, row) =>
  PALETTE_FAMILIES.map((family) => {
    const color = family.shades[row];
    const label = FIXED_COLOR_LABELS[color] ?? (family.name === '회색' && row === 2 ? '진한 회색' : [shade, family.name].filter(Boolean).join(' '));
    return { color, label };
  }));
export const RICH_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
/* css는 CKEditor 정규형이어야 한다: 따옴표를 뗀 뒤 공백이 있는 이름만 작은따옴표로 감싼다.
 * 정규형과 다른 값(예: '굴림', Gulim)은 명령·재편집 시 오류 없이 무시된다(설계 28 §9.3). */
export const RICH_FONTS: { id: RichFontId; css: string; label: string }[] = [
  { id: 'MALGUN_GOTHIC', css: "'맑은 고딕', 'Malgun Gothic', sans-serif", label: '맑은 고딕' },
  { id: 'GULIM', css: '굴림, Gulim, sans-serif', label: '굴림' },
  { id: 'DOTUM', css: '돋움, Dotum, sans-serif', label: '돋움' },
  { id: 'BATANG', css: '바탕, Batang, serif', label: '바탕' },
];
/** 서버와 같은 색 규칙: 대문자 #RRGGBB. */
export const isAllowedColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9A-F]{6}$/.test(value);
const ALIGN_FROM_CSS: Record<string, RichAlignment> = { left: 'LEFT', center: 'CENTER', right: 'RIGHT' };
const FLAG_KEYS = ['bold', 'italic', 'underline', 'color', 'size', 'font'] as const;
/* 글자는 보존하고 일반 문단으로 바꾸는 블록. 그 외 블록(표·이미지 등)은 제거한다. */
const TEXT_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'DIV', 'LI', 'PRE']);
const CONTAINER_TAGS = new Set(['UL', 'OL', 'FIGURE', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH']);
const REMOVED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IMG', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'VIDEO', 'AUDIO']);

/** CKEditor가 쓰는 툴바·허용 값 설정. 소스 편집·표·이미지 등은 툴바에 두지 않는다. */
export const richEditorConfig = {
  toolbar: { items: ['bold', 'italic', 'underline', '|', 'fontColor', 'fontSize', 'fontFamily', '|', 'alignment', 'outdent', 'indent', '|', 'removeFormat', '|', 'undo', 'redo'] },
  fontColor: { colors: RICH_COLORS, columns: RICH_COLOR_COLUMNS, documentColors: 0 },
  /* [설계 49] 문단 들여쓰기는 IndentBlock이 margin-left(px)로 표현한다. 최대 단계는 popupRichTextFormat.limitIndent가 지킨다. */
  indentBlock: { offset: RICH_INDENT_STEP, unit: 'px' },
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
/** 들여쓰기 단계 값이 계약(0~RICH_MAX_INDENT 정수)인지. */
const isIndentLevel = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= RICH_MAX_INDENT;
/** [설계 49] 문단 margin-left(px)를 단계로 바꾼다. px 외 단위·음수는 0, 최대 단계를 넘으면 최대 단계. */
export function indentFromCss(marginLeft: string | undefined | null): number {
  const match = /^(\d+(?:\.\d+)?)px$/.exec((marginLeft ?? '').trim());
  if (!match) return 0;
  return Math.min(RICH_MAX_INDENT, Math.round(Number.parseFloat(match[1]) / RICH_INDENT_STEP));
}

/** 편집기 HTML을 허용 서식만 남긴 문단·Run JSON으로 바꾼다. 허용 밖 서식은 버리고 글자는 보존한다. */
export function htmlToBlocks(html: string): RichBlock[] {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const blocks: RichBlock[] = [];
  const addBlock = (element: Element) => {
    const align = ALIGN_FROM_CSS[((element as HTMLElement).style?.textAlign || 'left').toLowerCase()] ?? 'LEFT';
    // [설계 49] 문단 들여쓰기는 문단 속성으로 읽는다. 목록(LI) 들여쓰기는 문단 들여쓰기가 아니므로 읽지 않는다.
    const indent = element.tagName === 'LI' ? 0 : indentFromCss((element as HTMLElement).style?.marginLeft);
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
        // 붙여넣은 색(rgb·hsl은 브라우저가 rgb로 계산)도 hex로 바꿔 유지한다.
        if (isAllowedColor(color)) next.color = color;
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
    blocks.push(indent > 0 ? { alignment: align, indent, runs } : { alignment: align, runs });
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
    const css = [block.alignment !== 'LEFT' && `text-align:${block.alignment.toLowerCase()};`,
      isIndentLevel(block.indent) && block.indent > 0 && `margin-left:${block.indent * RICH_INDENT_STEP}px;`].filter(Boolean).join('');
    const style = css ? ` style="${css}"` : '';
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
    ...(isIndentLevel(block.indent) && block.indent > 0 ? { indent: block.indent } : {}),
    runs: block.runs.filter((run: RichRun) => run && typeof run.text === 'string' && run.text !== '').map((run: RichRun) => {
      const clean: RichRun = { text: run.text };
      if (run.bold === true) clean.bold = true;
      if (run.italic === true) clean.italic = true;
      if (run.underline === true) clean.underline = true;
      if (isAllowedColor(run.color)) clean.color = run.color;
      if (typeof run.size === 'number' && RICH_SIZES.includes(run.size)) clean.size = run.size;
      if (RICH_FONTS.some((item) => item.id === run.font)) clean.font = run.font;
      return clean;
    }),
  }));
}

export const richFontCss = (id?: RichFontId) => RICH_FONTS.find((font) => font.id === id)?.css;
