# 폐쇄망 관리자 WEB — Nginx 정적 Export 배포 방식 고정 TODO

작성: 2026-11-13 (KST)
상태: **빌드 설정 고정·로컬 빌드 검증 완료(2026-11-13) / 폐쇄망 Nginx 실환경 검증 대기**
범위: `zero-rule-web/main` 관리자 WEB. 최초 작성 시 문서만 변경했고, 2026-11-13 후속 작업에서 빌드 설정을 수정했다. 폐쇄망 반입·Nginx 설정 변경은 수행하지 않는다.

## 1. 확정 배포 정책

- 폐쇄망 관리자 WEB은 Next.js 정적 Export 결과물인 **`zero-rule-web/main/out/`의 내용**을 Nginx 정적 서빙 경로에 복사해 제공한다.
- **`standalone` 배포를 사용하지 않는다.** `.next/standalone`의 Node.js 실행 서버를 폐쇄망 배포 대상으로 삼지 않는다.
- Next.js 빌드 시 `output: 'export'`가 선택되어야 한다. `out/`은 빌드 산출물이며 Git 형상에 포함하지 않는다.
- `out/` 전체를 Nginx 정적 루트에 맞게 반영한다. `.next/` 또는 `.next/standalone/`만 복사하는 방식과 혼용하지 않는다.

## 2. Git 형상 기준 확인 사항

- `zero-rule-web/main/next.config.mjs`: `const PRODUCTION = process.env.NODE_ENV === 'standalone'` 및 `output: PRODUCTION ? 'export' : 'standalone'` 조건이 존재한다. **현재 조건은 일반적인 `next build`의 `NODE_ENV=production`과 일치하지 않아 standalone을 선택할 가능성이 있으므로 정책과 불일치한다.** 구현 시 실제 빌드 환경변수·출력 결과를 확인하고 정적 Export로 고정할 것.
- `zero-rule-web/main/package.json`: `build: next build`.
- `zero-rule-web/package.json`: 루트 `build: turbo build`. 루트/ main 실행별 실제 대상 workspace 및 최종 산출물 위치를 검증한다.
- `zero-rule-web/main/next.config.mjs`의 `devSceneEnv(phase)`는 개발 서버 이외의 빌드에서 화면 그룹을 제외하지 않도록 의도되어 있으므로 `scene-router.tsx` 포함 여부를 정적 산출물에서 확인한다.

## 3. 구현 시 확인할 사항

- [x] **설정 정합성**: `next.config.mjs`의 `PRODUCTION`/ `output` 분기를 확인하고 폐쇄망 배포 빌드가 반드시 `export`를 선택하도록 수정 범위 결정. 개발 서버 동작·환경별 URL·basePath·trailingSlash는 영향 확인 후 유지.
- [x] **빌드·산출물**: `main` 직접 빌드와 루트 Turbo 빌드 각각에서 `main/out/index.html`, `_next/static`, 필요한 화면 경로 파일의 생성/갱신 시각을 확인한다. 빌드 성공 메시지만으로 Export 성공을 판정하지 않는다.
- [x] **정적 호환성**: 서버 전용 기능(API routes, SSR, 동적 서버 렌더링, Next rewrites/redirects 등)이 필요한 페이지가 없는지 확인. 브라우저에서 호출하는 Java API는 기존 계약을 유지한다.
- [ ] **Nginx 반영**: 실제 `root`/`alias`, URL 하위 경로, `trailingSlash`, 새로고침, 404, 정적 자산 캐시 및 교체 시 이전 파일 잔존 여부를 확인한다. Nginx 설정 변경은 실설정 확인 후 별도 승인.
- [ ] **회귀**: `SceneRouter` 변경 화면, 로그인, 팝업 등록/미리보기, CSS·SVG·CKEditor, API 호출을 실제 정적 배포 경로에서 확인한다. 개발 서버에서 정상 표시된 사실을 배포 검증으로 대체하지 않는다.

## 4. 완료 기준·영향 범위

- **관리자 WEB**: 빌드 결과가 `main/out/`에 생성되고 최신 소스 변경을 포함하며 Nginx에서 정상 제공된다.
- **서버·DB / WPF / API 계약**: 이번 배포 방식 정의로 변경하지 않는다. Java API의 브라우저 호출 경로·CORS 등은 정적 배포 회귀 검증 대상으로만 둔다.
- 로컬 코드/타입 검사, 실제 빌드, 폐쇄망 Nginx 실화면은 각각 수행 여부와 결과를 분리 기록한다.
- 구현 전 추가 결정: 없음. 구체적인 Nginx 실제 경로·환경변수 값은 폐쇄망 환경 확인 사항이며 임의로 정하지 않는다.

## 5. 구현 결과 (2026-11-13)

- **설정:** `main/next.config.mjs`의 `PRODUCTION = NODE_ENV === 'standalone'` 조건을 제거하고 `output: 'export'`로 고정했다. `basePath: ''`(루트 제공, Nginx 하위 경로 제공 시 변경 지점 주석)·`trailingSlash: true`·`publicRuntimeConfig`는 유지했다.
- **Turbo 캐시:** `zero-rule-web/turbo.json`의 build `outputs`에 `out/**`를 추가했다. 기존에는 `.next/**`만 캐시 대상이라 Turbo 캐시 적중 시 `main/out/`이 복원되지 않거나 이전 산출물이 남을 수 있었다.
- **빌드·산출물(로컬):** `main`에서 `npx next build` 성공(전 페이지 `○ Static`), `main/out/index.html`·`_next/static`·화면 경로별 `index.html` 생성 확인. 루트 `npx turbo build`(캐시 0) 성공 후 `out/` 파일 시각이 빌드 시각으로 갱신되고 최신 소스 변경(미리보기 시청 비율 슬라이더 삭제)이 번들에 반영된 것을 확인. `.next/standalone/` 미생성. `out/index.html`의 `__NEXT_DATA__.runtimeConfig`에 `publicRuntimeConfig` 값이 포함됨을 확인(빌드 시 환경변수 `API_BASE_URL` 등은 빌드 환경에서 넣어야 함).
- **정적 호환성:** Pages Router 구성이며 `getServerSideProps`·API routes·middleware 없음. `_document`의 `getInitialProps`는 빌드 시 렌더로 처리된다. 동적 경로 `pds/edit/[pdsId]`는 `out/pds/edit/[pdsId]/index.html`로만 생성되므로 **Nginx에서 해당 경로 직접 접근·새로고침 시 이 파일로 넘기는 `try_files`/rewrite가 필요한지** 실환경에서 확인한다(클라이언트 이동은 영향 없음).
- **미실행:** 폐쇄망 Nginx 실제 `root`/`alias`·새로고침·404·캐시·이전 파일 잔존 확인, 정적 배포 경로에서의 로그인·팝업 등록/미리보기·CKEditor·API 호출 회귀.
