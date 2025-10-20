# Vue Projects

## 项目概述

这是一个基于 pnpm monorepo 管理的 Vue3 项目集合。通过统一脚本完成开发、构建与预览，并通过 `shared/` 目录实现跨应用共享代码与工具。

## 环境要求

- Node >= 20（推荐使用当前 LTS）
- pnpm >= 9（作为包与工作空间管理器）
- 任意平台（macOS / Linux / Windows）
- 推荐编辑器：VS Code，安装 Volar、ESLint、Prettier 插件

## 目录结构

```
.
├─ apps/                 # 每个应用目录（pnpm workspace）
├─ scripts/              # 管理脚本：dev / build / preview / archive / create-app
│  ├─ helper/            # 共用工具与常量
│  └─ templates/         # 模板
├─ shared/               # 跨应用共享代码（别名 @shared）
├─ index.html            # 通用 HTML 模板，支持注入 title
├─ vite.config.ts        # 基础 Vite 配置，按 appName 动态加载
├─ package.json          # 顶层脚本与依赖
└─ pnpm-workspace.yaml   # Workspace 配置（apps/*）
```

## 创建应用

- 新建应用：`pnpm create:app <app-name> [template-name]`
  - 若省略 `template-name`，将交互式选择；模板位于 `scripts/templates/*.zip`
- 初始仅提供 `empty.zip`，可通过 `pnpm archive <existing-app> [zip-name]` 从已有应用生成模板
- 创建后：
  - 安装依赖：`pnpm install`
  - 启动开发：`pnpm dev <app-name>`

## 内置模板

- entry：一个只包含 main.ts 的空项目

- 模板来源：`scripts/templates/*.zip`
- 生成模板：`pnpm archive <app-name> [zip-name]`（自动依据 `.gitignore` 排除文件）

## 应用配置

- 每个应用需包含 `apps/<app-name>/package.json`，可扩展：
  - `htmlData`：注入到 `index.html`（例如设置 `<title>`）
  - `viteConfig`：按需覆盖/扩展基础 Vite 配置
- 示例：

```json
{
  "name": "my-app",
  "htmlData": { "title": "My App" },
  "viteConfig": { "server": { "port": 5173 } }
}
```

## 环境变量

- 位置：`apps/<app-name>/.env*`（`envDir` 指向应用目录）
- 命名：仅 `VITE_*` 前缀会暴露到客户端
- 模式：支持 `.env`, `.env.development`, `.env.production`, `.env.local`
- 读取：`import.meta.env.VITE_API_BASE`
- 静态资源：`apps/<app-name>/public` 会作为公共资源目录

## 常用命令

- 开发：`pnpm dev <app-name>`（启动 Vite 开发服务器并打印访问地址）
- 构建：`pnpm build <app-name>`（产物输出至 `dist/<app-name>`）
- 预览：`pnpm preview <app-name>`（本地静态预览服务器，打印访问地址）
- 打包模板：`pnpm archive <app-name> [zip-name]`
- 创建应用：`pnpm create:app <app-name> [template-name]`
- 代码质量：`pnpm lint` / `pnpm lint:fix`；格式化：`pnpm format` / `pnpm format:check`

## 最佳实践

- 目录建议：`src/main.(ts|tsx)`、`public/`、`package.json`
- 别名：`'@'` 指向应用 `src`，`'@shared'` 指向仓库 `shared`
- 环境变量统一使用 `VITE_*`，避免在客户端泄露非前缀变量
- 提交前运行 `pnpm lint` 与 `pnpm format:check` 保持一致风格
- 共享逻辑尽量放在 `shared/`，避免复制粘贴

## 许可证

MIT License
