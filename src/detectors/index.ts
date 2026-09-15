import type { Detector } from "../types.js";
import { javascriptDetector } from "./javascript.js";
import { pythonDetector } from "./python.js";

/**
 * All registered detectors. To support a new language, add its detector here.
 */
export const detectors: readonly Detector[] = [
  javascriptDetector,
  pythonDetector,
];

/**
 * A lookup from file extension (including leading dot) to the detector that
 * handles it.
 */
const byExtension = new Map<string, Detector>();
for (const detector of detectors) {
  for (const ext of detector.extensions) {
    byExtension.set(ext, detector);
  }
}

/** Return the detector for a given file extension, or `undefined`. */
export function detectorForExtension(ext: string): Detector | undefined {
  return byExtension.get(ext);
}

/** Every file extension covered by a registered detector. */
export function supportedExtensions(): string[] {
  return [...byExtension.keys()];
}

export { javascriptDetector, pythonDetector };
