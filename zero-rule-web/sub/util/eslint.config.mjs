import { config } from '@repo/eslint-config/base'

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    ignores: ['build/*', 'dist/*', 'node_modules/*'],
  },
  {
    ignores: ['eslint.config.mjs'],
  },
]
