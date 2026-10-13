import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

const nextConfig = {
  ...nextPlugin.flatConfig.coreWebVitals,
  files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
};

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },
  nextConfig,
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/api/src/**/*.ts', 'apps/api/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
);
