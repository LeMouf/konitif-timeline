import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Package already built by trusted local tooling. Never imports or executes the candidate. */
export function prepareTimelineModuleDistribution(source, destination) {
  source = resolve(source); destination = resolve(destination);
  if (existsSync(destination)) throw new Error('Destination must be new; existing distributions are immutable.');
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  if (pkg.name !== '@konitif/timeline' || !/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Unexpected Timeline package.');
  const tools = pkg.dependencies?.['@konitif/tools'];
  if (!/^\d+\.\d+\.\d+$/.test(tools ?? '')) throw new Error('Exact tools dependency required.');
  const lock = JSON.parse(readFileSync(join(source, 'package-lock.json'), 'utf8'));
  if (lock.name !== pkg.name || lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version
      || JSON.stringify(lock.packages[''].dependencies) !== JSON.stringify(pkg.dependencies)) throw new Error('Release lock does not match package identity.');
  const paths = [];
  function collect(path) {
    const full = join(source, path); const stat = lstatSync(full);
    if (stat.isSymbolicLink()) throw new Error('Distribution symlinks refused.');
    if (stat.isDirectory()) for (const name of readdirSync(full).sort()) collect(`${path}/${name}`);
    else if (stat.isFile()) paths.push(path);
    else throw new Error('Unsupported distribution file.');
  }
  for (const path of ['dist', 'src', 'package.json', 'package-lock.json', 'README.md', 'LICENSE.md']) collect(path);
  if (!paths.includes('dist/toolModule.js') || !paths.includes('dist/index.js')) throw new Error('Build Timeline before preparing distribution.');
  const artifacts = paths.sort().map(path => ({ module: `./${path}`, sha256: `sha256:${createHash('sha256').update(readFileSync(join(source, path))).digest('hex')}` }));
  const manifest = { schemaVersion: 'konitif-extension-manifest.v2', id: 'konitif.timeline', displayName: 'KONITIF Timeline', version: pkg.version, packageName: pkg.name,
    entrypoints: [{ kind: 'module', moduleId: 'konitif.timeline', module: './dist/toolModule.js', exportName: 'timelineToolModule', contract: 'konitif-tool-module.v1' }],
    capabilities: { provides: [], consumes: [] }, permissions: [],
    dependencies: [{ packageName: '@konitif/tools', versionRange: tools, resolvedVersion: tools, scope: 'runtime', family: 'konitif' }], artifacts };
  const candidate = { packageName: pkg.name, packageVersion: pkg.version, manifest, availableArtifacts: artifacts };
  const descriptor = JSON.stringify(candidate, null, 2) + '\n';
  if (Buffer.byteLength(descriptor) > 1024 * 1024 || paths.reduce((sum, path) => sum + lstatSync(join(source, path)).size, 0) > 8 * 1024 * 1024) throw new Error('Browser import limits exceeded.');
  mkdirSync(destination, { recursive: true });
  for (const path of paths) { mkdirSync(resolve(destination, path, '..'), { recursive: true }); cpSync(join(source, path), join(destination, path)); }
  writeFileSync(join(destination, 'konitif-candidate.json'), descriptor);
  return { destination, files: artifacts.length, version: pkg.version };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) throw new Error('Expected source package and new destination.');
  console.log(JSON.stringify(prepareTimelineModuleDistribution(process.argv[2], process.argv[3])));
}
