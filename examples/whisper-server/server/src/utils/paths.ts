import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Server root is 2 levels up from utils/paths.ts
export const SERVER_ROOT = join(__dirname, '..', '..');

// Common paths relative to server root
export const PATHS = {
  uploads: join(SERVER_ROOT, 'uploads'),
  models: join(SERVER_ROOT, 'models'),
} as const;

// Helper to get full path for a file in a specific directory
export const getPath = (directory: keyof typeof PATHS, file?: string) => {
  const basePath = PATHS[directory];
  return file ? join(basePath, file) : basePath;
};