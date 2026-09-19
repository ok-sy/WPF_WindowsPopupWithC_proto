import theme from '@/theme';
// import { notoSansKR } from '@/theme/fonts';
import type { DocumentHeadTagsProps } from '@mui/material-nextjs/v15-pagesRouter';
import { DocumentHeadTags, documentGetInitialProps } from '@mui/material-nextjs/v15-pagesRouter';
import type { DocumentContext, DocumentProps } from 'next/document';
import { Head, Html, Main, NextScript } from 'next/document';

export default function MyDocument(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    // <Html lang="en" className={notoSansKR.variable}>
    <Html lang="en">
      <Head>
        {/* PWA primary color */}
        <meta name="theme-color" content={theme.palette.primary.main} />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="emotion-insertion-point" content="" />
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
