import { Alert, Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { COMMON_CONTENT_KEYS, CONTENT_KEYS_BY_TYPE, pickPopupFields, toSaveRequestPopup, type PickPopupFieldsOptions } from '..';
import PopupIndependentSamples from '../sample/PopupIndependentSamples';
import GuideCodeRunner, { type RunnerDefinition } from './GuideCodeRunner';
import { protoPopup, samplePopup } from './guideRunners';
import { Bullets, C, CODE_FONT, CodeBlock, Section } from './GuideUi';

/* 컴포넌트별로 꼭 필요한 값과 돌려주는 값(팝업 값 전체 없이 쓰는 기준) */
const MINIMUM_IO: { name: string; input: string; output: string; parent: string }[] = [
  { name: 'PopupScheduleFields', input: 'value: PopupScheduleValue { periodMode, repeatDayOfWeek?, displayTimes?, displayStartAt?, displayEndAt? } · showPeriod?',
    output: 'onChange(patch) 바뀐 항목만', parent: '일정을 state에 담기, 게시 기간을 저장 API 날짜 형식으로 바꾸기, 저장 전 validatePopupSchedule' },
  { name: 'PopupRichTextEditor', input: 'label · initialBlocks: RichBlock[] · compact? · disabled? · placeholder?',
    output: 'onChange(blocks: RichBlock[], plainText: string)', parent: '두 값을 함께 담기, 본문을 바꿔 넣을 때 key 바꾸기' },
  { name: 'PopupQuestionEditor', input: 'questions: PopupQuestion[] · quiz · passingScore? · fixedQuestionScore? · hidePassingScore?',
    output: 'onChange(questions) · onPassingScoreChange(score)', parent: '문항을 state에 담기, 저장 전 validatePopupQuestions' },
  { name: 'InlinePopupPreview · PopupPreviewDialog · PopupPreview', input: 'popup: withPreviewFallback(state)로 만든 값',
    output: '화면 · onOpenPreview? · onClose? · onRecommendedSize?', parent: '넘길 때만 withPreviewFallback(state) 사용하기' },
];

const PICK_CODE = `import { pickPopupFields } from '@/features/PopupcommonComponent';

pickPopupFields(popup, { topLevelKeys: ['popupId', 'title', 'displayStartAt', 'periodMode'] }); // 팝업 항목만
pickPopupFields(popup, { contentKeys: ['plainText', 'textBlocks'] });                           // content 항목만
pickPopupFields(popup, { questionKeys: ['questionId', 'title'] });                              // 문항 항목만
pickPopupFields(popup, {                                                                         // 함께
  topLevelKeys: ['popupId', 'displayStartAt'], contentKeys: ['plainText'], questionKeys: ['questionId', 'title'],
});
// → { popupId, displayStartAt, content: { plainText }, questions: [{ questionId, title }, ...] }`;

/* 실행기: 입력값과 고를 항목으로 실제 pickPopupFields를 불러 결과를 보여 준다. */
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
  hint: 'popup은 입력한 값, options는 가져올 항목 이름입니다. 항목을 빼거나 바꿔 보세요. 빈 문자열·0도 그대로 나옵니다.',
  splitOutput: true,
  compute: (input: { popup: Record<string, unknown>; options: PickPopupFieldsOptions }) => {
    const popup = samplePopup(input.popup);
    return {
      'pickPopupFields(popup, options)': pickPopupFields(popup, input.options),
      '참고 — 기존 팝업 등록 화면에서 사용하는 방식과 비교: pickPopupFields(toSaveRequestPopup(protoPopup), options) · 새 화면에서는 쓰지 않음': pickPopupFields(toSaveRequestPopup(protoPopup(input.popup)), input.options),
    };
  },
};

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 다른 화면에서 사용하기 탭
 * - in : 없음
 * - out: 화면: 컴포넌트별 꼭 필요한 값, pickPopupFields 사용법, 서버 없는 예제 4가지, 실행기
 * - 공통 컴포넌트를 필요한 값만으로 붙이고, 저장할 때 필요한 항목만 가져오는 방법을 보여 준다.
 */
export default function GuideSavePartsTab() {
  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 540px' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.75 }}>
            어떤 테이블·API를 쓰는 화면이든 입력 컴포넌트와 미리보기를 그대로 쓸 수 있습니다. 저장 형식은 각 화면의 저장 API에 맞춰 정하면 됩니다.
          </Alert>

          <Section title="1. 컴포넌트별 꼭 필요한 값" description="팝업 값 전체가 없어도 필요한 값만 넘기면 됩니다. 받는 값 전체는 컴포넌트 탭에 있습니다.">
            <Table size="small" sx={{ '& td, & th': { fontSize: 13.5, py: 1.25, verticalAlign: 'top', lineHeight: 1.65 }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
              <TableHead><TableRow><TableCell sx={{ width: 190 }}>컴포넌트</TableCell><TableCell>꼭 필요한 값</TableCell><TableCell sx={{ width: 190 }}>돌려주는 값</TableCell><TableCell sx={{ width: 220 }}>사용하는 화면에서 할 일</TableCell></TableRow></TableHead>
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
              <C>PopupScheduleFields</C>는 예전 이름인 <C>popup</C>도 받지만, 새 코드는 <C>value</C>를 쓰세요. 공통 컴포넌트는 API를 호출하지 않습니다.
            </Typography>
          </Section>

          <Section title="2. pickPopupFields — 필요한 항목만 가져오기" description="팝업 항목·content·문항에서 고른 항목만 가져옵니다. 세 가지는 따로 또는 함께 고를 수 있습니다.">
            <CodeBlock>{PICK_CODE}</CodeBlock>
            <Box sx={{ mt: 1.5 }}>
              <Bullets items={[
                <>넘긴 종류(<C>topLevelKeys</C>·<C>contentKeys</C>·<C>questionKeys</C>)만 결과에 들어갑니다. 문항 순서는 그대로입니다.</>,
                <>입력하지 않은 항목은 결과에 없습니다.</>,
                <>사용자가 입력한 값은 그대로 가져옵니다. <C>null</C>·<C>false</C>·<C>0</C>·빈 문자열도 그대로입니다.</>,
                <>날짜 형식이나 항목 이름은 바꾸지 않습니다. 저장 API 형식에 맞추는 일은 사용하는 화면에서 합니다.</>,
                <>가져온 객체·배열은 원본과 같은 것을 가리킵니다. 결과를 고칠 때는 새 객체로 만드세요.</>,
                <>잘못된 항목 이름을 쓰면 타입 오류로 알려 줍니다.</>,
                <>선택지 안의 항목은 고를 수 없습니다. <C>{"'options'"}</C>를 고르면 선택지 전체를 가져옵니다.</>,
              ]} />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mt: 3, mb: 1 }}>참고: 유형별 content 항목 이름 (기존 팝업 등록 화면이 저장하는 항목)</Typography>
            <Table size="small" sx={{ '& td, & th': { fontSize: 14, py: 1.25, verticalAlign: 'top' }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
              <TableHead><TableRow><TableCell sx={{ width: 150 }}>유형</TableCell><TableCell>항목 이름</TableCell></TableRow></TableHead>
              <TableBody>
                <TableRow><TableCell>모든 유형</TableCell>
                  <TableCell><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{COMMON_CONTENT_KEYS.map((key) => <C key={key}>{key}</C>)}</Stack></TableCell></TableRow>
                {Object.entries(CONTENT_KEYS_BY_TYPE).map(([type, keys]) => (
                  <TableRow key={type}><TableCell>{type}</TableCell>
                    <TableCell><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{keys.map((key) => <C key={key}>{key}</C>)}</Stack></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 1.5, lineHeight: 1.7 }}>
              항목 이름을 찾을 때 참고하세요. 새 화면은 저장에 필요한 항목만 직접 고르면 됩니다.
            </Typography>
          </Section>
        </Stack>
        <Box sx={{ position: { xl: 'sticky' }, top: 0 }}>
          <GuideCodeRunner definition={RUNNER} title="pickPopupFields 실행기" />
        </Box>
      </Box>

      <Section title="3. 예제 4가지 — 일정만 / 서식 본문 / 문항 / 함께 쓰기"
        description="서버 없이 동작합니다. 입력하면 오른쪽 결과가 바로 바뀝니다. 소스: sample/PopupIndependentSamples.tsx">
        <PopupIndependentSamples />
      </Section>
    </Stack>
  );
}
