import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { Box, Divider, ListSubheader, Menu, MenuItem, type PopoverPosition } from '@mui/material';
import type { ReactNode } from 'react';
import { RICH_COLORS, RICH_FONTS, RICH_SIZES } from './popupRichText';
import { fontIdFromModel, sizeFromModel, type FormatAction, type FormatState } from './popupRichTextFormat';

type Props = {
  /** 우클릭 위치 또는 '서식' 버튼 아래. null이면 닫힘. */
  position: PopoverPosition | null;
  state: FormatState | null;
  onApply: (action: FormatAction) => void;
  onClose: () => void;
};

/*
 * [설계 28 §11] 우클릭·'서식' 버튼 공통 서식 메뉴.
 * 모든 항목을 MenuItem 직계 자식으로 두어 방향키 이동·Enter 적용·Esc 닫기·바깥 클릭 닫기·화면 경계 보정(MUI)을 그대로 쓴다.
 * 선택이 섞여 있으면 '혼합'으로 표시하고 어느 값도 선택 상태로 보이지 않는다.
 */
export default function PopupRichTextMenu({ position, state, onApply, onClose }: Props) {
  const apply = (action: FormatAction) => { onClose(); onApply(action); };
  const mixed = (key: keyof FormatState) => Boolean(state?.[key].mixed);
  const color = state && !state.fontColor.mixed ? (state.fontColor.value as string | null) : undefined;
  const size = state && !state.fontSize.mixed ? sizeFromModel(state.fontSize.value) : undefined;
  const font = state && !state.fontFamily.mixed ? fontIdFromModel(state.fontFamily.value) : undefined;
  const header = (text: string, key: keyof FormatState) => (
    <ListSubheader sx={{ width: '100%', lineHeight: '28px', bgcolor: 'background.paper' }}>
      {text}{mixed(key) ? ' · 혼합' : ''}
    </ListSubheader>
  );
  const toggle = (key: 'bold' | 'italic' | 'underline', label: string, icon: ReactNode) => (
    <MenuItem dense aria-label={`${label}${mixed(key) ? ' (혼합)' : ''}`} selected={state?.[key].value === true && !mixed(key)}
      onClick={() => apply({ type: 'toggle', key })} sx={{ width: '33.33%', justifyContent: 'center', opacity: mixed(key) ? 0.6 : 1 }}>
      {icon}
    </MenuItem>
  );
  const chip = { width: '25%', justifyContent: 'center', fontSize: 13 };

  return (
    <Menu open={position != null} onClose={onClose} anchorReference="anchorPosition" anchorPosition={position ?? undefined}
      // 메뉴를 닫을 때 포커스를 원래 요소로 돌리지 않는다. 적용 후 편집기 커서로 복귀하는 것은 onApply에서 처리한다.
      disableRestoreFocus
      MenuListProps={{ dense: true, 'aria-label': '서식', sx: { width: 280, display: 'flex', flexWrap: 'wrap', py: 0.5 } }}>
      {header('글자 모양', 'bold')}
      {toggle('bold', '굵게', <FormatBoldIcon fontSize="small" />)}
      {toggle('italic', '기울임', <FormatItalicIcon fontSize="small" />)}
      {toggle('underline', '밑줄', <FormatUnderlinedIcon fontSize="small" />)}
      {header('글자 색', 'fontColor')}
      {RICH_COLORS.map((item) => (
        <MenuItem key={item.color} dense aria-label={`글자 색 ${item.label}`} selected={color === item.color}
          onClick={() => apply({ type: 'color', value: item.color })} sx={chip}>
          <Box sx={{ width: 18, height: 18, borderRadius: '4px', bgcolor: item.color, border: '1px solid rgba(0,0,0,.15)' }} />
        </MenuItem>
      ))}
      <MenuItem dense selected={color === null} onClick={() => apply({ type: 'color', value: null })} sx={{ width: '100%', fontSize: 13 }}>
        색 초기화(기본 색)
      </MenuItem>
      {header('크기', 'fontSize')}
      <MenuItem dense selected={size === null} onClick={() => apply({ type: 'size', value: null })} sx={chip}>기본</MenuItem>
      {RICH_SIZES.map((value) => (
        <MenuItem key={value} dense aria-label={`크기 ${value}`} selected={size === value}
          onClick={() => apply({ type: 'size', value })} sx={chip}>{value}</MenuItem>
      ))}
      {header('글꼴', 'fontFamily')}
      <MenuItem dense selected={font === null} onClick={() => apply({ type: 'font', value: null })} sx={{ width: '50%', fontSize: 13 }}>기본 글꼴</MenuItem>
      {RICH_FONTS.map((item) => (
        <MenuItem key={item.id} dense selected={font === item.id} onClick={() => apply({ type: 'font', value: item.id })}
          sx={{ width: '50%', fontSize: 13, fontFamily: item.css }}>{item.label}</MenuItem>
      ))}
      <Divider sx={{ width: '100%' }} />
      <MenuItem dense onClick={() => apply({ type: 'clear' })} sx={{ width: '100%', gap: 1, fontSize: 13 }}>
        <FormatClearIcon fontSize="small" /> 서식 지우기
      </MenuItem>
      <ListSubheader sx={{ width: '100%', lineHeight: '20px', py: 0.5, fontSize: 11, color: 'text.secondary', bgcolor: 'background.paper' }}>
        복사·붙여넣기는 Ctrl+C / Ctrl+V, 브라우저 기본 메뉴는 Shift+우클릭
      </ListSubheader>
    </Menu>
  );
}
