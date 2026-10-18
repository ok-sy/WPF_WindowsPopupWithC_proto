import SurveyPreview, {
  surveyColors,
  surveySubmitSx,
  type PreviewAnswer,
  type SurveyPreviewProps,
} from './SurveyPreview';
import popupDemoQuestions from './popupDemoQuestions';
import normalizePopupLink from './normalizePopupLink';
import { readTextBlocks, RICH_INDENT_STEP, richFontCss } from './popupRichText';
import { popupFontSize } from './popupCommon';
import {
  fitToImageLayout,
  imageSizeMode,
  POPUP_FOOTER_HEIGHT,
  POPUP_HEADER_HEIGHT,
  type FitToImageLayout,
  type Size,
} from './imagePreviewLayout';
import type { AdminPopupDetail } from '@local/domain';
import { routerUrlOf } from '@/lib/urls';
import { type SyntheticEvent, useEffect, useId, useState } from 'react';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  Slider,
  Stack,
  Typography,
} from '@mui/material';

// [설계 18 L-0 W-2] 새 창 미리보기 페이지(pages/popup-preview.tsx)를 여는 코드가 없어 페이지와 함께
// standalone prop·분기를 삭제했다. 미리보기는 편집기 내 패널과 "실제 크기로 보기" 모달만 사용하며 둘 다 부모 영역을 채운다.
interface PopupPreviewProps {
  popup: AdminPopupDetail;
  showBackground?: boolean;
  onClose?: () => void;
  /** [설계 18 L-5 — W-10] IMAGE FIT_TO_IMAGE에서 WPF가 다시 계산할 팝업 창 크기. 그 외에는 null. */
  onRecommendedSize?: (size: Size | null) => void;
}

function text(value: unknown, fallback: string): string {
  return value == null || String(value).trim() === '' ? fallback : String(value);
}

/* [설계 50 A1] WPF 체크박스와 같이 실제 숨김 일수(서버 hideDays, 비우면 WPF 기본 30일)를 표시한다. */
function doNotShowAgainLabel(hideDays?: number | null): string {
  return `${hideDays && hideDays > 0 ? hideDays : 30}일간 보지 않기`;
}

/** WPF `{ratio * 100:0.##}`와 같이 비율을 소수 둘째 자리까지의 % 문자열로 바꾼다(0~1 보정). */
function percentText(ratio: number): string {
  return String(Math.round(Math.max(0, Math.min(1, ratio)) * 10000) / 100);
}

/** [설계 37] TEXT는 콘텐츠 제목이 본문(textBlocks)에 포함되어 별도 제목이 없다. */
function contentTitle(popup: AdminPopupDetail): string {
  const content = popup.content;
  if (popup.popupType === 'TEXT') return '';
  if (popup.popupType === 'IMAGE') return String(content.imageTitle ?? '');
  return text(popup.popupType === 'VIDEO' ? content.videoTitle : content.surveyTitle, '콘텐츠 제목');
}

interface PopupBodyProps {
  popup: AdminPopupDetail;
  naturalImageSize: Size | null;
  fitLayout: FitToImageLayout | null;
  onImageLoad: (size: Size) => void;
  videoUnlocked?: boolean;
  /** [설계 53-16] VIDEO+QUIZ에서 위 영상 영역에 이미 보인 설명을 퀴즈 머리말에서 반복하지 않는다(WPF VideoQuizPopupView와 같음). */
  hideSurveyDescription?: boolean;
  survey?: Omit<SurveyPreviewProps, 'description'>;
}

function PopupBody({
  popup,
  naturalImageSize,
  fitLayout,
  onImageLoad,
  videoUnlocked = false,
  hideSurveyDescription = false,
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
        {/* WPF VideoQuizPopupView 안내 문구와 같다(기준 비율 포함). */}
        <Typography variant="body2" sx={{ color: surveyColors.muted }}>
          {videoUnlocked
            ? '시청 기준을 충족했습니다. 퀴즈에 응답해 주세요.'
            : `영상을 ${percentText(popup.completionRatio ?? 1)}% 이상 시청하면 퀴즈와 하단 버튼이 활성화됩니다.`}
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
            hideSurveyDescription={content.showDescription !== false}
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
    const showDescription = !original && content.showDescription !== false && Boolean(String(content.description ?? '').trim());

    const fixedImage = mode === 'FIT_TO_IMAGE' ? fitLayout?.image : undefined;
    // ADAPTIVE는 원본보다 확대하지 않는다(별도 이미지 크기 상한 없음).
    const maximum: Partial<Size> = mode === 'ADAPTIVE' ? (naturalImageSize ?? {}) : {};

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
          maxWidth: original ? 'none' : fixedImage ? 'none' : (maximum.width ?? '100%'),
          maxHeight: original ? 'none' : fixedImage ? 'none' : (maximum.height ?? '100%'),
          minWidth: 0,
          minHeight: 0,
          objectFit: original ? 'none' : fixedImage && content.keepAspectRatio === false ? 'fill' : 'contain',
          objectPosition: original ? 'left top' : 'center',
          flexShrink: original || fixedImage ? 0 : undefined,
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

    if (original) {
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
          {image}
        </Box>
      );
    }

    // The viewport flexes; FIT_TO_IMAGE bitmap dimensions remain fixed when the viewport clips.
    const imageArea = (
      <Box
        sx={{
          flex: '1 1 0',
          width: '100%',
          minWidth: 0,
          minHeight: 0,
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
        {image}
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
          flex: '0 1 auto',
          maxHeight: fixedImage ? `min(${fixedImage.height * 0.3}px, 30%)` : '30%',
          width: '100%',
          p: 2,
          border: '1px solid #EEF0F3',
        }}
      >
        <Typography color="text.secondary">{String(content.description ?? '')}</Typography>
      </Box>
    );

    return (
      <Stack
        direction="column"
        spacing={1.75}
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
            <Typography variant="caption">▶ 00:00 / 00:00{content.allowSeek === false ? ' · 탐색 제한' : ''}</Typography>
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
    return survey ? <SurveyPreview {...survey} description={hideSurveyDescription ? '' : description} /> : null;
  }

  const showPlainText = content.showPlainText !== false;
  const richBlocks = readTextBlocks(content.textBlocks);
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
      {showPlainText && (richBlocks
        ? <Box>{richBlocks.map((block, index) => (
            /* [설계 28] 서식 본문은 React 요소로만 만든다(innerHTML 사용 안 함). 빈 문단도 한 줄 높이 유지. */
            /* [설계 49] 들여쓰기는 문단 전체 왼쪽 여백(줄바꿈된 줄 포함). WPF 40 DIP와 같은 40px 단위. */
            <Typography key={index} component="div" sx={{ whiteSpace: 'pre-wrap', textAlign: block.alignment.toLowerCase(), minHeight: '1.5em',
              pl: `${(block.indent ?? 0) * RICH_INDENT_STEP}px` }}>
              {block.runs.map((run, runIndex) => (
                <Box key={runIndex} component="span" sx={{
                  fontWeight: run.bold ? 700 : undefined, fontStyle: run.italic ? 'italic' : undefined,
                  textDecoration: run.underline ? 'underline' : undefined, color: run.color,
                  fontSize: run.size ? `${run.size}px` : undefined, fontFamily: richFontCss(run.font),
                }}>{run.text}</Box>
              ))}
            </Typography>
          ))}</Box>
        : <Typography sx={{ whiteSpace: 'pre-wrap' }}>{String(content.plainText ?? '')}</Typography>
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
  // [설계 43] QUIZ 미달 판정을 한 번이라도 받았는지(보조 닫기 버튼 표시 조건). 답을 고쳐도 유지한다.
  const [quizFailed, setQuizFailed] = useState(false);
  useEffect(() => {
    setAnswers({});
    setSubmissionStatus('');
    setQuizFailed(false);
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
    // [설계 43] WPF 미달 안내와 같이 틀린 채점 문항의 화면 번호(1부터)를 모은다.
    const wrongNumbers: number[] = [];
    const score = popup.questions
      .reduce((total, question, index) => {
        if (!question.isScored) return total;
        const answer = answers[question.questionId];
        const correctIds = question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.optionId);
        const correctText = question.correctAnswer?.trim();
        // 편집기와 같이 일치 방식이 비어 있으면 EXACT로 본다.
        const matchMode = question.answerMatchMode ?? 'EXACT';
        const correct =
          question.questionType === 'TEXT'
            ? Boolean(
                correctText &&
                (matchMode === 'CONTAINS'
                  ? answer?.text.trim().includes(correctText)
                  : matchMode === 'EXACT' && answer?.text.trim() === correctText),
              )
            : Boolean(
                answer &&
                answer.optionIds.length === correctIds.length &&
                correctIds.every((id) => answer.optionIds.includes(id)),
              );
        if (!correct) wrongNumbers.push(index + 1);
        return total + (correct ? (question.questionScore ?? 0) : 0);
      }, 0);
    const rounded = Math.round(score * 100) / 100;
    const passed = rounded >= (popup.passingScore ?? 0);
    if (!passed) setQuizFailed(true);
    setSubmissionStatus(
      `미리보기: ${rounded}점 · ${passed ? '통과' : '미통과'}` +
        (!passed && wrongNumbers.length ? ` · 틀린 문항: ${wrongNumbers.join(', ')}번` : ''),
    );
  };
  const isVideoQuiz = popup.popupType === 'QUIZ' && popup.content.videoEnabled === true;
  const isPlainVideo = popup.popupType === 'VIDEO';
  // 미리보기 시청 비율은 슬라이더의 정수 %로 둔다(실제 재생 없음).
  const [previewWatchPercent, setPreviewWatchPercent] = useState(0);
  useEffect(
    () => setPreviewWatchPercent(0),
    [popup.popupId, popup.popupType, popup.content.videoUrl, popup.completionRatio, isVideoQuiz],
  );
  const requiredRatio = Math.max(0, Math.min(1, popup.completionRatio ?? 1));
  const requiredPercent = percentText(requiredRatio);
  /*
   * [설계 43] WPF는 누적 시청 비율을 소수점 4자리에서 내림한 뒤 완료 기준 이상인지 본다.
   * 미리보기 시청 비율은 정수 %(p/100)라 4자리 내림이 값을 바꾸지 않으므로 그대로 비교한다
   * (부동소수 곱셈으로 내림을 흉내 내면 0.29*10000 = 2899.99…처럼 오히려 결과가 달라진다).
   */
  const watchReached = previewWatchPercent / 100 >= requiredRatio;
  const videoUnlocked = !isVideoQuiz || watchReached;
  // [설계 43] 일반 VIDEO는 allowCloseBeforeComplete=false이고 시청 기준 미달이면 Footer 버튼을 비활성화한다.
  const videoCloseBlocked = isPlainVideo && !popup.allowCloseBeforeComplete && !watchReached;
  const linkAction = popup.content.footerAction === 'LINK_AND_CLOSE';
  const footerLink = normalizePopupLink(String(popup.content.footerLinkUrl ?? ''));
  const resetPreview = () => {
    setAnswers({});
    setSubmissionStatus('');
    setQuizFailed(false);
    setPreviewWatchPercent(0);
  };
  const handleFooter = () => {
    if (!videoUnlocked || videoCloseBlocked) return;
    if (linkAction) {
      if (!footerLink) return;
      window.open(footerLink, '_blank', 'noopener,noreferrer');
    }
    onClose?.();
  };
  const imageUrl = popup.popupType === 'IMAGE' ? String(popup.content.imageUrl ?? '').trim() : '';
  const [naturalImage, setNaturalImage] = useState<{ url: string; size: Size } | null>(null);
  const naturalImageSize = naturalImage && naturalImage.url === imageUrl ? naturalImage.size : null;
  const [workArea, setWorkArea] = useState<Size>(() =>
    typeof window === 'undefined'
      ? { width: 1920, height: 1040 }
      : { width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const resize = () => setWorkArea({width: window.innerWidth, height: window.innerHeight});
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const fitLayout =
    popup.popupType === 'IMAGE' && imageSizeMode(popup) === 'FIT_TO_IMAGE' && naturalImageSize
      ? fitToImageLayout(popup, naturalImageSize, workArea)
      : null;
  const naturalLayout = popup.popupType === 'IMAGE' && imageSizeMode(popup) === 'ADAPTIVE' && naturalImageSize
    && (popup.content.width == null || popup.content.height == null)
    ? fitToImageLayout({...popup, content: {...popup.content, width: null, height: null, keepAspectRatio: true}}, naturalImageSize, workArea)
    : null;
  const clampWindowAxis = (value: unknown, fallback: number, minimum: number, available: number) =>
    Math.max(Math.min(minimum, available * .90), Math.min(available * .90, Number(value ?? fallback)));
  // WPF와 같이 FULLSCREEN 팝업은 창 크기를 바꾸지 않는다.
  const recommendedWidth =
    popup.sizeMode === 'FULLSCREEN' ? null : fitLayout?.window.width ?? (naturalLayout
      ? clampWindowAxis(popup.content.width, naturalLayout.window.width, popup.minimumWidth, workArea.width) : null);
  const recommendedHeight =
    popup.sizeMode === 'FULLSCREEN' ? null : fitLayout?.window.height ?? (naturalLayout
      ? clampWindowAxis(popup.content.height, naturalLayout.window.height, popup.minimumHeight, workArea.height) : null);
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
  const originalImage =
    popup.popupType === 'IMAGE' && imageSizeMode(popup) === 'ORIGINAL';
  const title = contentTitle(popup);
  // [설계 14 §5] 관리자 폰트 크기 미리보기. WPF와 같은 10~40 범위로 보정하고, 없으면 기존 미리보기 크기를 유지한다.
  const headerFontSize = popupFontSize(popup, 'headerFontSize');
  const bodyFontSize = popupFontSize(popup, 'bodyFontSize');
  const footerFontSize = popupFontSize(popup, 'footerFontSize');
  const showContentTitle = !originalImage && Boolean(title.trim());
  // [설계 43] 완료 조건 미달 시 버튼은 비활성 + 사유 표시. 사유 문구는 role=status로 알리고 버튼 aria-describedby로 연결한다.
  const reasonId = `${namePrefix}-completion-reason`;
  const surveyProgress =
    isVideoQuiz && !videoUnlocked
      ? `영상 ${previewWatchPercent}% · 기준 ${requiredPercent}% 이상 시청하면 퀴즈와 제출이 활성화됩니다`
      : progress;
  const videoReason =
    isPlainVideo && !popup.allowCloseBeforeComplete
      ? watchReached
        ? '시청 기준을 충족했습니다'
        : `영상 ${previewWatchPercent}% 시청 · 기준 ${requiredPercent}% 이상 시청하면 닫을 수 있습니다`
      : '';
  /*
   * [설계 43] 보조 "닫기" 버튼: VIDEO+QUIZ는 완료 전 닫기 허용일 때(WPF의 재생 실패 조건은 미리보기에 없어 생략),
   * QUIZ(영상 없음)는 미달 판정을 한 번 받은 뒤 배경 어둡기를 쓰지 않을 때만. SURVEY는 없고 showFooter=false면 숨긴다.
   * 미리보기에서는 응답·시청 비율을 초기화하고 "실제 크기로 보기" 모달이면 닫는다.
   */
  const showSecondaryClose =
    popup.showFooter &&
    (isVideoQuiz
      ? popup.allowCloseBeforeComplete
      : popup.popupType === 'QUIZ' && quizFailed && !overlayEnabled);
  const submitDisabled = !videoUnlocked || remaining > 0 || !popup.questions.length;
  // [TODO52-2] "나중에 보기"는 푸터가 보일 때 showLater로만 표시하고, 완료 전 닫기 잠금(시청·제출 조건)과 관계없이 누를 수 있다.
  const showLaterButton = popup.showFooter && Boolean(popup.showLater);
  const laterPreview = () => {
    resetPreview();
    onClose?.();
  };
  const footerButtonDisabled = videoCloseBlocked || (linkAction && !footerLink);

  return (
    <Box
      sx={{
        minHeight: 0,
        height: '100%',
        p: showBackground ? 2 : 0,
        ...(popup.popupType === 'IMAGE' && popup.sizeMode !== 'FULLSCREEN' ? {p: '24px'} : {}),
        flex: 1,
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
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          // SURVEY·QUIZ(VIDEO+QUIZ 포함)는 WPF와 같이 본문·푸터까지 설문 콘텐츠 배경(옅은 회색)이다.
          bgcolor: isSurvey ? surveyColors.content : 'white',
          // WPF PopupBodyBorder BorderThickness=0(설계 25)과 같이 IMAGE 창 테두리를 그리지 않는다.
          ...(popup.popupType === 'IMAGE' ? {boxSizing: 'border-box'} : {}),
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
        {(isVideoQuiz || isPlainVideo) && (
          <Box sx={{ px: 2, pt: 1, bgcolor: surveyColors.card, flexShrink: 0 }}>
            <Typography variant="caption">
              미리보기 시청 비율: {previewWatchPercent}% (완료 기준 {requiredPercent}%
              {isPlainVideo && popup.allowCloseBeforeComplete ? ' · 완료 전 닫기 허용' : ''})
            </Typography>
            <Slider
              size="small"
              aria-label="미리보기 시청 비율"
              value={previewWatchPercent}
              min={0}
              max={100}
              step={1}
              onChange={(_, value) => setPreviewWatchPercent(Number(value))}
              sx={{ color: surveyColors.focus }}
            />
          </Box>
        )}
        {popup.showHeader && (
          // WPF PopupWindow.xaml HeaderRow(Height=40)는 유형과 관계없는 공통 행이다. 제목은 TextTrimming처럼 한 줄 말줄임으로 그린다.
          // 미리보기 Header는 흰색이라 IMAGE 외 유형은 구분선을 Header 높이 안(border-box)에 둔다.
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              height: POPUP_HEADER_HEIGHT,
              boxSizing: 'border-box',
              pl: '18px',
              pr: 2,
              flexShrink: 0,
              ...(popup.popupType !== 'IMAGE' ? { borderBottom: 1, borderColor: 'divider' } : {}),
            }}
          >
            <Typography
              fontWeight={700}
              sx={{
                flex: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: headerFontSize ?? undefined,
              }}
            >
              {text(popup.title, '팝업 제목')}
            </Typography>
            {/* WPF PopupWindow.xaml HeaderLogo와 같이 상단 닫기 버튼 없이 오른쪽에 고정 로고(100x24, Uniform, 오른쪽 여백 18)만 표시한다.
                닫기는 하단 버튼 또는 "실제 크기로 보기" 모달의 종료 버튼으로 한다. */}
            <Box
              component="img"
              src={routerUrlOf('/images/popup-header-logo.png')}
              alt=""
              aria-hidden
              draggable={false}
              sx={{ width: 100, height: 24, ml: 1.5, mr: '2px', objectFit: 'contain', flexShrink: 0, pointerEvents: 'none', userSelect: 'none' }}
            />
          </Stack>
        )}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflowY: popup.popupType === 'IMAGE' ? 'hidden' : 'auto',
            ...(popup.popupType === 'IMAGE' ? {display: 'flex', flexDirection: 'column'} : {}),
            overflowX: 'hidden',
            overflowWrap: 'anywhere',
            p: originalImage ? 0 : 3,
            ...(popup.popupType === 'IMAGE' && !originalImage ? {px: '28px', py: '24px'} : {}),
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
                ...(popup.popupType === 'IMAGE' ? {fontSize: 22, fontWeight: 600, flexShrink: 0} : {}),
                ...(isSurvey ? { fontSize: 25, color: surveyColors.text } : {}),
              }}
            >
              {title}
            </Typography>
          )}
          {/* 본문 폰트 크기: 하위 Typography가 상속받도록 inherit 처리(콘텐츠 제목 h5는 제외 — WPF도 제목은 유지) */}
          <Box
            sx={{
              ...(popup.popupType === 'IMAGE' ? { flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' } : {}),
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
                <Typography
                  id={reasonId}
                  role="status"
                  aria-live="polite"
                  sx={{ color: surveyColors.muted, fontSize: footerFontSize ?? 13 }}
                >
                  {surveyProgress}
                </Typography>
                {submissionStatus && (
                  <Typography role="status" aria-live="polite" sx={{ color: surveyColors.muted, fontSize: 13 }}>
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
                    label={doNotShowAgainLabel(popup.hideDays)}
                  />
                )}
              </Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                {showLaterButton && (
                  <Button
                    variant="text"
                    color="inherit"
                    sx={{ color: surveyColors.muted, fontSize: footerFontSize ?? 14 }}
                    onClick={laterPreview}
                  >
                    나중에 보기
                  </Button>
                )}
                {showSecondaryClose && (
                  <Button
                    variant="text"
                    color="inherit"
                    sx={{ color: surveyColors.muted, fontSize: footerFontSize ?? 14 }}
                    onClick={() => {
                      resetPreview();
                      onClose?.();
                    }}
                  >
                    닫기
                  </Button>
                )}
                {/* 문항 0개는 편집기 저장 검증("문항을 한 개 이상 추가해 주세요.")이 막으므로 미리보기에서도 비활성으로 둔다.
                    필수 문항이 0개(선택 문항만)이면 WPF와 같이 바로 제출할 수 있다. */}
                <Button
                  variant="contained"
                  sx={{ ...surveySubmitSx, fontSize: footerFontSize ?? 14 }}
                  disabled={submitDisabled}
                  aria-describedby={submitDisabled ? reasonId : undefined}
                  onClick={submitPreview}
                >
                  제출
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
        {!isSurvey && popup.showFooter && (
          <>
            {popup.popupType !== 'IMAGE' && <Divider />}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.5,
                ...(popup.popupType === 'IMAGE' ? {height: POPUP_FOOTER_HEIGHT, boxSizing: 'border-box'} : {}),
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
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                {popup.showDoNotShowAgain ? (
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label={doNotShowAgainLabel(popup.hideDays)}
                  />
                ) : (
                  <span />
                )}
                {videoReason && (
                  <Typography
                    id={reasonId}
                    role="status"
                    aria-live="polite"
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: footerFontSize ?? undefined }}
                  >
                    {videoReason}
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                {showLaterButton && (
                  <Button variant="text" color="inherit" onClick={laterPreview}>
                    나중에 보기
                  </Button>
                )}
                {popup.showCloseButton && (
                  <Button
                    variant="contained"
                    color="inherit"
                    sx={{ minWidth: 92 }}
                    disabled={footerButtonDisabled}
                    aria-describedby={videoCloseBlocked ? reasonId : undefined}
                    onClick={handleFooter}
                  >
                    {linkAction ? '바로가기' : '닫기'}
                  </Button>
                )}
              </Stack>
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}
