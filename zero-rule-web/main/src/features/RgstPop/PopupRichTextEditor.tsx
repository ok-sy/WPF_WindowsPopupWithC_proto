// @ts-nocheck — CKEditor 커스텀 빌드는 타입 선언이 없다(CommonCKEditor와 동일).
import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { blocksToHtml, blocksToPlainText, htmlToBlocks, richEditorConfig, type RichBlock } from './popupRichText';

const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then((m) => m.CKEditor), { ssr: false });

type Props = {
  label: string;
  /** 처음 열 때의 본문. 편집 중에는 다시 넣지 않는다(커서 위치 보존). 바꾸려면 key로 다시 마운트한다. */
  initialBlocks: RichBlock[];
  disabled?: boolean;
  onChange: (blocks: RichBlock[], plainText: string) => void;
};

/**
 * [설계 28] TEXT 본문 서식 편집기. 공용 CommonCKEditor 설정은 바꾸지 않고 팝업 전용 툴바·허용 값만 사용한다.
 * 편집기 HTML은 변경될 때마다 문단·Run JSON으로 바꿔 올려 보내며 HTML 자체는 저장하지 않는다.
 */
export default function PopupRichTextEditor({ label, initialBlocks, disabled, onChange }: Props) {
  const [Editor, setEditor] = useState<any>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [initialHtml] = useState(() => blocksToHtml(initialBlocks));

  useEffect(() => {
    if (typeof document !== 'undefined') setEditor(() => require('@cp949/ckeditor5-custom-build'));
  }, []);

  /* CKEditor 34부터 읽기 전용은 잠금 ID 방식이다(isReadOnly 직접 설정은 사용하지 않음). */
  const applyReadOnly = (editor: any, readOnly: boolean) => {
    if (readOnly) editor.enableReadOnlyMode('popup-rich-text');
    else editor.disableReadOnlyMode('popup-rich-text');
  };
  useEffect(() => {
    if (editorRef.current) applyReadOnly(editorRef.current, Boolean(disabled));
  }, [disabled]);

  return (
    <Box sx={{ opacity: disabled ? 0.6 : 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box ref={toolbarRef} className="ck-reset_all" sx={{ border: '1px solid #c4c4c4', borderBottom: 0, borderRadius: '4px 4px 0 0' }} />
      <Box sx={{ border: '1px solid #c4c4c4', borderRadius: '0 0 4px 4px', minHeight: 140, '& .ck-editor__editable': { minHeight: 140, px: 1.5 } }}>
        {Editor && (
          <CKEditor
            editor={Editor}
            config={{ ...richEditorConfig, placeholder: '본문을 입력하고 글자를 선택해 서식을 지정하세요.' }}
            data={initialHtml}
            onReady={(editor) => {
              editorRef.current = editor;
              const container = toolbarRef.current;
              if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
                container.appendChild(editor.ui.view.toolbar.element);
              }
              applyReadOnly(editor, Boolean(disabled));
            }}
            onChange={(_, editor) => {
              const blocks = htmlToBlocks(editor.getData());
              onChangeRef.current(blocks, blocksToPlainText(blocks));
            }}
          />
        )}
      </Box>
    </Box>
  );
}
