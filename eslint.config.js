import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// Scope Alloy configs to specific file types to avoid global parser side effects
const tsOnly = compat.extends('alloy/typescript').map((c) => ({
  ...c,
  files: ['**/*.ts', '**/*.tsx'],
}));

const vueOnly = compat.extends('alloy/vue').map((c) => ({
  ...c,
  files: ['**/*.vue'],
}));

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      '.vscode/**',
      '.idea/**',
      '**/eslint.config.js',
      '**/prettier.config.cjs',
    ],
  },
  // Base + React + Prettier
  ...compat.extends('alloy'),
  ...compat.extends('alloy/react'),
  ...compat.extends('plugin:prettier/recommended'),
  {
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  // TypeScript rules limited to TS/TSX files
  ...tsOnly,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          './tsconfig.json',
          './tsconfig.app.json',
          './tsconfig.node.json',
          './apps/*/tsconfig.json',
        ],
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'max-nested-callbacks': 'off',
    },
  },
  // Vue rules limited to .vue files + TS in <script>
  ...vueOnly,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        // Use TS parser inside <script>, without typed-lint project to avoid "file not in project" errors
        parser: require('@typescript-eslint/parser'),
        extraFileExtensions: ['.vue'],
        tsconfigRootDir: __dirname,
      },
    },
  },
];
