# CKEditor 5 npm 오프라인 캐시(pnpm store)

관리자 웹 서식 편집기가 `ckeditor5` 49.0.1 + `@ckeditor/ckeditor5-react` 12.0.0으로 바뀌어, 폐쇄망 pnpm store에 없는 패키지가 생겼습니다.
이 묶음은 두 패키지와 그 의존 패키지 전체를 pnpm store(오프라인 캐시) 형식으로 담고 있습니다. 사내 npm 저장소 없이 설치할 수 있습니다.

| 파일 | 용도 |
|---|---|
| `pnpm-store-v3.tgz` | pnpm 9 store(v3). 폐쇄망 pnpm store에 추가합니다 |
| `install-pnpm-store.ps1` | store 추가 + `pnpm install --offline` 실행 |
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
