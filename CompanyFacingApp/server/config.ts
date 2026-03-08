import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

dotenv.config({ path: resolve(projectRoot, '.env') });

export const config = {
  projectRoot,
  dataDirectory: resolve(projectRoot, 'server', 'data'),
  databasePath: resolve(projectRoot, 'server', 'data', 'company-facing.sqlite'),
  port: Math.max(1, Number(process.env.PORT ?? 3001)),
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:5173',
  sessionDays: Math.max(1, Number(process.env.SESSION_DAYS ?? 7)),
  isProduction: process.env.NODE_ENV === 'production',
} as const;
