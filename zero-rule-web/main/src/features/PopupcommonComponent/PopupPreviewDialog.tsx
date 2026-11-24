import type { AdminPopupDetail } from '@local/domain';
import { Box, Button, Dialog, DialogContent, MenuItem, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import PopupPreview from './PopupPreview';
import type { Size } from './imagePreviewLayout';
import {
  PREVIEW_SCREEN_PRESETS, type PreviewScreenKey, previewDialogSize, previewOverlay, previewPositionAlign,
  previewShadowMargin, previewWorkArea, readBrowserViewport, readScreenWorkArea,
} from './popupPreviewDialogLayout';

/**
 * POL-08-01 : 공통 렌더러
 * POL-08-03 : Dialog 호환
 * POL-02-02 : 종료 제어
 * ■ 실제 크기 미리보기 모달 입력값
 * - in : popup · open · recommendedSize? · showPlaceholders? (PopupPreviewDialog 설명 참고)
 * - out: onClose
 * - PopupPreviewDialog가 받는 props 형식을 정의한다.
 */
export interface PopupPreviewDialogProps {
  popup: AdminPopupDetail;
  open: boolean;
  onClose: () => void;
  /** 인라인 미리보기가 이미 계산한 IMAGE 권장 창 크기(선택, 현재 모니터 기준). 모달 안 미리보기가 계산하기 전 첫 표시에 쓴다. */
  recommendedSize?: Size | null;
  /** 예시 표시(값이 없는 항목의 입력 안내 문구·영상 영역 안내 문구). 기본 false(OFF): 인라인 미리보기·WPF와 같은 기준. 가이드·샘플만 켠다. */
  showPlaceholders?: boolean;
}

const sameSize = (a: Size, b: Size) => a.width === b.width && a.height === b.height;
/** 기준 화면 선택박스에 쓰는 'W×H' 표기. */
export const formatPreviewSize = (size: Size) => `${Math.round(size.width)}×${Math.round(size.height)}`;
/** 해상도 화면 작업 표시줄 색. */
const VIRTUAL_TASKBAR = '#1e293b';

/**
 * POL-08-01 : 공통 렌더러
 * POL-08-03 : Dialog 호환
 * POL-02-02 : 종료 제어
 * ■ 실제 크기 미리보기 모달
 * - in : popup(AdminPopupDetail) 미리 볼 팝업 · open(boolean) 모달 열림 여부 · recommendedSize?(Size | null) 인라인 미리보기가 계산한 IMAGE 권장 창 크기
 * - out: onClose() 종료 버튼·Esc·(Overlay 미사용 시) 배경 클릭·팝업 안 닫기 동작 · 화면: 실제 크기 팝업 또는 가상 화면, 배경 Overlay, '기준 화면' 선택박스, "미리보기 종료 (Esc)" 버튼
 * - 팝업 정보를 받아 크기 모드·9개 위치·배경 Overlay를 WPF와 같이 적용한 모달로 PopupPreview를 보여준다.
 *   '기준 화면' 선택(TODO61-23, 2026-11-24):
 *   · 현재 모니터: 팝업 크기를 현재 모니터 작업 영역(screen.availWidth/availHeight)으로 계산하고 브라우저에 실제 크기로 그린다.
 *     배경·배치는 브라우저 표시 영역이며, 브라우저보다 크면 줄이지 않고 모달 바깥 영역에 스크롤을 만든다.
 *   · 해상도 프리셋: 그 해상도 크기의 화면(작업 영역 + 작업 표시줄)을 실제 크기로 그리고 팝업을 그 안에 WPF와 같은 크기·위치로 놓는다.
 *     해상도를 바꾸면 팝업이 화면 대비 커지거나 작아지고, 90% 상한에 걸리면 실제로 줄어드는 것을 비교할 수 있다.
 *     화면이 브라우저보다 크면 화면 영역에 가로·세로 스크롤을 만든다(축소하지 않음). FULLSCREEN은 화면 전체(작업 표시줄 포함)를 덮는다.
 *   선택은 이 모달의 미리보기 상태로만 남고 popup·저장 데이터에 들어가지 않는다.
 *   입력 폼·저장 API에 의존하지 않으며 전달받은 popup을 바꾸지 않는다.
 *   설문 응답 등 시연 상태는 모달 안 PopupPreview에만 있고, 닫으면 내용이 언마운트되어 다시 열 때 초기화된다.
 */
export default function PopupPreviewDialog({ popup, open, onClose, recommendedSize = null, showPlaceholders = false }: PopupPreviewDialogProps) {
  const [viewport, setViewport] = useState<Size>(readBrowserViewport);
  const [screenWorkArea, setScreenWorkArea] = useState<Size>(readScreenWorkArea);
  const [screenKey, setScreenKey] = useState<PreviewScreenKey>('CURRENT');
  const [measuredSize, setMeasuredSize] = useState<Size | null>(null);
  useEffect(() => {
    if (!open) { setMeasuredSize(null); return; }
    // 브라우저 창 크기·F11·확대율·모니터 이동은 resize로 알 수 있다. 값이 같으면 상태를 바꾸지 않아 재계산 반복을 막는다.
    const resize = () => {
      setViewport((previous) => { const next = readBrowserViewport(); return sameSize(previous, next) ? previous : next; });
      setScreenWorkArea((previous) => { const next = readScreenWorkArea(); return sameSize(previous, next) ? previous : next; });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open]);
  const preset = PREVIEW_SCREEN_PRESETS.find((item) => item.key === screenKey) ?? null;
  const workArea = previewWorkArea(screenKey, screenWorkArea);
  // 측정값은 지우지 않는다: 모달 안 PopupPreview가 바뀐 workArea로 다시 계산해 값이 달라질 때만 알린다(같으면 기존 값이 그대로 맞다).
  const changeScreen = (key: PreviewScreenKey) => setScreenKey(key);

  const fullScreen = popup.sizeMode === 'FULLSCREEN';
  const overlay = previewOverlay(popup);
  /* WPF와 같이 FULLSCREEN은 위치를 무시하고, 그 밖에는 9개 위치에 맞춰 가장자리에 붙인다. */
  const [alignX, alignY] = previewPositionAlign(popup);
  // 인라인 미리보기의 권장 크기(recommendedSize)는 현재 모니터 기준이라, 프리셋을 고르면 모달 안 PopupPreview가 다시 계산할 때까지 쓰지 않는다.
  const target = previewDialogSize(popup, measuredSize ?? (screenKey === 'CURRENT' ? recommendedSize : null), workArea);
  // 브라우저보다 큰 축은 바깥(모달 컨테이너)에 스크롤을 두고, 그 축은 가장자리 정렬 대신 시작점에 붙여 잘리지 않게 한다.
  const overflowX = target.width > viewport.width, overflowY = target.height > viewport.height;
  const radius = previewShadowMargin(popup) ? 0 : '6px';
  const preview = <PopupPreview popup={popup} showBackground={false} showPlaceholders={showPlaceholders} onClose={onClose} onRecommendedSize={setMeasuredSize} workArea={workArea} />;

  // 해상도 화면의 FULLSCREEN 창은 작업 표시줄까지 덮는 표시 해상도 크기다.
  const virtualWindow = preset && fullScreen ? preset.display : target;
  // 해상도를 바꾸거나 팝업 크기가 바뀌면 스크롤을 팝업 가운데로 맞춘다(큰 화면은 왼쪽 위부터 그려지므로 팝업이 가장자리에 걸리지 않게).
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open || !preset) return;
    const frame = requestAnimationFrame(() => {
      const container = scrollRef.current, popupWindow = windowRef.current;
      if (!container || !popupWindow) return;
      const c = container.getBoundingClientRect(), w = popupWindow.getBoundingClientRect();
      container.scrollLeft += (w.left + w.width / 2) - (c.left + c.width / 2);
      container.scrollTop += (w.top + w.height / 2) - (c.top + c.height / 2);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, preset, virtualWindow.width, virtualWindow.height]);

  const screenSelect = (
    <TextField select size="small" label="기준 화면" value={screenKey} onChange={(event) => changeScreen(event.target.value as PreviewScreenKey)}
      sx={{ minWidth: 260, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3 }}>
      <MenuItem value="CURRENT">현재 모니터 (작업 영역 {formatPreviewSize(screenWorkArea)})</MenuItem>
      {PREVIEW_SCREEN_PRESETS.map((item) => (
        <MenuItem key={item.key} value={item.key}>
          {formatPreviewSize(item.display)} (작업 영역 {formatPreviewSize(item.workArea)})
        </MenuItem>
      ))}
    </TextField>
  );
  const exitButton = (
    <Button variant="contained" color="primary" aria-label="실제 크기 미리보기 종료" onClick={onClose} sx={{ boxShadow: 3 }}>
      미리보기 종료 (Esc)
    </Button>
  );
  const toolsSx = { position: 'fixed', right: 12, zIndex: (theme: { zIndex: { modal: number } }) => theme.zIndex.modal + 1,
    display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 'calc(100vw - 24px)' } as const;

  if (preset) {
    return (
      <Dialog open={open} onClose={() => onClose()} fullScreen maxWidth={false}
        // 배경은 현재 모니터 모드와 같은 팝업 Background Overlay(기본 0.45, 끄면 투명)라 뒤의 관리자 화면이 그대로 비친다(2026-11-24).
        slotProps={{ backdrop: { sx: { backgroundColor: overlay.enabled ? `rgba(0, 0, 0, ${overlay.opacity})` : 'transparent' } },
          paper: { sx: { bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none', overflow: 'hidden' } } }}>
        {/* 도구는 따로 자리를 잡지 않고 화면 위에 띄운다(위쪽 배치 팝업이면 아래로). 자리·여백을 잡으면 브라우저와 같은 해상도에서도 스크롤이 생긴다. */}
        <Box data-testid="preview-dialog-tools" sx={{ ...toolsSx, ...(!fullScreen && alignY === 'flex-start' ? { bottom: 12 } : { top: 12 }) }}>
          {screenSelect}
          {exitButton}
        </Box>
        {/* 화면이 브라우저보다 큰 축에만 스크롤이 생긴다. 작은 화면은 가운데(margin auto), 큰 화면은 왼쪽 위부터 그려 잘리지 않고 처음 스크롤은 팝업 가운데.
            폭이 브라우저에 들어가면 가로 스크롤을 만들지 않는다: 세로 스크롤바(약 15px)가 생겨도 가로 스크롤이 덧붙지 않게 하고, 오른쪽 끝 스크롤바 폭만큼은 가려진다. */}
        <Box data-testid="preview-virtual-scroll" ref={scrollRef}
          sx={{ position: 'absolute', inset: 0, overflowX: preset.display.width > viewport.width ? 'auto' : 'hidden',
            overflowY: preset.display.height > viewport.height ? 'auto' : 'hidden', display: 'flex' }}>
          <Box data-testid="preview-virtual-screen"
            sx={{ width: preset.display.width, height: preset.display.height, position: 'relative', overflow: 'hidden', flexShrink: 0, m: 'auto',
              outline: '2px dashed rgba(255, 255, 255, 0.85)', outlineOffset: '-2px' }}>
            {/* 바탕은 투명: 해상도 화면 안에서도 관리자 화면이 비친다. 경계는 점선 테두리와 작업 표시줄로만 표시한다. */}
            <Box sx={{ width: preset.display.width, height: preset.display.height, position: 'relative' }}>
              {/* 작업 표시줄: 표시 해상도 - 작업 영역 높이(프리셋 가정 40). */}
              <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: preset.display.height - preset.workArea.height, bgcolor: VIRTUAL_TASKBAR }} />
              <Box data-testid="preview-virtual-work-area"
                sx={{ position: 'absolute', left: 0, top: 0, width: fullScreen ? preset.display.width : preset.workArea.width,
                  height: fullScreen ? preset.display.height : preset.workArea.height, display: 'flex',
                  justifyContent: fullScreen ? 'flex-start' : alignX, alignItems: fullScreen ? 'flex-start' : alignY }}>
                <Box data-testid="preview-popup-window" ref={windowRef}
                  sx={{ position: 'relative', width: virtualWindow.width, height: virtualWindow.height, flexShrink: 0, overflow: 'hidden',
                    borderRadius: fullScreen ? 0 : radius, display: 'flex', flexDirection: 'column' }}>
                  {preview}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
    );
  }

  /* WPF와 같이 Paper = 창 크기이고, 일반 창은 PopupPreview가 그 안에 그림자 여백 24px를 두고 흰 판·그림자를 그린다(previewShadowMargin).
   * 그래서 Paper 자체는 투명·그림자 없음이고, 창이 브라우저 표시 영역 가장자리에 바로 붙는다(WPF 창 위치와 같음, 2026-11-17). */
  /* MUI 6.4.1+ Dialog slotProps(backdrop·paper). deprecated BackdropProps·PaperProps 대신 한 객체로 넘긴다.
   * FULLSCREEN은 Paper 크기를 지정하지 않는다(paper: undefined). */
  const slotProps = {
    backdrop: { sx: { backgroundColor: overlay.enabled ? `rgba(0, 0, 0, ${overlay.opacity})` : 'transparent' } },
    // 영상 창은 WPF처럼 그림자가 없고(ApplyVideoWindowSurface), 일반 창 그림자는 안쪽 흰 판이 그리므로 Paper 그림자는 항상 없다.
    // 화면 상한은 previewDialogSize(작업 영역)가 이미 적용했다. 브라우저보다 커도 줄이지 않고(최대 크기 제한 없음) 컨테이너 스크롤로 본다(TODO61-23).
    paper: fullScreen ? undefined : { sx: { width: target.width, height: target.height, borderRadius: radius, bgcolor: 'transparent',
      boxShadow: 'none', maxWidth: 'none', maxHeight: 'none', m: 0, flexShrink: 0, overflow: 'hidden' } },
  };

  return (
    <Dialog open={open} onClose={(_, reason) => {
      if (reason !== 'backdropClick' || !overlay.enabled) onClose();
    }} slotProps={slotProps} fullScreen={fullScreen} maxWidth={false}
      sx={fullScreen ? undefined : { '& .MuiDialog-container': { justifyContent: overflowX ? 'flex-start' : alignX, alignItems: overflowY ? 'flex-start' : alignY,
        overflow: overflowX || overflowY ? 'auto' : undefined } }}>
      {/* 헤더 닫기 버튼이 없으므로(WPF와 동일) 푸터를 숨겨도 종료 버튼과 Esc로 미리보기를 닫는다. 위쪽 배치 팝업과 겹치지 않게 아래로 옮긴다.
          도구 묶음(기준 화면 선택 + 종료 버튼)은 화면 위에 떠 있어 팝업 표시 공간을 줄이지 않는다(TODO61-23). */}
      <Box data-testid="preview-dialog-tools" sx={{ ...toolsSx, ...(!fullScreen && alignY === 'flex-start' ? { bottom: 12 } : { top: 12 }) }}>
        {screenSelect}
        {exitButton}
      </Box>
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>{preview}</DialogContent>
    </Dialog>
  );
}
