import { POPUP_MIN_WINDOW_SIZE } from './popupCommon';

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
 * - [실연동] 나중에 기본값을 서버(공통코드 등)가 정하면 이 값을 조회 결과로 바꾼다. 호출부는 이 파일만 읽으므로 고치지 않는다.
 * - [옵션] 값을 바꿀 때는 서버·WPF 기본값과 문서(인터페이스 계약·옵션 가이드)를 함께 맞춘다.
 */
export const POPUP_DEFAULTS = {
  /** 창 크기. FIXED 560×420, RATIO 0.7×0.75, 최소 300×300, 최대 1200×900. */
  window: {
    sizeMode: 'FIXED',
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
} as const;
