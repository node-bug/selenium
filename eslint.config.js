import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'
export default [
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },

  js.configs.recommended,

  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },

  prettierConfig,
]
