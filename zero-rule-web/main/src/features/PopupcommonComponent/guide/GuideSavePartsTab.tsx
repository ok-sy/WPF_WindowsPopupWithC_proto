import { Alert, Box, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { COMMON_CONTENT_KEYS, CONTENT_KEYS_BY_TYPE, pickPopupFields, toSaveRequestPopup, type PickPopupFieldsOptions } from '..';
import PopupIndependentSamples from '../sample/PopupIndependentSamples';
import GuideCodeRunner, { CODE_FONT, type RunnerDefinition } from './GuideCodeRunner';
import { protoPopup, samplePopup } from './guideRunners';

function C({ children }: { children: ReactNode }) {
  return (
    <Box component="code" sx={{ fontFamily: CODE_FONT, fontSize: '0.92em', bgcolor: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0',
      borderRadius: 0.75, px: 0.6, py: 0.1 }}>{children}</Box>
  );
}
function CodeBlock({ children }: { children: string }) {
  return (
    <Box component="pre" sx={{ m: 0, p: 2, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1.5, fontSize: 13, lineHeight: 1.65, overflow: 'auto',
      fontFamily: CODE_FONT }}>{children}</Box>
  );
}
function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Typography component="h3" sx={{ fontSize: 17, fontWeight: 700, pl: 1.25, borderLeft: '4px solid', borderColor: 'primary.main', lineHeight: 1.3 }}>{title}</Typography>
      {description && <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 1, lineHeight: 1.7 }}>{description}</Typography>}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  );
}
function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { fontSize: 14, lineHeight: 1.8, mb: 0.25 }, '& li::marker': { color: 'primary.main' } }}>
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </Box>
  );
}

/* 컴포넌트별 최소 입력·출력(AdminPopupDetail 전체 없이 붙이는 기준) */
const MINIMUM_IO: { name: string; input: string; output: string; parent: string }[] = [
  { name: 'PopupScheduleFields', input: 'value: PopupScheduleValue { periodMode, repeatDayOfWeek?, displayTimes?, displayStartAt?, displayEndAt? } · showPeriod?',
    output: 'onChange(patch) 바뀐 항목만', parent: '일정 state 보관, 날짜 직렬화(입력란 문자열 → 저장 형식), 저장 전 validatePopupSchedule' },
  { name: 'PopupRichTextEditor', input: 'label · initialBlocks: RichBlock[] · compact? · disabled? · placeholder?',
    output: 'onChange(blocks: RichBlock[], plainText: string)', parent: '두 값을 함께 보관, 다시 넣을 때 key로 재마운트' },
  { name: 'PopupQuestionEditor', input: 'questions: PopupQuestion[] · quiz · passingScore? · fixedQuestionScore? · hidePassingScore?',
    output: 'onChange(questions) · onPassingScoreChange(score)', parent: '문항 state 보관, 저장 전 validatePopupQuestions' },
  { name: 'InlinePopupPreview · PopupPreviewDialog · PopupPreview', input: 'popup: AdminPopupDetail(표시용 — withPreviewFallback(state))',
    output: '화면 · onOpenPreview? · onClose? · onRecommendedSize?', parent: 'withPreviewFallback(state)로 표시용 값만 채워 전달(저장·API 호출 없음, 업무 기본값 없음)' },
];

const PICK_CODE = `import { pickPopupFields } from '@/features/PopupcommonComponent';

pickPopupFields(popup, { topLevelKeys: ['popupId', 'title', 'displayStartAt', 'periodMode'] }); // 최상위만
pickPopupFields(popup, { contentKeys: ['plainText', 'textBlocks'] });                           // content만
pickPopupFields(popup, { questionKeys: ['questionId', 'title'] });                              // 문항만
pickPopupFields(popup, {                                                                         // 조합
  topLevelKeys: ['popupId', 'displayStartAt'], contentKeys: ['plainText'], questionKeys: ['questionId', 'title'],
});
// → { popupId, displayStartAt, content: { plainText }, questions: [{ questionId, title }, ...] }`;

/* 실행기: 편집값과 옵션으로 실제 pickPopupFields를 불러 결과를 보여 준다. */
const RUNNER: RunnerDefinition = {
  input: {
    popup: {
      popupId: 'P-001', popupType: 'SURVEY', title: '', hideDays: 0,
      content: { surveyTitle: '만족도', description: '', plainText: '다른 유형 키' },
      questions: [
        { questionId: -1, title: '첫 번째', questionType: 'SINGLE_CHOICE', isRequired: true, isScored: false, sortOrder: 1,
          options: [{ optionId: -11, value: '1', text: '예', sortOrder: 1 }] },
        { questionId: -2, title: '두 번째', questionType: 'MULTIPLE_CHOICE', isRequired: false, isScored: false, sortOrder: 2, minSelections: 1,
          options: [{ optionId: -21, value: '1', text: 'A', sortOrder: 1 }] },
      ],
    },
    options: { topLevelKeys: ['popupId', 'title', 'hideDays', 'displayStartAt'], contentKeys: ['surveyTitle', 'description'], questionKeys: ['questionId', 'minSelections'] },
  },
  hint: 'popup은 화면 state 값(업무 기본값 없음), options는 { topLevelKeys?, contentKeys?, questionKeys? }입니다. 영역을 빼거나 빈 배열을 넣어 보세요(빈 문자열·0도 보존됩니다).',
  splitOutput: true,
  compute: (input: { popup: Record<string, unknown>; options: PickPopupFieldsOptions }) => {
    const popup = samplePopup(input.popup);
    return {
      'pickPopupFields(popup, options)': pickPopupFields(popup, input.options),
      '(proto 저장 기준이 필요할 때) pickPopupFields(toSaveRequestPopup(popup), options)': pickPopupFields(toSaveRequestPopup(protoPopup(input.popup)), input.options),
    };
  },
};

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 독립 재사용·필드 추출 탭
 * - in : 없음
 * - out: 화면: 원칙, 컴포넌트 최소 입력·출력, pickPopupFields 규칙·키 표, 서버 없는 샘플 4종, 실행기
 * - 공통 컴포넌트를 특정 테이블·API·저장 형식과 관계없이 단독으로 붙이고, 필요한 필드만 뽑는 방법을 설명한다.
 */
export default function GuideSavePartsTab() {
  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 540px' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.75 }}>
            PopupcommonComponent는 특정 테이블(3111/3117 포함)·API·저장 요청 형식과 관계없이 <b>입력 UI·독립 상태·필드 추출·미리보기</b>를 재사용하는 공통 모듈입니다.
            proto의 <C>toSaveRequest()</C>는 여러 사용 사례 중 하나일 뿐 기준 계약이 아니며, 저장 형식(날짜·키 이름·JSON 모양)은 각 업무 화면이 정합니다.
          </Alert>

          <Section title="1. 컴포넌트 최소 입력·출력" description="AdminPopupDetail 전체를 만들지 않고 필요한 값만 넘겨 붙입니다(미리보기만 표시용 전체 모양 필요).">
            <Table size="small" sx={{ '& td, & th': { fontSize: 13.5, py: 1.25, verticalAlign: 'top', lineHeight: 1.65 }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
              <TableHead><TableRow><TableCell sx={{ width: 190 }}>컴포넌트</TableCell><TableCell>최소 입력</TableCell><TableCell sx={{ width: 190 }}>출력</TableCell><TableCell sx={{ width: 220 }}>부모 책임</TableCell></TableRow></TableHead>
              <TableBody>
                {MINIMUM_IO.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell><C>{row.name}</C></TableCell>
                    <TableCell sx={{ fontFamily: CODE_FONT, fontSize: '12.5px !important' }}>{row.input}</TableCell>
                    <TableCell sx={{ fontFamily: CODE_FONT, fontSize: '12.5px !important' }}>{row.output}</TableCell>
                    <TableCell>{row.parent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 1.5, lineHeight: 1.7 }}>
              <C>PopupScheduleFields</C>의 기존 <C>popup</C> prop은 호환용으로 계속 받습니다(새 코드는 <C>value</C>). 공통 컴포넌트는 API 호출·DB 컬럼명 선택·특정 테이블용 날짜 직렬화·게시 정책을 하지 않습니다.
            </Typography>
          </Section>

          <Section title="2. pickPopupFields — 선택 필드 추출" description="최상위·content·문항에서 고른 키만 새 객체로 돌려줍니다. 세 영역은 따로 또는 함께 고릅니다.">
            <CodeBlock>{PICK_CODE}</CodeBlock>
            <Box sx={{ mt: 1.5 }}>
              <Bullets items={[
                <>옵션에 준 영역만 결과에 들어갑니다(빈 배열이면 최상위 키 없음·빈 <C>{'{}'}</C>·빈 문항 객체). 문항은 원본 순서를 유지합니다.</>,
                <>키가 실제로 없으면 생략하고, 있으면 <C>null</C>·<C>false</C>·<C>0</C>·빈 문자열(값이 undefined여도)을 그대로 둡니다.</>,
                <><b>값 그대로</b> 돌려줍니다. 날짜 ISO 변환·키 이름 변경·기본값 생성·검증·저장 요청 생성은 하지 않습니다.</>,
                <>새로 만드는 것은 결과 컨테이너(최상위·<C>content</C>·각 문항 객체)뿐이고, 고른 값이 객체·배열이면 원본과 같은 참조입니다(얕은 복사). 결과를 고치려면 새 객체로 만듭니다.</>,
                <>타입: <C>topLevelKeys</C>는 <C>content</C>·<C>questions</C>를 뺀 <C>AdminPopupDetail</C> 키, <C>questionKeys</C>는 <C>PopupQuestion</C> 키만 됩니다. 결과는 고른 키만 가진 타입입니다. 외부 문자열 입력은 별도 검증이 필요합니다.</>,
                <>문항 하위(선택지 안 필드) 선택은 1차 범위 밖입니다. <C>{"'options'"}</C>를 고르면 선택지 배열을 그대로 담습니다.</>,
              ]} />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mt: 3, mb: 1 }}>content 키 (실제 상수, 유형별로 저장되는 키)</Typography>
            <Table size="small" sx={{ '& td, & th': { fontSize: 14, py: 1.25, verticalAlign: 'top' }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
              <TableHead><TableRow><TableCell sx={{ width: 150 }}>구분</TableCell><TableCell>키</TableCell></TableRow></TableHead>
              <TableBody>
                <TableRow><TableCell>공통 창 옵션</TableCell>
                  <TableCell><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{COMMON_CONTENT_KEYS.map((key) => <C key={key}>{key}</C>)}</Stack></TableCell></TableRow>
                {Object.entries(CONTENT_KEYS_BY_TYPE).map(([type, keys]) => (
                  <TableRow key={type}><TableCell>{type}</TableCell>
                    <TableCell><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{keys.map((key) => <C key={key}>{key}</C>)}</Stack></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 1.5, lineHeight: 1.7 }}>
              proto 저장 기준(다른 유형 content 키 제외·URL 보정·날짜 ISO)이 필요한 경우에만 <C>toSaveRequestPopup(popup)</C> 결과를 넘깁니다. 이 변환은 proto 저장 전용이며 범용 추출과 섞지 않습니다.
            </Typography>
          </Section>
        </Stack>
        <Box sx={{ position: { xl: 'sticky' }, top: 0 }}>
          <GuideCodeRunner definition={RUNNER} title="pickPopupFields 실행기" />
        </Box>
      </Box>

      <Section title="3. 서버 없는 샘플 — 일정만 / RichText + content 일부 / 문항 일부 / 세 영역 조합"
        description="각 샘플은 자기 state만 갖고 특정 DB 테이블·API 없이 동작합니다. 입력하면 오른쪽 결과가 바로 바뀝니다. 소스: sample/PopupIndependentSamples.tsx">
        <PopupIndependentSamples />
      </Section>
    </Stack>
  );
}
