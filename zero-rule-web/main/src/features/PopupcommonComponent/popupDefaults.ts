import { FONT_SIZE_MAX, FONT_SIZE_MIN, POPUP_MIN_WINDOW_SIZE } from './popupCommon';
import type { PopupCodeOption } from './popupQuestionCodes';

/**
 * POL-01-02 : 기본값의 적용
 * ■ 화면 기본값(웹 단일 출처)
 * - in : 없음
 * - out: POPUP_DEFAULTS 창 크기·최소·최대·비율, 헤더·푸터 표시, 배경 Overlay, 영상 기본값
 * - 웹이 쓰는 팝업 기본값을 이 파일 한곳에 둔다(2026-11-25). 이전에는 같은 숫자가 createDefaultPopup·PREVIEW_FALLBACK·
 *   previewDialogSize·changePopupType·PopupPreview에 따로 적혀 있었다.
 * - 쓰는 곳: createDefaultPopup(신규 초기값)·changePopupType(유형 변경 보정)·PREVIEW_FALLBACK/withPreviewFallback(미리보기 대체값)·
 *   previewDialogSize·previewOverlay·PopupPreview(값이 없을 때 표시). 저장 값에 직접 넣는 것은 createDefaultPopup(proto)뿐이다.
 * - 정책 기준은 서버 저장 기본값(PopupFullJsonDefaults·PopupSingleResponseAssembler)이며 WPF PopupOptions·PopupFactory 기본값과 같게 유지한다.
 *   창 최소·최대·비율은 관리자 화면이 정하는 값이고, 에이전트(WPF)는 300·작업 영역 90% 보호선 안에서만 반영한다.
 * - 공통코드 0101(팝업 기본값)이 있으면 받아 둔 목록을 applyPopupDefaultCodes로 덮어쓴다(2026-11-25). 조회는 화면 쪽(폐쇄망 공통코드 스토어 code0101)이 하고 이 모듈은 API를 부르지 않는다(2026-11-26 loadPopupDefaultCodes 삭제). 이 객체는 그 값으로 바뀌므로
 *   호출부는 값을 미리 복사해 두지 말고 쓸 때 읽는다. 코드가 없거나 잘못되면 아래 값(POPUP_BASE_DEFAULTS)을 쓴다.
 * - [옵션] 기본값 자체를 바꿀 때는 서버·WPF 기본값과 문서(인터페이스 계약·옵션 가이드)를 함께 맞춘다.
 */
export const POPUP_DEFAULTS = {
  /** 창 크기. FIXED 560×420, RATIO 0.7×0.75, 최소 300×300, 최대 1200×900. */
  window: {
    sizeMode: 'FIXED' as const,
    width: 560,
    height: 420,
    widthRatio: 0.7,
    heightRatio: 0.75,
    minimumWidth: POPUP_MIN_WINDOW_SIZE,
    minimumHeight: POPUP_MIN_WINDOW_SIZE,
    maximumWidth: 1200,
    maximumHeight: 900,
  },
  /** 헤더·닫기·푸터·다시 보지 않기·나중에 보기 표시. */
  chrome: {
    showHeader: true,
    showCloseButton: true,
    showFooter: true,
    showDoNotShowAgain: false,
    showLater: false,
  },
  /** 배경 Overlay(배경 클릭 차단·어둡기). */
  overlay: {
    useBackgroundOverlay: true,
    backgroundOverlayOpacity: 0.45,
  },
  /** 영상. 동영상+퀴즈 완료 비율 0.8(일반 VIDEO는 미설정 = 1.0). */
  video: {
    defaultVolume: 0.7,
    videoQuizCompletionRatio: 0.8,
  },
};
export type PopupDefaults = typeof POPUP_DEFAULTS;

/** 코드 적용 전 기본값(파일에 적은 값). 코드가 없거나 잘못된 값일 때 되돌아가는 기준이다. */
export const POPUP_BASE_DEFAULTS: Readonly<PopupDefaults> = structuredClone(POPUP_DEFAULTS);

/** 입력 허용 범위 한 건. max가 Infinity면 상한 없음. */
export interface PopupInputRange { min: number; max: number; }
export type PopupInputRangeKey = 'size' | 'ratio' | 'font' | 'overlay' | 'volume' | 'completion' | 'hideDays';

/**
 * POL-01-03 : 최소 크기 · POL-04-03 : 비율·상한
 * ■ 계약 범위(고정)
 * - 서버 저장 검증·WPF 보정이 받아 주는 범위다. 공통코드로 넓힐 수 없고 이 안에서 좁히기만 한다.
 * - size 창 크기(px) 300 이상(상한 없음, WPF가 작업 영역 90%로 막음) · ratio 화면 비율 0.1~1 · font 글자 크기 10~40 ·
 *   overlay 배경 어둡기 0~1 · volume 기본 음량 0~1 · completion 완료 비율 0~1 · hideDays 숨김 일수 1~3650.
 */
export const POPUP_CONTRACT_RANGES: Readonly<Record<PopupInputRangeKey, Readonly<PopupInputRange>>> = Object.freeze({
  size: { min: POPUP_MIN_WINDOW_SIZE, max: Infinity },
  ratio: { min: 0.1, max: 1 },
  font: { min: FONT_SIZE_MIN, max: FONT_SIZE_MAX },
  overlay: { min: 0, max: 1 },
  volume: { min: 0, max: 1 },
  completion: { min: 0, max: 1 },
  hideDays: { min: 1, max: 3650 },
});

/** 화면 입력 허용 범위. 처음에는 계약 범위와 같고, 공통코드 0101 범위 코드가 있으면 그 안으로 좁혀진다. 쓸 때 읽는다. */
export const POPUP_INPUT_RANGES: Record<PopupInputRangeKey, PopupInputRange> = structuredClone({ ...POPUP_CONTRACT_RANGES });

/** 팝업 기본값 공통코드 그룹(CLOVER_CODE_TYPE·CLOVER_CODE). 코드(CODE) = 키, 코드이름(CODE_NM) = 값, 세부설명(DTL_EXPL) = 설명. */
export const POPUP_DEFAULT_CODE_TYPE = '0101';

type DefaultTarget = { group: 'window' | 'overlay' | 'video'; key: string; range: PopupInputRangeKey };
/** 기본값 코드 → POPUP_DEFAULTS 위치. 코드는 관리 화면 규칙에 맞춰 영문 대문자·숫자만 쓴다(20자 이하). */
export const POPUP_DEFAULT_VALUE_CODES: Readonly<Record<string, DefaultTarget>> = {
  WIDTH: { group: 'window', key: 'width', range: 'size' },
  HEIGHT: { group: 'window', key: 'height', range: 'size' },
  WRATIO: { group: 'window', key: 'widthRatio', range: 'ratio' },
  HRATIO: { group: 'window', key: 'heightRatio', range: 'ratio' },
  MINW: { group: 'window', key: 'minimumWidth', range: 'size' },
  MINH: { group: 'window', key: 'minimumHeight', range: 'size' },
  MAXW: { group: 'window', key: 'maximumWidth', range: 'size' },
  MAXH: { group: 'window', key: 'maximumHeight', range: 'size' },
  OVERLAY: { group: 'overlay', key: 'backgroundOverlayOpacity', range: 'overlay' },
  VOLUME: { group: 'video', key: 'defaultVolume', range: 'volume' },
  VQRATIO: { group: 'video', key: 'videoQuizCompletionRatio', range: 'completion' },
};
/**
 * 범위 코드 접두어 → 범위 키. 코드는 접두어 + MIN / MAX(예: RATIOMIN, HIDEDAYSMAX).
 * - 창 크기는 범위 코드를 두지 않는다(SIZEMIN 삭제, 2026-11-25). 너비·높이 입력 하한은 기본 창 최소 크기 MINW·MINH가 맡고
 *   (popupSizeInputMin), 창 크기 계약 하한 300은 POPUP_CONTRACT_RANGES.size로 항상 강제한다.
 */
export const POPUP_RANGE_CODE_PREFIXES: Readonly<Record<string, PopupInputRangeKey>> = {
  RATIO: 'ratio', FONT: 'font', OVERLAY: 'overlay', VOLUME: 'volume', VQRATIO: 'completion', HIDEDAYS: 'hideDays',
};

/**
 * 정수만 받는 코드(소수점 방어, 2026-11-25). 창 크기(px)·글자 크기·숨김 일수는 정수 값만 쓰므로, 코드 관리 화면의
 * 코드이름(CODE_NM)에 560.5처럼 소수가 들어와도 무시하고 파일 값을 쓴다(코드 관리 화면은 CODE_NM 형식을 검사하지 않는다).
 * 비율·배경 어둡기·음량·완료 비율은 소수가 정상이라 넣지 않는다.
 */
export const POPUP_INTEGER_CODES: ReadonlySet<string> = new Set([
  'WIDTH', 'HEIGHT', 'MINW', 'MINH', 'MAXW', 'MAXH', 'FONTMIN', 'FONTMAX', 'HIDEDAYSMIN', 'HIDEDAYSMAX',
]);

/** applyPopupDefaultCodes 결과. applied: 반영한 코드, ignored: 반영하지 않은 코드와 이유. */
export interface PopupDefaultCodeResult { applied: string[]; ignored: { code: string; reason: string }[]; }

/**
 * POL-01-02 : 기본값의 적용
 * ■ 공통코드 0101로 기본값·입력 범위 덮어쓰기
 * - in : codes(PopupCodeOption[]) 0101 조회 결과(code·codeNm)
 * - out: PopupDefaultCodeResult 반영·무시한 코드
 * - 먼저 파일 기본값·계약 범위로 되돌린 뒤 적용한다(다시 불러도 같은 결과). 순서: 범위 코드(계약 범위 안에서만 좁힘, MIN ≤ MAX) →
 *   기본값 코드(숫자이고 그 범위 안일 때만) → 최소 ≤ 최대 등 관계 확인(어긋나면 해당 축을 파일 값으로 되돌림).
 *   알 수 없는 코드·숫자가 아닌 값·정수 코드의 소수(POPUP_INTEGER_CODES)·범위 밖 값은 무시하고 ignored에 이유를 남긴다.
 */
export function applyPopupDefaultCodes(codes: readonly Pick<PopupCodeOption, 'code' | 'codeNm'>[]): PopupDefaultCodeResult {
  const result: PopupDefaultCodeResult = { applied: [], ignored: [] };
  const base = POPUP_BASE_DEFAULTS;
  Object.assign(POPUP_DEFAULTS.window, base.window);
  Object.assign(POPUP_DEFAULTS.overlay, base.overlay);
  Object.assign(POPUP_DEFAULTS.video, base.video);
  for (const key of Object.keys(POPUP_CONTRACT_RANGES) as PopupInputRangeKey[]) POPUP_INPUT_RANGES[key] = { ...POPUP_CONTRACT_RANGES[key] };
  const values = new Map<string, number>();
  for (const { code, codeNm } of codes) {
    const key = String(code ?? '').trim().toUpperCase();
    const text = String(codeNm ?? '').trim();
    const number = text === '' ? NaN : Number(text);
    if (!Number.isFinite(number)) { result.ignored.push({ code: key, reason: `숫자가 아님(${text})` }); continue; }
    if (POPUP_INTEGER_CODES.has(key) && !Number.isInteger(number)) { result.ignored.push({ code: key, reason: `정수가 아님(${text})` }); continue; }
    values.set(key, number);
  }
  // 1) 범위 코드: 계약 범위 안에서만 좁힌다.
  for (const [prefix, rangeKey] of Object.entries(POPUP_RANGE_CODE_PREFIXES)) {
    const contract = POPUP_CONTRACT_RANGES[rangeKey];
    const next = { ...contract };
    for (const side of ['MIN', 'MAX'] as const) {
      const code = prefix + side;
      if (!values.has(code)) continue;
      const value = values.get(code)!;
      values.delete(code);
      if (value < contract.min || value > contract.max) { result.ignored.push({ code, reason: `계약 범위(${contract.min}~${contract.max}) 밖` }); continue; }
      next[side === 'MIN' ? 'min' : 'max'] = value;
      result.applied.push(code);
    }
    if (next.min > next.max) {
      result.ignored.push({ code: prefix + 'MIN/MAX', reason: '하한이 상한보다 큼' });
      result.applied = result.applied.filter((code) => code !== prefix + 'MIN' && code !== prefix + 'MAX');
      continue;
    }
    POPUP_INPUT_RANGES[rangeKey] = next;
  }
  // 2) 기본값 코드: 해당 범위 안일 때만 반영한다.
  for (const [code, target] of Object.entries(POPUP_DEFAULT_VALUE_CODES)) {
    if (!values.has(code)) continue;
    const value = values.get(code)!;
    values.delete(code);
    const range = POPUP_INPUT_RANGES[target.range];
    if (value < range.min || value > range.max) { result.ignored.push({ code, reason: `허용 범위(${range.min}~${range.max}) 밖` }); continue; }
    (POPUP_DEFAULTS[target.group] as Record<string, number | string | boolean>)[target.key] = value;
    result.applied.push(code);
  }
  for (const code of values.keys()) result.ignored.push({ code, reason: '알 수 없는 코드' });
  // 3) 관계: 최소 ≤ 최대가 아니면 그 축의 최소·최대를 파일 값으로 되돌린다.
  const window = POPUP_DEFAULTS.window;
  for (const [min, max, minCode, maxCode] of [['minimumWidth', 'maximumWidth', 'MINW', 'MAXW'], ['minimumHeight', 'maximumHeight', 'MINH', 'MAXH']] as const) {
    if (window[min] <= window[max]) continue;
    window[min] = base.window[min]; window[max] = base.window[max];
    result.applied = result.applied.filter((code) => code !== minCode && code !== maxCode);
    result.ignored.push({ code: `${minCode}/${maxCode}`, reason: '최소가 최대보다 큼' });
  }
  // 4) 기본 창 크기는 최소 크기 이상이어야 한다(너비·높이 입력 하한이 최소 크기라서). 아니면 그 축의 크기·최소를 파일 값으로 되돌린다.
  for (const [size, min, sizeCode, minCode] of [['width', 'minimumWidth', 'WIDTH', 'MINW'], ['height', 'minimumHeight', 'HEIGHT', 'MINH']] as const) {
    if (window[size] >= window[min]) continue;
    window[size] = base.window[size]; window[min] = base.window[min];
    result.applied = result.applied.filter((code) => code !== sizeCode && code !== minCode);
    result.ignored.push({ code: `${sizeCode}/${minCode}`, reason: '기본 크기가 최소 크기보다 작음' });
  }
  return result;
}

/**
 * POL-01-03 : 최소 크기
 * ■ 너비·높이 입력 하한
 * - out: { width, height } 기본 창 최소 크기(POPUP_DEFAULTS.window.minimumWidth·minimumHeight, 공통코드 MINW·MINH 반영)
 * - 최소 크기 입력 칸이 없는 등록 화면(IS063 샘플)은 모든 팝업이 이 최소 크기로 저장되므로, 그보다 작은 너비·높이는 받지 않는다
 *   (실제 팝업이 최소 크기까지 늘려 띄우기 때문). 쓸 때 읽는다(코드 적용 뒤 값).
 */
export function popupSizeInputMin(): { width: number; height: number } {
  const window = POPUP_DEFAULTS.window;
  return { width: Math.max(POPUP_CONTRACT_RANGES.size.min, window.minimumWidth), height: Math.max(POPUP_CONTRACT_RANGES.size.min, window.minimumHeight) };
}
