import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useState } from 'react';
import BbsCKEditor from '../zero-rule-web/main/src/components/BbsCKEditor';

/* POL-14-01 : 공통 프론트 경계
 * ■ 게시판·자료실 편집기(BbsCKEditor)를 서버·로그인 없이 띄우는 검증 진입점. onContentChange 값은 화면과 window.__content에 남긴다. */
function Host() {
  const [content, setContent] = useState('<p>원본 본문</p>');
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ height: 420, display: 'flex' }}>
        <BbsCKEditor sx={{ flex: 1 }} content="<p>원본 본문</p>" onEditorReady={(editor) => { (window as any).__editor = editor; }}
          onContentChange={(value) => { (window as any).__content = value; setContent(value ?? ''); }} />
      </Box>
      <pre data-testid="content">{content}</pre>
    </Box>
  );
}
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
createRoot(document.getElementById('root')!).render(<ThemeProvider theme={theme}><CssBaseline /><Host /></ThemeProvider>);
