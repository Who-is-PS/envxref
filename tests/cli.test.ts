import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseArgs, run } from "../src/cli.js";

let root: string;
let stdout: string;
let stderr: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "envxref-cli-"));
  stdout = "";
  stderr = "";
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function write(relPath: string, content: string): void {
  const full = path.join(root, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

describe("parseArgs", () => {
  it("defaults the directory to the current directory", () => {
    expect(parseArgs([])).toEqual({ directory: ".", help: false, version: false });
  });

  it("reads a directory argument", () => {
    expect(parseArgs(["./app"]).directory).toBe("./app");
  });

  it("recognizes help and version flags", () => {
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-v"]).version).toBe(true);
  });
});

describe("run", () => {
  it("exits 0 when all used variables are documented", async () => {
    write("src/db.ts", "process.env.DATABASE_URL;");
    write(".env.example", "DATABASE_URL=");

    const code = await run([root]);

    expect(code).toBe(0);
    expect(stdout).toContain("✓ DATABASE_URL");
  });

  it("exits 1 when a used variable is missing from .env.example", async () => {
    write("src/cache.ts", "process.env.REDIS_URL;");
    write(".env.example", "DATABASE_URL=");

    const code = await run([root]);

    expect(code).toBe(1);
    expect(stdout).toContain("✗ REDIS_URL");
    expect(stdout).toContain("missing from .env.example");
  });

  it("exits 0 for unused documented variables (warning only)", async () => {
    write("src/db.ts", "process.env.DATABASE_URL;");
    write(".env.example", "DATABASE_URL=\nOLD_API_URL=");

    const code = await run([root]);

    expect(code).toBe(0);
    expect(stdout).toContain("⚠ OLD_API_URL");
  });

  it("warns on stderr when .env.example is missing", async () => {
    write("src/db.ts", "process.env.DATABASE_URL;");

    const code = await run([root]);

    expect(code).toBe(1);
    expect(stderr).toContain("No .env.example found");
  });

  it("never prints values, only variable names", async () => {
    write("src/db.ts", "process.env.DATABASE_URL;");
    write(".env.example", "DATABASE_URL=postgres://user:supersecret@host/db");

    await run([root]);

    expect(stdout).not.toContain("supersecret");
  });

  it("prints help and exits 0", async () => {
    const code = await run(["--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("Usage:");
  });
});
