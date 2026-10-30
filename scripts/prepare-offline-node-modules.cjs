// POL-15-01 : 배포 범위
// ■ 폐쇄망 반입용 CKEditor node_modules 복사본 생성(pnpm 설치를 쓰지 않는 폐쇄망용)
// - in : prepare-offline-npm.cjs가 만든 npm 묶음 폴더(pnpm-store-v3.tgz, package.json, pnpm-lock.yaml)
// - out: 같은 폴더에 node_modules-ckeditor.tgz(일반 폴더 node_modules 트리), NODE-MODULES.txt(경로·이름@버전),
//        copy-node-modules.cjs(폐쇄망 복사 스크립트)
// - 폐쇄망 front_end는 pnpm install 없이 node_modules에 패키지 폴더를 직접 복사해 쓴다(링크 없음).
//   그래서 묶음 store로 hoisted(평면) 방식 설치를 한 번 해서 링크 없는 실제 폴더 트리를 만든다.
// - peer 의존(react 등)은 폐쇄망 프로젝트의 것을 써야 하므로 넣지 않는다. 두 패키지에서 dependencies·
//   optionalDependencies로 닿는 패키지만 남긴다(react가 두 벌이면 hook 오류가 난다).
// [사용] 저장소 루트에서(인터넷 불필요): node scripts/prepare-offline-node-modules.cjs [묶음 폴더=.offline-cache/npm-ckeditor/bundle]
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const bundle = path.resolve(root, process.argv[2] || '.offline-cache/npm-ckeditor/bundle');
const work = path.join(path.dirname(bundle), 'work-node-modules');
const PNPM = 'npx -y pnpm@9.15.2';
// Windows 기본 tar(bsdtar). PATH의 GNU tar(Git Bash)는 'D:\...'를 원격 호스트로 해석해 실패한다.
const TAR = process.platform === 'win32' ? `"${path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')}"` : 'tar';
const run = (command, cwd) => execSync(command, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

for (const f of ['pnpm-store-v3.tgz', 'package.json', 'pnpm-lock.yaml']) {
  if (!fs.existsSync(path.join(bundle, f))) throw new Error(`묶음 파일 없음: ${f} (먼저 node scripts/prepare-offline-npm.cjs 실행)`);
}
const roots = Object.keys(readJson(path.join(bundle, 'package.json')).dependencies);

// 1) 묶음 store만으로 hoisted 설치(파일은 복사 방식, 설치 스크립트 실행 안 함)
fs.rmSync(work, { recursive: true, force: true });
const project = path.join(work, 'project');
const store = path.join(work, 'store');
fs.mkdirSync(project, { recursive: true });
fs.mkdirSync(store, { recursive: true });
run(`${TAR} -xzf "${path.join(bundle, 'pnpm-store-v3.tgz')}" -C "${store}"`, work);
for (const f of ['package.json', 'pnpm-lock.yaml']) fs.copyFileSync(path.join(bundle, f), path.join(project, f));
run(`${PNPM} install --offline --frozen-lockfile --ignore-scripts --store-dir "${store}" --config.node-linker=hoisted --config.package-import-method=copy`, project);
const nm = path.join(project, 'node_modules');
console.log('[1/4] 묶음 store로 hoisted 설치');

// 2) 트리의 패키지 위치 수집. 상대 경로 예: "ckeditor5", "@ckeditor/ckeditor5-ui/node_modules/x"
function listPackages(dir, rel, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.')) continue;   // .bin, .modules.yaml, .pnpm 등 설치 도구 파일
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
const all = listPackages(nm, '', new Map());

// Node 모듈 탐색 규칙: 자기 node_modules → 상위 패키지 node_modules → … → 최상위
function resolveFrom(relPath, dep) {
  let base = relPath;
  while (true) {
    const candidate = base ? `${base}/node_modules/${dep}` : dep;
    if (all.has(candidate)) return candidate;
    if (!base) return null;
    const i = base.lastIndexOf('/node_modules/');
    base = i < 0 ? '' : base.slice(0, i);
  }
}

// 3) 두 패키지에서 dependencies·optionalDependencies로 닿는 위치만 남김(peer 의존 제외)
const keep = new Set();
const stack = roots.map((r) => resolveFrom('', r));
while (stack.length) {
  const relPath = stack.pop();
  if (!relPath || keep.has(relPath)) continue;
  keep.add(relPath);
  const { json } = all.get(relPath);
  for (const dep of Object.keys({ ...json.dependencies, ...json.optionalDependencies })) {
    const found = resolveFrom(relPath, dep);
    if (!found && !(json.optionalDependencies || {})[dep]) throw new Error(`의존 패키지 없음: ${relPath} → ${dep}`);
    stack.push(found);
  }
}
const removed = [...all.keys()].filter((p) => !keep.has(p)).sort((a, b) => b.length - a.length);
for (const relPath of removed) fs.rmSync(path.join(nm, ...relPath.split('/')), { recursive: true, force: true });
for (const entry of fs.readdirSync(nm)) if (entry.startsWith('.')) fs.rmSync(path.join(nm, entry), { recursive: true, force: true });
for (const entry of fs.readdirSync(nm)) {   // 비게 된 scope 폴더 정리
  if (entry.startsWith('@') && fs.readdirSync(path.join(nm, entry)).length === 0) fs.rmdirSync(path.join(nm, entry));
}
console.log(`[2/4] 남긴 위치 ${keep.size}개, 제외 ${removed.length}개(peer 의존: ${removed.filter((p) => !p.includes('/node_modules/')).join(', ') || '없음'})`);

// 4) 묶음 생성: 트리 tgz, 목록, 폐쇄망 복사 스크립트
const lines = [...keep].sort().map((p) => `${p}\t${all.get(p).name}@${all.get(p).json.version}`);
fs.writeFileSync(path.join(bundle, 'NODE-MODULES.txt'), lines.join('\n') + '\n');
run(`${TAR} -czf "${path.join(bundle, 'node_modules-ckeditor.tgz')}" -C "${project}" node_modules`, work);
fs.copyFileSync(path.join(__dirname, 'offline-npm', 'copy-node-modules.cjs'), path.join(bundle, 'copy-node-modules.cjs'));
const ck = all.get('ckeditor5').json.version, react = all.get('@ckeditor/ckeditor5-react').json.version;
console.log(`[3/4] node_modules-ckeditor.tgz(ckeditor5 ${ck}, @ckeditor/ckeditor5-react ${react}), NODE-MODULES.txt ${lines.length}줄`);
fs.rmSync(work, { recursive: true, force: true });
console.log(`[4/4] 완료: ${bundle}`);
