import fs from "fs";
import path from "path";

type EnvMap = Record<string, string>;

function parseEnv(content: string): EnvMap {
  const result: EnvMap = {};

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");

    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // remove inline comments (only if not quoted)
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const commentIndex = value.indexOf(" #");
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    // remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // normalize CRLF
    value = value.replace(/\r$/, "");

    result[key] = value;
  }

  return result;
}

export function loadEnv() {
  const cwd = process.cwd();

  const files = [
    path.resolve(cwd, "../../.env"), // root (lowest priority)
    path.resolve(cwd, ".env"),      // app (higher priority)
  ];

  const merged: EnvMap = {};

  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf-8");
    const parsed = parseEnv(content);

    Object.assign(merged, parsed);
  }

  // inject into process.env (do NOT overwrite existing runtime env)
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
