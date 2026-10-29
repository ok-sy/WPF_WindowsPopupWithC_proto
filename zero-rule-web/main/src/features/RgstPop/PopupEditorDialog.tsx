import normalizePopupLink from '../PopupcommonComponent/normalizePopupLink';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type {
  AdminPopupDetail,
  PopupDisplayMode,
  PopupSizeMode,
  PopupTargetCondition,
  PopupTargetConditionType,
  PopupTargetGroup,
  PopupType,
} from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  FormControlLabel, IconButton, LinearProgress, MenuItem, Stack, Switch,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import InlinePopupPreview from '../PopupcommonComponent/InlinePopupPreview';
import PopupPreviewDialog from '../PopupcommonComponent/PopupPreviewDialog';
import { previewOverlay } from '../PopupcommonComponent/popupPreviewDialogLayout';
import { displayImageSize, type Size } from '../PopupcommonComponent/imagePreviewLayout';
import PopupQuestionEditor, { validatePopupQuestions } from '../PopupcommonComponent/PopupQuestionEditor';
import PopupQuizRuleFields from '../PopupcommonComponent/PopupQuizRuleFields';
import { QUIZ_QUESTION_SCORE, usePopupQuizRule } from '../PopupcommonComponent/popupQuizRule';
import PopupTemplateDialog from './PopupTemplateDialog';
import PopupQuestionTemplatePicker from './PopupQuestionTemplatePicker';
import PopupRichTextEditor from '../PopupcommonComponent/PopupRichTextEditor';
import PopupScheduleFields, { validatePopupSchedule } from '../PopupcommonComponent/PopupScheduleFields';
import { plainTextToBlocks, readTextBlocks } from '../PopupcommonComponent/popupRichText';
import { richBlocksOrNull } from '../PopupcommonComponent/PopupRichBlocks';
import { FONT_SIZE_MAX, FONT_SIZE_MIN, POPUP_MIN_WINDOW_SIZE, POPUP_TYPE_LABELS, popupMinimumSize, type PopupFontSizeKey } from '../PopupcommonComponent/popupCommon';
import {
  changePopupType, contentValue, createDefaultPopup, isSubmitPopupType, normalizeImageSizeMode, toDateTimeLocal, toEditorPopup,
  toEditorPopupFromTemplate, toSaveRequest, withDefaultAnswerMatchMode, type PopupTypeSelection,
} from '../PopupcommonComponent/popupEditorTransform';

interface PopupEditorDialogProps {
  open: boolean;
  popupId: string | null;
  initialActive: boolean;
  onClose: () => void;
  onSaved: (popupId: string) => void;
}

/* WPF XAML 기본 크기(설정 없을 때 표시되는 값) — 입력란 placeholder 안내용. Header 17 / Footer 14 / 본문은 유형별(TEXT 15, IMAGE·VIDEO 14, 설문 12). */
const FONT_SIZE_DEFAULT_HINT: Record<PopupFontSizeKey, string> = {
  headerFontSize: '17', bodyFontSize: '유형별(12~15)', footerFontSize: '14',
};

/** content의 폰트 크기 값을 읽는다. 없거나 숫자가 아니면 null(미설정). */
function fontSizeValue(popup: AdminPopupDetail, key: PopupFontSizeKey): number | null {
  const value = popup.content[key];
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * POL-01-01 : 공통 옵션의 위치
 * ■ 영역별 폰트 크기 입력란
 * - Header / 본문 / Footer 폰트 크기 입력란 하나. 비우면 미설정(null → 기본 크기), 입력 완료 시 10~40으로 보정한다.
 * 정수 px 단위. WPF는 DIP 단위이지만 100% 배율에서 px와 같으므로 관리자에게는 px로 안내한다.
 */
function PopupFontSizeField({ label, popupKey, popup, onChange }: {
  label: string; popupKey: PopupFontSizeKey; popup: AdminPopupDetail; onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const current = fontSizeValue(popup, popupKey);
  return <TextField size="small" type="number" label={label} value={draft ?? (current ?? '')}
    placeholder={`기본 ${FONT_SIZE_DEFAULT_HINT[popupKey]}`} InputLabelProps={{ shrink: true }}
    inputProps={{ min: FONT_SIZE_MIN, max: FONT_SIZE_MAX, step: 1 }}
    helperText={`${FONT_SIZE_MIN}~${FONT_SIZE_MAX}px · 비우면 기본 크기`}
    onChange={(event) => {
      const input = event.target.value; setDraft(input);
      if (input === '') { onChange(null); return; }
      if (Number.isFinite(Number(input))) onChange(Math.round(Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, Number(input)))));
    }} onBlur={() => setDraft(null)} />;
}

/* POL-03-01 : 저장·표시 경계 — TEXT는 콘텐츠 제목 입력이 없다(본문 서식 편집기에 포함). 동영상+퀴즈도 QUIZ라 surveyTitle을 쓴다. */
function contentTitleKey(popupType: Exclude<PopupType, 'TEXT'>): string {
  if (popupType === 'IMAGE') return 'imageTitle';
  if (popupType === 'VIDEO') return 'videoTitle';
  return 'surveyTitle';
}
function PopupDimensionField({ label, value, minimum, maximum, helperText, onChange }: {
  label: string; value: number; minimum: number; maximum: number; helperText?: string; onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <TextField type="number" label={label} value={draft ?? value}
    helperText={helperText ?? `최소 ${minimum}px · 최대 ${maximum}px · 입력 완료 시 범위 자동 조정`}
    inputProps={{ min: minimum, max: maximum }}
    onChange={(event) => {
      const input = event.target.value; setDraft(input);
      if (input !== '' && Number.isFinite(Number(input)))
        onChange(Math.max(minimum, Math.min(maximum, Number(input))));
    }} onBlur={() => setDraft(null)} />;
}

/**
 * POL-07-01 : 부모의 데이터 소유
 * POL-07-03 : 저장 경계
 * POL-06-02 : 선택·제출
 * ■ 팝업 등록·수정 편집기(공통 컴포넌트 테스트 화면)
 * - in : open(boolean) 열림 · popupId(string | null) 수정할 팝업 ID(null = 신규) · initialActive(boolean) 활성 여부 초기값
 * - out: onClose() 닫기 · onSaved(popupId) 저장 성공 / api.popupAdmin.info·save 호출 · 화면: 입력 폼·우측 미리보기·실제 크기 모달
 * - 팝업 상세를 받아 공통 에디터·문항 편집기·퀴즈유형 입력으로 편집하고, 규칙을 적용한 값을 두 미리보기에 보여 준 뒤 저장 요청을 보낸다.
 *   퀴즈는 전달 샘플과 같은 공통 규칙(popupQuizRule: 문항 1점 고정, 만점 = 문항 수, 커트라인 N개 = N점, 실패 시 제출 불가)을 쓴다.
 */
export default function PopupEditorDialog({ open, popupId, initialActive, onClose, onSaved }: PopupEditorDialogProps) {
  const api = useApi();
  const [popup, setPopup] = useState<AdminPopupDetail>(createDefaultPopup);
  const [active, setActive] = useState(true);
  const [targetGroups, setTargetGroups] = useState<PopupTargetGroup[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  // POL-04-03 : 비율·상한 — 미리보기가 계산한 FIT_TO_IMAGE 팝업 창 크기(WPF RecommendedSizeChanged와 같은 값)
  const [fitWindow, setFitWindow] = useState<Size | null>(null);
  const [naturalImage, setNaturalImage] = useState<{url: string; size: Size} | null>(null);
  const imageUrl = String(popup.content.imageUrl ?? '');
  const naturalSize = naturalImage?.url === imageUrl ? naturalImage.size : null;
  useEffect(() => {
    if (!imageUrl) return;
    let canceled = false;
    const image = new Image();
    image.onload = () => { if (!canceled) setNaturalImage({url: imageUrl, size: {width: image.naturalWidth, height: image.naturalHeight}}); };
    image.src = imageUrl;
    return () => { canceled = true; };
  }, [imageUrl]);
  // POL-04-01 : 공통 크기 입력 — IMAGE 크기 입력은 popup.width/height다. FIT_TO_IMAGE 비율 고정이면 원본 비율로 반대 축을 연동한다.
  const updateImageDimension = (key: 'width' | 'height', input: string) => setPopup(previous => {
    const value = input === '' ? undefined : Number(input);
    const next = {...previous, [key]: value};
    if (naturalSize && previous.content.imageSizeMode === 'FIT_TO_IMAGE' && previous.content.keepAspectRatio !== false && value != null && value > 0)
      next[key === 'width' ? 'height' : 'width'] = Math.round((key === 'width' ? value * naturalSize.height / naturalSize.width : value * naturalSize.width / naturalSize.height) * 100) / 100;
    return next;
  });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /* POL-03-03 : 편집 UI — 본문 편집기는 커서 보존을 위해 처음 값만 받는다. 불러오기·템플릿 적용 시 key를 바꿔 다시 연다. */
  const [bodyEditorKey, setBodyEditorKey] = useState(0);
  const editing = popupId != null;
  /* 퀴즈 점수 규칙(문항 1점 고정, 만점 = 문항 수, 커트라인 N개 = N점). 편집값을 새로 채울 때(bodyEditorKey)마다 저장된 통과 점수로 유형을 복원한다.
   * 미리보기·저장에는 규칙을 적용한 previewPopup을 보낸다(전달 샘플 IS063M02와 같은 공통 코드). */
  const quiz = usePopupQuizRule(popup, bodyEditorKey);
  const previewPopup = quiz.effective ?? popup;

  useEffect(() => {
    if (!open) return;
    setActive(initialActive); setTemplateOpen(false); setPreviewOpen(false); setLoading(false);
    setBodyEditorKey((key) => key + 1);
    if (popupId == null) { setPopup(createDefaultPopup()); setTargetGroups([]); return; }
    let canceled = false; setLoading(true);
    api.popupAdmin.info({ popupId }).then(({ body }) => {
      if (!canceled) {
        setPopup(toEditorPopup(body.popup));
        setBodyEditorKey((key) => key + 1);
        setTargetGroups(body.targetGroups ?? []);
      }
    }).catch((error) => { if (!canceled) handleError(error); })
      .finally(() => { if (!canceled) setLoading(false); });
    return () => { canceled = true; };
  }, [api, initialActive, open, popupId]);

  const updatePopup = <K extends keyof AdminPopupDetail>(key: K, value: AdminPopupDetail[K]) =>
    setPopup((previous) => ({ ...previous, [key]: value }));
  const updateContent = (key: string, value: unknown) => setPopup((previous) => ({
    ...previous, content: { ...previous.content, [key]: value },
  }));
  const updateFooter = (showFooter: boolean) => setPopup((previous) => ({
    ...previous, showFooter, showDoNotShowAgain: showFooter ? previous.showDoNotShowAgain : false,
    showLater: showFooter ? Boolean(previous.showLater) : false,
  }));

  const addTargetGroup = () => setTargetGroups((groups) => [...groups, {
    targetName: `대상 그룹 ${groups.length + 1}`, targetDescription: '',
    conditions: [{ conditionType: 'EMPLOYEE', conditionOperator: '=', value: '', includeChild: false }],
  }]);
  const removeTargetGroup = (groupIndex: number) => setTargetGroups((groups) => groups.filter((_, i) => i !== groupIndex));
  const updateTargetGroup = (groupIndex: number, patch: Partial<PopupTargetGroup>) =>
    setTargetGroups((groups) => groups.map((group, i) => i === groupIndex ? { ...group, ...patch } : group));
  const addTargetCondition = (groupIndex: number) => {
    const condition: PopupTargetCondition = { conditionType: 'EMPLOYEE', conditionOperator: '=', value: '', includeChild: false };
    setTargetGroups((groups) => groups.map((group, i) => i === groupIndex
      ? { ...group, conditions: [...group.conditions, condition] } : group));
  };
  const updateTargetCondition = (groupIndex: number, conditionIndex: number, patch: Partial<PopupTargetCondition>) =>
    setTargetGroups((groups) => groups.map((group, i) => i === groupIndex ? {
      ...group, conditions: group.conditions.map((condition, j) => j === conditionIndex ? { ...condition, ...patch } : condition),
    } : group));
  const removeTargetCondition = (groupIndex: number, conditionIndex: number) =>
    setTargetGroups((groups) => groups.map((group, i) => i === groupIndex
      ? { ...group, conditions: group.conditions.filter((_, j) => j !== conditionIndex) } : group));

  const savePopup = async () => {
    if (quiz.error) { toast.warn(quiz.error); return; }
    const target = previewPopup;
    if (target.popupType === 'SURVEY' || target.popupType === 'QUIZ') {
      const error = validatePopupQuestions(target.questions, target.popupType === 'QUIZ', target.passingScore);
      if (error) { toast.warn(error); return; }
    }
    if (!popup.popupId.trim() || !popup.title.trim()) { toast.warn('팝업 ID와 제목을 입력해 주세요.'); return; }
    const scheduleError = validatePopupSchedule(popup);
    if (scheduleError) { toast.warn(scheduleError); return; }
    if (!Number.isInteger(popup.displayOrder) || popup.displayOrder < 1) { toast.warn('표시 우선순위는 1 이상의 정수로 입력해 주세요.'); return; }
    // 서버(PopupService.validateAdminPopup)가 hideDays < 1 을 거절하고 WPF 숨김 API 는 1~3650 일만 받는다.
    if (popup.hideDays != null && (!Number.isInteger(popup.hideDays) || popup.hideDays < 1 || popup.hideDays > 3650)) {
      toast.warn('숨김 일수는 1~3650 사이의 정수로 입력하거나 비워 두세요.'); return;
    }
    // POL-01-03 : 최소 크기 — 서버 PopupService와 같이 창 최소 크기는 축별 300 이상이다(기존 데이터의 더 작은 값은 저장 전에 고쳐야 한다).
    if (![popup.minimumWidth, popup.minimumHeight, popup.maximumWidth, popup.maximumHeight].every(v => Number.isFinite(v) && v > 0)
      || popup.minimumWidth < POPUP_MIN_WINDOW_SIZE || popup.minimumHeight < POPUP_MIN_WINDOW_SIZE
      || (popup.popupType !== 'IMAGE' && (popup.minimumWidth > popup.maximumWidth || popup.minimumHeight > popup.maximumHeight))) {
      toast.warn(`창 최소 크기는 ${POPUP_MIN_WINDOW_SIZE}×${POPUP_MIN_WINDOW_SIZE}px 이상이며 최대 크기보다 작거나 같아야 합니다.`); return;
    }
    if (popup.popupType === 'IMAGE') {
      for (const value of [popup.width, popup.height]) {
        if (value != null && (!Number.isFinite(Number(value)) || Number(value) <= 0)) {
          toast.warn('크기는 양수로 입력하거나 비워 두세요.'); return;
        }
      }
      if (popup.content.imageSizeMode === 'ORIGINAL' && popup.sizeMode === 'FIXED' && (popup.width == null || popup.height == null)) {
        toast.warn('원본 그대로 모드는 팝업 너비·높이를 입력해 주세요.'); return;
      }
    }
    const bottomUrl = contentValue(popup, 'bottomDescriptionUrl').trim();
    if (popup.popupType === 'TEXT' && bottomUrl && !normalizePopupLink(bottomUrl)) {
      toast.warn('하단 설명 연결 URL을 확인해 주세요. http 또는 https 주소만 사용할 수 있습니다.'); return;
    }
    if (!isSubmitPopupType(popup.popupType) && popup.content.footerAction === 'LINK_AND_CLOSE'
      && !normalizePopupLink(contentValue(popup, 'footerLinkUrl'))) {
      toast.warn('바로가기 URL을 입력해 주세요. http 또는 https 주소만 사용할 수 있습니다.'); return;
    }
    if (isVideoQuiz && !contentValue(popup, 'videoUrl').trim()) {
      toast.warn('동영상+퀴즈에는 영상 파일 경로 또는 URL을 입력해 주세요.'); return;
    }
    if (hasVideo && popup.completionRatio != null && (!Number.isFinite(popup.completionRatio) || popup.completionRatio < 0 || popup.completionRatio > 1)) {
      toast.warn('완료 비율은 0~1 사이로 입력해 주세요.'); return;
    }
    try {
      setLoading(true);
      const hasInvalidTarget = targetGroups.some((group) => group.conditions.length === 0
        || group.conditions.some((condition) => !condition.value.trim()));
      if (active && targetGroups.length === 0) { toast.warn('활성 팝업은 대상 조건 그룹을 한 개 이상 추가해 주세요.'); return; }
      if (hasInvalidTarget) { toast.warn('대상 그룹의 모든 조건 값을 입력해 주세요.'); return; }
      // POL-07-02 : 변환 책임 분리 — 저장 요청 구성(유형별 content·URL·Footer·날짜·IMAGE 크기 정리)은 popupEditorTransform이 맡는다.
      const { body } = await api.popupAdmin.save(toSaveRequest(target, active, targetGroups));
      toast.success('팝업을 저장했습니다.'); onSaved(body.popup.popupId);
    } catch (error) { handleError(error); } finally { setLoading(false); }
  };

  const isVideoQuiz = popup.popupType === 'QUIZ' && popup.content.videoEnabled === true;
  const hasVideo = popup.popupType === 'VIDEO' || isVideoQuiz;
  const isMedia = popup.popupType === 'IMAGE' || hasVideo;
  const isSurvey = popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ';
  const titleKey = popup.popupType === 'TEXT' ? null : contentTitleKey(popup.popupType);
  const originalImageMode = popup.popupType === 'IMAGE' && contentValue(popup, 'imageSizeMode').toUpperCase() === 'ORIGINAL';
  // POL-01-02 : 기본값의 적용 — 표시 플래그 없는 과거 행 fallback은 두지 않는다(08 스크립트가 플래그를 채움). WPF와 같이 값이 없으면 숨김.
  const showTextPlainText = popup.content.showPlainText !== false;
  const showTextBottomDescription = popup.content.showBottomDescription === true;
  const { enabled: useBackgroundOverlay, opacity: backgroundOverlayOpacity } = previewOverlay(popup);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {editing ? '팝업 수정' : '팝업 신규 등록'}
        <Button disabled={loading} variant="outlined" onClick={() => setTemplateOpen(true)}>템플릿 불러오기</Button>
      </DialogTitle>
      <PopupTemplateDialog open={open && templateOpen} onClose={() => setTemplateOpen(false)}
        onSelect={({ popup: template, targetGroups: groups }) => {
          setPopup((current) => toEditorPopupFromTemplate(template, current.popupId));
          setBodyEditorKey((key) => key + 1);
          setTargetGroups(groups ?? []); setTemplateOpen(false); toast.info('템플릿을 불러왔습니다. 저장하면 반영됩니다.');
        }} />
      {loading && <LinearProgress />}
      <DialogContent dividers sx={{ p: 0, overflowY: { xs: 'auto', lg: 'hidden' } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.1fr) minmax(0, 1fr)' }, height: { xs: 'auto', lg: 'calc(100vh - 180px)' }, minHeight: 0 }}>
          <Box sx={{ minWidth: 0, minHeight: 0, overflowY: { xs: 'visible', lg: 'auto' }, p: 2.5 }}><Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>기본 정보</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
              <TextField required label="팝업 ID" value={popup.popupId} disabled={editing} inputProps={{ maxLength: 50 }} onChange={(e) => updatePopup('popupId', e.target.value)} />
              <TextField required label="팝업 제목" value={popup.title} inputProps={{ maxLength: 200 }} onChange={(e) => updatePopup('title', e.target.value)} />
              <TextField select label="팝업 유형" value={isVideoQuiz ? 'VIDEO_QUIZ' : popup.popupType}
                onChange={(e) => setPopup((previous) => changePopupType(previous, e.target.value as PopupTypeSelection))}>
                {Object.entries(POPUP_TYPE_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                <MenuItem value="VIDEO_QUIZ">동영상 + 퀴즈</MenuItem>
              </TextField>
              <TextField select label="표시 방식" value={popup.displayMode} onChange={(e) => updatePopup('displayMode', e.target.value as PopupDisplayMode)}>
                <MenuItem value="SEQUENTIAL">순차 표시</MenuItem><MenuItem value="SIMULTANEOUS">동시 표시</MenuItem>
              </TextField>
              <TextField required type="number" label="표시 우선순위" value={popup.displayOrder} inputProps={{ min: 1, step: 1 }}
                helperText="숫자가 작을수록 먼저 표시됩니다. 같은 번호의 동시 표시는 함께 열립니다." onChange={(e) => updatePopup('displayOrder', Number(e.target.value))} />
              <Box />
              <TextField type="datetime-local" label="노출 시작" value={toDateTimeLocal(popup.displayStartAt)} InputLabelProps={{ shrink: true }} onChange={(e) => updatePopup('displayStartAt', e.target.value)} />
              <TextField type="datetime-local" label="노출 종료" value={toDateTimeLocal(popup.displayEndAt)} InputLabelProps={{ shrink: true }} onChange={(e) => updatePopup('displayEndAt', e.target.value)} />
              {/* POL-11-03 : 시간 경계 — 게시 기간 안 요일·시간대. 노출 판단은 서버(KST). */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <PopupScheduleFields popup={popup} onChange={(patch) => setPopup((previous) => ({ ...previous, ...patch }))} />
              </Box>
            </Box>

            <Divider /><Typography variant="subtitle1" fontWeight={700}>콘텐츠</Typography>
            {/* POL-03-01 : 저장·표시 경계 — TEXT는 콘텐츠 제목·설명을 본문 서식 편집기로 작성한다. */}
            {!originalImageMode && titleKey && !isSurvey && <><TextField label="콘텐츠 제목" value={contentValue(popup, titleKey)} onChange={(e) => updateContent(titleKey, e.target.value)} /><TextField label="설명" value={contentValue(popup, 'description')} multiline minRows={2} onChange={(e) => updateContent('description', e.target.value)} /></>}
            {/* POL-06-01 : 문항·서식 — 설문·퀴즈(동영상+퀴즈 포함)의 콘텐츠 제목·설명은 서식 편집기로 입력한다. 글자가 없으면 서식을 보내지 않는다. */}
            {isSurvey && <>
              <PopupRichTextEditor key={`survey-title-${bodyEditorKey}`} compact label="콘텐츠 제목" placeholder="콘텐츠 제목"
                initialBlocks={richBlocksOrNull(popup.content.surveyTitleBlocks) ?? plainTextToBlocks(contentValue(popup, 'surveyTitle'))}
                onChange={(blocks, plainText) => setPopup((previous) => ({
                  ...previous, content: { ...previous.content, surveyTitle: plainText, surveyTitleBlocks: richBlocksOrNull(blocks) },
                }))} />
              <PopupRichTextEditor key={`survey-description-${bodyEditorKey}`} compact label="설명" placeholder="설명(선택)"
                initialBlocks={richBlocksOrNull(popup.content.descriptionBlocks) ?? plainTextToBlocks(contentValue(popup, 'description'))}
                onChange={(blocks, plainText) => setPopup((previous) => ({
                  ...previous, content: { ...previous.content, description: plainText, descriptionBlocks: richBlocksOrNull(blocks) },
                }))} />
            </>}
            {originalImageMode && <Typography variant="caption" color="text.secondary">이 모드는 이미지만 사용합니다. 기존 제목·설명 값은 삭제하지 않고 다른 이미지 모드로 돌아가면 다시 사용됩니다.</Typography>}

            {popup.popupType === 'TEXT' && <Stack spacing={2}>
              {/* TEXT는 본문(제목·설명 포함)·하단 설명만 편집한다(강조 문구는 삭제). */}
              {/* POL-03-01 : 저장·표시 경계 — 본문은 서식 편집기로 입력하고 textBlocks(기준)와 파생 plainText를 함께 갱신한다. */}
              {<PopupRichTextEditor key={bodyEditorKey} label="일반 텍스트" disabled={!showTextPlainText}
                initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentValue(popup, 'plainText'))}
                onChange={(blocks, plainText) => setPopup((previous) => ({
                  ...previous, content: { ...previous.content, textBlocks: blocks, plainText },
                }))} />}
              <TextField label="하단 설명" disabled={!showTextBottomDescription} value={contentValue(popup, 'bottomDescription')} multiline minRows={2} onChange={(e) => updateContent('bottomDescription', e.target.value)} />
              <TextField label="하단 설명 연결 URL" disabled={!showTextBottomDescription} value={contentValue(popup, 'bottomDescriptionUrl')} placeholder="https://example.com" helperText="https:// 생략 시 자동으로 붙입니다. 설명이 없으면 URL을 표시하며, 클릭하면 새 창으로 이동합니다." onChange={(e) => updateContent('bottomDescriptionUrl', e.target.value)} />
            </Stack>}

            {isMedia && <TextField label={popup.popupType === 'IMAGE' ? '이미지 URL' : '영상 URL'} value={contentValue(popup, popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl')} onChange={(e) => updateContent(popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl', e.target.value)} />}
            {popup.popupType === 'IMAGE' && <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <TextField select label="이미지 크기 모드" value={normalizeImageSizeMode(popup.content.imageSizeMode)} onChange={(e) => {
                    const mode = e.target.value;
                    setPopup(previous => {
                      const content = {...previous.content, imageSizeMode: mode, ...(mode === 'FIT_TO_IMAGE' ? {keepAspectRatio: previous.content.keepAspectRatio ?? true} : {})};
                      // POL-04-02 : 모드별 기준 — 같은 숫자를 유지하고 의미만 바뀐다(ADAPTIVE·ORIGINAL 창 전체 ↔ FIT_TO_IMAGE 콘텐츠 영역). 라벨·도움말이 함께 바뀐다.
                      return {...previous, width: previous.width ?? (mode === 'ORIGINAL' ? 560 : undefined), height: previous.height ?? (mode === 'ORIGINAL' ? 420 : undefined),
                        sizeMode: previous.sizeMode === 'FULLSCREEN' ? 'FULLSCREEN' : 'FIXED', content};
                    });
                  }}>
                  <MenuItem value="ORIGINAL">원본 그대로 (넘치는 부분 자르기)</MenuItem><MenuItem value="FIT_TO_IMAGE">이미지 우선</MenuItem><MenuItem value="ADAPTIVE">창 우선</MenuItem>
                </TextField>
                {/* POL-04-01 : 공통 크기 입력 — 공통 popup.width/height. 모드에 따라 라벨·도움말만 바뀌고 같은 숫자의 적용 기준이 달라진다. */}
                <TextField type="number" label={popup.content.imageSizeMode === 'FIT_TO_IMAGE' ? '콘텐츠 너비' : '팝업 너비'} value={popup.width ?? ''}
                  disabled={popup.sizeMode === 'FULLSCREEN' || (originalImageMode && popup.sizeMode !== 'FIXED')} onChange={(e) => updateImageDimension('width', e.target.value)} />
                <TextField type="number" label={popup.content.imageSizeMode === 'FIT_TO_IMAGE' ? '콘텐츠 높이' : '팝업 높이'} value={popup.height ?? ''}
                  disabled={popup.sizeMode === 'FULLSCREEN' || (originalImageMode && popup.sizeMode !== 'FIXED')} onChange={(e) => updateImageDimension('height', e.target.value)} />
              </Box>
              {/* POL-04-02 : 모드별 기준 — 모드별 크기 기준 안내 */}
              <Typography variant="caption" color="text.secondary">
                {originalImageMode ? '창 전체 크기입니다. 이미지는 남은 영역에 원본 크기로 표시되며 넘치는 부분은 잘립니다.'
                  : normalizeImageSizeMode(popup.content.imageSizeMode) === 'FIT_TO_IMAGE'
                    ? `이미지 영역 크기입니다. 헤더·푸터·설명 공간이 추가되어 실제 창은 더 커질 수 있습니다. 최대 창 크기를 넘는 부분은 잘립니다. 비우면 원본 크기를 사용합니다.${fitWindow ? ` 미리보기 기준 창 ${fitWindow.width}×${fitWindow.height}` : ''}`
                    : '창 전체 크기입니다. 이미지는 헤더·푸터·설명 등을 제외한 영역에 맞춰 표시됩니다(원본보다 확대하지 않음).'}
              </Typography>
              {popup.content.imageSizeMode === 'FIT_TO_IMAGE' && <>
                <FormControlLabel control={<Switch checked={popup.content.keepAspectRatio !== false} onChange={(_, value) => {
                  // 비율 고정을 켜면 너비 기준으로 높이를 원본 비율에 다시 맞춘다(입력 연동). 끄면 숫자를 그대로 둔다.
                  setPopup(previous => ({...previous, content: {...previous.content, keepAspectRatio: value},
                    ...(value && naturalSize && previous.width ? {height: Math.round(previous.width * naturalSize.height / naturalSize.width * 100) / 100} : {})}));
                }} />} label="원본 비율 고정" />
                <Typography variant="caption" color="text.secondary">{popup.content.keepAspectRatio === false ? '콘텐츠 영역을 이미지로 채웁니다. 원본 비율과 다르면 이미지가 늘어나거나 눌립니다.' : '너비·높이를 원본 비율로 연동합니다. 두 값이 비율과 다르면 영역 안에 원본 비율로 맞추고 남는 쪽은 여백으로 둡니다.'}
                  {naturalSize ? ` 콘텐츠 영역 ${Math.round(displayImageSize(popup, naturalSize).width)}×${Math.round(displayImageSize(popup, naturalSize).height)}` : ' 원본 로딩 후 크기를 계산합니다.'}</Typography>
              </>}
              {!originalImageMode && <Typography variant="caption" color="text.secondary">설명은 하단에 표시합니다. 미리보기와 실제 PC는 작업 영역·DPI·글꼴에 따라 창 크기가 달라질 수 있습니다.</Typography>}
            </Stack>}

            {isSurvey && <PopupQuestionTemplatePicker popupType={popup.popupType} disabled={loading} onBusy={setLoading}
              onChange={(questions, templateId) => {
                setPopup((current) => ({ ...current, questions: withDefaultAnswerMatchMode(questions), questionTemplateId: templateId }));
                // POL-06-01 : 문항·서식 — 서식 편집기는 처음 값만 받으므로 문항을 통째로 바꾸면 다시 연다.
                setBodyEditorKey((key) => key + 1);
              }} />}
            {popup.popupType === 'QUIZ' && <PopupQuizRuleFields questionCount={popup.questions.length} rule={quiz.rule} count={quiz.count}
              passingScore={previewPopup.passingScore} onRuleChange={quiz.setRule} onCountChange={quiz.setCount} />}
            {isSurvey && <PopupQuestionEditor key={`questions-${bodyEditorKey}`} questions={popup.questions} quiz={popup.popupType === 'QUIZ'} passingScore={previewPopup.passingScore}
              fixedQuestionScore={QUIZ_QUESTION_SCORE} hidePassingScore onPassingScoreChange={(score) => updatePopup('passingScore', score)} onChange={(questions) => updatePopup('questions', questions)} />}
            {hasVideo && <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {/* POL-02-02 : 종료 제어 — 완료 기준은 화면 버튼만 잠근다. 외부 닫기는 배경 클릭 차단, 완료 전 연기는 나중에 보기로 정한다. */}
                <TextField type="number" label="완료 비율" value={popup.completionRatio ?? ''} inputProps={{ min: 0, max: 1, step: 0.05 }} onChange={(e) => updatePopup('completionRatio', e.target.value ? Number(e.target.value) : null)}
                  helperText={isVideoQuiz ? '시청 기준 전에는 퀴즈 입력·제출이 잠깁니다.' : '시청 기준 전에는 닫기 버튼이 비활성입니다.'} />
                <TextField type="number" label="기본 음량" value={contentValue(popup, 'defaultVolume')} inputProps={{ min: 0, max: 1, step: 0.1 }} onChange={(e) => updateContent('defaultVolume', Number(e.target.value))} />
              </Box>
            </Stack>}
            <Divider /><Typography variant="subtitle1" fontWeight={700}>노출 대상</Typography>
            <Typography variant="caption" color="text.secondary">같은 그룹의 조건은 모두 충족(AND), 그룹 사이는 하나만 충족(OR)하면 노출됩니다.</Typography>
            {targetGroups.map((group, groupIndex) => <Box key={`target-group-${groupIndex}`} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label={`그룹 ${groupIndex + 1} 이름`} value={group.targetName} onChange={(e) => updateTargetGroup(groupIndex, { targetName: e.target.value })} sx={{ flex: 1 }} />
                  <TextField size="small" label="설명" value={group.targetDescription} onChange={(e) => updateTargetGroup(groupIndex, { targetDescription: e.target.value })} sx={{ flex: 2 }} />
                  <IconButton aria-label="대상 그룹 삭제" onClick={() => removeTargetGroup(groupIndex)}><DeleteOutlineIcon /></IconButton>
                </Stack>
                {group.conditions.map((condition, conditionIndex) => {
                  const dateCondition = condition.conditionType === 'HIRE_DATE';
                  return <Stack key={`target-condition-${groupIndex}-${conditionIndex}`} direction="row" spacing={1} alignItems="center">
                    <TextField select size="small" label="조건 유형" value={condition.conditionType} onChange={(e) => {
                      const conditionType = e.target.value as PopupTargetConditionType;
                      updateTargetCondition(groupIndex, conditionIndex, { conditionType, conditionOperator: '=', value: '', includeChild: false });
                    }} sx={{ width: 150 }}>
                      <MenuItem value="DEPARTMENT">부서</MenuItem><MenuItem value="POSITION">직급</MenuItem><MenuItem value="EMPLOYEE">사번</MenuItem><MenuItem value="HIRE_DATE">입사일</MenuItem>
                    </TextField>
                    <TextField select size="small" label="비교" value={condition.conditionOperator} onChange={(e) => updateTargetCondition(groupIndex, conditionIndex, { conditionOperator: e.target.value as PopupTargetCondition['conditionOperator'] })} sx={{ width: 100 }}>
                      <MenuItem value="=">같음</MenuItem><MenuItem value="!=">같지 않음</MenuItem>{dateCondition && <MenuItem value="<">이전</MenuItem>}{dateCondition && <MenuItem value="<=">이전 또는 당일</MenuItem>}{dateCondition && <MenuItem value=">">이후</MenuItem>}{dateCondition && <MenuItem value=">=">이후 또는 당일</MenuItem>}
                    </TextField>
                    <TextField size="small" type={dateCondition ? 'date' : 'text'} label={dateCondition ? '기준 입사일' : '조건 값'} value={condition.value}
                      InputLabelProps={dateCondition ? { shrink: true } : undefined}
                      placeholder={condition.conditionType === 'DEPARTMENT' ? '부서 ID' : condition.conditionType === 'POSITION' ? '직급 ID' : condition.conditionType === 'EMPLOYEE' ? 'E1002' : undefined}
                      onChange={(e) => updateTargetCondition(groupIndex, conditionIndex, { value: e.target.value })} sx={{ flex: 1 }} />
                    {condition.conditionType === 'DEPARTMENT' && <FormControlLabel control={<Switch size="small" checked={condition.includeChild} onChange={(_, value) => updateTargetCondition(groupIndex, conditionIndex, { includeChild: value })} />} label="하위 포함" />}
                    <IconButton aria-label="대상 조건 삭제" onClick={() => removeTargetCondition(groupIndex, conditionIndex)}><DeleteOutlineIcon /></IconButton>
                  </Stack>;
                })}
                <Button size="small" startIcon={<AddIcon />} onClick={() => addTargetCondition(groupIndex)} sx={{ alignSelf: 'flex-start' }}>AND 조건 추가</Button>
              </Stack>
            </Box>)}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addTargetGroup} sx={{ alignSelf: 'flex-start' }}>OR 대상 그룹 추가</Button>

          </Stack></Box>

          <Box sx={{ minWidth: 0, minHeight: 0, p: 2, bgcolor: '#f3f5f9', borderLeft: { lg: '1px solid' }, borderColor: 'divider',
            display: 'grid', gridTemplateRows: { xs: '360px auto', lg: 'minmax(220px, 1fr) minmax(200px, 1fr)' }, gap: 2 }}>
            {/* POL-08-01 : 공통 렌더러 — 인라인·실제 크기 미리보기는 같은 popup(편집 원본)을 읽기만 한다. 시연 상태는 각 PopupPreview 안에 있다. */}
            <InlinePopupPreview popup={previewPopup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setFitWindow} />
            <Box sx={{ minHeight: 0, overflowY: { xs: 'visible', lg: 'auto' }, bgcolor: 'background.paper', borderRadius: 1, p: 2,
              '& .MuiFormControlLabel-root': { m: 0 }, '& .MuiFormControlLabel-label': { fontSize: 13 } }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>표시 옵션</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5 }}>
              <FormControlLabel control={<Switch size="small" checked={active} onChange={(_, value) => setActive(value)} />} label="팝업 활성화" />
              <FormControlLabel control={<Switch size="small" checked={popup.showHeader} onChange={(_, value) => updatePopup('showHeader', value)} />} label="헤더 표시" />
              <FormControlLabel control={<Switch size="small" checked={popup.showCloseButton} onChange={(_, value) => updatePopup('showCloseButton', value)} />} label="닫기 표시" />
              <FormControlLabel control={<Switch size="small" checked={popup.showFooter} onChange={(_, value) => updateFooter(value)} />} label="푸터 표시" />
              <FormControlLabel control={<Switch size="small" checked={popup.showDoNotShowAgain} disabled={!popup.showFooter} onChange={(_, value) => updatePopup('showDoNotShowAgain', value)} />} label="다시 보지 않기" />
              {/* POL-02-03 : 푸터 역할 — 나중에 보기: 누르면 완료 없이 닫히고 다음 조회 주기에 다시 표시된다(모든 유형, 완료 기준 전에도 가능).
                  POL-02-02 : 종료 제어 — 완료 전 닫기 허용 옵션이 없으므로 완료 기준 전 화면 이탈 버튼은 이것뿐이다. */}
              <FormControlLabel control={<Switch size="small" checked={Boolean(popup.showLater)} disabled={!popup.showFooter} onChange={(_, value) => updatePopup('showLater', value)} />} label="나중에 보기" />
            </Box>
            {popup.showFooter && <Typography variant="caption" color="text.secondary">나중에 보기는 완료 처리 없이 닫고 다음 조회 주기에 다시 표시합니다. 완료 기준(영상 시청·퀴즈 통과) 전에 화면 버튼으로 나갈 수 있는 유일한 방법입니다.</Typography>}
            {isSurvey ? (
              <TextField select size="small" label="푸터 버튼 동작" value="SUBMIT" disabled
                helperText="설문·퀴즈는 제출 버튼으로 고정됩니다.">
                <MenuItem value="SUBMIT">제출</MenuItem>
              </TextField>
            ) : (
              <TextField select size="small" label="푸터 버튼 동작" value={contentValue(popup, 'footerAction') === 'LINK_AND_CLOSE' ? 'LINK_AND_CLOSE' : 'CLOSE'}
                disabled={!popup.showFooter || !popup.showCloseButton} onChange={(e) => updateContent('footerAction', e.target.value)}>
                <MenuItem value="CLOSE">닫기</MenuItem><MenuItem value="LINK_AND_CLOSE">바로가기 (링크 열고 닫기)</MenuItem>
              </TextField>
            )}
            {!isSurvey && popup.content.footerAction === 'LINK_AND_CLOSE' && <TextField size="small" label="바로가기 URL"
              value={contentValue(popup, 'footerLinkUrl')} onChange={(e) => updateContent('footerLinkUrl', e.target.value)}
              helperText="하단 바로가기 버튼을 누르면 브라우저로 링크를 열고 팝업을 닫습니다." />}
            {isVideoQuiz && <Typography variant="caption" color="text.secondary">영상 누적 시청 비율이 완료 기준에 도달하면 퀴즈와 푸터가 활성화됩니다.</Typography>}
            {/*
              [옵션 정합성 — 2026-09-20] 숨김 일수(hideDays).
              DB(POPUP_NOTICE.HIDE_DAYS)·서버 검증(1 이상)·WPF(다시 보지 않기 체크 시 HIDDEN 결과의 hideDays, 없으면 30일)는
              모두 지원하는데 편집 화면에만 입력란이 없어 항상 null 로 저장되던 항목이다. 푸터+다시 보지 않기가 켜진 경우에만 의미가 있다.
            */}
            <TextField size="small" type="number" label="다시 보지 않기 숨김 일수" value={popup.hideDays ?? ''}
              disabled={!popup.showFooter || !popup.showDoNotShowAgain} inputProps={{ min: 1, max: 3650, step: 1 }}
              helperText="사용자가 '다시 보지 않기'를 체크하면 이 일수만큼 숨깁니다. 비우면 WPF 기본값 30일." sx={{ width: 260 }}
              onChange={(e) => updatePopup('hideDays', e.target.value === '' ? null : Number(e.target.value))} />

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>배경 클릭 차단</Typography>
                <Typography variant="caption" color="text.secondary">팝업이 열려 있는 동안 모든 모니터의 배경 클릭을 막고 배경을 어둡게 표시합니다. 화면에 닫기·제출 버튼이 있으면 Alt+F4 등 키보드·외부 닫기도 막습니다(완료 기준 충족 후에도 동일). 끄면 완료 기준 전이라도 Alt+F4로 닫을 수 있고 시청 기록은 그대로 저장됩니다. 키보드 전환은 차단하지 않습니다.</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel control={<Switch size="small" checked={useBackgroundOverlay} onChange={(_, value) => updateContent('useBackgroundOverlay', value)} />} label="사용" />
                  <TextField size="small" type="number" label="배경 어둡기 (%)" value={Math.round(backgroundOverlayOpacity * 100)} disabled={!useBackgroundOverlay}
                    inputProps={{ min: 0, max: 100, step: 5 }} helperText="0% 투명 · 100% 완전 불투명"
                    onChange={(e) => updateContent('backgroundOverlayOpacity', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} sx={{ width: 220 }} />
                </Stack>
              </Stack>
            </Box>

            {/* POL-01-01 : 공통 옵션의 위치 — Header / 본문 / Footer 폰트 크기 — 영역별 독립 설정. content_options_json에 저장되어 WPF PopupWindow·콘텐츠 View에 적용된다. */}
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>폰트 크기</Typography>
                <Typography variant="caption" color="text.secondary">
                  WPF 팝업의 헤더 제목 · 본문 텍스트 · 푸터(다시 보지 않기·닫기) 글자 크기를 각각 지정합니다. 비워 두면 기존과 같은 기본 크기로 표시됩니다.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
                  <PopupFontSizeField label="헤더 (px)" popupKey="headerFontSize" popup={popup} onChange={(v) => updateContent('headerFontSize', v)} />
                  <PopupFontSizeField label="본문 (px)" popupKey="bodyFontSize" popup={popup} onChange={(v) => updateContent('bodyFontSize', v)} />
                  <PopupFontSizeField label="푸터 (px)" popupKey="footerFontSize" popup={popup} onChange={(v) => updateContent('footerFontSize', v)} />
                </Box>
              </Stack>
            </Box>


                {popup.popupType === 'TEXT' && <>
                  <Divider /><Typography variant="subtitle2" fontWeight={700}>텍스트 표시</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5 }}>
                <FormControlLabel control={<Switch size="small" checked={showTextPlainText} onChange={(_, v) => updateContent('showPlainText', v)} />} label="일반 텍스트" />
                <FormControlLabel control={<Switch size="small" checked={showTextBottomDescription} onChange={(_, v) => updateContent('showBottomDescription', v)} />} label="하단 설명" />
              </Box>
                </>}
                {popup.popupType === 'IMAGE' && !originalImageMode && <>
                  <Divider /><Typography variant="subtitle2" fontWeight={700}>이미지 표시</Typography>
              <FormControlLabel control={<Switch checked={popup.content.showDescription !== false} onChange={(_, value) => updateContent('showDescription', value)} />} label="이미지 설명 표시" />
                </>}
                {hasVideo && <>
                  <Divider /><Typography variant="subtitle2" fontWeight={700}>영상 재생</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5 }}>
                {[
                  ['showDescription', '영상 설명 표시'], ['showControls', '컨트롤 표시'], ['allowFullScreen', '전체화면 허용'],
                  ['allowPlaybackRateChange', '배속 변경 허용'], ['allowSeek', '재생 위치 변경 허용'], ['autoPlay', '자동 재생'], ['isLoop', '반복 재생'],
                ].map(([key, label]) => <FormControlLabel key={key} control={<Switch size="small" checked={popup.content[key] == null ? key !== 'autoPlay' && key !== 'isLoop' : popup.content[key] === true} onChange={(_, value) => updateContent(key, value)} />} label={label} />)}
              </Box>
                </>}
            <Divider /><Typography variant="subtitle1" fontWeight={700}>위치 설정</Typography>
            <TextField select label="주 모니터 표시 위치" value={contentValue(popup, 'popupPosition') || 'CENTER'}
              disabled={popup.sizeMode === 'FULLSCREEN'} onChange={(e) => updateContent('popupPosition', e.target.value)}
              helperText={popup.sizeMode === 'FULLSCREEN' ? '전체 화면은 주 모니터 전체에 표시됩니다.' : '작업 표시줄 제외 영역 기준입니다. 기본값은 중앙입니다.'}>
              <MenuItem value="CENTER">중앙 (기본)</MenuItem>
              <MenuItem value="TOP_LEFT">왼쪽 위</MenuItem>
              <MenuItem value="TOP_CENTER">위쪽 중앙</MenuItem>
              <MenuItem value="TOP_RIGHT">오른쪽 위</MenuItem>
              <MenuItem value="CENTER_LEFT">왼쪽 중앙</MenuItem>
              <MenuItem value="CENTER_RIGHT">오른쪽 중앙</MenuItem>
              <MenuItem value="BOTTOM_LEFT">왼쪽 아래</MenuItem>
              <MenuItem value="BOTTOM_CENTER">아래쪽 중앙</MenuItem>
              <MenuItem value="BOTTOM_RIGHT">오른쪽 아래</MenuItem>
            </TextField>
            <Divider /><Typography variant="subtitle1" fontWeight={700}>크기 설정</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2 }}>
              <TextField select label="크기 모드" value={popup.sizeMode} onChange={(e) => updatePopup('sizeMode', e.target.value as PopupSizeMode)}>
                <MenuItem value="FIXED">고정 크기</MenuItem>{(popup.popupType !== 'IMAGE' || originalImageMode) && <MenuItem value="RATIO">화면 비율</MenuItem>}<MenuItem value="FULLSCREEN">전체 화면</MenuItem>
              </TextField>
              {popup.sizeMode === 'FIXED' && popup.popupType !== 'IMAGE' && <><PopupDimensionField label="너비" value={popup.width ?? 560} minimum={popupMinimumSize(popup).width} maximum={popup.maximumWidth} onChange={(value) => updatePopup('width', value)} /><PopupDimensionField label="높이" value={popup.height ?? 420} minimum={popupMinimumSize(popup).height} maximum={popup.maximumHeight} onChange={(value) => updatePopup('height', value)} /></>}
              {popup.sizeMode === 'RATIO' && (popup.popupType !== 'IMAGE' || originalImageMode) && <><TextField type="number" label="너비 비율" value={popup.widthRatio} inputProps={{ min: 0.1, max: 1, step: 0.05 }} onChange={(e) => updatePopup('widthRatio', Number(e.target.value))} /><TextField type="number" label="높이 비율" value={popup.heightRatio} inputProps={{ min: 0.1, max: 1, step: 0.05 }} onChange={(e) => updatePopup('heightRatio', Number(e.target.value))} /></>}
            </Box>
            {/* WPF PopupWindow.ApplyWindowSize: MinimumWidth/Height는 FIXED·RATIO 모두 적용(IMAGE 포함, 작업 영역 상한 이하로 보정),
                MaximumWidth/Height는 IMAGE가 아닌 유형에만 적용(IMAGE는 작업 영역 90%). FULLSCREEN은 둘 다 쓰지 않는다.
                서버 PopupService.validateAdminPopup: 최소는 축별 300 이상(POL-01-03 : 최소 크기), IMAGE가 아니면 최대 ≥ 최소.
                IMAGE 최소는 FIT_TO_IMAGE 콘텐츠가 아니라 헤더·푸터를 포함한 최종 창 기준이다. */}
            {popup.sizeMode !== 'FULLSCREEN' && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
              <PopupDimensionField label="창 최소 너비" value={popup.minimumWidth} minimum={POPUP_MIN_WINDOW_SIZE} maximum={popup.popupType === 'IMAGE' ? Number.MAX_VALUE : popup.maximumWidth}
                helperText={popup.popupType === 'IMAGE' ? `${POPUP_MIN_WINDOW_SIZE}px 이상 · 헤더·푸터 포함 최종 창 기준 · 작업 영역 90%를 넘으면 그 값으로 보정` : `${POPUP_MIN_WINDOW_SIZE}px 이상 · 최대 너비(${popup.maximumWidth}px) 이하`} onChange={(value) => updatePopup('minimumWidth', value)} />
              <PopupDimensionField label="창 최소 높이" value={popup.minimumHeight} minimum={POPUP_MIN_WINDOW_SIZE} maximum={popup.popupType === 'IMAGE' ? Number.MAX_VALUE : popup.maximumHeight}
                helperText={popup.popupType === 'IMAGE' ? `${POPUP_MIN_WINDOW_SIZE}px 이상 · 헤더·푸터 포함 최종 창 기준 · 작업 영역 90%를 넘으면 그 값으로 보정` : `${POPUP_MIN_WINDOW_SIZE}px 이상 · 최대 높이(${popup.maximumHeight}px) 이하`} onChange={(value) => updatePopup('minimumHeight', value)} />
              {popup.popupType !== 'IMAGE' && <>
                <PopupDimensionField label="창 최대 너비" value={popup.maximumWidth} minimum={popup.minimumWidth} maximum={Number.MAX_VALUE}
                  helperText={`최소 너비(${popup.minimumWidth}px) 이상 · ${popup.sizeMode === 'RATIO' ? '작업 영역 100%' : '작업 영역 95%'}를 넘지 않게 보정`} onChange={(value) => updatePopup('maximumWidth', value)} />
                <PopupDimensionField label="창 최대 높이" value={popup.maximumHeight} minimum={popup.minimumHeight} maximum={Number.MAX_VALUE}
                  helperText={`최소 높이(${popup.minimumHeight}px) 이상 · ${popup.sizeMode === 'RATIO' ? '작업 영역 100%' : '작업 영역 95%'}를 넘지 않게 보정`} onChange={(value) => updatePopup('maximumHeight', value)} />
              </>}
            </Box>}
            {popup.sizeMode !== 'FULLSCREEN' && <Typography variant="caption" color="text.secondary">{popup.popupType === 'IMAGE' ? '이미지 창 최대: 현재 화면 작업 영역의 90%. 고정 최대 픽셀값을 사용하지 않습니다.' : `미리보기 최대 크기: ${popup.maximumWidth}px × ${popup.maximumHeight}px`}</Typography>}


              </Stack>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={loading}>취소</Button><Button variant="contained" onClick={savePopup} disabled={loading}>저장</Button></DialogActions>
      <PopupPreviewDialog popup={previewPopup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={fitWindow} />
    </Dialog>
  );
}
