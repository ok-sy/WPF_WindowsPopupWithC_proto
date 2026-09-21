import normalizePopupLink from './normalizePopupLink';
import type { AdminPopupDetail } from '@local/domain';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  Stack,
  Typography,
} from '@mui/material';

interface PopupPreviewProps {
  popup: AdminPopupDetail;
  standalone?: boolean;
  fitContainer?: boolean;
  showBackground?: boolean;
  onClose?: () => void;
}

function text(value: unknown, fallback: string): string {
  return value == null || String(value).trim() === '' ? fallback : String(value);
}

function titleKey(type: AdminPopupDetail['popupType']): string {
  if (type === 'IMAGE') return 'imageTitle';
  if (type === 'VIDEO') return 'videoTitle';
  if (type === 'SURVEY' || type === 'QUIZ') return 'surveyTitle';
  return 'contentTitle';
}

// [2026-09-21 제거] MarkdownView(react-markdown + remark-gfm) — TEXT 팝업 Markdown 모드를 쓰지 않기로 해 삭제. 의존성도 package.json에서 제거.
function previewSize(popup: AdminPopupDetail) {
  if (popup.sizeMode === 'FULLSCREEN') return { width: '100%', height: 520 };
  if (popup.sizeMode === 'RATIO') {
    return {
      width: `${Math.max(25, Math.min(100, popup.widthRatio * 100))}%`,
      height: Math.max(280, Math.min(520, popup.heightRatio * 520)),
    };
  }

  const scale = Math.min(1, 760 / Math.max(popup.width, 1), 520 / Math.max(popup.height, 1));
  return {
    width: Math.max(320, popup.width * scale),
    height: Math.max(260, popup.height * scale),
  };
}

function PopupBody({ popup }: PopupPreviewProps) {
  const content = popup.content;
  const description = text(content.description, '팝업 설명이 여기에 표시됩니다.');

  if (popup.popupType === 'IMAGE') {
    const imageUrl = text(content.imageUrl, '');
    const imageFill = String(content.imageSizeMode ?? '').toUpperCase() === 'FILL';
    const showDescription = !imageFill && content.showDescription !== false;
    const imageWidth = imageFill ? undefined : Number(content.imageWidth) || undefined;
    const imageHeight = imageFill ? undefined : Number(content.imageHeight) || undefined;
    const linkUrl = text(content.linkUrl, '');

    const image = imageUrl ? (
      <Box
        component="img"
        src={imageUrl}
        alt="팝업 이미지 미리보기"
        sx={{
          width: '100%',
          height: imageFill ? '100%' : undefined,
          maxWidth: imageWidth,
          maxHeight: imageHeight,
          flex: 1,
          minHeight: imageFill ? 0 : 150,
          borderRadius: imageFill ? 0 : 1,
          border: imageFill ? 'none' : '1px solid',
          borderColor: 'divider',
          objectFit: imageFill ? 'cover' : 'contain',
          bgcolor: '#f4f6fa',
          cursor: linkUrl ? 'pointer' : 'default',
          display: 'block',
        }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          flex: 1,
          minHeight: 150,
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: '#f4f6fa',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        이미지 URL을 입력하면 여기에 표시됩니다.
      </Box>
    );

    return (
      <Stack spacing={imageFill ? 0 : 1.5} alignItems="center" sx={{ height: '100%', width: '100%' }}>
        {showDescription && <Typography color="text.secondary">{description}</Typography>}
        {linkUrl && imageUrl ? (
          <Box
            component="a"
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            sx={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', textDecoration: 'none' }}
          >
            {image}
          </Box>
        ) : image}
      </Stack>
    );
  }

  if (popup.popupType === 'VIDEO') {
    const showDescription = content.showDescription !== false;
    const showControls = content.showControls !== false;
    const defaultVolume = Number(content.defaultVolume);
    return (
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        {showDescription && <Typography color="text.secondary">{description}</Typography>}
        <Box
          sx={{
            flex: 1,
            minHeight: 170,
            borderRadius: 1,
            bgcolor: '#101521',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <PlayCircleOutlineIcon sx={{ fontSize: 58 }} />
            <Typography variant="caption">영상 재생 영역</Typography>
          </Stack>
        </Box>
        {showControls && (
          <Stack direction="row" justifyContent="space-between" color="text.secondary">
            <Typography variant="caption">▶ 00:00 / 00:00</Typography>
            <Typography variant="caption">
              {content.allowPlaybackRateChange !== false ? '1.0× · ' : ''}
              {content.allowFullScreen !== false ? '전체화면' : '전체화면 제한'}
            </Typography>
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary">
          완료 기준 {Math.round((popup.completionRatio ?? 0.8) * 100)}% · 기본 음량{' '}
          {Math.round((Number.isFinite(defaultVolume) ? defaultVolume : 0.7) * 100)}%
        </Typography>
      </Stack>
    );
  }

  if (popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ') {
    return (
      <Stack spacing={1.5}>
        <Typography color="text.secondary">{description}</Typography>
        {popup.popupType === 'QUIZ' && <Typography variant="body2" fontWeight={700}>
          총점 {popup.questions.reduce((sum, q) => sum + Math.round((q.questionScore ?? 0) * 100), 0) / 100}점 · 통과 점수 {popup.passingScore ?? 0}점
        </Typography>}
        {(popup.questions.length > 0 ? popup.questions : [null]).map((question, index) => (
          <Paper variant="outlined" sx={{ p: 2 }} key={question?.questionId ?? 'sample'}>
            <Typography fontWeight={700}>
              {index + 1}. {question?.title ?? '샘플 문항입니다.'}
              {question?.isRequired && <Typography component="span" color="error"> *</Typography>}
              {popup.popupType === 'QUIZ' && question && <Typography component="span" color="text.secondary"> ({question.questionScore ?? 0}점)</Typography>}
            </Typography>
            {question?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {question.description}
              </Typography>
            )}
            <Stack sx={{ mt: 1 }}>
              {question?.questionType === 'TEXT' ? (
                <Box sx={{ minHeight: 62, border: '1px solid', borderColor: 'divider', borderRadius: 1 }} />
              ) : (
                (question?.options.length ? question.options : [{ optionId: 0, text: '보기 1' }]).map(
                  (option) => (
                    <FormControlLabel
                      key={option.optionId}
                      control={question?.questionType === 'MULTIPLE_CHOICE' ? <Checkbox size="small" /> : <Radio size="small" />}
                      label={option.text}
                    />
                  ),
                )
              )}
            </Stack>
          </Paper>
        ))}
        <Button variant="contained" sx={{ alignSelf: 'flex-end' }}>
          제출
        </Button>
      </Stack>
    );
  }

  const showContentHeader = content.showContentHeader !== false;
  const showPlainText = content.showPlainText !== false;
  const showHighlight =
    content.showHighlight == null ? Boolean(content.highlightText) : content.showHighlight === true;

  const showBottomDescription =
    content.showBottomDescription == null
      ? Boolean(content.bottomDescription || content.bottomDescriptionUrl)
      : content.showBottomDescription === true;

  const bottomUrl = normalizePopupLink(content.bottomDescriptionUrl);
  const bottomLabel = String(content.bottomDescription ?? '').trim() || bottomUrl;
  const bottomDescription = showBottomDescription && bottomLabel && (
    bottomUrl ? <Paper component="a" href={bottomUrl} target="_blank" rel="noopener noreferrer"
      variant="outlined" title={bottomUrl}
      sx={{ display: 'block', p: 2, bgcolor: '#f8f9fc', whiteSpace: 'pre-wrap', color: '#2563eb',
        cursor: 'pointer', textDecoration: 'underline', overflowWrap: 'anywhere',
        '&:hover, &:focus-visible': { color: '#1d4ed8', bgcolor: '#eff6ff' } }}>
      {bottomLabel}
    </Paper> : <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fc', whiteSpace: 'pre-wrap' }}>
      {bottomLabel}
    </Paper>
  );

  return (
    <Stack spacing={2}>
      {showContentHeader && <Typography color="text.secondary">{description}</Typography>}
      {showPlainText && (
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {String(content.plainText ?? '')}
        </Typography>
      )}
      {showHighlight && (
        <Box sx={{ p: 1.5, border: '1px solid #93c5fd', borderRadius: 1, bgcolor: '#eff6ff', color: '#1d4ed8' }}>
          {text(content.highlightText, '강조 문구')}
        </Box>
      )}
      {bottomDescription}
    </Stack>
  );
}

export default function PopupPreview({ popup, standalone = false, fitContainer = false, showBackground = !standalone, onClose }: PopupPreviewProps) {
  const overlayEnabled = popup.content.useBackgroundOverlay !== false;
  const requestedOpacity = Number(popup.content.backgroundOverlayOpacity ?? 0.45);
  const overlayOpacity = Number.isFinite(requestedOpacity) ? Math.max(0, Math.min(1, requestedOpacity)) : 0.45;
  const size = standalone
    ? { width: '100%', height: '100vh' }
    : fitContainer
      ? { width: '100%', height: '100%' }
      : previewSize(popup);
  const imageFill = popup.popupType === 'IMAGE'
    && String(popup.content.imageSizeMode ?? '').toUpperCase() === 'FILL';
  const contentTitle = text(contentValue(popup, titleKey(popup.popupType)), '콘텐츠 제목');
  const showContentTitle = !imageFill
    && (popup.popupType !== 'TEXT' || popup.content.showContentHeader !== false);

  return (
    <Box
      sx={{
        minHeight: standalone ? '100vh' : fitContainer ? 0 : 570,
        height: fitContainer ? '100%' : undefined,
        p: showBackground ? 2 : 0,
        flex: fitContainer ? 1 : undefined,
        boxSizing: 'border-box',
        position: 'relative',
        isolation: 'isolate',
        '&::before': showBackground && overlayEnabled ? {
          content: '""', position: 'absolute', inset: 0,
          bgcolor: `rgba(0, 0, 0, ${overlayOpacity})`, zIndex: -1,
        } : undefined,
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: '#e9edf4',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          ...size,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: standalone ? 0 : 2,
          bgcolor: 'white',
        }}
      >
        {popup.showHeader && (
          <Stack direction="row" alignItems="center" sx={{ minHeight: 52, px: 2, flexShrink: 0 }}>
            <Typography fontWeight={700} sx={{ flex: 1 }} noWrap>
              {text(popup.title, '팝업 제목')}
            </Typography>
            {popup.showCloseButton && (
              <IconButton size="small" aria-label="닫기 미리보기" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
        {popup.showHeader && <Divider />}
        <Box sx={{ flex: 1, minHeight: 0, overflow: imageFill ? 'hidden' : 'auto', p: imageFill ? 0 : 3 }}>
          {showContentTitle && (
            <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
              {contentTitle}
            </Typography>
          )}
          <PopupBody popup={popup} />
        </Box>
        {popup.showFooter && (
          <>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
              {popup.showDoNotShowAgain ? (
                <FormControlLabel control={<Checkbox size="small" />} label="다시 보지 않기" />
              ) : (
                <span />
              )}
              {popup.showCloseButton && (
                <Button variant="contained" color="inherit" sx={{ minWidth: 92 }} onClick={onClose}>
                  닫기
                </Button>
              )}
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}

function contentValue(popup: AdminPopupDetail, key: string): unknown {
  return popup.content[key];
}
