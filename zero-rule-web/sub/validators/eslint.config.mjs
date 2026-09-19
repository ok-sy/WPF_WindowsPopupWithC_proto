import { config } from '@repo/eslint-config/react-internal'

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ['node_modules/', '.turbo/'],
  },
  ...config,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react/jsx-pascal-case': 'warn', // PascalCase 변환 경고
      'react/no-unknown-property': ['error', { ignore: [] }], // fill-rule 같은 속성 변환
    },
  },
]
