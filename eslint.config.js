import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import nextjs from 'eslint-config-next';

export default [
  js.configs.recommended,
  nextjs,
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