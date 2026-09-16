# @konitif/timeline

Headless temporal projection, composable track contributions and interaction
state.

## Installation

```sh
npm install @konitif/timeline
```

## What it provides

- Read-only Timeline projections derived from caller-owned subjects.
- Explicit, versioned track contributions composed by the host.
- Local cursor, visible-range and selection state.
- Deterministic viewport normalization, scale, ticks and grid projection.
- Projection-local coordinate mapping, wheel zoom and scrubbing calculations.
- Explicit intents and a deterministic state reducer.
- Numeric track sampling with an injectable interpolation function.
- A portable Timeline tool-module declaration.

## Authority boundary

The package projects temporal subjects without owning their identity or semantic
revision. Track kinds, source formats and domain commands are supplied by
specializations; the public package does not define source-specific track kinds
or media formats.
Cursor position, visible range and selection belong to the Timeline surface.
The package contains no Svelte, DOM, host store, runtime clock authority,
domain-specific semantics or execution policy.

## Quick start

```ts
import {
  createTimelineState,
  createTimelineTicks,
  defineTimelineTrackProjectionContribution,
  getTimelineGridMetrics,
  getTimelineWheelZoomWindow,
  normalizeTimelineViewWindow,
  projectTimelineSubject,
  reduceTimelineState,
} from '@konitif/timeline';

const metrics = defineTimelineTrackProjectionContribution({
  id: 'example.metrics',
  version: '1.0.0',
  project: subject => subject.metrics,
});

const projection = projectTimelineSubject(subject, {
  getSourceId: value => value.id,
  getDurationSeconds: value => value.durationSeconds,
  trackContributions: [metrics],
});
const initial = createTimelineState(projection);
const next = reduceTimelineState(projection, initial, {
  type: 'seek',
  timeSeconds: 1.25,
});
const viewport = normalizeTimelineViewWindow({
  duration: projection.durationSeconds,
  start: 0,
  end: projection.durationSeconds,
});
const ticks = createTimelineTicks(viewport.start, viewport.end, viewport.zoomX);
const grid = getTimelineGridMetrics({
  ticks,
  visibleRange: viewport,
  fps: 30,
});
const zoomedViewport = getTimelineWheelZoomWindow({
  duration: projection.durationSeconds,
  visibleRange: viewport,
  zoomX: viewport.zoomX,
  clientRatio: 0.5,
  deltaY: -120,
});
```

## Public entry points

| Entry | Purpose |
| --- | --- |
| `@konitif/timeline` | Timeline contracts, explicit track composition, state, scale and viewport projection, intents, reducer and sampling. |

## Reference

See [`reference/`](reference/) for the machine-readable capability catalog and
authority diagram.

## License

Source-available under [PolyForm Noncommercial 1.0.0](LICENSE.md), not OSI open
source. Commercial use requires separate written authorization.
