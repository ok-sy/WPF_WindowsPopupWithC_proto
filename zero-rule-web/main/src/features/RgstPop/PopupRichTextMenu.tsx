import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import {
  Box, Button, ClickAwayListener, Divider, IconButton, NativeSelect, Paper, Popper, Stack, Tooltip, Typography, type PopoverPosition,
} from '@mui/material';
import { useEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { RICH_COLOR_COLUMNS, RICH_COLORS, RICH_FONTS, RICH_SIZES, RICH_MAX_INDENT, type RichFontId } from './popupRichText';
import { fontIdFromModel, sizeFromModel, type FormatAction, type FormatState } from './popupRichTextFormat';

type Props = {
  /** 우클릭 위치 또는 '서식' 버튼·커서 아래. null이면 닫힘. */
  position: PopoverPosition | null;
  state: FormatState | null;
  onApply: (action: FormatAction) => void;
  onClose: () => void;
};

const ALIGNMENTS = [
  { value: 'left', label: '왼쪽 정렬', Icon: FormatAlignLeftIcon },
  { value: 'center', label: '가운데 정렬', Icon: FormatAlignCenterIcon },
  { value: 'right', label: '오른쪽 정렬', Icon: FormatAlignRightIcon },
] as const;

/*
 * [설계 49] 우클릭·'서식' 버튼·키보드 공통 서식 패널(설계 28 §11 메뉴를 펼침 팔레트로 개편).
 * 색 격자를 항상 펼쳐 두고 글꼴·크기·글자 서식·문단 서식·색 초기화·서식 초기화를 고른다(TODO62).
 * 서식을 적용해도 패널은 열린 채로 남아 연속 적용할 수 있고, 적용 대상은 편집기 모델의 선택 범위다(패널 조작 중에도 유지).
 * Esc·바깥 클릭으로 닫으면 편집기 커서·선택으로 돌아간다. 화면 경계 보정은 Popper(flip·preventOverflow)가 한다.
 * 키보드: 열리면 색 격자로 포커스, 격자 안은 방향키·Home/End로 이동, Tab으로 다음 묶음, Enter/Space로 적용.
 * 선택이 섞여 있으면 '혼합'으로 표시하고 어느 값도 선택 상태로 보이지 않는다.
 */
export default function PopupRichTextMenu({ position, state, onApply, onClose }: Props) {
  const open = position != null;
  const paperRef = useRef<HTMLDivElement | null>(null);
  const mixed = (key: keyof Omit<FormatState, 'paragraph'>) => Boolean(state?.[key].mixed);
  const color = state && !state.fontColor.mixed ? ((state.fontColor.value as string | null) ?? null) : undefined;
  const size = state && !state.fontSize.mixed ? sizeFromModel(state.fontSize.value) : undefined;
  const font = state && !state.fontFamily.mixed ? fontIdFromModel(state.fontFamily.value) : undefined;
  const colorIndex = RICH_COLORS.findIndex((item) => item.color === color?.toUpperCase());
  const colorLabel = color === undefined ? '혼합' : color === null ? '기본 색' : RICH_COLORS[colorIndex]?.label ?? color;

  /* 마우스 위치(가상 기준 요소)에 붙인다. */
  const anchor = useMemo(() => position && {
    getBoundingClientRect: () => DOMRect.fromRect({ x: position.left, y: position.top, width: 0, height: 0 }),
  }, [position]);

  /* 열릴 때 현재 색(없으면 첫 색) 칸으로 포커스를 옮긴다. */
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      const cells = paperRef.current?.querySelectorAll<HTMLButtonElement>('[data-color-cell]');
      cells?.[Math.max(0, colorIndex)]?.focus();
    });
    return () => window.clearTimeout(timer);
    // 열린 동안 색이 바뀌어도 포커스를 다시 옮기지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, position]);

  /* Esc는 포커스가 패널 밖(편집기)에 있어도 닫는다. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  /* 색 격자 방향키 이동(행 우선, RICH_COLOR_COLUMNS열). */
  const moveInGrid = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = RICH_COLORS.length - 1;
    const next = ({
      ArrowRight: Math.min(last, index + 1), ArrowLeft: Math.max(0, index - 1),
      ArrowDown: index + RICH_COLOR_COLUMNS <= last ? index + RICH_COLOR_COLUMNS : index,
      ArrowUp: index - RICH_COLOR_COLUMNS >= 0 ? index - RICH_COLOR_COLUMNS : index,
      Home: 0, End: last,
    } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    paperRef.current?.querySelectorAll<HTMLButtonElement>('[data-color-cell]')[next]?.focus();
  };

  const toggle = (key: 'bold' | 'italic' | 'underline' | 'strikethrough', label: string, icon: ReactNode) => {
    const on = state?.[key].value === true && !mixed(key);
    return (
      <Tooltip title={`${label}${mixed(key) ? ' (혼합)' : ''}`} disableInteractive>
        <IconButton size="small" aria-label={`${label}${mixed(key) ? ' (혼합)' : ''}`} aria-pressed={mixed(key) ? 'mixed' : on}
          onClick={() => onApply({ type: 'toggle', key })}
          sx={{ borderRadius: 1, border: '1px solid', borderColor: on ? 'primary.main' : 'divider', bgcolor: on ? 'action.selected' : undefined,
            opacity: mixed(key) ? 0.65 : 1 }}>
          {icon}
        </IconButton>
      </Tooltip>
    );
  };
  const paragraph = state?.paragraph;
  const paragraphButton = (label: string, icon: ReactNode, action: FormatAction, enabled: boolean, selected?: boolean | 'mixed') => (
    <Tooltip title={`${label}${selected === 'mixed' ? ' (혼합)' : ''}`} describeChild disableInteractive>
      <span><IconButton size="small" aria-label={label} disabled={!enabled} aria-pressed={selected}
        onClick={() => onApply(action)}
        sx={{ borderRadius: 1, border: '1px solid', borderColor: selected === true ? 'primary.main' : 'divider',
          bgcolor: selected === true ? 'action.selected' : undefined }}>
        {icon}
      </IconButton></span>
    </Tooltip>
  );
  const selectSx = { fontSize: 13, '& select': { py: 0.5 } };

  return (
    <Popper open={open} anchorEl={anchor} placement="bottom-start" sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      modifiers={[{ name: 'offset', options: { offset: [0, 4] } }, { name: 'preventOverflow', options: { padding: 8, altAxis: true } },
        { name: 'flip', options: { padding: 8 } }]}>
      <ClickAwayListener onClickAway={onClose}>
        <Paper ref={paperRef} elevation={8} role="dialog" aria-label="서식" sx={{ p: 1.5, width: 292 }}
          // 우클릭은 브라우저 메뉴 대신 아무 동작도 하지 않는다(패널 위 우클릭으로 다시 열리지 않게).
          onContextMenu={(event) => event.preventDefault()}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="caption" fontWeight={700} id="popup-rich-color-label">글자 색</Typography>
            <Typography variant="caption" color="text.secondary" aria-live="polite">{colorLabel}</Typography>
          </Stack>
          <Box role="group" aria-labelledby="popup-rich-color-label"
            sx={{ display: 'grid', gridTemplateColumns: `repeat(${RICH_COLOR_COLUMNS}, 1fr)`, gap: '4px' }}>
            {RICH_COLORS.map((item, index) => {
              const selected = index === colorIndex;
              return (
                <Box key={item.color} component="button" type="button" data-color-cell aria-label={`글자 색 ${item.label}`} aria-pressed={selected}
                  title={item.label} tabIndex={index === Math.max(0, colorIndex) ? 0 : -1}
                  onClick={() => onApply({ type: 'color', value: item.color })} onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => moveInGrid(event, index)}
                  sx={{ width: '100%', aspectRatio: '1', minHeight: 26, p: 0, cursor: 'pointer', borderRadius: '4px', bgcolor: item.color,
                    border: '1px solid rgba(0,0,0,.18)', outline: selected ? '2px solid' : 'none', outlineColor: 'primary.main', outlineOffset: '1px',
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: '1px' } }} />
              );
            })}
          </Box>
          <Button size="small" fullWidth variant={color === null ? 'contained' : 'outlined'} color="inherit" aria-pressed={color === null}
            onClick={() => onApply({ type: 'color', value: null })} sx={{ mt: 1, fontSize: 12, py: 0.25 }}>
            색 초기화(기본 색)
          </Button>
          <Divider sx={{ my: 1.25 }} />
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <NativeSelect fullWidth value={font === undefined ? 'mixed' : font ?? ''} sx={{ ...selectSx, flex: 3 }}
              inputProps={{ 'aria-label': `글꼴${mixed('fontFamily') ? ' (혼합)' : ''}` }}
              onChange={(event) => onApply({ type: 'font', value: (event.target.value || null) as RichFontId | null })}>
              {font === undefined && <option value="mixed" disabled>혼합</option>}
              <option value="">기본 글꼴</option>
              {RICH_FONTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </NativeSelect>
            <NativeSelect fullWidth value={size === undefined ? 'mixed' : size ?? ''} sx={{ ...selectSx, flex: 2 }}
              inputProps={{ 'aria-label': `크기${mixed('fontSize') ? ' (혼합)' : ''}` }}
              onChange={(event) => onApply({ type: 'size', value: event.target.value ? Number(event.target.value) : null })}>
              {size === undefined && <option value="mixed" disabled>혼합</option>}
              <option value="">기본</option>
              {RICH_SIZES.map((value) => <option key={value} value={value}>{value}</option>)}
            </NativeSelect>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {toggle('bold', '굵게', <FormatBoldIcon fontSize="small" />)}
            {toggle('italic', '기울임', <FormatItalicIcon fontSize="small" />)}
            {toggle('underline', '밑줄', <FormatUnderlinedIcon fontSize="small" />)}
            {toggle('strikethrough', '취소선', <StrikethroughSIcon fontSize="small" />)}
          </Stack>
          <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 1, mb: 0.5, fontSize: 11 }}>
            문단 · 들여쓰기 {paragraph?.indent.mixed ? '혼합' : `${paragraph?.indent.value ?? 0} / ${RICH_MAX_INDENT}`}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" role="group" aria-label="문단 서식">
            {paragraphButton('내어쓰기', <FormatIndentDecreaseIcon fontSize="small" />, { type: 'indent', direction: 'out' }, Boolean(paragraph?.canOutdent))}
            {paragraphButton('들여쓰기', <FormatIndentIncreaseIcon fontSize="small" />, { type: 'indent', direction: 'in' }, Boolean(paragraph?.canIndent))}
            <Divider orientation="vertical" flexItem />
            {ALIGNMENTS.map(({ value, label, Icon }) => (
              <Box key={value}>
                {paragraphButton(label, <Icon fontSize="small" />,
                  { type: 'alignment', value }, Boolean(paragraph?.canAlign),
                  paragraph?.alignment.mixed ? 'mixed' : paragraph?.alignment.value === value)}
              </Box>
            ))}
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Button size="small" fullWidth color="inherit" startIcon={<FormatClearIcon fontSize="small" />} onClick={() => onApply({ type: 'clear' })}
            sx={{ fontSize: 12 }}>
            서식 초기화
          </Button>
          <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 1, fontSize: 11, lineHeight: 1.5 }}>
            Esc·바깥 클릭으로 닫기 · 복사·붙여넣기는 Ctrl+C / Ctrl+V, 브라우저 기본 메뉴는 Shift+우클릭
          </Typography>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
