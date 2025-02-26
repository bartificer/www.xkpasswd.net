import globals from 'globals';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';
import jsdoc from 'eslint-plugin-jsdoc';
import google from 'eslint-config-google';
import jest from 'eslint-plugin-jest';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: js.configs.recommended,
//   allConfig: js.configs.all,
// });

export default [
  // app related javascript files
  {
    name: 'app files',
    files: ["src/**/*.mjs"],
    ignores: ['src/**/*.test.mjs'],
    plugins: {
      jsdoc,
    },
    ...js.configs.recommended,
    ...google,
    ...jsdoc.configs['flat/recommended'],
    settings: {
      jsdoc: {
        mode: 'jsdoc'
      }
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      indent: ['error', 2],
      'jsdoc/require-description': 'error',
      'jsdoc/check-values': 'error',
      'jsdoc/informative-docs': 1,
    },
  },
  {
    name: 'test files',
    files: ["src/**/*.test.mjs"],
    plugins: {
      jest
    },
    languageOptions: {
      globals: {
      ...globals.jest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

  // {
  // plugins: {
  //   jest,
  // },
  //
  //
  // languageOptions: {
  //   globals: {
  //     ...globals.browser,
  //     ...globals.jest,
  //   },
  //
  //   ecmaVersion: 'latest',
  //   sourceType: 'module',
  // },
  //
}];
