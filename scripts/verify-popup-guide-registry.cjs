// POL-14-01 : 공통 프론트 경계
// ■ PopupcommonComponent 가이드 등록 정적 검사
// - 공개 컴포넌트(index.ts default re-export) ↔ guideData.COMPONENTS, guideData.FUNCTIONS 이름 ↔ 실제 export,
//   범위(scope) 표기, 프로세스 ID 참조, 실행기 정의, 공지 데이터(id·날짜·영향 이름·탭), 공통 소스 → guide 역참조 금지를 확인한다.
// - 소스를 실행하지 않고 텍스트로 읽는다(빌드·브라우저 불필요). 실행: node scripts/verify-popup-guide-registry.cjs
const fs = require('fs'), path = require('path');
const dir = path.resolve(__dirname, '../zero-rule-web/main/src/features/PopupcommonComponent');
const read = (file) => fs.readFileSync(path.join(dir, file), 'utf8').replace(/^﻿/, '');
let checks = 0;
const failures = [];
const check = (ok, message) => { checks++; if (!ok) failures.push(message); };

// 1) index.ts 공개 경계: default 컴포넌트, 명명 re-export, export * 파일
const index = read('index.ts');
const publicComponents = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1]);
const namedExports = new Set();
for (const m of index.matchAll(/export \{([^}]*)\} from '\.\/(\w+)'/g)) {
  m[1].split(',').map((part) => part.trim().replace(/^type\s+/, '').replace(/^default as\s+/, '')).filter(Boolean).forEach((name) => namedExports.add(name));
}
const starFiles = [...index.matchAll(/export \* from '\.\/(\w+)'/g)].map((m) => m[1]);
for (const file of starFiles) {
  const source = read(fs.existsSync(path.join(dir, file + '.ts')) ? file + '.ts' : file + '.tsx');
  for (const m of source.matchAll(/export (?:async )?(?:function|const|let|type|interface|class) (\w+)/g)) namedExports.add(m[1]);
}
const exported = (name) => namedExports.has(name) || publicComponents.includes(name);

// 2) guideData: COMPONENTS·FUNCTIONS·PROCESSES
const data = read('guide/guideData.ts');
const section = (start, end) => data.slice(data.indexOf(start), end ? data.indexOf(end) : undefined);
const componentsBlock = section('export const COMPONENTS', 'export const FUNCTIONS');
const functionsBlock = section('export const FUNCTIONS');
const processesBlock = section('export const PROCESSES', 'const PREVIEW_EXAMPLE');
const guideComponents = [...componentsBlock.matchAll(/^\s{4}name: '(\w+)', file: '([\w.]+)'/gm)].map((m) => ({ name: m[1], file: m[2] }));
const processIds = [...processesBlock.matchAll(/id: '([\w-]+)', scope: '(COMMON|PROTO)'/g)].map((m) => ({ id: m[1], scope: m[2] }));
const functionEntries = [...functionsBlock.matchAll(/\{ name: '([^']+)', scope: '(\w+)', file: '([\w.]+)'/g)].map((m) => ({ name: m[1], scope: m[2], file: m[3] }));

check(publicComponents.length > 0, 'index.ts has public components');
for (const name of publicComponents) check(guideComponents.some((c) => c.name === name), `Public component ${name} is documented in guideData.COMPONENTS`);
for (const c of guideComponents) {
  check(publicComponents.includes(c.name), `guideData component ${c.name} is exported from index.ts`);
  check(fs.existsSync(path.join(dir, c.file)), `guideData component ${c.name} file ${c.file} exists`);
}
const processCount = (processesBlock.match(/^\s{2}\{\n?\s*id: /gm) || []).length || (processesBlock.match(/\bid: '/g) || []).length;
check(processIds.length === processCount && processIds.length > 0, `Every process has scope COMMON|PROTO (${processIds.length}/${processCount})`);
check(processIds.some((p) => p.scope === 'COMMON') && processIds.some((p) => p.scope === 'PROTO'), 'Processes include both COMMON and PROTO flows');
for (const m of componentsBlock.matchAll(/processes: \[([^\]]*)\]/g)) {
  for (const id of m[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)) {
    check(processIds.some((p) => p.id === id), `Component process reference '${id}' exists`);
  }
}
// P0 회귀: 범용 흐름 단계의 actor가 proto 전용 함수가 아니어야 한다.
const PROTO_ONLY = ['createDefaultPopup', 'toSaveRequest', 'toSaveRequestPopup', 'changePopupType', 'toEditorPopup', 'toEditorPopupFromTemplate'];
for (const block of processesBlock.split(/\n  \{\n/).slice(1)) {
  if (!/scope: 'COMMON'/.test(block)) continue;
  const id = (block.match(/id: '([\w-]+)'/) || [])[1];
  for (const m of block.matchAll(/actor: '([^']+)'/g)) {
    check(!PROTO_ONLY.some((fn) => new RegExp(`\\b${fn}\\b`).test(m[1])), `COMMON process ${id} step '${m[1]}' does not use a proto-only function as actor`);
  }
}

check(functionEntries.length === (functionsBlock.match(/\{ name: '/g) || []).length, 'Every function entry has scope and file');
for (const fn of functionEntries) {
  check(fn.scope === 'COMMON' || fn.scope === 'PROTO', `Function ${fn.name} scope is COMMON|PROTO`);
  const fileSource = fs.existsSync(path.join(dir, fn.file)) ? read(fn.file) : '';
  check(fileSource !== '', `Function ${fn.name} file ${fn.file} exists`);
  for (const name of fn.name.split(' / ')) {
    check(exported(name), `Function ${name} is exported from index.ts`);
    check(new RegExp(`export (?:async )?(?:function|const) ${name}\\b`).test(fileSource), `Function ${name} is defined in ${fn.file}`);
  }
  if (PROTO_ONLY.includes(fn.name)) check(fn.scope === 'PROTO', `Function ${fn.name} is marked proto-only`);
}

// 3) 실행기: 정의된 실행기는 문서화된 컴포넌트, 실행기 없는 컴포넌트는 안내 문구
const runners = read('guide/guideRunners.tsx');
const runnerBlock = runners.slice(runners.indexOf('export const COMPONENT_RUNNERS'), runners.indexOf('export const RUNNER_NOTES'));
const noteBlock = runners.slice(runners.indexOf('export const RUNNER_NOTES'));
const runnerNames = [...runnerBlock.matchAll(/^\s{2}(\w+): \{/gm)].map((m) => m[1]);
for (const name of runnerNames) check(guideComponents.some((c) => c.name === name), `Runner ${name} belongs to a documented component`);
for (const c of guideComponents) {
  if (!runnerNames.includes(c.name)) check(new RegExp(`\\b${c.name}:`).test(noteBlock), `Component ${c.name} without runner has a RUNNER_NOTES entry`);
}

// 4) 공지: id 중복 없음, 날짜 형식, 영향 이름은 공개 export, 탭 ID 유효
const notices = read('guide/guideNotices.ts');
const ui = read('guide/GuideUi.tsx');
const tabIds = ((ui.match(/export type GuideTabId = ([^;]+);/) || [])[1] || '').match(/'(\w+)'/g)?.map((s) => s.replace(/'/g, '')) || [];
const noticeIds = [...notices.matchAll(/^\s{4}id: '([^']+)', date: '([^']+)'/gm)];
check(noticeIds.length > 0, 'Notices exist');
check(new Set(noticeIds.map((m) => m[1])).size === noticeIds.length, 'Notice ids are unique');
for (const m of noticeIds) check(/^\d{4}-\d{2}-\d{2}$/.test(m[2]), `Notice ${m[1]} date is YYYY-MM-DD`);
for (const m of notices.matchAll(/components: \[([^\]]*)\]/g)) {
  for (const name of m[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)) check(exported(name), `Notice component '${name}' is a public export`);
}
for (const m of notices.matchAll(/^\s{4}tab: '(\w+)'/gm)) check(tabIds.includes(m[1]), `Notice tab '${m[1]}' is a guide tab`);
// 공지 대상은 컴포넌트·함수의 동작/사용 흐름 변경만이다. 가이드 화면·정책 정리·작업 예정(PLANNED) 공지는 두지 않는다.
for (const m of notices.matchAll(/^\s{4}title: (['"])(.*)\1,$/gm)) check(!/가이드|정책|책임 분리/.test(m[2]), `Notice '${m[2]}' is a component/process change (not a guide-screen or policy notice)`);
check(!/category: 'PLANNED'/.test(notices.slice(notices.indexOf('export const GUIDE_NOTICES'))), 'No planned/in-progress work notices');
check(tabIds.length === 8 && tabIds[0] === 'start', 'Guide has 8 tabs and starts with 시작하기(start)');

// 5) 공통 소스는 guide·sample을 참조하지 않는다(가이드 → 공통 단방향)
for (const file of fs.readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f))) {
  check(!/from '\.\/(guide|sample)\//.test(read(file)), `Common source ${file} does not import guide/ or sample/`);
}

// 6) 정책 문구 ↔ 실제 상수·문서(정책을 바꾸고 옛 설명을 남기는 누락 방지, 2026-11-25)
//    - 창 하한 300·화면 상한 90%는 웹 상수와 WPF 상수가 같아야 하고, 가이드 표는 숫자를 직접 쓰지 않고 상수에서 만든다.
//    - 창 크기 규칙(최대 = 설정 최대와 화면 90% 중 작은 값, IMAGE·RATIO 포함)은 가이드 표·61 문서가 모두 같은 문장을 쓴다.
//    - 공통 폴더 루트 파일은 모두 이식 가이드 파일 표에 있다.
const repo = path.resolve(__dirname, '..');
const readRepo = (rel) => fs.readFileSync(path.join(repo, rel), 'utf8').replace(/^﻿/, '');
const constOf = (source, pattern) => Number((source.match(pattern) || [])[1]);
const common = read('popupCommon.ts');
const safeRatio = constOf(common, /export const POPUP_SCREEN_SAFE_AREA_RATIO = ([\d.]+)/);
const minWindow = constOf(common, /export const POPUP_MIN_WINDOW_SIZE = (\d+)/);
const pct = `${Math.round(safeRatio * 100)}%`;
check(safeRatio > 0 && safeRatio < 1 && minWindow > 0, `Web window constants readable (ratio ${safeRatio}, min ${minWindow})`);
check(constOf(readRepo('popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs'), /const double ScreenSafeAreaRatio = ([\d.]+)/) === safeRatio, `WPF ScreenSafeAreaRatio equals web POPUP_SCREEN_SAFE_AREA_RATIO (${safeRatio})`);
check(constOf(readRepo('popup-frameWork/Popup/Models/PopupOptions.cs'), /const double MinWindowSize = (\d+)/) === minWindow, `WPF MinWindowSize equals web POPUP_MIN_WINDOW_SIZE (${minWindow})`);

check(/const SAFE = `\$\{Math\.round\(POPUP_SCREEN_SAFE_AREA_RATIO \* 100\)\}%`/.test(data), 'guideData SAFE is built from POPUP_SCREEN_SAFE_AREA_RATIO');
const limitsBlock = section('export const LAYOUT_LIMITS', 'export const PROCESSES');
const limitRows = (group) => (limitsBlock.split(new RegExp(`\\n\\s{2}${group}: \\[`))[1] || '').split(/\n\s{2}\],/)[0].split('\n').filter((l) => /target: '/.test(l));
const windowRows = limitRows('windows'), previewRows = limitRows('preview');
check(windowRows.length >= 5 && previewRows.length >= 2, `LAYOUT_LIMITS windows/preview rows found (${windowRows.length}/${previewRows.length})`);
for (const row of [...windowRows, ...previewRows]) {
  const target = row.match(/target: '([^']+)'/)[1];
  check(!/\d+%/.test(row), `LAYOUT_LIMITS ${target} has no hard-coded percent (use \${SAFE})`);
  check(!/\b300\b/.test(row), `LAYOUT_LIMITS ${target} has no hard-coded 300 (use \${MIN})`);
}
for (const target of ['FIXED', 'RATIO', 'AUTO', 'IMAGE 유형']) {
  const row = windowRows.find((l) => l.includes(`target: '${target}'`)) || '';
  check(row.includes('max: `입력한 최대값과 화면의 ${SAFE} 중 작은 값`'), `LAYOUT_LIMITS ${target} max is the common rule (설정 최대 vs 화면 \${SAFE})`);
}

const STALE = ['설정 maximum 미사용', '입력한 최대값 대신', '브라우저 90%', '화면의 100%', '화면 100%'];
const doc61 = readRepo('docs/design/61_POPUP_LAYOUT_GUIDE.md');
const porting = readRepo('docs/interfaces/Web/ADMIN_POPUP_PREVIEW_COMPONENTS.md');
for (const [name, text] of [['guideData.ts', data], ['61_POPUP_LAYOUT_GUIDE.md', doc61], ['ADMIN_POPUP_PREVIEW_COMPONENTS.md', porting]]) {
  for (const phrase of STALE) check(!text.includes(phrase), `${name} has no stale window policy phrase '${phrase}'`);
}
const windowBullets = doc61.split(/\r?\n/).filter((l) => l.startsWith('- **창** ·'));
const previewBullets = doc61.split(/\r?\n/).filter((l) => l.startsWith('- **웹 미리보기** ·'));
check(windowBullets.length > 0 && previewBullets.length === windowBullets.length, `61 doc has window/preview bullets per type (${windowBullets.length}/${previewBullets.length})`);
windowBullets.forEach((l, i) => check(l.includes(`최소 ${minWindow}×${minWindow}`) && l.includes(`설정 maximum과 화면 ${pct}`), `61 doc window bullet #${i + 1} uses min ${minWindow} and 설정 maximum vs 화면 ${pct}`));
previewBullets.forEach((l, i) => check(l.includes(`min(설정 maximum, 작업 영역 ${pct})`), `61 doc preview bullet #${i + 1} uses min(설정 maximum, 작업 영역 ${pct})`));
for (const mode of ['FIXED', 'RATIO', 'AUTO']) {
  const row = doc61.split(/\r?\n/).find((l) => l.startsWith(`| \`${mode}\` |`)) || '';
  check(row.includes(`min(설정 maximum, 작업 영역×${pct})`), `61 doc window-mode table ${mode} uses min(설정 maximum, 작업 영역×${pct})`);
}

for (const file of fs.readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f) && f !== 'index.ts')) {
  check(porting.includes('`' + file + '`'), `Porting guide ADMIN_POPUP_PREVIEW_COMPONENTS.md lists ${file}`);
}

if (failures.length) { console.error('FAIL:\n- ' + failures.join('\n- ')); process.exitCode = 1; }
else console.log('PASS: ' + checks + ' PopupcommonComponent guide registry checks');
