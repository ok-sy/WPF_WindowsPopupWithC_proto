import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import PopupEditorDialog from '../zero-rule-web/main/src/features/RgstPop/PopupEditorDialog';
import popupDemoQuestions from '../zero-rule-web/main/src/features/PopupcommonComponent/popupDemoQuestions';
import { createDefaultPopup } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupEditorTransform';

/*
 * RgstPop 등록 편집기(PopupEditorDialog)를 가짜 관리자 API(@/provider 대역)로 띄우는 검증 진입점.
 * window.mountQuiz(passingScore, questionScore)로 상세 조회 응답(QUIZ)을 정해 편집기를 연다. 저장 요청은 window.__saved에 남는다.
 */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
const w = window as any;
w.mountQuiz = (passingScore: number | null, questionScore = 5) => {
  const questions = popupDemoQuestions(true).map((question) => ({ ...question, questionScore,
    ...(question.questionType === 'TEXT' ? { correctAnswer: '정보보호팀', answerMatchMode: 'CONTAINS' } : {}) }));
  w.__detail = { ...createDefaultPopup(new Date('2026-10-22T00:00:00+09:00')), popupId: 'RGST-QUIZ', title: '보안 퀴즈', popupType: 'QUIZ',
    width: 640, height: 640, passingScore, questions, content: { ...createDefaultPopup().content, surveyTitle: '보안 퀴즈' } };
  w.__saved = null;
  root.render(<ThemeProvider theme={theme}><CssBaseline />
    <PopupEditorDialog key={Date.now()} open popupId="RGST-QUIZ" initialActive onClose={() => {}} onSaved={() => {}} />
    <ToastContainer />
  </ThemeProvider>);
};
