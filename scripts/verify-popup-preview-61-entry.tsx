import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import InlinePopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/InlinePopupPreview';
import PopupPreviewDialog from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreviewDialog';
import type { Size } from '../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout';
import { adaptiveWindowForImage, fitToImageLayout } from '../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout';
import { VIDEO_FIXED_DESCRIPTION, applyVideoFixedDescription, stripVideoFixedDescription } from '../zero-rule-web/main/src/features/PopupcommonComponent/videoFixedDescription';
import { previewDialogSize, readBrowserViewport, readScreenWorkArea } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupPreviewDialogLayout';
import { registerPopupRichFonts } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupRichText';
// POL-08-01 : 공통 렌더러
// ■ 등록 화면 없이 샘플 popup 객체만으로 인라인·실제 크기 미리보기를 쓰는 최소 호스트.
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'}});
// TODO61-19: 폐쇄망 theme/index.ts의 전역 body1 12px 규칙(MuiTypography root '&.MuiTypography-body1')을 재현한 테마.
const body1RuleTheme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'},
  components: {MuiTypography: {styleOverrides: {root: {'&.MuiTypography-body1': {fontSize: '12px'}}}}}});
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
function Host({popup, hint, placeholders}: {popup: any; hint: boolean; placeholders: boolean}) {
  const [open, setOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);
  (window as any).hostState = {open, recommended};
  const size = (window as any).hostSize ?? {width: 520, height: 700};
  return <div style={{display: 'flex', height: size.height, width: size.width, flexDirection: 'column'}}>
    <InlinePopupPreview popup={popup} showPlaceholders={placeholders} onOpenPreview={() => setOpen(true)} onRecommendedSize={setRecommended} />
    <PopupPreviewDialog popup={popup} showPlaceholders={placeholders} open={open} onClose={() => setOpen(false)} recommendedSize={hint ? recommended : null} />
  </div>;
}
(window as any).renderHost = (popupType: string, overrides: Record<string, unknown> = {}, content: Record<string, unknown> = {}, hint = true, placeholders = false) => {
  const popup = deepFreeze(samplePopup(popupType, overrides, content));
  (window as any).popupJson = JSON.stringify(popup);
  (window as any).currentPopup = popup;
  root.render(<ThemeProvider theme={(window as any).body1Rule ? body1RuleTheme : theme}><CssBaseline/>
    <Host key={JSON.stringify(popup) + !!(window as any).body1Rule + hint + placeholders + JSON.stringify((window as any).hostSize ?? null)} popup={popup} hint={hint} placeholders={placeholders} />
  </ThemeProvider>);
};
(window as any).expectedSize = (available: Size, fit: Size | null = null) => previewDialogSize((window as any).currentPopup, fit, available);
// POL-01-03 : 최소 크기 — 샘플 popup 값만 바꿔 실제 크기 모달 크기를 계산한다(렌더링 없음).
(window as any).dialogSize = (overrides: Record<string, unknown>, available: Size) => previewDialogSize(samplePopup('TEXT', overrides), null, available);
// TODO61-23: 유형·모드별 목표 크기(작업 영역 기준)와 화면 정보 대체값 확인용.
(window as any).dialogSizeOf = (popupType: string, overrides: Record<string, unknown>, workArea: Size) => previewDialogSize(samplePopup(popupType, overrides), null, workArea);
(window as any).readScreenWorkArea = readScreenWorkArea;
(window as any).readBrowserViewport = readBrowserViewport;
(window as any).fitLayout = (natural: Size, workArea: Size) => fitToImageLayout((window as any).currentPopup, natural, workArea);
// 2026-11-24: IMAGE ADAPTIVE 창 크기 맞춤과 동영상 고정 안내 문구 붙이기·떼기(순수 함수) 확인용.
(window as any).adaptiveFit = (overrides: Record<string, unknown>, content: Record<string, unknown>, natural: Size, width: number | null) =>
  adaptiveWindowForImage(samplePopup('IMAGE', overrides, content), natural, width);
(window as any).fixedText = VIDEO_FIXED_DESCRIPTION;
(window as any).applyFixed = (type: string, content: Record<string, unknown>) => applyVideoFixedDescription(deepFreeze(samplePopup(type, {}, content)));
(window as any).stripFixed = (popup: any) => stripVideoFixedDescription(deepFreeze(popup));
(window as any).registerPopupRichFonts = registerPopupRichFonts;
(window as any).renderHost('TEXT');
