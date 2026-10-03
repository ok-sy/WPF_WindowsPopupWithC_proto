# ZERO RULE WEB

ZERO RULE WEB 프로젝트입니다.

## 설문·퀴즈 미리보기

팝업 등록/수정 화면의 미리보기는 WPF와 동일한 무채색 Row·Chip·우측 체크 Path·고정 제출 영역을 사용한다. 단일/복수 선택, 주관식, 필수 응답 진행 상태 및 VIDEO+QUIZ 시청 기준을 화면에서 확인할 수 있다.

`예제 문항 보기`를 누르면 SURVEY 6문항 또는 QUIZ·VIDEO+QUIZ 5문항의 가로/세로·단일/복수·짧은/긴 보기 사례를 확인한다. `입력한 문항 보기`로 돌아갈 수 있으며 예제와 미리보기 응답·점수는 서버나 편집 데이터에 저장되지 않는다. 상세 범위와 검증은 [설계 22](../docs/design/22_WEB_SURVEY_QUIZ_UI.md)에 기록한다.

## 개발환경 요약

- [NodeJS](https://nodejs.org) 20.18.2
- [pnpm](https://pnpm.io) 9.15.2
- [NextJS](https://nextjs.org) 15.x
- [ReactJS](https://reactjs.org/) 18.x
- [Material UI](https://mui.com) 6.x
- [Typescript](https://www.typescriptlang.org/) 5.7.x
- 모노리포: [turborepo](https://turbo.build/)

## 사전 준비

소스코드를 실행하기 위해 필요한 준비사항을 설명하겠습니다. Windows 10을 기준으로 설명합니다. PC에 [choco 프로그램](https://chocolatey.org/install)이 설치되어 있다고 가정합니다.

### NodeJS 20.x 설치

보통 개발자 PC에 여러 버전의 NodeJS 환경이 필요하므로 nvm 사용을 권장합니다. nvm 없이 사용하려면 [NodeJS 홈페이지](https://nodejs.org)에서 NodeJS 18.x 버전을 설치해도 됩니다.

#### nvm 설치

아래와 같이 nvm을 설치할 수 있습니다.

```bash
choco install nvm
```

#### nvm 으로 NodeJS 설치하기

NodeJS 홈페이지에서 20.x의 최신 버전 번호를 확인한 후에, 아래와 같이 설치할 수 있습니다.

```bash
nvm install 20.18.2

# 설치한 후에는 use 해야 합니다.
nvm use 20.18.2
```

현재는 20.x 가 lts 버전이라서 lts로 설치할 수 있습니다.

```bash
nvm install lts

# 설치한 후에는 use 해야 합니다.
nvm use 20.18.2
```

### pnpm 9.15.2 설치

파워쉘에서 아래 명령을 실행합니다. 7.x 버전으로 설치합니다.

- 파워쉘은 윈도우 시작키 누르고, `powershell`을 입력하면 윈도우 메뉴에서 검색됩니다.
- 혹시 설치가 안된다면, 관리자 권한으로 설치하세요.

```bash
npm install --global pnpm

# 설치된 버전 예시: 9.15.2
```

더 자세한 설치 방법은 [pnpm](https://pnpm.io) 사이트를 확인해주세요.

### 애플리케이션과 패키지들

- `web`: ZERO RULE 웹 [Next.js](https://nextjs.org/) app
- `ui-common`: 공통 UI 라이브러리
- `domain`: 데이터 타입 정의 및 서버 연동 API
- `eslint-config-custom`: `eslint` 설정 (`eslint-config-next`와 `eslint-config-prettier`를 포함하고 있습니다.)
- `tsconfig`: 모노리포에서 사용할 `tsconfig.json`파일을 포함하고 있습니다.

### 빌드

모든 것을 빌드하려면 아래 명령을 실행하세요.

```sh
pnpm run build
```

### 개발

개발 모드로 실행하려면 아래 명령을 실행하세요.

```sh
pnpm run dev
```

### import type 정리

프로젝트 버전이 올라가면서 type으로만 쓰이는 import를 type으로 정리해줍니다.
아래 명령을 실행하세요

```sh
pnpm lint-fix
```

### 소스코드 정리 formatting

import type 정리하면서 소스코드 정리가 필요합니다.
아래 명령을 실행하세요

```sh
pnpm format
```

## TODO

- Dockerizing

## Tips

### pnpm cheetsheet

```bash
# dependencies에 저장
pnpm add sax
pnpm add -P sax
pnpm add --save-prod sax

# devDependencies에 저장
pnpm add -D sax
pnpm add --save-dev sax

# peerDependencies에 저장
pnpm add --save-peer sax

# optionalDependencies에 저장
pnpm add -O sax
pnpm add --save-optional sax

# global 패키지에 저장
pnpm add -g sax
```

```bash
# 실수로 devDependencies에 설치했는데, dependencies로 옮기려면
pnpm install -P sax
pnpm install --save-prod sax

# 실수로 dependencies에 설치했는데, devDependencies로 옮기려면
pnpm install -D sax
pnpm install --save-dev sax
```
