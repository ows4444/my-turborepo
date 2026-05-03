import { z } from "zod";
import { loadEnv } from "./load";

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  PORT: z.coerce
    .number()
    .int()
    .positive("PORT must be a valid positive number"),

  CSRF_SECRET: z.string().min(1, "CSRF_SECRET is required"),

  COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET is required"),

  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),

  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),

  ACCESS_TOKEN_TTL: z.string().min(1, "ACCESS_TOKEN_TTL is required"),

  REFRESH_TOKEN_SECRET:z.string().min(1, "REFRESH_TOKEN_SECRET is required"),

  REFRESH_TOKEN_TTL: z.string().min(1, "REFRESH_TOKEN_TTL is required"),

});

export type ApiEnv = z.infer<typeof apiEnvSchema> & {
  isProd: boolean;
};

export const getApiEnv = (() => {
  let cached: ApiEnv | null = null;

  return (): ApiEnv => {
    if (!cached) {
      loadEnv();
      const result = apiEnvSchema.safeParse(process.env);

      if (!result.success) {
        const formatted = result.error.issues
          .map((issue) => {
            const field = issue.path.join(".");

            switch (field) {
              case "NODE_ENV":
                return "NODE_ENV must be one of: development, production, test";

              case "DATABASE_URL":
                return "DATABASE_URL is required (example: postgres://user:pass@host:5432/db)";

              case "PORT":
                return "PORT must be a valid number (example: 3001)";

              case "CSRF_SECRET":
                return "CSRF_SECRET is required (example: 0123456789ABCDE)";

              case "COOKIE_SECRET":
                return "COOKIE_SECRET is required";

              case "REDIS_URL":
                return "REDIS_URL must be a valid URL (example: redis://user:pass@host:6379)";

              case "ACCESS_TOKEN_SECRET":
                return "ACCESS_TOKEN_SECRET is required (example: 0123456789ABCDE)";

                case "REFRESH_TOKEN_SECRET":
                  return "REFRESH_TOKEN_SECRET is required (example: 0123456789ABCDE)";
              default:
                return `${field}: ${issue.message}`;
            }
          })
          .join("\n");

        console.error("\n❌ Invalid environment variables:\n");
        console.error(formatted);
        console.error("\n👉 Check your .env file\n");

        process.exit(1);
      }

      const data = result.data;

      cached = {
        ...data,
        isProd: data.NODE_ENV === "production",
      };
    }

    return cached;
  };
})();
