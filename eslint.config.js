const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const nextjs = require('eslint-config-next');

module.exports = [
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