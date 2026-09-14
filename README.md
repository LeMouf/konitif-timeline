# @konitif/timeline

Headless, product-neutral Timeline projection and interaction state over
KONITIF Clip, Track and Key language.

## Installation

```sh
npm install @konitif/timeline
```

## What it provides

- Read-only Timeline projections derived from KONITIF clips.
- Local cursor, visible-range and selection state.
- Explicit intents and a deterministic state reducer.
- Numeric track sampling with KONITIF interpolation rules.
- A product-neutral Timeline tool-module declaration.

## Authority boundary

The package projects clips without owning their identity or semantic revision.
Cursor position, visible range and selection belong to the Timeline surface.
The package contains no Svelte, DOM, application store, clock, robot semantics
or product workflow policy.

## Quick start

```ts
import {
  createTimelineState,
  projectClipToTimeline,
  reduceTimelineState,
} from '@konitif/timeline';

const projection = projectClipToTimeline(clip);
const initial = createTimelineState(projection);
const next = reduceTimelineState(projection, initial, {
  type: 'seek',
  timeSeconds: 1.25,
});
```

## Public entry points

| Entry | Purpose |
| --- | --- |
| `@konitif/timeline` | Timeline projections, state, intents, reducer and sampling. |

## Reference

See [`reference/`](reference/) for the machine-readable capability catalog and
authority diagram.

## License

Source-available under [PolyForm Noncommercial 1.0.0](LICENSE.md), not OSI open
source. Commercial use requires separate written authorization.
