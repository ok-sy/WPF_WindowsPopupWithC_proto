const ts = require('../zero-rule-web/node_modules/typescript');
module.exports = source => ts.transpileModule(source, {compilerOptions: {
  target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
}}).outputText;
