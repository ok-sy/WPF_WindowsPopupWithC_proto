import { Box, Stack, Typography } from '@mui/material';
import { Bullets, CodeBlock, Page, Section, TabLink, type GuideNavigate } from '../GuideUi';

const IMPORT_CODE = `import {
  PopupRichTextEditor, PopupQuestionEditor, PopupScheduleFields,   // 입력
  InlinePopupPreview, PopupPreviewDialog,                           // 미리보기
  pickPopupFields, withPreviewFallback,                             // 필요한 항목 가져오기·미리보기 기본값
  type RichBlock, type PopupScheduleValue,
} from '@/features/PopupcommonComponent';`;

const MINIMAL_CODE = `// 1) 입력값 담기: 처음에는 화면에서 정한 popupType 하나만 둡니다.
//    제목·본문은 사용자가 입력할 때 추가됩니다(빈 값으로 미리 넣지 않습니다).
const [state, setState] = useState<Partial<AdminPopupDetail>>({ popupType: 'TEXT' });

// 2) 입력받기: 컴포넌트가 바뀐 값을 돌려주면 state에 넣습니다.
<TextField label="제목" value={state.title ?? ''}                       // 화면에만 '' 표시(state에는 넣지 않음)
  onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))} />
<PopupRichTextEditor label="본문" initialBlocks={[]}
  onChange={(textBlocks, plainText) => setState((p) => ({ ...p, content: { ...p.content, textBlocks, plainText } }))} />
// 입력 전: { popupType: 'TEXT' } → 제목 입력 후: { popupType: 'TEXT', title: '점검 안내' }

// 3) 미리보기: 미리보기에 필요한 기본값만 채워서 보여 줍니다(state는 그대로).
<InlinePopupPreview popup={withPreviewFallback(state)} />

// 4) 저장: 필요한 항목만 가져옵니다. 입력하지 않은 항목은 결과에 없습니다.
const picked = pickPopupFields(state, { topLevelKeys: ['popupType', 'title'], contentKeys: ['textBlocks', 'plainText'] });

// ↓ [직접 구현] myApi·toMyRequest는 설명용 이름입니다(이 모듈에 없음). 각 화면에서 만듭니다.
//   toMyRequest(picked): 저장할 때 사용하는 API 형식에 맞게 바꿉니다(날짜 형식·항목 이름 등).
//   myApi.save(body):    저장 API를 호출하고 결과를 안내합니다.
await myApi.save(toMyRequest(picked));`;

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 시작하기 탭(첫 진입)
 * - in : onNavigate(tab) 다른 탭으로 이동
 * - out: 화면: 소개, 알아둘 점, 가져오기 코드, 가장 짧은 사용 예, 기존 팝업 등록 화면 안내
 * - 받는 값 전체 표는 컴포넌트 탭에 있으므로 여기서는 반복하지 않는다.
 */
export default function GuideStartTab({ onNavigate }: { onNavigate: GuideNavigate }) {
  return (
    <Page>
      <Section title="공통 컴포넌트 사용하기">
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 15, lineHeight: 1.8 }}>팝업의 본문, 설문, 게시 기간 등을 다른 화면에서도 사용할 수 있습니다.</Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.8 }}>필요한 컴포넌트를 가져와 입력값을 받고, 저장할 때는 필요한 항목만 골라 사용하세요.</Typography>
        </Stack>
      </Section>

      <Section title="알아둘 점">
        <Bullets items={[
          '미리보기에 표시되는 기본값은 실제 저장값과 다를 수 있습니다.',
          '사용자가 입력하지 않은 값은 임의로 채워서 저장하지 않습니다.',
          '사용자가 입력한 값은 그대로 유지합니다.',
          '저장 가능한 데이터인지는 서버에서 최종 확인합니다.',
        ]} />
      </Section>

      <Section title="1. 가져오기" description="공통 컴포넌트는 index.ts에서 가져오세요.">
        <CodeBlock>{IMPORT_CODE}</CodeBlock>
      </Section>

      <Section title="2. 가장 짧은 사용 예" description="입력값 담기 → 입력받기 → 미리보기 → 필요한 항목만 가져와 저장 순서입니다.">
        <CodeBlock>{MINIMAL_CODE}</CodeBlock>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <TabLink label="순서 자세히 보기(사용 순서)" onClick={() => onNavigate('process')} />
          <TabLink label="예제 4가지(다른 화면에서 사용하기)" onClick={() => onNavigate('saveParts')} />
          <TabLink label="직접 해 보기(실습)" onClick={() => onNavigate('live')} />
        </Stack>
      </Section>

      <Section title="3. 기존 팝업 등록 화면" description="기존 팝업 등록 화면(RgstPop)은 다른 방식으로 동작합니다.">
        <Bullets items={[
          '`createDefaultPopup()`으로 기본값이 채워진 값을 만들고 `toSaveRequest()`로 저장합니다.',
          '새 화면에서는 이 함수들을 쓰지 않아도 됩니다. 위 2번 예처럼 쓰면 됩니다.',
        ]} />
        <Box sx={{ mt: 1 }}>
          <TabLink label="기존 방식 보기(사용 순서 P1~P5)" onClick={() => onNavigate('process')} />
        </Box>
      </Section>
    </Page>
  );
}
