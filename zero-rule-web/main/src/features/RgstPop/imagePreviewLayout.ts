import type { AdminPopupDetail } from '@local/domain';

/*
 * [설계 18 L-5 — W-10] 관리자 미리보기용 IMAGE 배치·크기 계산.
 * WPF ImagePopupView(설계 15)와 PopupWindow.ImagePopupView_RecommendedSizeChanged의 규칙과 상수를 그대로 옮긴다.
 * 브라우저 창 크기를 WPF 작업 영역(WorkArea) 대신 쓴다.
 */

export type DescriptionPlacement = 'RIGHT' | 'BOTTOM';
export interface Size { width: number; height: number; }

/** FIT_TO_IMAGE에서 오른쪽 설명 열의 고정 너비(WPF 260). */
export const IMAGE_DESCRIPTION_WIDTH = 260;
/** 이미지 컨테이너 바깥 좌우 공간 56 + 컨테이너 Border 1×2. */
const HORIZONTAL_CHROME = 56 + 2;
/** 이미지 컨테이너 바깥 상하 공간(설명이 오른쪽이거나 없으면 190, 아래면 300) + Border 1×2. */
const VERTICAL_CHROME_SIDE = 190 + 2;
const VERTICAL_CHROME_BELOW = 300 + 2;
const MIN_WINDOW: Size = { width: 280, height: 300 };

export const IMAGE_DESCRIPTION_POSITIONS = ['AUTO', 'RIGHT', 'BOTTOM'] as const;

export function imageSizeMode(popup: AdminPopupDetail): 'ADAPTIVE' | 'FIT_TO_IMAGE' | 'FILL' {
  const mode = String(popup.content.imageSizeMode ?? '').trim().toUpperCase();
  return mode === 'FIT_TO_IMAGE' || mode === 'FILL' ? mode : 'ADAPTIVE';
}

/** WPF와 같이 0.5~0.9 밖이거나 숫자가 아니면 0.75. */
export function imageAreaRatio(popup: AdminPopupDetail): number {
  const ratio = Number(popup.content.imageAreaRatio);
  return Number.isFinite(ratio) && ratio >= 0.5 && ratio <= 0.9 ? ratio : 0.75;
}

/** 명시값(RIGHT/BOTTOM)은 그대로, AUTO는 이미지 가로/세로 비율 0.8 이하면 RIGHT. 크기를 모르면 BOTTOM. */
export function descriptionPlacement(popup: AdminPopupDetail, natural: Size | null): DescriptionPlacement {
  const value = String(popup.content.descriptionPosition ?? 'AUTO').trim().toUpperCase();
  if (value === 'RIGHT' || value === 'BOTTOM') return value;
  return natural && natural.height > 0 && natural.width / natural.height <= 0.8 ? 'RIGHT' : 'BOTTOM';
}

function positive(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

/** ADAPTIVE의 이미지 최대 표시 크기: 원본과 요청 크기 중 작은 값(원본보다 확대하지 않음). */
export function adaptiveMaximum(popup: AdminPopupDetail, natural: Size | null): Partial<Size> {
  const pick = (original: number | undefined, requested: number | null) =>
    original && requested ? Math.min(original, requested) : (original ?? requested ?? undefined);
  return {
    width: pick(natural?.width, positive(popup.content.imageWidth)),
    height: pick(natural?.height, positive(popup.content.imageHeight)),
  };
}

export interface FitToImageLayout { image: Size; descriptionWidth: number; window: Size; }

/**
 * FIT_TO_IMAGE: 요청 크기(둘 다 있으면 그대로, 하나면 원본 비율로 나머지 계산, 없으면 원본)를
 * 작업 영역 90% 안으로 줄이고, 그 크기로 팝업 창 크기를 다시 계산한다.
 * 창 크기는 WPF PopupWindow와 같이 팝업 최소·최대와 작업 영역 95%로 보정한다(FULLSCREEN은 호출하지 않음).
 */
export function fitToImageLayout(popup: AdminPopupDetail, natural: Size, workArea: Size): FitToImageLayout | null {
  if (natural.width <= 0 || natural.height <= 0) return null;
  const ratio = natural.width / natural.height;
  const showDescription = popup.content.showDescription !== false;
  const right = showDescription && descriptionPlacement(popup, natural) === 'RIGHT';
  const descriptionWidth = right ? IMAGE_DESCRIPTION_WIDTH : 0;
  const verticalChrome = right || !showDescription ? VERTICAL_CHROME_SIDE : VERTICAL_CHROME_BELOW;

  const requestedWidth = positive(popup.content.imageWidth);
  const requestedHeight = positive(popup.content.imageHeight);
  let width = natural.width;
  let height = natural.height;
  if (requestedWidth && requestedHeight) { width = requestedWidth; height = requestedHeight; }
  else if (requestedWidth) { width = requestedWidth; height = requestedWidth / ratio; }
  else if (requestedHeight) { height = requestedHeight; width = requestedHeight * ratio; }

  const maxImageWidth = Math.max(100, workArea.width * 0.9 - HORIZONTAL_CHROME - descriptionWidth);
  const maxImageHeight = Math.max(100, workArea.height * 0.9 - verticalChrome);
  const scale = Math.min(1, maxImageWidth / width, maxImageHeight / height);
  const image = { width: width * scale, height: height * scale };

  const recommended = {
    width: Math.max(MIN_WINDOW.width, image.width + descriptionWidth + HORIZONTAL_CHROME),
    height: Math.max(MIN_WINDOW.height, image.height + verticalChrome),
  };
  const maxWidth = Math.min(popup.maximumWidth, workArea.width * 0.95);
  const maxHeight = Math.min(popup.maximumHeight, workArea.height * 0.95);
  const clamp = (value: number, min: number, max: number) => Math.max(Math.min(min, max), Math.min(max, value));
  return {
    image,
    descriptionWidth,
    window: {
      width: Math.round(clamp(recommended.width, popup.minimumWidth, maxWidth)),
      height: Math.round(clamp(recommended.height, popup.minimumHeight, maxHeight)),
    },
  };
}
