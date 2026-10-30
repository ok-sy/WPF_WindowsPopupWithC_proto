# 폐쇄망 pnpm workspace package.json / lockfile 불일치 해결 TODO

작성: 2026-10-30 (KST)
상태: **문서 작성만 완료. 폐쇄망 적용·패키지 설치·빌드 검증 미실행.**
대상: 폐쇄망 `front_end`(zero-rule-web 대응) 및 외부망 반입본
연관 문서: `20261030_폐쇄망_FRONT_단계별_반영_체크리스트.md`

## 발생 현상

- CKEditor 반입용 `install-pnpm-store.ps1 -WebRoot <front_end 루트>` 실행 후 pnpm store 반입 단계는 진행됐으나, 내부의 `pnpm install --offline --frozen-lockfile` 단계에서 `ERR_PNPM_OUTDATED_LOCKFILE` 발생.
- 오류에서 처음에는 `<ROOT>/main/package.json`, 이후 `<ROOT>/sub/ui/package.json`의 `specifiers`와 루트 `pnpm-lock.yaml`에 적힌 값이 다르다고 출력.
- 예시로 `@types/eslint`, `@types/react`, `@types/sanitize-html` 등 범위 문자열이 달랐음. `^18.3.1`과 `^18.3.18`은 같은 버전을 설치할 수 있어도 **lockfile의 선언값 검사는 문자열 기준으로 일치해야 함**.
- 폐쇄망에서 `pnpm install --lockfile-only --offline`을 시도하자 `ERR_PNPM_NO_OFFLINE_META`: `@babel/core@7.29.7`, `@svgr/webpack@8.1.0` 관련 레지스트리 메타데이터를 찾지 못해 실패.
- **원인 범위:** 단일 CKEditor 패키지 문제로 단정하지 않고, 폐쇄망 기존 workspace와 외부망 lockfile 간 선언/해결 버전/캐시 불일치를 각각 확인해야 함.

## 1. 폐쇄망 현행 상태 보관

- [ ] 현재 `front_end` 소스 및 `node_modules`/pnpm store 위치 확인, 설치 전 파일 백업.
- [ ] 루트 `package.json`, `main/package.json`, `sub/*/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`을 모두 수집.
- [ ] 외부망 반입본(2026-10-30 `2-zero-rule-web`, 기준 커밋 `93b8e37`)과 파일별 diff 작성. 폐쇄망 자체 수정은 별도 표시.
- [ ] pnpm 버전 확인: 외부망 루트의 `packageManager: pnpm@9.15.2`와 폐쇄망 사용 버전이 일치하는지 확인. Node 버전도 기록.

## 2. workspace 선언값 정합성 확인

- [ ] `pnpm-lock.yaml`의 `importers['.']`, `importers['main']`, `importers['sub/ui']`, 다른 `sub/*`를 각 폴더 `package.json`의 dependencies/devDependencies와 대조.
- [ ] 이름이 같은 패키지마다 **요구 버전 범위(specifier)**, **lockfile이 선택한 실제 버전(version)**, **폐쇄망 기존에 설치된 버전**을 구분해서 표 작성.
- [ ] 특히 사진에 나타난 `sub/ui`의 `@types/eslint`, `@types/react`, `@types/sanitize-html` 및 기타 패키지 선언 비교. 스크린샷으로 확정할 수 없는 행은 실제 파일 대조 후 확정.
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
