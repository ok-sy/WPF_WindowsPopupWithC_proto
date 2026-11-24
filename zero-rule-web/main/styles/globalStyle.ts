/**
 * 폐쇄망 전역 CSS 로컬 재현본(2026-11-24)
 *
 * - 폐쇄망 front_end의 `main/styles/globalStyle.ts`와 같은 경로·같은 export 이름으로 둔다. 폐쇄망 원본이 아니며
 *   지금까지 확인된 규칙만 옮겼다. 원본 전체를 받으면 이 파일을 원본 내용으로 바꾼다.
 * - 목적: 로컬 화면과 하네스에서도 폐쇄망 전역 규칙(body·em·i 등)이 팝업 공통 컴포넌트를 덮어쓰는 현상을 미리 재현한다.
 * - 반입 제외: scripts/export-offline-package.ps1이 이 파일과 이를 적용하는 pages/_app.tsx를 반입본에서 뺀다
 *   (폐쇄망 원본 globalStyle.ts·_app.tsx를 덮어쓰지 않도록).
 * - 적용: pages/_app.tsx가 CssBaseline 뒤에 GlobalStyles로 넣는다. NEXT_PUBLIC_CLOSED_NET_GLOBAL_STYLE
 *   = on(기본, 확인된 규칙) | assumed(확인된 규칙 + 가정 규칙) | off(넣지 않음).
 *
 * 출처
 * - @font-face: 폐쇄망 VSCode 화면(2026-11-24, 1~42행). 42행 이후(YouandiNewKr 700 등)는 미확인.
 *   `// NewFont 설정` 줄은 원본에 있는 그대로 둔다(CSS 템플릿 문자열 안의 `//`는 적용 방식에 따라 주석으로 처리되지 않을 수 있음).
 * - body 배경: docs/design/20261030_폐쇄망_FRONT_반입_당일_이슈_정리.md 3절.
 * - em, i: docs/design/28_TEXT_FONT_EDITING_TODO.md TODO28-16(폐쇄망 캡처).
 */
export const globalStyle = `
  @font-face{
    font-family: "YouandiModern";
    font-weight: 200;
    src : local("YouandiModern HeadRegular");
  }
  @font-face{
    font-family: "YouandiModern";
    font-weight: 300;
    src : local("YouandiModern TextRegular");
  }

  @font-face{
    font-family: "YouandiModern";
    font-weight: 500;
    src : local("YouandiModern TextBold");
  }

  @font-face{
    font-family: "YouandiModern";
    font-weight: 700;
    src : local("YouandiModern HeadBold");
  }

  // NewFont 설정 : 2026.10 팝업관리
  @font-face{
    font-family: "YouandiNewKr";
    font-weight: 300;
    src : local("YouandiNewKr Text Light");
  }

  @font-face{
    font-family: "YouandiNewKr";
    font-weight: 400;
    src : local("YouandiNewKr Text Regular");
  }

  @font-face{
    font-family: "YouandiNewKr";
    font-weight: 500;
    src : local("YouandiNewKr Text Medium");
  }

  body {
    background: #ebebeb;
  }

  em, i {
    font-style: normal;
  }
`;

/**
 * 원본에서 확인되지 않았지만 하네스에서 가정해 대응한 규칙(assumed 모드에서만 추가).
 * - strong, b 굵기 리셋: TODO28-16 대응 시 em, i와 함께 가정.
 * - Dialog Paper 모서리: TODO61-12~15 폐쇄망 DevTools에서 border-radius: 0 표시. 선언 원본 위치 미확인.
 */
export const assumedGlobalStyle = `
  strong, b {
    font-weight: normal;
  }

  .MuiDialog-root .MuiPaper-root {
    border-radius: 0;
  }
`;

/** NEXT_PUBLIC_CLOSED_NET_GLOBAL_STYLE 값에 따라 로컬에 넣을 전역 CSS. off면 빈 문자열. */
export function closedNetGlobalStyle(mode: string | undefined = process.env.NEXT_PUBLIC_CLOSED_NET_GLOBAL_STYLE): string {
  if (mode === 'off') return '';
  return mode === 'assumed' ? globalStyle + assumedGlobalStyle : globalStyle;
}

export default globalStyle;
