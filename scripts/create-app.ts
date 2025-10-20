import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { getAppPath, getErrorMsg, validateApp } from './helper/utils.ts';
import { TEMPLATE_DIR } from './helper/config.ts';
import inquirer from 'inquirer';
import { join } from 'node:path';
import yauzl from 'yauzl';

/**
 * 获取可用的模板列表
 * @returns 模板名称数组
 */
function getAvailableTemplates() {
  if (!existsSync(TEMPLATE_DIR)) {
    return [];
  }
  try {
    const files = readdirSync(TEMPLATE_DIR);
    return files.filter((file) => file.endsWith('.zip')).map((file) => file.replace('.zip', ''));
  } catch (error) {
    console.warn('警告: 无法读取模板目录:', getErrorMsg(error));
    return [];
  }
}

/**
 * 交互式选择模板
 * @param templates 可用的模板列表
 * @returns 选中的模板名称
 */
async function selectTemplate(templates: string[]): Promise<string> {
  if (templates.includes(process.argv[3])) {
    return process.argv[3];
  }
  const { selectedTemplate } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTemplate',
      message: '请选择要使用的模板:',
      choices: templates.map((template) => ({
        name: template,
        value: template,
      })),
      default: templates[0],
    },
  ]);
  return selectedTemplate;
}

/**
 * 解压 ZIP 文件
 * @param zipPath ZIP 文件路径
 * @param extractPath 解压目标目录
 */
async function extractZip(zipPath: string, extractPath: string) {
  await new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
        return;
      }

      zipfile.on('end', () => {
        resolve(0);
      });

      zipfile.on('error', reject);

      zipfile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // 目录条目
          const dirPath = join(extractPath, entry.fileName);
          if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
          }
          zipfile.readEntry();
          return;
        }

        // 文件条目
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) {
            reject(err);
            return;
          }

          const filePath = join(extractPath, entry.fileName);
          const dirPath = join(filePath, '..');

          // 确保目录存在
          if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
          }

          const writeStream = createWriteStream(filePath);
          readStream.pipe(writeStream);

          writeStream.on('close', () => zipfile.readEntry());
          writeStream.on('error', reject);
        });
      });

      zipfile.readEntry();
    });
  });
}

async function main() {
  const appName = process.argv[2];

  if (!appName) {
    console.log('用法: pnpm create:app <app-name>');
    console.log('例如: pnpm create:app my-app');
    process.exit(1);
  }

  if (validateApp(appName) !== 1) {
    console.log(`错误: 应用 "${appName}" 已存在于 apps/ 目录中`);
    process.exit(1);
  }

  // 获取可用模板
  const templates = getAvailableTemplates();
  if (templates.length === 0) {
    console.log('错误: 没有找到可用的模板');
    console.log('可使用 pnpm archive 基于已有应用创建模板');
    return 1;
  }

  // 交互式选择模板
  const selectedTemplate = await selectTemplate(templates);
  console.log(`\n✅ 已选择模板: ${selectedTemplate}`);

  const appPath = getAppPath(appName);

  try {
    mkdirSync(appPath, { recursive: true });

    // 解压模板
    const templatePath = join(TEMPLATE_DIR, `${selectedTemplate}.zip`);
    console.log('正在解压模板...');
    await extractZip(templatePath, appPath);

    // 更新 package.json
    const packageJsonPath = join(appPath, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageJson.name = appName;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log(`✅ 应用 "${appName}" 创建成功!`);
    console.log(`📁 应用路径: ${appPath}`);
    console.log('\n下一步:');
    console.log('  安装依赖: pnpm install');
    console.log(`  启动开发服务器: pnpm dev ${appName}`);
  } catch (err) {
    console.error('❌ 创建应用时发生错误:', getErrorMsg(err));
    if (existsSync(appPath)) {
      rmSync(appPath, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

main();
