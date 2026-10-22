import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import type { PopupQuestion } from '@local/domain';
import PopupQuestionEditor, { validatePopupQuestions } from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor';
import PopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview';

/* POL-06-01 : 문항·서식
 * ■ 실제 문항 편집기(CKEditor 커스텀 빌드 여러 개)·설문 미리보기를 브라우저에서 띄우는 검증 진입점. */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
const w = window as any;
w.validatePopupQuestions = validatePopupQuestions;

function Editor({ initial }: { initial: PopupQuestion[] }) {
  const [questions, setQuestions] = useState(initial);
  w.questions = questions;
  return <PopupQuestionEditor questions={questions} quiz={false} onChange={setQuestions} onPassingScoreChange={() => undefined} />;
}

let mountKey = 0;
w.mountEditor = (questions: PopupQuestion[]) => {
  mountKey++;
  root.render(<ThemeProvider theme={theme}><CssBaseline />
    <div style={{ width: 760, padding: 16 }}><Editor key={mountKey} initial={questions} /></div>
    <button id="outside" style={{ marginLeft: 16 }}>바깥</button>
  </ThemeProvider>);
};
w.mountPreview = (popup: any) => {
  mountKey++;
  root.render(<ThemeProvider theme={theme}><CssBaseline />
    <div id="preview" style={{ width: 720, padding: 16 }}>
      <PopupPreview key={mountKey} popup={popup} showBackground={false} />
    </div>
  </ThemeProvider>);
};
w.editors = () => Array.from(document.querySelectorAll('.ck-editor__editable')).map((element: any) => element.ckeditorInstance);
/* 편집기 index의 문단 block에서 [start, end) 글자 범위를 선택한다. */
w.select = (editorIndex: number, block: number, start: number, end: number) => {
  const editor = w.editors()[editorIndex];
  editor.editing.view.focus();
  editor.model.change((writer: any) => {
    const docRoot = editor.model.document.getRoot();
    writer.setSelection(writer.createRange(writer.createPositionAt(docRoot.getChild(block), start),
      writer.createPositionAt(docRoot.getChild(block), end)));
  });
};
