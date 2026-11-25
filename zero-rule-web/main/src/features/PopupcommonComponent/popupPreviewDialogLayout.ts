import type { AdminPopupDetail } from '@local/domain';
import type { Size } from './imagePreviewLayout';
import { POPUP_SCREEN_SAFE_AREA_RATIO, popupWindowBounds } from './popupCommon';
import { POPUP_DEFAULTS } from './popupDefaults';
import { POPUP_LAYOUT } from './popupLayout';

/* WPF PopupWindow.ApplyPosition과 같은 9개 위치. 작업 영역(미리보기에서는 브라우저 창) 가장자리에 붙이고,
 * 모르는 값은 WPF PopupFactory와 같이 중앙으로 본다. 값은 [가로, 세로] flex 정렬값이다. */
const PREVIEW_POSITION_ALIGN: Record<string, [string, string]> = {
  TOP_LEFT: ['flex-start', 'flex-start'], TOP_CENTER: ['center', 'flex-start'], TOP_RIGHT: ['flex-end', 'flex-start'],
  CENTER_LEFT: ['flex-start', 'center'], CENTER: ['center', 'center'], CENTER_RIGHT: ['flex-end', 'center'],
  BOTTOM_LEFT: ['flex-start', 'flex-end'], BOTTOM_CENTER: ['center', 'flex-end'], BOTTOM_RIGHT: ['flex-end', 'flex-end'],
};

/**
 * POL-08-01 : 공통 렌더러
 * ■ 미리보기 위치 정렬값
 * - in : popup(AdminPopupDetail) content.popupPosition(TOP_LEFT~BOTTOM_RIGHT 9개, 대소문자 무관)
 * - out: [string, string] [가로, 세로] flex 정렬값(flex-start·center·flex-end)
 * - 팝업 위치 값을 받아 모달 컨테이너에 쓸 정렬값으로 바꾼다. 비었거나 모르는 값은 중앙이다.
 */
export function previewPositionAlign(popup: AdminPopupDetail): [string, string] {
  const position = popup.content.popupPosition == null ? '' : String(popup.content.popupPosition).toUpperCase();
  return PREVIEW_POSITION_ALIGN[position] ?? PREVIEW_POSITION_ALIGN.CENTER;
}

/** 영상 창(VIDEO, 영상 사용 QUIZ) 여부. WPF는 이 창을 저사양 PC 부하 때문에 그림자 없는 불투명 창으로 만든다(ApplyVideoWindowSurface). */
export function previewHostsVideo(popup: AdminPopupDetail): boolean {
  return popup.popupType === 'VIDEO' || (popup.popupType === 'QUIZ' && popup.content.videoEnabled === true);
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 창 안쪽 여백
 * - in : popup(AdminPopupDetail) popupType · sizeMode · content.videoEnabled
 * - out: number 여백(px) — FULLSCREEN 0, 그 밖 24(영상 창 포함)
 * - WPF 일반 창은 창 크기 안에 그림자용 투명 여백 24px(PopupOuterGrid.Margin)을 두고 그 안에 흰 판을 그린다(흰 판 = 창 - 48).
 *   미리보기(PopupPreview)도 창 크기 안에 같은 여백을 두고 그 안에 판을 그린다(2026-11-17).
 * - 영상 창(2026-11-24): WPF가 창 자체를 사방 24씩 줄이고 위치도 그만큼 안쪽으로 옮겨(VideoWindowInset) 보이는 판이 다른 유형의 흰 판과
 *   같은 크기·자리다. 미리보기는 같은 결과를 투명 여백 24로 그린다(그림자만 없음 — previewWindowShadow). 이전에는 영상 창 여백 0이라 판이 48 컸다.
 */
export function previewShadowMargin(popup: AdminPopupDetail): number {
  return popup.sizeMode === 'FULLSCREEN' ? 0 : POPUP_LAYOUT.windowMargin;
}

/** 판 그림자 표시 여부. 영상 창·FULLSCREEN은 WPF와 같이 그림자를 그리지 않는다. */
export function previewWindowShadow(popup: AdminPopupDetail): boolean {
  return popup.sizeMode !== 'FULLSCREEN' && !previewHostsVideo(popup);
}

/** WPF DropShadowEffect(BlurRadius 22 · ShadowDepth 4 · Direction 270 · Opacity 0.28)에 해당하는 CSS 그림자. 여백이 있는 창에만 쓴다. */
export const PREVIEW_WINDOW_SHADOW = '0 4px 22px rgba(0, 0, 0, 0.28)';

/**
 * POL-02-02 : 종료 제어
 * ■ 배경 Overlay 설정
 * - in : popup(AdminPopupDetail) content.useBackgroundOverlay · content.backgroundOverlayOpacity
 * - out: { enabled: boolean; opacity: number } 사용 여부(false로 지정할 때만 끔)와 0~1 불투명도
 * - 팝업 설정을 받아 배경 Overlay 사용 여부와 불투명도를 정리한다. 숫자가 아니면 기본 0.45(PopupPreview와 같은 규칙).
 */
export function previewOverlay(popup: AdminPopupDetail): { enabled: boolean; opacity: number } {
  const fallback = POPUP_DEFAULTS.overlay.backgroundOverlayOpacity;
  const requested = Number(popup.content.backgroundOverlayOpacity ?? fallback);
  return {
    enabled: popup.content.useBackgroundOverlay !== false,
    opacity: Number.isFinite(requested) ? Math.max(0, Math.min(1, requested)) : fallback,
  };
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 실제 크기 미리보기 기준 화면(TODO61-23)
 * - in : 없음(형식 정의)
 * - out: 해상도 프리셋 키
 * - 실제 크기 모달 상단 '기준 화면' 선택박스 값. 팝업 크기 계산에만 쓰고 저장 데이터에는 넣지 않는다.
 *   2026-11-24 '현재 모니터' 항목 삭제: 항상 해상도 프리셋의 가상 데스크톱으로 보여 준다.
 */
export type PreviewScreenKey = (typeof PREVIEW_SCREEN_RESOLUTIONS)[number][0];

/** 해상도 프리셋 [키, 가로, 세로](물리 픽셀, 작은 해상도부터). 소형·노트북, FHD, QHD·울트라와이드, 4K를 비교한다(2026-11-24). */
const PREVIEW_SCREEN_RESOLUTIONS = [
  ['1280x720', 1280, 720], ['1280x1024', 1280, 1024], ['1366x768', 1366, 768], ['1440x900', 1440, 900], ['1600x900', 1600, 900],
  ['1680x1050', 1680, 1050], ['1920x1080', 1920, 1080], ['1920x1200', 1920, 1200], ['2560x1080', 2560, 1080], ['2560x1440', 2560, 1440],
  ['2560x1600', 2560, 1600], ['3440x1440', 3440, 1440], ['3840x2160', 3840, 2160],
] as const;

/**
 * POL-08-01 : 공통 렌더러
 * ■ 기준 화면 해상도 프리셋
 * - resolution: 모니터 표시 해상도(물리 픽셀). 화면 크기·작업 영역은 배율(PREVIEW_SCREEN_SCALES)과 함께 previewScreenPreset이 DIP로 계산한다.
 */
export const PREVIEW_SCREEN_PRESETS: ReadonlyArray<{ key: PreviewScreenKey; resolution: Size }> =
  PREVIEW_SCREEN_RESOLUTIONS.map(([key, width, height]) => ({ key, resolution: { width, height } }));

/** Windows 디스플레이 배율 프리셋(100%·125%·150%·175%). */
export const PREVIEW_SCREEN_SCALES = [1, 1.25, 1.5, 1.75] as const;
/**
 * POL-08-01 : 공통 렌더러
 * ■ 기준 화면 배율
 * - 1 = 100%. WPF 창 크기·작업 영역은 DIP(물리 픽셀 ÷ 배율) 단위라 배율이 크면 같은 해상도에서 쓸 수 있는 화면이 작아진다.
 */
export type PreviewScreenScale = (typeof PREVIEW_SCREEN_SCALES)[number];
/** 가정한 작업 표시줄 높이(DIP). Windows는 배율이 바뀌어도 작업 표시줄을 DIP 기준 같은 높이로 그린다. */
export const PREVIEW_TASKBAR_HEIGHT = 40;

/** WPF PopupWindow.ScreenSafeAreaRatio와 같은 화면 안전 여백(FULLSCREEN 제외 모든 유형·모드 90%, 2026-11-24 통일·2026-11-25 RATIO 포함). popupCommon 값과 같다. */
export const PREVIEW_SCREEN_SAFE_AREA_RATIO = POPUP_SCREEN_SAFE_AREA_RATIO;

/** 화면 정보가 없을 때(SSR 등) 쓰는 작업 영역. 기존 readViewport 대체값과 같다. */
export const FALLBACK_WORK_AREA: Size = { width: 1920, height: 1040 };

const validSize = (width: unknown, height: unknown): Size | null => {
  const w = Number(width), h = Number(height);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? { width: w, height: h } : null;
};

/**
 * POL-08-01 : 공통 렌더러
 * ■ 브라우저 표시 영역(뷰포트)
 * - in : 없음(window.innerWidth/innerHeight)
 * - out: Size 모달을 실제로 그릴 수 있는 브라우저 내부 크기. 읽을 수 없으면 FALLBACK_WORK_AREA
 * - 기준 화면이 브라우저보다 큰 축에 스크롤을 둘지 판단하는 표시 한계다. 팝업 목표 크기 계산에는 쓰지 않는다.
 */
export function readBrowserViewport(): Size {
  if (typeof window === 'undefined') return FALLBACK_WORK_AREA;
  return validSize(window.innerWidth, window.innerHeight) ?? FALLBACK_WORK_AREA;
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 현재 모니터 작업 영역 근사값
 * - in : 없음(window.screen.availWidth/availHeight)
 * - out: Size 현재 모니터에서 작업 표시줄을 뺀 영역(CSS px). 값이 없거나 0 이하면 브라우저 표시 영역, 그것도 없으면 FALLBACK_WORK_AREA
 * - WPF CurrentWorkArea()에 해당하는 값을 브라우저에서 근사한다. 브라우저 F11·창 크기와 무관해 실제 팝업 크기 계산 기준으로 쓴다.
 */
export function readScreenWorkArea(): Size {
  if (typeof window === 'undefined') return FALLBACK_WORK_AREA;
  return validSize(window.screen?.availWidth, window.screen?.availHeight) ?? readBrowserViewport();
}

/** 사용자 모니터와 맞는 프리셋이 없을 때 처음 고르는 기준 화면. */
export const DEFAULT_PREVIEW_SCREEN: PreviewScreenKey = '1920x1080';
/** 사용자 배율과 맞는 프리셋이 없을 때 처음 고르는 배율(100%). */
export const DEFAULT_PREVIEW_SCALE: PreviewScreenScale = 1;

/**
 * POL-08-01 : 공통 렌더러
 * ■ 처음 고를 기준 화면
 * - in : 없음(window.screen.width)
 * - out: PreviewScreenKey 내 모니터 해상도(screen.width·height × devicePixelRatio, 물리 픽셀)와 가로·세로가 같은 프리셋, 없으면 DEFAULT_PREVIEW_SCREEN
 * - 실제 크기 모달을 처음 열 때 사용자 화면과 같은 해상도로 시작한다. 이후 선택은 모달 상태로 유지한다.
 */
export function initialPreviewScreen(): PreviewScreenKey {
  return currentPreviewScreen() ?? DEFAULT_PREVIEW_SCREEN;
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 내 모니터와 같은 해상도 프리셋
 * - in : 없음(window.screen.width·height × devicePixelRatio, 물리 픽셀)
 * - out: PreviewScreenKey | null 가로·세로가 같은 프리셋, 없으면 null
 * - 실제 크기 미리보기 선택박스에서 현재 모니터와 같은 항목에 * 표시를 붙일 때와 처음 선택에 쓴다.
 */
export function currentPreviewScreen(): PreviewScreenKey | null {
  if (typeof window === 'undefined') return null;
  const ratio = Number(window.devicePixelRatio) || 1;
  const width = Math.round(Number(window.screen?.width) * ratio), height = Math.round(Number(window.screen?.height) * ratio);
  return PREVIEW_SCREEN_PRESETS.find((preset) => preset.resolution.width === width && preset.resolution.height === height)?.key ?? null;
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 처음 고를 배율
 * - in : 없음(window.devicePixelRatio)
 * - out: PreviewScreenScale 브라우저 배율(devicePixelRatio)과 같은 프리셋, 없으면 100%
 * - 브라우저 확대율도 devicePixelRatio에 섞이므로 정확히 맞는 프리셋이 없으면 100%로 시작한다.
 */
export function initialPreviewScale(): PreviewScreenScale {
  return currentPreviewScale() ?? DEFAULT_PREVIEW_SCALE;
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 내 모니터와 같은 배율 프리셋
 * - in : 없음(window.devicePixelRatio)
 * - out: PreviewScreenScale | null 같은 배율, 없으면 null(브라우저 확대율이 섞이면 맞는 값이 없을 수 있다)
 */
export function currentPreviewScale(): PreviewScreenScale | null {
  const ratio = typeof window === 'undefined' ? NaN : Number(window.devicePixelRatio);
  return PREVIEW_SCREEN_SCALES.find((scale) => Math.abs(scale - ratio) < 0.01) ?? null;
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 기준 화면 프리셋
 * - in : key(PreviewScreenKey) · scale(PreviewScreenScale, 기본 100%)
 * - out: { resolution 물리 해상도, display 화면 크기(DIP), workArea 작업 영역(DIP) }. 모르는 키는 DEFAULT_PREVIEW_SCREEN
 * - WPF CurrentWorkArea()처럼 DIP로 계산한다: 화면 = 해상도 ÷ 배율(반올림), 작업 영역 = 화면 높이 - 작업 표시줄 40.
 *   예: 1920×1080 @125% → 화면 1536×864, 작업 영역 1536×824. 미리보기는 브라우저 CSS px = DIP로 그린다.
 */
export function previewScreenPreset(key: PreviewScreenKey, scale: PreviewScreenScale = DEFAULT_PREVIEW_SCALE): { resolution: Size; display: Size; workArea: Size } {
  const { resolution } = PREVIEW_SCREEN_PRESETS.find((preset) => preset.key === key)
    ?? PREVIEW_SCREEN_PRESETS.find((preset) => preset.key === DEFAULT_PREVIEW_SCREEN)!;
  const display = { width: Math.round(resolution.width / scale), height: Math.round(resolution.height / scale) };
  return { resolution, display, workArea: { width: display.width, height: display.height - PREVIEW_TASKBAR_HEIGHT } };
}

/**
 * POL-08-01 : 공통 렌더러
 * POL-01-03 : 최소 크기
 * ■ 실제 크기 미리보기 창 크기 계산(목표 크기)
 * - in : popup(AdminPopupDetail) sizeMode·width/height·widthRatio/heightRatio·maximumWidth/maximumHeight · fitWindow(Size | null) PopupPreview가 계산한 IMAGE 권장 창 크기(WPF RecommendedSizeChanged와 같은 값, 이미 작업 영역 90% 이내) · workArea(Size) 작업 영역(현재 모니터 또는 기준 화면 프리셋)
 * - out: Size WPF가 같은 작업 영역에서 만들 창 크기(px, 정수 반올림). 브라우저보다 크면 줄이지 않고 모달 쪽에서 스크롤로 보여 준다(TODO61-23).
 * - WPF PopupWindow.ApplyWindowSize()와 같은 규칙(TODO61-23, 2026-11-24):
 *   FULLSCREEN을 뺀 모든 유형·모드(IMAGE·RATIO 포함)는 min(설정 최대, 작업 영역 90%)이 상한이다(popupWindowBounds).
 *   (2026-11-24 WPF ScreenSafeAreaRatio 통일: FIXED 95% → 90%. 2026-11-25 IMAGE도 설정 최대 적용, RATIO 100% → 90%.)
 *   RATIO 비율은 WPF처럼 0.1~1.0으로 보정한다. 최소 300 x 300(popupMinimumSize)은 하한 → 설정 최대값(하한보다 작으면 하한까지) → 화면 상한 순서이며,
 *   화면 상한이 하한보다 작으면 하한을 상한까지 낮춘다(WPF Math.Min(Requested Minimum, max)).
 *   이전에는 브라우저 내부 크기를 작업 영역으로 보고 비IMAGE에 96%를 적용해, 브라우저 일반 모드(F11 해제)에서 IMAGE 730×900이 730×851로 줄었다.
 */
export function previewDialogSize(popup: AdminPopupDetail, fitWindow: Size | null, workArea: Size): Size {
  const { width: areaWidth, height: areaHeight } = workArea;
  if (fitWindow) return { width: Math.round(fitWindow.width), height: Math.round(fitWindow.height) };
  if (popup.sizeMode === 'FULLSCREEN') return { width: Math.round(areaWidth), height: Math.round(areaHeight) };
  const ratio = (value: unknown) => Math.max(0.1, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 1));
  const requestedWidth = popup.sizeMode === 'RATIO' ? areaWidth * ratio(popup.widthRatio) : (popup.width ?? POPUP_DEFAULTS.window.width);
  const requestedHeight = popup.sizeMode === 'RATIO' ? areaHeight * ratio(popup.heightRatio) : (popup.height ?? POPUP_DEFAULTS.window.height);
  // 설정 최소·최대를 300~작업 영역 90% 사이에서 반영(모든 유형·RATIO 공통, WPF EffectiveMaximumWidth/Height).
  const { minimum, maximum } = popupWindowBounds(popup, workArea);
  const clamp = (value: number, min: number, max: number) => Math.max(Math.min(min, max), Math.min(max, value));
  return { width: Math.round(clamp(requestedWidth, minimum.width, maximum.width)), height: Math.round(clamp(requestedHeight, minimum.height, maximum.height)) };
}
