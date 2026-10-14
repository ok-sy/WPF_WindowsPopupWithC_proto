import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupRichTextEditor from '../zero-rule-web/main/src/features/RgstPop/PopupRichTextEditor';
import PopupPreview from '../zero-rule-web/main/src/features/RgstPop/PopupPreview';
import { blocksToHtml, blocksToPlainText, htmlToBlocks, indentFromCss, readTextBlocks, RICH_COLORS, type RichBlock } from '../zero-rule-web/main/src/features/RgstPop/popupRichText';

/* [설계 49] 실제 관리자 편집기(CKEditor 커스텀 빌드)·서식 패널·미리보기를 브라우저에서 띄우는 검증 진입점. */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
const w = window as any;
Object.assign(w, { blocksToHtml, blocksToPlainText, htmlToBlocks, indentFromCss, readTextBlocks, RICH_COLORS });
let mountKey = 0;
w.mount = (blocks: RichBlock[], disabled = false, previewBlocks: RichBlock[] | null = null) => {
  w.lastChange = null;
  mountKey++;
  root.render(<ThemeProvider theme={theme}><CssBaseline />
    <div style={{ width: 640, padding: 16 }}>
      <PopupRichTextEditor key={mountKey} label="일반 텍스트" initialBlocks={blocks} disabled={disabled}
        onChange={(changed, plainText) => { w.lastChange = { blocks: changed, plainText }; }} />
    </div>
    {previewBlocks && <div id="preview" style={{ width: 300, padding: 16 }}>
      <PopupPreview popup={{ popupId: 'TEXT', popupType: 'TEXT', title: 'TEXT', sizeMode: 'FIXED', width: 300, height: 600, showHeader: false,
        showFooter: false, questions: [], content: { showPlainText: true, textBlocks: previewBlocks, plainText: blocksToPlainText(previewBlocks) } } as any}
        fitContainer showBackground={false} />
    </div>}
    <button id="outside" style={{ marginLeft: 16 }}>바깥</button>
  </ThemeProvider>);
};
w.editor = () => (document.querySelector('.ck-editor__editable') as any)?.ckeditorInstance;
/* 문단 index의 [start, end) 글자 범위를 선택한다(end 생략 = 커서). */
w.select = (block: number, start: number, end?: number, endBlock?: number) => {
  const editor = w.editor();
  editor.model.change((writer: any) => {
    const docRoot = editor.model.document.getRoot();
    const from = writer.createPositionAt(docRoot.getChild(block), start);
    const to = writer.createPositionAt(docRoot.getChild(endBlock ?? block), end ?? start);
    writer.setSelection(writer.createRange(from, to));
  });
};
w.selectionText = () => {
  const range = w.editor().model.document.selection.getFirstRange();
  return Array.from(range.getItems()).map((item: any) => item.data ?? '').join('');
};
