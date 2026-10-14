import type { AdminPopupDetail } from '@local/domain';
export interface Size { width: number; height: number; }
export function imageSizeMode(popup: AdminPopupDetail): 'ADAPTIVE' | 'FIT_TO_IMAGE' | 'ORIGINAL' {
  const mode = String(popup.content.imageSizeMode ?? '').trim().toUpperCase();
  return mode === 'FIT_TO_IMAGE' || mode === 'ORIGINAL' ? mode : 'ADAPTIVE';
}
export function positive(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}
export function displayImageSize(popup: AdminPopupDetail, natural: Size): Size {
  const width = positive(popup.content.width);
  const height = positive(popup.content.height);
  if (popup.content.keepAspectRatio === false)
    return { width: width ?? natural.width, height: height ?? natural.height };
  const ratio = natural.width / natural.height;
  if (width) return { width, height: width / ratio };
  if (height) return { width: height * ratio, height };
  return natural;
}
// ADAPTIVE retains the original no-upscale rule, without a separate image size limit.
export function adaptiveMaximum(_popup: AdminPopupDetail, natural: Size | null): Partial<Size> {
  return natural ?? {};
}
export interface FitToImageLayout { image: Size; window: Size; }
// Browser text measurement uses the same target width, padding and font sizes as the preview.
function textHeight(text: string, width: number, font: number, line: number): number {
  if (!text.trim()) return 0;
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  if (canvas) canvas.font = `${font}px sans-serif`;
  let rows = 1, length = 0;
  for (const char of text) {
    if (char === '\n') { rows++; length = 0; continue; }
    const advance = canvas?.measureText(char).width ?? font * 0.6;
    if (length + advance > width && length > 0) { rows++; length = 0; }
    length += advance;
  }
  return rows * line;
}
// WPF PopupWindow.xaml 기준 창 크롬 치수(설계 25 이후).
// 외곽 여백 PopupOuterGrid Margin 24, 본문 테두리 PopupBodyBorder 두께 0,
// 콘텐츠 여백 PopupContent Margin 28,24,28,24, HeaderRow 40, FooterRow 80.
// PopupWindow.xaml.cs RefreshImageBounds·ImagePopupView_RecommendedSizeChanged와 같은 합산식이다.
const WINDOW_MARGIN = 24;
const BODY_BORDER = 0;
const CONTENT_MARGIN_X = 28;
const CONTENT_MARGIN_Y = 24;
export const POPUP_HEADER_HEIGHT = 40;
export const POPUP_FOOTER_HEIGHT = 80;
/** 이미지 외 가로 크롬(측정 폭 상한과 추천 창 폭이 함께 쓴다). WPF horizontal = 28+28+24+24+0 = 104. */
export const IMAGE_CHROME_WIDTH = CONTENT_MARGIN_X * 2 + WINDOW_MARGIN * 2 + BODY_BORDER * 2;
/** 헤더·푸터를 뺀 세로 크롬. WPF vertical = 24+24+24+24+0 = 96. */
export const IMAGE_CHROME_HEIGHT = CONTENT_MARGIN_Y * 2 + WINDOW_MARGIN * 2 + BODY_BORDER * 2;
/** ImagePopupView ImageContainer BorderThickness 1의 좌우·상하 합. */
const IMAGE_FRAME = 2;
export function fitToImageLayout(popup: AdminPopupDetail, natural: Size, workArea: Size): FitToImageLayout | null {
  if (natural.width <= 0 || natural.height <= 0) return null;
  const image = displayImageSize(popup, natural);
  const maxWidth = workArea.width * 0.90;
  const maxHeight = workArea.height * 0.90;
  const chrome = IMAGE_CHROME_HEIGHT + (popup.showHeader ? POPUP_HEADER_HEIGHT : 0) + (popup.showFooter ? POPUP_FOOTER_HEIGHT : 0);
  const measureWidth = Math.max(1, Math.min(image.width + IMAGE_FRAME, maxWidth - IMAGE_CHROME_WIDTH));
  const title = textHeight(String(popup.content.imageTitle ?? ''), measureWidth, 22, 27);
  const descriptionText = String(popup.content.description ?? '');
  const description = popup.content.showDescription !== false && descriptionText.trim()
    ? Math.min(textHeight(descriptionText, Math.max(1, measureWidth - 34), Number(popup.content.bodyFontSize ?? 14), 23) + 34, Math.max(1, Math.min(image.height, maxHeight - chrome) * 0.3)) + 14 : 0;
  const recommended = { width: image.width + IMAGE_FRAME + IMAGE_CHROME_WIDTH, height: image.height + IMAGE_FRAME + (title ? title + 16 : 0) + description + chrome };
  const clamp = (value: number, min: number, max: number) => Math.max(Math.min(min, max), Math.min(max, value));
  return { image, window: {
    width: Math.round(clamp(recommended.width, popup.minimumWidth, maxWidth)),
    height: Math.round(clamp(recommended.height, popup.minimumHeight, maxHeight)),
  } };
}
