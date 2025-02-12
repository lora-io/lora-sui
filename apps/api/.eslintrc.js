/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@repo/eslint-config/node.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  globals: {
    BigInt: true,
  },
  rules: {
    'no-case-declarations': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
}
