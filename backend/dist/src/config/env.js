import "dotenv/config";
import { z } from "zod";
const emptyToUndefined = (value) => typeof value === "string" && value.trim() === "" ? undefined : value;
const optionalNonEmptyString = () => z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = () => z.preprocess(emptyToUndefined, z.string().url().optional());
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
    QUEUE_APP_ORIGIN: optionalUrl(),
    DIGITAL_TWIN_APP_ORIGIN: optionalUrl(),
    APP_ORIGINS: optionalNonEmptyString(),
    SEED_STAFF_EMAIL: z.string().email(),
    SEED_STAFF_PASSWORD: z.string().min(8),
    GEMINI_API_KEY: optionalNonEmptyString(),
    GEMINI_MODEL: z.string().min(1).default("gemini-3-flash-preview"),
    GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).default(60000),
    SYNC_STATE_PATH: z.string().default(".data/spreadsheet-sync.json"),
    DIGITAL_TWIN_TRAINING_CSV_PATH: optionalNonEmptyString(),
    MARKETING_CONTENT_PATH: z.string().default("../Marketing"),
    EMAILJS_SERVICE_ID: optionalNonEmptyString(),
    EMAILJS_TEMPLATE_ID: optionalNonEmptyString(),
    EMAILJS_PUBLIC_KEY: optionalNonEmptyString(),
    EMAILJS_PRIVATE_KEY: optionalNonEmptyString(),
    EMAILJS_API_URL: z.string().url().default("https://api.emailjs.com/api/v1.0/email/send"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
}
export const env = parsed.data;
