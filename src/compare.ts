import type { ComparisonResult, EnvUsage, VariableReport } from "./types.js";

/**
 * Compare environment variable usage found in source with the variables
 * declared in `.env.example`.
 *
 * This is a pure function: it performs no I/O and does not decide exit codes
 * (see {@link ./report.ts}).
 *
 * @param usages    All usages found by scanning source files.
 * @param documented Variable names declared in `.env.example`.
 */
export function compare(
  usages: EnvUsage[],
  documented: string[],
): ComparisonResult {
  const documentedSet = new Set(documented);

  // Group usages by name, keeping the first occurrence as the representative
  // location (usages are already in file/line order from the scanner).
  const firstUsage = new Map<string, EnvUsage>();
  for (const usage of usages) {
    if (!firstUsage.has(usage.name)) {
      firstUsage.set(usage.name, usage);
    }
  }

  const variables: VariableReport[] = [];

  // Used variables: documented or missing.
  for (const [name, usage] of firstUsage) {
    variables.push({
      name,
      status: documentedSet.has(name) ? "documented" : "missing",
      usage,
    });
  }

  // Declared-but-unused variables.
  for (const name of documentedSet) {
    if (!firstUsage.has(name)) {
      variables.push({ name, status: "unused" });
    }
  }

  variables.sort((a, b) => a.name.localeCompare(b.name));

  return {
    variables,
    documented: variables.filter((v) => v.status === "documented").map((v) => v.name),
    missing: variables.filter((v) => v.status === "missing").map((v) => v.name),
    unused: variables.filter((v) => v.status === "unused").map((v) => v.name),
  };
}
