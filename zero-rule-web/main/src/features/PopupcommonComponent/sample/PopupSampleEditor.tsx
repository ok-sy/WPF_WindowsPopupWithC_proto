import type { AdminPopupDetail } from '@local/domain';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { useState } from 'react';
import InlinePopupPreview from '../InlinePopupPreview';
import PopupPreviewDialog from '../PopupPreviewDialog';
import PopupQuestionEditor from '../PopupQuestionEditor';
import { richBlocksOrNull } from '../PopupRichBlocks';
import PopupRichTextEditor from '../PopupRichTextEditor';
import type { Size } from '../imagePreviewLayout';
import { POPUP_MIN_WINDOW_SIZE, POPUP_TYPE_LABELS } from '../popupCommon';
import { changePopupType, contentValue, isSubmitPopupType, type PopupTypeSelection } from '../popupEditorTransform';
import { plainTextToBlocks, readTextBlocks } from '../popupRichText';

type Props = {
  /** 편집을 시작할 값. 열 때마다 새 key로 마운트해 이전 편집 상태가 섞이지 않게 한다. */
  initial: AdminPopupDetail;
  open: boolean;
  onClose: () => void;
  /** 저장 버튼. 부모가 toSaveRequest로 요청 객체를 만들고 저장 위치(로컬/서버)를 정한다. */
  onSave: (popup: AdminPopupDetail) => void;
};

const selectionOf = (popup: AdminPopupDetail): PopupTypeSelection =>
  popup.popupType === 'QUIZ' && popup.content.videoEnabled === true ? 'VIDEO_QUIZ' : popup.popupType;

/*
 * [TODO69] 공통 컴포넌트만으로 만든 최소 편집 화면(관리자 API·인증 없음).
 * 왼쪽 입력값(state 하나)을 우측 InlinePopupPreview와 "실제 크기로 보기" PopupPreviewDialog에 같은 객체로 넘긴다.
 * 실제 등록 화면(RgstPop/PopupEditorDialog)의 일정·대상 그룹·템플릿 등은 넣지 않는다.
 * 본문 편집기는 key로 마운트한다: 유형 전환·다른 팝업 열기에서만 다시 만들고, 입력 중에는 커서를 유지한다.
 * 인수인계 가이드: docs/interfaces/POPUP_FRONT_SAMPLE_HANDOVER.md (선언 이유·로직·옵션·옵션 추가/삭제 예시·실연동 교체 지점).
 * 주석 표식: [옵션] = 바꿔도 되는 값, [실연동] = 실제 서버에 붙일 때 바꾸는 곳.
 * [옵션] 입력 필드를 더하려면 update(최상위 키) 또는 updateContent(content 키)로 연결한다. 새 content 키는
 *        popupEditorTransform.ts의 COMMON_CONTENT_KEYS/CONTENT_KEYS_BY_TYPE에도 넣어야 저장 요청에 남는다(가이드 §4.2).
 */
export default function PopupSampleEditor({ initial, open, onClose, onSave }: Props) {
  const [popup, setPopup] = useState<AdminPopupDetail>(initial);
  const [editorKey, setEditorKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fitWindow, setFitWindow] = useState<Size | null>(null);
  // 편집값은 항상 새 객체로 바꾼다(미리보기는 같은 객체를 받기만 하고 수정하지 않는다).
  const update = <K extends keyof AdminPopupDetail>(key: K, value: AdminPopupDetail[K]) => setPopup((previous) => ({ ...previous, [key]: value }));
  const updateContent = (key: string, value: unknown) => setPopup((previous) => ({ ...previous, content: { ...previous.content, [key]: value } }));
  const isQuestion = popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ';
  const hasVideo = popup.popupType === 'VIDEO' || popup.content.videoEnabled === true;
  const footerAction = isSubmitPopupType(popup.popupType) ? 'SUBMIT' : contentValue(popup, 'footerAction') || 'CLOSE';
  const numberField = (label: string, key: 'width' | 'height') => (
    <TextField type="number" size="small" label={label} value={popup[key] ?? ''} slotProps={{ htmlInput: { min: POPUP_MIN_WINDOW_SIZE } }}
      onChange={(event) => update(key, event.target.value === '' ? undefined : Number(event.target.value))} />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} slotProps={{ paper: { sx: { width: 'min(1280px, 96vw)', height: 'min(860px, 94vh)' } } }}>
      <DialogTitle>팝업 편집 (공통 컴포넌트 샘플)</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.9fr)', gap: 2, minHeight: 0 }}>
        <Stack spacing={2} sx={{ overflowY: 'auto', pr: 1 }} data-testid="sample-editor-form">
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" label="유형" value={selectionOf(popup)} sx={{ minWidth: 150 }}
              onChange={(event) => { setPopup((previous) => changePopupType(previous, event.target.value as PopupTypeSelection)); setEditorKey((key) => key + 1); }}>
              {(Object.keys(POPUP_TYPE_LABELS) as (keyof typeof POPUP_TYPE_LABELS)[]).map((type) => <MenuItem key={type} value={type}>{POPUP_TYPE_LABELS[type]}</MenuItem>)}
              <MenuItem value="VIDEO_QUIZ">영상 + 퀴즈</MenuItem>
            </TextField>
            <TextField size="small" fullWidth label="팝업 제목(헤더)" value={popup.title} slotProps={{ htmlInput: { 'aria-label': '팝업 제목' } }}
              onChange={(event) => update('title', event.target.value)} />
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {numberField('너비', 'width')}
            {numberField('높이', 'height')}
            <FormControlLabel control={<Checkbox checked={popup.showLater} onChange={(event) => update('showLater', event.target.checked)} />} label="나중에 보기" />
          </Stack>
          {!isSubmitPopupType(popup.popupType) && <Stack direction="row" spacing={1.5}>
            <TextField select size="small" label="푸터 동작" value={footerAction} sx={{ minWidth: 150 }} onChange={(event) => updateContent('footerAction', event.target.value)}>
              <MenuItem value="CLOSE">닫기</MenuItem>
              <MenuItem value="LINK_AND_CLOSE">바로가기</MenuItem>
            </TextField>
            {footerAction === 'LINK_AND_CLOSE' && <TextField size="small" fullWidth label="바로가기 URL" value={contentValue(popup, 'footerLinkUrl')}
              onChange={(event) => updateContent('footerLinkUrl', event.target.value)} />}
          </Stack>}
          {popup.popupType === 'TEXT' && <PopupRichTextEditor key={`text-${editorKey}`} label="본문"
            initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentValue(popup, 'plainText'))}
            onChange={(blocks, plainText) => setPopup((previous) => ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))} />}
          {popup.popupType === 'IMAGE' && <TextField size="small" label="이미지 URL" value={contentValue(popup, 'imageUrl')} onChange={(event) => updateContent('imageUrl', event.target.value)} />}
          {hasVideo && <TextField size="small" label="영상 URL" value={contentValue(popup, 'videoUrl')} onChange={(event) => updateContent('videoUrl', event.target.value)} />}
          {isQuestion && <>
            <PopupRichTextEditor key={`survey-title-${editorKey}`} compact label="콘텐츠 제목" placeholder="콘텐츠 제목"
              initialBlocks={richBlocksOrNull(popup.content.surveyTitleBlocks) ?? plainTextToBlocks(contentValue(popup, 'surveyTitle'))}
              onChange={(blocks, plainText) => setPopup((previous) => ({ ...previous, content: { ...previous.content, surveyTitleBlocks: blocks, surveyTitle: plainText } }))} />
            {/* 문항별 입력·선택 state는 PopupQuestionEditor가 문항 객체마다 따로 관리한다. */}
            <PopupQuestionEditor key={`questions-${editorKey}`} questions={popup.questions} quiz={popup.popupType === 'QUIZ'} passingScore={popup.passingScore}
              onPassingScoreChange={(score) => update('passingScore', score)} onChange={(questions) => update('questions', questions)} />
          </>}
        </Stack>
        <Box sx={{ minHeight: 0, display: 'flex', flexDirection: 'column' }} data-testid="sample-inline-preview">
          <InlinePopupPreview popup={popup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setFitWindow} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto', pl: 1 }}>
          저장은 부모 화면이 정한다(이 샘플 목록은 브라우저 메모리에만 보관하며 서버에 저장하지 않는다).
        </Typography>
        <Button onClick={onClose}>취소</Button>
        {/* [실연동] 저장 전 입력 검증(validatePopupQuestions·validatePopupSchedule·크기 범위 등)은 PopupEditorDialog.save를 참고해 부모에서 수행한다. */}
        <Button variant="contained" onClick={() => onSave(popup)}>저장</Button>
      </DialogActions>
      <PopupPreviewDialog popup={popup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={fitWindow} />
    </Dialog>
  );
}
