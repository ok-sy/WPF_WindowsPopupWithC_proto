import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupListSample from '../zero-rule-web/main/src/features/PopupcommonComponent/sample/PopupListSample';
import IS063M02Sample from '../zero-rule-web/main/src/features/PopupcommonComponent/sample/IS063M02Sample';

/* POL-14-01 : 공통 프론트 경계
 * ■ 공통 컴포넌트 샘플 2종(목록 기반 / IS063M02 연동)을 서버·라우터 없이 띄우는 검증 진입점. #is063이면 IS063M02 샘플. */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
/* #is063-codes: 0101 목록(window.__defaultCodes)을 처음부터 넘긴다. */
type CodeRow = { code: string; codeNm: string };
const initialCodes = () => (window as unknown as { __defaultCodes?: CodeRow[] }).__defaultCodes ?? [];
/* #is063-store: 폐쇄망 공통코드 스토어 경로. 처음엔 목록 없음(로딩 전) → 300ms 뒤 window.__defaultCodes를 스토어처럼 넘긴다(늦은 로딩). */
function StoreHost() {
  const [codes, setCodes] = useState<CodeRow[] | undefined>(undefined);
  useEffect(() => { const timer = setTimeout(() => setCodes((window as unknown as { __defaultCodes?: CodeRow[] }).__defaultCodes ?? []), 300); return () => clearTimeout(timer); }, []);
  return <IS063M02Sample defaultCodes={codes} />;
}
const page = location.hash === '#is063' ? <IS063M02Sample /> : location.hash === '#is063-codes' ? <IS063M02Sample defaultCodes={initialCodes()} />
  : location.hash === '#is063-store' ? <StoreHost /> : <PopupListSample />;
root.render(<ThemeProvider theme={theme}><CssBaseline />{page}</ThemeProvider>);
