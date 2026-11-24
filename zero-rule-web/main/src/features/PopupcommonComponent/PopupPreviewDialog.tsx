import type { AdminPopupDetail } from '@local/domain';
import { Box, Button, Dialog, DialogContent, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import PopupPreview from './PopupPreview';
import type { Size } from './imagePreviewLayout';
import {
  PREVIEW_SCREEN_PRESETS, type PreviewScreenKey, previewDialogSize, previewDisplaySize, previewOverlay, previewPositionAlign,
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
/** 기준 화면 선택박스·1:1 안내 문구에 쓰는 'W×H' 표기. */
export const formatPreviewSize = (size: Size) => `${Math.round(size.width)}×${Math.round(size.height)}`;
/** 목표 크기가 브라우저 표시 영역보다 커서 1:1로 그리지 못할 때 도구 영역에 보이는 안내. */
export const ACTUAL_SIZE_LIMITED_NOTICE = '브라우저 표시 영역이 부족해 실제 크기(1:1)로 표시하지 못했습니다.';

/**
 * POL-08-01 : 공통 렌더러
 * POL-08-03 : Dialog 호환
 * POL-02-02 : 종료 제어
 * ■ 실제 크기 미리보기 모달
 * - in : popup(AdminPopupDetail) 미리 볼 팝업 · open(boolean) 모달 열림 여부 · recommendedSize?(Size | null) 인라인 미리보기가 계산한 IMAGE 권장 창 크기
 * - out: onClose() 종료 버튼·Esc·(Overlay 미사용 시) 배경 클릭·팝업 안 닫기 동작 · 화면: 실제 크기 팝업, 배경 Overlay, '기준 화면' 선택박스, "미리보기 종료 (Esc)" 버튼
 * - 팝업 정보를 받아 크기 모드·9개 위치·배경 Overlay를 WPF와 같이 적용한 모달로 PopupPreview를 보여준다.
 *   TODO61-23(2026-11-24): 팝업 크기는 선택한 기준 화면의 작업 영역(현재 모니터 = screen.availWidth/availHeight, 또는 해상도 프리셋)으로 계산하고,
 *   배경·배치는 실제 브라우저 표시 영역(innerWidth/innerHeight)을 쓴다. 목표 크기가 표시 영역에 들어가면 1:1로, 넘치는 축만 표시 영역까지 줄이고 안내한다.
 *   기준 화면 선택은 이 모달의 미리보기 상태로만 남고 popup·저장 데이터에 들어가지 않는다.
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
  const workArea = previewWorkArea(screenKey, screenWorkArea);
  // 측정값은 지우지 않는다: 모달 안 PopupPreview가 바뀐 workArea로 다시 계산해 값이 달라질 때만 알린다(같으면 기존 값이 그대로 맞다).
  const changeScreen = (key: PreviewScreenKey) => setScreenKey(key);

  const fullScreen = popup.sizeMode === 'FULLSCREEN';
  const overlay = previewOverlay(popup);
  /* WPF와 같이 FULLSCREEN은 위치를 무시하고, 그 밖에는 9개 위치에 맞춰 가장자리에 붙인다. */
  const [alignX, alignY] = previewPositionAlign(popup);
  // 인라인 미리보기의 권장 크기(recommendedSize)는 현재 모니터 기준이라, 프리셋을 고르면 모달 안 PopupPreview가 다시 계산할 때까지 쓰지 않는다.
  const target = previewDialogSize(popup, measuredSize ?? (screenKey === 'CURRENT' ? recommendedSize : null), workArea);
  const { size, actualSize } = previewDisplaySize(target, viewport);
  /* WPF와 같이 Paper = 창 크기이고, 일반 창은 PopupPreview가 그 안에 그림자 여백 24px를 두고 흰 판·그림자를 그린다(previewShadowMargin).
   * 그래서 Paper 자체는 투명·그림자 없음이고, 창이 브라우저 표시 영역 가장자리에 바로 붙는다(WPF 창 위치와 같음, 2026-11-17). */
  /* MUI 6.4.1+ Dialog slotProps(backdrop·paper). deprecated BackdropProps·PaperProps 대신 한 객체로 넘긴다.
   * FULLSCREEN은 Paper 크기를 지정하지 않는다(paper: undefined). */
  const slotProps = {
    backdrop: { sx: { backgroundColor: overlay.enabled ? `rgba(0, 0, 0, ${overlay.opacity})` : 'transparent' } },
    // 영상 창은 WPF처럼 그림자가 없고(ApplyVideoWindowSurface), 일반 창 그림자는 안쪽 흰 판이 그리므로 Paper 그림자는 항상 없다.
    // 화면 상한은 previewDialogSize(작업 영역)·previewDisplaySize(브라우저 표시 영역)가 이미 적용했다.
    // 예전 96vw/96vh 이중 제한은 1:1 크기를 다시 줄여 100%로 바꿨다(TODO61-23).
    paper: fullScreen ? undefined : { sx: { width: size.width, height: size.height, borderRadius: previewShadowMargin(popup) ? 0 : '6px', bgcolor: 'transparent',
      boxShadow: 'none', maxWidth: '100vw', maxHeight: '100vh', m: 0, overflow: 'hidden' } },
  };

  return (
    <Dialog open={open} onClose={(_, reason) => {
      if (reason !== 'backdropClick' || !overlay.enabled) onClose();
    }} slotProps={slotProps} fullScreen={fullScreen} maxWidth={false}
      sx={fullScreen ? undefined : { '& .MuiDialog-container': { justifyContent: alignX, alignItems: alignY } }}>
      {/* 헤더 닫기 버튼이 없으므로(WPF와 동일) 푸터를 숨겨도 종료 버튼과 Esc로 미리보기를 닫는다. 위쪽 배치 팝업과 겹치지 않게 아래로 옮긴다.
          도구 묶음(1:1 안내 + 기준 화면 선택 + 종료 버튼)은 화면 위에 떠 있어 팝업 표시 공간을 줄이지 않는다(TODO61-23).
          FULLSCREEN은 기준 화면과 무관하게 브라우저 화면을 채우므로 선택박스를 두지 않는다. */}
      <Box data-testid="preview-dialog-tools"
        sx={{ position: 'fixed', ...(!fullScreen && alignY === 'flex-start' ? { bottom: 12 } : { top: 12 }), right: 12, zIndex: (theme) => theme.zIndex.modal + 1,
          display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 'calc(100vw - 24px)' }}>
        {!fullScreen && !actualSize && (
          <Typography role="status" variant="caption"
            sx={{ bgcolor: 'background.paper', color: 'warning.dark', px: 1, py: 0.5, borderRadius: 1, boxShadow: 3 }}>
            {ACTUAL_SIZE_LIMITED_NOTICE} (목표 {formatPreviewSize(target)})
          </Typography>
        )}
        {!fullScreen && (
          <TextField select size="small" label="기준 화면" value={screenKey} onChange={(event) => changeScreen(event.target.value as PreviewScreenKey)}
            sx={{ minWidth: 240, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3 }}>
            <MenuItem value="CURRENT">현재 모니터 (작업 영역 {formatPreviewSize(screenWorkArea)})</MenuItem>
            {PREVIEW_SCREEN_PRESETS.map((preset) => (
              <MenuItem key={preset.key} value={preset.key}>
                {formatPreviewSize(preset.display)} (작업 영역 {formatPreviewSize(preset.workArea)})
              </MenuItem>
            ))}
          </TextField>
        )}
        <Button variant="contained" color="primary" aria-label="실제 크기 미리보기 종료" onClick={onClose} sx={{ boxShadow: 3 }}>
          미리보기 종료 (Esc)
        </Button>
      </Box>
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <PopupPreview popup={popup} showBackground={false} showPlaceholders={showPlaceholders} onClose={onClose} onRecommendedSize={setMeasuredSize} workArea={workArea} />
      </DialogContent>
    </Dialog>
  );
}
