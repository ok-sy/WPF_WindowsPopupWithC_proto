import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupPreview from '../zero-rule-web/main/src/features/RgstPop/PopupPreview';
import {displayImageSize, fitToImageLayout} from '../zero-rule-web/main/src/features/RgstPop/imagePreviewLayout';
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'}});
(window as any).scenario = (mode = 'FIT_TO_IMAGE', locked = true, width: number | null = 900, height: number | null = 300, description = '', minimumWidth = 100, maximumWidth = 400, footer = false, naturalWidth = 800, naturalHeight = 400) => {
  const source = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${naturalWidth}" height="${naturalHeight}"><rect width="${naturalWidth/2}" height="${naturalHeight}" fill="#0090ff"/><rect x="${naturalWidth/2}" width="${naturalWidth/2}" height="${naturalHeight}" fill="#ff5070"/></svg>`);
  const popup = {popupId: 'IMAGE', popupType: 'IMAGE', title: 'IMAGE', sizeMode: 'FIXED',
    widthRatio: .7, heightRatio: .75, minimumWidth, minimumHeight: 100, maximumWidth, maximumHeight: 600,
    showHeader: false, showCloseButton: true, showFooter: footer, showDoNotShowAgain: true, questions: [],
    content: {imageSizeMode: mode, imageUrl: source, imageTitle: '', description, showDescription: true,
      width, height, ...(mode === 'FIT_TO_IMAGE' ? {keepAspectRatio: locked} : {})}} as any;
  const natural = {width: naturalWidth, height: naturalHeight};
  (window as any).layoutForScreen = (screenWidth: number, screenHeight: number) => fitToImageLayout(popup, natural, {width: screenWidth, height: screenHeight});
  const layout = fitToImageLayout(popup, natural, {width: 1000, height: 900})!;
  const size = mode === 'FIT_TO_IMAGE' ? layout.window : {width: Number(width ?? 560), height: Number(height ?? 420)};
  (window as any).imageState = {popup, layout, display: displayImageSize(popup, natural)};
  root.render(<ThemeProvider theme={theme}><CssBaseline/><div style={{width: size.width, height: size.height}}>
    <PopupPreview key={JSON.stringify(popup.content) + minimumWidth + maximumWidth + footer} popup={popup} fitContainer showBackground={false}/>
  </div></ThemeProvider>);
};
(window as any).scenario();
