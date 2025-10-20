import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';

const appName = process.argv[2];

if (!appName) {
  console.log('错误：请指定项目名称');
  process.exit(1);
}

const pkgPath = fileURLToPath(new URL(`apps/${appName}/package.json`, import.meta.url));
if (!existsSync(pkgPath)) {
  console.log(`错误：项目${appName}不存在`);
  process.exit(1);
}

const pkgInfo = JSON.parse(readFileSync(pkgPath, 'utf-8'));

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: `apps/${appName}/public`,
  envDir: `apps/${appName}`,
  plugins: [
    vue(),
    react(),
    createHtmlPlugin({
      entry: `apps/${appName}/src/main`,
      template: 'index.html',
      inject: {
        data: {
          pkgInfo,
          htmlData: pkgInfo.htmlData || {},
        },
      },
    }),
  ],
  build: {
    outDir: `dist/${appName}`,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL(`apps/${appName}/src`, import.meta.url)),
      '@shared': fileURLToPath(new URL('shared', import.meta.url)),
    },
  },
  ...(pkgInfo.viteConfig || {}),
});
