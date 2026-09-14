import { describe, expect, it } from "vitest";
import { compare } from "../src/compare.js";
import {
  EXIT_MISSING,
  EXIT_OK,
  exitCodeFor,
  formatReport,
} from "../src/report.js";
import type { EnvUsage } from "../src/types.js";

const usage = (name: string, file: string, line: number): EnvUsage => ({
  name,
  file,
  line,
});

describe("exitCodeFor", () => {
  it("returns 1 when variables are missing", () => {
    const result = compare([usage("A", "a.ts", 1)], []);
    expect(exitCodeFor(result)).toBe(EXIT_MISSING);
  });

  it("returns 0 when everything used is documented", () => {
    const result = compare([usage("A", "a.ts", 1)], ["A"]);
    expect(exitCodeFor(result)).toBe(EXIT_OK);
  });

  it("returns 0 when only unused warnings exist", () => {
    const result = compare([], ["A"]);
    expect(exitCodeFor(result)).toBe(EXIT_OK);
  });
});

describe("formatReport", () => {
  it("renders the documented, missing, and unused states", () => {
    const result = compare(
      [
        usage("DATABASE_URL", "src/db.ts", 10),
        usage("REDIS_URL", "src/cache.ts", 17),
      ],
      ["DATABASE_URL", "OLD_API_URL"],
    );

    const output = formatReport(result).join("\n");

    expect(output).toContain("✓ DATABASE_URL");
    expect(output).toContain("src/db.ts:10");
    expect(output).toContain("✗ REDIS_URL");
    expect(output).toContain("missing from .env.example");
    expect(output).toContain("⚠ OLD_API_URL");
    expect(output).toContain("unused");
    expect(output).toContain("1 documented, 1 missing, 1 unused");
  });

  it("reports when nothing is found", () => {
    const result = compare([], []);
    expect(formatReport(result)).toEqual([
      "No environment variables found in source or .env.example.",
    ]);
  });
});
