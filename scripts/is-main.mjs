// Whether a script was run directly (node scripts/x.mjs), not imported by a test. Compares
// real paths: run through a symlinked path, a plain comparison skipped main() and exited 0
// (audit B74).
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMain(moduleUrl) {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
