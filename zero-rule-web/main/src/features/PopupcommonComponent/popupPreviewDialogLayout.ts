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
 * POL-01-03 : 최소 크기
 * ■ 실제 크기 미리보기 창 크기 계산
 * - in : popup(AdminPopupDetail) sizeMode·width/height·widthRatio/heightRatio·maximumWidth/maximumHeight · fitWindow(Size | null) PopupPreview가 계산한 IMAGE 권장 창 크기(WPF RecommendedSizeChanged와 같은 값) · available(Size) 작업 영역(브라우저 창) 크기
 * - out: Size 모달 Paper에 쓸 창 크기(px, 정수 반올림)
 * - 팝업 크기 설정과 작업 영역을 받아 실제 크기 미리보기 창 크기를 정한다.
 *   fitWindow가 있으면 그 값을 작업 영역 96% 안으로만 줄인다. IMAGE는 고정 최대 픽셀값 대신 작업 영역 90%로 제한한다.
 *   최소 300 x 300(popupMinimumSize)은 WPF와 같은 순서로 적용한다: 하한 → 설정 최대값(하한보다 작으면 하한까지) → 화면 상한.
 */
export function previewDialogSize(popup: AdminPopupDetail, fitWindow: Size | null, available: Size): Size {
  const { width: availableWidth, height: availableHeight } = available;
  if (fitWindow) {
    return { width: Math.round(Math.min(availableWidth * 0.96, fitWindow.width)), height: Math.round(Math.min(availableHeight * 0.96, fitWindow.height)) };
  }
  const requestedWidth = popup.sizeMode === 'FULLSCREEN' ? availableWidth
    : popup.sizeMode === 'RATIO' ? availableWidth * popup.widthRatio : (popup.width ?? 560);
  const requestedHeight = popup.sizeMode === 'FULLSCREEN' ? availableHeight
    : popup.sizeMode === 'RATIO' ? availableHeight * popup.heightRatio : (popup.height ?? 420);
  const minimum = popupMinimumSize(popup);
  if (popup.popupType === 'IMAGE' && popup.sizeMode !== 'FULLSCREEN') {
    const maximumWidth = availableWidth * .90, maximumHeight = availableHeight * .90;
    return {width: Math.round(Math.max(Math.min(minimum.width, maximumWidth), Math.min(maximumWidth, requestedWidth))),
      height: Math.round(Math.max(Math.min(minimum.height, maximumHeight), Math.min(maximumHeight, requestedHeight)))};
  }
  const maximumWidth = Math.max(popup.maximumWidth, minimum.width), maximumHeight = Math.max(popup.maximumHeight, minimum.height);
  const width = popup.sizeMode === 'FULLSCREEN' ? requestedWidth : Math.max(minimum.width, Math.min(maximumWidth, requestedWidth));
  const height = popup.sizeMode === 'FULLSCREEN' ? requestedHeight : Math.max(minimum.height, Math.min(maximumHeight, requestedHeight));
  return { width: Math.round(Math.min(availableWidth * 0.96, width)), height: Math.round(Math.min(availableHeight * 0.96, height)) };
}
