/**
 * 메인 레이아웃의 설정 정보
 * 여러 컴포넌트에서 이 값을 사용함
 */
export const mainLayoutConstants = {
  /**
   * 상단 Appbar 높이
   * 이건 하드코딩해도 되나 모르겠다
   */
  appbarHeight: 64,

  sidemenu: {
    /**
     * 왼쪽 메뉴 너비
     */
    openWidth: 300,
    closeWidth: 45,

    /**
     * 왼쪽 메뉴 배경색
     */
    bgColor: '#242425',
    sectionSelectColor: '#00f3e4',

    fgColor: '#fff',

    /**
     * 왼쪽 구분선 색
     */
    dividerColor: '#FFF',

    /**
     * 왼쪽메뉴 글자 크기
     */
    fontSize: '0.9rem',
  },

  content: {
    /**
     * 레이아웃 컨텐트 배경색
     */
    bgColor: '#F8F9FC',

    /**
     * 레이아웃 컨텐트 아래쪽 패딩
     */
    defaultPaddingBottom: 80,
  },
};
