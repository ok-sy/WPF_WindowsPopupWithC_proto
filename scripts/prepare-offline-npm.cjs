// POL-15-01 : 배포 범위
// ■ 폐쇄망 반입용 npm 패키지 묶음 생성(CKEditor 5 공통 엔진 + Next.js)
// - in : zero-rule-web/pnpm-lock.yaml(프로젝트 lockfile), 인터넷 연결(npm registry)
// - out: <출력 폴더>\ — pnpm-store-v3.tgz(pnpm 오프라인 캐시 = store), PACKAGES.txt(이름@버전·무결성),
//        package.json·pnpm-lock.yaml(묶음 확인용 최소 프로젝트), install-pnpm-store.ps1, collect-workspace-manifest.ps1, README-NPM.md,
//        node_modules-ckeditor.tgz·NODE-MODULES.txt·copy-node-modules.cjs(폴더 복사용, prepare-offline-node-modules.cjs)
// - 폐쇄망에는 사내 npm 저장소가 없으므로 pnpm store(오프라인 캐시)를 반입해 `pnpm install --offline`으로 설치한다.
// - lockfile에서 ckeditor5·@ckeditor/ckeditor5-react·next·@next/eslint-plugin-next가 실제로 쓰는 패키지(전이 의존 포함)만 뽑아
//   버전을 lockfile과 똑같이 맞춘다. next는 main·sub 버전 통일(15.5.21)로 폐쇄망 node_modules 교체가 필요해 포함한다.
// - 플랫폼별 패키지(@next/swc-*, @img/sharp-*)는 폐쇄망 개발 PC(Windows x64)와 Linux x64(glibc) 것만 넣는다(TARGET).
//   폐쇄망 Linux가 Windows에서 만든 node_modules를 그대로 쓰므로 두 OS 바이너리를 함께 둔다.
//   pnpm은 프로젝트 지정 버전(package.json packageManager, pnpm@9.15.2)으로 실행해 폐쇄망과 같은 store 형식(v3)을 만든다.
// - 검사: registry 원본 tarball(작업 폴더에서만 받음)의 sha512가 lockfile integrity와 일치, 만든 store만으로 네트워크 없이 설치(--offline)되는지 확인.
// [사용] 저장소 루트에서(인터넷 PC): node scripts/prepare-offline-npm.cjs [출력 폴더=.offline-cache/npm-ckeditor/bundle]
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const web = path.join(root, 'zero-rule-web');
const out = path.resolve(root, process.argv[2] || '.offline-cache/npm-ckeditor/bundle');
const work = path.join(path.dirname(out), 'work');
const PNPM = 'npx -y pnpm@9.15.2';
// Windows 기본 tar(bsdtar). PATH의 GNU tar(Git Bash)는 'D:\...'를 원격 호스트로 해석해 실패한다.
const TAR = process.platform === 'win32' ? `"${path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')}"` : 'tar';
const ROOT_PACKAGES = ['ckeditor5', '@ckeditor/ckeditor5-react', 'next', '@next/eslint-plugin-next'];
// 플랫폼별 패키지를 넣을 대상. pnpm supportedArchitectures와 같은 값(묶음 package.json의 pnpm 필드로 전달)
const TARGET = { os: ['win32', 'linux'], cpu: ['x64'], libc: ['glibc'] };
// lockfile packages 항목의 os·cpu·libc 조건이 TARGET 중 하나라도 맞는지('!x'는 제외 조건)
const fits = (list, allowed) => !list || list.some((v) => (v.startsWith('!') ? allowed.some((a) => a !== v.slice(1)) : allowed.includes(v)));
const forTarget = (p) => { const e = lock.packages[p] || {}; return fits(e.os, TARGET.os) && fits(e.cpu, TARGET.cpu) && fits(e.libc, TARGET.libc); };
const run = (command, cwd) => execSync(command, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const yaml = require(path.join(web, 'node_modules/js-yaml'));

// 1) lockfile에서 의존 범위 계산
const lock = yaml.load(fs.readFileSync(path.join(web, 'pnpm-lock.yaml'), 'utf8'));
const roots = {};
for (const importer of Object.values(lock.importers)) {
  for (const group of ['dependencies', 'devDependencies']) {
    for (const [name, dep] of Object.entries(importer[group] || {})) if (ROOT_PACKAGES.includes(name)) roots[name] = dep;
  }
}
if (Object.keys(roots).length !== ROOT_PACKAGES.length) throw new Error('lockfile에 대상 패키지 없음: ' + JSON.stringify(Object.keys(roots)));
const seen = new Set();
const stack = Object.entries(roots).map(([name, dep]) => `${name}@${dep.version}`);
while (stack.length) {
  const key = stack.pop();
  if (seen.has(key)) continue;
  const snapshot = lock.snapshots[key];
  if (!snapshot) throw new Error('lockfile snapshot 없음: ' + key);
  seen.add(key);
  for (const group of ['dependencies', 'optionalDependencies']) {
    for (const [name, version] of Object.entries(snapshot[group] || {})) stack.push(`${name}@${version}`);
  }
}
const allPackages = [...new Set([...seen].map((key) => key.replace(/\(.*$/, '')))].sort();
const packages = allPackages.filter(forTarget);   // 실제로 받는 패키지(다른 플랫폼 바이너리 제외)
console.log(`[1/5] 대상 ${Object.entries(roots).map(([n, d]) => `${n}@${d.version}`).join(', ')} → 패키지 ${packages.length}개(다른 플랫폼 제외 ${allPackages.length - packages.length}개)`);

// 2) 최소 프로젝트(package.json·pnpm-lock.yaml)
fs.rmSync(out, { recursive: true, force: true });
fs.rmSync(work, { recursive: true, force: true });
const tarballs = path.join(work, 'tarballs');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(tarballs, { recursive: true });
const mini = {
  lockfileVersion: lock.lockfileVersion, settings: lock.settings,
  importers: { '.': { dependencies: Object.fromEntries(Object.entries(roots).map(([n, d]) => [n, { specifier: d.specifier, version: d.version }])) } },
  packages: Object.fromEntries(allPackages.map((p) => [p, lock.packages[p]])),
  snapshots: Object.fromEntries([...seen].sort().map((k) => [k, lock.snapshots[k]])),
};
const manifest = {
  name: 'zero-rule-web-offline-bundle', private: true,
  dependencies: Object.fromEntries(Object.entries(roots).map(([n, d]) => [n, d.specifier])),
  pnpm: { supportedArchitectures: TARGET },
};
for (const dir of [out, path.join(work, 'project')]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), yaml.dump(mini, { lineWidth: -1 }));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
}
fs.writeFileSync(path.join(out, 'PACKAGES.txt'), packages.map((p) => `${p}\t${lock.packages[p].resolution.integrity}`).join('\n') + '\n');

// 3) pnpm store(v3) 생성 → pnpm-store-v3.tgz
const store = path.join(work, 'store');
run(`${PNPM} fetch --store-dir "${store}" --config.node-linker=hoisted`, path.join(work, 'project'));
run(`${TAR} -czf "${path.join(out, 'pnpm-store-v3.tgz')}" -C "${store}" v3`, work);
console.log('[2/5] pnpm store 생성 → pnpm-store-v3.tgz');

// 4) 무결성 대조용 registry 원본 tarball(작업 폴더에만 받고 반입본에는 넣지 않음)
for (const p of packages) run(`npm pack "${p}" --pack-destination "${tarballs}" --silent`, work);
console.log(`[3/5] 대조용 tarball ${fs.readdirSync(tarballs).length}개`);

// 5) 검사: tarball 무결성 = lockfile integrity, store만으로 오프라인 설치
const want = new Map(packages.map((p) => [lock.packages[p].resolution.integrity, p]));
for (const file of fs.readdirSync(tarballs)) {
  const integrity = 'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(path.join(tarballs, file))).digest('base64');
  if (!want.delete(integrity)) throw new Error('lockfile에 없는 tarball: ' + file);
}
if (want.size) throw new Error('tarball 누락: ' + [...want.values()].join(', '));
console.log('[4/5] tarball 무결성 = lockfile integrity 모두 일치');
const verify = path.join(work, 'verify');
const verifyStore = path.join(work, 'verify-store');
fs.mkdirSync(verify, { recursive: true });
fs.mkdirSync(verifyStore, { recursive: true });
run(`${TAR} -xzf "${path.join(out, 'pnpm-store-v3.tgz')}" -C "${verifyStore}"`, work);
fs.copyFileSync(path.join(out, 'package.json'), path.join(verify, 'package.json'));
fs.copyFileSync(path.join(out, 'pnpm-lock.yaml'), path.join(verify, 'pnpm-lock.yaml'));
run(`${PNPM} install --offline --frozen-lockfile --store-dir "${verifyStore}" --config.node-linker=hoisted`, verify);
const installed = {};
for (const name of ROOT_PACKAGES) {
  installed[name] = require(path.join(verify, 'node_modules', ...name.split('/'), 'package.json')).version;
  if (installed[name] !== roots[name].version.replace(/\(.*$/, '')) throw new Error(`오프라인 설치 버전 불일치: ${name} ${installed[name]}`);
}
for (const swc of ['@next/swc-win32-x64-msvc', '@next/swc-linux-x64-gnu']) {
  if (!fs.existsSync(path.join(verify, 'node_modules', ...swc.split('/'), 'package.json'))) throw new Error('SWC 바이너리 없음: ' + swc);
}
console.log(`[5/5] 묶음 store만으로 오프라인 설치 성공(${Object.entries(installed).map(([n, v]) => `${n} ${v}`).join(', ')}, SWC win32·linux)`);

// 폐쇄망 설치 스크립트·안내
for (const file of ['install-pnpm-store.ps1', 'collect-workspace-manifest.ps1', 'README-NPM.md']) {
  fs.copyFileSync(path.join(__dirname, 'offline-npm', file), path.join(out, file));
}
fs.rmSync(work, { recursive: true, force: true });
// pnpm 설치 없이 node_modules를 폴더째 복사해 쓰는 폐쇄망용 복사본(node_modules-ckeditor.tgz)도 같은 묶음에 만든다
execSync(`node "${path.join(__dirname, 'prepare-offline-node-modules.cjs')}" "${out}"`, { stdio: 'inherit' });
console.log('Done: ' + out);
