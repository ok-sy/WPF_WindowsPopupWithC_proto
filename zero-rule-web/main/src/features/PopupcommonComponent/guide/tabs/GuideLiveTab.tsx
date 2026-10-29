import type { AdminPopupDetail } from '@local/domain';
import {
  Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import {
  InlinePopupPreview, PopupPreviewDialog, PopupRichTextEditor, changePopupType, createDefaultPopup, isSubmitPopupType,
  plainTextToBlocks, readTextBlocks, toSaveRequest, withPreviewFallback, type PopupTypeSelection, type Size,
} from '../..';
import {
  changeSampleType, newSamplePopup, toSampleScreenValues, type SamplePopupState,
} from '../../sample/popupSampleData';
import { C, CodeBlock, Section } from '../GuideUi';

const TYPE_OPTIONS: { value: PopupTypeSelection; label: string }[] = [
  { value: 'TEXT', label: '텍스트' }, { value: 'IMAGE', label: '이미지' }, { value: 'VIDEO', label: '동영상' },
  { value: 'SURVEY', label: '설문' }, { value: 'QUIZ', label: '퀴즈' }, { value: 'VIDEO_QUIZ', label: '영상 + 퀴즈' },
];
const selectionOf = (popup: Pick<AdminPopupDetail, 'popupType' | 'content'>): PopupTypeSelection =>
  popup.popupType === 'QUIZ' && popup.content.videoEnabled === true ? 'VIDEO_QUIZ' : popup.popupType;
/* 미설정 content 값은 빈 문자열로 표시만 한다(state에는 넣지 않음). */
const text = (content: Record<string, unknown>, key: string) => { const value = content[key]; return value == null ? '' : String(value); };

/** 공통 입력(유형·제목·푸터·본문·이미지 URL). 두 실습 모드가 같은 입력 배치를 쓴다. */
function LiveInputs({ selection, onType, title, onTitle, content, onContent, onBody, editorKey, typeNote }: {
  selection: PopupTypeSelection; onType: (next: PopupTypeSelection) => void; title: string; onTitle: (value: string) => void;
  content: Record<string, unknown>; onContent: (key: string, value: unknown) => void; onBody: (blocks: ReturnType<typeof plainTextToBlocks>, plainText: string) => void;
  editorKey: number; typeNote: ReactNode;
}) {
  const popupType = selection === 'VIDEO_QUIZ' ? 'QUIZ' : selection;
  return (
    <Stack spacing={2.5}>
      <Stack spacing={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>유형</InputLabel>
            <Select label="유형" value={selection} onChange={(event) => onType(event.target.value as PopupTypeSelection)}>
              {TYPE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="팝업 제목" value={title} sx={{ flex: 1 }} onChange={(event) => onTitle(event.target.value)} />
        </Stack>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{typeNote}</Typography>
      </Stack>
      {!isSubmitPopupType(popupType) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>푸터 버튼 동작</InputLabel>
            <Select label="푸터 버튼 동작" value={text(content, 'footerAction') || 'CLOSE'} onChange={(event) => onContent('footerAction', event.target.value)}>
              <MenuItem value="CLOSE">확인</MenuItem><MenuItem value="LINK_AND_CLOSE">바로가기 (링크 열고 닫기)</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="바로가기 URL" placeholder="example.com" value={text(content, 'footerLinkUrl')} sx={{ flex: 1 }}
            onChange={(event) => onContent('footerLinkUrl', event.target.value)} />
        </Stack>
      )}
      {popupType === 'TEXT' && (
        <PopupRichTextEditor key={editorKey} label="본문 (PopupRichTextEditor)"
          initialBlocks={readTextBlocks(content.textBlocks) ?? plainTextToBlocks(text(content, 'plainText'))} onChange={onBody} />
      )}
      {popupType === 'IMAGE' && (
        <TextField size="small" label="이미지 URL" value={text(content, 'imageUrl')} onChange={(event) => onContent('imageUrl', event.target.value)} />
      )}
      {popupType !== 'TEXT' && popupType !== 'IMAGE' && (
        <Alert severity="info" sx={{ fontSize: 14 }}>설문·퀴즈 문항과 영상 입력은 예시 탭(IS063M02)에서 확인하세요. 여기서는 유형 변경과 출력 값만 봅니다.</Alert>
      )}
    </Stack>
  );
}

/** 미리보기 영역(인라인 + 실제 크기 모달). */
function LivePreview({ popup }: { popup: AdminPopupDetail }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);
  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, width: { xs: '100%', lg: 460 }, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 520 }}>
        <InlinePopupPreview popup={popup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setRecommended} title="3. 미리보기" />
      </Paper>
      <PopupPreviewDialog popup={popup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={recommended} />
    </>
  );
}

/**
 * ■ 실습(범용): 독립 state → pickPopupFields → 미리보기 fallback
 * - state는 입력한 값만 갖는다(미설정 = 키 생략). 유형 전환은 업무 기본값을 채우지 않는다(샘플 changeSampleType).
 * - 출력은 화면 state와 선택 추출 결과(샘플 키 목록의 pickPopupFields = toSampleScreenValues). 서버에는 보내지 않는다.
 */
function CommonLive() {
  const initial = () => newSamplePopup('GUIDE-001', '가이드 실습');
  const [state, setState] = useState<SamplePopupState>(initial);
  const [editorKey, setEditorKey] = useState(0);
  const [view, setView] = useState<'state' | 'pick'>('pick');
  const picked = useMemo(() => toSampleScreenValues(state), [state]);
  const setContent = (key: string, value: unknown) => setState((previous) => ({ ...previous, content: { ...previous.content, [key]: value } }));
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="stretch">
      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
        <Section title="1. 화면 state 바꾸기" description="입력하지 않은 값은 state에 키가 없습니다. 미리보기에만 withPreviewFallback으로 표시용 값을 채웁니다.">
          <Stack spacing={2.5}>
            <LiveInputs selection={selectionOf(state)} title={state.title} content={state.content} editorKey={editorKey}
              onType={(next) => setState((previous) => changeSampleType(previous, next))}
              onTitle={(title) => setState((previous) => ({ ...previous, title }))}
              onContent={setContent}
              onBody={(blocks, plainText) => setState((previous) => ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))}
              typeNote={<>유형을 바꾸면 <C>popupType</C>만 바뀝니다(창 크기·완료 비율 기본값을 채우지 않음, 샘플 <C>changeSampleType</C>).</>} />
            <Box>
              <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
                onClick={() => { setState(initial()); setEditorKey((key) => key + 1); }}>처음 값으로 (입력 없음)</Button>
            </Box>
          </Stack>
        </Section>
        <Section title="2. 화면 state와 선택 추출 결과">
          <Stack spacing={1.5}>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
              <ToggleButton value="state">화면 state</ToggleButton>
              <ToggleButton value="pick">pickPopupFields 결과</ToggleButton>
            </ToggleButtonGroup>
            {view === 'pick' && (
              <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                값 그대로 뽑은 결과입니다(날짜·URL 변환, 기본값 없음). 실제 저장 형식은 각 업무 화면의 저장 경계에서 정합니다. 키 목록: <C>sample/popupSampleData.ts</C> <C>toSampleScreenValues</C>.
              </Alert>
            )}
            <Box sx={{ maxHeight: 460, overflow: 'auto', borderRadius: 1.5 }}>
              <CodeBlock>{JSON.stringify(view === 'pick' ? picked : state, null, 2)}</CodeBlock>
            </Box>
          </Stack>
        </Section>
      </Stack>
      <LivePreview popup={withPreviewFallback(state)} />
    </Stack>
  );
}

/**
 * ■ 실습(proto 전용): createDefaultPopup → changePopupType → toSaveRequest
 * - proto 등록 화면(RgstPop)의 편집값과 저장 요청이 어떻게 달라지는지(유형별 키 제거·URL 정규화·Footer 정규형) 보여 준다. 서버에는 보내지 않는다.
 */
function ProtoLive() {
  const initial = () => ({ ...createDefaultPopup(), popupId: 'GUIDE-001', title: '가이드 실습' });
  const [popup, setPopup] = useState<AdminPopupDetail>(initial);
  const [editorKey, setEditorKey] = useState(0);
  const [view, setView] = useState<'edit' | 'save'>('save');
  const request = useMemo(() => toSaveRequest(popup, true, []), [popup]);
  const removedKeys = Object.keys(popup.content).filter((key) => !(key in request.popup.content));
  const setContent = (key: string, value: unknown) => setPopup((previous) => ({ ...previous, content: { ...previous.content, [key]: value } }));
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="stretch">
      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
        <Section title="1. proto 편집값 바꾸기" description="입력할 때마다 proto 저장 변환(toSaveRequest)으로 요청을 다시 만듭니다. 서버에는 보내지 않습니다.">
          <Stack spacing={2.5}>
            <LiveInputs selection={selectionOf(popup)} title={popup.title} content={popup.content} editorKey={editorKey}
              onType={(next) => setPopup((previous) => changePopupType(previous, next))}
              onTitle={(title) => setPopup((previous) => ({ ...previous, title }))}
              onContent={setContent}
              onBody={(blocks, plainText) => setPopup((previous) => ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))}
              typeNote={<>유형을 바꾸면 <C>changePopupType(previous, selection)</C>이 호출됩니다(proto 기본값 채움).</>} />
            <Box>
              <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
                onClick={() => { setPopup(initial()); setEditorKey((key) => key + 1); }}>처음 값으로 (createDefaultPopup)</Button>
            </Box>
          </Stack>
        </Section>
        <Section title="2. proto 편집값과 저장 요청 비교">
          <Stack spacing={1.5}>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
              <ToggleButton value="edit">편집값 (AdminPopupDetail)</ToggleButton>
              <ToggleButton value="save">저장 요청 (toSaveRequest)</ToggleButton>
            </ToggleButtonGroup>
            {view === 'save' && (
              <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                <Box>저장 요청에서 빠진 content 키 <b>{removedKeys.length}개</b> — 유형에 맞는 키만 남기고, 확인(CLOSE)은 기본값이라 footerAction을 보내지 않습니다. URL은 <C>https://</C>를 보정합니다.</Box>
                {removedKeys.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>{removedKeys.map((key) => <C key={key}>{key}</C>)}</Stack>
                )}
              </Alert>
            )}
            <Box sx={{ maxHeight: 460, overflow: 'auto', borderRadius: 1.5 }}>
              <CodeBlock>{JSON.stringify(view === 'save' ? request : popup, null, 2)}</CodeBlock>
            </Box>
          </Stack>
        </Section>
      </Stack>
      <LivePreview popup={popup} />
    </Stack>
  );
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 실습 탭
 * - in : 없음
 * - out: 화면: 독립 필드 추출 실습(기본) / proto 저장 변환 실습(선택) — 입력·출력 JSON·미리보기
 * - 모드를 바꾸면 해당 실습을 새로 마운트한다(입력·에디터가 처음 값으로 돌아가는 것이 의도한 동작).
 */
export default function GuideLiveTab() {
  const [mode, setMode] = useState<'common' | 'proto'>('common');
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
          <ToggleButton value="common">독립 필드 추출 (범용)</ToggleButton>
          <ToggleButton value="proto">proto 저장 변환 (RgstPop 전용)</ToggleButton>
        </ToggleButtonGroup>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>모드를 바꾸면 입력이 처음 값으로 돌아갑니다.</Typography>
      </Stack>
      {mode === 'common' ? <CommonLive /> : <ProtoLive />}
    </Stack>
  );
}
