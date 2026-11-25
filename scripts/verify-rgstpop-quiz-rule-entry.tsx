import type { PopupQuestion } from '@local/domain';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import PopupEditorDialog from '../zero-rule-web/main/src/features/RgstPop/PopupEditorDialog';
import popupDemoQuestions from '../zero-rule-web/main/src/features/PopupcommonComponent/popupDemoQuestions';
import { createDefaultPopup } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupEditorTransform';
import { POPUP_DEFAULTS, POPUP_INPUT_RANGES, applyPopupDefaultCodes } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupDefaults';

/*
 * RgstPop 등록 편집기(PopupEditorDialog)를 가짜 관리자 API(@/provider 대역)로 띄우는 검증 진입점.
 * window.mountQuiz(passingScore, questionScore, quizTypeCode?)로 상세 조회 응답(QUIZ)을 정해 편집기를 연다(quizTypeCode 생략 = 코드 없는 기존 데이터). 저장 요청은 window.__saved에 남는다.
 */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
const w = window as any;
let editorKey = 0;
w.openQuiz = (popupId: string, active = true) => root.render(<ThemeProvider theme={theme}><CssBaseline />
  <PopupEditorDialog key={editorKey} open popupId={popupId} initialActive={active} onClose={() => {}} onSaved={() => {}} />
  <ToastContainer />
</ThemeProvider>);
w.mountQuiz = (passingScore: number | null, questionScore = 5, quizTypeCode?: string, includeOpinion = false) => {
  const questions: PopupQuestion[] = popupDemoQuestions(true).map((question) => ({ ...question, questionScore,
    ...(question.questionType === 'TEXT' ? { correctAnswer: '정보보호팀', answerMatchMode: 'CONTAINS' } : {}) }));
  if (includeOpinion) questions.push({ questionId: 7001, questionType: 'TEXT', title: '추가 의견', optionLayout: 'VERTICAL', options: [], sortOrder: 3, isRequired: false, isScored: false, questionScore: null });
  w.__detail = { ...createDefaultPopup(new Date('2026-10-22T00:00:00+09:00')), popupId: 'RGST-QUIZ', title: '보안 퀴즈', popupType: 'QUIZ',
    width: 640, height: 640, passingScore, ...(quizTypeCode !== undefined ? { quizTypeCode } : {}), questions, content: { ...createDefaultPopup().content, surveyTitle: '보안 퀴즈' } };
  w.__saved = null;
  editorKey++;
  w.openQuiz('RGST-QUIZ');
};
Object.assign(w, { POPUP_DEFAULTS, POPUP_INPUT_RANGES, applyPopupDefaultCodes });
/* 신규 등록(popupId 없음)으로 편집기를 연다. 공통코드 0101 응답은 window.__defaultCodes. */
w.openNew = () => { editorKey++; root.render(<ThemeProvider theme={theme}><CssBaseline />
  <PopupEditorDialog key={editorKey} open popupId={null} initialActive onClose={() => {}} onSaved={() => {}} />
  <ToastContainer />
</ThemeProvider>); };
