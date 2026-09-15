import type { Detector, EnvUsage } from "../types.js";

/**
 * Matches `os.getenv` references in the forms:
 *
 *   os.getenv("DATABASE_URL")
 *   os.getenv('DATABASE_URL')
 *   os.getenv("DATABASE_URL", "default")
 *
 * Group 2 captures the variable name (group 1 is the matched quote).
 * Keyword-argument forms like `os.getenv(key=...)` and dynamic names are
 * intentionally not matched — same constraint as the JavaScript detector.
 */
const OS_GETENV =
  /\bos\s*\.\s*getenv\s*\(\s*(['"])([^'"]+)\1/g;

/**
 * Detector for Python `os.getenv(...)` usage.
 *
 * Detection is line-based so that line numbers are exact. This is a
 * lightweight regex scan rather than an AST parse, matching the existing
 * JavaScript detector's approach.
 */
export const pythonDetector: Detector = {
  name: "python",
  extensions: [".py"],

  detect(content: string, file: string): EnvUsage[] {
    const usages: EnvUsage[] = [];
    const lines = content.split(/\r\n|\r|\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      OS_GETENV.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = OS_GETENV.exec(line)) !== null) {
        const name = match[2];
        if (name) {
          usages.push({ name, file, line: i + 1 });
        }
      }
    }

    return usages;
  },
};
