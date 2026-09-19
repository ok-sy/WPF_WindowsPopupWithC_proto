import CommonCKEditor from '@/components/CommonCKEditor';
import { flatSx, requestSelector } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useMeasure } from 'react-use';

type Props = {
  sx?: SxProps;
  className?: string;
  content?: string;
  onContentChange: (content: string | undefined) => void;
  onEditorReady?: (editor: any) => void;
};

export const requestFocusToEditor = (editorInstance: any) => {
  editorInstance?.editing?.view?.focus();
};

export default function BbsCKEditor(props: Props) {
  const { sx, className, content, onContentChange, onEditorReady } = props;
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement>();
  const editorRef = useRef<any | null>(null);
  const [wrapperMeasureRef, { height: wrapperHeight }] = useMeasure();

  const addToolbar = (editor: any) => {
    requestSelector(rootRef.current, '.BbsCKEditor-toolbar', (container) => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(editor.ui.view.toolbar.element);
    });
  };

  useEffect(() => {
    if (!wrapperHeight) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.editing.view.change((writer: any) => {
      writer.setStyle('height', `${wrapperHeight}px`, editor.editing.view.document.getRoot());
    });
  }, [wrapperHeight]);

  return (
    <Box
      className={clsx('BbsCKEditor-root', className)}
      sx={flatSx(
        {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        sx,
      )}
      ref={rootRef}
    >
      <Box className="BbsCKEditor-toolbar ck-reset_all" ref={toolbarRef} />
      <Box
        className="BbsCKEditor-wrapper"
        ref={wrapperMeasureRef}
        sx={{
          flex: 1,
          border: '1px solid #ddd',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CommonCKEditor
          className="BbsCKEditor-editor"
          content={content ?? ''}
          onEditorReady={(editor) => {
            editorRef.current = editor;
            onEditorReady?.(editor);
            addToolbar(editor);
          }}
          onContentChange={onContentChange}
        />
      </Box>
    </Box>
  );
}
