import fs from 'fs';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
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

// [폐쇄망 배포 2026-11-13] 관리자 WEB은 정적 Export(main/out/)를 Nginx에 복사해 제공한다. standalone(Node 서버)은 쓰지 않는다.
// 예전 조건(NODE_ENV === 'standalone')은 일반 `next build`(NODE_ENV=production)에서 standalone을 골라 정책과 어긋나 제거했다.
// docs/design/20261113_폐쇄망_WEB_Nginx_정적Export_배포방식_TODO.md 참고.
// [변경 지점] 배포 환경별 주소. 소스가 아니라 환경변수·빌드 인자로 넣는다. API_BASE_URL은 컨텍스트 경로까지 포함한다.
const BASE_URL = process.env.BASE_URL || '';
const ROUTER_BASE_URL = process.env.ROUTER_BASE_URL;
const API_BASE_URL = process.env.API_BASE_URL;

console.log('next.config=', { BASE_URL, ROUTER_BASE_URL, API_BASE_URL });

// 개발 서버 화면 묶음 필터. DEV_SCENES=popup,pds처럼 켤 묶음을 쉼표로 준다(대소문자 무관, 비우거나 all이면 전체).
// next dev에서만 꺼진 묶음마다 DEV_SCENE_OFF_<묶음>='1'을 env로 넣어 scene-router.tsx의 해당 dynamic import를 컴파일에서 뺀다.
// next build·DEV_SCENES 미지정이면 모든 묶음을 '0'으로 넣어 운영 결과물은 항상 전체 화면이고 제외 안내 컴포넌트도 번들에서 빠진다. 묶음 설명·화면 추가 방법은 src/scene/scene-router.tsx 머리 주석.
// 셸 환경변수, main/.env.development.local 둘 다 된다(turbo는 turbo.json dev passThroughEnv로 넘긴다).
const DEV_SCENE_GROUPS = ['SYSTEM', 'LOG', 'PDS', 'RULE', 'POPUP'];
function devSceneEnv(phase) {
  const raw = (process.env.DEV_SCENES || '').trim();
  const flags = (off) => Object.fromEntries(DEV_SCENE_GROUPS.map((g) => [`DEV_SCENE_OFF_${g}`, off.includes(g) ? '1' : '0']));
  if (phase !== PHASE_DEVELOPMENT_SERVER || !raw || raw.toLowerCase() === 'all') return flags([]);
  const wanted = raw.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean);
  const unknown = wanted.filter((v) => !DEV_SCENE_GROUPS.includes(v));
  if (unknown.length) console.warn(`DEV_SCENES: 알 수 없는 묶음 ${unknown.join(', ')} (사용 가능: ${DEV_SCENE_GROUPS.join(', ').toLowerCase()})`);
  const off = DEV_SCENE_GROUPS.filter((g) => !wanted.includes(g));
  console.log(`DEV_SCENES: 켬 ${DEV_SCENE_GROUPS.filter((g) => wanted.includes(g)).join(', ') || '(대시보드만)'} / 끔 ${off.join(', ') || '없음'}`);
  return flags(off);
}

// amp, analyticsId, assetPrefix, basePath, cleanDistDir, compiler, compress, crossOrigin, devIndicators, distDir, env, eslint, excludeDefaultMomentLocales, experimental, exportPathMap, generateBuildId, generateEtags, headers, httpAgentOptions, i18n, images, onDemandEntries, optimizeFonts, output, outputFileTracing, pageExtensions, poweredByHeader, productionBrowserSourceMaps, publicRuntimeConfig, reactStrictMode, redirects, rewrites, sassOptions, serverRuntimeConfig, staticPageGenerationTimeout, swcMinify, trailingSlash, typescript, useFileSystemPublicRoutes, webpack
/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  // 빌드는 항상 정적 Export(main/out/). 환경변수로 standalone이 선택되는 경로를 두지 않는다.
  output: 'export',
  // [변경 지점] Nginx 하위 경로로 제공하면 basePath를 그 경로로 맞춘다(현재 루트 제공).
  basePath: '',
  // distDir: '/build',

  // https://github.com/atlassian/react-beautiful-dnd/issues/2399
  // strict false for react-beautiful-dnd, lightbox
  reactStrictMode: false,
  // workspace 패키지(sub/*)는 TS 소스를 그대로 내보내므로 Next가 직접 변환해야 한다.
  // 환경마다 패키지 이름(@local/*, @repo/*)이 달라 sub/*/package.json의 name을 읽어 함께 넣는다.
  // @mui/material-nextjs: Turbopack SSR은 이 패키지를 외부(CJS)로 불러와 번들된 @mui/material과 @emotion/react 인스턴스가 갈린다.
  // 그러면 AppCacheProvider 캐시가 무시되어 CssBaseline 등 MUI 스타일이 <body>에 인라인으로 찍히고 전역 CSS(body)를 덮어쓴다.
  transpilePackages: [
    ...new Set(['@mui/material-nextjs', '@local/ui', '@local/util', '@local/domain', '@local/validators', ...WORKSPACE_PACKAGES]),
  ],
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
    // [변경 지점] 서버 custom.auth-header 값·WPF WpfLoginClient.TokenHeaderName과 함께 바꾼다.
    HTTP_TOKEN_HEADER: 'x-custom-authorization',
    HTTP_TOKEN_CLEAR_HEADER: 'x-custom-authorization-clear',
    DEBUG: true,
  },
};

export default (phase) => ({ ...nextConfig, env: devSceneEnv(phase) });
