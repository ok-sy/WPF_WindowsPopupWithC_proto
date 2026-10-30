# CKEditor 5 npm 오프라인 캐시(pnpm store)

관리자 웹 서식 편집기가 `ckeditor5` 49.0.1 + `@ckeditor/ckeditor5-react` 12.0.0으로 바뀌어, 폐쇄망 pnpm store에 없는 패키지가 생겼습니다.
이 묶음은 두 패키지와 그 의존 패키지 전체를 pnpm store(오프라인 캐시) 형식으로 담고 있습니다. 사내 npm 저장소 없이 설치할 수 있습니다.

| 파일 | 용도 |
|---|---|
| `pnpm-store-v3.tgz` | pnpm 9 store(v3). 폐쇄망 pnpm store에 추가합니다 |
| `install-pnpm-store.ps1` | store 추가 + `pnpm install --offline` 실행 |
| `collect-workspace-manifest.ps1` | lockfile 불일치 분석용으로 workspace의 package.json·lockfile·pnpm/node 버전을 zip으로 수집 |
| `node_modules-ckeditor.tgz` | pnpm 설치 없이 폴더째 복사하는 환경용 node_modules 트리(링크 없는 일반 폴더, react 등 peer 제외) |
| `copy-node-modules.cjs` | 위 트리를 front_end `node_modules`에 충돌 없이 배치(미리보기·반영·되돌리기) |
| `NODE-MODULES.txt` | 트리 안 패키지 위치와 이름@버전 |
| `PACKAGES.txt` | 들어 있는 패키지 이름@버전과 무결성 값(lockfile과 같음) |
| `package.json`, `pnpm-lock.yaml` | 묶음만으로 설치되는지 확인하는 최소 프로젝트 |

## 설치

1. 2-zero-rule-web.tar를 반입해 zero-rule-web의 `package.json`·`pnpm-lock.yaml`을 먼저 반영합니다.
2. 이 폴더에서 실행합니다.

```powershell
.\install-pnpm-store.ps1 -WebRoot D:\경로\zero-rule-web
```

- `pnpm store path`로 찾은 store에 없는 파일만 추가합니다. 기존 파일은 그대로 둡니다.
- 이어서 zero-rule-web에서 `pnpm install --offline --frozen-lockfile`을 실행합니다.
- store 경로를 직접 정하려면 `-StoreDir D:\pnpm-store`를 붙입니다. store만 추가하려면 `-SkipInstall`을 붙입니다.

## 설치(node_modules를 폴더째 복사해 쓰는 경우)

pnpm install을 쓰지 않고 `node_modules`에 패키지 폴더를 직접 복사해 쓰는 환경에서는 위 설치 대신 이 방법을 씁니다. 두 방법을 섞지 않습니다.

```powershell
node copy-node-modules.cjs --web-root D:\경로\front_end            # 미리보기(변경 없음)
node copy-node-modules.cjs --web-root D:\경로\front_end --apply    # 반영
node copy-node-modules.cjs --rollback D:\경로\front_end_ckeditor-backup-<시각>   # 되돌리기
```

- 루트·`main`·`sub/*`의 `node_modules`에 있는 이전 엔진(`ckeditor5`, `@ckeditor/*`)을 백업 폴더(기본: front_end 옆 `front_end_ckeditor-backup-<시각>`)로 옮깁니다. 두 엔진이 섞이면 `ckeditor-duplicated-modules` 오류가 나기 때문입니다.
- 묶음 패키지가 루트에 없으면 복사하고, 같은 버전이 있으면 그대로 씁니다. **다른 버전이 있으면 덮지 않고**, 그 패키지가 필요한 CKEditor 쪽 패키지 안 `node_modules`에 넣습니다(기존 화면 영향 없음).
- react는 front_end의 것을 씁니다. 미리보기에 react 버전과, 이전 엔진을 참조하는 다른 패키지(예: `@cp949/ckeditor5-custom-build`)가 나오면 소스에서 쓰지 않는지 확인합니다.
- 반영 후 `main\.next`를 지우고 개발 서버를 다시 시작한 뒤 자료실·팝업 등록 편집기를 확인합니다. CKEditor 전환 소스(`src/components/ckeditor/*`, `CommonCKEditor.tsx`, `PopupRichTextEditor.tsx`)를 같이 반영해야 합니다.

## 묶음만 먼저 확인하기(선택)

빈 폴더에 `package.json`·`pnpm-lock.yaml`을 복사하고 `pnpm-store-v3.tgz`를 푼 뒤 실행합니다.

```powershell
tar -xzf pnpm-store-v3.tgz -C D:\temp-store
pnpm install --offline --frozen-lockfile --store-dir D:\temp-store
```

## 설치 확인

- `zero-rule-web\node_modules\ckeditor5\package.json`의 version이 49.0.1인지 확인합니다.
- 관리자 웹 자료실 등록과 팝업 등록 화면에서 편집기가 열리는지 확인합니다.

## 설치 실패 시

- `ERR_PNPM_NO_OFFLINE_TARBALL`이 CKEditor가 아닌 패키지에서 나면, 이번 반입과 관계없이 폐쇄망 store에 원래 없던 패키지입니다. 그 패키지 이름을 알려 주시면 추가 묶음을 만듭니다.
- store 형식 오류가 나면 폐쇄망 pnpm 버전을 확인합니다(9.15.2 필요, `pnpm -v`).
- `ERR_PNPM_OUTDATED_LOCKFILE`이 나면 폐쇄망 package.json과 반입한 lockfile의 선언값이 다른 것입니다. 폐쇄망에서 lockfile을 고치지 말고 선언 파일을 수집해 외부망에서 비교합니다.

```powershell
# 폐쇄망: front_end 루트의 package.json(루트·main·sub/*)·pnpm-workspace.yaml·.npmrc·pnpm-lock.yaml과 pnpm/node 버전 수집
.\collect-workspace-manifest.ps1 -WebRoot D:\경로\front_end
# 외부망(저장소 루트): 수집 zip과 zero-rule-web 비교 → workspace-diff.csv
.\scripts\offline-npm\compare-workspace-manifest.ps1 -Manifest D:\반입\workspace-manifest-<시각>.zip
```

- 비교표의 `ClosedLockOutdated=Y` 행이 오류를 일으키는 선언입니다. 유지·변경 결정 후 외부망에서 lockfile을 다시 만듭니다(docs/design/20261030_폐쇄망_pnpm_workspace_lockfile_불일치_해결_TODO.md).
