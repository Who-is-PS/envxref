import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { detectorForExtension } from "./detectors/index.js";
import type { EnvUsage } from "./types.js";

/** Directory names that are never scanned. */
export const IGNORED_DIRECTORIES: readonly string[] = [
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
];

/**
 * Recursively scan a directory for environment variable usage.
 *
 * Files are dispatched to a detector based on their extension; unsupported
 * files and ignored directories are skipped.
 *
 * @param root  The directory to scan.
 * @returns All environment variable usages found, with file paths relative to
 *          `root`.
 */
export async function scanDirectory(root: string): Promise<EnvUsage[]> {
  const usages: EnvUsage[] = [];
  await walk(root, root, usages);
  return usages;
}

async function walk(
  dir: string,
  root: string,
  usages: EnvUsage[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.includes(entry.name)) continue;
      await walk(fullPath, root, usages);
      continue;
    }

    if (!entry.isFile()) continue;

    const detector = detectorForExtension(path.extname(entry.name));
    if (!detector) continue;

    const content = await readFile(fullPath, "utf8");
    const relative = path.relative(root, fullPath) || entry.name;
    usages.push(...detector.detect(content, relative));
  }
}
