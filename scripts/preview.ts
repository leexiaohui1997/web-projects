import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const previewServer = await preview({
  configFile: fileURLToPath(new URL(`../vite.config.ts`, import.meta.url)),
});

previewServer.printUrls();
previewServer.bindCLIShortcuts({ print: true });
