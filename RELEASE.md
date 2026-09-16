# Release boundary

`@konitif/timeline` is published only from the standalone
`LeMouf/konitif-timeline` repository. A merge does not publish a package.

Before release:

1. install exactly the reviewed lockfile with lifecycle scripts disabled;
2. build ESM and declarations with the locked TypeScript compiler;
3. run package contracts and the isolated archive consumer;
4. review the exact archive file list, integrity and version;
5. require a matching protected `v<version>` tag on `main` and the
   `npm-release` environment;
6. publish the verified archive through GitHub Actions OIDC.

Publication additionally requires the repository variable
`TIMELINE_NPM_PUBLISH_ENABLED=true`. The initial registry version is a reviewed,
authenticated maintainer bootstrap exception. Configure npm Trusted Publishing
for `LeMouf / konitif-timeline / publish.yml / npm-release` before enabling later
OIDC releases.

## 0.285.0 migration

`projectClipToTimeline` was a source-format adapter and is no longer part of the
generic Timeline API. Hosts now call `projectTimelineSubject` with explicit,
versioned `TimelineTrackProjectionContribution` values. Domain-specific source
formats are adapted by private or application-owned specializations; this keeps
their target, property, frame, unit and interpolation vocabulary outside the
public package.
