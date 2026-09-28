import type { Detector, EnvUsage } from "../types.js";

/**
 * Matches JavaScript environment references in these forms:
 *
 *   process.env.DATABASE_URL
 *   process.env["DATABASE_URL"]
 *   process.env['DATABASE_URL']
 *   Deno.env.get("DATABASE_URL")
 *   Deno.env.get('DATABASE_URL')
 *
 * PROCESS_ENV group 1 captures the dot-access name; group 3 captures the
 * bracket-access name. DENO_ENV_GET group 2 captures its string-literal name.
 */
const PROCESS_ENV =
  /\bprocess\s*\.\s*env\s*(?:\.\s*([A-Za-z_$][A-Za-z0-9_$]*)|\[\s*(['"])([^'"]+)\2\s*\])/g;
const DENO_ENV_GET =
  /\bDeno\s*\.\s*env\s*\.\s*get\s*\(\s*(['"])([^'"]+)\1\s*\)/g;

/**
 * Detector for JavaScript / TypeScript `process.env.*` and Deno
 * `Deno.env.get("NAME")` usage.
 *
 * Detection is line-based so that line numbers are exact. This is deliberately
 * a lightweight regex scan rather than a full AST parse: it keeps the first
 * release small and dependency-free while covering the documented patterns.
 */
export const javascriptDetector: Detector = {
  name: "javascript",
  extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],

  detect(content: string, file: string): EnvUsage[] {
    const usages: EnvUsage[] = [];
    const lines = content.split(/\r\n|\r|\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const matches: Array<{ index: number; name: string }> = [];

      PROCESS_ENV.lastIndex = 0;
      let processMatch: RegExpExecArray | null;
      while ((processMatch = PROCESS_ENV.exec(line)) !== null) {
        const name = processMatch[1] ?? processMatch[3];
        if (name) {
          matches.push({ index: processMatch.index, name });
        }
      }

      DENO_ENV_GET.lastIndex = 0;
      let denoMatch: RegExpExecArray | null;
      while ((denoMatch = DENO_ENV_GET.exec(line)) !== null) {
        const name = denoMatch[2];
        if (name) {
          matches.push({ index: denoMatch.index, name });
        }
      }

      matches.sort((a, b) => a.index - b.index);
      for (const { name } of matches) {
        usages.push({ name, file, line: i + 1 });
      }
    }

    return usages;
  },
};
