import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview';

/* POL-16-02 : 재현 가능한 검증
 * ■ 관리자 미리보기를 팝업 크기(width×height) 상자에 그려 WPF 캡처와 나란히 비교하는 진입점(2026-11-17).
 * 관리자 화면 테마처럼 body1을 0.85rem으로 둔다(크기 미지정 글자가 상속에 맡겨지면 차이가 드러나도록). */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif', body1: { fontSize: '0.85rem' } } });
const w = window as any;
w.mountParity = (popup: any) => {
  root.render(<ThemeProvider theme={theme}><CssBaseline />
    <div id="frame" style={{ width: popup.width, height: popup.height, display: 'flex' }}>
      <PopupPreview key={popup.popupId} popup={popup} showBackground={false} />
    </div>
  </ThemeProvider>);
};
