import type { KonitifClip } from '@konitif/core';
import {
  createTimelineState,
  projectClipToTimeline,
  reduceTimelineState,
  type TimelineProjection,
  type TimelineState,
} from '@konitif/timeline';

declare const clip: KonitifClip;
const projection: TimelineProjection = projectClipToTimeline(clip);
const initial: TimelineState = createTimelineState(projection);
const next: TimelineState = reduceTimelineState(projection, initial, {
  type: 'seek',
  timeSeconds: 1,
});
void next;
