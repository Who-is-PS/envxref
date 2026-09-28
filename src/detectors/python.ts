import type { Detector, EnvUsage } from "../types.js";

/**
 * Matches Python environment-variable references with static names:
 *
 *   os.getenv("DATABASE_URL")
 *   os.getenv('DATABASE_URL')
 *   os.getenv("DATABASE_URL", "default")
 *   os.environ["DATABASE_URL"]
 *   os.environ.get("DATABASE_URL", "default")
 *
 * Groups 2 and 4 capture the variable name in each alternative.
 * Keyword-argument forms and dynamic names are intentionally not matched —
 * same constraint as the JavaScript detector.
 */
const PYTHON_ENV_REFERENCE =
  /\bos\s*\.\s*(?:(?:getenv|environ\s*\.\s*get)\s*\(\s*(['"])([^'"]+)\1|environ\s*\[\s*(['"])([^'"]+)\3\s*\])/g;

/**
 * Detector for Python environment-variable access.
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
      PYTHON_ENV_REFERENCE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = PYTHON_ENV_REFERENCE.exec(line)) !== null) {
        const name = match[2] ?? match[4];
        if (name) {
          usages.push({ name, file, line: i + 1 });
        }
      }
    }

    return usages;
  },
};
