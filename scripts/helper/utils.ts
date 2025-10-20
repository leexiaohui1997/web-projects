import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function getErrorMsg(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  return `${err}`;
}

export function getAppPath(appName: string) {
  return resolve(process.cwd(), 'apps', appName);
}

/**
 * 验证应用是否存在
 * @param appName 应用名称
 * @returns 0 应用存在 1 应用目录不存在 2 应用 package.json 不存在
 */
export function validateApp(appName: string) {
  const appDir = getAppPath(appName);
  if (!existsSync(appDir)) {
    return 1;
  }

  const pkgPath = resolve(appDir, 'package.json');
  if (!existsSync(pkgPath)) {
    return 2;
  }

  return 0;
}
