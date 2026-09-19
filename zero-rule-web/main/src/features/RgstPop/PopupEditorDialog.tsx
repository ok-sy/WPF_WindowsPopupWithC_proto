import normalizePopupLink from './normalizePopupLink';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type {
  AdminPopupDetail,
  PopupDateValue,
  PopupDisplayMode,
  PopupSizeMode,
  PopupTargetCondition,
  PopupTargetConditionType,
  PopupTargetGroup,
  PopupType,
} from '@local/domain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  FormControlLabel, IconButton, LinearProgress, MenuItem, Stack, Switch,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PopupPreview from './PopupPreview';
import PopupQuestionEditor, { validatePopupQuestions } from './PopupQuestionEditor';
import PopupTemplateDialog from './PopupTemplateDialog';
import PopupQuestionTemplatePicker from './PopupQuestionTemplatePicker';

interface PopupEditorDialogProps {
  open: boolean;
  popupId: string | null;
  initialActive: boolean;
  onClose: () => void;
  onSaved: (popupId: string) => void;
}

const popupTypes: Array<{ value: PopupType; label: string }> = [
  { value: 'TEXT', label: '텍스트' }, { value: 'IMAGE', label: '이미지' },
  { value: 'VIDEO', label: '영상' }, { value: 'SURVEY', label: '설문' },
  { value: 'QUIZ', label: '퀴즈' },
];

function createDefaultPopup(): AdminPopupDetail {
  const startAt = new Date();
  const endAt = new Date(startAt);
  endAt.setMonth(endAt.getMonth() + 1);
  return {
    popupId: '', popupType: 'TEXT', title: '',
    displayStartAt: startAt.toISOString(), displayEndAt: endAt.toISOString(),
    displayMode: 'SEQUENTIAL', displayOrder: 100, sizeMode: 'FIXED',
    width: 560, height: 420, widthRatio: 0.7, heightRatio: 0.75,
    minimumWidth: 480, minimumHeight: 320, maximumWidth: 1200, maximumHeight: 900,
    showHeader: true, showCloseButton: true, showFooter: true, showDoNotShowAgain: false,
    questionTemplateId: null, periodMode: 'FIXED', repeatInterval: null,
    repeatDayOfWeek: null, repeatDayOfMonth: null, hideDays: null,
    completionRatio: null, passingScore: null, allowCloseBeforeComplete: true,
    questions: [],
    content: {
      contentTitle: '', description: '', showContentHeader: true, plainText: '',
      showPlainText: true,
      highlightText: '', showHighlight: false,
      bottomDescription: '', bottomDescriptionUrl: '',
      showBottomDescription: false, markdownMode: false, markdownContent: '',
      showDescription: true, imageSizeMode: 'FIXED', imageWidth: 0, imageHeight: 0,
      linkUrl: '', showControls: true, allowFullScreen: true,
      allowPlaybackRateChange: true, autoPlay: false, isLoop: false, defaultVolume: 0.7,
      // 공통 배경 Overlay 옵션. content_options_json에 함께 저장되어 WPF까지 전달된다.
      useBackgroundOverlay: true,
      backgroundOverlayOpacity: 0.45,
    },
  };
}

function dateFromApi(value: PopupDateValue): Date {
  if (typeof value === 'number') return new Date(value < 1_000_000_000_000 ? value * 1000 : value);
  return new Date(value);
}
function toDateTimeLocal(value: PopupDateValue): string {
  const date = dateFromApi(value);
  if (Number.isNaN(date.getTime())) return '';
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}
function toApiDate(value: string): string { return new Date(value).toISOString(); }
function contentTitleKey(popupType: PopupType): string {
  if (popupType === 'IMAGE') return 'imageTitle';
  if (popupType === 'VIDEO') return 'videoTitle';
  if (popupType === 'SURVEY' || popupType === 'QUIZ') return 'surveyTitle';
  return 'contentTitle';
}
function contentValue(popup: AdminPopupDetail, key: string): string {
  const value = popup.content[key];
  return value == null ? '' : String(value);
}

function PopupDimensionField({ label, value, minimum, maximum, onChange }: {
  label: string; value: number; minimum: number; maximum: number; onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <TextField type="number" label={label} value={draft ?? value}
    helperText={`최소 ${minimum}px · 최대 ${maximum}px · 입력 완료 시 범위 자동 조정`}
    inputProps={{ min: minimum, max: maximum }}
    onChange={(event) => {
      const input = event.target.value; setDraft(input);
      if (input !== '' && Number.isFinite(Number(input)))
        onChange(Math.max(minimum, Math.min(maximum, Number(input))));
    }} onBlur={() => setDraft(null)} />;
}

export default function PopupEditorDialog({ open, popupId, initialActive, onClose, onSaved }: PopupEditorDialogProps) {
  const api = useApi();
  const [popup, setPopup] = useState<AdminPopupDetail>(createDefaultPopup);
  const [active, setActive] = useState(true);
  const [targetGroups, setTargetGroups] = useState<PopupTargetGroup[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const editing = popupId != null;

  useEffect(() => {
    if (!open) return;
    setActive(initialActive); setTemplateOpen(false); setLoading(false);
    if (popupId == null) { setPopup(createDefaultPopup()); setTargetGroups([]); return; }
    let canceled = false; setLoading(true);
    api.popupAdmin.info({ popupId }).then(({ body }) => {
      if (!canceled) {
        setPopup({ ...body.popup, displayOrder: body.popup.displayOrder ?? 100 });
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
    if (popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ') {
      const error = validatePopupQuestions(popup.questions, popup.popupType === 'QUIZ', popup.passingScore);
      if (error) { toast.warn(error); return; }
    }
    if (!popup.popupId.trim() || !popup.title.trim()) { toast.warn('팝업 ID와 제목을 입력해 주세요.'); return; }
    if (!Number.isInteger(popup.displayOrder) || popup.displayOrder < 1) { toast.warn('표시 우선순위는 1 이상의 정수로 입력해 주세요.'); return; }
    const bottomUrl = contentValue(popup, 'bottomDescriptionUrl').trim();
    if (popup.popupType === 'TEXT' && bottomUrl && !normalizePopupLink(bottomUrl)) {
      toast.warn('하단 설명 연결 URL을 확인해 주세요. http 또는 https 주소만 사용할 수 있습니다.'); return;
    }
    try {
      setLoading(true);
      const requestPopup: AdminPopupDetail = {
        ...popup, popupId: popup.popupId.trim(), title: popup.title.trim(),
        content: popup.popupType === 'TEXT' ? { ...popup.content, bottomDescriptionUrl: normalizePopupLink(bottomUrl) ?? '' } : popup.content,
        displayStartAt: toApiDate(toDateTimeLocal(popup.displayStartAt)),
        displayEndAt: toApiDate(toDateTimeLocal(popup.displayEndAt)),
      };
      const hasInvalidTarget = targetGroups.some((group) => group.conditions.length === 0
        || group.conditions.some((condition) => !condition.value.trim()));
      if (active && targetGroups.length === 0) { toast.warn('활성 팝업은 대상 조건 그룹을 한 개 이상 추가해 주세요.'); return; }
      if (hasInvalidTarget) { toast.warn('대상 그룹의 모든 조건 값을 입력해 주세요.'); return; }
      const { body } = await api.popupAdmin.save({ popup: requestPopup, active, targetGroups });
      toast.success('팝업을 저장했습니다.'); onSaved(body.popup.popupId);
    } catch (error) { handleError(error); } finally { setLoading(false); }
  };

  const previewDialogSize = () => {
    const availableWidth = window.innerWidth, availableHeight = window.innerHeight;
    const requestedWidth = popup.sizeMode === 'FULLSCREEN' ? availableWidth
      : popup.sizeMode === 'RATIO' ? availableWidth * popup.widthRatio : popup.width;
    const requestedHeight = popup.sizeMode === 'FULLSCREEN' ? availableHeight
      : popup.sizeMode === 'RATIO' ? availableHeight * popup.heightRatio : popup.height;
    const width = popup.sizeMode === 'FULLSCREEN' ? requestedWidth : Math.max(popup.minimumWidth, Math.min(popup.maximumWidth, requestedWidth));
    const height = popup.sizeMode === 'FULLSCREEN' ? requestedHeight : Math.max(popup.minimumHeight, Math.min(popup.maximumHeight, requestedHeight));
    return { width: Math.round(Math.max(320, Math.min(availableWidth * 0.96, width))), height: Math.round(Math.max(260, Math.min(availableHeight * 0.96, height))) };
  };

  const titleKey = contentTitleKey(popup.popupType);
  const isMedia = popup.popupType === 'IMAGE' || popup.popupType === 'VIDEO';
  const isSurvey = popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ';
  const imageFillMode = popup.popupType === 'IMAGE' && contentValue(popup, 'imageSizeMode').toUpperCase() === 'FILL';
  const showTextHighlight = popup.content.showHighlight == null ? Boolean(contentValue(popup, 'highlightText')) : popup.content.showHighlight === true;
  const showTextContentHeader = popup.content.showContentHeader !== false;
  const showTextPlainText = popup.content.showPlainText !== false;
  const showTextBottomDescription = popup.content.showBottomDescription == null
    ? Boolean(contentValue(popup, 'bottomDescription') || contentValue(popup, 'bottomDescriptionUrl')) : popup.content.showBottomDescription === true;
  const markdownMode = popup.content.markdownMode === true;
  const useBackgroundOverlay = popup.content.useBackgroundOverlay !== false;
  const backgroundOverlayOpacity = Math.max(0, Math.min(1, Number(popup.content.backgroundOverlayOpacity ?? 0.45)));
  const modalPreviewSize = previewOpen && typeof window !== 'undefined' ? previewDialogSize() : { width: popup.width, height: popup.height };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {editing ? '팝업 수정' : '팝업 신규 등록'}
        <Button disabled={loading} variant="outlined" onClick={() => setTemplateOpen(true)}>템플릿 불러오기</Button>
      </DialogTitle>
      <PopupTemplateDialog open={open && templateOpen} onClose={() => setTemplateOpen(false)}
        onSelect={({ popup: template, targetGroups: groups }) => {
          setPopup((current) => ({ ...template, popupId: current.popupId, questionTemplateId: null }));
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
              <TextField select label="팝업 유형" value={popup.popupType} onChange={(e) => updatePopup('popupType', e.target.value as PopupType)}>
                {popupTypes.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
              </TextField>
              <TextField select label="표시 방식" value={popup.displayMode} onChange={(e) => updatePopup('displayMode', e.target.value as PopupDisplayMode)}>
                <MenuItem value="SEQUENTIAL">순차 표시</MenuItem><MenuItem value="SIMULTANEOUS">동시 표시</MenuItem>
              </TextField>
              <TextField required type="number" label="표시 우선순위" value={popup.displayOrder} inputProps={{ min: 1, step: 1 }}
                helperText="숫자가 작을수록 먼저 표시됩니다. 같은 번호의 동시 표시는 함께 열립니다." onChange={(e) => updatePopup('displayOrder', Number(e.target.value))} />
              <Box />
              <TextField type="datetime-local" label="노출 시작" value={toDateTimeLocal(popup.displayStartAt)} InputLabelProps={{ shrink: true }} onChange={(e) => updatePopup('displayStartAt', e.target.value)} />
              <TextField type="datetime-local" label="노출 종료" value={toDateTimeLocal(popup.displayEndAt)} InputLabelProps={{ shrink: true }} onChange={(e) => updatePopup('displayEndAt', e.target.value)} />
            </Box>

            <Divider /><Typography variant="subtitle1" fontWeight={700}>콘텐츠</Typography>
            {!imageFillMode && <><TextField label="콘텐츠 제목" disabled={popup.popupType === 'TEXT' && !showTextContentHeader} value={contentValue(popup, titleKey)} onChange={(e) => updateContent(titleKey, e.target.value)} /><TextField label="설명" disabled={popup.popupType === 'TEXT' && !showTextContentHeader} value={contentValue(popup, 'description')} multiline minRows={2} onChange={(e) => updateContent('description', e.target.value)} /></>}
            {imageFillMode && <Typography variant="caption" color="text.secondary">꽉 채우기 모드는 이미지와 클릭 링크만 사용합니다. 기존 제목·설명 값은 삭제하지 않고 다른 이미지 모드로 돌아가면 다시 사용됩니다.</Typography>}

            {popup.popupType === 'TEXT' && <Stack spacing={2}>
              {markdownMode ? <TextField label="Markdown 내용" value={contentValue(popup, 'markdownContent')} multiline minRows={14} placeholder={'# 제목\n\n일반 문장과 **강조 문장**\n\n- 목록 1\n- 목록 2'} onChange={(e) => updateContent('markdownContent', e.target.value)} /> : <Stack spacing={2}>
                <TextField label="일반 텍스트" disabled={!showTextPlainText} value={contentValue(popup, 'plainText')} multiline minRows={4} onChange={(e) => updateContent('plainText', e.target.value)} />
                <TextField label="강조 문구" disabled={!showTextHighlight} value={contentValue(popup, 'highlightText')} onChange={(e) => updateContent('highlightText', e.target.value)} />
              </Stack>}
                <TextField label="하단 설명" disabled={!showTextBottomDescription} value={contentValue(popup, 'bottomDescription')} multiline minRows={2} onChange={(e) => updateContent('bottomDescription', e.target.value)} />
                <TextField label="하단 설명 연결 URL" disabled={!showTextBottomDescription} value={contentValue(popup, 'bottomDescriptionUrl')} placeholder="https://example.com" helperText="https:// 생략 시 자동으로 붙입니다. 설명이 없으면 URL을 표시하며, 클릭하면 새 창으로 이동합니다." onChange={(e) => updateContent('bottomDescriptionUrl', e.target.value)} />
            </Stack>}

            {isMedia && <TextField label={popup.popupType === 'IMAGE' ? '이미지 URL' : '영상 URL'} value={contentValue(popup, popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl')} onChange={(e) => updateContent(popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl', e.target.value)} />}
            {popup.popupType === 'IMAGE' && <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: imageFillMode ? '1fr' : 'repeat(3, 1fr)', gap: 2 }}>
                <TextField select label="이미지 크기 모드" value={contentValue(popup, 'imageSizeMode') || 'FIXED'} onChange={(e) => updateContent('imageSizeMode', e.target.value)}>
                  <MenuItem value="FIXED">고정 영역</MenuItem><MenuItem value="FIT_TO_IMAGE">원본에 맞춤</MenuItem><MenuItem value="ADAPTIVE">화면에 맞춤</MenuItem><MenuItem value="FILL">꽉 채우기 (이미지만)</MenuItem>
                </TextField>
                {!imageFillMode && <TextField type="number" label="이미지 너비" value={contentValue(popup, 'imageWidth')} onChange={(e) => updateContent('imageWidth', Number(e.target.value))} />}
                {!imageFillMode && <TextField type="number" label="이미지 높이" value={contentValue(popup, 'imageHeight')} onChange={(e) => updateContent('imageHeight', Number(e.target.value))} />}
              </Box>
              <TextField label="클릭 연결 URL" value={contentValue(popup, 'linkUrl')} onChange={(e) => updateContent('linkUrl', e.target.value)} />
            </Stack>}

            {isSurvey && <PopupQuestionTemplatePicker popupType={popup.popupType} disabled={loading} onBusy={setLoading}
              onChange={(questions, templateId) => setPopup((current) => ({ ...current, questions, questionTemplateId: templateId }))} />}
            {isSurvey && <PopupQuestionEditor questions={popup.questions} quiz={popup.popupType === 'QUIZ'} passingScore={popup.passingScore} onPassingScoreChange={(score) => updatePopup('passingScore', score)} onChange={(questions) => updatePopup('questions', questions)} />}
            {popup.popupType === 'VIDEO' && <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField type="number" label="완료 비율" value={popup.completionRatio ?? ''} inputProps={{ min: 0, max: 1, step: 0.05 }} onChange={(e) => updatePopup('completionRatio', e.target.value ? Number(e.target.value) : null)} />
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
            <Stack spacing={1.5} sx={{ minHeight: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>팝업 미리보기</Typography>
                <Button size="small" variant="outlined" startIcon={<PreviewIcon />} onClick={() => setPreviewOpen(true)}>실제 크기로 보기</Button>
              </Stack>
              <PopupPreview popup={popup} fitContainer />
            </Stack>
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
            </Box>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>배경 클릭 차단</Typography>
                <Typography variant="caption" color="text.secondary">팝업이 열려 있는 동안 모든 모니터의 배경 클릭을 막고 배경을 어둡게 표시합니다. 키보드 전환은 차단하지 않습니다.</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel control={<Switch size="small" checked={useBackgroundOverlay} onChange={(_, value) => updateContent('useBackgroundOverlay', value)} />} label="사용" />
                  <TextField size="small" type="number" label="배경 어둡기 (%)" value={Math.round(backgroundOverlayOpacity * 100)} disabled={!useBackgroundOverlay}
                    inputProps={{ min: 0, max: 100, step: 5 }} helperText="0% 투명 · 100% 완전 불투명"
                    onChange={(e) => updateContent('backgroundOverlayOpacity', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} sx={{ width: 220 }} />
                </Stack>
              </Stack>
            </Box>


                {popup.popupType === 'TEXT' && <>
                  <Divider /><Typography variant="subtitle2" fontWeight={700}>텍스트 표시</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5 }}>
                <FormControlLabel control={<Switch size="small" checked={showTextContentHeader} onChange={(_, v) => updateContent('showContentHeader', v)} />} label="콘텐츠 제목·설명" />
                <FormControlLabel control={<Switch size="small" checked={markdownMode} onChange={(_, v) => updateContent('markdownMode', v)} />} label="Markdown 모드" />
                {!markdownMode && <FormControlLabel control={<Switch size="small" checked={showTextPlainText} onChange={(_, v) => updateContent('showPlainText', v)} />} label="일반 텍스트" />}
                {!markdownMode && <FormControlLabel control={<Switch size="small" checked={showTextHighlight} onChange={(_, v) => updateContent('showHighlight', v)} />} label="강조 문구 사용" />}
                {<FormControlLabel control={<Switch size="small" checked={showTextBottomDescription} onChange={(_, v) => updateContent('showBottomDescription', v)} />} label="하단 설명" />}
              </Box>
                </>}
                {popup.popupType === 'IMAGE' && !imageFillMode && <>
                  <Divider /><Typography variant="subtitle2" fontWeight={700}>이미지 표시</Typography>
              {!imageFillMode && <FormControlLabel control={<Switch checked={popup.content.showDescription !== false} onChange={(_, value) => updateContent('showDescription', value)} />} label="이미지 설명 표시" />}
                </>}
                {popup.popupType === 'VIDEO' && <>
                  <Divider /><Typography variant="subtitle2" fontWeight={700}>영상 재생</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5 }}>
                {[
                  ['showDescription', '영상 설명 표시'], ['showControls', '컨트롤 표시'], ['allowFullScreen', '전체화면 허용'],
                  ['allowPlaybackRateChange', '배속 변경 허용'], ['autoPlay', '자동 재생'], ['isLoop', '반복 재생'],
                ].map(([key, label]) => <FormControlLabel key={key} control={<Switch size="small" checked={popup.content[key] == null ? key !== 'autoPlay' && key !== 'isLoop' : popup.content[key] === true} onChange={(_, value) => updateContent(key, value)} />} label={label} />)}
                <FormControlLabel control={<Switch size="small" checked={popup.allowCloseBeforeComplete} onChange={(_, value) => updatePopup('allowCloseBeforeComplete', value)} />} label="완료 전 닫기 허용" />
              </Box>
                </>}
            <Divider /><Typography variant="subtitle1" fontWeight={700}>크기 설정</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2 }}>
              <TextField select label="크기 모드" value={popup.sizeMode} onChange={(e) => updatePopup('sizeMode', e.target.value as PopupSizeMode)}>
                <MenuItem value="FIXED">고정 크기</MenuItem><MenuItem value="RATIO">화면 비율</MenuItem><MenuItem value="FULLSCREEN">전체 화면</MenuItem>
              </TextField>
              {popup.sizeMode === 'FIXED' && <><PopupDimensionField label="너비" value={popup.width} minimum={popup.minimumWidth} maximum={popup.maximumWidth} onChange={(value) => updatePopup('width', value)} /><PopupDimensionField label="높이" value={popup.height} minimum={popup.minimumHeight} maximum={popup.maximumHeight} onChange={(value) => updatePopup('height', value)} /></>}
              {popup.sizeMode === 'RATIO' && <><TextField type="number" label="너비 비율" value={popup.widthRatio} inputProps={{ min: 0.1, max: 1, step: 0.05 }} onChange={(e) => updatePopup('widthRatio', Number(e.target.value))} /><TextField type="number" label="높이 비율" value={popup.heightRatio} inputProps={{ min: 0.1, max: 1, step: 0.05 }} onChange={(e) => updatePopup('heightRatio', Number(e.target.value))} /></>}
            </Box>
            {popup.sizeMode !== 'FULLSCREEN' && <Typography variant="caption" color="text.secondary">미리보기 최대 크기: {popup.maximumWidth}px × {popup.maximumHeight}px</Typography>}


              </Stack>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={loading}>취소</Button><Button variant="contained" onClick={savePopup} disabled={loading}>저장</Button></DialogActions>
      <Dialog open={previewOpen} onClose={(_, reason) => {
        if (reason !== 'backdropClick' || !useBackgroundOverlay) setPreviewOpen(false);
      }} BackdropProps={{ sx: { backgroundColor: useBackgroundOverlay ? `rgba(0, 0, 0, ${backgroundOverlayOpacity})` : 'transparent' } }} fullScreen={popup.sizeMode === 'FULLSCREEN'} maxWidth={false}
        PaperProps={popup.sizeMode === 'FULLSCREEN' ? undefined : { sx: { width: modalPreviewSize.width, height: modalPreviewSize.height, maxWidth: '96vw', maxHeight: '96vh', m: 1, overflow: 'hidden' } }}>
        <Button variant="contained" color="primary" aria-label="실제 크기 미리보기 종료"
          onClick={() => setPreviewOpen(false)}
          sx={{ position: 'fixed', top: 12, right: 12, zIndex: (theme) => theme.zIndex.modal + 1, boxShadow: 3 }}>
          미리보기 종료 (Esc)
        </Button>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}><PopupPreview popup={popup} fitContainer showBackground={false} onClose={() => setPreviewOpen(false)} /></DialogContent>
      </Dialog>
    </Dialog>
  );
}
