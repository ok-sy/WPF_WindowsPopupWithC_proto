import type { AdminPopupDetail } from '@local/domain';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Alert, Badge, Box, Button, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import {
  InlinePopupPreview, PopupPreviewDialog, PopupRichTextEditor, changePopupType, contentValue, createDefaultPopup, plainTextToBlocks,
  readTextBlocks, toSaveRequest, type PopupTypeSelection, type Size,
} from '..';
import {
  COMPONENTS, FUNCTIONS, PROCESSES, type GuideField, type GuideFunction,
} from './guideData';
import IS063M02Sample from '../sample/IS063M02Sample';
import GuideCodeRunner from './GuideCodeRunner';
import GuideSavePartsTab from './GuideSavePartsTab';
import {
  GUIDE_NOTICES, NOTICE_CATEGORY_LABELS, NOTICE_STATUS_LABELS, type NoticeCategory,
} from './guideNotices';
import { COMPONENT_RUNNERS, RUNNER_NOTES } from './guideRunners';

/* ---------- 표시 공통 ---------- */

/* 최근 며칠 안의 공지에 NEW를 붙인다. */
const NEW_DAYS = 14;
/* 본문 최대 폭. 한 줄이 너무 길면 읽기 어려워 화면이 넓어도 이 폭까지만 쓴다(실습 탭은 넓게). */
const CONTENT_MAX_WIDTH = 1120;
/* 코드 글꼴. 브라우저 기본 monospace는 한글 환경에서 가늘고 넓게 보여 고정폭 글꼴을 직접 지정한다. */
const CODE_FONT = 'Consolas, "D2Coding", "Cascadia Mono", "Courier New", monospace';
const CATEGORY_COLORS: Record<NoticeCategory, 'primary' | 'warning' | 'error' | 'info' | 'default'> = {
  ADDED: 'primary', CHANGED: 'warning', REMOVED: 'error', PLANNED: 'info', NOTICE: 'default',
};
const TYPE_OPTIONS: { value: PopupTypeSelection; label: string }[] = [
  { value: 'TEXT', label: '텍스트' }, { value: 'IMAGE', label: '이미지' }, { value: 'VIDEO', label: '동영상' },
  { value: 'SURVEY', label: '설문' }, { value: 'QUIZ', label: '퀴즈' }, { value: 'VIDEO_QUIZ', label: '영상 + 퀴즈' },
];

function isRecent(date: string, now: Date): boolean {
  const time = new Date(`${date}T00:00:00+09:00`).getTime();
  return Number.isFinite(time) && now.getTime() - time < NEW_DAYS * 24 * 60 * 60 * 1000;
}

/** 본문 안 코드 조각(함수·키 이름). */
function C({ children }: { children: ReactNode }) {
  return (
    <Box component="code" sx={{ fontFamily: CODE_FONT, fontSize: '0.92em', bgcolor: '#f1f5f9', color: '#0f172a',
      border: '1px solid #e2e8f0', borderRadius: 0.75, px: 0.6, py: 0.1, whiteSpace: 'nowrap' }}>{children}</Box>
  );
}

/** 설명 문자열의 `백틱` 구간을 코드 조각으로 바꾼다. */
function RichText({ text }: { text: string }) {
  return <>{text.split('`').map((part, index) => (index % 2 === 1 ? <C key={index}>{part}</C> : <Fragment key={index}>{part}</Fragment>))}</>;
}

/** 여러 줄 코드 블록. */
function CodeBlock({ children }: { children: string }) {
  return (
    <Box component="pre" sx={{ m: 0, p: 2, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1.5, fontSize: 13, lineHeight: 1.65,
      overflow: 'auto', whiteSpace: 'pre', fontFamily: CODE_FONT }}>{children}</Box>
  );
}

/** 제목 왼쪽 강조선이 있는 구획. */
function Section({ title, description, children, id }: { title: ReactNode; description?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Paper id={id} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Typography component="h3" sx={{ fontSize: 17, fontWeight: 700, pl: 1.25, borderLeft: '4px solid', borderColor: 'primary.main', lineHeight: 1.3 }}>
        {title}
      </Typography>
      {description && <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 1, lineHeight: 1.7 }}>{description}</Typography>}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  );
}

/** 읽기 좋은 글머리 목록. */
function Bullets({ items }: { items: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { fontSize: 14, lineHeight: 1.8, mb: 0.5 }, '& li::marker': { color: 'primary.main' } }}>
      {items.map((item) => <li key={item}><RichText text={item} /></li>)}
    </Box>
  );
}

function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <Stack spacing={2.5} sx={{ maxWidth: wide ? 'none' : CONTENT_MAX_WIDTH }}>{children}</Stack>;
}

/* ---------- 프로세스 ---------- */

function ProcessTab() {
  const jump = (id: string) => document.getElementById(`guide-process-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <Page>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {PROCESSES.map((process) => <Chip key={process.id} label={process.title} onClick={() => jump(process.id)} variant="outlined" sx={{ fontSize: 13.5 }} />)}
      </Stack>
      {PROCESSES.map((process) => (
        <Section key={process.id} id={`guide-process-${process.id}`} title={process.title} description={process.summary}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 3 }}>
            {/* 단계: 세로 타임라인 */}
            <Stack spacing={0}>
              {process.steps.map((step, index) => (
                <Stack key={step.actor} direction="row" spacing={1.5}>
                  <Stack alignItems="center">
                    <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index + 1}</Box>
                    {index < process.steps.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
                  </Stack>
                  <Box sx={{ pb: index < process.steps.length - 1 ? 2 : 0, minWidth: 0 }}>
                    <C>{step.actor}</C>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.75, mt: 0.5 }}><RichText text={step.description} /></Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            {/* 부모 책임·주의·관련 컴포넌트 */}
            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, alignSelf: 'start' }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, mb: 0.5 }}>부모 화면이 하는 일</Typography>
              <Bullets items={process.parent} />
              {process.notes && process.notes.length > 0 && (
                <>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, mt: 1.5, mb: 0.5 }}>참고</Typography>
                  <Bullets items={process.notes} />
                </>
              )}
              {COMPONENTS.some((component) => component.processes.includes(process.id)) && (
                <>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, mt: 1.5, mb: 0.75 }}>관련 컴포넌트</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {COMPONENTS.filter((component) => component.processes.includes(process.id)).map((component) => <C key={component.name}>{component.name}</C>)}
                  </Stack>
                </>
              )}
            </Box>
          </Box>
        </Section>
      ))}
    </Page>
  );
}

/* ---------- 컴포넌트 ---------- */

function FieldTable({ fields, empty }: { fields: GuideField[]; empty: string }) {
  if (fields.length === 0) return <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{empty}</Typography>;
  return (
    <Table size="small" sx={{ '& td, & th': { fontSize: 14, py: 1.25, verticalAlign: 'top' }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
      <TableHead><TableRow><TableCell sx={{ width: 190 }}>이름</TableCell><TableCell sx={{ width: '38%' }}>형식</TableCell><TableCell>설명</TableCell></TableRow></TableHead>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.name}>
            <TableCell><C>{field.name}</C>{field.required && <Typography component="span" color="error" sx={{ ml: 0.5 }} title="필수">*</Typography>}</TableCell>
            <TableCell sx={{ fontFamily: CODE_FONT, fontSize: '13px !important', color: '#334155', wordBreak: 'break-word' }}>{field.type}</TableCell>
            <TableCell sx={{ lineHeight: 1.7 }}>{field.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ComponentTab() {
  const [selected, setSelected] = useState(COMPONENTS[0].name);
  const component = COMPONENTS.find((item) => item.name === selected) ?? COMPONENTS[0];
  const runner = COMPONENT_RUNNERS[component.name];
  return (
    <Stack spacing={2.5}>
      {/* 컴포넌트 선택: 가로 목록(설명과 실행기에 폭을 쓰려고 세로 목록 대신 위에 둔다) */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Tabs value={selected} onChange={(_, value) => setSelected(value)} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', minHeight: 44, fontFamily: CODE_FONT, fontSize: 13.5 } }}>
          {COMPONENTS.map((item) => <Tab key={item.name} value={item.name} label={item.name} />)}
        </Tabs>
      </Paper>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 480px', xl: 'minmax(0, 1fr) 560px' }, gap: 2.5, alignItems: 'start' }}>
      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Typography sx={{ fontFamily: CODE_FONT, fontSize: 22, fontWeight: 700 }}>{component.name}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>{component.file}</Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.75, mt: 1.5 }}>{component.summary}</Typography>
        </Paper>
        <Section title="입력 props" description="* 표시는 필수입니다."><FieldTable fields={component.props} empty="없음" /></Section>
        <Section title="출력 (콜백·화면)"><FieldTable fields={component.outputs} empty="없음" /></Section>
        <Section title="다루는 값"><Bullets items={component.values} /></Section>
        <Section title="재사용 방법">
          <Bullets items={component.reuse} />
          <Box sx={{ mt: 2 }}><CodeBlock>{`import { ${component.name} } from '@/features/PopupcommonComponent';\n\n${component.example}`}</CodeBlock></Box>
        </Section>
      </Stack>
      {/* 오른쪽: INPUT → 실행 결과 → OUTPUT. 컴포넌트를 바꾸면 key로 실행기를 새로 만든다. */}
      <Box sx={{ position: { lg: 'sticky' }, top: 0, minWidth: 0 }}>
        {runner
          ? <GuideCodeRunner key={component.name} definition={runner} title={`${component.name} 실행기`} />
          : <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>{RUNNER_NOTES[component.name] ?? '이 컴포넌트는 실행기가 없습니다.'}</Alert>}
      </Box>
      </Box>
    </Stack>
  );
}

/* ---------- 변환·유틸 ---------- */

function FunctionTab() {
  const files = Array.from(new Set(FUNCTIONS.map((fn) => fn.file)));
  return (
    <Page>
      <Alert severity="info" sx={{ fontSize: 14 }}>React를 쓰지 않는 일반 함수입니다. 입력 객체를 바꾸지 않고 새 값을 돌려줍니다.</Alert>
      {files.map((file) => (
        <Section key={file} title={file}>
          <Stack spacing={0}>
            {FUNCTIONS.filter((fn) => fn.file === file).map((fn: GuideFunction, index, list) => (
              <Box key={fn.name} sx={{ py: 1.5, borderBottom: index < list.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}>
                <Typography sx={{ fontFamily: CODE_FONT, fontWeight: 700, fontSize: 15 }}>{fn.name}</Typography>
                <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.25 }}>{fn.description}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>입력</Typography><C>{fn.input}</C>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>반환</Typography><C>{fn.output}</C>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Section>
      ))}
    </Page>
  );
}

/* ---------- 실습 ---------- */

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 실습: 실제 변환 함수 호출
 * - 편집값을 이 화면 state로 두고 changePopupType·PopupRichTextEditor·toSaveRequest를 그대로 호출해,
 *   편집값과 저장 요청이 어떻게 달라지는지(유형별 키 제거·URL 정규화·Footer 정규형)를 보여 준다. 서버에는 보내지 않는다.
 */
function LiveTab() {
  const initial = () => ({ ...createDefaultPopup(), popupId: 'GUIDE-001', title: '가이드 실습' });
  const [selection, setSelection] = useState<PopupTypeSelection>('TEXT');
  const [popup, setPopup] = useState<AdminPopupDetail>(initial);
  const [editorKey, setEditorKey] = useState(0);
  const [view, setView] = useState<'edit' | 'save'>('save');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);
  const request = useMemo(() => toSaveRequest(popup, true, []), [popup]);
  const removedKeys = Object.keys(popup.content).filter((key) => !(key in request.popup.content));
  const setContent = (key: string, value: unknown) => setPopup((previous) => ({ ...previous, content: { ...previous.content, [key]: value } }));
  const isSubmit = popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ';

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="stretch">
      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
        <Section title="1. 편집값 바꾸기" description="입력할 때마다 실제 함수로 저장 요청을 다시 만듭니다. 서버에는 보내지 않습니다.">
          <Stack spacing={2.5}>
            <Stack spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>유형</InputLabel>
                <Select label="유형" value={selection}
                  onChange={(event) => { const next = event.target.value as PopupTypeSelection; setSelection(next); setPopup((previous) => changePopupType(previous, next)); }}>
                  {TYPE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" label="팝업 제목" value={popup.title} sx={{ flex: 1 }}
                onChange={(event) => setPopup((previous) => ({ ...previous, title: event.target.value }))} />
            </Stack>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>유형을 바꾸면 <C>changePopupType(previous, selection)</C>이 호출됩니다.</Typography>
            </Stack>
            {!isSubmit && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>푸터 버튼 동작</InputLabel>
                  <Select label="푸터 버튼 동작" value={contentValue(popup, 'footerAction') || 'CLOSE'} onChange={(event) => setContent('footerAction', event.target.value)}>
                    <MenuItem value="CLOSE">확인</MenuItem><MenuItem value="LINK_AND_CLOSE">바로가기 (링크 열고 닫기)</MenuItem>
                  </Select>
                </FormControl>
                <TextField size="small" label="바로가기 URL" placeholder="example.com" value={contentValue(popup, 'footerLinkUrl')} sx={{ flex: 1 }}
                  helperText="https:// 를 생략하면 저장 요청에서 붙습니다" onChange={(event) => setContent('footerLinkUrl', event.target.value)} />
              </Stack>
            )}
            {popup.popupType === 'TEXT' && (
              <PopupRichTextEditor key={editorKey} label="본문 (PopupRichTextEditor)"
                initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentValue(popup, 'plainText'))}
                onChange={(blocks, plainText) => setPopup((previous) => ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))} />
            )}
            {popup.popupType === 'IMAGE' && (
              <TextField size="small" label="이미지 URL" value={contentValue(popup, 'imageUrl')} onChange={(event) => setContent('imageUrl', event.target.value)} />
            )}
            {popup.popupType !== 'TEXT' && popup.popupType !== 'IMAGE' && (
              <Alert severity="info" sx={{ fontSize: 14 }}>설문·퀴즈 문항과 영상 입력은 팝업 등록 화면에서 확인하세요. 여기서는 유형 변경과 저장 변환만 봅니다.</Alert>
            )}
            <Box>
              <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
                onClick={() => { setPopup(initial()); setSelection('TEXT'); setEditorKey((key) => key + 1); }}>
                처음 값으로 (createDefaultPopup)
              </Button>
            </Box>
          </Stack>
        </Section>
        <Section title="2. 편집값과 저장 요청 비교">
          <Stack spacing={1.5}>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
              <ToggleButton value="edit">편집값 (AdminPopupDetail)</ToggleButton>
              <ToggleButton value="save">저장 요청 (toSaveRequest)</ToggleButton>
            </ToggleButtonGroup>
            {view === 'save' && (
              <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                <Box>저장 요청에서 빠진 content 키 <b>{removedKeys.length}개</b> — 유형에 맞는 키만 남기고, 확인(CLOSE)은 기본값이라 footerAction을 보내지 않습니다.</Box>
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
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, width: { xs: '100%', lg: 460 }, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 520 }}>
        <InlinePopupPreview popup={popup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setRecommended}
          title="3. 미리보기" />
      </Paper>
      <PopupPreviewDialog popup={popup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={recommended} />
    </Stack>
  );
}

/* ---------- 공지 ---------- */

function NoticeTab({ now }: { now: Date }) {
  const [category, setCategory] = useState<NoticeCategory | 'ALL'>('ALL');
  const notices = [...GUIDE_NOTICES]
    .filter((notice) => category === 'ALL' || notice.category === category)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const categories = Object.keys(NOTICE_CATEGORY_LABELS) as NoticeCategory[];
  return (
    <Page>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <Chip label={`전체 ${GUIDE_NOTICES.length}`} color={category === 'ALL' ? 'primary' : 'default'} onClick={() => setCategory('ALL')} />
        {categories.map((item) => {
          const count = GUIDE_NOTICES.filter((notice) => notice.category === item).length;
          return count ? <Chip key={item} label={`${NOTICE_CATEGORY_LABELS[item]} ${count}`} color={category === item ? 'primary' : 'default'} onClick={() => setCategory(item)} /> : null;
        })}
      </Stack>
      {notices.map((notice) => (
        <Paper key={notice.id} variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, borderLeft: '4px solid',
          borderLeftColor: `${CATEGORY_COLORS[notice.category] === 'default' ? 'grey.400' : `${CATEGORY_COLORS[notice.category]}.main`}` }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" color={CATEGORY_COLORS[notice.category]} label={NOTICE_CATEGORY_LABELS[notice.category]} />
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{notice.title}</Typography>
            {isRecent(notice.date, now) && <Chip size="small" color="error" label="NEW" sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />}
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            {notice.date} 공지 · {NOTICE_STATUS_LABELS[notice.status]}{notice.doneDate ? ` (${notice.doneDate})` : ''}
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            {notice.body.map((line) => <Typography key={line} sx={{ fontSize: 14, lineHeight: 1.8 }}><RichText text={line} /></Typography>)}
          </Stack>
          {notice.action && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9a3412' }}>사용하는 쪽에서 할 일</Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.25 }}><RichText text={notice.action} /></Typography>
            </Box>
          )}
          {notice.components && notice.components.length > 0 && (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>영향</Typography>
              {notice.components.map((name) => <C key={name}>{name}</C>)}
            </Stack>
          )}
        </Paper>
      ))}
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
        공지는 <C>guide/guideNotices.ts</C>에 항목을 추가해 배포합니다. 최근 {NEW_DAYS}일 안의 공지에 NEW가 붙습니다.
      </Typography>
    </Page>
  );
}

/* ---------- 화면 ---------- */

type GuideTab = 'notice' | 'process' | 'component' | 'saveParts' | 'example' | 'function' | 'live';

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 화면
 * - in : 없음(설명은 guideData.ts, 공지는 guideNotices.ts)
 * - out: 화면: 공지·프로세스·컴포넌트·독립 재사용·예시(IS063M02Sample)·변환 함수·실습 탭
 * - 공통 컴포넌트가 어떤 값을 받고 돌려주는지, 프로세스별로 어떻게 변환되는지, 다른 화면에서 어떻게 재사용하는지 설명하고
 *   추가 예정·변경·삭제를 공지한다. 서버 API를 호출하지 않는다. 사이드바 메뉴: db/oracle/20_popup_common_guide_menu_oracle.sql.
 */
export default function PopupCommonGuide() {
  const [tab, setTab] = useState<GuideTab>('notice');
  const [now] = useState(() => new Date());
  const newCount = GUIDE_NOTICES.filter((notice) => isRecent(notice.date, now)).length;
  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5, overflow: 'auto', height: '100%', bgcolor: '#fafbfc' }}>
      <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>PopupcommonComponent 가이드</Typography>
      <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>팝업 공통 편집기·미리보기·변환 함수의 사용 방법과 변경 공지</Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)}
        sx={{ mt: 2, mb: 3, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontSize: 15, fontWeight: 600, minWidth: 96 } }}>
        <Tab value="notice" label={<Badge color="error" badgeContent={newCount} sx={{ pr: newCount ? 1.5 : 0 }}>공지</Badge>} />
        <Tab value="process" label="프로세스" />
        <Tab value="component" label="컴포넌트" />
        <Tab value="saveParts" label="독립 재사용·필드 추출" />
        <Tab value="example" label="예시" />
        <Tab value="function" label="변환·유틸" />
        <Tab value="live" label="실습" />
      </Tabs>
      {tab === 'notice' && <NoticeTab now={now} />}
      {tab === 'process' && <ProcessTab />}
      {tab === 'component' && <ComponentTab />}
      {tab === 'saveParts' && <GuideSavePartsTab />}
      {tab === 'example' && (
        <Stack spacing={1.5}>
          <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
            컨텐츠 등록 화면(IS063M02) 퍼블리싱에 공통 컴포넌트를 연결한 예시입니다(<C>sample/IS063M02Sample.tsx</C>). 서버 없이 동작하며, 저장 값은 화면이 입력하는 필드만 담아 보여 줍니다(서버 미전송).
            폐쇄망 전역 n* 스타일은 이 환경에 없어 배치만 맞춥니다.
          </Alert>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'auto' }}><IS063M02Sample /></Paper>
        </Stack>
      )}
      {tab === 'function' && <FunctionTab />}
      {tab === 'live' && <LiveTab />}
    </Box>
  );
}
