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

if (!existsSync(path.join(root, 'node_modules', 'vite'))) {
  console.log('[postinstall] vite not installed → skipping web build');
  process.exit(0);
}

console.log('[postinstall] building web bundle (vite build)…');
const result = spawnSync(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--config', 'vite.config.js'], {
  cwd: root,
  stdio: 'inherit'
});

// A failed build must fail the deploy rather than ship a site without its frontend.
process.exit(result.status ?? 1);
