import type { AdminPopupDetail, PopupDateValue, PopupType } from '@local/domain';

/** 팝업 유형 표시 이름(목록·편집기·템플릿 불러오기 공용). 선언 순서가 선택 목록 순서다. */
export const POPUP_TYPE_LABELS: Record<PopupType, string> = {
  TEXT: '텍스트',
  IMAGE: '이미지',
  VIDEO: '영상',
  SURVEY: '설문',
  QUIZ: '퀴즈',
};

/** 서버 일시(ISO 문자열 또는 epoch 초·밀리초)를 epoch 밀리초로 바꾼다. 해석할 수 없으면 NaN. */
export function popupDateMillis(value: PopupDateValue): number {
  return new Date(typeof value === 'number' && value < 1_000_000_000_000 ? value * 1000 : value).getTime();
}

/* [설계 14 §5.7] 폰트 크기 범위(px). 서버 PopupService.validateFontSizeOptions·WPF PopupOptions.FontSizeMin/Max와 같다. */
export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 40;
export type PopupFontSizeKey = 'headerFontSize' | 'bodyFontSize' | 'footerFontSize';

/** content의 폰트 크기 값을 10~40으로 보정해 읽는다. 없거나 숫자가 아니면 null(기본 크기). */
export function popupFontSize(popup: AdminPopupDetail, key: PopupFontSizeKey): number | null {
  const value = popup.content[key];
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, number)) : null;
}
