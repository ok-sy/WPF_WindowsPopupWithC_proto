import type { AdminPopupDetail } from '@local/domain';
import PreviewIcon from '@mui/icons-material/Preview';
import { Button, Stack, Typography } from '@mui/material';
import PopupPreview from './PopupPreview';
import type { Size } from './imagePreviewLayout';

export interface InlinePopupPreviewProps {
  popup: AdminPopupDetail;
  /** 있으면 "실제 크기로 보기" 버튼을 표시하고 누를 때 호출한다. 모달 열림 상태는 부모가 가진다. */
  onOpenPreview?: () => void;
  /** IMAGE 권장 창 크기(FIT_TO_IMAGE 등). 부모가 크기 안내나 PopupPreviewDialog의 recommendedSize로 쓴다. */
  onRecommendedSize?: (size: Size | null) => void;
  title?: string;
}

/**
 * [TODO61] 등록 화면 우측 인라인 미리보기. 제목·확대 버튼 배치만 담당하고 내용은 PopupPreview로 그린다.
 * 저장·조회 API를 호출하지 않으며 전달받은 popup을 바꾸지 않는다. 부모 영역의 남은 높이를 채운다.
 */
export default function InlinePopupPreview({ popup, onOpenPreview, onRecommendedSize, title = '팝업 미리보기' }: InlinePopupPreviewProps) {
  return (
    <Stack spacing={1.5} sx={{ minHeight: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {onOpenPreview && <Button size="small" variant="outlined" startIcon={<PreviewIcon />} onClick={onOpenPreview}>실제 크기로 보기</Button>}
      </Stack>
      <PopupPreview popup={popup} onRecommendedSize={onRecommendedSize} />
    </Stack>
  );
}
