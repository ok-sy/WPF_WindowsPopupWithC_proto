/*
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 화면의 설명 데이터
 * - 화면(PopupCommonGuide.tsx)과 분리해 컴포넌트·함수·프로세스 설명만 둔다. 코드가 바뀌면 이 파일을 함께 고친다.
 * - 이름·props·반환값은 실제 소스(../index.ts가 내보내는 것)와 같아야 한다. 새 컴포넌트를 index.ts에 추가하면 COMPONENTS에도 추가한다.
 * - 공지(추가 예정·변경·삭제)는 guideNotices.ts에 따로 둔다.
 * - 범위(scope): COMMON = 어느 업무 화면이든 쓰는 범용 계약, PROTO = proto 등록 화면(RgstPop)의 편집값 생성·저장 흐름.
 *   PROTO 함수(createDefaultPopup·toSaveRequest 등)를 독립 화면의 필수 사전 처리로 설명하지 않는다.
 * ■ 개발 가이드 갱신 규칙(docs/design/20261030_PopupCommonGuide_화면정리_구현명세_TODO.md §4)
 *  1) 컴포넌트 추가: index.ts export → COMPONENTS(props·출력·예제) → guideRunners 실행기(가능하면) → guideNotices 공지 순으로 함께 고친다.
 *  2) 함수 추가: FUNCTIONS에 scope와 함께 등록한다. 등록 누락·이름 오류는 scripts/verify-popup-guide-registry.cjs가 검사한다.
 *  3) props 변경·삭제: 공지 action에 영향 화면·바꾸는 방법을 적는다. 정책 상세는 docs/design TODO가 단일 근거이고 여기엔 요약만 둔다.
 * ■ 화면 문구 작성 규칙(가이드에 보이는 모든 글)
 *  1) 한 문장에 한 가지만 설명한다.  2) 개발 용어보다 실제 동작을 설명한다(예: '미설정은 키 생략' → '입력하지 않은 항목은 서버에 보내지 않습니다').
 *  3) pickPopupFields()·withPreviewFallback()처럼 개발자가 호출하는 함수명·Props 이름은 그대로 쓴다.
 *  4) 설계 배경·정책 상세는 docs 문서에 두고 화면에는 사용 방법과 주의사항만 쓴다.  5) 다른 탭에서 이미 설명한 내용은 반복하지 않는다.
 */

/** 설명 범위: COMMON = 범용, PROTO = proto(RgstPop) 전용 */
export type GuideScope = 'COMMON' | 'PROTO';

/** props·콜백·반환값 한 줄 설명 */
export interface GuideField {
  name: string;
  type: string;
  /** 필수 여부. 생략하면 선택 */
  required?: boolean;
  description: string;
}

/** 컴포넌트 설명 */
export interface GuideComponent {
  name: string;
  /** features/PopupcommonComponent 기준 파일 경로 */
  file: string;
  summary: string;
  /** 입력 props */
  props: GuideField[];
  /** 콜백·화면 출력 */
  outputs: GuideField[];
  /** 다루는 값(데이터 형식)과 저장 위치 */
  values: string[];
  /** 재사용 방법·주의 */
  reuse: string[];
  /** 사용 예시 코드 */
  example: string;
  /** 관련 프로세스 ID(PROCESSES의 id) */
  processes: string[];
}

/** 변환·유틸 함수 설명 */
export interface GuideFunction {
  name: string;
  file: string;
  scope: GuideScope;
  input: string;
  output: string;
  description: string;
}

/** 프로세스 한 단계 */
export interface GuideStep {
  /** 호출하는 컴포넌트·함수 */
  actor: string;
  description: string;
}

/** 등록 화면 프로세스 */
export interface GuideProcess {
  id: string;
  scope: GuideScope;
  title: string;
  summary: string;
  steps: GuideStep[];
  /** 부모(등록 화면)가 맡는 일 */
  parent: string[];
  notes?: string[];
}

export const PROCESSES: GuideProcess[] = [
  // ── 공통 사용: 입력값 받기 → 미리보기 → 필요한 항목만 가져와 저장 ──
  {
    id: 'state', scope: 'COMMON', title: '① 입력값 담기', summary: '사용자가 입력한 값만 화면 state에 담습니다.',
    steps: [
      { actor: '화면 state', description: '필요한 값만 useState에 담습니다. 일정만 쓰면 `PopupScheduleValue`, 본문만 쓰면 `{ textBlocks, plainText }`면 됩니다.' },
      { actor: '처음 값', description: '팝업 모양이 필요하면 `{ popupType }` 하나로 시작합니다. 제목·본문·문항은 사용자가 입력할 때 추가됩니다.' },
      { actor: '입력하지 않은 항목', description: '입력하지 않은 항목은 state에 넣지 않습니다. 그래야 서버에 보내지 않고, 서버가 기본값을 적용합니다.' },
      { actor: '사용자가 비운 값', description: '사용자가 일부러 비우거나 끈 값(`false`·`0`·빈 문자열)은 그대로 유지합니다.' },
      { actor: '유형 바꾸기', description: '유형을 바꿀 때는 `popupType`만 바꿉니다. 창 크기 같은 기본값은 채우지 않습니다. 예시: `sample/popupSampleData.ts`의 `changeSampleType`.' },
    ],
    parent: ['입력값을 state에 담기', '값을 새로 넣을 때 편집기 key 바꾸기', '팝업 ID·대상 같은 업무 값 정하기'],
  },
  {
    id: 'richtext', scope: 'COMMON', title: '② 서식 본문 입력', summary: '서식이 있는 본문을 입력받습니다.',
    steps: [
      { actor: 'readTextBlocks(value) ?? plainTextToBlocks(plainText)', description: '편집기에 처음 보여 줄 본문을 만듭니다. 서식이 없으면 일반 글자로 보여 줍니다.' },
      { actor: 'PopupRichTextEditor', description: '입력할 때마다 onChange(blocks, plainText)로 서식 본문과 일반 글자를 함께 돌려줍니다.' },
      { actor: 'htmlToBlocks / blocksToPlainText', description: '편집기 HTML을 저장용 서식 본문으로 바꿉니다. 지원하지 않는 서식은 빼고 글자는 남깁니다.' },
      { actor: 'PopupRichBlocks', description: '저장된 서식 본문을 화면에 그립니다.' },
    ],
    parent: ['onChange로 받은 두 값을 함께 저장하기', '본문을 바꿔 넣을 때 편집기 key 바꾸기'],
    notes: ['쓸 수 있는 서식: 굵게·기울임·밑줄·취소선, 색 40가지, 글자 크기, 글꼴 4가지, 정렬, 들여쓰기.'],
  },
  {
    id: 'question', scope: 'COMMON', title: '③ 설문·퀴즈 문항 입력', summary: '문항·선택지·정답·통과 점수를 입력받습니다.',
    steps: [
      { actor: 'PopupQuestionEditor', description: '문항을 추가·수정할 때마다 전체 문항 목록을 onChange로 돌려줍니다.' },
      { actor: 'PopupQuizRuleFields + usePopupQuizRule', description: '퀴즈 유형과 기준 개수를 고르면 통과 점수를 계산합니다.' },
      { actor: 'validatePopupQuestions(questions, quiz, passingScore)', description: '저장 전에 입력 오류를 확인합니다. 오류가 없으면 null을 돌려줍니다.' },
    ],
    parent: ['문항 목록을 state에 담기', '오류가 있으면 저장하지 않고 안내하기'],
    notes: ['입력할 때 오류를 확인할 수 있지만, 실제 저장 가능 여부는 서버에서 확인합니다.'],
  },
  {
    id: 'schedule', scope: 'COMMON', title: '④ 게시 기간·노출 일정 입력', summary: '게시 기간과 노출 요일·시간대를 입력받습니다.',
    steps: [
      { actor: 'PopupScheduleFields(value)', description: '바뀐 항목만 onChange(patch)로 돌려줍니다. showPeriod를 주면 게시 기간도 함께 입력받습니다.' },
      { actor: 'validatePopupSchedule(value) / describeSchedule', description: '저장 전에 시간대 오류를 확인하고, 일정 요약 문구를 만듭니다.' },
    ],
    parent: ['patch를 state에 합치기', '게시 기간을 저장 API 날짜 형식으로 바꾸기'],
    notes: ['실제로 언제 보일지는 서버가 한국 시간으로 판단합니다.'],
  },
  {
    id: 'preview', scope: 'COMMON', title: '⑤ 미리보기', summary: '미리보기에 필요한 기본값만 채워서 보여줍니다.',
    steps: [
      { actor: 'withPreviewFallback(state)', description: '창 크기 같은 미리보기용 기본값을 채운 새 객체를 돌려줍니다. 입력한 값은 변경하지 않습니다.' },
      { actor: 'InlinePopupPreview', description: '화면 옆에 미리보기를 보여 줍니다. onOpenPreview를 주면 "실제 크기로 보기" 버튼이 생깁니다.' },
      { actor: 'PopupPreviewDialog', description: '실제 크기로 띄워 봅니다. 닫으면 미리보기 안에서 고른 답은 지워집니다.' },
      { actor: 'PopupPreview', description: 'WPF 팝업과 같은 모양으로 그립니다.' },
    ],
    parent: ['실제 크기 미리보기 열림 상태 관리하기'],
    notes: ['미리보기에 표시되는 기본값은 실제 저장값과 다를 수 있습니다.'],
  },
  {
    id: 'extract', scope: 'COMMON', title: '⑥ 필요한 항목만 가져와 저장', summary: '저장할 항목만 골라서 저장 API로 보냅니다.',
    steps: [
      { actor: 'pickPopupFields(source, { topLevelKeys?, contentKeys?, questionKeys? })', description: '고른 항목의 값만 가져옵니다. 값은 바꾸지 않습니다.' },
      { actor: '저장 API 형식으로 바꾸기', description: '날짜 형식·항목 이름 등을 저장할 때 사용하는 API 형식에 맞게 바꿉니다.' },
      { actor: '서버', description: '입력하지 않은 항목의 기본값과 최종 적용 여부는 서버에서 결정합니다.' },
    ],
    parent: ['저장 API 형식으로 바꿔 호출하기', '저장 실패 안내하기'],
    notes: ["'다른 화면에서 사용하기' 탭에서 예제 4가지와 실행기를 볼 수 있습니다."],
  },
  // ── 기존 팝업 등록(RgstPop): 기존 팝업 등록 화면에서 사용하는 방식 ──
  {
    id: 'proto-create', scope: 'PROTO', title: 'P1 새 팝업 만들기', summary: '기존 팝업 등록 화면은 기본값이 모두 채워진 값으로 시작합니다.',
    steps: [
      { actor: 'createDefaultPopup(now?)', description: '창 크기 560×420, 게시 기간 한 달 등 기본값이 채워진 팝업 값을 만듭니다.' },
      { actor: '등록 화면 state', description: '만든 값을 state에 담고 편집기 key를 새로 만듭니다.' },
      { actor: 'InlinePopupPreview', description: '값이 모두 채워져 있어 그대로 미리보기에 넘깁니다.' },
    ],
    parent: ['팝업 ID 정하기', '활성 여부·대상 그룹 처음 값 정하기'],
  },
  {
    id: 'proto-load', scope: 'PROTO', title: 'P2 불러와서 수정하기', summary: '서버에서 받은 팝업을 편집할 수 있는 값으로 바꿉니다.',
    steps: [
      { actor: 'api.popupAdmin.info({ popupId })', description: '등록 화면이 팝업을 조회합니다.' },
      { actor: 'toEditorPopup(body.popup)', description: '편집에 필요한 값을 정리합니다(표시 순서·정답 비교 방식 등).' },
      { actor: 'usePopupQuizRule(popup, resetKey)', description: '퀴즈면 저장된 통과 점수로 퀴즈 유형을 다시 보여 줍니다.' },
    ],
    parent: ['대상 그룹·활성 여부 따로 보관하기', '편집기 key 바꾸기'],
  },
  {
    id: 'proto-template', scope: 'PROTO', title: 'P3 템플릿 불러오기', summary: '다른 팝업 설정을 현재 팝업으로 복사합니다.',
    steps: [
      { actor: 'toEditorPopupFromTemplate(template, currentPopupId)', description: '현재 팝업 ID는 그대로 두고 설정만 복사합니다.' },
    ],
    parent: ['템플릿 목록 보여 주기', '편집기 key 바꾸기'],
  },
  {
    id: 'proto-type', scope: 'PROTO', title: 'P4 유형 바꾸기', summary: '입력값은 두고 유형에 필요한 기본값을 채웁니다.',
    steps: [
      { actor: 'changePopupType(previous, selection)', description: "유형을 바꾸면서 창 크기·완료 비율 같은 기본값을 채웁니다. 'VIDEO_QUIZ'는 퀴즈 + 동영상입니다." },
    ],
    parent: ['유형 선택 화면'],
  },
  {
    id: 'proto-save', scope: 'PROTO', title: 'P5 저장하기', summary: '기존 팝업 등록 화면의 저장 API 형식으로 바꿔 저장합니다.',
    steps: [
      { actor: 'validate* 함수', description: '문항·일정·퀴즈 입력 오류를 확인합니다.' },
      { actor: 'toSaveRequest(popup, active, targetGroups)', description: '유형에 맞는 항목만 남기고, 날짜·URL을 저장 형식으로 바꿉니다.' },
      { actor: 'api.popupAdmin.save(request)', description: '등록 화면이 저장 API를 호출합니다.' },
    ],
    parent: ['저장 API 호출과 결과 안내하기'],
    notes: ['다른 화면은 ⑥ 방식으로 저장합니다.'],
  },
];

const PREVIEW_EXAMPLE = `// 입력한 값만 담습니다. 처음에는 화면에서 정한 popupType 하나면 됩니다.
const [state, setState] = useState<Partial<AdminPopupDetail>>({ popupType: 'TEXT' });
const [open, setOpen] = useState(false);
const [size, setSize] = useState<Size | null>(null);
const preview = withPreviewFallback(state); // 미리보기용 기본값만 채웁니다(state는 그대로)

<InlinePopupPreview popup={preview} onOpenPreview={() => setOpen(true)} onRecommendedSize={setSize} />
<PopupPreviewDialog popup={preview} open={open} onClose={() => setOpen(false)} recommendedSize={size} />`;

export const COMPONENTS: GuideComponent[] = [
  {
    name: 'PopupRichTextEditor', file: 'PopupRichTextEditor.tsx',
    summary: '서식이 있는 글을 입력하는 편집기입니다. 본문·제목·설명·문항·선택지에 씁니다.',
    props: [
      { name: 'label', type: 'string', required: true, description: '입력칸 위 제목' },
      { name: 'initialBlocks', type: 'RichBlock[]', required: true, description: '처음 보여 줄 본문. 처음 한 번만 읽습니다. 바꾸려면 key를 바꿉니다.' },
      { name: 'disabled', type: 'boolean', description: '읽기 전용으로 보여 줍니다.' },
      { name: 'compact', type: 'boolean', description: '툴바를 숨긴 짧은 입력칸입니다. 서식은 우클릭으로 엽니다.' },
      { name: 'placeholder', type: 'string', description: '비어 있을 때 안내 문구' },
    ],
    outputs: [{ name: 'onChange', type: '(blocks: RichBlock[], plainText: string) => void', required: true, description: '입력할 때마다 서식 본문과 일반 글자를 돌려줍니다.' }],
    values: ['TEXT: content.textBlocks + content.plainText', '설문·퀴즈: content.surveyTitleBlocks·descriptionBlocks', '문항: question.titleBlocks·descriptionBlocks, 선택지: option.textBlocks'],
    reuse: ['HTML은 저장하지 않습니다. onChange로 받은 두 값을 함께 저장합니다.', '편집기를 여러 개 두어도 서로 영향을 주지 않습니다.', 'ckeditor5를 직접 import하지 말고 이 컴포넌트를 쓰세요.'],
    example: `const [body, setBody] = useState<{ textBlocks: RichBlock[]; plainText: string }>({ textBlocks: [], plainText: '' });
<PopupRichTextEditor key={editorKey} label="본문" initialBlocks={body.textBlocks}
  onChange={(textBlocks, plainText) => setBody({ textBlocks, plainText })} />`,
    processes: ['richtext'],
  },
  {
    name: 'PopupRichTextMenu', file: 'PopupRichTextMenu.tsx',
    summary: '우클릭하면 열리는 서식 패널입니다. PopupRichTextEditor 안에서 씁니다.',
    props: [
      { name: 'position', type: 'PopoverPosition | null', required: true, description: '패널을 열 위치. null이면 닫힙니다.' },
      { name: 'state', type: 'FormatState | null', required: true, description: '선택한 글자의 현재 서식' },
    ],
    outputs: [
      { name: 'onApply', type: '(action: FormatAction) => void', required: true, description: '서식을 고르면 호출됩니다(패널은 열린 채로 둡니다).' },
      { name: 'onClose', type: '() => void', required: true, description: 'Esc나 바깥을 누르면 호출됩니다.' },
    ],
    values: ['readFormatState(editor) → FormatState', 'applyFormat(editor, action)'],
    reuse: ['보통은 직접 쓰지 않고 PopupRichTextEditor를 씁니다.'],
    example: `<PopupRichTextMenu position={pos} state={readFormatState(editor)} onApply={(a) => applyFormat(editor, a)} onClose={close} />`,
    processes: ['richtext'],
  },
  {
    name: 'PopupRichBlocks', file: 'PopupRichBlocks.tsx',
    summary: '저장된 서식 본문(RichBlock[])을 화면에 그립니다.',
    props: [
      { name: 'blocks', type: 'RichBlock[]', required: true, description: '그릴 본문' },
      { name: 'trailing', type: 'ReactNode', description: '마지막 줄 끝에 붙일 요소(필수 표시 * 등)' },
      { name: 'id', type: 'string', description: '바깥 요소 id' },
    ],
    outputs: [{ name: '화면', type: 'span', description: '정렬·들여쓰기·글자 서식이 적용된 본문' }],
    values: ['richBlocksOrNull(value): 글자가 있으면 RichBlock[], 없으면 null'],
    reuse: ['HTML을 직접 넣지 않아 서버 값을 그대로 넘겨도 안전합니다.'],
    example: `const blocks = richBlocksOrNull(question.titleBlocks);
{blocks ? <PopupRichBlocks blocks={blocks} trailing={<b>*</b>} /> : question.title}`,
    processes: ['richtext', 'preview'],
  },
  {
    name: 'PopupQuestionEditor', file: 'PopupQuestionEditor.tsx',
    summary: '설문·퀴즈 문항을 입력합니다. 문항 제목·유형·선택지·정답·선택 개수를 다룹니다.',
    props: [
      { name: 'questions', type: 'PopupQuestion[]', required: true, description: '문항 목록' },
      { name: 'quiz', type: 'boolean', required: true, description: 'true면 퀴즈입니다(정답·배점·통과 점수 표시).' },
      { name: 'passingScore', type: 'number | null', description: '퀴즈 통과 점수' },
      { name: 'fixedQuestionScore', type: 'number', description: '배점을 고정합니다. 주면 배점 입력칸을 숨깁니다.' },
      { name: 'hidePassingScore', type: 'boolean', description: '통과 점수 입력칸을 숨깁니다.' },
    ],
    outputs: [
      { name: 'onChange', type: '(questions: PopupQuestion[]) => void', required: true, description: '바뀐 문항 목록 전체' },
      { name: 'onPassingScoreChange', type: '(score: number | null) => void', required: true, description: '통과 점수 입력' },
    ],
    values: ['questions(PopupQuestion[])', 'passingScore(퀴즈)', '설문 복수 선택의 minSelections·maxSelections(비우면 제한 없음)'],
    reuse: ['저장 전에 validatePopupQuestions(questions, quiz, passingScore)로 입력 오류를 확인합니다.', '새 문항 ID는 음수 임시 값입니다. 저장하면 서버가 번호를 줍니다.'],
    example: `const [questions, setQuestions] = useState<PopupQuestion[]>([]);
const [passingScore, setPassingScore] = useState<number | null>(null);
<PopupQuestionEditor questions={questions} quiz passingScore={passingScore}
  onChange={setQuestions} onPassingScoreChange={setPassingScore} />`,
    processes: ['question'],
  },
  {
    name: 'PopupQuizRuleFields', file: 'PopupQuizRuleFields.tsx',
    summary: '퀴즈 유형(만점 통과·커트라인 통과·통과/실패 제출)과 기준 개수를 입력합니다.',
    props: [
      { name: 'questionCount', type: 'number', required: true, description: '문항 수' },
      { name: 'rule', type: "QuizRule('' | 'FULL' | 'CUTOFF' | 'PASS_FAIL')", required: true, description: '고른 퀴즈 유형' },
      { name: 'count', type: 'number', required: true, description: '통과 기준 개수' },
      { name: 'passingScore', type: 'number | null', description: '계산된 통과 점수(안내용)' },
      { name: 'className / titlePrefix', type: 'string / ReactNode', description: '퍼블리싱 클래스·제목 앞 표시' },
    ],
    outputs: [
      { name: 'onRuleChange', type: '(rule: QuizRule) => void', required: true, description: '유형을 고르면 호출됩니다.' },
      { name: 'onCountChange', type: '(count: number) => void', required: true, description: '개수를 입력하면 호출됩니다.' },
    ],
    values: ['usePopupQuizRule(target, resetKey) → { rule, count, setRule, setCount, effective, error }', '저장할 통과 점수는 effective.passingScore입니다.'],
    reuse: ['입력칸만 그립니다. 점수 계산은 usePopupQuizRule이 합니다.'],
    example: `const quizRule = usePopupQuizRule(popup, resetKey);
<PopupQuizRuleFields questionCount={popup.questions.length} rule={quizRule.rule} count={quizRule.count}
  passingScore={quizRule.effective?.passingScore} onRuleChange={quizRule.setRule} onCountChange={quizRule.setCount} />`,
    processes: ['question'],
  },
  {
    name: 'PopupScheduleFields', file: 'PopupScheduleFields.tsx',
    summary: '게시 기간과 노출 요일·시간대를 입력합니다.',
    props: [
      { name: 'value', type: 'PopupScheduleValue { periodMode, repeatDayOfWeek?, displayTimes?, displayStartAt?, displayEndAt? }', description: '현재 일정 값. 팝업 값 전체가 없어도 됩니다.' },
      { name: 'popup', type: 'PopupScheduleValue', description: '예전 이름입니다. 새 코드는 value를 쓰세요.' },
      { name: 'showPeriod', type: 'boolean', description: '게시 기간(시작·종료) 입력칸도 보여 줍니다.' },
    ],
    outputs: [{ name: 'onChange', type: '(patch: Partial<PopupScheduleValue>) => void', required: true, description: '바뀐 항목만 돌려줍니다. 게시 기간은 입력칸 글자 그대로입니다.' }],
    values: ['periodMode: FIXED(항상) / SCHEDULE(요일·시간 지정)', 'repeatDayOfWeek: 요일 번호(1=월, 쉼표로 구분)', 'displayTimes: [{ startTime, endTime }]', 'displayStartAt·displayEndAt: showPeriod일 때 게시 기간'],
    reuse: ['저장 전에 validatePopupSchedule(value)로 오류를 확인합니다. 요약 문구는 describeSchedule로 만듭니다.'],
    example: `const [schedule, setSchedule] = useState<PopupScheduleValue>({ periodMode: 'FIXED' });
<PopupScheduleFields value={schedule} showPeriod onChange={(patch) => setSchedule((p) => ({ ...p, ...patch }))} />`,
    processes: ['schedule'],
  },
  {
    name: 'InlinePopupPreview', file: 'InlinePopupPreview.tsx',
    summary: '화면 옆에 놓는 미리보기입니다. "실제 크기로 보기" 버튼을 붙일 수 있습니다.',
    props: [
      { name: 'popup', type: 'AdminPopupDetail', required: true, description: '미리 볼 값. withPreviewFallback(state)로 만들어 넘깁니다.' },
      { name: 'title', type: 'string', description: "제목. 기본값 '팝업 미리보기'" },
    ],
    outputs: [
      { name: 'onOpenPreview', type: '() => void', description: '주면 "실제 크기로 보기" 버튼이 생깁니다.' },
      { name: 'onRecommendedSize', type: '(size: Size | null) => void', description: '이미지 팝업에 맞는 창 크기를 알려 줍니다.' },
    ],
    values: ['popup 전체(값을 바꾸지 않음)'],
    reuse: ['API를 호출하지 않습니다.', 'state에 기본값을 넣지 말고, 넘길 때만 withPreviewFallback을 쓰세요.'],
    example: PREVIEW_EXAMPLE,
    processes: ['preview'],
  },
  {
    name: 'PopupPreviewDialog', file: 'PopupPreviewDialog.tsx',
    summary: '실제 크기로 띄워 보는 미리보기 창입니다. 위치·배경 어둡게 처리도 WPF와 같습니다.',
    props: [
      { name: 'popup', type: 'AdminPopupDetail', required: true, description: '미리 볼 값. withPreviewFallback(state)로 만들어 넘깁니다.' },
      { name: 'open', type: 'boolean', required: true, description: '열림 여부' },
      { name: 'recommendedSize', type: 'Size | null', description: '옆 미리보기가 알려 준 이미지 창 크기' },
    ],
    outputs: [{ name: 'onClose', type: '() => void', required: true, description: '닫기 버튼·Esc를 누르면 호출됩니다.' }],
    values: ['popup 전체(값을 바꾸지 않음)'],
    reuse: ['미리보기 안에서 고른 답·시청 비율은 닫으면 지워집니다.'],
    example: PREVIEW_EXAMPLE,
    processes: ['preview'],
  },
  {
    name: 'PopupPreview', file: 'PopupPreview.tsx',
    summary: 'WPF 팝업과 같은 모양(헤더·본문·하단 버튼)으로 그리는 기본 미리보기입니다.',
    props: [
      { name: 'popup', type: 'AdminPopupDetail', required: true, description: '미리 볼 값. withPreviewFallback(state)로 만들어 넘깁니다.' },
      { name: 'showBackground', type: 'boolean', description: '바깥 배경까지 그릴지. 기본값 true' },
    ],
    outputs: [
      { name: 'onClose', type: '() => void', description: '하단 버튼으로 닫을 때 호출됩니다.' },
      { name: 'onRecommendedSize', type: '(size: Size | null) => void', description: '이미지 팝업에 맞는 창 크기를 알려 줍니다(값이 바뀔 때만).' },
    ],
    values: ['헤더: 검은 배경·흰 제목·고정 로고', "하단 버튼: CLOSE '확인', LINK_AND_CLOSE '바로가기', 설문·퀴즈 '제출'"],
    reuse: ['보통은 InlinePopupPreview나 PopupPreviewDialog를 씁니다. 다른 배치가 필요할 때만 직접 씁니다.'],
    example: `<PopupPreview popup={withPreviewFallback(state)} showBackground={false} />`,
    processes: ['preview'],
  },
];

export const FUNCTIONS: GuideFunction[] = [
  // 공통 사용
  { name: 'pickPopupFields', scope: 'COMMON', file: 'popupEditorTransform.ts', input: 'popup, { topLevelKeys?, contentKeys?, questionKeys? }', output: '{ ...고른 항목, content?, questions? }', description: '고른 항목의 값만 가져옵니다. 값은 바꾸지 않고, 입력하지 않은 항목은 결과에 없습니다.' },
  { name: 'withPreviewFallback', scope: 'COMMON', file: 'popupPreviewFallback.ts', input: 'state: Partial<AdminPopupDetail>', output: 'AdminPopupDetail(미리보기용)', description: '미리보기에 필요한 기본값만 채워서 돌려줍니다. 입력한 값은 변경하지 않습니다. 저장에는 쓰지 않습니다.' },
  { name: 'contentValue', scope: 'COMMON', file: 'popupEditorTransform.ts', input: 'popup, key', output: 'string', description: 'content 값을 입력칸에 넣을 글자로 바꿉니다(없으면 "").' },
  { name: 'toDateTimeLocal', scope: 'COMMON', file: 'popupEditorTransform.ts', input: 'value: PopupDateValue', output: 'string', description: '서버 날짜를 날짜·시간 입력칸 형식으로 바꿉니다.' },
  { name: 'describeSchedule / parseWeekdays', scope: 'COMMON', file: 'popupEditorTransform.ts', input: 'periodMode, repeatDayOfWeek, displayTimes', output: 'string / number[]', description: '노출 일정 요약 문구를 만들고, 요일 번호를 읽습니다.' },
  { name: 'htmlToBlocks / blocksToHtml', scope: 'COMMON', file: 'popupRichText.ts', input: 'html / RichBlock[]', output: 'RichBlock[] / html', description: '편집기 HTML과 저장용 서식 본문을 서로 바꿉니다.' },
  { name: 'blocksToPlainText / plainTextToBlocks', scope: 'COMMON', file: 'popupRichText.ts', input: 'RichBlock[] / string', output: 'string / RichBlock[]', description: '서식 본문과 일반 글자를 서로 바꿉니다.' },
  { name: 'readTextBlocks', scope: 'COMMON', file: 'popupRichText.ts', input: 'value: unknown', output: 'RichBlock[] | null', description: '서버 값을 서식 본문으로 읽습니다. 형식이 맞지 않으면 null입니다.' },
  { name: 'readQuizRule / withQuizRule / validateQuizRule', scope: 'COMMON', file: 'popupQuizRule.ts', input: '{ popupType, questions, passingScore? }, rule, count', output: '{ rule, count } / 같은 타입 / string | null', description: '퀴즈 유형으로 통과 점수를 계산하고 입력 오류를 확인합니다.' },
  { name: 'validatePopupQuestions', scope: 'COMMON', file: 'PopupQuestionEditor.tsx', input: 'questions, quiz, passingScore?', output: 'string | null', description: '문항 입력 오류를 확인합니다.' },
  { name: 'validatePopupSchedule', scope: 'COMMON', file: 'PopupScheduleFields.tsx', input: 'value: PopupScheduleValue', output: 'string | null', description: '노출 시간대 입력 오류를 확인합니다.' },
  { name: 'popupFontSize / popupMinimumSize', scope: 'COMMON', file: 'popupCommon.ts', input: 'popup, key', output: 'number | null / { width, height }', description: '글자 크기(10~40)와 최소 창 크기(300)를 읽습니다.' },
  // 기존 팝업 등록(RgstPop)
  { name: 'createDefaultPopup', scope: 'PROTO', file: 'popupEditorTransform.ts', input: 'now?: Date', output: 'AdminPopupDetail', description: '기본값이 모두 채워진 새 팝업 값을 만듭니다. 다른 화면의 state에는 쓰지 않습니다.' },
  { name: 'toEditorPopup', scope: 'PROTO', file: 'popupEditorTransform.ts', input: 'loaded: AdminPopupDetail', output: 'AdminPopupDetail', description: '서버에서 받은 팝업을 편집할 값으로 바꿉니다.' },
  { name: 'toEditorPopupFromTemplate', scope: 'PROTO', file: 'popupEditorTransform.ts', input: 'template, currentPopupId', output: 'AdminPopupDetail', description: '템플릿 설정을 현재 팝업으로 복사합니다.' },
  { name: 'changePopupType', scope: 'PROTO', file: 'popupEditorTransform.ts', input: "previous, selection(PopupType | 'VIDEO_QUIZ')", output: 'AdminPopupDetail', description: '유형을 바꾸면서 필요한 기본값을 채웁니다.' },
  { name: 'toSaveRequestPopup', scope: 'PROTO', file: 'popupEditorTransform.ts', input: 'popup: AdminPopupDetail', output: 'AdminPopupDetail', description: '저장할 팝업 값을 만듭니다(유형에 맞는 항목만, 날짜·URL 형식 정리).' },
  { name: 'toSaveRequest', scope: 'PROTO', file: 'popupEditorTransform.ts', input: 'popup, active, targetGroups', output: 'PopupSaveRequest', description: '기존 팝업 등록 화면의 저장 API 요청을 만듭니다.' },
  { name: 'COMMON_CONTENT_KEYS / CONTENT_KEYS_BY_TYPE', scope: 'PROTO', file: 'popupEditorTransform.ts', input: '(상수)', output: 'string[] / Record<유형, string[]>', description: '기존 팝업 등록 화면이 저장할 때 남기는 content 항목 목록입니다.' },
];
