import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Set the plugin version in `manifest.json` and `package.json` together.
 *
 * `current` keeps the version already in the files, so a release can publish the
 * version that was committed by hand. `patch`, `minor` and `major` increment it.
 * Only the version value is rewritten, so formatting and line endings survive.
 */
const PARTS = ['current', 'patch', 'minor', 'major'];
const part = process.argv[2];
if (!PARTS.includes(part)) {
  throw new Error(`Usage: node scripts/bump-version.mjs <${PARTS.join('|')}>`);
}

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = join(root, 'manifest.json');
const packagePath = join(root, 'package.json');
const readVersion = (path) => JSON.parse(readFileSync(path, 'utf8')).version;

const current = readVersion(manifestPath);
if (current !== readVersion(packagePath)) {
  throw new Error(
    `manifest.json (${current}) and package.json (${readVersion(packagePath)}) versions disagree; align them first`,
  );
}

const [major, minor, patch] = current.split('.').map(Number);
if (![major, minor, patch].every(Number.isInteger)) {
  throw new Error(`Unsupported version in manifest.json: ${current}`);
}

const next =
  part === 'major'
    ? `${major + 1}.0.0`
    : part === 'minor'
      ? `${major}.${minor + 1}.0`
      : part === 'patch'
        ? `${major}.${minor}.${patch + 1}`
        : current;

for (const path of [manifestPath, packagePath]) {
  const source = readFileSync(path, 'utf8');
  const updated = source.replace(/("version"\s*:\s*")([^"]+)(")/, `$1${next}$3`);
  if (updated === source && next !== current) {
    throw new Error(`Could not write version ${next} into ${path}`);
  }
  writeFileSync(path, updated);
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${next}\nchanged=${next === current}\n`);
}
console.log(
  next === current
    ? `Releasing the committed version ${current}`
    : `Bumped ${part}: ${current} -> ${next}`,
);
