import { describe, expect, it } from "vitest";
import { javascriptDetector } from "../src/detectors/javascript.js";
import { pythonDetector } from "../src/detectors/python.js";

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

  it("detects Deno.env.get with both quote styles and tracks locations", () => {
    const source = [
      'const token = Deno.env.get("TOKEN");',
      "const host = Deno.env.get('HOST');",
    ].join("\n");
    const usages = javascriptDetector.detect(source, "deno.ts");
    expect(usages).toEqual([
      { name: "TOKEN", file: "deno.ts", line: 1 },
      { name: "HOST", file: "deno.ts", line: 2 },
    ]);
  });

  it("ignores dynamic Deno.env.get arguments", () => {
    const usages = javascriptDetector.detect("Deno.env.get(name);", "deno.ts");
    expect(usages).toEqual([]);
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

describe("pythonDetector", () => {
  it("detects double-quoted os.getenv", () => {
    const usages = pythonDetector.detect(
      'url = os.getenv("DATABASE_URL")',
      "db.py",
    );
    expect(usages).toEqual([{ name: "DATABASE_URL", file: "db.py", line: 1 }]);
  });

  it("detects single-quoted os.getenv", () => {
    const usages = pythonDetector.detect(
      "url = os.getenv('DATABASE_URL')",
      "db.py",
    );
    expect(usages).toEqual([{ name: "DATABASE_URL", file: "db.py", line: 1 }]);
  });

  it("detects os.getenv with a default argument", () => {
    const usages = pythonDetector.detect(
      'port = os.getenv("PORT", "8080")',
      "app.py",
    );
    expect(usages).toEqual([{ name: "PORT", file: "app.py", line: 1 }]);
  });

  it("reports correct line numbers across multiple lines", () => {
    const source = [
      "import os",
      'port = os.getenv("PORT")',
      "",
      'host = os.getenv("HOST")',
    ].join("\n");
    const usages = pythonDetector.detect(source, "app.py");
    expect(usages).toEqual([
      { name: "PORT", file: "app.py", line: 2 },
      { name: "HOST", file: "app.py", line: 4 },
    ]);
  });

  it("detects multiple references on one line", () => {
    const usages = pythonDetector.detect(
      'x = os.getenv("A") or os.getenv("B")',
      "x.py",
    );
    expect(usages.map((u) => u.name)).toEqual(["A", "B"]);
  });

  it("handles whitespace and CRLF line endings", () => {
    const usages = pythonDetector.detect(
      'a\r\nx = os . getenv ( "SPACED" )\r\n',
      "x.py",
    );
    expect(usages).toEqual([{ name: "SPACED", file: "x.py", line: 2 }]);
  });

  it("ignores os.environ and dynamic names", () => {
    const usages = pythonDetector.detect(
      'os.environ["SKIP"]\nos.getenv(name)\nos.getenv(key="NOPE")\n',
      "x.py",
    );
    expect(usages).toEqual([]);
  });
});
