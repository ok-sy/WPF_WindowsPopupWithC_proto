import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupPreview from '../zero-rule-web/main/src/features/RgstPop/PopupPreview';
// [설계 43] 완료 조건 버튼 UX 하네스: 유형·옵션만 바꾼 PopupPreview를 그린다.
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({typography: {fontFamily: '"Malgun Gothic", Arial, sans-serif'}});
const option = (optionId: number, text: string, isCorrect: boolean) => ({optionId, text, isCorrect, sortOrder: optionId});
const quizQuestions = [1, 2, 3, 4].map(n => ({questionId: n, title: `문항 ${n}`, questionType: 'SINGLE_CHOICE', isRequired: true,
  isScored: true, questionScore: 25, sortOrder: n, optionLayout: 'VERTICAL',
  options: [option(n * 10 + 1, `정답 ${n}`, true), option(n * 10 + 2, `오답 ${n}`, false)]}));
(window as any).renderPopup = (popupType: string, overrides: Record<string, unknown> = {}, content: Record<string, unknown> = {}) => {
  const popup = {popupId: 'P43', popupType, title: '완료 조건', sizeMode: 'FIXED', width: 640, height: 600, widthRatio: .7, heightRatio: .75,
    minimumWidth: 100, minimumHeight: 100, maximumWidth: 1600, maximumHeight: 900, showHeader: true, showCloseButton: true, showFooter: true,
    showDoNotShowAgain: false, completionRatio: .8, passingScore: 100, allowCloseBeforeComplete: false,
    questions: popupType === 'QUIZ' ? quizQuestions : [],
    ...overrides,
    content: {videoTitle: '영상', surveyTitle: '퀴즈', videoUrl: 'https://example.com/a.mp4', ...content}} as any;
  root.render(<ThemeProvider theme={theme}><CssBaseline/><div style={{width: 640, height: 900}}>
    <PopupPreview key={JSON.stringify(popup)} popup={popup} showBackground={false} onClose={() => { (window as any).closeCount = ((window as any).closeCount ?? 0) + 1; }}/>
  </div></ThemeProvider>);
};
(window as any).renderPopup('VIDEO');
