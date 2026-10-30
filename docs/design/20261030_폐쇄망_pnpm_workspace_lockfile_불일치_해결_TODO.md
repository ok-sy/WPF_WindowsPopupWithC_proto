# 폐쇄망 pnpm workspace package.json / lockfile 불일치 해결 TODO

작성: 2026-10-30 (KST)
상태: **1·2단계 수집·비교 스크립트 준비(2026-10-30). 폐쇄망 수집·적용·패키지 설치·빌드 검증 미실행.**
대상: 폐쇄망 `front_end`(zero-rule-web 대응) 및 외부망 반입본
연관 문서: `20261030_폐쇄망_FRONT_단계별_반영_체크리스트.md`

## 발생 현상

- CKEditor 반입용 `install-pnpm-store.ps1 -WebRoot <front_end 루트>` 실행 후 pnpm store 반입 단계는 진행됐으나, 내부의 `pnpm install --offline --frozen-lockfile` 단계에서 `ERR_PNPM_OUTDATED_LOCKFILE` 발생.
- 오류에서 `<ROOT>/package.json`, `<ROOT>/main/package.json`, `<ROOT>/sub/ui/package.json`에 이어 **`<ROOT>/sub/eslint-config/package.json`**의 `specifiers`와 루트 `pnpm-lock.yaml`에 적힌 값이 다르다고 출력.
- 추가 사례(`sub/eslint-config`): 스크린샷에 lockfile `next: 15.5.18` / package.json `next: ^15.5.21`, `@next/eslint-plugin-next: ^15.5.18` / `^15.5.21` 불일치가 표시됨. 화면의 일부 줄이 길어 전체 항목은 실제 파일로 확정해야 함.
- 예시로 `@types/eslint`, `@types/react`, `@types/sanitize-html` 등 범위 문자열이 달랐음. `^18.3.1`과 `^18.3.18`은 같은 버전을 설치할 수 있어도 **lockfile의 선언값 검사는 문자열 기준으로 일치해야 함**.
- 폐쇄망에서 `pnpm install --lockfile-only --offline`을 시도하자 `ERR_PNPM_NO_OFFLINE_META`: `@babel/core@7.29.7`, `@svgr/webpack@8.1.0` 관련 레지스트리 메타데이터를 찾지 못해 실패.
- **원인 범위:** 단일 CKEditor 패키지 문제로 단정하지 않고, 폐쇄망 기존 workspace와 외부망 lockfile 간 선언/해결 버전/캐시 불일치를 각각 확인해야 함.

## 1. 폐쇄망 현행 상태 보관

- [ ] 현재 `front_end` 소스 및 `node_modules`/pnpm store 위치 확인, 설치 전 파일 백업.
- [ ] 루트 `package.json`, `main/package.json`, `sub/*/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`을 모두 수집. → `scripts/offline-npm/collect-workspace-manifest.ps1 -WebRoot <front_end 루트>`로 zip 수집(소스·node_modules 제외, pnpm/node 버전·store 경로 포함).
- [ ] 외부망 반입본(2026-10-30 `2-zero-rule-web`, 기준 커밋 `93b8e37`)과 파일별 diff 작성. 폐쇄망 자체 수정은 별도 표시.
- [ ] pnpm 버전 확인: 외부망 루트의 `packageManager: pnpm@9.15.2`와 폐쇄망 사용 버전이 일치하는지 확인. Node 버전도 기록.

## 2. workspace 선언값 정합성 확인

- [ ] 외부망에서 `scripts/offline-npm/compare-workspace-manifest.ps1 -Manifest <수집 zip>` 실행 → `workspace-diff.csv`(workspace×패키지: 폐쇄망/외부망 범위, 양쪽 lockfile 해결 버전, 상태, `ClosedLockOutdated`=반입 lockfile과 폐쇄망 선언 불일치 행).
- [ ] `pnpm-lock.yaml`의 `importers['.']`, `importers['main']`, `importers['sub/ui']`, 다른 `sub/*`를 각 폴더 `package.json`의 dependencies/devDependencies와 대조.
- [ ] 이름이 같은 패키지마다 **요구 버전 범위(specifier)**, **lockfile이 선택한 실제 버전(version)**, **폐쇄망 기존에 설치된 버전**을 구분해서 표 작성.
- [ ] 특히 사진에 나타난 `sub/ui`의 `@types/eslint`, `@types/react`, `@types/sanitize-html` 및 기타 패키지 선언 비교.
- [ ] `sub/eslint-config/package.json`의 `next`, `@next/eslint-plugin-next`, ESLint 관련 dependencies/devDependencies와 lockfile `importers['sub/eslint-config']` 대조.
- [ ] `sub/typescript-config`를 포함한 나머지 `sub/*` 전부 검사하여 오류가 다음 workspace로 반복되지 않게 한다. 스크린샷으로 확정할 수 없는 행은 실제 파일 대조 후 확정.
- [ ] 외부망 버전 적용이 필요한 패키지(Next/Turbopack·MUI·CKEditor)와 폐쇄망 기존 유지 대상(업무용 수정·의존성)을 결정. 무조건 `package.json` 전체를 외부망 버전으로 덮지 않음.
- [ ] workspace 전체에서 요구하는 동일 패키지의 버전 호환성/peer dependencies 확인.

## 3. 동일한 package.json 세트로 lockfile 생성

- [ ] 2단계에서 결정된 **실제 폐쇄망 적용 예정의 모든 workspace package.json**과 기존 pnpm 설정/lockfile을 인터넷 가능한 작업 PC로 복사.
- [ ] 동일 pnpm 버전(9.15.2)으로 프로젝트 루트에서 `pnpm install --lockfile-only --no-frozen-lockfile` 실행.
- [ ] 결과 `pnpm-lock.yaml` diff 검토: 의도하지 않은 패키지 추가·버전 변경·워크스페이스 제외·구형 CKEditor 재등장 여부 확인.
- [ ] 대상 CKEditor는 `ckeditor5@49.0.1`, `@ckeditor/ckeditor5-react@12.0.0`로 맞추고, 이전 커스텀 엔진과 중복 실행하지 않도록 정리.
- [ ] **폐쇄망에서 `--no-frozen-lockfile`로 급히 설치하며 lockfile을 바꾸는 것을 기본 해결책으로 삼지 않음**. `--lockfile-only --offline`도 메타데이터가 부족하면 실패할 수 있음.

## 4. 필요한 오프라인 패키지 준비

- [ ] 최종 lockfile을 기준으로 인터넷 PC에서 `pnpm fetch` 또는 `pnpm install`을 실행해 **전체 프로젝트에 필요한 pnpm store**를 채운다. 명령은 사용하는 store 경로/설정에 맞춰 실행.
- [ ] CKEditor 전용 `5-npm-ckeditor` 캐시는 177개 패키지 묶음이며, 다른 패키지를 전부 포함하는 것은 아님. `ERR_PNPM_NO_OFFLINE_TARBALL` 발생 시 해당 이름/버전의 추가 캐시를 준비.
- [ ] 최종 lockfile, package.json 세트, 추가 캐시, CKEditor 묶음, 적용 설명/체크섬을 같은 반입 단위로 묶는다.
- [ ] 가능하면 인터넷 차단된 깨끗한 테스트 폴더에서 실제 `pnpm install --offline --frozen-lockfile` 성공 확인 후 폐쇄망 반입.

## 5. 폐쇄망 반영·검증

- [ ] 확정된 package.json 세트와 lockfile을 기존 수정사항과 병합하고, pnpm store를 반입한다.
- [ ] `front_end` 루트에서 `pnpm install --offline --frozen-lockfile` 실행, `ERR_PNPM_OUTDATED_LOCKFILE`·`ERR_PNPM_NO_OFFLINE_META`·`ERR_PNPM_NO_OFFLINE_TARBALL` 미발생 확인.
- [ ] `main`에서 `pnpm list ckeditor5 @ckeditor/ckeditor5-react --depth 0`로 버전 확인.
- [ ] Turbopack(`pnpm dev`)·MUI 메뉴 아이콘·게시판 CKEditor·팝업 RichText 등 단계별 확인.
- [ ] `pnpm type-check`, `pnpm build` 및 로그인 화면을 확인하고 결과/미완료를 변경 이력에 기록.
- [ ] 설치 성공을 이유로 외부망/폐쇄망 의존성 차이가 없다고 단정하지 않음. 최종 diff와 재현 가능한 lockfile 보관.

## 6. 별도 대응: node_modules 직접 복사 환경에서 CKEditor 교체

**현장 확인(2026-10-30, 개발자 명령 결과):**
- 폐쇄망 `front_end` 루트에서 `require('ckeditor5/package.json').version` → **44.3.0**.
- `require('@ckeditor/ckeditor5-react/package.json').version` → **5.1.0**.
- `require.resolve()`가 실제 경로를 반환함. 확인한 `node_modules/@ckeditor/ckeditor5-core`, `node_modules/ckeditor5`, `node_modules/@ckeditor/ckeditor5-react`의 `Get-Item ... | Select LinkType`은 비어 있음.
- `pnpm why`는 출력 없음. **해당 항목들이 일반 폴더로 존재함은 확인**, 다만 모든 의존성이 수동 복사됐는지, 다른 폴더의 링크·설치 이력까지 확정되는 것은 아님.
- 기존 프로젝트가 `node_modules`에 필요한 패키지 폴더를 수동 복사해 쓰는 방식이라는 현장 정황. 따라서 **수동 복사 경로를 별도 검증**한다. 이 경로에서는 `pnpm install --frozen-lockfile`의 lockfile 오류가 복사 단계 자체를 막지는 않지만, 의존성·실행 정상 여부 검증은 필수다.

### 6-1. 사전 조사 및 백업
- [ ] 기존 `node_modules`, `package.json`, `pnpm-lock.yaml`을 백업하고, 기존 서비스/개발 화면 구동 기준을 기록.
- [ ] `require.resolve('ckeditor5')`, `require.resolve('@ckeditor/ckeditor5-react')`가 가리키는 **실제 경로** 및 `ckeditor5/package.json`·React 래퍼 버전 기록. 루트/main의 모듈 검색 위치 차이도 확인.
- [ ] 관련 `@ckeditor/*` 패키지·`ckeditor5`·구형 커스텀 빌드의 실제 사용처(import/require) 전수 확인; 다른 기존 화면이 이전 엔진에 의존하는지 점검.
- [ ] 별도 프로젝트/백업 폴더에서 새 엔진 전환을 먼저 실험. 현재 동작하는 node_modules를 바로 삭제하거나 덮어쓰지 않는다.

### 6-2. 직접 복사 반입 경로(설치 방식 미확정 시 대안)
- 도구(2026-10-30): 외부망 `node scripts/prepare-offline-node-modules.cjs`(npm 묶음 store로 hoisted 설치 → 링크 없는 트리, peer 제외) → `node_modules-ckeditor.tgz`·`NODE-MODULES.txt`. 폐쇄망 `node copy-node-modules.cjs --web-root <front_end>`(기본 미리보기, `--apply` 반영, `--rollback <백업>`): 이전 엔진을 루트·main·sub/* node_modules에서 백업 폴더로 이동, 없으면 복사·같은 버전 재사용·다른 버전은 덮지 않고 필요한 패키지 안 node_modules에 배치(Node 탐색 규칙으로 계산). 가상 폐쇄망 구조로 반영→webpack 번들→되돌리기 확인, 폐쇄망 실행 미실행.
- [ ] 외부망에서 최종 소스와 동일한 **Node/pnpm 환경 및 lockfile**로 의존성을 갖춘 반입용 디렉터리 준비. CKEditor만이 아니라 실제 런타임 의존 전체 및 패키지 내부 참조를 확인.
- [ ] **필요한 패키지와 의존성 전체**를 목록화. `ckeditor5@49.0.1`과 `@ckeditor/ckeditor5-react@12.0.0`뿐 아니라 필요한 `@ckeditor/*` 및 타 패키지 의존성 포함; 구버전 44.3.0/5.1.0과 실행 경로가 섞이지 않게 함.
- [ ] 직접 복사 방식은 실제 구조(일반 디렉터리/심볼릭 링크/하드 링크)를 검사하고 **의존 패키지 해석까지 가능한 결과물**만 반입. pnpm store 폴더 복사만으로 완성된 node_modules라고 가정하지 않음.
- [ ] **전환 소스 동시 반입:** `src/components/ckeditor/{index.ts,ckeditorEngine.ts}`, `CommonCKEditor.tsx`, `PopupRichTextEditor.tsx` 및 호출부. 게시판만 새 버전·팝업은 구형 엔진을 사용하는 중간 상태로 실행하지 않음.
- [ ] 소스상 `@cp949/ckeditor5-custom-build` 및 직접 `@ckeditor/ckeditor5-* ` 호출 여부 확인. 불필요한 이전 엔진 제거는 사용처/복구 경로를 확인한 후 실시.
- [ ] **권장 대안:** 직접 복사 방식보다 재현성이 높은 `pnpm install --offline --frozen-lockfile`은 별도 해결 경로(1~5단계)로 유지. 둘 중 한 방식을 검증해 선택하고 무작정 혼용하지 않는다.

### 6-3. 반영 후 검증
- [ ] 루트와 `main`에서 `require.resolve` 및 패키지 버전 확인: `ckeditor5 49.0.1`, `@ckeditor/ckeditor5-react 12.0.0`. 해석 실패 시 모듈 경로/내부 의존성부터 확인.
- [ ] 게시판·자료실(Common/Bbs)와 팝업(PopupRich)이 **동일한 엔진 경로**를 사용함을 확인.
- [ ] 기존 웹 → 자료실 → 팝업 등록 → 자료실(반대 순서도) 화면 이동·한글 입력·붙여넣기·서식·소스 편집·미리보기 확인.
- [ ] 브라우저 콘솔의 `ckeditor-duplicated-modules`, 플러그인/라이선스/모듈 탐색 오류가 없는지 확인.
- [ ] Turbopack 개발 실행 및 `pnpm build` webpack 빌드, TypeScript 검사. 실패 시 백업으로 복구 가능해야 한다.
- [ ] 선택한 배포 방식(직접 복사 또는 pnpm 설치), 반입 패키지 목록·버전·파일 경로·검증 결과를 기록.

## 참고 명령 (인터넷 연결 PC에서 lockfile 생성)

```powershell
cd D:\work\front_end
pnpm -v
pnpm install --lockfile-only --no-frozen-lockfile
git diff -- package.json pnpm-lock.yaml main/package.json sub
pnpm fetch
```

## 완료 기준

- [ ] 폐쇄망에서 유지할 package.json 전체에 대해 lockfile의 importer specifier가 일치한다.
- [ ] 동일 lockfile + 오프라인 store만으로 설치 재현 성공.
- [ ] CKEditor 패키지 중복 문제 없이 기존 화면·신규 공통 컴포넌트 화면 확인.
- [ ] 변경 버전, 유지 버전, 설치 로그, type-check/build 결과를 남긴다.
