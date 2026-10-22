import type { AdminPopupDetail } from '@local/domain';
import { popupFontSize, popupMinimumSize } from './popupCommon';
/**
 * POL-04-02 : 모드별 기준
 * POL-04-03 : 비율·상한
 * ■ 크기(가로·세로)
 * - in : width(number) · height(number)
 * - out: 없음(형식 정의)
 * - 이미지·창·작업 영역 크기를 px 단위로 담는다.
 */
export interface Size { width: number; height: number; }
/**
 * POL-04-02 : 모드별 기준
 * POL-04-03 : 비율·상한
 * ■ 이미지 크기 모드 판별
 * - in : popup(AdminPopupDetail) content.imageSizeMode(대소문자·앞뒤 공백 무관)
 * - out: 'ADAPTIVE' | 'FIT_TO_IMAGE' | 'ORIGINAL'
 * - 팝업 설정을 받아 이미지 크기 모드를 정리한다. 비었거나 모르는 값은 ADAPTIVE다.
 */
export function imageSizeMode(popup: AdminPopupDetail): 'ADAPTIVE' | 'FIT_TO_IMAGE' | 'ORIGINAL' {
  const mode = String(popup.content.imageSizeMode ?? '').trim().toUpperCase();
  return mode === 'FIT_TO_IMAGE' || mode === 'ORIGINAL' ? mode : 'ADAPTIVE';
}
function positive(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}
/**
 * POL-04-02 : 모드별 기준
 * POL-04-03 : 비율·상한
 * ■ FIT_TO_IMAGE 이미지 영역 크기 계산
 * - in : popup(AdminPopupDetail) width/height(이미지 영역 지정값) · content.keepAspectRatio · natural(Size) 이미지 원본 크기
 * - out: Size 이미지 콘텐츠 영역 크기(px)
 * - 지정 크기와 원본 크기를 받아 WPF ImagePopupView.ResolveContentArea와 같은 규칙으로 이미지 영역을 정한다.
 *   IMAGE는 popup.width/height 한 쌍만 쓴다. 두 축 지정은 그대로 영역이며, 비율 고정이면 영역 안에 원본 비율로 맞춰(contain) 여백이 생길 수 있다.
 *   한 축만 지정하면 비율 고정 시 원본 비율, 해제 시 원본 길이로 나머지를 채우고, 미지정은 원본 크기다.
 */
export function displayImageSize(popup: AdminPopupDetail, natural: Size): Size {
  const width = positive(popup.width);
  const height = positive(popup.height);
  if (width && height) return { width, height };
  if (popup.content.keepAspectRatio === false)
    return { width: width ?? natural.width, height: height ?? natural.height };
  const ratio = natural.width / natural.height;
  if (width) return { width, height: width / ratio };
  if (height) return { width: height * ratio, height };
  return natural;
}
/**
 * POL-04-02 : 모드별 기준
 * POL-04-03 : 비율·상한
 * ■ FIT_TO_IMAGE 배치 결과
 * - in : image(Size) 이미지 콘텐츠 영역 · window(Size) 권장 창 크기
 * - out: 없음(형식 정의)
 * - fitToImageLayout이 돌려주는 이미지 영역과 창 크기를 담는다.
 */
export interface FitToImageLayout { image: Size; window: Size; }
// 브라우저 글자 측정. 미리보기와 같은 폭·여백·글자 크기로 줄 수를 세어 높이를 낸다(canvas가 없으면 글자 폭을 글꼴 크기 × 0.6으로 추정).
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
// WPF PopupWindow.xaml 기준 창 크롬 치수.
// 외곽 여백 PopupOuterGrid Margin 24, 본문 테두리 PopupBodyBorder 두께 0,
// 콘텐츠 여백 PopupContent Margin 28,24,28,24, HeaderRow 40, FooterRow 80.
// PopupWindow.xaml.cs RefreshImageBounds·ImagePopupView_RecommendedSizeChanged와 같은 합산식이다.
const WINDOW_MARGIN = 24;
const BODY_BORDER = 0;
const CONTENT_MARGIN_X = 28;
const CONTENT_MARGIN_Y = 24;
/**
 * POL-02-01 : 창 구조
 * ■ 팝업 헤더 높이
 * - in : 없음
 * - out: 40(px) WPF HeaderRow 높이
 * - 헤더를 표시할 때 창 높이에 더하는 값을 제공한다.
 */
export const POPUP_HEADER_HEIGHT = 40;
/**
 * POL-02-01 : 창 구조
 * ■ 팝업 푸터 높이
 * - in : 없음
 * - out: 80(px) WPF FooterRow 높이
 * - 푸터를 표시할 때 창 높이에 더하는 값을 제공한다.
 */
export const POPUP_FOOTER_HEIGHT = 80;
/**
 * POL-04-02 : 모드별 기준
 * POL-04-03 : 비율·상한
 * ■ 이미지 팝업 가로 크롬
 * - in : 없음
 * - out: 104(px) WPF horizontal = 28+28+24+24+0
 * - 이미지 외 가로 크롬을 제공한다. 측정 폭 상한과 추천 창 폭이 함께 쓴다.
 */
export const IMAGE_CHROME_WIDTH = CONTENT_MARGIN_X * 2 + WINDOW_MARGIN * 2 + BODY_BORDER * 2;
/**
 * POL-04-02 : 모드별 기준
 * POL-04-03 : 비율·상한
 * ■ 이미지 팝업 세로 크롬
 * - in : 없음
 * - out: 96(px) WPF vertical = 24+24+24+24+0
 * - 헤더·푸터를 뺀 세로 크롬을 제공한다.
 */
export const IMAGE_CHROME_HEIGHT = CONTENT_MARGIN_Y * 2 + WINDOW_MARGIN * 2 + BODY_BORDER * 2;
/** ImagePopupView ImageContainer BorderThickness 1의 좌우·상하 합. */
const IMAGE_FRAME = 2;
/**
 * POL-04-03 : 비율·상한
 * POL-01-03 : 최소 크기
 * ■ FIT_TO_IMAGE 권장 창 크기 계산
 * - in : popup(AdminPopupDetail) 크기 지정·showHeader/showFooter·content.imageTitle·description·showDescription·본문 글자 크기 · natural(Size) 이미지 원본 크기 · workArea(Size) 작업 영역 크기
 * - out: FitToImageLayout | null 이미지 영역과 권장 창 크기, 원본 크기가 0 이하면 null
 * - 이미지 원본 크기와 팝업 설정을 받아 제목·설명·헤더·푸터·크롬을 더한 권장 창 크기를 구한다.
 *   WPF PopupWindow.xaml.cs RefreshImageBounds·ImagePopupView_RecommendedSizeChanged와 같은 합산식이며, 창은 최소 크기와 작업 영역 90% 사이로 맞춘다.
 */
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
    ? Math.min(textHeight(descriptionText, Math.max(1, measureWidth - 34), popupFontSize(popup, 'bodyFontSize') ?? 14, 23) + 34, Math.max(1, Math.min(image.height, maxHeight - chrome) * 0.3)) + 14 : 0;
  const recommended = { width: image.width + IMAGE_FRAME + IMAGE_CHROME_WIDTH, height: image.height + IMAGE_FRAME + (title ? title + 16 : 0) + description + chrome };
  const clamp = (value: number, min: number, max: number) => Math.max(Math.min(min, max), Math.min(max, value));
  // 최소 300 x 300은 이미지 콘텐츠가 아니라 헤더·푸터를 더한 최종 창에 적용한다.
  const minimum = popupMinimumSize(popup);
  return { image, window: {
    width: Math.round(clamp(recommended.width, minimum.width, maxWidth)),
    height: Math.round(clamp(recommended.height, minimum.height, maxHeight)),
  } };
}
