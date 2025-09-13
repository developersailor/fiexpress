module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off', // CLI tool için console.log gerekli
    'no-unused-vars': 'warn',
    'no-undef': 'error',
  },
  ignorePatterns: ['node_modules/', 'dist/'],
};
