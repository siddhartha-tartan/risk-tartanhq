import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
    },
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Add TypeScript specific rules here
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'dist/**',
      'build/**',
    ],
  },
]; 