// Runs after `npm install`. Render's build command is `npm install`, so this is what
// produces the production bundle in dist/ on deploy. Set SKIP_WEB_BUILD=1 to opt out.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.env.SKIP_WEB_BUILD === '1') {
  console.log('[postinstall] SKIP_WEB_BUILD=1 → skipping web build');
  process.exit(0);
}

const vitePath = path.join(root, 'node_modules', 'vite');
if (!existsSync(vitePath)) {
  console.error('\n❌ [postinstall] Error: "vite" is not installed.');
  console.error('   Vite is required in "dependencies" so frontend assets can be built on deployment.');
  console.error('   Please ensure "vite" is listed in "dependencies" in package.json.\n');
  process.exit(1);
}

console.log('[postinstall] Building frontend production bundle (vite build)…');
const viteBin = path.join(vitePath, 'bin', 'vite.js');
const result = spawnSync(process.execPath, [viteBin, 'build', '--config', 'vite.config.js'], {
  cwd: root,
  stdio: 'inherit'
});

// A failed build must fail the deploy rather than ship a site without its frontend.
if (result.status !== 0) {
  console.error(`\n❌ [postinstall] Vite build failed with exit code ${result.status ?? 1}. Deployment cannot proceed without frontend assets.\n`);
  process.exit(result.status ?? 1);
}

const distIndexPath = path.join(root, 'dist', 'index.html');
if (!existsSync(distIndexPath)) {
  console.error('\n❌ [postinstall] Vite build completed but "dist/index.html" was not created.\n');
  process.exit(1);
}

console.log('[postinstall] ✅ Production bundle built successfully in dist/\n');
process.exit(0);
