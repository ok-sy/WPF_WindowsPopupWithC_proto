import type { AdminPopupDetail, PopupQuestion } from '@local/domain';
import {
  Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import {
  InlinePopupPreview, PopupPreviewDialog, PopupRichTextEditor, changePopupType, createDefaultPopup, isSubmitPopupType,
  pickPopupFields, plainTextToBlocks, readTextBlocks, toSaveRequest, withPreviewFallback, type PickPopupFieldsOptions, type PopupTopLevelKey,
  type PopupTypeSelection, type Size,
} from '../..';
import {
  changeSampleType, newSamplePopup, type SamplePopupState,
} from '../../sample/popupSampleData';
import { C, CODE_FONT, CodeBlock, Section } from '../GuideUi';

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
        <Alert severity="info" sx={{ fontSize: 14 }}>설문·퀴즈 문항과 영상 입력은 예시 탭에서 해 볼 수 있습니다.</Alert>
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

/* 실습에서 고를 수 있는 추출 키. state에 없는 키(창 크기·나중에 보기 등)도 넣어, 고르더라도 결과에서 빠지는 것(미설정)을 보여 준다. */
const TOP_LEVEL_CHOICES: PopupTopLevelKey[] = ['popupId', 'popupType', 'title', 'width', 'height', 'showLater'];
const CONTENT_CHOICES = ['textBlocks', 'plainText', 'imageUrl', 'footerAction', 'footerLinkUrl', 'videoEnabled'];
const QUESTION_CHOICES: (keyof PopupQuestion)[] = ['questionId', 'title', 'questionType', 'isRequired'];
type PickSelection = { top: PopupTopLevelKey[]; content: string[]; question: (keyof PopupQuestion)[] };

/* 고른 키로 옵션을 만든다. 영역에서 아무것도 고르지 않으면 그 옵션을 빼서 결과에서도 그 영역이 빠지게 한다(빈 배열과 다름). */
function toPickOptions(selection: PickSelection): PickPopupFieldsOptions {
  return {
    ...(selection.top.length ? { topLevelKeys: selection.top } : {}),
    ...(selection.content.length ? { contentKeys: selection.content } : {}),
    ...(selection.question.length ? { questionKeys: selection.question } : {}),
  };
}
/* 화면에 보여 줄 실제 호출 코드. 고른 순서가 아니라 선택지 순서로 적는다. */
function pickCallCode(options: PickPopupFieldsOptions): string {
  const list = (keys: readonly string[]) => `[${keys.map((key) => `'${key}'`).join(', ')}]`;
  const lines = [
    options.topLevelKeys && `  topLevelKeys: ${list(options.topLevelKeys)},`,
    options.contentKeys && `  contentKeys: ${list(options.contentKeys)},`,
    options.questionKeys && `  questionKeys: ${list(options.questionKeys)},`,
  ].filter(Boolean);
  return lines.length ? `const picked = pickPopupFields(state, {\n${lines.join('\n')}\n});` : 'const picked = pickPopupFields(state, {}); // 고른 영역이 없으면 빈 객체';
}

/** 추출 키 선택 칩 묶음. */
function KeyChips<K extends string>({ label, choices, selected, present, onToggle }: {
  label: string; choices: readonly K[]; selected: readonly K[]; present: (key: K) => boolean; onToggle: (key: K) => void;
}) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography sx={{ fontSize: 13, fontWeight: 700, minWidth: 104 }}>{label}</Typography>
      {choices.map((key) => (
        <Chip key={key} size="small" label={present(key) ? key : `${key} (입력 안 함)`} clickable aria-pressed={selected.includes(key)}
          color={selected.includes(key) ? 'primary' : 'default'} variant={selected.includes(key) ? 'filled' : 'outlined'}
          onClick={() => onToggle(key)} sx={{ fontFamily: CODE_FONT, fontSize: 12.5 }} />
      ))}
    </Stack>
  );
}

/**
 * ■ 실습(범용): 독립 state → pickPopupFields(고른 키) → 미리보기 fallback
 * - state는 입력한 값만 갖는다(미설정 = 키 생략). 유형 전환은 업무 기본값을 채우지 않는다(샘플 changeSampleType).
 * - 추출할 키를 고르면 실제 호출 코드와 결과를 바로 보여 준다. 고른 키가 state에 없으면 결과에서도 빠진다. 서버에는 보내지 않는다.
 */
function CommonLive() {
  const initial = () => newSamplePopup('GUIDE-001', '가이드 실습');
  const [state, setState] = useState<SamplePopupState>(initial);
  const [editorKey, setEditorKey] = useState(0);
  const [view, setView] = useState<'state' | 'pick'>('pick');
  const [selection, setSelection] = useState<PickSelection>({ top: ['popupType', 'title'], content: ['textBlocks', 'plainText'], question: [] });
  const options = useMemo(() => toPickOptions(selection), [selection]);
  const picked = useMemo(() => pickPopupFields(state, options), [state, options]);
  const setContent = (key: string, value: unknown) => setState((previous) => ({ ...previous, content: { ...previous.content, [key]: value } }));
  // 선택지 순서를 유지해 토글한다(호출 코드가 고른 순서에 따라 흔들리지 않게).
  const toggle = <K extends string>(choices: readonly K[], current: readonly K[], key: K): K[] =>
    choices.filter((choice) => (choice === key ? !current.includes(key) : current.includes(choice)));
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="stretch">
      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
        <Section title="1. 값 입력하기" description="입력하지 않은 항목은 state에 들어가지 않습니다. 미리보기에는 withPreviewFallback으로 기본값만 채웁니다.">
          <Stack spacing={2.5}>
            <LiveInputs selection={selectionOf(state)} title={state.title} content={state.content} editorKey={editorKey}
              onType={(next) => setState((previous) => changeSampleType(previous, next))}
              onTitle={(title) => setState((previous) => ({ ...previous, title }))}
              onContent={setContent}
              onBody={(blocks, plainText) => setState((previous) => ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))}
              typeNote={<>유형을 바꾸면 <C>popupType</C>만 바뀝니다. 기본값은 채우지 않습니다.</>} />
            <Box>
              <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
                onClick={() => { setState(initial()); setEditorKey((key) => key + 1); }}>처음으로 (입력 없음)</Button>
            </Box>
          </Stack>
        </Section>
        <Section title="2. 가져올 항목 고르기" description="항목을 누르면 아래 호출 코드와 결과가 바로 바뀝니다.">
          <Stack spacing={1.25} data-testid="live-pick-keys">
            <KeyChips label="팝업 항목" choices={TOP_LEVEL_CHOICES} selected={selection.top} present={(key) => key in state}
              onToggle={(key) => setSelection((previous) => ({ ...previous, top: toggle(TOP_LEVEL_CHOICES, previous.top, key) }))} />
            <KeyChips label="content" choices={CONTENT_CHOICES} selected={selection.content} present={(key) => key in state.content}
              onToggle={(key) => setSelection((previous) => ({ ...previous, content: toggle(CONTENT_CHOICES, previous.content, key) }))} />
            <KeyChips label="문항 항목" choices={QUESTION_CHOICES} selected={selection.question} present={() => state.questions.length > 0}
              onToggle={(key) => setSelection((previous) => ({ ...previous, question: toggle(QUESTION_CHOICES, previous.question, key) }))} />
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.7 }}>
              &quot;(입력 안 함)&quot; 항목은 골라도 결과에 나오지 않습니다. 이 실습에는 문항이 없어 문항 항목을 고르면 <C>questions: []</C>가 나옵니다.
            </Typography>
          </Stack>
        </Section>
        <Section title="3. 호출 코드와 결과">
          <Stack spacing={1.5}>
            <Box data-testid="live-pick-code"><CodeBlock>{pickCallCode(options)}</CodeBlock></Box>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
              <ToggleButton value="pick">pickPopupFields 결과</ToggleButton>
              <ToggleButton value="state">입력한 값(state)</ToggleButton>
            </ToggleButtonGroup>
            {view === 'pick' && (
              <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                입력한 값을 그대로 가져옵니다. 저장할 때 사용하는 API 형식에 맞게 바꾸는 일은 사용하는 화면에서 합니다.
              </Alert>
            )}
            <Box data-testid="live-pick-result" sx={{ maxHeight: 460, overflow: 'auto', borderRadius: 1.5 }}>
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
        <Section title="1. 값 입력하기 (기존 팝업 등록 방식)" description="입력할 때마다 toSaveRequest로 저장 요청을 다시 만듭니다. 서버에는 보내지 않습니다.">
          <Stack spacing={2.5}>
            <LiveInputs selection={selectionOf(popup)} title={popup.title} content={popup.content} editorKey={editorKey}
              onType={(next) => setPopup((previous) => changePopupType(previous, next))}
              onTitle={(title) => setPopup((previous) => ({ ...previous, title }))}
              onContent={setContent}
              onBody={(blocks, plainText) => setPopup((previous) => ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))}
              typeNote={<>유형을 바꾸면 <C>changePopupType(previous, selection)</C>이 기본값을 채웁니다.</>} />
            <Box>
              <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
                onClick={() => { setPopup(initial()); setEditorKey((key) => key + 1); }}>처음 값으로 (createDefaultPopup)</Button>
            </Box>
          </Stack>
        </Section>
        <Section title="2. 입력한 값과 저장 요청 비교">
          <Stack spacing={1.5}>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
              <ToggleButton value="edit">입력한 값</ToggleButton>
              <ToggleButton value="save">저장 요청 (toSaveRequest)</ToggleButton>
            </ToggleButtonGroup>
            {view === 'save' && (
              <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                <Box>저장 요청에서 빠진 content 항목 <b>{removedKeys.length}개</b> — 유형에 맞는 항목만 남깁니다. 하단 버튼이 “확인”이면 footerAction은 보내지 않습니다. URL 앞에 <C>https://</C>를 붙입니다.</Box>
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
 * - out: 화면: 독립 필드 추출 실습(기본: 추출 키 선택·호출 코드·결과) / proto 저장 변환 실습(선택) — 입력·출력 JSON·미리보기
 * - 모드를 바꾸면 해당 실습을 새로 마운트한다(입력·에디터가 처음 값으로 돌아가는 것이 의도한 동작).
 */
export default function GuideLiveTab() {
  const [mode, setMode] = useState<'common' | 'proto'>('common');
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
          <ToggleButton value="common">필요한 항목만 가져오기 (공통 사용)</ToggleButton>
          <ToggleButton value="proto">기존 팝업 등록 방식</ToggleButton>
        </ToggleButtonGroup>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>모드를 바꾸면 입력이 처음 값으로 돌아갑니다.</Typography>
      </Stack>
      {mode === 'common' ? <CommonLive /> : <ProtoLive />}
    </Stack>
  );
}
