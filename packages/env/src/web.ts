import { z } from "zod";

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  API_SERVICE_URL: z.url(),
  AUTH_SERVICE_URL: z.url(),
  CSRF_SECRET: z.string(),

    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("debug"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const getWebEnv = (() => {
  let cached: WebEnv | null = null;

  return () => {
    if (!cached)
      if (!cached) {
        const result = webEnvSchema.safeParse(process.env);

        if (!result.success) {
          const formatted = result.error.issues
            .map((issue) => {
              const field = issue.path.join(".");

              if (field === "NODE_ENV") {
                return `NODE_ENV must be one of: development, production, test`;
              }

              if (field === "API_SERVICE_URL") {
                return `API_SERVICE_URL is required (example: http://api.com)`;
              }

              if (field === "AUTH_SERVICE_URL") {
                return `API_SERVICE_URL is required (example: http://auth.com)`;
              }

              if (field === "CSRF_SECRET") {
                return `CSRF_SECRET is required (example: 0123456789ABCDE)`;
              }

              return `${field}: ${issue.message}`;
            })
            .join("\n");

          console.error("\n❌ Invalid environment variables:\n");
          console.error(formatted);
          console.error("\n👉 Check your .env file\n");

          process.exit(1);
        }

        cached = result.data;
      }

    return cached;
  };
})();
