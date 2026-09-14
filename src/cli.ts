#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compare } from "./compare.js";
import { readEnvExample } from "./envfile.js";
import { EXIT_ERROR, exitCodeFor, formatReport } from "./report.js";
import { scanDirectory } from "./scanner.js";

const HELP = `envxref — compare process.env usage against .env.example

Usage:
  envxref [directory]

Arguments:
  directory   Directory to scan (default: current working directory)

Options:
  -h, --help     Show this help
  -v, --version  Show version

Exit codes:
  0  all used variables are documented in .env.example
  1  one or more used variables are missing from .env.example
  2  internal/runtime error
`;

interface ParsedArgs {
  directory: string;
  help: boolean;
  version: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let directory = ".";
  let help = false;
  let version = false;

  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") help = true;
    else if (arg === "-v" || arg === "--version") version = true;
    else directory = arg;
  }

  return { directory, help, version };
}

async function readVersion(): Promise<string> {
  const pkgUrl = new URL("../package.json", import.meta.url);
  const { readFile } = await import("node:fs/promises");
  const pkg = JSON.parse(await readFile(pkgUrl, "utf8")) as { version: string };
  return pkg.version;
}

export async function run(argv: string[]): Promise<number> {
  const args = parseArgs(argv);

  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (args.version) {
    process.stdout.write(`${await readVersion()}\n`);
    return 0;
  }

  const root = path.resolve(args.directory);
  const usages = await scanDirectory(root);

  const envExamplePath = path.join(root, ".env.example");
  const documented = await readEnvExample(envExamplePath);

  if (documented === null) {
    process.stderr.write(
      `No .env.example found at ${envExamplePath}\n`,
    );
    // Without a reference file, any used variable is effectively undocumented.
  }

  const result = compare(usages, documented ?? []);

  for (const line of formatReport(result)) {
    process.stdout.write(`${line}\n`);
  }

  return exitCodeFor(result);
}

// Only run when executed directly (not when imported by tests).
function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  run(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`envxref: ${message}\n`);
      process.exit(EXIT_ERROR);
    });
}
