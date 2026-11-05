import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview';
import InlinePopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/InlinePopupPreview';
import {displayImageSize, fitToImageLayout} from '../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout';
// POL-04-02 : 모드별 기준
// POL-04-03 : 비율·상한
// ■ IMAGE 미리보기 검증 진입점. window.scenario로 크기 모드별 PopupPreview를 그린다.
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
/* 인라인 미리보기를 부모 구조별로 그린다. 이미지 칸이 0으로 접히지 않는지 확인한다. */
const INLINE_PARENTS: Record<string, any> = {
  gridRow: {display: 'grid', gridTemplateRows: 'minmax(220px, 1fr)', height: 500, width: 460},
  flexFixed: {display: 'flex', flexDirection: 'column', height: 600, width: 460},
  flexMin: {display: 'flex', flexDirection: 'column', minHeight: 560, width: 460},
  flexMinTitle: {display: 'flex', flexDirection: 'column', minHeight: 560, width: 460},
  blockFixed: {height: 600, width: 460},
  blockAuto: {width: 460},
};
(window as any).inlineScenario = (parent: string, mode: string, popupHeight: number | null = 420) => {
  const source = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="red"/></svg>');
  const popup = {popupId: 'INLINE', popupType: 'IMAGE', title: 'INLINE', sizeMode: 'FIXED', width: 560, height: popupHeight,
    widthRatio: .7, heightRatio: .75, minimumWidth: 300, minimumHeight: 300, maximumWidth: 1600, maximumHeight: 900,
    showHeader: true, showCloseButton: true, showFooter: true, showDoNotShowAgain: false, questions: [],
    content: {imageSizeMode: mode, imageUrl: source}} as any;
  root.render(<ThemeProvider theme={theme}><CssBaseline/><div key={parent + mode + popupHeight} style={INLINE_PARENTS[parent]}>
    {parent === 'flexMinTitle' && <h4 style={{margin: 0}}>미리보기</h4>}
    <InlinePopupPreview popup={popup}/>
  </div></ThemeProvider>);
};
const theme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'}});
(window as any).scenario = (mode = 'FIT_TO_IMAGE', locked = true, width: number | null = 900, height: number | null = 300, description = '', minimumWidth = 100, maximumWidth = 400, footer = false, naturalWidth = 800, naturalHeight = 400) => {
  const source = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${naturalWidth}" height="${naturalHeight}"><rect width="${naturalWidth/2}" height="${naturalHeight}" fill="#0090ff"/><rect x="${naturalWidth/2}" width="${naturalWidth/2}" height="${naturalHeight}" fill="#ff5070"/></svg>`);
  // POL-04-01 : 공통 크기 입력 — IMAGE 크기는 popup.width/height(FIT_TO_IMAGE는 이미지 콘텐츠 영역)다.
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
