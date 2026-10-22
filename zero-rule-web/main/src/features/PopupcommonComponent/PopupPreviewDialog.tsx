import type { AdminPopupDetail } from '@local/domain';
import { Button, Dialog, DialogContent } from '@mui/material';
import { useEffect, useState } from 'react';
import PopupPreview from './PopupPreview';
import type { Size } from './imagePreviewLayout';
import { previewDialogSize, previewEdgeMargin, previewOverlay, previewPositionAlign } from './popupPreviewDialogLayout';

export interface PopupPreviewDialogProps {
  popup: AdminPopupDetail;
  open: boolean;
  onClose: () => void;
  /** 인라인 미리보기가 이미 계산한 IMAGE 권장 창 크기(선택). 모달 안 미리보기가 계산하기 전 첫 표시에 쓴다. */
  recommendedSize?: Size | null;
}

function readViewport(): Size {
  return typeof window === 'undefined' ? { width: 1920, height: 1040 } : { width: window.innerWidth, height: window.innerHeight };
}

/**
 * [TODO61] "실제 크기로 보기" 모달. 크기 모드·작업 영역(브라우저 창)·9개 위치·배경 Overlay·종료 버튼을 처리하고
 * 내용은 PopupPreview로 그린다. 입력 폼·저장 API에 의존하지 않으며 전달받은 popup을 바꾸지 않는다.
 * 설문 응답·시청 비율 등 시연 상태는 모달 안 PopupPreview에만 있고, 닫으면 내용이 언마운트되어 다시 열 때 초기화된다.
 */
export default function PopupPreviewDialog({ popup, open, onClose, recommendedSize = null }: PopupPreviewDialogProps) {
  const [viewport, setViewport] = useState<Size>(readViewport);
  const [measuredSize, setMeasuredSize] = useState<Size | null>(null);
  useEffect(() => {
    if (!open) { setMeasuredSize(null); return; }
    const resize = () => setViewport(readViewport());
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open]);

  const fullScreen = popup.sizeMode === 'FULLSCREEN';
  const overlay = previewOverlay(popup);
  /* [설계 31] WPF와 같이 FULLSCREEN은 위치를 무시하고, 그 밖에는 9개 위치에 맞춰 가장자리에 붙인다. */
  const [alignX, alignY] = previewPositionAlign(popup);
  const edgeMargin = previewEdgeMargin(popup);
  const size = previewDialogSize(popup, measuredSize ?? recommendedSize, viewport);
  /* [TODO67] MUI 6.4.1+ Dialog slotProps(backdrop·paper). deprecated BackdropProps·PaperProps를 한 객체로 합쳐 옮겼다.
   * FULLSCREEN은 기존처럼 Paper 크기를 지정하지 않는다(paper: undefined). */
  const slotProps = {
    backdrop: { sx: { backgroundColor: overlay.enabled ? `rgba(0, 0, 0, ${overlay.opacity})` : 'transparent' } },
    paper: fullScreen ? undefined : { sx: { width: size.width, height: size.height,
      maxWidth: `min(96vw, calc(100vw - ${edgeMargin * 2}px))`, maxHeight: `min(96vh, calc(100vh - ${edgeMargin * 2}px))`, m: `${edgeMargin}px`, overflow: 'hidden' } },
  };

  return (
    <Dialog open={open} onClose={(_, reason) => {
      if (reason !== 'backdropClick' || !overlay.enabled) onClose();
    }} slotProps={slotProps} fullScreen={fullScreen} maxWidth={false}
      sx={fullScreen ? undefined : { '& .MuiDialog-container': { justifyContent: alignX, alignItems: alignY } }}>
      {/* 헤더 닫기 버튼이 없으므로(WPF와 동일) 푸터를 숨겨도 이 버튼과 Esc로 미리보기를 닫는다. 위쪽 배치 팝업과 겹치지 않게 아래로 옮긴다. */}
      <Button variant="contained" color="primary" aria-label="실제 크기 미리보기 종료"
        onClick={onClose}
        sx={{ position: 'fixed', ...(!fullScreen && alignY === 'flex-start' ? { bottom: 12 } : { top: 12 }), right: 12, zIndex: (theme) => theme.zIndex.modal + 1, boxShadow: 3 }}>
        미리보기 종료 (Esc)
      </Button>
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}><PopupPreview popup={popup} showBackground={false} onClose={onClose} onRecommendedSize={setMeasuredSize} /></DialogContent>
    </Dialog>
  );
}
