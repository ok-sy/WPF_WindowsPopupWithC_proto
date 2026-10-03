import SurveyPreview, {
  surveyColors,
  surveySubmitSx,
  type PreviewAnswer,
  type SurveyPreviewProps,
} from './SurveyPreview';
import popupDemoQuestions from './popupDemoQuestions';
import normalizePopupLink from './normalizePopupLink';
import {
  adaptiveMaximum,
  descriptionPlacement,
  fitToImageLayout,
  IMAGE_DESCRIPTION_WIDTH,
  imageAreaRatio,
  imageSizeMode,
  type FitToImageLayout,
  type Size,
} from './imagePreviewLayout';
import type { AdminPopupDetail } from '@local/domain';
import { type SyntheticEvent, useEffect, useId, useState } from 'react';
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
  Slider,
  Stack,
  Typography,
} from '@mui/material';

// [설계 18 L-0 W-2] 새 창 미리보기 페이지(pages/popup-preview.tsx)를 여는 코드가 없어 페이지와 함께
// standalone prop·분기를 삭제했다. 미리보기는 편집기 내 패널(fitContainer)과 "실제 크기로 보기" 모달만 사용한다.
interface PopupPreviewProps {
  popup: AdminPopupDetail;
  fitContainer?: boolean;
  showBackground?: boolean;
  onClose?: () => void;
  /** [설계 18 L-5 — W-10] IMAGE FIT_TO_IMAGE에서 WPF가 다시 계산할 팝업 창 크기. 그 외에는 null. */
  onRecommendedSize?: (size: Size | null) => void;
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

interface PopupBodyProps {
  popup: AdminPopupDetail;
  naturalImageSize: Size | null;
  fitLayout: FitToImageLayout | null;
  onImageLoad: (size: Size) => void;
  videoUnlocked?: boolean;
  survey?: Omit<SurveyPreviewProps, 'description'>;
}

function PopupBody({
  popup,
  naturalImageSize,
  fitLayout,
  onImageLoad,
  videoUnlocked = false,
  survey,
}: PopupBodyProps) {
  const content = popup.content;
  const description = text(content.description, '팝업 설명이 여기에 표시됩니다.');

  if (popup.popupType === 'QUIZ' && content.videoEnabled === true) {
    return (
      <Stack spacing={2}>
        <PopupBody
          popup={{ ...popup, popupType: 'VIDEO' }}
          naturalImageSize={null}
          fitLayout={null}
          onImageLoad={onImageLoad}
          survey={survey}
        />
        <Typography variant="body2" sx={{ color: surveyColors.muted }}>
          {videoUnlocked
            ? '시청 기준을 충족했습니다. 퀴즈에 응답해 주세요.'
            : '시청 기준에 도달하면 퀴즈와 하단 버튼이 활성화됩니다.'}
        </Typography>
        <Box
          component="fieldset"
          disabled={!videoUnlocked}
          sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
        >
          <PopupBody
            popup={{ ...popup, content: { ...content, videoEnabled: false } }}
            naturalImageSize={null}
            fitLayout={null}
            onImageLoad={onImageLoad}
            survey={survey}
          />
        </Box>
      </Stack>
    );
  }

  if (popup.popupType === 'IMAGE') {
    // [설계 18 L-5 — W-10] WPF ImagePopupView(설계 15)와 같은 규칙으로 크기 모드·설명 배치를 재현한다.
    const imageUrl = text(content.imageUrl, '');
    const mode = imageSizeMode(popup);
    const original = mode === 'ORIGINAL';
    const imageFill = mode === 'FILL' || original;
    const showDescription = !imageFill && content.showDescription !== false;
    const placement = descriptionPlacement(popup, naturalImageSize);
    const areaRatio = imageAreaRatio(popup);
    const fixedImage = mode === 'FIT_TO_IMAGE' ? fitLayout?.image : undefined;
    const maximum = mode === 'ADAPTIVE' ? adaptiveMaximum(popup, naturalImageSize) : {};
    const linkUrl = text(content.linkUrl, '');

    const image = imageUrl ? (
      <Box
        component="img"
        src={imageUrl}
        alt="팝업 이미지 미리보기"
        onLoad={(event: SyntheticEvent<HTMLImageElement>) =>
          onImageLoad({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }
        sx={{
          display: 'block',
          width: original
            ? (naturalImageSize?.width ?? 'auto')
            : fixedImage
              ? fixedImage.width
              : '100%',
          height: original
            ? (naturalImageSize?.height ?? 'auto')
            : fixedImage
              ? fixedImage.height
              : '100%',
          maxWidth: original ? 'none' : fixedImage ? '100%' : (maximum.width ?? '100%'),
          maxHeight: original ? 'none' : fixedImage ? '100%' : (maximum.height ?? '100%'),
          minWidth: 0,
          minHeight: 0,
          objectFit: original ? 'none' : imageFill ? 'cover' : 'contain',
          objectPosition: original ? 'left top' : 'center',
          flexShrink: original ? 0 : undefined,
          cursor: linkUrl ? 'pointer' : 'default',
        }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 150,
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary',
        }}
      >
        이미지 URL을 입력하면 여기에 표시됩니다.
      </Box>
    );

    const linkedImage =
      linkUrl && imageUrl ? (
        <Box
          component="a"
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          sx={{ display: 'contents' }}
        >
          {image}
        </Box>
      ) : (
        image
      );

    if (imageFill) {
      return (
        <Box
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            overflow: 'hidden',
            alignItems: 'flex-start',
          }}
        >
          {linkedImage}
        </Box>
      );
    }

    // FIT_TO_IMAGE는 이미지 칸이 이미지 크기를 그대로 담고(Auto), ADAPTIVE는 imageAreaRatio 비율로 칸을 나눈다.
    const imageArea = (
      <Box
        sx={{
          flex: fixedImage ? '0 0 auto' : showDescription ? `${areaRatio} 1 0` : '1 1 0',
          minWidth: 0,
          minHeight: fixedImage ? undefined : 150,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: '#f4f6fa',
          overflow: 'hidden',
        }}
      >
        {linkedImage}
      </Box>
    );
    if (!showDescription) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', width: '100%' }}>
          {imageArea}
        </Stack>
      );
    }

    const descriptionArea = (
      <Box
        sx={{
          minWidth: 0,
          minHeight: 0,
          overflowY: 'auto',
          ...(placement === 'RIGHT'
            ? fixedImage
              ? { flex: `0 0 ${fitLayout?.descriptionWidth ?? IMAGE_DESCRIPTION_WIDTH}px` }
              : { flex: `${1 - areaRatio} 1 0` }
            : fixedImage
              ? { flex: '1 1 0' }
              : { flex: `${1 - areaRatio} 1 0` }),
        }}
      >
        <Typography color="text.secondary">{description}</Typography>
      </Box>
    );

    return (
      <Stack
        direction={placement === 'RIGHT' ? 'row' : 'column'}
        spacing={2}
        alignItems={fixedImage ? 'center' : 'stretch'}
        sx={{ height: '100%', width: '100%', minHeight: 0 }}
      >
        {imageArea}
        {descriptionArea}
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
          완료 기준 {Math.round((popup.completionRatio ?? 1) * 100)}% · 기본 음량{' '}
          {Math.round((Number.isFinite(defaultVolume) ? defaultVolume : 0.7) * 100)}%
        </Typography>
      </Stack>
    );
  }

  if (popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ') {
    return survey ? <SurveyPreview {...survey} description={description} /> : null;
  }

  const showContentHeader = content.showContentHeader !== false;
  const showPlainText = content.showPlainText !== false;
  // [설계 18 L-4 — C-23] WPF TextPopupContentDto와 같이 플래그가 없으면 숨김(과거 행 fallback 삭제).
  const showHighlight = content.showHighlight === true;
  const showBottomDescription = content.showBottomDescription === true;

  const bottomUrl = normalizePopupLink(content.bottomDescriptionUrl);
  const bottomLabel = String(content.bottomDescription ?? '').trim() || bottomUrl;
  const bottomDescription =
    showBottomDescription &&
    bottomLabel &&
    (bottomUrl ? (
      <Paper
        component="a"
        href={bottomUrl}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        title={bottomUrl}
        sx={{
          display: 'block',
          p: 2,
          bgcolor: '#f8f9fc',
          whiteSpace: 'pre-wrap',
          color: '#2563eb',
          cursor: 'pointer',
          textDecoration: 'underline',
          overflowWrap: 'anywhere',
          '&:hover, &:focus-visible': { color: '#1d4ed8', bgcolor: '#eff6ff' },
        }}
      >
        {bottomLabel}
      </Paper>
    ) : (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fc', whiteSpace: 'pre-wrap' }}>
        {bottomLabel}
      </Paper>
    ));

  return (
    <Stack spacing={2}>
      {showContentHeader && <Typography color="text.secondary">{description}</Typography>}
      {showPlainText && (
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{String(content.plainText ?? '')}</Typography>
      )}
      {showHighlight && (
        <Box
          sx={{
            p: 1.5,
            border: '1px solid #93c5fd',
            borderRadius: 1,
            bgcolor: '#eff6ff',
            color: '#1d4ed8',
          }}
        >
          {text(content.highlightText, '강조 문구')}
        </Box>
      )}
      {bottomDescription}
    </Stack>
  );
}

export default function PopupPreview({
  popup: configuredPopup,
  fitContainer = false,
  showBackground = true,
  onClose,
  onRecommendedSize,
}: PopupPreviewProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [answers, setAnswers] = useState<Record<number, PreviewAnswer>>({});
  const [submissionStatus, setSubmissionStatus] = useState('');
  const namePrefix = useId();
  const isSurvey = configuredPopup.popupType === 'SURVEY' || configuredPopup.popupType === 'QUIZ';
  const popup =
    showExamples && isSurvey
      ? {
          ...configuredPopup,
          questions: popupDemoQuestions(configuredPopup.popupType === 'QUIZ'),
          passingScore: configuredPopup.popupType === 'QUIZ' ? 100 : configuredPopup.passingScore,
        }
      : configuredPopup;
  const questionSignature = JSON.stringify(popup.questions);
  useEffect(() => {
    setAnswers({});
    setSubmissionStatus('');
  }, [configuredPopup.popupId, questionSignature]);
  const onAnswer = (id: number, answer: PreviewAnswer) => {
    setAnswers((previous) => ({ ...previous, [id]: answer }));
    setSubmissionStatus('');
  };
  const required = popup.questions.filter((question) => question.isRequired);
  const completed = required.filter((question) =>
    question.questionType === 'TEXT'
      ? Boolean(answers[question.questionId]?.text.trim())
      : Boolean(answers[question.questionId]?.optionIds.length),
  ).length;
  const remaining = required.length - completed;
  const progress = remaining
    ? `필수 문항 ${completed}/${required.length} 응답 · 남은 ${remaining}문항`
    : required.length
      ? `필수 문항 ${completed}/${required.length} 응답 완료`
      : '선택 문항에 자유롭게 응답해주세요.';
  const submitPreview = () => {
    if (popup.popupType !== 'QUIZ') {
      setSubmissionStatus('미리보기: 제출 완료');
      return;
    }
    const score = popup.questions
      .filter((question) => question.isScored)
      .reduce((total, question) => {
        const answer = answers[question.questionId];
        const correctIds = question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.optionId);
        const correctText = question.correctAnswer?.trim();
        const correct =
          question.questionType === 'TEXT'
            ? Boolean(
                correctText &&
                (question.answerMatchMode === 'CONTAINS'
                  ? answer?.text.trim().includes(correctText)
                  : question.answerMatchMode === 'EXACT' && answer?.text.trim() === correctText),
              )
            : Boolean(
                answer &&
                answer.optionIds.length === correctIds.length &&
                correctIds.every((id) => answer.optionIds.includes(id)),
              );
        return total + (correct ? (question.questionScore ?? 0) : 0);
      }, 0);
    const rounded = Math.round(score * 100) / 100;
    setSubmissionStatus(
      `미리보기: ${rounded}점 · ${rounded >= (popup.passingScore ?? 0) ? '통과' : '미통과'}`,
    );
  };
  const isVideoQuiz = popup.popupType === 'QUIZ' && popup.content.videoEnabled === true;
  const [previewWatchRatio, setPreviewWatchRatio] = useState(0);
  useEffect(
    () => setPreviewWatchRatio(0),
    [popup.popupId, popup.content.videoUrl, popup.completionRatio, isVideoQuiz],
  );
  const videoUnlocked = !isVideoQuiz || previewWatchRatio >= (popup.completionRatio ?? 1);
  const linkAction = popup.content.footerAction === 'LINK_AND_CLOSE';
  const footerLink = normalizePopupLink(String(popup.content.footerLinkUrl ?? ''));
  const handleFooter = () => {
    if (!videoUnlocked) return;
    if (linkAction) {
      if (!footerLink) return;
      window.open(footerLink, '_blank', 'noopener,noreferrer');
    }
    onClose?.();
  };
  const imageUrl = popup.popupType === 'IMAGE' ? String(popup.content.imageUrl ?? '').trim() : '';
  const [naturalImage, setNaturalImage] = useState<{ url: string; size: Size } | null>(null);
  const naturalImageSize = naturalImage && naturalImage.url === imageUrl ? naturalImage.size : null;
  const workArea: Size =
    typeof window === 'undefined'
      ? { width: 1920, height: 1040 }
      : { width: window.innerWidth, height: window.innerHeight };
  const fitLayout =
    popup.popupType === 'IMAGE' && imageSizeMode(popup) === 'FIT_TO_IMAGE' && naturalImageSize
      ? fitToImageLayout(popup, naturalImageSize, workArea)
      : null;
  // WPF와 같이 FULLSCREEN 팝업은 창 크기를 바꾸지 않는다.
  const recommendedWidth =
    fitLayout && popup.sizeMode !== 'FULLSCREEN' ? fitLayout.window.width : null;
  const recommendedHeight =
    fitLayout && popup.sizeMode !== 'FULLSCREEN' ? fitLayout.window.height : null;
  useEffect(() => {
    onRecommendedSize?.(
      recommendedWidth != null && recommendedHeight != null
        ? { width: recommendedWidth, height: recommendedHeight }
        : null,
    );
  }, [onRecommendedSize, recommendedWidth, recommendedHeight]);

  const overlayEnabled = popup.content.useBackgroundOverlay !== false;
  const requestedOpacity = Number(popup.content.backgroundOverlayOpacity ?? 0.45);
  const overlayOpacity = Number.isFinite(requestedOpacity)
    ? Math.max(0, Math.min(1, requestedOpacity))
    : 0.45;
  const size = fitContainer
    ? { width: '100%', height: '100%' }
    : previewSize(
        recommendedWidth != null && recommendedHeight != null
          ? { ...popup, sizeMode: 'FIXED', width: recommendedWidth, height: recommendedHeight }
          : popup,
      );
  const imageFill =
    popup.popupType === 'IMAGE' && ['FILL', 'ORIGINAL'].includes(imageSizeMode(popup));
  const contentTitle = text(contentValue(popup, titleKey(popup.popupType)), '콘텐츠 제목');
  // [설계 14 §5] 관리자 폰트 크기 미리보기. WPF와 같은 10~40 범위로 보정하고, 없으면 기존 미리보기 크기를 유지한다.
  const headerFontSize = fontSize(popup, 'headerFontSize');
  const bodyFontSize = fontSize(popup, 'bodyFontSize');
  const footerFontSize = fontSize(popup, 'footerFontSize');
  const showContentTitle =
    !imageFill && (popup.popupType !== 'TEXT' || popup.content.showContentHeader !== false);

  return (
    <Box
      sx={{
        minHeight: fitContainer ? 0 : 570,
        height: fitContainer ? '100%' : undefined,
        p: showBackground ? 2 : 0,
        flex: fitContainer ? 1 : undefined,
        boxSizing: 'border-box',
        position: 'relative',
        isolation: 'isolate',
        '&::before':
          showBackground && overlayEnabled
            ? {
                content: '""',
                position: 'absolute',
                inset: 0,
                bgcolor: `rgba(0, 0, 0, ${overlayOpacity})`,
                zIndex: -1,
              }
            : undefined,
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: isSurvey ? surveyColors.chipHover : '#e9edf4',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Paper
        elevation={isSurvey ? 0 : 8}
        sx={{
          ...size,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: 'white',
        }}
      >
        {isSurvey && (
          <Box sx={{ px: 3, pt: 1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" color="inherit" onClick={() => setShowExamples((value) => !value)}>
              {showExamples ? '입력한 문항 보기' : '예제 문항 보기'}
            </Button>
            {showExamples && (
              <Typography variant="caption" sx={{ color: surveyColors.muted }}>
                예제는 저장되지 않습니다.
              </Typography>
            )}
          </Box>
        )}
        {isVideoQuiz && (
          <Box sx={{ px: 2, pt: 1, bgcolor: surveyColors.card, flexShrink: 0 }}>
            <Typography variant="caption">
              미리보기 시청 비율: {Math.round(previewWatchRatio * 100)}% (완료 기준{' '}
              {Math.round((popup.completionRatio ?? 1) * 100)}%)
            </Typography>
            <Slider
              size="small"
              aria-label="미리보기 시청 비율"
              value={previewWatchRatio * 100}
              min={0}
              max={100}
              onChange={(_, value) => setPreviewWatchRatio(Number(value) / 100)}
              sx={{ color: surveyColors.focus }}
            />
          </Box>
        )}
        {popup.showHeader && (
          <Stack direction="row" alignItems="center" sx={{ minHeight: 52, px: 2, flexShrink: 0 }}>
            <Typography
              fontWeight={700}
              sx={{
                flex: 1,
                minWidth: 0,
                overflowWrap: 'anywhere',
                fontSize: headerFontSize ?? undefined,
              }}
            >
              {text(popup.title, '팝업 제목')}
            </Typography>
            {popup.showCloseButton && (
              <IconButton
                size="small"
                aria-label="닫기 미리보기"
                disabled={isVideoQuiz && !videoUnlocked && !popup.allowCloseBeforeComplete}
                onClick={onClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
        {popup.showHeader && <Divider />}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflowY: imageFill ? 'hidden' : 'auto',
            overflowX: 'hidden',
            overflowWrap: 'anywhere',
            p: imageFill ? 0 : 3,
            ...(isSurvey
              ? {
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${surveyColors.check} transparent`,
                  '&::-webkit-scrollbar': { width: 8 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: surveyColors.check,
                    borderRadius: '4px',
                    '&:hover': { bgcolor: surveyColors.placeholder },
                  },
                }
              : {}),
          }}
        >
          {showContentTitle && (
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                mb: isSurvey ? 1 : 2,
                ...(isSurvey ? { fontSize: 25, color: surveyColors.text } : {}),
              }}
            >
              {contentTitle}
            </Typography>
          )}
          {/* 본문 폰트 크기: 하위 Typography가 상속받도록 inherit 처리(콘텐츠 제목 h5는 제외 — WPF도 제목은 유지) */}
          <Box
            sx={{
              ...(imageFill ? { height: '100%', overflow: 'hidden' } : {}),
              ...(bodyFontSize
                ? { fontSize: bodyFontSize, '& .MuiTypography-root': { fontSize: 'inherit' } }
                : {}),
            }}
          >
            <PopupBody
              popup={popup}
              videoUnlocked={videoUnlocked}
              naturalImageSize={naturalImageSize}
              fitLayout={fitLayout}
              onImageLoad={(size) => setNaturalImage({ url: imageUrl, size })}
              survey={{
                questions: popup.questions,
                answers,
                onAnswer,
                disabled: !videoUnlocked,
                namePrefix,
              }}
            />
          </Box>
        </Box>
        {isSurvey && (
          <Box
            sx={{ px: 3, py: 1.75, flexShrink: 0, borderTop: `1px solid ${surveyColors.border}` }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: surveyColors.muted, fontSize: footerFontSize ?? 13 }}>
                  {progress}
                </Typography>
                {submissionStatus && (
                  <Typography role="status" sx={{ color: surveyColors.muted, fontSize: 13 }}>
                    {submissionStatus}
                  </Typography>
                )}
                {popup.showFooter && popup.showDoNotShowAgain && (
                  <FormControlLabel
                    disabled={!videoUnlocked}
                    control={
                      <Checkbox
                        size="small"
                        sx={{
                          color: surveyColors.muted,
                          '&.Mui-checked': { color: surveyColors.text },
                        }}
                      />
                    }
                    label="다시 보지 않기"
                  />
                )}
              </Box>
              <Button
                variant="contained"
                sx={{ ...surveySubmitSx, fontSize: footerFontSize ?? 14 }}
                disabled={!videoUnlocked || remaining > 0 || !popup.questions.length}
                onClick={submitPreview}
              >
                제출
              </Button>
            </Stack>
          </Box>
        )}
        {!isSurvey && popup.showFooter && (
          <>
            <Divider />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.5,
                flexShrink: 0,
                flexWrap: 'wrap',
                gap: 1,
                ...(footerFontSize
                  ? {
                      fontSize: footerFontSize,
                      '& .MuiFormControlLabel-label, & .MuiButton-root': { fontSize: 'inherit' },
                    }
                  : {}),
              }}
            >
              {popup.showDoNotShowAgain ? (
                <FormControlLabel
                  disabled={!videoUnlocked}
                  control={<Checkbox size="small" />}
                  label="다시 보지 않기"
                />
              ) : (
                <span />
              )}
              {popup.showCloseButton && (
                <Button
                  variant="contained"
                  color="inherit"
                  sx={{ minWidth: 92 }}
                  disabled={!videoUnlocked || (linkAction && !footerLink)}
                  onClick={handleFooter}
                >
                  {linkAction ? '바로가기' : '닫기'}
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

/** [설계 14 §5.7] content의 폰트 크기 값을 읽어 10~40으로 보정한다. 없거나 숫자가 아니면 null(기본 크기). */
function fontSize(
  popup: AdminPopupDetail,
  key: 'headerFontSize' | 'bodyFontSize' | 'footerFontSize',
): number | null {
  const value = popup.content[key];
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(10, Math.min(40, number)) : null;
}
