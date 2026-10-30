// POL-15-01 : 배포 범위
// ■ 폐쇄망: CKEditor 49 node_modules를 pnpm 설치 없이 폴더 복사로 반영
// - in : 같은 폴더의 node_modules-ckeditor.tgz(prepare-offline-node-modules.cjs가 만든 일반 폴더 트리), front_end 루트
// - out: front_end\node_modules에 CKEditor 49 트리 복사, 이전 CKEditor 폴더는 백업 폴더로 이동, 백업 폴더에 plan.json·로그
// - 폐쇄망 front_end는 pnpm install 없이 node_modules에 패키지 폴더를 직접 복사해 쓴다. lockfile 검사를 하지 않으므로
//   이 스크립트가 Node 모듈 탐색 규칙대로 각 패키지가 맞는 버전을 찾는지 직접 계산해 배치한다.
// - 배치 규칙
//   1) 이전 엔진(ckeditor5, @ckeditor/*)을 루트·main·sub/* node_modules에서 백업 폴더로 옮긴다(두 엔진이 섞이면
//      ckeditor-duplicated-modules 오류).
//   2) 묶음 최상위 패키지: 루트에 없으면 복사, 같은 버전이 있으면 그대로 사용, 다른 버전이 있으면 덮지 않는다.
//   3) 복사한 패키지마다 의존 패키지를 탐색 규칙으로 찾아 묶음과 버전이 다르면 그 패키지 안 node_modules에 넣는다.
//      → 폐쇄망의 기존 패키지(다른 버전)는 건드리지 않는다.
//   4) peer 의존(react 등)은 폐쇄망 것을 쓴다(묶음에 없음).
//
// [사용] 이 폴더에서(폐쇄망 PC, Node 18 이상)
//   node copy-node-modules.cjs --web-root D:\경로\front_end              # 미리보기(변경 없음)
//   node copy-node-modules.cjs --web-root D:\경로\front_end --apply      # 실제 반영
//   node copy-node-modules.cjs --web-root D:\경로\front_end --apply --backup-dir D:\백업\ckeditor
//   node copy-node-modules.cjs --rollback D:\경로\front_end_ckeditor-backup-20261030-160000   # 되돌리기
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const has = (name) => args.includes(name);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const isEngine = (name) => name === 'ckeditor5' || name.startsWith('@ckeditor/');
const stamp = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const logLines = [];
const log = (line = '') => { console.log(line); logLines.push(line); };

function moveDir(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try { fs.renameSync(src, dst); }
  catch (e) {   // 다른 드라이브 등 이름 바꾸기가 안 되면 복사 후 삭제
    if (e.code !== 'EXDEV' && e.code !== 'EPERM') throw e;
    fs.cpSync(src, dst, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
  }
}

// ── 되돌리기: plan.json 기준으로 복사한 폴더 삭제 → 옮긴 폴더 원위치
if (has('--rollback')) {
  const backup = path.resolve(opt('--rollback'));
  const plan = readJson(path.join(backup, 'plan.json'));
  for (const rel of [...plan.copied].sort((a, b) => b.length - a.length)) {
    fs.rmSync(path.join(plan.webRoot, rel), { recursive: true, force: true });
    const scope = path.dirname(path.join(plan.webRoot, rel));   // 복사로 새로 생긴 scope 폴더(@types 등)가 비면 정리
    if (path.basename(scope).startsWith('@') && fs.existsSync(scope) && fs.readdirSync(scope).length === 0) fs.rmdirSync(scope);
  }
  for (const rel of plan.moved) {
    const dst = path.join(plan.webRoot, rel);
    if (fs.existsSync(dst)) throw new Error(`원위치에 폴더가 있어 되돌릴 수 없음: ${dst}`);
    moveDir(path.join(backup, 'moved', rel), dst);
  }
  console.log(`되돌리기 완료: 복사 ${plan.copied.length}개 삭제, 이전 폴더 ${plan.moved.length}개 원위치 (${plan.webRoot})`);
  console.log('Next 캐시(main\\.next)를 지우고 개발 서버를 다시 시작한다.');
  process.exit(0);
}

const webRoot = opt('--web-root') && path.resolve(opt('--web-root'));
if (!webRoot) throw new Error('--web-root <front_end 루트> 필요');
const rootNm = path.join(webRoot, 'node_modules');
if (!fs.existsSync(rootNm)) throw new Error(`node_modules 없음: ${rootNm}`);
const apply = has('--apply');

// 1) 묶음 트리 준비(이미 풀어 둔 node_modules 폴더가 있으면 그대로 사용)
const bundleDir = path.resolve(opt('--bundle') || __dirname);
let bundleNm = path.join(bundleDir, 'node_modules');
let temp = null;
if (!fs.existsSync(bundleNm)) {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ckeditor-nm-'));
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, ['-xzf', path.join(bundleDir, 'node_modules-ckeditor.tgz'), '-C', temp]);
  bundleNm = path.join(temp, 'node_modules');
}

try {
  // 패키지 위치 목록. 키는 node_modules 기준 상대 경로("ckeditor5", "a/node_modules/b")
  function listPackages(dir, rel, out) {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('.')) continue;
      const names = entry.startsWith('@') ? fs.readdirSync(path.join(dir, entry)).map((n) => `${entry}/${n}`) : [entry];
      for (const name of names) {
        const pkgDir = path.join(dir, name);
        const relPath = rel ? `${rel}/node_modules/${name}` : name;
        if (!fs.existsSync(path.join(pkgDir, 'package.json'))) continue;
        out.set(relPath, { name, json: readJson(path.join(pkgDir, 'package.json')) });
        listPackages(path.join(pkgDir, 'node_modules'), relPath, out);
      }
    }
    return out;
  }
  const bundle = listPackages(bundleNm, '', new Map());
  const parentOf = (relPath) => { const i = relPath.lastIndexOf('/node_modules/'); return i < 0 ? '' : relPath.slice(0, i); };
  const depsOf = (json) => Object.keys({ ...json.dependencies, ...json.optionalDependencies });
  function resolveBundle(relPath, dep) {
    for (let base = relPath; ; base = parentOf(base)) {
      const c = base ? `${base}/node_modules/${dep}` : dep;
      if (bundle.has(c)) return c;
      if (!base) return null;
    }
  }

  // 2) 옮길 이전 엔진 폴더: 루트·main·sub/* node_modules의 ckeditor5, @ckeditor/*
  const nmDirs = [rootNm, path.join(webRoot, 'main', 'node_modules')];
  const subRoot = path.join(webRoot, 'sub');
  if (fs.existsSync(subRoot)) for (const s of fs.readdirSync(subRoot)) nmDirs.push(path.join(subRoot, s, 'node_modules'));
  const moved = [];   // webRoot 기준 상대 경로
  for (const dir of nmDirs.filter((d) => fs.existsSync(d))) {
    if (fs.existsSync(path.join(dir, 'ckeditor5'))) moved.push(path.relative(webRoot, path.join(dir, 'ckeditor5')));
    const scope = path.join(dir, '@ckeditor');
    if (fs.existsSync(scope)) for (const n of fs.readdirSync(scope)) moved.push(path.relative(webRoot, path.join(scope, n)));
  }
  const movedSet = new Set(moved.map((p) => p.split(path.sep).join('/')));
  const rootRel = path.relative(webRoot, rootNm).split(path.sep).join('/');   // "node_modules"
  const isMoved = (relPath) => {   // relPath: 루트 node_modules 기준
    for (let p = relPath; p; p = parentOf(p)) if (movedSet.has(`${rootRel}/${p}`)) return true;
    return false;
  };

  // 배치 후 상태에서 위치의 버전: 복사 예정 > (옮긴 폴더 제외) 디스크
  const placed = new Map();   // 대상 상대 경로 → 묶음 상대 경로
  const copies = [];          // 실제 복사 단위 {target, source}
  const diskCache = new Map();
  function versionAt(relPath) {
    if (placed.has(relPath)) return bundle.get(placed.get(relPath)).json.version;
    if (isMoved(relPath)) return null;
    if (!diskCache.has(relPath)) {
      const file = path.join(rootNm, ...relPath.split('/'), 'package.json');
      diskCache.set(relPath, fs.existsSync(file) ? readJson(file).version : null);
    }
    return diskCache.get(relPath);
  }
  function resolveTarget(relPath, dep) {
    for (let base = relPath; ; base = parentOf(base)) {
      const c = base ? `${base}/node_modules/${dep}` : dep;
      const v = versionAt(c);
      if (v) return { at: c, version: v };
      if (!base) return null;
    }
  }
  function place(target, source) {
    copies.push({ target, source });
    placed.set(target, source);
    for (const key of bundle.keys()) if (key.startsWith(`${source}/node_modules/`)) placed.set(target + key.slice(source.length), key);
  }

  // 3) 최상위 패키지 배치
  const reused = [], conflicts = [];
  for (const [relPath, { name, json }] of bundle) {
    if (relPath.includes('/node_modules/')) continue;
    const existing = versionAt(relPath);
    if (!existing) place(relPath, relPath);
    else if (existing === json.version) reused.push(`${name}@${json.version}`);
    else conflicts.push(`${name}: 폐쇄망 ${existing} / 묶음 ${json.version}`);
  }

  // 4) 복사한 패키지의 의존 탐색 결과가 묶음과 다르면 그 패키지 안에 넣는다(변화가 없을 때까지)
  const nested = [];
  for (let changed = true; changed;) {
    changed = false;
    for (const [target, source] of [...placed]) {
      for (const dep of depsOf(bundle.get(source).json)) {
        const want = resolveBundle(source, dep);
        if (!want) continue;   // 설치되지 않은 optional 의존
        const wantVersion = bundle.get(want).json.version;
        const got = resolveTarget(target, dep);
        if (got && got.version === wantVersion) continue;
        place(`${target}/node_modules/${dep}`, want);
        nested.push(`${target} → ${dep}@${wantVersion} (찾은 버전 ${got ? got.version : '없음'})`);
        changed = true;
      }
    }
  }

  // 5) 참고: 다른 패키지가 이전 엔진에 의존하는지, peer(react) 확인
  const dependents = [];
  for (const dir of nmDirs.filter((d) => fs.existsSync(d))) {
    for (const [relPath, { name, json }] of listPackages(dir, '', new Map())) {
      if (isEngine(name) || relPath.includes('/node_modules/')) continue;
      const refs = Object.keys({ ...json.dependencies, ...json.peerDependencies }).filter(isEngine);
      if (refs.length) dependents.push(`${path.relative(webRoot, dir)}\\${name}@${json.version} → ${refs.join(', ')}`);
    }
  }
  const react = resolveTarget('', 'react');

  log(`[CKEditor node_modules 복사] ${apply ? '반영' : '미리보기(--apply로 반영)'} · ${webRoot}`);
  log(`- 백업으로 옮길 이전 엔진 폴더 ${moved.length}개`);
  for (const p of moved) log(`    ${p}`);
  log(`- 최상위 복사 ${copies.filter((c) => !c.target.includes('/node_modules/')).length}개 · 같은 버전 재사용 ${reused.length}개 · 다른 버전 유지(덮지 않음) ${conflicts.length}개`);
  for (const c of conflicts) log(`    유지: ${c}`);
  log(`- 패키지 안에 넣는 의존 ${nested.length}개`);
  for (const n of nested) log(`    ${n}`);
  log(`- react(peer): ${react ? `${react.version} (node_modules\\${react.at})` : '없음 — @ckeditor/ckeditor5-react가 동작하지 않음'}`);
  if (dependents.length) {
    log(`- 이전 엔진을 참조하는 다른 패키지 ${dependents.length}개(소스에서 쓰지 않는지 확인)`);
    for (const d of dependents) log(`    ${d}`);
  }
  if (!apply) return;   // 미리보기는 여기서 끝(finally에서 임시 폴더 정리)

  // 6) 반영: 이전 엔진 이동 → 복사(얕은 경로부터) → plan.json·로그
  const backup = path.resolve(opt('--backup-dir') || path.join(path.dirname(webRoot), `${path.basename(webRoot)}_ckeditor-backup-${stamp}`));
  if (fs.existsSync(path.join(backup, 'plan.json'))) throw new Error(`이미 사용한 백업 폴더: ${backup}`);
  fs.mkdirSync(backup, { recursive: true });
  for (const rel of moved) moveDir(path.join(webRoot, rel), path.join(backup, 'moved', rel));
  const copied = [];
  for (const { target, source } of [...copies].sort((a, b) => a.target.length - b.target.length)) {
    const dst = path.join(rootNm, ...target.split('/'));
    fs.cpSync(path.join(bundleNm, ...source.split('/')), dst, { recursive: true, force: false, errorOnExist: false });
    copied.push(path.relative(webRoot, dst));
  }
  fs.writeFileSync(path.join(backup, 'plan.json'), JSON.stringify({ webRoot, time: stamp, moved, copied }, null, 2));

  // 7) 확인: 루트·main에서 탐색되는 ckeditor5·React 래퍼 버전
  const findUp = (from, name) => {
    for (let d = from; ; d = path.dirname(d)) {
      const f = path.join(d, 'node_modules', ...name.split('/'), 'package.json');
      if (fs.existsSync(f)) return `${readJson(f).version} (${path.relative(webRoot, path.dirname(f))})`;
      if (path.dirname(d) === d) return '없음';
    }
  };
  for (const from of [webRoot, path.join(webRoot, 'main')]) {
    log(`- ${path.relative(webRoot, from) || '루트'}: ckeditor5 ${findUp(from, 'ckeditor5')}, @ckeditor/ckeditor5-react ${findUp(from, '@ckeditor/ckeditor5-react')}`);
  }
  log(`반영 완료. 백업: ${backup}`);
  log('다음: main\\.next 삭제 → 개발 서버 재시작 → 자료실·팝업 등록 편집기 확인. 되돌리기: node copy-node-modules.cjs --rollback <백업 폴더>');
  fs.writeFileSync(path.join(backup, `copy-node-modules-${stamp}.log`), logLines.join('\n') + '\n');
}
finally {
  if (temp) fs.rmSync(temp, { recursive: true, force: true });
}
