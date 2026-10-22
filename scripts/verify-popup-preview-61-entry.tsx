import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import InlinePopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/InlinePopupPreview';
import PopupPreviewDialog from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreviewDialog';
import type { Size } from '../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout';
import { fitToImageLayout } from '../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout';
import { previewDialogSize } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupPreviewDialogLayout';
// [TODO61] 등록 화면 없이 샘플 popup 객체만으로 인라인·실제 크기 미리보기를 쓰는 최소 호스트.
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'}});
const deepFreeze = <T,>(value: T): T => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};
const option = (optionId: number, text: string, isCorrect: boolean) => ({optionId, text, isCorrect, sortOrder: optionId});
const questions = [1, 2].map(n => ({questionId: n, title: `문항 ${n}`, questionType: 'SINGLE_CHOICE', isRequired: true,
  isScored: true, questionScore: 50, sortOrder: n, optionLayout: 'VERTICAL',
  options: [option(n * 10 + 1, `정답 ${n}`, true), option(n * 10 + 2, `오답 ${n}`, false)]}));
const image = (w: number, h: number) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#0090ff"/></svg>`);
function samplePopup(popupType: string, overrides: Record<string, unknown> = {}, content: Record<string, unknown> = {}) {
  return {popupId: 'P61', popupType, title: '미리보기 컴포넌트', sizeMode: 'FIXED', width: 560, height: 420, widthRatio: .5, heightRatio: .5,
    minimumWidth: 320, minimumHeight: 260, maximumWidth: 1200, maximumHeight: 900, showHeader: true, showCloseButton: true, showFooter: true,
    showDoNotShowAgain: false, completionRatio: .8, passingScore: 100,
    questions: popupType === 'SURVEY' || popupType === 'QUIZ' ? questions : [], ...overrides,
    content: {plainText: '본문', surveyTitle: '설문', videoTitle: '영상', videoUrl: '', imageUrl: image(800, 400), ...content}} as any;
}
function Host({popup, hint}: {popup: any; hint: boolean}) {
  const [open, setOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);
  (window as any).hostState = {open, recommended};
  return <div style={{display: 'flex', height: 700, width: 520, flexDirection: 'column'}}>
    <InlinePopupPreview popup={popup} onOpenPreview={() => setOpen(true)} onRecommendedSize={setRecommended} />
    <PopupPreviewDialog popup={popup} open={open} onClose={() => setOpen(false)} recommendedSize={hint ? recommended : null} />
  </div>;
}
(window as any).renderHost = (popupType: string, overrides: Record<string, unknown> = {}, content: Record<string, unknown> = {}, hint = true) => {
  const popup = deepFreeze(samplePopup(popupType, overrides, content));
  (window as any).popupJson = JSON.stringify(popup);
  (window as any).currentPopup = popup;
  root.render(<ThemeProvider theme={theme}><CssBaseline/>
    <Host key={JSON.stringify(popup) + hint} popup={popup} hint={hint} />
  </ThemeProvider>);
};
(window as any).expectedSize = (available: Size, fit: Size | null = null) => previewDialogSize((window as any).currentPopup, fit, available);
// [TODO68] 샘플 popup 값만 바꿔 실제 크기 모달 크기를 계산한다(렌더링 없음).
(window as any).dialogSize = (overrides: Record<string, unknown>, available: Size) => previewDialogSize(samplePopup('TEXT', overrides), null, available);
(window as any).fitLayout = (natural: Size, workArea: Size) => fitToImageLayout((window as any).currentPopup, natural, workArea);
(window as any).renderHost('TEXT');
