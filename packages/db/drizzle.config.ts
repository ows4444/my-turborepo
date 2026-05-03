import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  schema: path.resolve(__dirname, "./src/schema"),
  out: path.resolve(__dirname, "./drizzle"),

  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  verbose: true,
  strict: true,
});
