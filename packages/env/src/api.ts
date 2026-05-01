import { z } from "zod";

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number(),
  CSRF_SECRET: z.string(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export const getServerEnv = (() => {
  let cached: ApiEnv | null = null;

  return () => {
    if (!cached)
      if (!cached) {
        const result = apiEnvSchema.safeParse(process.env);

        if (!result.success) {
          const formatted = result.error.issues
            .map((issue) => {
              const field = issue.path.join(".");

              if (field === "NODE_ENV") {
                return `NODE_ENV must be one of: development, production, test`;
              }

              if (field === "DATABASE_URL") {
                return `DATABASE_URL is required (example: postgres://user:pass@host:5432/db)`;
              }

              if (field === "PORT") {
                return `PORT must be a valid number (example: 3001)`;
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
