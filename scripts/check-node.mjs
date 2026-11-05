// Runs first in the npm scripts dev, prepare-data, build, build:synthetic, build:worst-case,
// check, check-links, launch-check, release-check and post-deploy-check (audit B85, B87).
// They import TypeScript directly, which needs Node 22.18 or later (type stripping), and
// @astrojs/preact 6.1.1 declares Node 22.23.4 or later, as package.json's engines and .nvmrc
// do. An older Node, such as the Mac's Homebrew 20 or nvm's default 16, failed later with
// ERR_UNKNOWN_FILE_EXTENSION; this says what to do instead. No imports, so it runs on any Node.
const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && (minor < 23 || (minor === 23 && patch < 4)))) {
  console.error(`TB Health needs Node 22.23.4 or later (see .nvmrc): run nvm use. This is Node ${process.versions.node}.`);
  process.exit(1);
}
