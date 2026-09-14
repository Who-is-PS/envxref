import { readFile } from "node:fs/promises";

/**
 * Matches a variable declaration line in a `.env` file, with an optional
 * leading `export`. Only the key (group 1) is captured — values are never
 * read or returned.
 */
const ENV_KEY = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/**
 * Parse the variable names declared in a `.env`-style file's contents.
 *
 * Comments (`#`) and blank lines are ignored. Values are intentionally never
 * captured, so no secret value can ever leak through this tool.
 *
 * @returns The declared variable names, in the order they first appear.
 */
export function parseEnvExample(content: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of content.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const match = ENV_KEY.exec(line);
    if (!match) continue;

    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

/**
 * Read and parse a `.env.example` file from disk.
 *
 * @returns The declared variable names, or `null` if the file does not exist.
 * @throws  If the file exists but cannot be read.
 */
export async function readEnvExample(filePath: string): Promise<string[] | null> {
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
  return parseEnvExample(content);
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
