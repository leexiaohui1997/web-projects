import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  configFile: fileURLToPath(new URL(`../vite.config.ts`, import.meta.url)),
});
await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });
