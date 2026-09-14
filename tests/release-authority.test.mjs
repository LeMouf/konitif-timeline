import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertPublishingTools, assertReleaseInputs } from '../scripts/check-release.mjs';

const json = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('release identity names the independent Timeline repository', () => {
  const manifest = json('package.json');
  assert.equal(manifest.repository.url, 'git+https://github.com/LeMouf/konitif-timeline.git');
  assert.equal(manifest.version, '0.285.0');
  assert.equal(manifest.license, 'PolyForm-Noncommercial-1.0.0');
});

test('release inputs bind Timeline to its exact repository, lock and tag ref', context => {
  const lockUrl = new URL('../package-lock.json', import.meta.url);
  if (!existsSync(lockUrl)) return context.skip('Standalone package-lock is not present in the workspace source package.');
  const policy = json('release-policy.json');
  const manifest = json('package.json');
  const lock = JSON.parse(readFileSync(lockUrl, 'utf8'));
  const base = {
    GITHUB_REPOSITORY: 'LeMouf/konitif-timeline',
    GITHUB_REF: 'refs/tags/v0.285.0'
  };
  assert.doesNotThrow(() => assertReleaseInputs(policy, manifest, lock, {
    ...base,
    GITHUB_EVENT_NAME: 'push'
  }));
  assert.doesNotThrow(() => assertReleaseInputs(policy, manifest, lock, {
    ...base,
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    TIMELINE_RELEASE_TAG: 'v0.285.0'
  }));
  assert.throws(() => assertReleaseInputs(policy, manifest, lock, {
    ...base,
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    TIMELINE_RELEASE_TAG: 'v0.284.2'
  }));
  assert.throws(() => assertReleaseInputs(policy, manifest, lock, {
    ...base,
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REF: 'refs/heads/main',
    TIMELINE_RELEASE_TAG: 'v0.285.0'
  }));
});

test('Timeline publication requires preinstalled OIDC-capable tools', () => {
  assert.doesNotThrow(() => assertPublishingTools('24.20.0', '11.6.0'));
  assert.throws(() => assertPublishingTools('22.13.0', '11.6.0'));
  assert.throws(() => assertPublishingTools('24.20.0', '11.4.9'));
});

test('Timeline publish workflow is constrained to its release authority', () => {
  const workflow = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tags: \['v\*'\]/);
  assert.match(workflow, /vars\.TIMELINE_NPM_PUBLISH_ENABLED == 'true'/);
  assert.match(workflow, /github\.repository == 'LeMouf\/konitif-timeline'/);
  assert.match(workflow, /environment: npm-release/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /test "\$\{GITHUB_REF\}" = "refs\/tags\/\$\{expected\}"/);
  assert.match(workflow, /merge-base --is-ancestor HEAD origin\/main/);
  assert.match(workflow, /npm publish \.release\/package\.tgz --access public --provenance --ignore-scripts/);
  assert.doesNotMatch(workflow, /npm install -g|npm update/);
});

test('Timeline release preparation retains only the verifier archive', () => {
  const script = readFileSync(new URL('../scripts/prepare-release-archive.mjs', import.meta.url), 'utf8');
  assert.match(script, /realpathSync\(evidence\.archive\)/);
  assert.match(script, /COPYFILE_EXCL/);
  assert.doesNotMatch(script, /npm pack|readdirSync/);
});
