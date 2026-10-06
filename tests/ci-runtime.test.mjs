import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('CI selects compatible installed runtimes and rejects missing or obsolete runtimes', { skip: process.platform === 'win32' }, () => {
  const fixture = mkdtempSync(join(tmpdir(), 'timeline-ci-runtime-'));
  try {
    execFileSync('bash', [fileURLToPath(new URL('./runtime-selection.sh', import.meta.url)), fixture,
      fileURLToPath(new URL('../scripts/select-ci-runtime.sh', import.meta.url))], { stdio: 'pipe' });
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
