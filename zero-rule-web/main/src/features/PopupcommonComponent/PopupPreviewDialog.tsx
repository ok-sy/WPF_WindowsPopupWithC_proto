import type { AdminPopupDetail } from '@local/domain';
import { Box, Button, Dialog, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PopupPreview from './PopupPreview';
import type { Size } from './imagePreviewLayout';
import {
  DEFAULT_PREVIEW_DISPLAY_MODE, PREVIEW_SCREEN_PRESETS, PREVIEW_SCREEN_SCALES, type PreviewDisplayMode, type PreviewScreenKey, type PreviewScreenScale,
  currentPreviewScale, currentPreviewScreen, initialPreviewScale, initialPreviewScreen,
  previewDialogSize, previewFitScale, previewOverlay, previewPositionAlign, previewScreenPreset, previewShadowMargin, readBrowserViewport,
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
  /**
   * 인라인 미리보기가 계산한 IMAGE 권장 창 크기. 2026-11-24부터 모달은 선택한 기준 화면 작업 영역으로 권장 크기를 다시 계산하므로 쓰지 않는다.
   * 기존 호출부(RgstPop·IS063 샘플 등)가 넘기는 값과의 호환을 위해 남겨 둔다.
   */
  recommendedSize?: Size | null;
  /** 예시 표시(값이 없는 항목의 입력 안내 문구·영상 영역 안내 문구). 기본 false(OFF): 인라인 미리보기·WPF와 같은 기준. 가이드·샘플만 켠다. */
  showPlaceholders?: boolean;
}

const sameSize = (a: Size, b: Size) => a.width === b.width && a.height === b.height;
/** 내 화면의 CSS px당 물리 픽셀(Windows 배율 × 브라우저 확대율). 읽을 수 없으면 1. */
const readPixelRatio = () => {
  const ratio = typeof window === 'undefined' ? NaN : Number(window.devicePixelRatio);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
};
/** 기준 화면 선택박스에 쓰는 'W×H' 표기. */
export const formatPreviewSize = (size: Size) => `${Math.round(size.width)}×${Math.round(size.height)}`;
/** 해상도 화면(가상 데스크톱) 작업 영역 바탕. 불투명 흰색(#FFFFFF)이라 팝업 뒤에 등록 폼이 비치지 않는다. */
export const VIRTUAL_DESKTOP = '#ffffff';
/** 작업 표시줄 영역(표시 해상도 - 작업 영역 높이). 검정(#000000) 불투명 단색으로 구분한다. */
export const VIRTUAL_TASKBAR = '#000000';
/** 해상도 화면 바깥. 낮은 불투명도의 검정으로 뒤의 관리자 화면이 어둡게 비치고, 불투명 데스크톱과의 차이가 화면 끝이 된다(테두리 없음). */
export const VIRTUAL_OUTSIDE = 'rgba(0, 0, 0, 0.3)';
/** 표시 모드 이름. 도구 패널 토글과 안내 문구에 같이 쓴다. */
export const PREVIEW_DISPLAY_MODE_LABEL: Record<PreviewDisplayMode, string> = { layout: '레이아웃 확인', fit: '화면 비율 확인' };
/** 두 모드 공통 안내. 프리셋은 대상 해상도·배율의 논리 레이아웃이며 대상 모니터의 물리 크기까지 재현하지 않는다. */
export const PREVIEW_SCREEN_NOTICE = '선택한 해상도·Windows 배율의 가상 화면입니다. 실제 모니터 크기·확대 설정에 따라 표시 크기가 다를 수 있습니다.';

/**
 * POL-08-01 : 공통 렌더러
 * POL-08-03 : Dialog 호환
 * POL-02-02 : 종료 제어
 * ■ 실제 크기 미리보기 모달
 * - in : popup(AdminPopupDetail) 미리 볼 팝업 · open(boolean) 모달 열림 여부
 * - out: onClose() 종료 버튼·Esc·팝업 안 닫기 동작 · 화면: 기준 화면(가상 데스크톱) 위 실제 크기 팝업, 팝업 Background Overlay, '기준 화면' 선택박스, "미리보기 종료 (Esc)" 버튼
 * - 팝업 정보를 받아 크기 모드·9개 위치·배경 Overlay를 WPF와 같이 적용해 보여준다(TODO61-23, 2026-11-24).
 *   · 기준 화면: 해상도 프리셋(1366×768·1920×1080·2560×1440) × Windows 배율(100·125·150·175%). 화면·작업 영역은 DIP(해상도 ÷ 배율, 작업 표시줄 40 제외).
 *     처음에는 내 모니터 물리 해상도·배율과 같은 프리셋, 없으면 1920×1080·100%.
 *   · 데스크톱 배경: 선택한 표시 해상도 크기의 불투명 단색 화면을 가운데 놓고, 바깥은 한 톤 어두운 단색으로 안팎 색 차이가 화면 끝이 된다.
 *     팝업 뒤에 등록 폼이 비치지 않고 점선 테두리도 없다.
 *   · 작업 영역: 팝업 크기·위치는 선택한 작업 영역 기준(WPF와 같은 상한). 작업 표시줄은 프리셋에서 제외한 높이만큼 은은한 색 차이.
 *     FULLSCREEN은 표시 해상도 전체를 쓴다.
 *   · 팝업 오버레이: 가상 데스크톱 위에서 재현하고, 끄면 데스크톱 바탕이 보인다.
 *   · 표시 모드(2026-11-27 TODO61-23 후속): 레이아웃 확인(기본) / 화면 비율 확인 토글과 해상도·배율·모드 안내 문구.
 *   · 레이아웃 확인: 화면을 실제 크기로 그리고, 브라우저보다 큰 축에만 스크롤을 둔다(축소하지 않음). 해상도·팝업 크기가 바뀌면 처음 스크롤은 팝업 가운데.
 *     화면이 잘리면 '가상 화면 일부만 보임'을 안내해 팝업 본문 스크롤과 구분한다.
 *   · 화면 비율 확인: 같은 DIP 레이아웃(팝업 크기·줄바꿈·본문 스크롤)을 그대로 두고 가상 화면 전체를 한 축척으로 줄여 브라우저에 맞춘다(확대 없음, 바깥 스크롤 없음).
 *   선택은 이 모달의 미리보기 상태로만 남고 popup·저장 데이터에 들어가지 않는다.
 *   입력 폼·저장 API에 의존하지 않으며 전달받은 popup을 바꾸지 않는다.
 *   설문 응답 등 시연 상태는 모달 안 PopupPreview에만 있고, 닫으면 내용이 언마운트되어 다시 열 때 초기화된다.
 */
export default function PopupPreviewDialog({ popup, open, onClose, showPlaceholders = false }: PopupPreviewDialogProps) {
  const [viewport, setViewport] = useState<Size>(readBrowserViewport);
  const [screenKey, setScreenKey] = useState<PreviewScreenKey>(initialPreviewScreen);
  const [screenScale, setScreenScale] = useState<PreviewScreenScale>(initialPreviewScale);
  const [displayMode, setDisplayMode] = useState<PreviewDisplayMode>(DEFAULT_PREVIEW_DISPLAY_MODE);
  const [measuredSize, setMeasuredSize] = useState<Size | null>(null);
  const [pixelRatio, setPixelRatio] = useState<number>(readPixelRatio);
  // 내 모니터와 같은 해상도·배율 항목에 * 표시. resize(확대율·모니터 이동)로 pixelRatio·viewport가 바뀌면 다시 그려 갱신된다.
  const myScreen = currentPreviewScreen(), myScale = currentPreviewScale();
  useEffect(() => {
    // 닫으면 표시 모드는 기본(레이아웃 확인)으로 되돌린다. 해상도·배율 선택은 유지한다.
    if (!open) { setMeasuredSize(null); setDisplayMode(DEFAULT_PREVIEW_DISPLAY_MODE); return; }
    // 브라우저 창 크기·F11·확대율·모니터 배율 변경은 resize로 알 수 있다. 값이 같으면 상태를 바꾸지 않아 재계산 반복을 막는다.
    const resize = () => {
      setViewport((previous) => { const next = readBrowserViewport(); return sameSize(previous, next) ? previous : next; });
      setPixelRatio(readPixelRatio());
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open]);
  const preset = previewScreenPreset(screenKey, screenScale);
  const workArea = preset.workArea;
  // 표시 배율: 레이아웃은 DIP(해상도 ÷ 배율)로 계산하고, 화면에는 선택한 해상도의 물리 크기로 그린다(내 화면 devicePixelRatio 기준).
  // 배율을 올리면 화면 테두리는 그대로이고 안의 팝업·글자가 커진다(실제 모니터에서 배율을 바꿀 때와 같은 체감). 내 모니터와 같은 해상도·배율이면 1.
  const actualScale = screenScale / pixelRatio;
  const actualScreen = { width: preset.display.width * actualScale, height: preset.display.height * actualScale };
  // 화면 비율 확인: 1:1 화면 크기에 균일 축척 하나를 곱한다. 팝업 레이아웃(DIP)은 다시 계산하지 않는다.
  const fitMode = displayMode === 'fit';
  const fitScale = fitMode ? previewFitScale(actualScreen, viewport) : 1;
  const visualScale = actualScale * fitScale;
  const shownScreen = { width: actualScreen.width * fitScale, height: actualScreen.height * fitScale };
  // 레이아웃 확인에서 브라우저보다 커서 가상 화면 일부만 보이는지(바깥 스크롤 발생).
  const clipped = !fitMode && (actualScreen.width > viewport.width + 0.5 || actualScreen.height > viewport.height + 0.5);
  const notice = fitMode
    ? `가상 화면 전체를 ${Math.round(fitScale * 100)}%로 균일 축소했습니다. 원래 크기가 아니라 화면 대비 팝업 비율을 보는 모드입니다(줄바꿈·배치는 선택한 해상도 그대로).`
    : clipped ? '실제 크기(1:1)입니다. 가상 화면이 브라우저보다 커서 일부만 보입니다 — 바깥 스크롤로 이동하며, 팝업 본문 스크롤과는 별개입니다.'
      : '실제 크기(1:1)입니다. 가상 화면 전체가 보입니다.';

  const fullScreen = popup.sizeMode === 'FULLSCREEN';
  const overlay = previewOverlay(popup);
  /* WPF와 같이 FULLSCREEN은 위치를 무시하고, 그 밖에는 9개 위치에 맞춰 작업 영역 가장자리에 붙인다. */
  const [alignX, alignY] = previewPositionAlign(popup);
  // 측정값(모달 안 PopupPreview가 선택한 작업 영역으로 계산한 IMAGE 권장 크기)은 값이 달라질 때만 갱신되므로 기준 화면을 바꿔도 지우지 않는다.
  const target = previewDialogSize(popup, measuredSize, workArea);
  // FULLSCREEN 창은 작업 표시줄까지 덮는 표시 해상도 크기다.
  const popupWindowSize = fullScreen ? preset.display : target;
  const radius = previewShadowMargin(popup) ? 0 : '6px';

  // 해상도를 바꾸거나 팝업 크기가 바뀌면 스크롤을 팝업 가운데로 맞춘다(큰 화면은 왼쪽 위부터 그려지므로 팝업이 가장자리에 걸리지 않게).
  // 2026-11-27: 스크롤 영역은 콜백 ref로 상태에 담는다. Dialog Portal이 붙는 순간 다시 그려져 아래 측정이 실제 DOM으로 실행된다.
  // 측정은 DOM 반영 직후(useLayoutEffect)에 한다. 예전 rAF 방식은 처음 열 때 Portal이 붙기 전에 지나가거나, 보이지 않는 탭에서 프레임이 돌지 않아 빠졌다.
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const container = scrollElement, popupWindow = windowRef.current;
    if (!open || !container || !popupWindow) return;
    const c = container.getBoundingClientRect(), w = popupWindow.getBoundingClientRect();
    container.scrollLeft += (w.left + w.width / 2) - (c.left + c.width / 2);
    container.scrollTop += (w.top + w.height / 2) - (c.top + c.height / 2);
  }, [open, scrollElement, screenKey, screenScale, pixelRatio, displayMode, popupWindowSize.width, popupWindowSize.height]);
  // 스크롤바 크기: 화면이 브라우저보다 커서 스크롤바가 생기면 도구 패널을 그만큼 안쪽으로 옮겨 스크롤바와 붙지 않게 한다.
  const [scrollbar, setScrollbar] = useState({ vertical: 0, horizontal: 0 });
  useLayoutEffect(() => {
    if (!open || !scrollElement) return;
    const next = { vertical: scrollElement.offsetWidth - scrollElement.clientWidth, horizontal: scrollElement.offsetHeight - scrollElement.clientHeight };
    setScrollbar((previous) => (previous.vertical === next.vertical && previous.horizontal === next.horizontal ? previous : next));
  }, [open, scrollElement, screenKey, screenScale, pixelRatio, displayMode, viewport.width, viewport.height]);
  const toolsInset = 12;

  return (
    <Dialog open={open} onClose={() => onClose()} fullScreen maxWidth={false}
      // 화면 바깥은 낮은 불투명도의 검정(관리자 화면이 비침). 팝업 Overlay 설정은 바깥이 아니라 가상 데스크톱 위에서 재현한다.
      slotProps={{ backdrop: { sx: { backgroundColor: VIRTUAL_OUTSIDE } },
        paper: { sx: { bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none', overflow: 'hidden' } } }}>
      {/* 헤더 닫기 버튼이 없으므로(WPF와 동일) 푸터를 숨겨도 종료 버튼과 Esc로 미리보기를 닫는다.
          도구는 따로 자리를 잡지 않고 화면 위에 띄운다(위쪽 배치 팝업이면 아래로). 자리·여백을 잡으면 브라우저와 같은 해상도에서도 스크롤이 생긴다. */}
      <Box data-testid="preview-dialog-tools"
        sx={{ position: 'fixed', right: toolsInset + scrollbar.vertical,
          ...(!fullScreen && alignY === 'flex-start' ? { bottom: toolsInset + scrollbar.horizontal } : { top: toolsInset }),
          zIndex: (theme) => theme.zIndex.modal + 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end',
          maxWidth: `calc(100vw - ${toolsInset * 2 + scrollbar.vertical}px)`,
          // 흰 도구 패널: 선택박스 라벨(기준 화면·배율)이 테두리 위로 떠도 어두운 바깥이 아니라 흰 바탕 위에 보이게 한다(2026-11-24 가시성).
          bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3, px: 1.5, pt: 1.5, pb: 1 }}>
        <TextField select size="small" label="기준 화면" value={screenKey} onChange={(event) => setScreenKey(event.target.value as PreviewScreenKey)}
          sx={{ minWidth: 150 }}>
          {/* 표시 해상도만 보여 준다. 크기·위치 계산은 WPF CurrentWorkArea()처럼 작업 표시줄을 뺀 작업 영역(DIP) 기준이다. */}
          {PREVIEW_SCREEN_PRESETS.map((item) => (
            <MenuItem key={item.key} value={item.key} title={item.key === myScreen ? '현재 모니터와 같은 해상도' : undefined}>
              {formatPreviewSize(item.resolution)}{item.key === myScreen ? ' *' : ''}
            </MenuItem>
          ))}
        </TextField>
        {/* Windows 배율: 작업 영역이 DIP(해상도 ÷ 배율)로 작아지고 화면 안 팝업·글자는 배율만큼 커져 보인다. 90% 상한에도 더 빨리 걸린다. */}
        <TextField select size="small" label="배율" value={screenScale} onChange={(event) => setScreenScale(Number(event.target.value) as PreviewScreenScale)}
          sx={{ minWidth: 100 }}>
          {PREVIEW_SCREEN_SCALES.map((scale) => (
            <MenuItem key={scale} value={scale} title={scale === myScale ? '현재 모니터와 같은 배율' : undefined}>
              {Math.round(scale * 100)}%{scale === myScale ? ' *' : ''}
            </MenuItem>
          ))}
        </TextField>
        {/* 표시 모드: 같은 모달에서 해상도·배율 선택을 유지한 채 전환한다. 선택 해제(null)는 무시해 항상 한 모드가 켜져 있다. */}
        <ToggleButtonGroup size="small" exclusive color="primary" aria-label="표시 모드" value={displayMode}
          onChange={(_, next: PreviewDisplayMode | null) => { if (next) setDisplayMode(next); }}>
          {(Object.keys(PREVIEW_DISPLAY_MODE_LABEL) as PreviewDisplayMode[]).map((mode) => (
            <ToggleButton key={mode} value={mode} data-testid={`preview-mode-${mode}`} sx={{ py: 0.75, px: 1.25 }}>{PREVIEW_DISPLAY_MODE_LABEL[mode]}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" color="primary" aria-label="실제 크기 미리보기 종료" onClick={onClose}>
          미리보기 종료 (Esc)
        </Button>
        {/* 안내: 현재 모드·해상도·배율과 물리 크기 오인 방지 문구. inline-size containment로 패널 폭을 넓히지 않고 컨트롤 줄 폭 안에서 줄바꿈한다. */}
        <Typography data-testid="preview-display-notice" variant="caption" color="text.secondary"
          sx={{ flexBasis: '100%', contain: 'inline-size', lineHeight: 1.45 }}>
          <strong>{PREVIEW_DISPLAY_MODE_LABEL[displayMode]} · {formatPreviewSize(preset.resolution)} · {Math.round(screenScale * 100)}%</strong>
          {' — '}{notice}<br />{PREVIEW_SCREEN_NOTICE}
        </Typography>
      </Box>
      {/* 화면이 브라우저보다 큰 축에만 스크롤이 생긴다. 작은 화면은 가운데(margin auto), 큰 화면은 왼쪽 위부터 그려 잘리지 않고 처음 스크롤은 팝업 가운데.
          폭이 브라우저에 들어가면 가로 스크롤을 만들지 않는다: 세로 스크롤바(약 15px)가 생겨도 가로 스크롤이 덧붙지 않게 하고, 오른쪽 끝 스크롤바 폭만큼은 가려진다. */}
      <Box data-testid="preview-virtual-scroll" ref={setScrollElement}
        sx={{ position: 'absolute', inset: 0, overflowX: shownScreen.width > viewport.width + 0.5 ? 'auto' : 'hidden',
          overflowY: shownScreen.height > viewport.height + 0.5 ? 'auto' : 'hidden', display: 'flex' }}>
        {/* 불투명 가상 데스크톱(작업 영역 흰색, 작업 표시줄 검정): 팝업 뒤에 등록 폼이 비치지 않는다. 경계는 바깥과의 색 차이로만 보인다(점선 테두리 없음).
            바깥 상자는 물리 크기(shownScreen), 안쪽은 DIP 크기로 배치한 뒤 visualScale로 확대·축소한다. */}
        <Box data-testid="preview-virtual-screen" data-visual-scale={visualScale} data-display-mode={displayMode} data-fit-scale={fitScale}
          sx={{ width: shownScreen.width, height: shownScreen.height, position: 'relative', overflow: 'hidden', flexShrink: 0, m: 'auto', background: VIRTUAL_DESKTOP }}>
          <Box data-testid="preview-virtual-desktop"
            sx={{ position: 'absolute', left: 0, top: 0, width: preset.display.width, height: preset.display.height,
              transform: visualScale === 1 ? undefined : `scale(${visualScale})`, transformOrigin: '0 0' }}>
            {/* 작업 표시줄: 프리셋에서 제외한 높이(표시 해상도 - 작업 영역)만큼 검정. 그 위쪽(작업 영역)은 흰색. */}
            <Box data-testid="preview-virtual-taskbar"
              sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: preset.display.height - preset.workArea.height, bgcolor: VIRTUAL_TASKBAR }} />
            {/* 팝업 Background Overlay는 가상 데스크톱(작업 표시줄 포함) 위에서 재현한다. 끄면 데스크톱 바탕이 그대로 보인다. */}
            {overlay.enabled && <Box data-testid="preview-virtual-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: `rgba(0, 0, 0, ${overlay.opacity})` }} />}
            <Box data-testid="preview-virtual-work-area"
              sx={{ position: 'absolute', left: 0, top: 0, width: fullScreen ? preset.display.width : workArea.width,
                height: fullScreen ? preset.display.height : workArea.height, display: 'flex',
                justifyContent: fullScreen ? 'flex-start' : alignX, alignItems: fullScreen ? 'flex-start' : alignY }}>
              {/* WPF와 같이 창 크기 안에서 PopupPreview가 그림자 여백 24px·흰 판·그림자를 그린다(영상 창·FULLSCREEN은 여백 없음). */}
              <Box data-testid="preview-popup-window" ref={windowRef}
                sx={{ position: 'relative', width: popupWindowSize.width, height: popupWindowSize.height, flexShrink: 0, overflow: 'hidden',
                  borderRadius: fullScreen ? 0 : radius, display: 'flex', flexDirection: 'column' }}>
                <PopupPreview popup={popup} showBackground={false} showPlaceholders={showPlaceholders} onClose={onClose}
                  onRecommendedSize={setMeasuredSize} workArea={workArea} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
