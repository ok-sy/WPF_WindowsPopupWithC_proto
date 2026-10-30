// Turbopack 개발 서버(`next dev --turbopack`)용 SVG 로더.
// 운영 빌드(webpack)의 `['@svgr/webpack', 'svg-url-loader?noquotes']`와 같은 모양으로 내보낸다.
//   import img from 'x.svg'                       → 이미지 주소(data URI 문자열)
//   import { ReactComponent as Icon } from 'x.svg' → React 컴포넌트
// Turbopack 로더 실행기는 로더를 이어 붙였을 때 @svgr/webpack이 원본을 다시 읽는 this.fs.readFile을 제공하지 않아
// 두 로더를 이 파일 안에서 차례로 호출하고, readFile만 Node fs로 넘겨준다.
const fs = require('fs');
const svgUrlLoader = require('svg-url-loader');
const svgrLoader = require('@svgr/webpack');

module.exports = function turbopackSvgLoader(source) {
  const loader = this;
  // 1) svg-url-loader(noquotes와 같은 기본 encoding 'none') → `module.exports = "data:image/svg+xml,..."`
  const urlModule = svgUrlLoader.call({ getOptions: () => ({}), resourceQuery: '' }, Buffer.from(source));
  // 2) @svgr/webpack: 앞 단계 결과를 default로, 원본 SVG로 만든 컴포넌트를 ReactComponent로 내보낸다
  svgrLoader.call(
    {
      async: () => loader.async(),
      getOptions: () => ({}),
      resourcePath: loader.resourcePath,
      fs: { readFile: (file, callback) => fs.readFile(file, callback) },
    },
    urlModule,
  );
};
