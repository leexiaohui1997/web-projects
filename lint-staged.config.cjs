module.exports = {
  '*.{js,cjs,mjs,ts,tsx,jsx,vue}': [
    'pnpm exec eslint --fix',
    'pnpm format',
    'pnpm format:check',
  ],
  '*.{json,md,yml,yaml,css,scss,less}': [
    'pnpm format',
    'pnpm format:check',
  ],
};
