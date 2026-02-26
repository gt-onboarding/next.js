/**
 * Strips numeric ordering prefixes (e.g. "01-", "02-") from each segment
 * of a path. Segments without a numeric prefix are left unchanged.
 *
 * Example: "01-app/02-guides/content-security-policy" → "app/guides/content-security-policy"
 */
export function stripIndex(path: string): string {
  return path
    .split('/')
    .map((segment) => segment.replace(/^\d+-/, ''))
    .join('/')
}

/**
 * Re-injects numeric ordering prefixes into a stripped path by looking up
 * each segment in a map of stripped paths to their original (prefixed) paths.
 *
 * @param strippedPath - A path with numeric prefixes removed
 * @param pathMap - A map where keys are stripped paths and values are original prefixed paths
 * @returns The original prefixed path, or the stripped path unchanged if no mapping exists
 */
export function injectIndex(
  strippedPath: string,
  pathMap: Map<string, string>
): string {
  return pathMap.get(strippedPath) ?? strippedPath
}
