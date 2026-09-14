/**
 * Public API for envxref.
 *
 * The CLI in `cli.ts` is a thin wrapper over these building blocks. They are
 * exported so envxref can also be used as a library.
 */
export type {
  ComparisonResult,
  Detector,
  EnvUsage,
  VariableReport,
  VariableStatus,
} from "./types.js";

export { scanDirectory, IGNORED_DIRECTORIES } from "./scanner.js";
export { parseEnvExample, readEnvExample } from "./envfile.js";
export { compare } from "./compare.js";
export {
  formatReport,
  exitCodeFor,
  EXIT_OK,
  EXIT_MISSING,
  EXIT_ERROR,
} from "./report.js";
export {
  detectors,
  detectorForExtension,
  supportedExtensions,
} from "./detectors/index.js";
