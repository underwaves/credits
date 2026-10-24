import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'mobile-admin');
const angularCli = path.join(appDir, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const npmCli = process.env.npm_execpath;
const spawnOptions = { cwd: appDir, stdio: 'inherit' };

if (!npmCli) {
  console.error('[mobile-admin] Run this script through `npm run build:mobile-admin`.');
  process.exit(1);
}

function runNpm(args, label) {
  console.log(`[mobile-admin] ${label}`);
  const result = spawnSync(process.execPath, [npmCli, ...args], spawnOptions);
  if (result.error) {
    console.error(`[mobile-admin] ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(angularCli)) {
  // Render sets NODE_ENV=production for service builds, which makes npm omit
  // Angular CLI and other devDependencies unless we explicitly include them.
  runNpm(['ci', '--include=dev'], 'Installing locked Ionic build dependencies…');
}

runNpm(
  ['run', 'build', '--', '--base-href=/mobile-admin/'],
  'Building the Ionic app for /mobile-admin/…'
);
