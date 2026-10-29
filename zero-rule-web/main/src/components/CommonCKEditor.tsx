import { CKEditor, loadCkeditorEngine, type CkeditorEngine } from '@/components/ckeditor';
import { Box } from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const requestFocusToEditor = (editorInstance: any) => {
  editorInstance?.editing?.view?.focus();
};

type Props = {
  editorId?: string;
  className?: string;
  content?: string;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
  onContentChange: (substance: string | undefined) => void;
};

export default function CommonCKEditor(props: Props) {
  const { editorId, onEditorReady, placeholder, content, className } = props;
  // 공통 엔진(ckeditor5)은 클라이언트에서만 불러온다. 준비되기 전에는 에디터를 그리지 않는다.
  const [engine, setEngine] = useState<CkeditorEngine | null>(null);
  const onContentChangeFn = useRef<Props['onContentChange']>();
  onContentChangeFn.current = props.onContentChange;

  const onContentChange = useCallback((_event: any, editor: any) => {
    onContentChangeFn.current?.(editor.getData());
  }, []);

  useEffect(() => {
    let alive = true;
    loadCkeditorEngine().then((loaded) => {
      if (alive) setEngine(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 래퍼는 config가 바뀌어도 에디터를 다시 만들지 않으므로 처음 값만 의미가 있다.
  const config = useMemo(
    () =>
      engine && {
        ...engine.commonEditorConfig,
        placeholder: placeholder ?? '여기에 입력하세요',
        link: {
          decorators: {
            isExternal: {
              mode: 'manual' as const,
              label: 'Open in a new tab',
              attributes: {
                target: '_blank',
              },
            },
          },
        },
      },
    [engine, placeholder],
  );

  return (
    <Box className="CommonCKEditor-root">
      {engine && config && (
        <CKEditor
          id={editorId}
          editor={engine.DecoupledEditor}
          config={config}
          onReady={(editor) => {
            // 래퍼는 className을 받지 않는다. 편집 영역(뷰 루트)에 붙인다. DOM classList로 넣으면 CKEditor가 다시 그릴 때 지운다.
            editor.editing.view.change((writer: any) => {
              writer.addClass(clsx('CommonCKEditor-editor', className).split(' '), editor.editing.view.document.getRoot());
            });
            onEditorReady?.(editor);
          }}
          data={content ?? ''}
          onChange={onContentChange}
        />
      )}
    </Box>
  );
}
