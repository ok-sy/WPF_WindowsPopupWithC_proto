import { Box, Button, Stack, Typography, type PopoverPosition } from '@mui/material';
import { CKEditor, loadCkeditorEngine, type CkeditorEngine } from '@/components/ckeditor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { acceptsByteLimitedChange, byteLimitMessage, utf8ByteLength } from './popupByteLimit';
import PopupRichTextMenu from './PopupRichTextMenu';
import { blocksToHtml, blocksToPlainText, htmlToBlocks, richEditorConfig, type RichBlock } from './popupRichText';
import { applyFormat, normalizeIndent, readFormatState, type FormatAction, type FormatState } from './popupRichTextFormat';

/* compact 입력칸 높이. 바깥 값은 테두리 2px를 더한 값으로 번호·서식·삭제 칸을 첫 줄에 맞출 때 쓴다. */
const COMPACT_EDITOR_MIN_HEIGHT = 34;
const COMPACT_EDITOR_OUTER_HEIGHT = COMPACT_EDITOR_MIN_HEIGHT + 2;

type Props = {
  /** 입력 위 제목 */
  label: string;
  /** 처음 열 때의 본문. 편집 중에는 다시 넣지 않는다(커서 위치 보존). 바꾸려면 key로 다시 마운트한다. */
  initialBlocks: RichBlock[];
  /** 읽기 전용(흐리게 표시, 서식 패널 닫힘) */
  disabled?: boolean;
  /**
   * 문항·선택지처럼 여러 개를 나란히 쓰는 짧은 입력. 상단 툴바를 숨기고 높이를 줄인다.
   * 서식은 우클릭·'서식' 버튼의 펼침 패널로 지정한다. 편집기마다 선택 범위·패널 상태를 따로 가진다.
   */
  compact?: boolean;
  /** compact 전용. 주면 짧은 표시(예: 선택지 번호)·입력칸·'서식' 버튼을 한 줄에 둔다. label은 묶음의 접근 이름으로 쓴다. */
  inlineLabel?: string;
  /** 상단 툴바만 숨긴다(본문 높이·문단 간격은 기본 유지). 값이 바뀌어도 다시 마운트하지 않아 입력 내용과 선택 범위가 유지된다. 서식은 우클릭·'서식' 버튼으로 지정한다. */
  hideToolbar?: boolean;
  /** 빈 편집기 안내 문구(생략 시 본문 기본 안내) */
  placeholder?: string;
  /**
   * 서식 없는 문자열(plainText)의 UTF-8 바이트 상한(예: QUIZ 선택지 300). 넘는 편집은 onChange로 보내지 않고 직전 내용·커서로 되돌린다.
   * 한글 조합 중에는 기다렸다가 조합이 끝날 때 확인한다. 되돌리면 편집기 실행 취소 기록이 비워진다. 생략하면 제한 없음.
   */
  maxPlainBytes?: number;
  /** 편집할 때마다 서식 본문과 서식 없는 문자열을 돌려준다. */
  onChange: (blocks: RichBlock[], plainText: string) => void;
};

/**
 * POL-03-01 : 저장·표시 경계
 * POL-03-03 : 편집 UI
 * ■ 서식 편집기
 * - in : label(string) 입력 제목 · initialBlocks(RichBlock[]) 처음 표시할 본문 · disabled?(boolean) 읽기 전용 · compact?(boolean) 툴바 없는 짧은 입력 · inlineLabel?(string) 한 줄 배치 표시 · hideToolbar?(boolean) 상단 툴바만 숨김 · placeholder?(string) 빈 편집기 안내
 * - out: onChange(blocks: RichBlock[], plainText: string) 편집할 때마다 서식 본문과 서식 없는 문자열 · 화면: 제목·'서식' 버튼·CKEditor·펼침 서식 패널
 * - 서식 본문을 받아 CKEditor로 편집하게 하고, 바뀐 내용을 문단·Run JSON과 일반 문자열로 돌려준다.
 *   공용 CommonCKEditor 설정은 바꾸지 않고 팝업 전용 툴바·허용 값만 쓴다. HTML 자체는 저장하지 않는다.
 *   initialBlocks는 처음 마운트할 때만 읽는다. 바꾸려면 key로 다시 마운트한다.
 */
export default function PopupRichTextEditor({ label, initialBlocks, disabled, compact, inlineLabel, hideToolbar, placeholder, maxPlainBytes, onChange }: Props) {
  const toolbarHidden = compact || hideToolbar;
  const inline = Boolean(compact && inlineLabel);
  const [engine, setEngine] = useState<CkeditorEngine | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [initialHtml] = useState(() => blocksToHtml(initialBlocks));
  /* 우클릭·'서식' 버튼·키보드로 여는 펼침 서식 패널 */
  const [menuPosition, setMenuPosition] = useState<PopoverPosition | null>(null);
  const [formatState, setFormatState] = useState<FormatState | null>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const detachRef = useRef<(() => void) | null>(null);
  useEffect(() => () => detachRef.current?.(), []);
  /* POL-03-03 : 편집 UI — 바이트 상한(TODO73-36). 마지막으로 받아들인 내용·커서(모델 경로)와 안내 상태 */
  const maxBytesRef = useRef(maxPlainBytes);
  maxBytesRef.current = maxPlainBytes;
  const lastValidRef = useRef<{ html: string; plain: string; selection: number[][] | null } | null>(null);
  const restoringRef = useRef(false);
  const [byteNotice, setByteNotice] = useState<{ blocked: boolean; bytes: number }>({ blocked: false, bytes: 0 });
  const selectionPaths = (editor: any): number[][] | null => {
    const range = editor.model.document.selection.getFirstRange();
    return range ? [range.start.path, range.end.path] : null;
  };
  /*
   * POL-03-01 : 저장·표시 경계
   * ■ 편집 내용 확인·전달
   * - in : editor(CKEditor) 바뀐 편집기
   * - out: onChange(blocks, plainText) · 상한을 넘으면 전달하지 않고 직전 내용으로 되돌림
   * - 상한이 없으면 그대로 전달한다. 이미 넘은 기존 내용은 줄이는 편집만 받는다(acceptsByteLimitedChange).
   */
  const commitChange = (editor: any) => {
    if (restoringRef.current) return;
    const html = editor.getData();
    const blocks = htmlToBlocks(html);
    const plain = blocksToPlainText(blocks);
    const max = maxBytesRef.current;
    const last = lastValidRef.current;
    if (max == null || !last || acceptsByteLimitedChange(last.plain, plain, max)) {
      lastValidRef.current = { html, plain, selection: selectionPaths(editor) };
      if (max != null) setByteNotice({ blocked: false, bytes: utf8ByteLength(plain) });
      onChangeRef.current(blocks, plain);
      return;
    }
    // 한글 조합 중에는 조합을 깨지 않고 조합이 끝날 때(change:isComposing) 다시 확인한다.
    if (editor.editing.view.document.isComposing) return;
    // 변경 이벤트 처리 중 setData를 부르지 않도록 다음 작업으로 미룬다.
    setTimeout(() => {
      const target = lastValidRef.current;
      if (!target || editor.state === 'destroyed') return;
      restoringRef.current = true;
      try {
        editor.setData(target.html);
        if (target.selection) {
          try {
            editor.model.change((writer: any) => {
              const docRoot = editor.model.document.getRoot();
              writer.setSelection(writer.createRange(writer.createPositionFromPath(docRoot, target.selection![0]), writer.createPositionFromPath(docRoot, target.selection![1])));
            });
          } catch { /* 경로가 맞지 않으면 setData 기본 위치(처음)에 둔다. */ }
        }
      } finally {
        restoringRef.current = false;
      }
      setByteNotice({ blocked: true, bytes: utf8ByteLength(target.plain) });
    }, 0);
  };

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
    const editor = editorRef.current;
    if (!editor) return;
    // CKEditor 49는 포커스가 돌아올 때 보류된 브라우저 선택(커서)으로 모델 선택을 덮어쓴다. 닫기 전 선택을 보관했다가 되돌린다.
    // 패널은 글자·문단 속성만 바꾸므로 보관한 위치는 그대로 유효하다.
    const selection = editor.model.document.selection;
    const ranges = Array.from(selection.getRanges());
    const backward = selection.isBackward;
    editor.editing.view.focus();
    editor.model.change((writer: any) => writer.setSelection(ranges, { backward }));
  };
  /* 적용 후에도 패널을 유지하므로 포커스는 패널에 두고, 바뀐 서식 상태를 다시 읽어 표시한다. */
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

  /* 공통 엔진(ckeditor5)을 클라이언트에서 불러온다. 공용 CommonCKEditor와 같은 엔진·플러그인 출처를 쓰고 config만 팝업 전용이다. */
  useEffect(() => {
    let alive = true;
    loadCkeditorEngine().then((loaded) => {
      if (alive) setEngine(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);
  const config = useMemo(
    () => engine && { ...engine.popupRichEditorConfig, ...richEditorConfig, placeholder: placeholder ?? '본문을 입력하고 글자를 선택해 서식을 지정하세요.' },
    [engine, placeholder],
  );

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

  const formatButton = (
    <Button size="small" disabled={disabled} aria-haspopup="dialog"
      sx={compact ? { minWidth: 0, flexShrink: 0, px: 0.75, ...(inline ? { height: COMPACT_EDITOR_OUTER_HEIGHT } : { py: 0, minHeight: 24 }) } : undefined}
      // 버튼을 눌러도 편집기의 선택 범위가 풀리지 않게 한다.
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        openMenu({ top: box.bottom + 4, left: box.left });
      }}>서식</Button>
  );

  return (
    <Box {...(inline ? { role: 'group', 'aria-label': label } : {})}
      sx={{ opacity: disabled ? 0.6 : 1, ...(inline ? { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 0.5, minWidth: 0 } : {}) }}>
      {inline
        ? <Typography variant="caption" color="text.secondary" sx={{ lineHeight: `${COMPACT_EDITOR_OUTER_HEIGHT}px`, minWidth: 14, textAlign: 'center', flexShrink: 0 }}>{inlineLabel}</Typography>
        : <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">{compact ? label : `${label} · 글자를 선택하고 우클릭하면 서식 패널이 열립니다`}</Typography>
          {formatButton}
        </Stack>}
      {/* 테두리는 바깥 두 Box만 그린다. CKEditor 49 기본 테마의 툴바·편집 영역 테두리·둥근 모서리·포커스 그림자는 끄고
          포커스 표시는 편집 영역을 감싼 Box 테두리 색으로 한다(겹치면 이중선·어긋남이 생김). */}
      <Box ref={toolbarRef} className="ck-reset_all" sx={{ display: toolbarHidden ? 'none' : undefined, border: '1px solid #c4c4c4', borderBottom: 0, borderRadius: '4px 4px 0 0',
        // 안쪽 배경이 바깥 둥근 테두리를 덮지 않게 안쪽 곡률(4px - 테두리 1px)에 맞춘다. 툴바 드롭다운이 잘리므로 overflow: hidden은 쓰지 않는다.
        '& .ck.ck-toolbar': { border: 0, borderRadius: '3px 3px 0 0' } }} />
      <Box sx={{ ...(inline ? { flex: 1 } : {}), minWidth: 0, border: '1px solid #c4c4c4', borderRadius: toolbarHidden ? '4px' : '0 0 4px 4px', minHeight: compact ? COMPACT_EDITOR_MIN_HEIGHT : 140,
        '&:focus-within': { borderColor: 'primary.main' },
        '& .ck.ck-editor__editable:not(.ck-editor__nested-editable), & .ck.ck-editor__editable:not(.ck-editor__nested-editable).ck-focused':
          { border: 0, borderRadius: toolbarHidden ? '3px' : '0 0 3px 3px', boxShadow: 'none' },
        '& .ck-editor__editable': { minHeight: compact ? COMPACT_EDITOR_MIN_HEIGHT : 140, px: compact ? 1 : 1.5, ...(compact ? { overflowWrap: 'anywhere', boxSizing: 'border-box' } : {}) },
        // CKEditor 기본 패딩(상하 16px)·문단 여백(12px)이 일반 선택자보다 우선해 .ck.를 붙여 줄인다.
        ...(compact ? { '& .ck.ck-editor__editable_inline': { py: 0 }, '& .ck.ck-editor__editable p': { my: 0.5 } } : {}) }}>
        {engine && config && (
          <CKEditor
            editor={engine.DecoupledEditor}
            config={config}
            data={initialHtml}
            onReady={(editor: any) => {
              editorRef.current = editor;
              const container = toolbarRef.current;
              if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
                container.appendChild(editor.ui.view.toolbar.element);
              }
              applyReadOnly(editor, Boolean(disabled));
              // 바이트 상한 기준값: 처음 내용. 커서만 옮긴 경우(내용 변경 없음)에도 되돌릴 위치를 갱신하고, 조합이 끝나면 다시 확인한다.
              const readyHtml = editor.getData();
              const readyPlain = blocksToPlainText(htmlToBlocks(readyHtml));
              lastValidRef.current = { html: readyHtml, plain: readyPlain, selection: selectionPaths(editor) };
              if (maxBytesRef.current != null) setByteNotice({ blocked: false, bytes: utf8ByteLength(readyPlain) });
              editor.model.document.selection.on('change:range', () => {
                const last = lastValidRef.current;
                if (last && !restoringRef.current && editor.model.document.differ.isEmpty) last.selection = selectionPaths(editor);
              });
              editor.editing.view.document.on('change:isComposing', (_event: unknown, _name: string, composing: boolean) => {
                if (!composing) commitChange(editor);
              });
              // 문단 들여쓰기 40px 단위 정규화(단계 수 제한 없음).
              normalizeIndent(editor);
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
            onChange={(_, editor) => commitChange(editor)}
          />
        )}
      </Box>
      {inline && formatButton}
      {maxPlainBytes != null && (byteNotice.blocked || byteNotice.bytes > maxPlainBytes) &&
        <Typography variant="caption" color="error" role="status" sx={{ display: 'block', ...(inline ? { flexBasis: '100%' } : {}) }}>
          {byteNotice.bytes > maxPlainBytes ? byteLimitMessage(maxPlainBytes, byteNotice.bytes) + ' 줄여 주세요.' : byteLimitMessage(maxPlainBytes) + ' 넘는 입력은 반영되지 않습니다.'}
        </Typography>}
      <PopupRichTextMenu position={menuPosition} state={formatState} onApply={applyMenu} onClose={closeMenu} />
    </Box>
  );
}
