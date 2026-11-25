import LoginProfileLoader from '@/auth/LoginProfileLoader';
import CustomThemeWrapper from '@/components/CustomThemeWrapper';
import { LightboxImageViewEventHandler } from '@/custom-events';
import StoreProvider from '@/store/StoreProvider';
import theme from '@/theme';
import { Global } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import type { AppProps as NextAppProps } from 'next/app';
import Head from 'next/head';
// 폐쇄망 전역 CSS 로컬 재현본. 반입 제외 파일(styles/globalStyle.ts 주석 참고)
import { closedNetGlobalStyle } from '../styles/globalStyle';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as timeago from 'timeago.js';
import ko from 'timeago.js/lib/lang/ko';

timeago.register('ko', ko);

export default function MyApp(props: NextAppProps) {
  const { Component, pageProps } = props;

  return (
    <AppCacheProvider {...props}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        {/* 맑음 고딕 폰트 font-family: 'Malgun Gothic', 'Helvetica', 'Arial', 'sans-serif'; */}
        {/* <style jsx global>{`
          html {
            font-family: ${notoSansKR.style?.fontFamily};
          }
        `}</style> */}
      </Head>
      <StoreProvider rootStoreInitialState={undefined}>
        <ThemeProvider theme={theme}>
          <CustomThemeWrapper>
            <CssBaseline />
            <Component {...pageProps} />
            {/* 폐쇄망 _app.tsx와 같이 페이지 뒤에 Emotion Global로 넣는다(2026-11-25 캡처) */}
            {closedNetGlobalStyle() && <Global styles={closedNetGlobalStyle()} />}

            <LightboxImageViewEventHandler />
            <LoginProfileLoader />
            <ToastContainer
              position="top-center"
              hideProgressBar
              autoClose={2000}
              pauseOnHover
              draggable
            />
          </CustomThemeWrapper>
        </ThemeProvider>
      </StoreProvider>
    </AppCacheProvider>
  );
}
