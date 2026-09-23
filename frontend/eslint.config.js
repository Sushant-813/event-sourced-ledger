import js from '@eslint/js'
import globals from 'globals'
import tsEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },

  // Base JS recommended (applied to all files; TypeScript configs below refine it)
  js.configs.recommended,

  // TypeScript source files — browser environment
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // TypeScript recommended rules
      ...tsEslint.configs.recommended.rules,

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React Refresh (Vite HMR compatibility)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Explicit type imports — improves tree-shaking
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // No explicit any
      '@typescript-eslint/no-explicit-any': 'error',

      // Unused variables (TypeScript already enforces this with noUnusedLocals)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Disable no-undef for TypeScript files: TypeScript's own type checker
      // handles undefined references more accurately than ESLint's no-undef.
      // RequestInit, Response, Headers, URL, fetch, etc. are all typed via
      // tsconfig.app.json's lib: ["ES2022", "DOM", "DOM.Iterable"].
      'no-undef': 'off',
    },
  },

  // Vite and Vitest config files — Node.js environment
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      // __dirname is provided by Node.js globals above
      'no-undef': 'off',
    },
  },

  // Test files — slightly relaxed rules
  {
    files: ['**/*.test.{ts,tsx}', '**/test-setup.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        // Vitest globals (enabled via vitest globals: true in vite.config.ts)
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },
]
