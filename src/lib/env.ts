import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://replace-me"),
  DIRECT_URL: z.string().min(1).default("postgresql://replace-me"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1)
    .default("change-me.apps.googleusercontent.com"),
  GOOGLE_CLIENT_SECRET: z.string().min(1).default("change-me"),
  SESSION_SECRET: z
    .string()
    .min(32)
    .default("replace-this-session-secret-with-at-least-32-characters"),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(20)
    .default("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="),
  ADMIN_EMAILS: z.string().default(""),
  CRON_SECRET: z.string().min(12).default("replace-this-cron-secret"),
  GMAIL_SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
  GMAIL_SYNC_DELAY_MS: z.coerce.number().int().min(0).max(5000).default(250),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function getAdminEmailSet() {
  return new Set(
    getEnv()
      .ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isGoogleConfigured() {
  const env = getEnv();
  return (
    !env.GOOGLE_CLIENT_ID.startsWith("change-me") &&
    env.GOOGLE_CLIENT_SECRET !== "change-me"
  );
}

export function getAppUrlFallback() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return "http://localhost:3000";
  }

  try {
    return new URL(appUrl).toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

export function isGoogleConfiguredSafe() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

  return clientId.length > 0 && !clientId.startsWith("change-me") && clientSecret !== "change-me";
}

export function resolveAppUrl(input?: Request | URL | string) {
  if (process.env.NODE_ENV === "production") {
    return getEnv().APP_URL;
  }

  if (input instanceof Request) {
    return new URL(input.url).origin;
  }

  if (input instanceof URL) {
    return input.origin;
  }

  if (typeof input === "string" && input.length > 0) {
    return new URL(input).origin;
  }

  return getEnv().APP_URL;
}

export function getGoogleRedirectUri(input?: Request | URL | string) {
  return new URL("/api/auth/google/callback", resolveAppUrl(input)).toString();
}

export function shouldUseSecureCookies(input?: Request | URL | string) {
  return process.env.NODE_ENV === "production" || resolveAppUrl(input).startsWith("https://");
}
