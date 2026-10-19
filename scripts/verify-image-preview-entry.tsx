import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupPreview from '../zero-rule-web/main/src/features/RgstPop/PopupPreview';
import {displayImageSize, fitToImageLayout} from '../zero-rule-web/main/src/features/RgstPop/imagePreviewLayout';
// WPF PopupWindow 크롬 수치 검증용: 헤더·푸터 표시 여부만 바꾼 FIT_TO_IMAGE 레이아웃을 돌려준다.
(window as any).chromeLayout = (showHeader: boolean, showFooter: boolean, naturalWidth = 400, naturalHeight = 200, screenWidth = 1000, screenHeight = 900) =>
  fitToImageLayout({popupId: 'C', popupType: 'IMAGE', title: 'C', sizeMode: 'FIXED', widthRatio: .7, heightRatio: .75,
    minimumWidth: 1, minimumHeight: 1, maximumWidth: 9999, maximumHeight: 9999, showHeader, showCloseButton: true, showFooter,
    showDoNotShowAgain: false, questions: [], content: {imageSizeMode: 'FIT_TO_IMAGE', imageTitle: '', description: '', keepAspectRatio: true}} as any,
    {width: naturalWidth, height: naturalHeight}, {width: screenWidth, height: screenHeight});
(window as any).renderChrome = (popupType: string) => {
  const popup = {popupId: 'H', popupType, title: '헤더', sizeMode: 'FIXED', width: 560, height: 420, widthRatio: .7, heightRatio: .75,
    minimumWidth: 100, minimumHeight: 100, maximumWidth: 1600, maximumHeight: 900, showHeader: true, showCloseButton: true, showFooter: true,
    showDoNotShowAgain: true, questions: [], content: popupType === 'IMAGE' ? {imageSizeMode: 'ADAPTIVE', imageUrl: ''} : {plainText: '본문'}} as any;
  root.render(<ThemeProvider theme={theme}><CssBaseline/><div style={{width: 560, height: 420}}>
    <PopupPreview key={'chrome-' + popupType} popup={popup} showBackground={false}/>
  </div></ThemeProvider>);
};
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'}});
(window as any).scenario = (mode = 'FIT_TO_IMAGE', locked = true, width: number | null = 900, height: number | null = 300, description = '', minimumWidth = 100, maximumWidth = 400, footer = false, naturalWidth = 800, naturalHeight = 400) => {
  const source = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${naturalWidth}" height="${naturalHeight}"><rect width="${naturalWidth/2}" height="${naturalHeight}" fill="#0090ff"/><rect x="${naturalWidth/2}" width="${naturalWidth/2}" height="${naturalHeight}" fill="#ff5070"/></svg>`);
  // [TODO58] IMAGE 크기는 popup.width/height(FIT_TO_IMAGE는 이미지 콘텐츠 영역)다.
  const popup = {popupId: 'IMAGE', popupType: 'IMAGE', title: 'IMAGE', sizeMode: 'FIXED', width, height,
    widthRatio: .7, heightRatio: .75, minimumWidth, minimumHeight: 100, maximumWidth, maximumHeight: 600,
    showHeader: false, showCloseButton: true, showFooter: footer, showDoNotShowAgain: true, questions: [],
    content: {imageSizeMode: mode, imageUrl: source, imageTitle: '', description, showDescription: true,
      ...(mode === 'FIT_TO_IMAGE' ? {keepAspectRatio: locked} : {})}} as any;
  const natural = {width: naturalWidth, height: naturalHeight};
  (window as any).layoutForScreen = (screenWidth: number, screenHeight: number) => fitToImageLayout(popup, natural, {width: screenWidth, height: screenHeight});
  const layout = fitToImageLayout(popup, natural, {width: 1000, height: 900})!;
  const size = mode === 'FIT_TO_IMAGE' ? layout.window : {width: Number(width ?? 560), height: Number(height ?? 420)};
  (window as any).imageState = {popup, layout, display: displayImageSize(popup, natural)};
  root.render(<ThemeProvider theme={theme}><CssBaseline/><div style={{width: size.width, height: size.height}}>
    <PopupPreview key={JSON.stringify(popup.content) + width + 'x' + height + minimumWidth + maximumWidth + footer} popup={popup} showBackground={false}/>
  </div></ThemeProvider>);
};
(window as any).scenario();
