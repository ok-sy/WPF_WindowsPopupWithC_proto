/**
 * POL-02-01 : 창 구조
 * POL-08-01 : 공통 렌더러
 * ■ 팝업 공통 레이아웃 수치(TODO61-21)
 * - in : 없음
 * - out: POPUP_LAYOUT(px) · POPUP_COLORS(#RRGGBB)
 * - 관리자 미리보기가 WPF PopupWindow와 같은 창 구조를 그리기 위한 수치·색을 한곳에 둔다. 값은 WPF 선언과 같아야 한다.
 *   WPF 근거: PopupWindow.xaml(HeaderRow 40·FooterRow 최소 64·PopupContent Margin 28,24·FooterArea Margin 28,15·PopupOuterGrid 그림자 여백 24),
 *   PopupStyles.xaml(ActionButtonStyle·SecondaryActionButtonStyle 최소 너비 118·좌우 22·모서리 9, 푸터에서는 높이 34),
 *   SurveyPopupView.xaml.cs(주관식 TextAnswerMinHeight 96·TextAnswerMaxHeight 180).
 *   값이 맞는지는 scripts/verify-popup-parity.cjs(웹·WPF 같은 데이터 실측)로 확인한다.
 */
export const POPUP_LAYOUT = {
  /** 일반 창의 그림자용 바깥 여백(영상 창·FULLSCREEN은 0) */
  windowMargin: 24,
  headerHeight: 40,
  /** 헤더 제목 왼쪽 시작 */
  headerPaddingLeft: 18,
  contentPaddingX: 28,
  contentPaddingY: 24,
  /** 푸터 최소 높이(줄바꿈되면 위로 늘어난다) */
  footerHeight: 64,
  footerPaddingX: 28,
  footerPaddingY: 15,
  /** 푸터 왼쪽 묶음(나중에 보기 → 안내·체크박스) 사이 간격. WPF FooterLaterButton·안내 StackPanel Margin 오른쪽 16 */
  footerGroupGap: 16,
  /** 푸터 오른쪽 버튼 사이 간격. WPF FooterAuxCloseButton Margin 오른쪽 10 */
  footerButtonGap: 10,
  button: { height: 34, minWidth: 118, submitMinWidth: 132, paddingX: 22, radius: 9 },
  /**
   * 설문·퀴즈 주관식 입력칸 높이. 최소에서 시작해 내용에 맞춰 커지고 최대를 넘으면 칸 안에서 스크롤한다(끌어서 늘이지 않음, 2026-11-25).
   * WPF SurveyPopupView.TextAnswerMinHeight·TextAnswerMaxHeight와 같은 값(verify-popup-guide-registry가 대조).
   */
  textAnswer: { minHeight: 96, maxHeight: 180 },
} as const;

/** WPF PopupStyles.xaml 버튼·글자 색과 같은 공통 색(설문 영역 색은 SurveyPreview의 surveyColors). */
export const POPUP_COLORS = {
  primary: '#111827',
  primaryHover: '#1F2937',
  primaryPressed: '#374151',
  secondary: '#F3F4F6',
  secondaryHover: '#E5E7EB',
  border: '#D1D5DB',
  focus: '#6B7280',
  disabledBackground: '#E5E7EB',
  disabledText: '#9CA3AF',
  /** IMAGE·VIDEO 설명(WPF DescriptionTextBlock) */
  description: '#4B5563',
} as const;
