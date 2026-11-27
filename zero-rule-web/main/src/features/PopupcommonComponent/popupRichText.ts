/*
 * TEXT 본문 서식(content.textBlocks) 계약과 편집기 경계 변환.
 * 저장·전달 기준은 문단·Run JSON이며 HTML은 CKEditor 입출력에서만 다룬다.
 * 크기·정렬 허용 값과 색 규칙은 서버 PopupRichText.java와 같아야 한다. WPF PopupRichText.cs는 목록을 복제하지 않고 표시 방어만 한다.
 * 글꼴은 기본 4종을 포함해 모두 Windows 글꼴 패밀리 이름을 runs[].font에 그대로 저장한다(isRichFontName 규칙은 서버·WPF와 같다).
 * 2026-11-24 글꼴 ID(MALGUN_GOTHIC·GULIM·DOTUM·BATANG) 삭제: 기존 저장값은 db/oracle/26_rich_font_id_to_name_oracle.sql로 이름으로 바꾼다.
 * 글자 색은 팔레트로 제한하지 않고 #RRGGBB(대문자) 형식만 확인한다. 팔레트는 편집기 선택지일 뿐이며 가독성은 작성자가 판단한다.
 */
/** 문단 정렬 값 */
export type RichAlignment = 'LEFT' | 'CENTER' | 'RIGHT';
/** runs[].font 저장값: Windows 글꼴 패밀리 이름(기본 4종 포함, 2026-11-24 글꼴 ID 삭제) */
export type RichFontValue = string;
/** 편집기 글꼴 선택지. id = runs[].font 저장값, css = 웹 표시·CKEditor용 CSS 글꼴 목록, label = 화면 이름 */
export interface RichFontOption { id: RichFontValue; css: string; label: string }
/** 같은 서식이 이어지는 글자 구간. 지정하지 않은 서식 키는 생략한다. */
export interface RichRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  size?: number;
  font?: RichFontValue;
}
/** 서식 문단 한 개(content.textBlocks의 원소) */
export interface RichBlock {
  alignment: RichAlignment;
  /** 문단 왼쪽 들여쓰기 단계(1 이상 정수, 단계 수 제한 없음). 0이면 키를 생략한다. */
  indent?: number;
  /** 빈 배열이면 빈 문단 */
  runs: RichRun[];
}

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 들여쓰기 단위·상한
 * - in : 없음
 * - out: RICH_INDENT_STEP(number) 1단계 = 40px · RICH_INDENT_LIMIT(number) 단계 값의 숫자 상한
 * - 문단 들여쓰기 단계와 px 사이 변환 기준을 정한다. 40px은 CKEditor IndentBlock offset과 같다.
 *   단계 수 제한은 없다. RICH_INDENT_LIMIT은 횟수 제한이 아니라 서버가 정수(Java int)로 읽을 수 있는 숫자 범위다.
 */
export const RICH_INDENT_STEP = 40;
export const RICH_INDENT_LIMIT = 2147483647;

/*
 * 편집기 색 팔레트. 8계열(열) × 밝기 5단계(행, 밝음 → 어두움)를 펼친 격자로 보여 준다.
 * 기본 8색(검정·회색·빨강·주황·노랑·초록·파랑·보라)은 모두 포함하며 이름도 유지한다.
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
/* 기본 8색 이름을 유지한다(회색 계열의 #6B7280 = 회색, #111827 = 검정). */
const FIXED_COLOR_LABELS: Record<string, string> = { '#6B7280': '회색', '#111827': '검정' };
/**
 * POL-03-03 : 편집 UI
 * ■ 색 격자 열 수
 * - in : 없음
 * - out: number 팔레트 계열 수(8)
 * - 팔레트 계열 수를 받아 색 격자의 열 수로 쓴다. 서식 패널 격자·방향키 이동·CKEditor 색 드롭다운이 같이 쓴다.
 */
export const RICH_COLOR_COLUMNS = PALETTE_FAMILIES.length;
/**
 * POL-03-03 : 편집 UI
 * ■ 편집기 색 선택지
 * - in : 없음(팔레트 계열·밝기 이름에서 만든다)
 * - out: { color: string; label: string }[] 대문자 #RRGGBB 색과 한국어 이름
 * - 팔레트 계열·밝기 단계를 받아 행 우선 순서(밝기 행마다 8계열)의 색 목록을 만든다. CKEditor 색 드롭다운도 같은 순서·열 수를 쓴다.
 */
export const RICH_COLORS: { color: string; label: string }[] = SHADE_NAMES.flatMap((shade, row) =>
  PALETTE_FAMILIES.map((family) => {
    const color = family.shades[row];
    const label = FIXED_COLOR_LABELS[color] ?? (family.name === '회색' && row === 2 ? '진한 회색' : [shade, family.name].filter(Boolean).join(' '));
    return { color, label };
  }));
/**
 * POL-03-02 : 문단·글자 서식
 * ■ 허용 글자 크기
 * - in : 없음
 * - out: number[] px 단위 크기 목록
 * - 편집기 크기 선택지이자 저장 허용 값이다. 서버 PopupRichText.java 목록과 같아야 한다.
 */
export const RICH_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
/**
 * POL-03-02 : 문단·글자 서식
 * ■ 허용 글꼴
 * - in : 없음
 * - out: { id: string; css: string; label: string }[] 저장값(Windows 글꼴 패밀리 이름)·CKEditor용 CSS 글꼴 목록·화면 이름
 * - 기본 4종의 저장 이름과 편집기 CSS 값을 짝지어 편집기 선택지·HTML 변환·표시에 쓴다. 저장값은 WPF가 그대로 FontFamily로 쓰는 영문 패밀리 이름이다.
 *   css는 CKEditor 정규형이어야 한다: 따옴표를 뗀 뒤 공백이 있는 이름만 작은따옴표로 감싼다.
 *   정규형과 다른 값(예: '굴림', Gulim)은 명령·재편집 시 오류 없이 무시된다.
 */
export const RICH_FONTS: RichFontOption[] = [
  { id: 'Malgun Gothic', css: "'맑은 고딕', 'Malgun Gothic', sans-serif", label: '맑은 고딕' },
  { id: 'Gulim', css: '굴림, Gulim, sans-serif', label: '굴림' },
  { id: 'Dotum', css: '돋움, Dotum, sans-serif', label: '돋움' },
  { id: 'Batang', css: '바탕, Batang, serif', label: '바탕' },
];

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 글꼴 이름 형식 확인(TODO28 후속)
 * - in : value(unknown) runs[].font 값
 * - out: boolean Windows 글꼴 패밀리 이름으로 받을 수 있으면 true
 * - 이름 한 개만 받는다. 1~64자, 앞뒤 공백 없음, 제어 문자와 CSS 목록·경로·URI에 쓰이는 문자(, ; : ' " \ / < > { } ( ) # & = ? * |)는 받지 않는다.
 *   서버 PopupRichText.java FONT_NAME, WPF PopupRichText.IsFontName과 같은 규칙이다. 설치 여부·허용 목록은 확인하지 않는다.
 */
export const isRichFontName = (value: unknown): value is string =>
  // eslint-disable-next-line no-control-regex -- 제어 문자를 거부하려고 범위를 명시한다.
  typeof value === 'string' && value.length <= 64 && value === value.trim() && /^[^\u0000-\u001F\u007F,;:'"\\/<>{}()#&=?*|]+$/.test(value);
/** 저장 가능한 글꼴 값: 형식에 맞는 Windows 글꼴 패밀리 이름(기본 4종 포함) */
export const isRichFontValue = (value: unknown): value is RichFontValue => isRichFontName(value);

/* CKEditor 정규형: 따옴표를 뗀 뒤 공백이 있는 이름만 작은따옴표로 감싸고 ', '로 잇는다. */
const canonicalFontCss = (css: string) => css.split(',').map((part) => part.replace(/["']/g, '').trim()).filter(Boolean)
  .map((part) => (/\s/.test(part) ? `'${part}'` : part)).join(', ');
let registeredFonts: RichFontOption[] = [];

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 굵기별 실제 서체 지정(2026-11-24)
 * - regular: 일반 글자(400)에 쓸 Windows 서체 이름(local() 이름, 예: 'YouandiNewKr Text Regular')
 * - bold?: 굵게(700)에 쓸 서체 이름. 없으면 브라우저가 regular를 인위적으로 굵게 그린다.
 * - 전역 CSS 별칭이 굵기마다 다른 디자인(예: 300 Text·700 Head)을 섞거나 400이 없으면 웹이 WPF와 다른 서체를 고른다.
 *   WPF는 family 패밀리 안의 Regular·Bold를 고르므로, 그와 같은 서체를 여기 지정하면 편집기·미리보기·WPF가 같아진다.
 */
export interface PopupRichFontFaces { regular: string; bold?: string }
/** registerPopupRichFonts 입력 한 건. css(전역 별칭) 또는 faces(굵기별 서체 지정) 중 하나를 넘긴다. faces가 있으면 css보다 우선한다. */
export interface PopupRichFontRegistration { family: string; css?: string; label?: string; faces?: PopupRichFontFaces }

/** 팝업 서식 전용 @font-face를 넣는 style 요소 id. 전역 CSS·다른 화면에는 영향이 없도록 고유 별칭(PopupRichFaceN)만 정의한다. */
export const POPUP_RICH_FACE_STYLE_ID = 'popup-rich-font-faces';

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 사용자 지정 글꼴 등록(TODO28 후속)
 * - in : fonts(PopupRichFontRegistration[]) family = WPF가 인식하는 Windows 글꼴 패밀리 이름(저장값), label = 선택지 이름(없으면 family),
 *        css = 웹 전역 @font-face 별칭 등 CSS 글꼴 목록 또는 faces = 일반(400)·굵게(700)에 쓸 실제 서체 이름(2026-11-24)
 * - out: RichFontOption[] 실제로 등록된 글꼴(형식이 틀리거나 기본 4종과 같은 family·중복 family·css/faces가 없거나 틀린 항목은 제외)
 * - 앱 시작 시 한 번 호출한다(호출할 때마다 등록 목록을 바꾼다). 이후 열리는 편집기·서식 패널·미리보기에 적용된다.
 *   css 방식: 400/700과 실제 웹 서체의 연결은 전역 CSS(@font-face의 font-weight)가 담당한다.
 *   faces 방식: 팝업 전용 별칭 PopupRichFaceN의 @font-face(400 → regular, 700 → bold, src: local())를 만들어 문서에 넣고 편집기·미리보기가 그 별칭을 쓴다.
 *   굵게는 어느 방식이든 기존 bold로 저장하고, 서버·WPF에는 family 이름 문자열만 전달된다(CSS·폰트 파일은 전달하지 않음).
 */
export function registerPopupRichFonts(fonts: PopupRichFontRegistration[]): RichFontOption[] {
  const next: RichFontOption[] = [];
  const faceRules: string[] = [];
  for (const font of fonts) {
    if (!isRichFontName(font?.family) || RICH_FONTS.some((item) => item.id === font.family) || next.some((item) => item.id === font.family)) continue;
    let css = '';
    if (font.faces != null) {
      const { regular, bold } = font.faces;
      if (!isRichFontName(regular) || (bold != null && !isRichFontName(bold))) continue;
      const alias = `PopupRichFace${faceRules.length}`;
      faceRules.push(`@font-face{font-family:"${alias}";font-style:normal;font-weight:400;src:local("${regular}");}`
        + (bold ? `@font-face{font-family:"${alias}";font-style:normal;font-weight:700;src:local("${bold}");}` : ''));
      css = canonicalFontCss(`${alias}, sans-serif`);
    } else {
      css = canonicalFontCss(font?.css ?? '');
    }
    if (!css) continue;
    next.push({ id: font.family, css, label: font.label?.trim() || font.family });
  }
  registeredFonts = next;
  if (typeof document !== 'undefined') {
    let style = document.getElementById(POPUP_RICH_FACE_STYLE_ID);
    if (!style && faceRules.length) {
      style = document.createElement('style');
      style.id = POPUP_RICH_FACE_STYLE_ID;
      document.head.appendChild(style);
    }
    if (style) style.textContent = faceRules.join('\n');
  }
  return [...next];
}

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 현재 글꼴 선택지
 * - in : extra?(RichFontValue[]) 기존 데이터에 있는 미등록 글꼴 이름(재편집 보존용)
 * - out: RichFontOption[] 기본 4종 + 등록 글꼴 + 미등록 이름(표시 이름 뒤 '(미등록)')
 * - 미등록 이름은 편집기에서 지우지 않고 그대로 저장되도록 선택지에 넣는다. CSS는 이름 그대로라 PC에 없으면 기본 글꼴로 보인다.
 */
export function richFonts(extra: readonly unknown[] = []): RichFontOption[] {
  const list = [...RICH_FONTS, ...registeredFonts];
  for (const name of extra) {
    if (isRichFontName(name) && !list.some((item) => item.id === name)) list.push({ id: name, css: canonicalFontCss(name), label: `${name} (미등록)` });
  }
  return list;
}
/** 서식 본문에 쓰인 글꼴 값 목록(중복 제거) */
export const fontsInBlocks = (blocks: RichBlock[]) => [...new Set(blocks.flatMap((block) => block.runs.map((run) => run.font).filter((font): font is RichFontValue => font != null)))];
/** 서버와 같은 색 규칙: 대문자 #RRGGBB. */
const isAllowedColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9A-F]{6}$/.test(value);
const ALIGN_FROM_CSS: Record<string, RichAlignment> = { left: 'LEFT', center: 'CENTER', right: 'RIGHT' };
const FLAG_KEYS = ['bold', 'italic', 'underline', 'strikethrough', 'color', 'size', 'font'] as const;
/* 글자는 보존하고 일반 문단으로 바꾸는 블록. 그 외 블록(표·이미지 등)은 제거한다. */
const TEXT_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'DIV', 'LI', 'PRE']);
const CONTAINER_TAGS = new Set(['UL', 'OL', 'FIGURE', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH']);
const REMOVED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IMG', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'VIDEO', 'AUDIO']);

/**
 * POL-03-03 : 편집 UI
 * ■ 팝업 서식 편집기 설정
 * - in : 없음(허용 색·크기·글꼴·들여쓰기 단위에서 만든다)
 * - out: CKEditor config 객체(toolbar·fontColor·indentBlock·fontSize·fontFamily·alignment)
 * - 허용 값 목록을 받아 CKEditor 툴바·선택지 설정을 만든다. 소스 편집·표·이미지 등은 툴바에 두지 않는다.
 */
export const richEditorConfig = {
  toolbar: { items: ['bold', 'italic', 'underline', 'strikethrough', '|', 'fontColor', 'fontSize', 'fontFamily', '|', 'alignment', 'outdent', 'indent', '|', 'undo', 'redo'] },
  fontColor: { colors: RICH_COLORS, columns: RICH_COLOR_COLUMNS, documentColors: 0 },
  /* 문단 들여쓰기는 IndentBlock이 margin-left(px)로 표현한다. 40px 단위 정규화는 popupRichTextFormat.normalizeIndent가 한다. */
  indentBlock: { offset: RICH_INDENT_STEP, unit: 'px' },
  /* 'default'는 크기 서식 없음 = 본문 기본 크기(bodyFontSize). */
  fontSize: { options: ['default', ...RICH_SIZES], supportAllValues: false },
  /* 등록 글꼴(registerPopupRichFonts)을 반영하도록 읽을 때 만든다. 편집기는 기존 데이터의 미등록 이름을 추가해 덮어쓴다. */
  get fontFamily() { return { options: ['default', ...richFonts().map((font) => font.css)], supportAllValues: false }; },
  alignment: { options: ['left', 'center', 'right'] as ('left' | 'center' | 'right')[] },
};

const normalizeFontCss = (value: string) => value.replace(/["']/g, '').replace(/\s*,\s*/g, ',').trim().toLowerCase();
function toHexColor(value: string): string {
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return `#${rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  return value.trim().toUpperCase();
}
const sameFormat = (a: RichRun, b: RichRun) => FLAG_KEYS.every((key) => (a[key] ?? null) === (b[key] ?? null));
/**
 * POL-03-02 : 문단·글자 서식
 * ■ 들여쓰기 단계 값 확인
 * - in : value(unknown) 확인할 값
 * - out: boolean 계약에 맞으면 true(타입 가드: number)
 * - 값을 받아 0 이상 정수이고 RICH_INDENT_LIMIT 이하인지 확인한다. NaN·Infinity·소수·음수는 false.
 */
export const isIndentLevel = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= RICH_INDENT_LIMIT;
/**
 * POL-03-02 : 문단·글자 서식
 * ■ 여백 → 들여쓰기 단계 변환
 * - in : marginLeft(string | undefined | null) 문단 CSS margin-left
 * - out: number 들여쓰기 단계(잘못된 값은 0)
 * - 문단 margin-left(px)를 받아 40px 단위 단계로 반올림해 돌려준다. px 외 단위·음수·숫자 범위를 넘는 값은 0.
 */
export function indentFromCss(marginLeft: string | undefined | null): number {
  const match = /^(\d+(?:\.\d+)?)px$/.exec((marginLeft ?? '').trim());
  if (!match) return 0;
  const level = Math.round(Number.parseFloat(match[1]) / RICH_INDENT_STEP);
  return isIndentLevel(level) ? level : 0;
}

/**
 * POL-03-01 : 저장·표시 경계
 * ■ 편집기 HTML → 서식 본문 변환
 * - in : html(string) CKEditor getData() 결과
 * - out: RichBlock[] 문단·Run JSON
 * - 편집기 HTML을 받아 허용 서식만 남긴 문단·Run JSON으로 바꾼다. 허용 밖 서식은 버리고 글자는 보존한다.
 *   표·목록 등 블록은 글자만 일반 문단으로 남기고, 스크립트·이미지 등은 지운다.
 */
export function htmlToBlocks(html: string, fonts: RichFontOption[] = richFonts()): RichBlock[] {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const blocks: RichBlock[] = [];
  const addBlock = (element: Element) => {
    const align = ALIGN_FROM_CSS[((element as HTMLElement).style?.textAlign || 'left').toLowerCase()] ?? 'LEFT';
    // 문단 들여쓰기는 문단 속성으로 읽는다. 목록(LI) 들여쓰기는 문단 들여쓰기가 아니므로 읽지 않는다.
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
      else if (tag === 'S' || tag === 'DEL' || tag === 'STRIKE') next.strikethrough = true;
      if (element.style) {
        const color = element.style.color ? toHexColor(element.style.color) : '';
        // 붙여넣은 색(rgb·hsl은 브라우저가 rgb로 계산)도 hex로 바꿔 유지한다.
        if (isAllowedColor(color)) next.color = color;
        const size = element.style.fontSize;
        if (size.endsWith('px') && RICH_SIZES.includes(Number.parseFloat(size))) next.size = Number.parseFloat(size);
        const font = element.style.fontFamily ? fonts.find((item) => normalizeFontCss(item.css) === normalizeFontCss(element.style.fontFamily)) : undefined;
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

/**
 * POL-03-01 : 저장·표시 경계
 * ■ 서식 본문 → 편집기 HTML 변환
 * - in : blocks(RichBlock[]) 문단·Run JSON
 * - out: string CKEditor에 넣을 HTML
 * - 서식 본문을 받아 재편집용 HTML을 만든다. text는 항상 이스케이프하고, 빈 문단은 &nbsp; 한 칸으로 유지한다.
 */
export function blocksToHtml(blocks: RichBlock[], fonts: RichFontOption[] = richFonts(fontsInBlocks(blocks))): string {
  return blocks.map((block) => {
    const css = [block.alignment !== 'LEFT' && `text-align:${block.alignment.toLowerCase()};`,
      isIndentLevel(block.indent) && block.indent > 0 && `margin-left:${block.indent * RICH_INDENT_STEP}px;`].filter(Boolean).join('');
    const style = css ? ` style="${css}"` : '';
    const inner = block.runs.map((run, index) => {
      let html = run.text.split('\n').map((line, lineIndex, lines) => keepSpaces(escapeHtml(line),
        index === 0 && lineIndex === 0, index === block.runs.length - 1 && lineIndex === lines.length - 1)).join('<br>');
      const font = fonts.find((item) => item.id === run.font);
      const css = [run.color && `color:${run.color};`, run.size && `font-size:${run.size}px;`, font && `font-family:${font.css};`].filter(Boolean).join('');
      if (css) html = `<span style="${escapeHtml(css)}">${html}</span>`;
      if (run.underline) html = `<u>${html}</u>`;
      if (run.strikethrough) html = `<s>${html}</s>`;
      if (run.italic) html = `<i>${html}</i>`;
      if (run.bold) html = `<strong>${html}</strong>`;
      return html;
    }).join('');
    return `<p${style}>${inner || '&nbsp;'}</p>`;
  }).join('');
}

/**
 * POL-03-01 : 저장·표시 경계
 * ■ 서식 본문 → 일반 문자열
 * - in : blocks(RichBlock[]) 서식 본문
 * - out: string 서식 없는 문자열(문단은 \n으로 구분)
 * - 서식 본문을 받아 서버 파생 규칙과 같은 일반 문자열을 만든다.
 */
export const blocksToPlainText = (blocks: RichBlock[]) => blocks.map((block) => block.runs.map((run) => run.text).join('')).join('\n');

/**
 * POL-03-01 : 저장·표시 경계
 * ■ 일반 문자열 → 서식 본문
 * - in : plainText(string) 서식 없는 문자열
 * - out: RichBlock[] 왼쪽 정렬·서식 없는 문단 배열(빈 문자열이면 [])
 * - 서식 본문이 없는 기존 plainText를 받아 줄마다 서식 없는 문단으로 바꾼다.
 */
export const plainTextToBlocks = (plainText: string): RichBlock[] =>
  plainText === '' ? [] : plainText.split('\n').map((line) => ({ alignment: 'LEFT', runs: line ? [{ text: line }] : [] }));

/**
 * POL-03-01 : 저장·표시 경계
 * ■ 저장된 서식 본문 정리
 * - in : value(unknown) 저장·수신한 textBlocks 값
 * - out: RichBlock[] | null 계약에 맞게 걸러 낸 문단 배열(배열이 아니면 null)
 * - 서버 계약 밖 값이 섞인 저장 데이터(구버전·직접 입력)를 받아 표시 전에 허용 정렬·서식·빈 글자 구간을 걸러 낸다.
 */
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
      if (run.strikethrough === true) clean.strikethrough = true;
      if (isAllowedColor(run.color)) clean.color = run.color;
      if (typeof run.size === 'number' && RICH_SIZES.includes(run.size)) clean.size = run.size;
      if (isRichFontValue(run.font)) clean.font = run.font;
      return clean;
    }),
  }));
}

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 글꼴 값 → CSS 글꼴 목록
 * - in : id?(RichFontValue) 글꼴 이름(저장값)
 * - out: string | undefined CSS font-family 값(없거나 형식이 틀리면 undefined = 기본 글꼴)
 * - 기본 4종·등록 글꼴은 등록된 CSS(웹 별칭)를, 미등록 이름은 이름 그대로를 CSS로 쓴다(PC에 없으면 브라우저 기본 글꼴).
 */
export const richFontCss = (id?: RichFontValue) => (id == null ? undefined : richFonts([id]).find((font) => font.id === id)?.css);

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 글꼴별 취소선 위치·두께(TODO62-5, 2026-11-28)
 * - WPF TextDecorations.Strikethrough가 쓰는 글꼴 값(Typeface.StrikethroughPosition·StrikethroughThickness, em 단위, 기준선 위가 +)이다.
 *   이 PC(Windows)의 WPF에서 읽은 값이며, 같은 글꼴 파일이면 폐쇄망도 같다.
 * - 브라우저 기본 line-through는 이 값을 쓰지 않아 WPF보다 1~3.5px 위·32px에서 1px 굵게 그려졌다(verify-strike-62 실측).
 * - 표에 없는 글꼴(유앤아이 등 폐쇄망 등록 글꼴 포함)과 글꼴 미지정 구간은 RICH_STRIKE_FALLBACK(0.3em, 표 값 0.26~0.33의 가운데)으로 근사한다.
 *   글꼴 미지정 구간은 바깥 글꼴을 이어받아 환경마다 실제 글꼴이 다르다(로컬 맑은 고딕, 폐쇄망 Youandi New Kr Text).
 */
export const RICH_STRIKE_METRICS: Readonly<Record<string, { position: number; thickness: number }>> = {
  'Malgun Gothic': { position: 0.3062, thickness: 0.0498 },
  'Noto Sans KR': { position: 0.325, thickness: 0.05 },
  'Noto Serif KR': { position: 0.308, thickness: 0.05 },
  'Noto Sans': { position: 0.322, thickness: 0.05 },
  'Noto Serif': { position: 0.322, thickness: 0.05 },
  // 폐쇄망 Youandi(2026-11-28, 이 PC 설치본 HeadRegular·HeadExtraBold·TextBold에서 읽음). Head 계열은 두께가 얇다(0.02em).
  'YouandiModern Head': { position: 0.3, thickness: 0.02 },
  'YouandiModern HeadExtraBold': { position: 0.3, thickness: 0.02 },
  'YouandiModern TextBold': { position: 0.263, thickness: 0.05 },
  // YouandiModern Text(TextRegular)는 이 PC에 없어 같은 계열 TextBold 값으로 둔다(폐쇄망 확인 전 추정).
  'YouandiModern Text': { position: 0.263, thickness: 0.05 },
  Gulim: { position: 0.2588, thickness: 0.0498 },
  Dotum: { position: 0.2588, thickness: 0.0498 },
  Batang: { position: 0.2588, thickness: 0.0498 },
};
/** 표에 없는 글꼴·글꼴 미지정 구간의 취소선 위치·두께(em). */
export const RICH_STRIKE_FALLBACK = { position: 0.3, thickness: 0.05 } as const;

/**
 * POL-03-02 : 문단·글자 서식
 * ■ 취소선 스타일(WPF 위치 재현)
 * - in : font?(RichFontValue) 구간 글꼴(없으면 근사값)
 * - out: CSS 속성 객체. 취소선을 '기준선 기준 위치를 지정한 밑줄'로 그린다.
 * - Chromium은 text-underline-offset(길이)을 기준선에서 잰다. 선 윗변 = 기준선 + offset이므로
 *   중심을 기준선 위 position(em)에 두려면 offset = -(position + thickness / 2)em. 획 건너뛰기(skip-ink)는 끈다(line-through와 같이 글자를 가로지름).
 *   취소선 구간을 감싼 안쪽 span에만 쓰고, 밑줄은 바깥 span의 일반 밑줄로 그대로 둔다(둘 다 켠 구간도 두 선이 각자 자리에 그려진다).
 */
export function richStrikeStyle(font?: RichFontValue): { textDecorationLine: 'underline'; textDecorationThickness: string; textUnderlineOffset: string; textDecorationSkipInk: 'none' } {
  const { position, thickness } = (font != null ? RICH_STRIKE_METRICS[font] : undefined) ?? RICH_STRIKE_FALLBACK;
  return {
    textDecorationLine: 'underline', textDecorationThickness: `${thickness}em`,
    textUnderlineOffset: `${-(position + thickness / 2)}em`, textDecorationSkipInk: 'none',
  };
}
