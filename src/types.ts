/**
 * A single reference to an environment variable found in source code.
 */
export interface EnvUsage {
  /** The environment variable name, e.g. `DATABASE_URL`. */
  name: string;
  /** Path to the file the reference was found in (relative to the scan root). */
  file: string;
  /** 1-based line number of the reference. */
  line: number;
}

/**
 * Detects environment variable usage for one language / syntax family.
 *
 * New languages (Python, Go, ...) are added by implementing this interface
 * and registering it in `src/detectors/index.ts` — no other module needs to
 * change.
 */
export interface Detector {
  /** Human-readable name, e.g. `"javascript"`. */
  name: string;
  /** File extensions this detector handles, including the leading dot. */
  extensions: readonly string[];
  /**
   * Find every environment variable reference in a file's contents.
   *
   * @param content  The full file contents.
   * @param file     The file path, used to populate {@link EnvUsage.file}.
   */
  detect(content: string, file: string): EnvUsage[];
}

/**
 * The status of a variable after comparing source usage with `.env.example`.
 */
export type VariableStatus =
  /** Used in source and present in `.env.example`. */
  | "documented"
  /** Used in source but missing from `.env.example`. */
  | "missing"
  /** Present in `.env.example` but never used in source. */
  | "unused";

/**
 * The comparison outcome for a single variable.
 */
export interface VariableReport {
  name: string;
  status: VariableStatus;
  /** First usage location, if the variable is referenced in source. */
  usage?: EnvUsage;
}

/**
 * The full result of comparing scanned usage against `.env.example`.
 */
export interface ComparisonResult {
  variables: VariableReport[];
  documented: string[];
  missing: string[];
  unused: string[];
}
