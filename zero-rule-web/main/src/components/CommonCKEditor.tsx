// @ts-nocheck
import log from '@/log';
import { Box } from '@mui/material';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then((m) => m.CKEditor), {
  ssr: false,
});

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
  const [prepared, setPrepared] = useState(false);
  const onContentChangeFn = useRef<any>();
  onContentChangeFn.current = props.onContentChange;
  const editorRef = useRef<any>();

  const onContentChange = useCallback((event: any, editor: any) => {
    onContentChangeFn.current?.(editor.getData());
  }, []);

  const setupEditor = useCallback(async () => {
    editorRef.current = {
      // 나중에 임포트로 바꿔보자

      Editor: require('@cp949/ckeditor5-custom-build'),
    };
    setPrepared(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setupEditor();
    } else {
      log.warn('document is undefined');
    }
  }, [setupEditor]);

  const { Editor } = editorRef.current ?? {};

  return (
    <Box className="CommonCKEditor-root">
      {prepared && (
        <CKEditor
          // @ts-ignore
          id={editorId}
          // config={{ plugins }}
          editor={Editor}
          config={{
            placeholder: placeholder ?? '여기에 입력하세요',

            link: {
              decorators: {
                isExternal: {
                  mode: 'manual',
                  label: 'Open in a new tab',
                  attributes: {
                    target: '_blank',
                  },
                },
              },
            },
          }}
          className={clsx('CommonCKEditor-editor', className)}
          onReady={(editor) => {
            onEditorReady?.(editor);
          }}
          data={content ?? ''}
          onChange={onContentChange}
        />
      )}
    </Box>
  );
}
