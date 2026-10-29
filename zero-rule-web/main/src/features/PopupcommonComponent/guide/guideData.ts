/*
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 화면의 설명 데이터
 * - 화면(PopupCommonGuide.tsx)과 분리해 컴포넌트·함수·프로세스 설명만 둔다. 코드가 바뀌면 이 파일을 함께 고친다.
 * - 이름·props·반환값은 실제 소스(../index.ts가 내보내는 것)와 같아야 한다. 새 컴포넌트를 index.ts에 추가하면 COMPONENTS에도 추가한다.
 * - 공지(추가 예정·변경·삭제)는 guideNotices.ts에 따로 둔다.
 */

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
  title: string;
  summary: string;
  steps: GuideStep[];
  /** 부모(등록 화면)가 맡는 일 */
  parent: string[];
  notes?: string[];
}

export const PROCESSES: GuideProcess[] = [
  {
    id: 'create', title: '① 신규 등록', summary: '빈 편집값을 만들어 편집기·미리보기를 연다.',
    steps: [
      { actor: 'createDefaultPopup(now?)', description: 'TEXT 유형, 창 560×420, 최소 300×300, 노출 기간 지금부터 한 달인 편집값을 만든다.' },
      { actor: '부모 state', description: '편집값을 useState로 보관하고 에디터 key(bodyEditorKey 등)를 새로 만든다.' },
      { actor: 'InlinePopupPreview', description: '편집값을 그대로 넘겨 우측 미리보기를 그린다.' },
    ],
    parent: ['popupId 채번·입력 규칙', '활성 여부·대상 그룹 초기값', '에디터 key 갱신(새 편집값을 넣을 때마다)'],
  },
  {
    id: 'load', title: '② 조회 → 수정', summary: '서버 응답을 편집값으로 바꿔 연다.',
    steps: [
      { actor: 'api.popupAdmin.info({ popupId })', description: '부모가 조회한다(이 폴더는 API를 부르지 않는다).' },
      { actor: 'toEditorPopup(body.popup)', description: '표시 순서 기본값 100, 주관식 정답 비교 방식 EXACT, IMAGE 크기 모드·구 크기 필드를 정리한다.' },
      { actor: 'usePopupQuizRule(popup, resetKey)', description: 'QUIZ면 저장된 통과 점수에서 퀴즈 유형(만점·커트라인·통과/실패)을 다시 읽는다.' },
    ],
    parent: ['targetGroups·active는 응답에서 따로 보관', 'resetKey·에디터 key 갱신'],
  },
  {
    id: 'template', title: '③ 템플릿 불러오기', summary: '다른 팝업 설정을 현재 ID로 복사한다.',
    steps: [
      { actor: 'toEditorPopupFromTemplate(template, currentPopupId)', description: '현재 팝업 ID를 유지하고 문항 템플릿 연결(questionTemplateId)을 끊는다.' },
    ],
    parent: ['템플릿 목록 조회·선택 대화상자', '에디터 key 갱신'],
  },
  {
    id: 'type', title: '④ 유형 변경', summary: '입력값은 유지하고 유형별 필수 값만 맞춘다.',
    steps: [
      { actor: 'changePopupType(previous, selection)', description: "selection은 PopupType 또는 'VIDEO_QUIZ'(QUIZ + content.videoEnabled=true). 창 크기 기본값, 완료 비율(영상+퀴즈 0.8, 영상 없음 null), 정답 비교 방식을 맞춘다." },
    ],
    parent: ['유형 선택 UI'],
    notes: ['편집 중에는 다른 유형의 content 키도 남는다. 저장 시 toSaveRequestPopup이 유형별 키만 남긴다.'],
  },
  {
    id: 'richtext', title: '⑤ 서식 본문 편집', summary: 'CKEditor로 편집하고 문단·Run JSON과 일반 문자열을 함께 받는다.',
    steps: [
      { actor: 'readTextBlocks(content.textBlocks) ?? plainTextToBlocks(plainText)', description: '편집기 초기값. 서식이 없으면 일반 문자열을 서식 없는 문단으로.' },
      { actor: 'PopupRichTextEditor', description: 'initialBlocks로 처음 한 번만 읽고, 편집할 때마다 onChange(blocks, plainText)를 부른다. 우클릭·Shift+F10·서식 버튼으로 서식 패널(PopupRichTextMenu)을 연다.' },
      { actor: 'htmlToBlocks / blocksToPlainText', description: '편집기 HTML → 허용 서식만 남긴 RichBlock[] → 일반 문자열. 허용 밖 서식은 버리고 글자는 보존.' },
      { actor: 'PopupRichBlocks', description: '미리보기에서 RichBlock[]을 React 요소로 그린다(innerHTML 미사용).' },
    ],
    parent: ['onChange 결과를 content.textBlocks·content.plainText에 함께 저장', '본문을 바꾸려면 key로 다시 마운트'],
    notes: ['허용 값: 굵게·기울임·밑줄·취소선, 색(RICH_COLORS 40색), 크기(RICH_SIZES), 글꼴(RICH_FONTS 4종), 정렬 3종, 들여쓰기 40px 단계.'],
  },
  {
    id: 'question', title: '⑥ 설문·퀴즈 문항', summary: '문항·선택지·정답·통과 점수를 편집하고 저장 전 검사한다.',
    steps: [
      { actor: 'PopupQuestionEditor', description: '문항 추가·삭제·서식 제목/설명·유형·배점·선택지·정답·최소/최대 선택 수. 바뀔 때마다 전체 목록을 onChange로 돌려준다.' },
      { actor: 'PopupQuizRuleFields + usePopupQuizRule', description: '퀴즈 유형(FULL·CUTOFF·PASS_FAIL)과 기준 개수를 고르면 withQuizRule이 통과 점수를 계산한다.' },
      { actor: 'validatePopupQuestions(questions, quiz, passingScore)', description: '저장 전 확인. 오류 문구 또는 null.' },
    ],
    parent: ['문항 state 보관', '검사 실패 시 저장 중단·안내'],
  },
  {
    id: 'schedule', title: '⑦ 노출 일정', summary: '게시 기간 안의 요일·시간대를 입력한다.',
    steps: [
      { actor: 'PopupScheduleFields', description: "스위치 끔 = FIXED(상시), 켬 = SCHEDULE. 요일 없음 = 매일, 시간대 없음 = 하루 종일. onChange(patch)로 바뀐 항목만 돌려준다." },
      { actor: 'validatePopupSchedule / describeSchedule', description: '저장 전 검사와 일정 요약 문구.' },
    ],
    parent: ['patch를 편집값에 병합'],
    notes: ['노출 판단은 서버(KST)가 한다. 조회 주기(30~60분) 때문에 짧은 시간대는 놓칠 수 있다.'],
  },
  {
    id: 'preview', title: '⑧ 미리보기', summary: '등록 화면 우측 미리보기와 실제 크기 모달.',
    steps: [
      { actor: 'InlinePopupPreview', description: '우측 미리보기. onOpenPreview가 있으면 "실제 크기로 보기" 버튼을 보여 준다. IMAGE 권장 창 크기는 onRecommendedSize로 알린다.' },
      { actor: 'PopupPreviewDialog', description: '브라우저 창을 작업 영역으로 보고 크기 모드·9개 위치·배경 Overlay를 WPF와 같이 적용한다. 닫으면 시연 상태 초기화.' },
      { actor: 'PopupPreview', description: '공용 렌더러. 헤더(검은 배경·흰 제목·고정 로고)·본문·푸터(확인/바로가기/제출, 나중에 보기, 다시 보지 않기)를 WPF 구성대로 그린다.' },
    ],
    parent: ['모달 열림 state', 'recommendedSize 전달(선택)'],
  },
  {
    id: 'save', title: '⑨ 저장', summary: '검사 후 저장 요청 body를 만들어 API로 보낸다.',
    steps: [
      { actor: 'validate* 함수', description: '문항·일정·퀴즈 규칙 검사. 필수값·범위 검사는 부모가 한다.' },
      { actor: 'toSaveRequest(popup, active, targetGroups)', description: 'ID·제목 공백 제거, 유형별 content 키만 남김, URL 정규화(https:// 보정), Footer 정규형(CLOSE는 저장 안 함), 날짜 ISO, IMAGE는 popup.width/height만.' },
      { actor: 'api.popupAdmin.save(request)', description: '부모가 호출한다. 성공 시 목록 갱신.' },
    ],
    parent: ['API 호출·오류 toast·목록 갱신'],
    notes: ['다른 테이블 API로 나눠 보내야 하면 ⑩을 따른다.'],
  },
  {
    id: 'saveParts', title: '⑩ 독립 재사용·필드 추출', summary: '공통 컴포넌트를 필요한 값만으로 붙이고, 필요한 필드만 뽑아 각 화면의 저장 형식으로 보낸다.',
    steps: [
      { actor: 'PopupScheduleFields(value) · PopupRichTextEditor · PopupQuestionEditor', description: 'AdminPopupDetail 전체 없이 화면 state(일정 값·RichBlock[]·문항)만으로 단독 사용한다.' },
      { actor: 'pickPopupFields(source, { topLevelKeys?, contentKeys?, questionKeys? })', description: '필요한 키만 값 그대로 뽑는다(변환·검증·기본값 없음, 얕은 복사).' },
      { actor: '화면별 저장 경계', description: '날짜 직렬화·키 이름·JSON 모양은 각 업무 화면이 정한다. proto 저장 기준이 필요할 때만 toSaveRequestPopup 결과를 넘긴다.' },
    ],
    parent: ['state 보관·저장 형식 변환·API 호출', '미리보기에는 createDefaultPopup() 위에 state를 얹어 전달'],
    notes: ["'독립 재사용·필드 추출' 탭에 최소 입력·출력 표·키 표·샘플 4종·실행기가 있다. TODO: docs/design/20261030_PopupcommonComponent_독립재사용_선택필드추출_TODO.md"],
  },
];

const PREVIEW_EXAMPLE = `const [popup, setPopup] = useState(createDefaultPopup);
const [open, setOpen] = useState(false);
const [size, setSize] = useState<Size | null>(null);

<InlinePopupPreview popup={popup} onOpenPreview={() => setOpen(true)} onRecommendedSize={setSize} />
<PopupPreviewDialog popup={popup} open={open} onClose={() => setOpen(false)} recommendedSize={size} />`;

export const COMPONENTS: GuideComponent[] = [
  {
    name: 'PopupRichTextEditor', file: 'PopupRichTextEditor.tsx',
    summary: '서식 본문 편집기(CKEditor 49 DecoupledEditor). 본문·콘텐츠 제목·설명·문항·선택지에 쓴다.',
    props: [
      { name: 'label', type: 'string', required: true, description: '입력 위 제목' },
      { name: 'initialBlocks', type: 'RichBlock[]', required: true, description: '처음 마운트할 때만 읽는 본문. 바꾸려면 key로 다시 마운트한다.' },
      { name: 'disabled', type: 'boolean', description: '읽기 전용(흐리게 표시, 서식 패널 닫힘)' },
      { name: 'compact', type: 'boolean', description: '툴바를 숨긴 짧은 입력(문항·선택지). 서식은 우클릭·서식 버튼으로.' },
      { name: 'placeholder', type: 'string', description: '빈 편집기 안내 문구' },
    ],
    outputs: [{ name: 'onChange', type: '(blocks: RichBlock[], plainText: string) => void', required: true, description: '편집할 때마다 서식 본문과 서식 없는 문자열' }],
    values: ['content.textBlocks + content.plainText (TEXT)', 'content.surveyTitleBlocks·descriptionBlocks (SURVEY·QUIZ)', 'question.titleBlocks·descriptionBlocks, option.textBlocks'],
    reuse: ['HTML은 저장하지 않는다. onChange 결과(blocks, plainText)를 함께 저장한다.', '여러 개를 나란히 써도 편집기마다 선택 범위·패널 상태가 따로다.', '엔진·플러그인은 @/components/ckeditor 공통 엔진에서 온다(직접 ckeditor5를 import하지 않는다).'],
    example: `<PopupRichTextEditor key={editorKey} label="본문"
  initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentValue(popup, 'plainText'))}
  onChange={(blocks, plainText) => setPopup((p) => ({ ...p, content: { ...p.content, textBlocks: blocks, plainText } }))} />`,
    processes: ['richtext'],
  },
  {
    name: 'PopupRichTextMenu', file: 'PopupRichTextMenu.tsx',
    summary: '우클릭·서식 버튼으로 여는 펼침 서식 패널(색 8×5·글꼴·크기·B/I/U/S·정렬·들여쓰기). PopupRichTextEditor 안에서 쓴다.',
    props: [
      { name: 'position', type: 'PopoverPosition | null', required: true, description: '열 위치. null이면 닫힘' },
      { name: 'state', type: 'FormatState | null', required: true, description: '열 때 읽은 선택 범위 서식(혼합 여부 포함)' },
    ],
    outputs: [
      { name: 'onApply', type: '(action: FormatAction) => void', required: true, description: '서식 적용 요청(패널은 유지)' },
      { name: 'onClose', type: '() => void', required: true, description: 'Esc·바깥 클릭' },
    ],
    values: ['readFormatState(editor) → FormatState', 'applyFormat(editor, action)'],
    reuse: ['보통 직접 쓰지 않고 PopupRichTextEditor를 쓴다. 다른 CKEditor 화면에 붙일 때는 readFormatState·applyFormat과 함께 쓴다.'],
    example: `<PopupRichTextMenu position={pos} state={readFormatState(editor)} onApply={(a) => applyFormat(editor, a)} onClose={close} />`,
    processes: ['richtext'],
  },
  {
    name: 'PopupRichBlocks', file: 'PopupRichBlocks.tsx',
    summary: '서식 문단(RichBlock[])을 React 요소로 그리는 표시 컴포넌트. 미리보기·문항 제목에 쓴다.',
    props: [
      { name: 'blocks', type: 'RichBlock[]', required: true, description: '표시할 문단' },
      { name: 'trailing', type: 'ReactNode', description: '마지막 문단 끝에 붙일 요소(필수 표시 * 등)' },
      { name: 'id', type: 'string', description: '바깥 요소 id(aria-labelledby 연결)' },
    ],
    outputs: [{ name: '화면', type: 'span', description: '문단 정렬·들여쓰기(40px 단계)·글자 서식' }],
    values: ['richBlocksOrNull(value): 글자가 있는 서식만 RichBlock[], 없으면 null'],
    reuse: ['innerHTML을 쓰지 않으므로 서버 값을 그대로 넣어도 안전하다.', '지정 없는 글꼴·크기·색은 바깥 값을 이어받는다.'],
    example: `const blocks = richBlocksOrNull(question.titleBlocks);
{blocks ? <PopupRichBlocks blocks={blocks} trailing={<b>*</b>} /> : question.title}`,
    processes: ['richtext', 'preview'],
  },
  {
    name: 'PopupQuestionEditor', file: 'PopupQuestionEditor.tsx',
    summary: '설문·퀴즈 문항 편집기. 문항별 서식 제목/설명·유형·배점·선택지·정답·최소/최대 선택 수.',
    props: [
      { name: 'questions', type: 'PopupQuestion[]', required: true, description: '편집할 문항 목록' },
      { name: 'quiz', type: 'boolean', required: true, description: 'true면 퀴즈(정답·배점·통과 점수 표시)' },
      { name: 'passingScore', type: 'number | null', description: '퀴즈 통과 점수' },
      { name: 'fixedQuestionScore', type: 'number', description: '배점 고정(예: 1). 지정하면 문항별 배점 입력을 숨긴다.' },
      { name: 'hidePassingScore', type: 'boolean', description: '통과 점수 입력 숨김(퀴즈 유형 입력을 따로 쓸 때)' },
    ],
    outputs: [
      { name: 'onChange', type: '(questions: PopupQuestion[]) => void', required: true, description: '바뀐 문항 전체' },
      { name: 'onPassingScoreChange', type: '(score: number | null) => void', required: true, description: '통과 점수 입력' },
    ],
    values: ['popup.questions', 'popup.passingScore', 'SURVEY MULTIPLE_CHOICE의 minSelections·maxSelections(비우면 제한 없음)'],
    reuse: ['저장 전 validatePopupQuestions(questions, quiz, passingScore)로 검사한다(오류 문구 또는 null).', '새 문항·선택지 ID는 음수 임시 ID다. 서버가 저장 시 채번한다.'],
    example: `<PopupQuestionEditor questions={popup.questions} quiz={popup.popupType === 'QUIZ'} passingScore={popup.passingScore}
  onChange={(questions) => setPopup((p) => ({ ...p, questions }))}
  onPassingScoreChange={(passingScore) => setPopup((p) => ({ ...p, passingScore }))} />`,
    processes: ['question'],
  },
  {
    name: 'PopupQuizRuleFields', file: 'PopupQuizRuleFields.tsx',
    summary: '퀴즈 유형(만점 통과·커트라인 통과·통과/실패 제출)과 기준 개수 입력. 통과 점수 계산 결과를 안내한다.',
    props: [
      { name: 'questionCount', type: 'number', required: true, description: '문항 수' },
      { name: 'rule', type: "QuizRule('' | 'FULL' | 'CUTOFF' | 'PASS_FAIL')", required: true, description: '선택한 유형' },
      { name: 'count', type: 'number', required: true, description: '통과 기준 개수' },
      { name: 'passingScore', type: 'number | null', description: '계산된 통과 점수(안내용)' },
      { name: 'className / titlePrefix', type: 'string / ReactNode', description: '퍼블리싱 클래스·제목 앞 표시' },
    ],
    outputs: [
      { name: 'onRuleChange', type: '(rule: QuizRule) => void', required: true, description: '유형 선택' },
      { name: 'onCountChange', type: '(count: number) => void', required: true, description: '개수 입력' },
    ],
    values: ['usePopupQuizRule(popup, resetKey) → { rule, count, setRule, setCount, effective, error }', 'withQuizRule이 계산한 effective.passingScore를 저장한다.'],
    reuse: ['입력·표시만 한다. 계산은 popupQuizRule.withQuizRule, 검사는 validateQuizRule.'],
    example: `const quizRule = usePopupQuizRule(popup, resetKey);
<PopupQuizRuleFields questionCount={popup.questions.length} rule={quizRule.rule} count={quizRule.count}
  passingScore={quizRule.effective?.passingScore} onRuleChange={quizRule.setRule} onCountChange={quizRule.setCount} />`,
    processes: ['question'],
  },
  {
    name: 'PopupScheduleFields', file: 'PopupScheduleFields.tsx',
    summary: '게시 기간 안 노출 요일·시간대 입력(FIXED 상시 / SCHEDULE 지정).',
    props: [
      { name: 'value', type: 'PopupScheduleValue { periodMode, repeatDayOfWeek?, displayTimes?, displayStartAt?, displayEndAt? }', description: '현재 일정 값(권장). AdminPopupDetail 전체가 필요 없다' },
      { name: 'popup', type: 'PopupScheduleValue', description: '호환용(deprecated). value와 같은 값' },
      { name: 'showPeriod', type: 'boolean', description: '게시 기간(시작·종료) 입력도 표시. 기본 false' },
    ],
    outputs: [{ name: 'onChange', type: '(patch: Partial<PopupScheduleValue>) => void', required: true, description: '바뀐 항목만 담은 부분 값. 게시 기간은 입력란 문자열 그대로(직렬화는 부모)' }],
    values: ['popup.periodMode(FIXED | SCHEDULE)', 'popup.repeatDayOfWeek(ISO 요일 쉼표 목록, 1=월)', 'popup.displayTimes([{ startTime, endTime }])'],
    reuse: ['저장 전 validatePopupSchedule(popup), 요약은 describeSchedule(periodMode, repeatDayOfWeek, displayTimes).'],
    example: `const [schedule, setSchedule] = useState<PopupScheduleValue>({ periodMode: 'FIXED' });
<PopupScheduleFields value={schedule} showPeriod onChange={(patch) => setSchedule((p) => ({ ...p, ...patch }))} />`,
    processes: ['schedule'],
  },
  {
    name: 'InlinePopupPreview', file: 'InlinePopupPreview.tsx',
    summary: '등록 화면 우측 미리보기(제목·"실제 크기로 보기" 버튼 + PopupPreview).',
    props: [
      { name: 'popup', type: 'AdminPopupDetail', required: true, description: '미리 볼 편집값(그대로 넘김)' },
      { name: 'title', type: 'string', description: "제목. 기본 '팝업 미리보기'" },
    ],
    outputs: [
      { name: 'onOpenPreview', type: '() => void', description: '있으면 "실제 크기로 보기" 버튼 표시' },
      { name: 'onRecommendedSize', type: '(size: Size | null) => void', description: 'IMAGE 권장 창 크기' },
    ],
    values: ['편집값 전체(읽기 전용)'],
    reuse: ['API를 부르지 않고 popup을 바꾸지 않는다. 부모 영역의 남은 높이를 채운다.'],
    example: PREVIEW_EXAMPLE,
    processes: ['preview'],
  },
  {
    name: 'PopupPreviewDialog', file: 'PopupPreviewDialog.tsx',
    summary: '실제 크기 미리보기 모달. 크기 모드·9개 위치·배경 Overlay를 WPF와 같이 적용한다.',
    props: [
      { name: 'popup', type: 'AdminPopupDetail', required: true, description: '미리 볼 편집값' },
      { name: 'open', type: 'boolean', required: true, description: '열림 여부(부모 state)' },
      { name: 'recommendedSize', type: 'Size | null', description: '인라인 미리보기가 계산한 IMAGE 권장 크기' },
    ],
    outputs: [{ name: 'onClose', type: '() => void', required: true, description: '종료 버튼·Esc·팝업 안 닫기 동작' }],
    values: ['편집값 전체(읽기 전용)'],
    reuse: ['설문 응답·시청 비율 등 시연 상태는 모달 안에만 있고 닫으면 초기화된다.'],
    example: PREVIEW_EXAMPLE,
    processes: ['preview'],
  },
  {
    name: 'PopupPreview', file: 'PopupPreview.tsx',
    summary: '공용 렌더러. WPF 팝업 창과 같은 헤더·본문(TEXT/IMAGE/VIDEO/SURVEY/QUIZ)·푸터를 그리고 완료 조건을 시연한다.',
    props: [
      { name: 'popup', type: 'AdminPopupDetail', required: true, description: '미리 볼 팝업 설정' },
      { name: 'showBackground', type: 'boolean', description: '배경 여백·Overlay를 안에 그릴지. 기본 true(모달은 false)' },
    ],
    outputs: [
      { name: 'onClose', type: '() => void', description: '푸터 버튼·나중에 보기·보조 닫기로 닫을 때' },
      { name: 'onRecommendedSize', type: '(size: Size | null) => void', description: 'IMAGE 권장 창 크기' },
    ],
    values: ['헤더: 검은 배경·흰 제목·고정 로고(public/images/popup-header-logo.png)', "푸터 버튼: CLOSE '확인', LINK_AND_CLOSE '바로가기', SURVEY·QUIZ '제출'"],
    reuse: ['보통 InlinePopupPreview·PopupPreviewDialog를 쓰고, 목록 썸네일 등 다른 배치가 필요할 때 직접 쓴다.'],
    example: `<PopupPreview popup={popup} showBackground={false} />`,
    processes: ['preview'],
  },
];

export const FUNCTIONS: GuideFunction[] = [
  { name: 'createDefaultPopup', file: 'popupEditorTransform.ts', input: 'now?: Date', output: 'AdminPopupDetail', description: '신규 기본 편집값' },
  { name: 'toEditorPopup', file: 'popupEditorTransform.ts', input: 'loaded: AdminPopupDetail', output: 'AdminPopupDetail', description: '조회 응답 popup → 편집값' },
  { name: 'toEditorPopupFromTemplate', file: 'popupEditorTransform.ts', input: 'template, currentPopupId', output: 'AdminPopupDetail', description: '템플릿 → 편집값(현재 ID 유지, 문항 템플릿 연결 해제)' },
  { name: 'changePopupType', file: 'popupEditorTransform.ts', input: "previous, selection(PopupType | 'VIDEO_QUIZ')", output: 'AdminPopupDetail', description: '유형 변경(입력값 유지, 필수 값 보정)' },
  { name: 'toSaveRequestPopup', file: 'popupEditorTransform.ts', input: 'popup: AdminPopupDetail', output: 'AdminPopupDetail', description: '편집값 → 저장 popup(유형별 키·URL·Footer·날짜·IMAGE 크기 정리)' },
  { name: 'toSaveRequest', file: 'popupEditorTransform.ts', input: 'popup, active, targetGroups', output: 'PopupSaveRequest', description: '저장 API body' },
  { name: 'COMMON_CONTENT_KEYS / CONTENT_KEYS_BY_TYPE', file: 'popupEditorTransform.ts', input: '(상수)', output: 'string[] / Record<유형, string[]>', description: '저장 시 남기는 공통·유형별 content 키(가이드 content 키 표도 이 목록)' },
  { name: 'contentValue', file: 'popupEditorTransform.ts', input: 'popup, key', output: 'string', description: 'content 값을 입력란 문자열로(null → "")' },
  { name: 'toDateTimeLocal', file: 'popupEditorTransform.ts', input: 'value: PopupDateValue', output: 'string', description: '서버 일시 → datetime-local 문자열' },
  { name: 'describeSchedule / parseWeekdays', file: 'popupEditorTransform.ts', input: 'periodMode, repeatDayOfWeek, displayTimes', output: 'string / number[]', description: '노출 일정 요약·요일 파싱' },
  { name: 'pickPopupFields', file: 'popupEditorTransform.ts', input: 'popup, { topLevelKeys?, contentKeys?, questionKeys? }', output: '{ ...최상위 키, content?, questions? }', description: '최상위·content·각 문항에서 고른 키만 값 그대로 새 객체로(준 영역만, 키가 있으면 null·0·빈 값 보존, 얕은 복사). 변환·검증 없음' },
  { name: 'htmlToBlocks / blocksToHtml', file: 'popupRichText.ts', input: 'html / RichBlock[]', output: 'RichBlock[] / html', description: '편집기 HTML ↔ 서식 본문(허용 서식만)' },
  { name: 'blocksToPlainText / plainTextToBlocks', file: 'popupRichText.ts', input: 'RichBlock[] / string', output: 'string / RichBlock[]', description: '서식 본문 ↔ 일반 문자열(문단 사이 \\n)' },
  { name: 'readTextBlocks', file: 'popupRichText.ts', input: 'value: unknown', output: 'RichBlock[] | null', description: '서버 값을 계약에 맞는 서식 본문으로(구조 오류 null)' },
  { name: 'readQuizRule / withQuizRule / validateQuizRule', file: 'popupQuizRule.ts', input: 'popup, rule, count', output: '{ rule, count } / AdminPopupDetail / string | null', description: '퀴즈 유형 ↔ 통과 점수' },
  { name: 'validatePopupQuestions', file: 'PopupQuestionEditor.tsx', input: 'questions, quiz, passingScore?', output: 'string | null', description: '문항 저장 전 검사' },
  { name: 'validatePopupSchedule', file: 'PopupScheduleFields.tsx', input: 'popup', output: 'string | null', description: '노출 일정 저장 전 검사' },
  { name: 'withPreviewFallback', file: 'popupPreviewFallback.ts', input: 'state: Partial<AdminPopupDetail>', output: 'AdminPopupDetail(미리보기 전용)', description: '화면 state에 미리보기 표시용 최상위 필드(PREVIEW_FALLBACK)만 채움. 업무 값·content 기본값은 채우지 않음. 저장·추출에 쓰지 않음' },
  { name: 'popupFontSize / popupMinimumSize', file: 'popupCommon.ts', input: 'popup, key', output: 'number | null / { width, height }', description: '폰트 크기(10~40)·최소 창 크기(300) 읽기' },
];
