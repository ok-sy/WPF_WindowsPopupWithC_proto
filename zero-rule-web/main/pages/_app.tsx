import LoginProfileLoader from '@/auth/LoginProfileLoader';
import CustomThemeWrapper from '@/components/CustomThemeWrapper';
import { LightboxImageViewEventHandler } from '@/custom-events';
import StoreProvider from '@/store/StoreProvider';
import theme from '@/theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import type { AppProps as NextAppProps } from 'next/app';
import Head from 'next/head';
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
