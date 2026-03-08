import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CUSTOMER_APP_ORIGIN: z.string().url(),
  COMPANY_APP_ORIGIN: z.string().url(),
  SEED_STAFF_EMAIL: z.string().email(),
  SEED_STAFF_PASSWORD: z.string().min(8),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-3-flash-preview"),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).default(60000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
