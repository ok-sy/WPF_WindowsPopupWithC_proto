import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import type { AdminPopupDetail } from '@local/domain';
import PopupRichTextEditor from '../zero-rule-web/main/src/features/RgstPop/PopupRichTextEditor';
import InlinePopupPreview from '../zero-rule-web/main/src/features/RgstPop/InlinePopupPreview';
import PopupPreviewDialog from '../zero-rule-web/main/src/features/RgstPop/PopupPreviewDialog';
import type { Size } from '../zero-rule-web/main/src/features/RgstPop/imagePreviewLayout';
import { plainTextToBlocks, readTextBlocks } from '../zero-rule-web/main/src/features/RgstPop/popupRichText';
import {
  changePopupType, contentValue, createDefaultPopup, toEditorPopup, toEditorPopupFromTemplate, toSaveRequest, toSaveRequestPopup,
} from '../zero-rule-web/main/src/features/RgstPop/popupEditorTransform';
import { legacyChangeType, legacyDefault, legacyLoad, legacySave, legacyTemplate } from './verify-popup-transform-64-legacy';

/*
 * [TODO64] 1) 변환 함수와 분리 전 코드(legacy)의 결과 비교, 2) 전체 등록 화면 없이 편집기·우측/모달 미리보기·변환 함수를
 * 연결한 최소 호스트. 저장 API는 호출하지 않고 저장 요청 객체만 화면과 window.saveRequest()로 확인한다.
 */
const w = window as any;
Object.assign(w, { changePopupType, createDefaultPopup, toEditorPopup, toEditorPopupFromTemplate, toSaveRequest, toSaveRequestPopup,
  legacyChangeType, legacyDefault, legacyLoad, legacySave, legacyTemplate });
w.deepFreeze = <T,>(value: T): T => {
  if (value && typeof value === 'object') { Object.values(value).forEach(w.deepFreeze); Object.freeze(value); }
  return value;
};
/* JSON 키 순서는 비교에서 제외한다. */
w.canonical = (value: unknown): string => JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v);

const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });

function TransformHost({ initial }: { initial: AdminPopupDetail }) {
  // 부모 책임: 편집값 state·에디터 key·모달 열림 상태. 데이터 구성은 popupEditorTransform 함수 호출로만 한다.
  const [popup, setPopup] = useState<AdminPopupDetail>(initial);
  const [editorKey, setEditorKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fitWindow, setFitWindow] = useState<Size | null>(null);
  w.hostPopup = popup;
  w.saveRequest = () => toSaveRequest(popup, true, []);
  // 다른 콘텐츠 불러오기: 편집값을 바꾸고 key를 올려 편집기를 새 initialBlocks로 다시 연다.
  w.loadContent = (loaded: AdminPopupDetail) => { setPopup(toEditorPopup(loaded)); setEditorKey((key) => key + 1); };
  w.openPreview = () => setPreviewOpen(true);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '520px 460px', gap: 16, padding: 16 }}>
      <div>
        <PopupRichTextEditor key={editorKey} label="일반 텍스트"
          initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentValue(popup, 'plainText'))}
          onChange={(blocks, plainText) => setPopup((previous) => ({
            ...previous, content: { ...previous.content, textBlocks: blocks, plainText },
          }))} />
        <pre id="save-request" style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{JSON.stringify(toSaveRequest(popup, true, []), null, 1)}</pre>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: 640 }}>
        <InlinePopupPreview popup={popup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setFitWindow} />
      </div>
      <PopupPreviewDialog popup={popup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={fitWindow} />
    </div>
  );
}

let mountKey = 0;
w.mountHost = (initial: AdminPopupDetail) => {
  mountKey++;
  root.render(<ThemeProvider theme={theme}><CssBaseline /><TransformHost key={mountKey} initial={initial} /></ThemeProvider>);
};
w.editor = () => (document.querySelector('.ck-editor__editable') as any)?.ckeditorInstance;
