import { CKEditor, loadCkeditorEngine, type CkeditorEngine } from '@/components/ckeditor';
import { Box } from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const requestFocusToEditor = (editorInstance: any) => {
  editorInstance?.editing?.view?.focus();
};

/* 소스 편집 중 다른 편집 명령을 막을 때 쓰는 잠금 ID */
const SOURCE_EDITING_LOCK = 'CommonCKEditorSourceEditing';

/**
 * ■ 외부 편집 영역용 소스 편집 전환
 * - CKEditor 49 SourceEditing은 편집 영역이 외부 DOM 요소(React 래퍼가 만든 요소에 DecoupledEditor를 붙인 경우,
 *   editable.hasExternalElement)이면 모드 값(isSourceEditingMode)만 바꾸고 화면은 바꾸지 않는다. 그래서 '소스' 버튼을 눌러도 변화가 없었다.
 * - 모드가 켜지면 편집 영역을 숨기고 현재 HTML을 담은 textarea를 같은 자리·높이에 보이고, 다른 편집 명령은 잠근다.
 *   입력할 때마다 notify로 저장 값을 갱신해 소스 모드에서 바로 저장해도 수정이 빠지지 않게 하고, 모드가 꺼지면 편집기에 반영한다.
 * - 편집 영역이 외부 요소가 아니면(플러그인이 직접 처리) 아무것도 하지 않는다.
 */
function attachExternalSourceEditing(editor: any, notify: (html: string) => void) {
  if (!editor.plugins.has('SourceEditing') || !editor.ui.view.editable?.hasExternalElement) return;
  const plugin = editor.plugins.get('SourceEditing');
  let area: HTMLTextAreaElement | null = null;
  plugin.on('change:isSourceEditingMode', (_evt: unknown, _name: string, isSourceEditingMode: boolean) => {
    const root: HTMLElement | null = editor.editing.view.getDomRoot();
    if (!root) return;
    if (isSourceEditingMode) {
      area = root.ownerDocument.createElement('textarea');
      area.className = 'CommonCKEditor-source';
      area.setAttribute('aria-label', '소스 편집');
      area.spellcheck = false;
      area.value = editor.getData();
      Object.assign(area.style, {
        display: 'block', width: '100%', height: `${Math.max(root.offsetHeight, 200)}px`, boxSizing: 'border-box', resize: 'none',
        border: '0', outline: 'none', padding: '12px', fontFamily: 'Consolas, "D2Coding", monospace', fontSize: '13px', lineHeight: '1.6',
      });
      const current = area;
      current.addEventListener('input', () => notify(current.value));
      for (const command of editor.commands.commands()) command.forceDisabled(SOURCE_EDITING_LOCK);
      // 편집 영역 style 속성은 뷰 렌더러가 관리해 직접 바꾸면 덮어써진다. 플러그인과 같이 뷰 루트에 ck-hidden을 붙인다.
      editor.editing.view.change((writer: any) => writer.addClass('ck-hidden', editor.editing.view.document.getRoot()));
      root.after(current);
      current.focus();
    } else if (area) {
      const html = area.value;
      area.remove();
      area = null;
      editor.editing.view.change((writer: any) => writer.removeClass('ck-hidden', editor.editing.view.document.getRoot()));
      for (const command of editor.commands.commands()) command.clearForceDisabled(SOURCE_EDITING_LOCK);
      // 실행 취소로 소스 편집 전 내용으로 되돌릴 수 있게 한다. change:data가 발생해 onChange(저장 값)도 갱신된다.
      editor.data.set(html, { batchType: { isUndoable: true } });
    }
  });
}

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
            attachExternalSourceEditing(editor, (html) => onContentChangeFn.current?.(html));
            onEditorReady?.(editor);
          }}
          data={content ?? ''}
          onChange={onContentChange}
        />
      )}
    </Box>
  );
}
