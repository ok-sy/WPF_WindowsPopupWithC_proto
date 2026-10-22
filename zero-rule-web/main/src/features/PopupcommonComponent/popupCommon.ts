import type { AdminPopupDetail, PopupDateValue, PopupType } from '@local/domain';

/**
 * POL-07-01 : 부모의 데이터 소유
 * ■ 팝업 유형 표시 이름
 * - in : 없음
 * - out: Record<PopupType, string> 유형별 한국어 이름
 * - 목록·편집기·템플릿 불러오기에서 함께 쓰는 유형 이름이다. 선언 순서가 선택 목록 순서다.
 */
export const POPUP_TYPE_LABELS: Record<PopupType, string> = {
  TEXT: '텍스트',
  IMAGE: '이미지',
  VIDEO: '영상',
  SURVEY: '설문',
  QUIZ: '퀴즈',
};

/**
 * POL-11-03 : 시간 경계
 * ■ 서버 일시 → epoch 밀리초
 * - in : value(PopupDateValue) ISO 문자열 또는 epoch 초·밀리초
 * - out: number epoch 밀리초. 해석할 수 없으면 NaN
 * - 서버 일시를 받아 형식(문자열·초·밀리초)에 관계없이 epoch 밀리초로 바꾼다.
 */
export function popupDateMillis(value: PopupDateValue): number {
  return new Date(typeof value === 'number' && value < 1_000_000_000_000 ? value * 1000 : value).getTime();
}

/**
 * POL-01-01 : 공통 옵션의 위치
 * ■ 폰트 크기 범위(px)
 * - in : 없음
 * - out: FONT_SIZE_MIN(10) · FONT_SIZE_MAX(40) · PopupFontSizeKey(폰트 크기 content 키)
 * - Header/본문/Footer 폰트 크기의 허용 범위다. 서버 PopupService.validateFontSizeOptions·WPF PopupOptions.FontSizeMin/Max와 같다.
 */
export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 40;
export type PopupFontSizeKey = 'headerFontSize' | 'bodyFontSize' | 'footerFontSize';

/**
 * POL-01-01 : 공통 옵션의 위치
 * ■ 폰트 크기 읽기
 * - in : popup(AdminPopupDetail) 편집값 · key(PopupFontSizeKey) 폰트 크기 키
 * - out: number | null 10~40으로 보정한 크기. 없거나 숫자가 아니면 null(기본 크기)
 * - 편집값과 키를 받아 content의 폰트 크기를 허용 범위로 보정해 읽는다.
 */
export function popupFontSize(popup: AdminPopupDetail, key: PopupFontSizeKey): number | null {
  const value = popup.content[key];
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, number)) : null;
}

/**
 * POL-01-03 : 최소 크기
 * ■ 팝업 창 최소 크기(px)
 * - in : 없음
 * - out: number 300
 * - 팝업 창 너비·높이의 하한이다. 서버 PopupService.POPUP_MIN_WINDOW_SIZE·WPF PopupOptions.MinWindowSize와 같다.
 * 관리자 미리보기는 CSS px, WPF는 논리 단위(DIP) 기준이라 DPI 배율에 따라 실제 물리 픽셀 수는 다를 수 있다. */
export const POPUP_MIN_WINDOW_SIZE = 300;

/**
 * POL-01-03 : 최소 크기
 * ■ 창 최소 크기 계산
 * - in : popup(minimumWidth·minimumHeight) 저장된 최소 크기
 * - out: { width, height } 300 하한을 적용한 최소 크기
 * - 저장된 최소 크기를 받아 300 하한을 적용한다(기존 저장 데이터 방어, WPF RequestedMinimumWidth/Height와 같다).
 */
export function popupMinimumSize(popup: Pick<AdminPopupDetail, 'minimumWidth' | 'minimumHeight'>): { width: number; height: number } {
  const floor = (value: number) => Math.max(POPUP_MIN_WINDOW_SIZE, Number.isFinite(value) ? value : 0);
  return { width: floor(popup.minimumWidth), height: floor(popup.minimumHeight) };
}
