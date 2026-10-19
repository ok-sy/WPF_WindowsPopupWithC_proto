// @ts-nocheck — CKEditor 커스텀 빌드는 타입 선언이 없다(CommonCKEditor와 동일).
import { Box, Button, Stack, Typography, type PopoverPosition } from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import PopupRichTextMenu from './PopupRichTextMenu';
import { blocksToHtml, blocksToPlainText, htmlToBlocks, richEditorConfig, type RichBlock } from './popupRichText';
import { applyFormat, limitIndent, readFormatState, type FormatAction, type FormatState } from './popupRichTextFormat';

const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then((m) => m.CKEditor), { ssr: false });

type Props = {
  label: string;
  /** 처음 열 때의 본문. 편집 중에는 다시 넣지 않는다(커서 위치 보존). 바꾸려면 key로 다시 마운트한다. */
  initialBlocks: RichBlock[];
  disabled?: boolean;
  /**
   * [TODO55] 문항·선택지처럼 여러 개를 나란히 쓰는 짧은 입력. 상단 툴바를 숨기고 높이를 줄인다.
   * 서식은 우클릭·'서식' 버튼의 펼침 패널로 지정한다. 편집기마다 선택 범위·패널 상태를 따로 가진다.
   */
  compact?: boolean;
  placeholder?: string;
  onChange: (blocks: RichBlock[], plainText: string) => void;
};

/**
 * [설계 28] TEXT 본문 서식 편집기. 공용 CommonCKEditor 설정은 바꾸지 않고 팝업 전용 툴바·허용 값만 사용한다.
 * 편집기 HTML은 변경될 때마다 문단·Run JSON으로 바꿔 올려 보내며 HTML 자체는 저장하지 않는다.
 */
export default function PopupRichTextEditor({ label, initialBlocks, disabled, compact, placeholder, onChange }: Props) {
  const [Editor, setEditor] = useState<any>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [initialHtml] = useState(() => blocksToHtml(initialBlocks));
  /* [설계 28 §11·설계 49] 우클릭·'서식' 버튼·키보드로 여는 펼침 서식 패널 */
  const [menuPosition, setMenuPosition] = useState<PopoverPosition | null>(null);
  const [formatState, setFormatState] = useState<FormatState | null>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const detachRef = useRef<(() => void) | null>(null);
  useEffect(() => () => detachRef.current?.(), []);

  const openMenu = (position: PopoverPosition) => {
    const editor = editorRef.current;
    if (!editor || disabledRef.current) return;
    // 메뉴를 열기 전 선택 상태를 읽는다. 선택 범위는 편집기 모델에 그대로 남아 적용 대상이 된다.
    setFormatState(readFormatState(editor));
    setMenuPosition(position);
  };
  const closeMenu = () => {
    setMenuPosition(null);
    // Esc·바깥 클릭으로 닫아도 원래 선택 범위·커서로 돌아간다.
    editorRef.current?.editing.view.focus();
  };
  /* [설계 49] 적용 후에도 패널을 유지하므로 포커스는 패널에 두고, 바뀐 서식 상태를 다시 읽어 표시한다. */
  const applyMenu = (action: FormatAction) => {
    const editor = editorRef.current;
    if (!editor || disabledRef.current) return;
    applyFormat(editor, action);
    setFormatState(readFormatState(editor));
  };
  /* 키보드(메뉴 키·Shift+F10)로 연 경우 마우스 좌표가 없으므로 커서·선택 위치 아래에 연다. */
  const caretPosition = (fallback: HTMLElement): PopoverPosition => {
    const selection = window.getSelection();
    const rect = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).getBoundingClientRect() : null;
    if (rect && (rect.width > 0 || rect.height > 0)) return { top: rect.bottom + 4, left: rect.left };
    const box = fallback.getBoundingClientRect();
    return { top: box.top + 24, left: box.left + 16 };
  };

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
    // 읽기 전용으로 바뀌면 열린 서식 패널을 닫는다.
    if (disabled) setMenuPosition(null);
  }, [disabled]);

  return (
    <Box sx={{ opacity: disabled ? 0.6 : 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">{compact ? label : `${label} · 글자를 선택하고 우클릭하면 서식 패널이 열립니다`}</Typography>
        <Button size="small" disabled={disabled} aria-haspopup="dialog"
          // 버튼을 눌러도 편집기의 선택 범위가 풀리지 않게 한다.
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            openMenu({ top: box.bottom + 4, left: box.left });
          }}>서식</Button>
      </Stack>
      <Box ref={toolbarRef} className="ck-reset_all" sx={{ display: compact ? 'none' : undefined, border: '1px solid #c4c4c4', borderBottom: 0, borderRadius: '4px 4px 0 0' }} />
      <Box sx={{ border: '1px solid #c4c4c4', borderRadius: compact ? '4px' : '0 0 4px 4px', minHeight: compact ? 40 : 140,
        '& .ck-editor__editable': { minHeight: compact ? 40 : 140, px: 1.5 }, '& .ck-editor__editable p': compact ? { my: 0.75 } : {} }}>
        {Editor && (
          <CKEditor
            editor={Editor}
            config={{ ...richEditorConfig, placeholder: placeholder ?? '본문을 입력하고 글자를 선택해 서식을 지정하세요.' }}
            data={initialHtml}
            onReady={(editor) => {
              editorRef.current = editor;
              const container = toolbarRef.current;
              if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
                container.appendChild(editor.ui.view.toolbar.element);
              }
              applyReadOnly(editor, Boolean(disabled));
              // [설계 49] 문단 들여쓰기 최대 단계(5단계 = 200px) 제한.
              limitIndent(editor);
              // 서식 편집 영역 안에서만 사용자 정의 메뉴를 쓰고, Shift+우클릭은 브라우저 기본 메뉴(복사·붙여넣기 등)를 연다.
              const editable: HTMLElement = editor.ui.getEditableElement();
              const onContextMenu = (event: MouseEvent) => {
                if (event.shiftKey || disabledRef.current) return;
                event.preventDefault();
                const fromKeyboard = event.button !== 2 && event.clientX === 0 && event.clientY === 0;
                openMenu(fromKeyboard ? caretPosition(editable) : { top: event.clientY, left: event.clientX });
              };
              editable.addEventListener('contextmenu', onContextMenu);
              detachRef.current = () => editable.removeEventListener('contextmenu', onContextMenu);
            }}
            onChange={(_, editor) => {
              const blocks = htmlToBlocks(editor.getData());
              onChangeRef.current(blocks, blocksToPlainText(blocks));
            }}
          />
        )}
      </Box>
      <PopupRichTextMenu position={menuPosition} state={formatState} onApply={applyMenu} onClose={closeMenu} />
    </Box>
  );
}
