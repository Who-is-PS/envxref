import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scanDirectory } from "../src/scanner.js";

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "envxref-scan-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(relPath: string, content: string): void {
  const full = path.join(root, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

describe("scanDirectory", () => {
  it("finds usages across nested supported files", async () => {
    write("src/db.ts", "export const url = process.env.DATABASE_URL;");
    write("src/util/cache.js", "const r = process.env['REDIS_URL'];");

    const usages = await scanDirectory(root);
    const names = usages.map((u) => u.name).sort();

    expect(names).toEqual(["DATABASE_URL", "REDIS_URL"]);
    const db = usages.find((u) => u.name === "DATABASE_URL");
    expect(db?.file).toBe(path.join("src", "db.ts"));
    expect(db?.line).toBe(1);
  });

  it("scans all supported extensions", async () => {
    for (const ext of ["js", "jsx", "ts", "tsx", "mjs", "cjs"]) {
      write(`f.${ext}`, `process.env.VAR_${ext.toUpperCase()};`);
    }
    const usages = await scanDirectory(root);
    expect(usages).toHaveLength(6);
  });

  it("ignores node_modules, dist, build, coverage, and .git", async () => {
    write("keep.ts", "process.env.KEEP;");
    for (const dir of ["node_modules", "dist", "build", "coverage", ".git"]) {
      write(`${dir}/skip.ts`, "process.env.SKIP;");
    }
    const usages = await scanDirectory(root);
    expect(usages.map((u) => u.name)).toEqual(["KEEP"]);
  });

  it("ignores unsupported file types", async () => {
    write("readme.md", "process.env.NOPE");
    write("data.json", '{"process.env.NOPE": 1}');
    const usages = await scanDirectory(root);
    expect(usages).toEqual([]);
  });
});
