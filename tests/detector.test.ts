import { describe, expect, it } from "vitest";
import { javascriptDetector } from "../src/detectors/javascript.js";

describe("javascriptDetector", () => {
  it("detects dot access", () => {
    const usages = javascriptDetector.detect(
      "const url = process.env.DATABASE_URL;",
      "db.ts",
    );
    expect(usages).toEqual([{ name: "DATABASE_URL", file: "db.ts", line: 1 }]);
  });

  it("detects double-quoted bracket access", () => {
    const usages = javascriptDetector.detect(
      'const url = process.env["DATABASE_URL"];',
      "db.ts",
    );
    expect(usages).toEqual([{ name: "DATABASE_URL", file: "db.ts", line: 1 }]);
  });

  it("detects single-quoted bracket access", () => {
    const usages = javascriptDetector.detect(
      "const url = process.env['DATABASE_URL'];",
      "db.ts",
    );
    expect(usages).toEqual([{ name: "DATABASE_URL", file: "db.ts", line: 1 }]);
  });

  it("reports correct line numbers across multiple lines", () => {
    const source = [
      "const a = 1;",
      "const b = process.env.PORT;",
      "",
      "const c = process.env.HOST;",
    ].join("\n");
    const usages = javascriptDetector.detect(source, "app.ts");
    expect(usages).toEqual([
      { name: "PORT", file: "app.ts", line: 2 },
      { name: "HOST", file: "app.ts", line: 4 },
    ]);
  });

  it("detects multiple references on one line", () => {
    const usages = javascriptDetector.detect(
      "const x = process.env.A || process.env.B;",
      "x.ts",
    );
    expect(usages.map((u) => u.name)).toEqual(["A", "B"]);
  });

  it("handles whitespace and CRLF line endings", () => {
    const usages = javascriptDetector.detect(
      "a\r\nconst x = process . env . SPACED;\r\n",
      "x.ts",
    );
    expect(usages).toEqual([{ name: "SPACED", file: "x.ts", line: 2 }]);
  });

  it("ignores unrelated env-like text", () => {
    const usages = javascriptDetector.detect(
      "const env = { DATABASE_URL: 1 };\nmyProcess.env.NOPE;",
      "x.ts",
    );
    expect(usages).toEqual([]);
  });
});
