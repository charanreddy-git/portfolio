import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

function parseEnv(content) {
  const vars = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

if (!existsSync(envPath)) {
  console.error("Missing .env file. Copy .env.example to .env and set RESUME_URL.");
  process.exit(1);
}

const { RESUME_URL = "" } = parseEnv(readFileSync(envPath, "utf8"));
const config = { resumeUrl: RESUME_URL };

writeFileSync(
  join(root, "config.js"),
  `window.SITE_CONFIG = ${JSON.stringify(config, null, 2)};\n`
);

console.log("Generated config.js");
