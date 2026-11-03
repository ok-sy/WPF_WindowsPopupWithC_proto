// POL-07-02 : 변환 책임 분리
// ■ pickPopupFields(content·questions 선택 필드 추출) 단위 검사. 브라우저 없이 Node로 실행한다.
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-popup-pick-fields.cjs
// 타입 안정성(keyof·Pick) 검사는 zero-rule-web/main/src/features/PopupcommonComponent/__typetests__/pickPopupFields.typetest.ts를
// 웹 type-check(tsc --noEmit)가 함께 한다.
const fs = require('fs'), path = require('path'), Module = require('module');
const ts = require('../zero-rule-web/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'zero-rule-web/main/src/features/PopupcommonComponent');

// .ts를 CommonJS로 바꿔 require한다(대상 모듈의 import는 타입 전용이거나 같은 폴더 상대 경로뿐).
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
  }).outputText;
  module._compile(output, filename);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('.') && parent?.filename?.endsWith('.ts') && !path.extname(request)) {
    const candidate = path.resolve(path.dirname(parent.filename), request + '.ts');
    if (fs.existsSync(candidate)) return candidate;
  }
  return originalResolve.call(this, request, parent, ...rest);
};

const { pickPopupFields, createDefaultPopup, toSaveRequestPopup } = require(path.join(sourceDir, 'popupEditorTransform.ts'));

let checks = 0;
const check = (ok, message) => { if (!ok) throw Error('FAIL: ' + message); checks++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const deepFreeze = (value) => { if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); } return value; };

const popup = deepFreeze({
  ...createDefaultPopup(new Date('2026-11-02T00:00:00+09:00')),
  popupId: 'P-001', popupType: 'SURVEY', title: '', hideDays: 0, showLater: false, questionTemplateId: null,
  content: { plainText: '안녕하세요', textBlocks: [{ alignment: 'LEFT', runs: [{ text: '안녕하세요' }] }], surveyTitle: '만족도',
    empty: undefined, nothing: null, zero: 0, off: false, blank: '' },
  questions: [
    { questionId: 2, title: '두 번째 질문', questionType: 'TEXT', isRequired: false, isScored: false, sortOrder: 2, options: [], correctAnswer: '' },
    { questionId: 1, title: '첫 번째 질문', questionType: 'SINGLE_CHOICE', isRequired: true, isScored: false, sortOrder: 1,
      options: [{ optionId: 11, value: '1', text: '예', sortOrder: 1 }] },
  ],
});
const before = JSON.stringify(popup);

// 1. 영역별 단독
const topOnly = pickPopupFields(popup, { topLevelKeys: ['popupId', 'displayStartAt', 'periodMode'] });
check(same(Object.keys(topOnly), ['popupId', 'displayStartAt', 'periodMode']), '최상위만: 고른 키만, content·questions 없음: ' + JSON.stringify(Object.keys(topOnly)));
check(topOnly.displayStartAt === popup.displayStartAt, '날짜 변환 없이 입력 값 그대로(ISO 변환·직렬화 안 함)');
const contentOnly = pickPopupFields(popup, { contentKeys: ['plainText', 'textBlocks'] });
check(same(Object.keys(contentOnly), ['content']), 'content만: questions·최상위 키 없음');
check(same(contentOnly.content, { plainText: '안녕하세요', textBlocks: popup.content.textBlocks }), 'content에서 지정한 키만');
const questionsOnly = pickPopupFields(popup, { questionKeys: ['questionId', 'title'] });
check(same(Object.keys(questionsOnly), ['questions']), 'questions만: content·최상위 키 없음');
check(same(questionsOnly.questions, [{ questionId: 2, title: '두 번째 질문' }, { questionId: 1, title: '첫 번째 질문' }]),
  '각 문항에서 지정 키만, 원본 배열 순서 유지(정렬하지 않음): ' + JSON.stringify(questionsOnly.questions));

// 2. 조합
const all = pickPopupFields(popup, { topLevelKeys: ['popupId', 'title'], contentKeys: ['plainText'], questionKeys: ['questionId'] });
check(same(all, { popupId: 'P-001', title: '', content: { plainText: '안녕하세요' }, questions: [{ questionId: 2 }, { questionId: 1 }] }),
  '세 영역 동시 추출: ' + JSON.stringify(all));
const pair = pickPopupFields(popup, { contentKeys: ['plainText'], questionKeys: ['questionId', 'title'] });
check(same(Object.keys(pair), ['content', 'questions']), 'content + questions 조합');

// 3. 값 보존: 키가 있으면 null·false·0·빈 문자열·undefined 모두 보존, 키가 없으면 생략
const values = pickPopupFields(popup, { topLevelKeys: ['title', 'hideDays', 'showLater', 'questionTemplateId'],
  contentKeys: ['nothing', 'zero', 'off', 'blank', 'empty', 'missingKey'], questionKeys: ['correctAnswer'] });
check(values.title === '' && values.hideDays === 0 && values.showLater === false && values.questionTemplateId === null, '최상위 빈 문자열·0·false·null 보존');
check(values.content.nothing === null && values.content.zero === 0 && values.content.off === false && values.content.blank === '', 'content null·0·false·빈 문자열 보존');
check('empty' in values.content && values.content.empty === undefined, '키가 있으면 값이 undefined여도 키 보존');
check(!('missingKey' in values.content), '없는 키는 생략');
check('correctAnswer' in values.questions[0] && values.questions[0].correctAnswer === '' && !('correctAnswer' in values.questions[1]), '문항별로 있는 키만(빈 문자열 보존, 없는 문항은 생략)');
check(!('width' in pickPopupFields({ ...popup, width: undefined }, { topLevelKeys: ['popupId'] })), '고르지 않은 키는 넣지 않음');

// 4. 경계: 옵션 없음·빈 배열·빈/누락 questions·누락 content·부분 객체
check(same(pickPopupFields(popup, {}), {}), '옵션이 없으면 빈 객체');
check(same(pickPopupFields(popup, { topLevelKeys: [] }), {}), 'topLevelKeys 빈 배열이면 최상위 키 없음');
check(same(pickPopupFields(popup, { contentKeys: [] }), { content: {} }), 'contentKeys 빈 배열이면 빈 content');
check(same(pickPopupFields(popup, { questionKeys: [] }), { questions: [{}, {}] }), 'questionKeys 빈 배열이면 문항마다 빈 객체');
check(same(pickPopupFields({ ...popup, questions: [] }, { questionKeys: ['questionId'] }), { questions: [] }), '빈 questions는 빈 배열');
check(same(pickPopupFields({ popupId: 'X' }, { topLevelKeys: ['popupId', 'title'], contentKeys: ['plainText'], questionKeys: ['questionId'] }),
  { popupId: 'X', content: {}, questions: [] }), 'content·questions가 없는 부분 객체도 오류 없이 처리');

// 5. 불변성·얕은 복사
check(JSON.stringify(popup) === before, '원본 객체 불변(동결 객체로도 오류 없음)');
check(all.content !== popup.content && all.questions[0] !== popup.questions[0], '결과 컨테이너(content·문항 객체)는 새 객체');
check(contentOnly.content.textBlocks === popup.content.textBlocks, '고른 중첩 값은 원본과 같은 참조(얕은 복사 정책)');
check(pickPopupFields(popup, { questionKeys: ['options'] }).questions[1].options === popup.questions[1].options, "questionKeys 'options'는 선택지 배열을 참조 그대로(하위 선택 없음)");

// 6. 저장 변환과 분리: 저장 기준 값이 필요하면 호출하는 쪽이 toSaveRequestPopup 결과를 넘긴다(pickPopupFields는 변환하지 않음)
const saved = pickPopupFields(toSaveRequestPopup(popup), { topLevelKeys: ['displayStartAt'], contentKeys: ['plainText', 'surveyTitle'] });
check(same(saved.content, { surveyTitle: '만족도' }), 'toSaveRequestPopup 결과를 넘기면 SURVEY에 없는 plainText는 이미 제외됨');

// 7. 입력·추출·전송(JSON 직렬화)까지 미설정과 명시값 구별 — WEB 책임 분리 TODO F-4
//    편집기는 숫자 입력을 비우면 undefined(IS063M02Sample·PopupSampleEditor) 또는 null(PopupQuestionEditor 배점·선택 수)로 둔다.
//    JSON 규칙상 undefined 키는 전송 본문에서 빠지고(생략 = 미설정), null은 "null"로 남는다(명시적 미설정).
//    false·0·빈 문자열은 그대로 전송되어 서버가 미설정과 구별할 수 있어야 한다.
const fieldKeys = ['hideDays', 'showLater', 'title', 'questionTemplateId', 'width'];
const wire = (value) => JSON.parse(JSON.stringify(value));
const send = (state) => wire(pickPopupFields(state, { topLevelKeys: fieldKeys, contentKeys: ['zero', 'off', 'blank', 'nothing', 'empty'], questionKeys: ['questionScore'] }));
const { width: _removed, ...withoutWidth } = popup; // 입력 값 삭제 = 키 제거
const editedQuestions = [{ ...popup.questions[0], questionScore: 0 }, { ...popup.questions[1], questionScore: null }];
const sent = send({ ...withoutWidth, hideDays: 0, showLater: false, title: '', questionTemplateId: null, questions: editedQuestions });
check(!('width' in sent), '키를 지운 값은 전송 본문에 없음(서버 기본값 대상)');
check(sent.hideDays === 0 && sent.showLater === false && sent.title === '', '명시 0·false·빈 문자열은 전송 본문에 그대로: ' + JSON.stringify(sent));
check('questionTemplateId' in sent && sent.questionTemplateId === null, 'null은 키와 함께 null로 전송(생략과 구별)');
check(same(sent.content, { zero: 0, off: false, blank: '', nothing: null }), 'content: 0·false·빈 문자열·null 유지, undefined 키는 전송 시 빠짐: ' + JSON.stringify(sent.content));
check(!('empty' in sent.content), '추출 단계에서 보존한 undefined 키도 JSON 전송 단계에서는 생략과 같아짐');
check(sent.questions[0].questionScore === 0 && sent.questions[1].questionScore === null, '문항 배점 0과 비운 값(null) 구별');
const cleared = send({ ...popup, width: undefined, questions: [{ ...popup.questions[0], questionScore: undefined }] });
check(!('width' in cleared) && !('questionScore' in cleared.questions[0]), '입력을 비워 undefined가 된 값은 키를 지운 경우와 같은 본문');
const explicit = send({ ...popup, width: 0 });
check('width' in explicit && explicit.width === 0, '같은 필드라도 명시 0은 전송되어 미설정과 다른 본문');
check(JSON.stringify(cleared) !== JSON.stringify(explicit), '미설정 본문과 명시 0 본문이 직렬화 결과에서 다름');

console.log(`PASS: ${checks} pickPopupFields checks`);
