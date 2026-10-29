// const PRODUCTION = process.env.NODE_ENV === 'production';
const PRODUCTION = process.env.NODE_ENV === 'standalone';
const BASE_URL = process.env.BASE_URL || '';
const ROUTER_BASE_URL = process.env.ROUTER_BASE_URL;
const API_BASE_URL = process.env.API_BASE_URL;

console.log('next.config=', { BASE_URL, ROUTER_BASE_URL, API_BASE_URL });

// amp, analyticsId, assetPrefix, basePath, cleanDistDir, compiler, compress, crossOrigin, devIndicators, distDir, env, eslint, excludeDefaultMomentLocales, experimental, exportPathMap, generateBuildId, generateEtags, headers, httpAgentOptions, i18n, images, onDemandEntries, optimizeFonts, output, outputFileTracing, pageExtensions, poweredByHeader, productionBrowserSourceMaps, publicRuntimeConfig, reactStrictMode, redirects, rewrites, sassOptions, serverRuntimeConfig, staticPageGenerationTimeout, swcMinify, trailingSlash, typescript, useFileSystemPublicRoutes, webpack
/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  output: PRODUCTION ? 'export' : 'standalone',
  // basePath: PRODUCTION ? '/p/zero' : '',
  basePath: PRODUCTION ? '' : '',
  // distDir: '/build',

  // https://github.com/atlassian/react-beautiful-dnd/issues/2399
  // strict false for react-beautiful-dnd, lightbox
  reactStrictMode: false,
  transpilePackages: ['@local/ui', '@local/util', '@local/domain', '@local/validators'],
  // productionBrowserSourceMaps: !PRODUCTION,
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 1000, // default 60
  trailingSlash: true,

  // 개발 서버(`next dev --turbopack`)용 SVG 처리. 아래 webpack 설정은 운영 빌드(`next build`)에서 계속 쓴다.
  // svgr + svg-url-loader 연결은 Turbopack 로더 실행기가 지원하지 않아(svgr의 this.fs.readFile) svgr 단독으로
  // `import { ReactComponent as X } from '*.svg'` 이름 내보내기만 제공한다. SVG를 이미지 주소로 쓸 때는 public 경로 문자열을 쓴다.
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack', options: { exportType: 'named' } }],
        as: '*.js',
      },
    },
  },

  webpack: (config, {}) => {
    config.module.rules.push({
      test: /\.svg$/,
      // issuer: {
      //     test: /\.(js|ts)x?$/,
      // },
      use: ['@svgr/webpack', 'svg-url-loader?noquotes'],
    });
    return config;
  },

  publicRuntimeConfig: {
    BASE_URL,
    ROUTER_BASE_URL,
    API_BASE_URL,
    HTTP_TOKEN_HEADER: 'x-custom-authorization',
    HTTP_TOKEN_CLEAR_HEADER: 'x-custom-authorization-clear',
    DEBUG: true,
    // DEBUG: !PRODUCTION,
  },
};

export default nextConfig;
