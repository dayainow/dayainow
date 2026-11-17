// Local release evidence only. Does not build on EAS or submit to a store.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'release', 'candidate');
mkdirSync(out, { recursive: true });
const report = { createdAt: new Date().toISOString(), scope: 'local checks; not store approval or native purchase verification', checks: [], inputHashes: {} };
for (const name of ['package-lock.json', 'app.json', 'eas.json']) {
  report.inputHashes[name] = createHash('sha256').update(readFileSync(join(root, name))).digest('hex');
}
const checks = [
  ['tests', 'npm', ['test', '--', '--runInBand']],
  ['types', 'npx', ['--no-install', 'tsc', '--noEmit']],
  ['bundles', 'npx', ['--no-install', 'expo', 'export', '--platform', 'all', '--output-dir', join(out, 'bundles')]],
];
for (const [name, command, args] of checks) {
  console.log(`Checking ${name}…`);
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: { ...process.env, CI: '1' }, maxBuffer: 32 * 1024 * 1024 });
  const log = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`;
  writeFileSync(join(out, `${name}.log`), log);
  report.checks.push({ name, passed: result.status === 0 });
  writeFileSync(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  if (result.status !== 0) {
    console.error(log);
    process.exit(1);
  }
}
console.log(`Local checks passed: ${out}\nNative purchase tests, security review and store setup still required.`);
