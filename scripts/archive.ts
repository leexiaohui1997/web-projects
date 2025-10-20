import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { getAppPath, getErrorMsg, validateApp } from './helper/utils.ts';
import { GIT_IGNORE_PATH, TEMPLATE_DIR } from './helper/config.ts';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import archiver from 'archiver';

/**
 * 解析 .gitignore 文件，返回忽略规则数组
 * @returns 忽略规则数组
 */
function parseGitIgnore(): string[] {
  const content = readFileSync(GIT_IGNORE_PATH, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      if (line.startsWith('/')) {
        return line.substring(1);
      }
      if (line.endsWith('/')) {
        return `${line}**`;
      }
      return line;
    });
}

/**
 * 检查文件路径是否应该被忽略
 * @param filePath 文件路径
 * @param ignorePatterns 忽略规则数组
 * @returns 是否应该被忽略
 */
function shouldIgnore(filePath: string, ignorePatterns: string[]) {
  const relativePath = filePath.replace(`${process.cwd()}/`, '');
  return ignorePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\./g, '\\.');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(relativePath);
    }

    if (pattern.startsWith('/')) {
      return relativePath === pattern.substring(1);
    }

    if (pattern.endsWith('/')) {
      return relativePath.startsWith(pattern);
    }

    return relativePath.includes(pattern);
  });
}

/**
 * 递归收集目录下的所有文件，排除被 .gitignore 忽略的文件
 * @param dirPath 目录路径
 * @param ignorePatterns 忽略规则数组
 * @param basePath 基础路径，用于计算相对路径
 * @returns 文件路径数组
 */
async function collectFiles(dirPath: string, ignorePatterns: string[], basePath = '') {
  const files: Array<{
    path: string;
    relativePath: string;
  }> = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    await entries.reduce(async (_, entry) => {
      await _;

      const fullPath = join(dirPath, entry.name);
      const relativePath = join(basePath, entry.name);

      if (shouldIgnore(fullPath, ignorePatterns)) {
        return;
      }

      if (entry.isDirectory()) {
        const subFiles = await collectFiles(fullPath, ignorePatterns, relativePath);
        files.push(...subFiles);
        return;
      }

      files.push({
        path: fullPath,
        relativePath,
      });
    }, Promise.resolve());
  } catch (err) {
    console.warn(`警告: 无法读取目录 ${dirPath}: ${getErrorMsg(err)}`);
  }
  return files;
}

async function main() {
  const appName = process.argv[2];
  const zipName = process.argv[3] || appName;

  if (!appName) {
    console.log('用法: pnpm archive <app-name> [zip-name]');
    console.log('例如: pnpm archive example');
    process.exit(1);
  }

  const appStatus = validateApp(appName);
  if (appStatus) {
    console.log(`应用 ${appName} 不存在`);
    process.exit(appStatus);
  }

  const appPath = getAppPath(appName);
  console.log(`正在打包应用: ${appName}`);
  console.log(`应用路径: ${appPath}`);

  // 创建 templates 目录
  if (!existsSync(TEMPLATE_DIR)) {
    mkdirSync(TEMPLATE_DIR, { recursive: true });
  }

  // 读取 .gitignore 规则
  const ignorePatterns = parseGitIgnore();
  console.log(`忽略规则: ${ignorePatterns.length} 条`);

  // 收集要打包的文件
  console.log('正在收集文件...');
  const files = await collectFiles(appPath, ignorePatterns);
  console.log(`找到 ${files.length} 个文件`);

  // 创建压缩包
  const zipPath = join(TEMPLATE_DIR, `${zipName}.zip`);
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  await new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ 打包完成: ${zipPath}`);
      console.log(`📦 压缩包大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(0);
    });

    archive.on('error', (err) => {
      console.error('❌ 打包失败:', err.message);
      reject(err);
    });

    archive.pipe(output);
    files.forEach((file) => {
      const fileStream = createReadStream(file.path);
      archive.append(fileStream, { name: file.relativePath });
    });

    archive.finalize();
  });
}

main().catch((err) => {
  console.error('❌ 打包过程中发生错误:', getErrorMsg(err));
  process.exit(1);
});
