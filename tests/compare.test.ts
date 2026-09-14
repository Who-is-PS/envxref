import { describe, expect, it } from "vitest";
import { compare } from "../src/compare.js";
import type { EnvUsage } from "../src/types.js";

const usage = (name: string, file: string, line: number): EnvUsage => ({
  name,
  file,
  line,
});

describe("compare", () => {
  it("classifies documented, missing, and unused variables", () => {
    const usages = [
      usage("DATABASE_URL", "src/db.ts", 10),
      usage("REDIS_URL", "src/cache.ts", 17),
    ];
    const documented = ["DATABASE_URL", "OLD_API_URL"];

    const result = compare(usages, documented);

    expect(result.documented).toEqual(["DATABASE_URL"]);
    expect(result.missing).toEqual(["REDIS_URL"]);
    expect(result.unused).toEqual(["OLD_API_URL"]);
  });

  it("keeps the first usage location for a repeated variable", () => {
    const usages = [
      usage("PORT", "a.ts", 5),
      usage("PORT", "b.ts", 9),
    ];
    const result = compare(usages, ["PORT"]);
    const port = result.variables.find((v) => v.name === "PORT");
    expect(port?.usage).toEqual(usage("PORT", "a.ts", 5));
  });

  it("sorts variables by name", () => {
    const usages = [usage("ZED", "z.ts", 1), usage("ALPHA", "a.ts", 1)];
    const result = compare(usages, []);
    expect(result.variables.map((v) => v.name)).toEqual(["ALPHA", "ZED"]);
  });

  it("treats an empty .env.example as all-missing", () => {
    const result = compare([usage("A", "a.ts", 1)], []);
    expect(result.missing).toEqual(["A"]);
    expect(result.documented).toEqual([]);
  });

  it("handles no usages at all", () => {
    const result = compare([], ["A"]);
    expect(result.unused).toEqual(["A"]);
    expect(result.missing).toEqual([]);
  });
});
