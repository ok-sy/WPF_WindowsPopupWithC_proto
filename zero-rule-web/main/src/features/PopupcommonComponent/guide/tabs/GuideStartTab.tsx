import { Box, Stack, Typography } from '@mui/material';
import { Bullets, CodeBlock, Page, Section, TabLink, type GuideNavigate } from '../GuideUi';
import { MINIMAL_POPUP_INPUT, QUIZ_POPUP_INPUT, typedExampleCode } from '../guideTypeExamples';

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

/* PopupAdmin.ts 타입 안내(TODO73-31). 예시 값은 guideTypeExamples.ts에서 실제 타입으로 선언해 타입 검사를 받는다. */
const TYPE_IMPORT_CODE = `import type { AdminPopupDetail, PopupOption, PopupQuestion, PopupType } from '@local/domain';
// 정의 위치: zero-rule-web/sub/domain/src/model/PopupAdmin.ts`;

const TYPE_TREE = `AdminPopupDetail                팝업 하나 (popupType: PopupType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'SURVEY' | 'QUIZ')
├─ 창·노출 설정                  title, sizeMode, width, height, showFooter, displayStartAt …
├─ passingScore                  퀴즈 기준 점수 (QUIZ만, 참여형은 통계용 합격 기준)
├─ quizTypeCode                  퀴즈 유형 코드 0090 (QUIZ만: '00' 참여형·'01' 만점형·'02' 컷트라인형)
├─ content: Record<string, …>    유형별 본문 (TEXT: plainText·textBlocks, 설문·퀴즈: description …)
└─ questions: PopupQuestion[]    설문·퀴즈 문항 (SURVEY·QUIZ만, 그 외 유형은 [])
     └─ options: PopupOption[]   선택지 (주관식 TEXT 문항은 [])`;

const MINIMAL_TYPE_CODE = typedExampleCode('const state: Partial<AdminPopupDetail>', MINIMAL_POPUP_INPUT);
const QUIZ_TYPE_CODE = `// 문항은 content 안이 아니라 최상위 questions에 둡니다. OX형은 SINGLE_CHOICE + 선택지 'O'·'X' 두 개입니다.
// 퀴즈 유형은 최상위 quizTypeCode('01' 만점형), 기준 점수는 passingScore입니다(문항 1점이라 2 = 2문항 모두 정답).
${typedExampleCode('const quiz: Partial<AdminPopupDetail>', QUIZ_POPUP_INPUT)}`;

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 시작하기 탭(첫 진입)
 * - in : onNavigate(tab) 다른 탭으로 이동
 * - out: 화면: 소개, 알아둘 점, 가져오기 코드, 가장 짧은 사용 예, PopupAdmin.ts 타입 안내·예시, 기존 팝업 등록 화면 안내
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

      <Section title="3. 데이터 타입(PopupAdmin.ts)" description="입력값·미리보기·저장에 쓰는 팝업 타입과 포함 관계입니다.">
        <CodeBlock>{TYPE_IMPORT_CODE}</CodeBlock>
        <Bullets items={[
          '`PopupType`: 팝업 유형 값입니다. `popupType`에 넣습니다.',
          '`AdminPopupDetail`: 팝업 하나의 전체 정보입니다. 창·노출 설정, `content`(유형별 본문), `questions`(문항)를 가집니다.',
          '`PopupQuestion`: 설문·퀴즈 문항 하나입니다. `AdminPopupDetail.questions` 배열에 들어갑니다.',
          '`PopupOption`: 선택지 하나입니다. `PopupQuestion.options` 배열에 들어갑니다. 퀴즈 정답은 `isCorrect`로 표시합니다.',
        ]} />
        <Box sx={{ mt: 1 }}><CodeBlock>{TYPE_TREE}</CodeBlock></Box>
        <Typography fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>세 가지 값의 차이</Typography>
        <Bullets items={[
          '화면 입력값 `Partial<AdminPopupDetail>`: 사용자가 입력한 항목만 있습니다. 처음에는 `popupType`만 둡니다.',
          '상세 값 `AdminPopupDetail`: 모든 필수 항목이 채워진 값입니다. 조회 응답(`api.popupAdmin.info`의 `popup`)과 미리보기가 씁니다. 새 화면은 `withPreviewFallback(state)`로 미리보기용 값을 만듭니다.',
          '저장 요청: `pickPopupFields`로 필요한 항목만 골라 각 화면의 API 형식으로 바꿉니다. 기존 등록 화면은 `toSaveRequest()`가 `PopupSaveRequest { popup, active, targetGroups }`를 만듭니다.',
        ]} />
        <Typography fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>예시 1. 가장 짧은 입력값</Typography>
        <CodeBlock>{MINIMAL_TYPE_CODE}</CodeBlock>
        <Typography fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>예시 2. 퀴즈 문항(OX형·선다형)</Typography>
        <CodeBlock>{QUIZ_TYPE_CODE}</CodeBlock>
        <Bullets items={[
          '문항 제목 `title`과 선택지 문구 `text`는 일반 문자열이며 줄바꿈을 넣을 수 있습니다. 편집기에서 퀴즈 문항 제목은 서식 편집기, 설문 문항 제목과 선택지는 일반 입력칸으로 입력합니다.',
          '`titleBlocks`·`textBlocks`는 글자 서식이 있을 때만 씁니다. 값이 있으면 서버가 `title`·`text`를 서식에서 만들고, 일반 입력칸에서 고치면 비워집니다(`null`). 퀴즈 문항 제목은 OX 여부와 무관하게 서식 편집기를 씁니다.',
          '답안 유형(OX형·선다형)은 따로 저장하지 않습니다. 다시 열 때 단일 선택이면서 선택지가 `O`·`X` 두 개이면 OX형으로 봅니다.',
          '설문·퀴즈 문항은 최대 30개입니다(`QUESTION_MAX`).',
        ]} />
      </Section>

      <Section title="4. 기존 팝업 등록 화면" description="기존 팝업 등록 화면(RgstPop)은 다른 방식으로 동작합니다.">
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
