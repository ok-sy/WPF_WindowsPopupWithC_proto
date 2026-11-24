import type { AdminPopupDetail } from '@local/domain';
import type { Size } from './imagePreviewLayout';
import { popupMinimumSize } from './popupCommon';
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

/**
 * POL-08-01 : 공통 렌더러
 * ■ 창 안쪽 그림자 여백
 * - in : popup(AdminPopupDetail) popupType · sizeMode · content.videoEnabled
 * - out: number 여백(px) — 영상 창(VIDEO, 영상 사용 QUIZ)·FULLSCREEN 0, 그 밖 24
 * - WPF 일반 창은 창 크기 안에 그림자용 투명 여백 24px(PopupOuterGrid.Margin)을 두고 그 안에 흰 판을 그린다(흰 판 = 창 - 48).
 *   영상 창(ApplyVideoWindowSurface)·FULLSCREEN은 여백이 없다. 미리보기(PopupPreview)도 창 크기 안에 같은 여백을 두고 그 안에 그림자를 그린다
 *   (2026-11-17, 이전에는 IMAGE에만 적용돼 TEXT·SURVEY·QUIZ 흰 판이 WPF보다 48px 컸음).
 */
export function previewShadowMargin(popup: AdminPopupDetail): number {
  const hasVideo = popup.popupType === 'VIDEO' || (popup.popupType === 'QUIZ' && popup.content.videoEnabled === true);
  return hasVideo || popup.sizeMode === 'FULLSCREEN' ? 0 : POPUP_LAYOUT.windowMargin;
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
  const requested = Number(popup.content.backgroundOverlayOpacity ?? 0.45);
  return {
    enabled: popup.content.useBackgroundOverlay !== false,
    opacity: Number.isFinite(requested) ? Math.max(0, Math.min(1, requested)) : 0.45,
  };
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 실제 크기 미리보기 기준 화면(TODO61-23)
 * - in : 없음(형식 정의)
 * - out: 'CURRENT'(현재 모니터) | 해상도 프리셋 키
 * - 실제 크기 모달 상단 '기준 화면' 선택박스 값. 팝업 크기 계산에만 쓰고 저장 데이터에는 넣지 않는다.
 */
export type PreviewScreenKey = 'CURRENT' | '1920x1080' | '2560x1440';

/**
 * POL-08-01 : 공통 렌더러
 * ■ 기준 화면 프리셋
 * - display: 표시 해상도, workArea: 크기 계산에 쓰는 가상 작업 영역(Windows 배율 100%, 작업 표시줄 높이 40 가정 검증값).
 *   WPF CurrentWorkArea()(모니터 WorkingArea, DIP)에 대응한다. 브라우저 CSS px = WPF DIP(배율 100%) 기준이다.
 */
export const PREVIEW_SCREEN_PRESETS: ReadonlyArray<{ key: Exclude<PreviewScreenKey, 'CURRENT'>; display: Size; workArea: Size }> = [
  { key: '1920x1080', display: { width: 1920, height: 1080 }, workArea: { width: 1920, height: 1040 } },
  { key: '2560x1440', display: { width: 2560, height: 1440 }, workArea: { width: 2560, height: 1400 } },
];

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
 * - 배경 Overlay가 덮는 영역이자 1:1 표시 가능 여부를 판단하는 표시 한계다. 팝업 목표 크기 계산에는 쓰지 않는다.
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

/**
 * POL-08-01 : 공통 렌더러
 * ■ 선택한 기준 화면의 작업 영역
 * - in : key(PreviewScreenKey) · current(Size) 현재 모니터 작업 영역(readScreenWorkArea 결과)
 * - out: Size 크기 계산에 쓸 작업 영역. 모르는 키는 현재 모니터
 */
export function previewWorkArea(key: PreviewScreenKey, current: Size): Size {
  return PREVIEW_SCREEN_PRESETS.find((preset) => preset.key === key)?.workArea ?? current;
}

/**
 * POL-08-01 : 공통 렌더러
 * POL-01-03 : 최소 크기
 * ■ 실제 크기 미리보기 창 크기 계산(목표 크기)
 * - in : popup(AdminPopupDetail) sizeMode·width/height·widthRatio/heightRatio·maximumWidth/maximumHeight · fitWindow(Size | null) PopupPreview가 계산한 IMAGE 권장 창 크기(WPF RecommendedSizeChanged와 같은 값, 이미 작업 영역 90% 이내) · workArea(Size) 작업 영역(현재 모니터 또는 기준 화면 프리셋)
 * - out: Size WPF가 같은 작업 영역에서 만들 창 크기(px, 정수 반올림). 브라우저 표시 한계는 previewDisplaySize가 따로 적용한다.
 * - WPF PopupWindow.ApplyWindowSize()와 같은 규칙(TODO61-23, 2026-11-24):
 *   IMAGE(FULLSCREEN 제외)는 설정 최대값 대신 작업 영역 90%. 비IMAGE FIXED는 min(설정 최대, 작업 영역 95%), RATIO는 min(설정 최대, 작업 영역 100%).
 *   RATIO 비율은 WPF처럼 0.1~1.0으로 보정한다. 최소 300 x 300(popupMinimumSize)은 하한 → 설정 최대값(하한보다 작으면 하한까지) → 화면 상한 순서이며,
 *   화면 상한이 하한보다 작으면 하한을 상한까지 낮춘다(WPF Math.Min(Requested Minimum, max)).
 *   이전에는 브라우저 내부 크기를 작업 영역으로 보고 비IMAGE에 96%를 적용해, 브라우저 일반 모드(F11 해제)에서 IMAGE 730×900이 730×851로 줄었다.
 */
export function previewDialogSize(popup: AdminPopupDetail, fitWindow: Size | null, workArea: Size): Size {
  const { width: areaWidth, height: areaHeight } = workArea;
  if (fitWindow) return { width: Math.round(fitWindow.width), height: Math.round(fitWindow.height) };
  if (popup.sizeMode === 'FULLSCREEN') return { width: Math.round(areaWidth), height: Math.round(areaHeight) };
  const ratio = (value: unknown) => Math.max(0.1, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 1));
  const requestedWidth = popup.sizeMode === 'RATIO' ? areaWidth * ratio(popup.widthRatio) : (popup.width ?? 560);
  const requestedHeight = popup.sizeMode === 'RATIO' ? areaHeight * ratio(popup.heightRatio) : (popup.height ?? 420);
  const minimum = popupMinimumSize(popup);
  const image = popup.popupType === 'IMAGE';
  const screenRatio = image ? 0.90 : popup.sizeMode === 'RATIO' ? 1.0 : 0.95;
  const maximumWidth = image ? areaWidth * screenRatio : Math.min(Math.max(popup.maximumWidth, minimum.width), areaWidth * screenRatio);
  const maximumHeight = image ? areaHeight * screenRatio : Math.min(Math.max(popup.maximumHeight, minimum.height), areaHeight * screenRatio);
  const clamp = (value: number, min: number, max: number) => Math.max(Math.min(min, max), Math.min(max, value));
  return { width: Math.round(clamp(requestedWidth, minimum.width, maximumWidth)), height: Math.round(clamp(requestedHeight, minimum.height, maximumHeight)) };
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 브라우저에 그릴 모달 크기
 * - in : target(Size) previewDialogSize 목표 크기 · viewport(Size) 브라우저 표시 영역
 * - out: { size: Size 실제로 그릴 크기, actualSize: boolean 목표 크기 그대로(1:1)인지 }
 * - 목표 크기가 브라우저 표시 영역에 들어가면 그대로 그린다. 넘치는 축만 표시 영역까지 줄이고(기존 모달 제한 방식, TODO61-23 결정 A)
 *   actualSize=false로 1:1 표시가 아님을 알린다. 바깥 스크롤은 만들지 않는다.
 */
export function previewDisplaySize(target: Size, viewport: Size): { size: Size; actualSize: boolean } {
  const size = { width: Math.min(target.width, Math.floor(viewport.width)), height: Math.min(target.height, Math.floor(viewport.height)) };
  return { size, actualSize: size.width === target.width && size.height === target.height };
}
