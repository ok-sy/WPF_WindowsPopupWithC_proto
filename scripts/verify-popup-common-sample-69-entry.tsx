import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupListSample from '../zero-rule-web/main/src/features/PopupcommonComponent/sample/PopupListSample';
import IS063M02Sample from '../zero-rule-web/main/src/features/PopupcommonComponent/sample/IS063M02Sample';

/* POL-14-01 : 공통 프론트 경계
 * ■ 공통 컴포넌트 샘플 2종(목록 기반 / IS063M02 연동)을 서버·라우터 없이 띄우는 검증 진입점. #is063이면 IS063M02 샘플. */
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif' } });
/* #is063-codes: 공통코드 0101 조회를 흉내 낸다(라우트가 api.clCode.search를 넘기는 경로). 응답은 window.__defaultCodes. */
type CodeRow = { code: string; codeNm: string };
const searchCodes = async () => ({ body: { pagerData: { elements: ((window as unknown as { __defaultCodes?: CodeRow[] }).__defaultCodes ?? []) } } });
const page = location.hash === '#is063' ? <IS063M02Sample /> : location.hash === '#is063-codes' ? <IS063M02Sample searchCodes={searchCodes} /> : <PopupListSample />;
root.render(<ThemeProvider theme={theme}><CssBaseline />{page}</ThemeProvider>);
