import { resolve } from 'node:path';

export const TEMPLATE_DIR = resolve(process.cwd(), 'scripts/templates');
export const GIT_IGNORE_PATH = resolve(process.cwd(), '.gitignore');
