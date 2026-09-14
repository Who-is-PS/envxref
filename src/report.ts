import type { ComparisonResult, VariableReport } from "./types.js";

/** Exit codes used by the CLI. */
export const EXIT_OK = 0;
export const EXIT_MISSING = 1;
export const EXIT_ERROR = 2;

const SYMBOL: Record<VariableReport["status"], string> = {
  documented: "✓", // ✓
  missing: "✗", // ✗
  unused: "⚠", // ⚠
};

/**
 * Determine the process exit code for a comparison result.
 *
 * Missing variables (used but undocumented) fail the run; unused variables are
 * warnings only and never affect the exit code.
 */
export function exitCodeFor(result: ComparisonResult): number {
  return result.missing.length > 0 ? EXIT_MISSING : EXIT_OK;
}

/**
 * Format a comparison result into human-readable output lines.
 *
 * Kept separate from printing so it can be tested without capturing stdout.
 */
export function formatReport(result: ComparisonResult): string[] {
  const lines: string[] = [];

  if (result.variables.length === 0) {
    lines.push("No environment variables found in source or .env.example.");
    return lines;
  }

  const nameWidth = Math.max(...result.variables.map((v) => v.name.length));

  for (const variable of result.variables) {
    const symbol = SYMBOL[variable.status];
    const name = variable.name.padEnd(nameWidth);

    if (variable.status === "unused") {
      lines.push(`${symbol} ${name}  unused`);
      continue;
    }

    const usage = variable.usage!;
    const location = `${usage.file}:${usage.line}`;
    if (variable.status === "missing") {
      lines.push(`${symbol} ${name}  ${location}  missing from .env.example`);
    } else {
      lines.push(`${symbol} ${name}  ${location}`);
    }
  }

  lines.push("");
  lines.push(summaryLine(result));

  return lines;
}

function summaryLine(result: ComparisonResult): string {
  const parts = [
    `${result.documented.length} documented`,
    `${result.missing.length} missing`,
    `${result.unused.length} unused`,
  ];
  return parts.join(", ");
}
