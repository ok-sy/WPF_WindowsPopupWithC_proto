import type { AdminPopupDetail } from '@local/domain';
import type { Size } from './imagePreviewLayout';

/* [설계 31] WPF PopupWindow.ApplyPosition과 같은 9개 위치. 작업 영역(미리보기에서는 브라우저 창) 가장자리에 붙이고,
 * 모르는 값은 WPF PopupFactory와 같이 중앙으로 본다. 반환값은 [가로, 세로] flex 정렬값이다. */
const PREVIEW_POSITION_ALIGN: Record<string, [string, string]> = {
  TOP_LEFT: ['flex-start', 'flex-start'], TOP_CENTER: ['center', 'flex-start'], TOP_RIGHT: ['flex-end', 'flex-start'],
  CENTER_LEFT: ['flex-start', 'center'], CENTER: ['center', 'center'], CENTER_RIGHT: ['flex-end', 'center'],
  BOTTOM_LEFT: ['flex-start', 'flex-end'], BOTTOM_CENTER: ['center', 'flex-end'], BOTTOM_RIGHT: ['flex-end', 'flex-end'],
};

export function previewPositionAlign(popup: AdminPopupDetail): [string, string] {
  const position = popup.content.popupPosition == null ? '' : String(popup.content.popupPosition).toUpperCase();
  return PREVIEW_POSITION_ALIGN[position] ?? PREVIEW_POSITION_ALIGN.CENTER;
}

/* WPF 일반 창은 그림자용 투명 여백 24px(PopupOuterGrid.Margin)이 있어 본문이 가장자리에서 24px 떨어지고, 영상 창은 여백이 없다. */
export function previewEdgeMargin(popup: AdminPopupDetail): number {
  const hasVideo = popup.popupType === 'VIDEO' || (popup.popupType === 'QUIZ' && popup.content.videoEnabled === true);
  return hasVideo ? 0 : 24;
}

/** 배경 Overlay 사용 여부와 0~1 불투명도. 숫자가 아니면 기본 0.45(PopupPreview와 같은 규칙). */
export function previewOverlay(popup: AdminPopupDetail): { enabled: boolean; opacity: number } {
  const requested = Number(popup.content.backgroundOverlayOpacity ?? 0.45);
  return {
    enabled: popup.content.useBackgroundOverlay !== false,
    opacity: Number.isFinite(requested) ? Math.max(0, Math.min(1, requested)) : 0.45,
  };
}

/**
 * 실제 크기 미리보기 창 크기. fitWindow는 PopupPreview가 계산한 IMAGE 권장 창 크기(WPF RecommendedSizeChanged와 같은 값)다.
 * IMAGE는 고정 최대 픽셀값 대신 화면 작업 영역 90%로 창 크기를 제한한다.
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
  if (popup.popupType === 'IMAGE' && popup.sizeMode !== 'FULLSCREEN') {
    const maximumWidth = availableWidth * .90, maximumHeight = availableHeight * .90;
    return {width: Math.round(Math.max(Math.min(popup.minimumWidth, maximumWidth), Math.min(maximumWidth, requestedWidth))),
      height: Math.round(Math.max(Math.min(popup.minimumHeight, maximumHeight), Math.min(maximumHeight, requestedHeight)))};
  }
  const width = popup.sizeMode === 'FULLSCREEN' ? requestedWidth : Math.max(popup.minimumWidth, Math.min(popup.maximumWidth, requestedWidth));
  const height = popup.sizeMode === 'FULLSCREEN' ? requestedHeight : Math.max(popup.minimumHeight, Math.min(popup.maximumHeight, requestedHeight));
  return { width: Math.round(Math.max(320, Math.min(availableWidth * 0.96, width))), height: Math.round(Math.max(260, Math.min(availableHeight * 0.96, height))) };
}
