// 일반 CSS side-effect import 타입 선언. Next 기본 타입은 *.module.css만 제공해 새 TS(noUncheckedSideEffectImports)에서 ts(2882)가 난다.
declare module '*.css';
