import type { AdminPopupDetail } from '@local/domain';
import PreviewIcon from '@mui/icons-material/Preview';
import { Box, Button, Stack, Typography } from '@mui/material';
import PopupPreview from './PopupPreview';
import type { Size } from './imagePreviewLayout';

/* 부모 높이가 없거나 좁아도 헤더·푸터와 이미지 칸이 함께 보이는 최소 높이(px). */
const INLINE_PREVIEW_MIN_HEIGHT = 320;

/**
 * POL-08-01 : 공통 렌더러
 * ■ 인라인 미리보기 입력값
 * - in : popup · onOpenPreview? · onRecommendedSize? · title? (각 항목 설명 참고)
 * - out: 없음(형식 정의)
 * - InlinePopupPreview가 받는 props 형식을 정의한다.
 */
export interface InlinePopupPreviewProps {
  popup: AdminPopupDetail;
  /** 있으면 "실제 크기로 보기" 버튼을 표시하고 누를 때 호출한다. 모달 열림 상태는 부모가 가진다. */
  onOpenPreview?: () => void;
  /** IMAGE 권장 창 크기(FIT_TO_IMAGE 등). 부모가 크기 안내나 PopupPreviewDialog의 recommendedSize로 쓴다. */
  onRecommendedSize?: (size: Size | null) => void;
  title?: string;
}

/**
 * POL-08-01 : 공통 렌더러
 * ■ 등록 화면 인라인 미리보기
 * - in : popup(AdminPopupDetail) 미리 볼 팝업 · title?(string) 미리보기 제목, 기본 '팝업 미리보기'
 * - out: onOpenPreview?() "실제 크기로 보기" 버튼 클릭(없으면 버튼 숨김) · onRecommendedSize?(size: Size | null) IMAGE 권장 창 크기 · 화면: 제목·확대 버튼과 PopupPreview 미리보기
 * - 팝업 정보를 받아 등록 화면 우측에 제목·확대 버튼과 PopupPreview를 배치해 보여준다.
 *   저장·조회 API를 호출하지 않으며 전달받은 popup을 바꾸지 않는다. 부모 영역의 남은 높이를 채운다.
 *   미리보기 내부는 height:100%와 flex 비율로 배치되므로 높이가 확정된 상자가 필요하다. 그래서 absolute 상자로 높이를 확정한다.
 *   이 상자가 없으면 grid가 아닌 부모에서 이미지 칸이 0으로 접혀 ADAPTIVE·FIT_TO_IMAGE 이미지가 보이지 않는다.
 */
export default function InlinePopupPreview({ popup, onOpenPreview, onRecommendedSize, title = '팝업 미리보기' }: InlinePopupPreviewProps) {
  return (
    <Stack spacing={1.5} sx={{ flex: 1, height: '100%', minHeight: 0, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {onOpenPreview && <Button size="small" variant="outlined" startIcon={<PreviewIcon />} onClick={onOpenPreview}>실제 크기로 보기</Button>}
      </Stack>
      <Box sx={{ flex: 1, minHeight: INLINE_PREVIEW_MIN_HEIGHT, position: 'relative' }}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <PopupPreview popup={popup} onRecommendedSize={onRecommendedSize} />
        </Box>
      </Box>
    </Stack>
  );
}
