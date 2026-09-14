import type { Detector, EnvUsage } from "../types.js";

/**
 * Matches `process.env` references in three forms:
 *
 *   process.env.DATABASE_URL
 *   process.env["DATABASE_URL"]
 *   process.env['DATABASE_URL']
 *
 * Group 1 captures the dot-access name; group 3 captures the bracket-access
 * name (group 2 is the matched quote character).
 */
const PROCESS_ENV =
  /\bprocess\s*\.\s*env\s*(?:\.\s*([A-Za-z_$][A-Za-z0-9_$]*)|\[\s*(['"])([^'"]+)\2\s*\])/g;

/**
 * Detector for JavaScript / TypeScript `process.env.*` usage.
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
      PROCESS_ENV.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = PROCESS_ENV.exec(line)) !== null) {
        const name = match[1] ?? match[3];
        if (name) {
          usages.push({ name, file, line: i + 1 });
        }
      }
    }

    return usages;
  },
};
