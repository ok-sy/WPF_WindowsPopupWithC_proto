import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupListSample from '../zero-rule-web/main/src/features/PopupcommonComponent/sample/PopupListSample';

/* [TODO69] 공통 컴포넌트 목록 기반 샘플 페이지를 서버·라우터 없이 띄우는 검증 진입점. */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
root.render(<ThemeProvider theme={theme}><CssBaseline /><PopupListSample /></ThemeProvider>);
