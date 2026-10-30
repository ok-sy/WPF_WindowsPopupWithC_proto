import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// sub/* workspace 패키지 이름(package.json name). 설정 패키지(eslint-config, typescript-config)는 소스가 아니라 제외.
const SUB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sub');
const WORKSPACE_PACKAGES = fs.existsSync(SUB_DIR)
  ? fs
      .readdirSync(SUB_DIR)
      .map((dir) => path.join(SUB_DIR, dir, 'package.json'))
      .filter((file) => fs.existsSync(file))
      .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')).name)
      .filter((name) => name && !/(eslint|typescript)-config$/.test(name))
  : [];

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
  // workspace 패키지(sub/*)는 TS 소스를 그대로 내보내므로 Next가 직접 변환해야 한다.
  // 환경마다 패키지 이름(@local/*, @repo/*)이 달라 sub/*/package.json의 name을 읽어 함께 넣는다.
  transpilePackages: [...new Set(['@local/ui', '@local/util', '@local/domain', '@local/validators', ...WORKSPACE_PACKAGES])],
  // productionBrowserSourceMaps: !PRODUCTION,
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 1000, // default 60
  trailingSlash: true,

  // 개발 서버(`next dev --turbopack`)용 SVG 처리. 아래 webpack 설정은 운영 빌드(`next build`)에서 계속 쓴다.
  // svgr + svg-url-loader 연결은 Turbopack 로더 실행기가 지원하지 않아(svgr의 this.fs.readFile) 두 로더를
  // turbopack-svg-loader.cjs에서 차례로 호출한다. webpack과 같이 default = 이미지 주소, ReactComponent = 컴포넌트.
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['./turbopack-svg-loader.cjs'],
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
