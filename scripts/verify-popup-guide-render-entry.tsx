import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupCommonGuide from '../zero-rule-web/main/src/features/PopupcommonComponent/guide/PopupCommonGuide';

/* POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 화면을 서버·라우터·로그인 없이 띄우는 검증 진입점. */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
root.render(<ThemeProvider theme={theme}><CssBaseline /><div style={{ height: '100vh' }}><PopupCommonGuide /></div></ThemeProvider>);
