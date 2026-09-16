import {
  createTimelineState,
  createTimelineTicks,
  defineTimelineTrackProjectionContribution,
  getTimelineGridMetrics,
  getTimelineWheelZoomWindow,
  normalizeTimelineViewWindow,
  projectTimelineSubject,
  reduceTimelineState,
  type TimelineProjection,
  type TimelineState,
  type TimelineViewWindow,
} from '@konitif/timeline';

const metrics = defineTimelineTrackProjectionContribution<{
  id: string;
  durationSeconds: number;
}>({
  id: 'consumer.metrics',
  version: '1.0.0',
  project: () => [],
});
const projection: TimelineProjection = projectTimelineSubject({ id: 'subject', durationSeconds: 2 }, {
  getSourceId: subject => subject.id,
  getDurationSeconds: subject => subject.durationSeconds,
  trackContributions: [metrics],
});
const initial: TimelineState = createTimelineState(projection);
const next: TimelineState = reduceTimelineState(projection, initial, {
  type: 'seek',
  timeSeconds: 1,
});
const viewport: TimelineViewWindow = normalizeTimelineViewWindow({
  duration: projection.durationSeconds,
  start: 0,
  end: projection.durationSeconds,
});
const ticks = createTimelineTicks(viewport.start, viewport.end, viewport.zoomX);
const grid = getTimelineGridMetrics({ ticks, visibleRange: viewport, fps: 30 });
const zoomedViewport: TimelineViewWindow = getTimelineWheelZoomWindow({
  duration: projection.durationSeconds,
  visibleRange: viewport,
  zoomX: viewport.zoomX,
  clientRatio: 0.5,
  deltaY: -120,
});
void [next, viewport, ticks, grid, zoomedViewport];
